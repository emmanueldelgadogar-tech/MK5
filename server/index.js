const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ===================== HEALTH =====================
app.get("/api/health", async (req, res) => {
  const r = await pool.query("SELECT now() as ok");
  res.json({ ok: true, time: r.rows[0].ok });
});

// ===================== FILTROS (viejo: marca + medida) =====================
// (lo dejo por compatibilidad si lo sigues usando en algún lado)
app.get("/api/catalogo/filtros", async (req, res) => {
  const q = `
    SELECT
      (SELECT json_agg(marca ORDER BY marca)
       FROM (SELECT DISTINCT marca FROM catalogo WHERE stock > 0) m) AS marcas,
      (SELECT json_agg(medida ORDER BY medida)
       FROM (SELECT DISTINCT medida FROM catalogo WHERE stock > 0) d) AS medidas;
  `;
  const r = await pool.query(q);
  res.json(r.rows[0]);
});

// ===================== FILTROS MEDIDA (HOME: ancho/alto/rin dependientes) =====================
app.get("/api/catalogo/filtros-medida", async (req, res) => {
  const ancho = req.query.ancho || null;
  const altura = req.query.altura || null;
  const rin = req.query.rin || null;

  const sql = `
    WITH base AS (
      SELECT
        substring(medida from '^([0-9]{3})') as ancho,
        substring(medida from '^[0-9]{3}/([0-9]{2})') as altura,
        substring(medida from 'R([0-9]{2})$') as rin
      FROM catalogo
      WHERE stock > 0
        AND medida ~ '^[0-9]{3}/[0-9]{2}R[0-9]{2}$'
    )
    SELECT
      (SELECT json_agg(x ORDER BY x)
       FROM (SELECT DISTINCT ancho AS x FROM base) s) AS anchos,

      (SELECT json_agg(x ORDER BY x)
       FROM (
         SELECT DISTINCT altura AS x
         FROM base
         WHERE ($1::text IS NULL OR ancho = $1::text)
           AND ($3::text IS NULL OR rin = $3::text)
       ) s) AS alturas,

      (SELECT json_agg(x ORDER BY x)
       FROM (
         SELECT DISTINCT rin AS x
         FROM base
         WHERE ($1::text IS NULL OR ancho = $1::text)
           AND ($2::text IS NULL OR altura = $2::text)
       ) s) AS rines
    ;
  `;

  const r = await pool.query(sql, [ancho, altura, rin]);
  res.json(r.rows[0]);
});

// ===================== FILTROS CATALOGO (marca/ancho/alto/rin, dependientes) =====================
app.get("/api/catalogo/filtros-catalogo", async (req, res) => {
  const marca = req.query.marca || null;
  const ancho = req.query.ancho || null;
  const altura = req.query.altura || null;
  const rin = req.query.rin || null;

  const sql = `
    WITH base AS (
      SELECT
        marca,
        substring(medida from '^([0-9]{3})') as ancho,
        substring(medida from '^[0-9]{3}/([0-9]{2})') as altura,
        substring(medida from 'R([0-9]{2})$') as rin
      FROM catalogo
      WHERE stock > 0
        AND medida ~ '^[0-9]{3}/[0-9]{2}R[0-9]{2}$'
    )
    SELECT
      (SELECT json_agg(x ORDER BY x)
       FROM (
         SELECT DISTINCT marca AS x
         FROM base
         WHERE ($2::text IS NULL OR ancho = $2::text)
           AND ($3::text IS NULL OR altura = $3::text)
           AND ($4::text IS NULL OR rin = $4::text)
       ) s) AS marcas,

      (SELECT json_agg(x ORDER BY x)
       FROM (
         SELECT DISTINCT ancho AS x
         FROM base
         WHERE ($1::text IS NULL OR marca = $1::text)
           AND ($3::text IS NULL OR altura = $3::text)
           AND ($4::text IS NULL OR rin = $4::text)
       ) s) AS anchos,

      (SELECT json_agg(x ORDER BY x)
       FROM (
         SELECT DISTINCT altura AS x
         FROM base
         WHERE ($1::text IS NULL OR marca = $1::text)
           AND ($2::text IS NULL OR ancho = $2::text)
           AND ($4::text IS NULL OR rin = $4::text)
       ) s) AS alturas,

      (SELECT json_agg(x ORDER BY x)
       FROM (
         SELECT DISTINCT rin AS x
         FROM base
         WHERE ($1::text IS NULL OR marca = $1::text)
           AND ($2::text IS NULL OR ancho = $2::text)
           AND ($3::text IS NULL OR altura = $3::text)
       ) s) AS rines
  `;

  const r = await pool.query(sql, [marca, ancho, altura, rin]);
  res.json(r.rows[0]);
});

// ===================== CATALOGO ITEMS (NUEVO: filtros + sort + paginado max 12) =====================
app.get("/api/catalogo/items", async (req, res) => {
  try {
    const {
      q = "",
      marcas = "", // "PIRELLI,MICHELIN"
      anchos = "", // "205,215"
      altos = "",  // "55,60"
      rines = "",  // "16,17"
      sort = "price_asc", // price_asc | price_desc
      page = "1",
      limit = "12",
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitParsed = parseInt(limit, 10) || 12;
    const limitNum = Math.min(Math.max(limitParsed, 1), 12); // 👈 nunca más de 12
    const offset = (pageNum - 1) * limitNum;

    const toArr = (v) =>
      String(v)
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

    const marcasArr = toArr(marcas).map((m) => m.toUpperCase());
    const anchosArr = toArr(anchos);
    const altosArr = toArr(altos);
    const rinesArr = toArr(rines);

    const where = ["stock > 0"];
    const params = [];

    // 🔍 búsqueda general (1 solo $n para las 3 columnas)
    const qTrim = q.trim();
    if (qTrim) {
      params.push(`%${qTrim.toUpperCase()}%`);
      const p = `$${params.length}`;
      where.push(`(
        UPPER(marca)  LIKE ${p}
        OR UPPER(modelo) LIKE ${p}
        OR UPPER(medida) LIKE ${p}
      )`);
    }

    // ✅ marcas (ANY)
    if (marcasArr.length) {
      params.push(marcasArr);
      where.push(`UPPER(marca) = ANY($${params.length})`);
    }

    // ✅ ancho / alto / rin por regex (con OR dentro del mismo regex)
    // ancho: empieza con 3 dígitos: ^(205|215)/
    if (anchosArr.length) {
      params.push(`^(${anchosArr.join("|")})/`);
      where.push(`medida ~ $${params.length}`);
    }

    // alto: /55R  =>  /(${altos})R
    if (altosArr.length) {
      params.push(`/(${altosArr.join("|")})R`);
      where.push(`medida ~ $${params.length}`);
    }

    // rin: R16 al final => R(${rines})$
    if (rinesArr.length) {
      params.push(`R(${rinesArr.join("|")})$`);
      where.push(`medida ~ $${params.length}`);
    }

    const orderBy = sort === "price_desc" ? "precio DESC NULLS LAST" : "precio ASC NULLS LAST";
    const whereSql = `WHERE ${where.join(" AND ")}`;

    // total
    const totalQ = `
      SELECT COUNT(*)::int AS total
      FROM catalogo
      ${whereSql}
    `;
    const totalR = await pool.query(totalQ, params);
    const total = totalR.rows[0]?.total || 0;

    // items (máx 12)
    const paramsItems = [...params, limitNum, offset];

    const itemsQ = `
      SELECT sku, marca, modelo, medida, precio, stock
      FROM catalogo
      ${whereSql}
      ORDER BY ${orderBy}, marca, modelo
      LIMIT $${paramsItems.length - 1}
      OFFSET $${paramsItems.length}
    `;
    const itemsR = await pool.query(itemsQ, paramsItems);

    res.json({
      ok: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      items: itemsR.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

// ===================== CATALOGO (viejo: marca+medida exactos) =====================
// (si ya migras el front a /api/catalogo/items, puedes borrar este endpoint)
app.get("/api/catalogo", async (req, res) => {
  const { marca = "", medida = "" } = req.query;

  const sql = `
    SELECT sku, marca, modelo, medida, precio, stock
    FROM catalogo
    WHERE stock > 0
      AND ($1 = '' OR marca = $1)
      AND ($2 = '' OR medida = $2)
    ORDER BY marca, modelo
    LIMIT 200;
  `;

  const r = await pool.query(sql, [marca, medida]);
  res.json(r.rows);
});

// ===================== LISTEN =====================
app.listen(process.env.PORT || 4000, () => {
  console.log(
    "✅ Backend activo en http://localhost:" + (process.env.PORT || 4000)
  );
});
