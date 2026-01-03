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

app.get("/api/health", async (req, res) => {
  const r = await pool.query("SELECT now() as ok");
  res.json({ ok: true, time: r.rows[0].ok });
});

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

app.listen(process.env.PORT || 4000, () => {
  console.log("✅ Backend activo en http://localhost:" + (process.env.PORT || 4000));
});
