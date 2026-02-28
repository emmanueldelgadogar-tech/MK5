"use strict";

/**
 * fetchTireImages.js
 * Busca imagenes de llantas (vista de perfil con rin) usando SerpAPI -> Google Images.
 * Guarda hasta 3 fotos por llanta en la columna `imagenes` (JSON array).
 *
 * Uso:
 *   node server/scripts/fetchTireImages.js              -> todos los productos sin imagen
 *   node server/scripts/fetchTireImages.js --limit 10   -> solo los primeros 10 (prueba)
 *   node server/scripts/fetchTireImages.js --reset      -> reprocesa los ya existentes
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { Pool } = require("pg");
const axios = require("axios");

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const DELAY_MS = 300;
const SERPAPI_TIMEOUT_MS = Number(process.env.SERPAPI_TIMEOUT_MS || 25000);
const SERPAPI_RETRIES = Number(process.env.SERPAPI_RETRIES || 2);
const SERPAPI_RETRY_BACKOFF_MS = Number(process.env.SERPAPI_RETRY_BACKOFF_MS || 1000);
const EXCLUSION_TERMS = ["-calcomania", "-sticker", "-vector", "-logo"].join(" ");
const PREFERRED_DOMAINS = ["mercadolibre.com.mx", "amazon.com.mx", "walmart.com.mx"];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg !== -1 ? parseInt(process.argv[limitArg + 1], 10) : null;
const RESET = process.argv.includes("--reset");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function searchImages(marca, modelo, medida) {
  const marcaUpper = String(marca || "").trim().toUpperCase();
  const modeloText = String(modelo || "").trim();
  const medidaText = String(medida || "").trim();
  const modelQuoted = modeloText ? `"${modeloText}"` : "";

  const baseTerms = `llanta ${marcaUpper} ${modelQuoted} ${medidaText} ${EXCLUSION_TERMS}`
    .replace(/\s+/g, " ")
    .trim();

  // Estrategia principal: forzar MercadoLibre via site: para obtener imagenes tipo ficha.
  const strictQuery = `site:mercadolibre.com.mx ${baseTerms}`;
  let strictResults = [];
  try {
    strictResults = await runImageSearch(strictQuery, 20);
  } catch (err) {
    console.warn(`  [WARN] strict query fallo (${marcaUpper} ${modeloText} ${medidaText}): ${err.message}`);
  }
  const strictCandidates = normalizeAndFilterResults(strictResults, marcaUpper);
  if (strictCandidates.length >= 3) {
    return strictCandidates.slice(0, 3).map((c) => c.url);
  }

  // Fallback: ampliar busqueda, mantener filtro de marca y ranking de dominio.
  let genericResults = [];
  try {
    genericResults = await runImageSearch(baseTerms, 30);
  } catch (err) {
    console.warn(`  [WARN] fallback query fallo (${marcaUpper} ${modeloText} ${medidaText}): ${err.message}`);
  }
  const genericCandidates = normalizeAndFilterResults(genericResults, marcaUpper);
  const merged = dedupeByUrl([...strictCandidates, ...genericCandidates]);
  return merged.slice(0, 3).map((c) => c.url);
}

async function runImageSearch(q, num = 20) {
  let attempt = 0;

  while (attempt <= SERPAPI_RETRIES) {
    try {
      const resp = await axios.get("https://serpapi.com/search.json", {
        params: {
          engine: "google_images",
          q,
          api_key: SERPAPI_KEY,
          num,
          tbs: "itp:photo",
        },
        timeout: SERPAPI_TIMEOUT_MS,
      });

      return resp.data.images_results || [];
    } catch (err) {
      const status = err?.response?.status;
      const isTimeout = err?.code === "ECONNABORTED";
      const isRetriable = isTimeout || status === 429 || (status >= 500 && status < 600);
      const hasMoreAttempts = attempt < SERPAPI_RETRIES;

      if (!isRetriable || !hasMoreAttempts) {
        throw err;
      }

      const waitMs = SERPAPI_RETRY_BACKOFF_MS * (attempt + 1);
      await sleep(waitMs);
      attempt += 1;
    }
  }

  return [];
}

function normalizeAndFilterResults(results, marcaUpper) {
  const candidates = [];

  for (const r of results) {
    const url = r?.original;
    if (!url) continue;

    const title = String(r?.title || "");
    const snippet = String(r?.snippet || "");
    const brandedText = `${title} ${snippet}`.toUpperCase();

    // Regla clave: no aceptar resultados que no contengan la marca.
    if (marcaUpper && !brandedText.includes(marcaUpper)) continue;

    const domain = extractDomain(r?.link || r?.source || url);
    const domainScore = rankDomain(domain);
    const qualityScore = /\.(jpe?g|png)(\?|$)/i.test(url) ? 0 : 1;

    candidates.push({ url, domainScore, qualityScore });
  }

  return dedupeByUrl(
    candidates.sort((a, b) => {
      if (a.domainScore !== b.domainScore) return a.domainScore - b.domainScore;
      return a.qualityScore - b.qualityScore;
    })
  );
}

function rankDomain(domain) {
  if (!domain) return 100;

  const preferredIndex = PREFERRED_DOMAINS.findIndex((d) => domain.endsWith(d));
  if (preferredIndex !== -1) return preferredIndex;

  // Dominio de marca/oficial o tienda especializada.
  if (domain.includes("llantas") || domain.includes("tires") || domain.includes("neumaticos")) {
    return 10;
  }

  return 50;
}

function extractDomain(urlOrHost) {
  if (!urlOrHost) return "";

  try {
    const parsed = new URL(urlOrHost.startsWith("http") ? urlOrHost : `https://${urlOrHost}`);
    return parsed.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return String(urlOrHost).replace(/^www\./i, "").toLowerCase();
  }
}

function dedupeByUrl(items) {
  const seen = new Set();
  const out = [];

  for (const item of items) {
    if (!item?.url || seen.has(item.url)) continue;
    seen.add(item.url);
    out.push(item);
  }

  return out;
}

async function main() {
  if (!SERPAPI_KEY || SERPAPI_KEY === "PEGA_TU_CLAVE_AQUI") {
    console.error("\nFalta SERPAPI_KEY en server/.env\n");
    process.exit(1);
  }

  await pool.query(`ALTER TABLE catalogo ADD COLUMN IF NOT EXISTS imagen TEXT`);
  await pool.query(`ALTER TABLE catalogo ADD COLUMN IF NOT EXISTS imagenes TEXT`);

  const whereClause = RESET ? "" : `WHERE imagen IS NULL OR imagen = ''`;

  const { rows: allRows } = await pool.query(
    `SELECT sku, marca, modelo, medida FROM catalogo ${whereClause} ORDER BY marca, modelo`
  );

  if (allRows.length === 0) {
    console.log("\nTodos los productos ya tienen imagen. Usa --reset para reprocesar.\n");
    await pool.end();
    return;
  }

  const rows = LIMIT ? allRows.slice(0, LIMIT) : allRows;
  const modoStr = LIMIT ? ` (modo prueba: primeros ${LIMIT})` : "";
  const resetStr = RESET ? " [--reset]" : "";
  console.log(`\nBuscando imagenes para ${rows.length} productos${modoStr}${resetStr}...\n`);

  let ok = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const urls = await searchImages(row.marca, row.modelo, row.medida);

      if (!urls || urls.length === 0) {
        console.log(`  [SIN RESULTADO]  ${row.sku}`);
        failed++;
        await sleep(DELAY_MS);
        continue;
      }

      await pool.query(
        `UPDATE catalogo SET imagen = $1, imagenes = $2 WHERE sku = $3`,
        [urls[0], JSON.stringify(urls), row.sku]
      );

      console.log(`  [OK] ${urls.length} fotos -> ${row.sku}`);
      ok++;
    } catch (err) {
      console.error(`  [ERROR] ${row.sku} -> ${err.message}`);
      failed++;
    }

    await sleep(DELAY_MS);
  }

  console.log("\n----------------------------------");
  console.log(`Procesados: ${ok}`);
  console.log(`Fallidos:   ${failed}`);
  console.log("----------------------------------\n");

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
