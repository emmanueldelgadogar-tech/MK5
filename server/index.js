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

// helpers
const up = (v) => (v ?? "").toString().trim().toUpperCase();
const asNull = (v) => {
  const s = (v ?? "").toString().trim();
  return s ? s : null;
};

// ===================== HEALTH =====================
app.get("/api/health", async (req, res) => {
  const r = await pool.query("SELECT now() as ok");
  res.json({ ok: true, time: r.rows[0].ok });
});

// ===================== FILTROS (marca + medida) =====================
// ✅ ahora acepta ?marca= (para /catalogo/:marca)
app.get("/api/catalogo/filtros", async (req, res) => {
  try {
    const marca = up(req.query.marca);
    const sql = `
      WITH base AS (
        SELECT * FROM catalogo
        WHERE stock > 0
          AND ($1 = '' OR UPPER(marca) = $1)
      )
      SELECT
        (SELECT json_agg(marca ORDER BY marca)
         FROM (SELECT DISTINCT marca FROM base) m) AS marcas,
        (SELECT json_agg(medida ORDER BY medida)
         FROM (SELECT DISTINCT medida FROM base) d) AS medidas;
    `;
    const r = await pool.query(sql, [marca]);
    res.json(r.rows[0] || { marcas: [], medidas: [] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "filtros_error" });
  }
});

// ===================== FILTROS MEDIDA (HOME: ancho/alto/rin dependientes) =====================
// ✅ opcional: acepta ?marca= para recortar al entrar por marca
app.get("/api/catalogo/filtros-medida", async (req, res) => {
  try {
    const marca = up(req.query.marca); // nuevo
    const ancho = asNull(req.query.ancho);
    const altura = asNull(req.query.altura);
    const rin = asNull(req.query.rin);

    const sql = `
      WITH base AS (
        SELECT
          substring(medida from '^([0-9]{3})') as ancho,
          substring(medida from '^[0-9]{3}/([0-9]{2})') as altura,
          substring(medida from 'R([0-9]{2})$') as rin
        FROM catalogo
        WHERE stock > 0
          AND ($4 = '' OR UPPER(marca) = $4)
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

    const r = await pool.query(sql, [ancho, altura, rin, marca]);
    res.json(r.rows[0] || { anchos: [], alturas: [], rines: [] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "filtros_medida_error" });
  }
});

// ===================== FILTROS CATALOGO (marca/ancho/alto/rin, dependientes) =====================
app.get("/api/catalogo/filtros-catalogo", async (req, res) => {
  try {
    const marca = asNull(up(req.query.marca)); // la tuya ya era buena, solo robusta
    const ancho = asNull(req.query.ancho);
    const altura = asNull(req.query.altura);
    const rin = asNull(req.query.rin);

    const sql = `
      WITH base AS (
        SELECT
          UPPER(marca) AS marca,
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
    res.json(r.rows[0] || { marcas: [], anchos: [], alturas: [], rines: [] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "filtros_catalogo_error" });
  }
});

// ===================== CATALOGO ITEMS (filtros + sort + paginado max 12) =====================
// ✅ agrega soporte: ?marca=PIRELLI (una sola) además de ?marcas=PIRELLI,MICHELIN
app.get("/api/catalogo/items", async (req, res) => {
  try {
    const {
      q = "",
      marca = "",  // ✅ NUEVO: una sola marca
      marcas = "", // lista
      anchos = "",
      altos = "",
      rines = "",
      sort = "price_asc",
      page = "1",
      limit = "12",
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitParsed = parseInt(limit, 10) || 12;
    const limitNum = Math.min(Math.max(limitParsed, 1), 100); 
    const offset = (pageNum - 1) * limitNum;
    const toArr = (v) =>
      String(v)
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

    const marcasArr = [
      ...toArr(marcas).map((m) => up(m)),
      ...(marca ? [up(marca)] : []),
    ].filter(Boolean);

    // dedup
    const marcasUniq = Array.from(new Set(marcasArr));

    const anchosArr = toArr(anchos);
    const altosArr = toArr(altos);
    const rinesArr = toArr(rines);

    const where = ["stock > 0"];
    const params = [];

    const qTrim = q.trim();
    if (qTrim) {
      params.push(`%${up(qTrim)}%`);
      const p = `$${params.length}`;
      where.push(`(
        UPPER(marca)  LIKE ${p}
        OR UPPER(modelo) LIKE ${p}
        OR UPPER(medida) LIKE ${p}
      )`);
    }

    if (marcasUniq.length) {
      params.push(marcasUniq);
      where.push(`UPPER(marca) = ANY($${params.length})`);
    }

    if (anchosArr.length) {
      params.push(`^(${anchosArr.join("|")})/`);
      where.push(`medida ~ $${params.length}`);
    }

    if (altosArr.length) {
      params.push(`/(${altosArr.join("|")})R`);
      where.push(`medida ~ $${params.length}`);
    }

    if (rinesArr.length) {
      params.push(`R(${rinesArr.join("|")})$`);
      where.push(`medida ~ $${params.length}`);
    }

    const orderBy =
      sort === "price_desc" ? "precio DESC NULLS LAST" : "precio ASC NULLS LAST";

    const whereSql = `WHERE ${where.join(" AND ")}`;

    const totalQ = `
      SELECT COUNT(*)::int AS total
      FROM catalogo
      ${whereSql}
    `;
    const totalR = await pool.query(totalQ, params);
    const total = totalR.rows[0]?.total || 0;

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
// ✅ lo hago case-insensitive para que no falle con "pirelli"
app.get("/api/catalogo", async (req, res) => {
  try {
    const marca = up(req.query.marca);
    const medida = (req.query.medida || "").toString().trim();

    const sql = `
      SELECT sku, marca, modelo, medida, precio, stock
      FROM catalogo
      WHERE stock > 0
        AND ($1 = '' OR UPPER(marca) = $1)
        AND ($2 = '' OR medida = $2)
      ORDER BY marca, modelo
      LIMIT 200;
    `;

    const r = await pool.query(sql, [marca, medida]);
    res.json(r.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "catalogo_error" });
  }
});

// ===================== LISTEN =====================
app.listen(process.env.PORT || 4000, () => {
  console.log(
    "✅ Backend activo en http://localhost:" + (process.env.PORT || 4000)
  );
});
