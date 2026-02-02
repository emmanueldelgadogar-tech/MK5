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
const toArr = (v) =>
  String(v ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

const toIntArr = (v) =>
  toArr(v)
    .map((x) => parseInt(x, 10))
    .filter((n) => Number.isFinite(n));

// ===================== HEALTH =====================
app.get("/api/health", async (req, res) => {
  const r = await pool.query("SELECT now() as ok");
  res.json({ ok: true, time: r.rows[0].ok });
});

// ===================== FILTROS (marca + medida) =====================
// ✅ acepta ?marca= (para /catalogo/:marca)
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
// ✅ robusto: soporta medida con R o sin R
app.get("/api/catalogo/filtros-medida", async (req, res) => {
  try {
    const marca = up(req.query.marca);
    const ancho = asNull(req.query.ancho);
    const altura = asNull(req.query.altura);
    const rin = asNull(req.query.rin);

    const sql = `
      WITH base AS (
        SELECT
          NULLIF(substring(medida from '^([0-9]{3})'), '') as ancho,
          NULLIF(substring(medida from '^[0-9]{3}/([0-9]{2})'), '') as altura,
          NULLIF(substring(medida from '(?:R|/)([0-9]{2})$'), '') as rin
        FROM catalogo
        WHERE stock > 0
          AND ($4 = '' OR UPPER(marca) = $4)
          AND medida ~ '^[0-9]{3}/[0-9]{2}(R|/)[0-9]{2}$'
      )
      SELECT
        (SELECT json_agg(x ORDER BY x)
         FROM (SELECT DISTINCT ancho AS x FROM base WHERE ancho IS NOT NULL) s) AS anchos,

        (SELECT json_agg(x ORDER BY x)
         FROM (
           SELECT DISTINCT altura AS x
           FROM base
           WHERE altura IS NOT NULL
             AND ($1::text IS NULL OR ancho = $1::text)
             AND ($3::text IS NULL OR rin = $3::text)
         ) s) AS alturas,

        (SELECT json_agg(x ORDER BY x)
         FROM (
           SELECT DISTINCT rin AS x
           FROM base
           WHERE rin IS NOT NULL
             AND ($1::text IS NULL OR ancho = $1::text)
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

// ===================== CATALOGO ITEMS (filtros + sort + paginado) =====================
// ✅ FIX PRO: filtra por ancho/alto/rin NUMÉRICOS (sirve con 155/50R16 y 155/50/16)
app.get("/api/catalogo/items", async (req, res) => {
  try {
    const {
      q = "",
      marca = "",
      marcas = "",
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

    const marcasArr = [
      ...toArr(marcas).map((m) => up(m)),
      ...(marca ? [up(marca)] : []),
    ].filter(Boolean);
    const marcasUniq = Array.from(new Set(marcasArr));

    const anchosArr = toIntArr(anchos);
    const altosArr = toIntArr(altos);
    const rinesArr = toIntArr(rines);

    // Base + parsing de medida en SQL (soporta R o /)
    const where = [`stock > 0`];
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

    // ✅ Comparación por partes numéricas extraídas
    // ancho_i: primeros 3 dígitos
    // alto_i: después de '/'
    // rin_i: al final, después de 'R' o '/'
    if (anchosArr.length) {
      params.push(anchosArr);
      where.push(`ancho_i = ANY($${params.length}::int[])`);
    }
    if (altosArr.length) {
      params.push(altosArr);
      where.push(`alto_i = ANY($${params.length}::int[])`);
    }
    if (rinesArr.length) {
      params.push(rinesArr);
      where.push(`rin_i = ANY($${params.length}::int[])`);
    }

    const orderBy =
      sort === "price_desc"
        ? "precio DESC NULLS LAST"
        : "precio ASC NULLS LAST";

    const whereSql = `WHERE ${where.join(" AND ")}`;

    const baseCTE = `
      WITH base AS (
        SELECT
          sku, marca, modelo, medida, precio, stock,
          NULLIF(substring(medida from '^([0-9]{3})'), '')::int AS ancho_i,
          NULLIF(substring(medida from '^[0-9]{3}/([0-9]{2})'), '')::int AS alto_i,
          NULLIF(substring(medida from '(?:R|/)([0-9]{2})$'), '')::int AS rin_i
        FROM catalogo
      )
    `;

    const totalQ = `
      ${baseCTE}
      SELECT COUNT(*)::int AS total
      FROM base
      ${whereSql}
    `;
    const totalR = await pool.query(totalQ, params);
    const total = totalR.rows[0]?.total || 0;

    const paramsItems = [...params, limitNum, offset];

    const itemsQ = `
      ${baseCTE}
      SELECT sku, marca, modelo, medida, precio, stock
      FROM base
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
      pages: Math.max(1, Math.ceil(total / limitNum)), // ✅ evita pages=0
      items: itemsR.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

// ===================== CATALOGO (viejo: marca+medida exactos) =====================
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

// ===================== ASSISTANT (V1: sin OpenAI) =====================
app.post("/api/assistant", async (req, res) => {
  try {
    const message = (req.body?.message || "").toString().trim();
    if (!message) {
      return res.status(400).json({ ok: false, error: "message_required" });
    }

    const m = message.toLowerCase();

    // Detecta medida: "155 50 16" | "155/50/16" | "155-50-16" | "155/50R16"
    const match = m.match(/(\d{3})\s*[-\/ ]\s*(\d{2})\s*(?:r|[-\/ ]\s*)\s*(\d{2})/i);
    if (match) {
      const medida = `${match[1]}/${match[2]}/${match[3]}`; // formato que tu front parsea
      return res.json({
        ok: true,
        reply: `Listo ✅ Te llevo al catálogo con la medida ${medida}. ¿Buscas económica o premium?`,
        action: "NAVIGATE",
        path: "/catalogo",
        query: { medida },
      });
    }

    if (m.includes("recom")) {
      return res.json({
        ok: true,
        reply:
          "Para recomendarte bien necesito tu medida (ej: 205/55/16) o el auto (ej: March 2020). 🙂",
        action: "REPLY",
      });
    }

    return res.json({
      ok: true,
      reply: "¿Me dices tu medida? Ejemplo: 155/50/16 🔎 (o dime el auto y año).",
      action: "REPLY",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "assistant_error" });
  }
});

// ===================== LISTEN =====================
app.listen(process.env.PORT || 4000, () => {
  console.log("✅ Backend activo en http://localhost:" + (process.env.PORT || 4000));
});
