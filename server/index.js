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

// ===================== ASSISTANT (V2: con OpenAI) =====================
const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `Eres el asistente de llantas de MK5, una tienda en línea de llantas en México.
Tu trabajo es ayudar a los clientes a encontrar la medida de llanta correcta para su vehículo.

REGLAS:
1. Cuando el usuario mencione un vehículo (marca, modelo y año), responde con la medida de llanta que usa ese vehículo.
2. Siempre usa el formato de medida: ANCHO/ALTOR_RIN (ejemplo: 195/65R15).
3. Si un vehículo puede usar más de una medida, menciona todas las opciones.
4. Si no estás seguro de la medida exacta, indica las medidas más comunes para ese tipo de vehículo y aclara que el cliente debe verificar en la puerta del conductor o en el manual.
5. Sé amable, breve y directo. Responde en español.
6. Si el usuario ya te da una medida directa (ej: "195/65R15"), confírmala y ofrece buscar en el catálogo.
7. Siempre que menciones una medida, escríbela EXACTAMENTE en formato NNN/NNRNN (ej: 195/65R15) para que el sistema la detecte.
8. IMPORTANTE: Las medidas disponibles en nuestro catálogo son las siguientes (solo recomienda medidas que tengamos):
{MEDIDAS_DISPONIBLES}

Si la medida que necesita el vehículo NO está en la lista, dile al cliente que actualmente no la tenemos en stock y sugiérele contactarnos por WhatsApp para pedido especial.

Responde SOLO con texto plano, sin markdown, sin asteriscos, sin negritas.`;

// Cache de medidas (se refresca cada 5 min)
let medidasCache = [];
let medidasCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function getMedidasDisponibles() {
  const now = Date.now();
  if (medidasCache.length && now - medidasCacheTime < CACHE_TTL) {
    return medidasCache;
  }
  try {
    const r = await pool.query(
      "SELECT DISTINCT medida FROM catalogo WHERE stock > 0 ORDER BY medida"
    );
    medidasCache = r.rows.map((row) => row.medida);
    medidasCacheTime = now;
  } catch (e) {
    console.error("Error cargando medidas:", e.message);
  }
  return medidasCache;
}

app.post("/api/assistant", async (req, res) => {
  try {
    const message = (req.body?.message || "").toString().trim();
    const history = req.body?.history || [];

    if (!message) {
      return res.status(400).json({ ok: false, error: "message_required" });
    }

    // Obtener medidas disponibles del catálogo
    const medidas = await getMedidasDisponibles();
    const systemPrompt = SYSTEM_PROMPT.replace(
      "{MEDIDAS_DISPONIBLES}",
      medidas.join(", ") || "No se pudieron cargar las medidas."
    );

    // Construir mensajes para OpenAI (incluye historial)
    const messages = [{ role: "system", content: systemPrompt }];

    // Agregar historial de conversación (máximo 10 mensajes previos)
    const recentHistory = history.slice(-10);
    for (const msg of recentHistory) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Agregar el mensaje actual
    messages.push({ role: "user", content: message });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || "";

    // Extraer medidas mencionadas en la respuesta (formato NNN/NNRNN)
    const medidasMencionadas = [];
    const regex = /(\d{3}\/\d{2}R\d{2})/gi;
    let match;
    while ((match = regex.exec(reply)) !== null) {
      medidasMencionadas.push(match[1]);
    }

    // Generar links al catálogo para cada medida mencionada
    const catalogLinks = medidasMencionadas.map((m) => ({
      medida: m,
      url: `/catalogo?medida=${encodeURIComponent(m)}`,
    }));

    return res.json({
      ok: true,
      reply,
      medidas: medidasMencionadas,
      catalogLinks,
      action: medidasMencionadas.length ? "REPLY_WITH_LINKS" : "REPLY",
    });
  } catch (e) {
    console.error("Assistant error:", e);

    // Fallback si OpenAI falla
    if (e?.status === 401 || e?.code === "invalid_api_key") {
      return res.status(500).json({
        ok: false,
        error: "api_key_invalid",
        reply: "El asistente no está configurado. Contacta al administrador.",
      });
    }

    return res.status(500).json({
      ok: false,
      error: "assistant_error",
      reply: "Hubo un problema con el asistente. Intenta de nuevo en un momento.",
    });
  }
});

// ===================== LISTEN =====================
app.listen(process.env.PORT || 4000, () => {
  console.log("✅ Backend activo en http://localhost:" + (process.env.PORT || 4000));
});
