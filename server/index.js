const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { Pool } = require("pg");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const OpenAI = require("openai");

const app = express();

// ===================== TRUST PROXY (Render/Vercel/NGINX) =====================
app.set("trust proxy", 1);

// ===================== SECURITY + PARSERS =====================
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ===================== CORS =====================
// ✅ En dev: permite localhost/127.0.0.1 en cualquier puerto (5173, 5174, etc.)
// ✅ En prod: deja tus dominios mk5.com (cuando los descomentes)
const ALLOWED_ORIGINS = [
  // DEV (si quieres forzar solo ciertos puertos, puedes dejarlos aquí)
  "http://localhost:5173",
  "http://127.0.0.1:5173",

  // PROD (descomenta cuando publiques)
  // "https://mk5.com",
  // "https://www.mk5.com",
];

const isDevLocalhost = (origin) =>
  /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true); // curl/postman

    // ✅ Permite cualquier puerto en localhost/127.0.0.1 (Vite cambia puertos)
    if (isDevLocalhost(origin)) return cb(null, true);

    // ✅ Permite los que estén en tu lista (para prod / whitelist)
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);

    return cb(new Error("CORS_BLOCKED"), false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
};

// Preflight
app.options(/.*/, cors(corsOptions));
app.use(cors(corsOptions));

// ===================== RATE LIMIT =====================
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ===================== DB =====================
if (!process.env.DATABASE_URL) {
  console.error("❌ Falta DATABASE_URL en .env");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ===================== HELPERS =====================
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

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

// ===================== HEALTH =====================
app.get("/api/health", async (req, res) => {
  try {
    const r = await pool.query("SELECT now() as ok");
    res.json({ ok: true, time: r.rows[0].ok });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});

// ===================== FILTROS (marca + medida) =====================
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
        (SELECT COALESCE(json_agg(marca ORDER BY marca), '[]'::json)
         FROM (SELECT DISTINCT marca FROM base) m) AS marcas,
        (SELECT COALESCE(json_agg(medida ORDER BY medida), '[]'::json)
         FROM (SELECT DISTINCT medida FROM base) d) AS medidas;
    `;

    const r = await pool.query(sql, [marca]);
    res.json(r.rows[0] || { marcas: [], medidas: [] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "filtros_error" });
  }
});

// ===================== FILTROS MEDIDA (HOME: ancho/alto/rin) =====================
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
        (SELECT COALESCE(json_agg(x ORDER BY x), '[]'::json)
         FROM (SELECT DISTINCT ancho AS x FROM base WHERE ancho IS NOT NULL) s) AS anchos,

        (SELECT COALESCE(json_agg(x ORDER BY x), '[]'::json)
         FROM (
           SELECT DISTINCT altura AS x
           FROM base
           WHERE altura IS NOT NULL
             AND ($1::text IS NULL OR ancho = $1::text)
             AND ($3::text IS NULL OR rin = $3::text)
         ) s) AS alturas,

        (SELECT COALESCE(json_agg(x ORDER BY x), '[]'::json)
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

    const params = [];
    const where = [`base.stock > 0`];

    const qTrim = q.trim();
    if (qTrim) {
      params.push(`%${up(qTrim)}%`);
      const p = `$${params.length}`;
      where.push(`(
        UPPER(base.marca)  LIKE ${p}
        OR UPPER(base.modelo) LIKE ${p}
        OR UPPER(base.medida) LIKE ${p}
      )`);
    }

    if (marcasUniq.length) {
      params.push(marcasUniq);
      where.push(`UPPER(base.marca) = ANY($${params.length})`);
    }

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

    if (anchosArr.length) {
      params.push(anchosArr);
      where.push(`base.ancho_i = ANY($${params.length}::int[])`);
    }
    if (altosArr.length) {
      params.push(altosArr);
      where.push(`base.alto_i = ANY($${params.length}::int[])`);
    }
    if (rinesArr.length) {
      params.push(rinesArr);
      where.push(`base.rin_i = ANY($${params.length}::int[])`);
    }

    const whereSql = `WHERE ${where.join(" AND ")}`;

    const orderBy =
      sort === "price_desc"
        ? "base.precio DESC NULLS LAST"
        : "base.precio ASC NULLS LAST";

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
      pages: Math.max(1, Math.ceil(total / limitNum)),
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

// ===================== ASSISTANT (V2: OpenAI con contexto de catálogo) =====================

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const SYSTEM_PROMPT = `Eres el asistente virtual de MK5 Llantas, una tienda mexicana de llantas (neumáticos).
Tu trabajo es ayudar a los clientes a encontrar la llanta perfecta.

REGLAS:
- Responde SIEMPRE en español mexicano, amigable y profesional.
- Si el cliente da una medida (ej: 205/55/16), busca en el inventario y recomienda opciones.
- Si el cliente da un auto y año (ej: "March 2018"), indica la medida ORIGINAL de fábrica y también MEDIDAS ALTERNATIVAS que le pueden quedar, explicando brevemente el efecto de cada una (ej: "hará el carro un poco más alto", "mejor agarre en curvas pero más firme", "ride más suave", etc.).
- SIEMPRE escribe las medidas en formato XXX/XX/XX (ej: 195/50/15, 205/55/16). El sistema las convertirá automáticamente en links al catálogo.
- Compara opciones: económica vs premium, explica diferencias brevemente.
- Menciona precios en MXN cuando tengas datos del inventario.
- Si hay promoción 4x3 (Continental, Euzkadi, Hankook, Tornel, JK Tyre, Laufenn), menciónala.
- Sé conciso: máximo 3-4 párrafos cortos.
- Usa emojis con moderación (1-2 por respuesta).
- Si no sabes algo, sé honesto y sugiere contactar por WhatsApp.
- NUNCA inventes productos que no estén en el inventario proporcionado.
- Si el inventario está vacío para esa medida, dilo honestamente y sugiere medidas similares.

EJEMPLO DE RESPUESTA PARA UN AUTO:
"Para el Aveo 2015 la medida original es 195/65/15. También le pueden quedar:
- 195/60/15 → el carro quedará un poquito más bajo, mejor manejo en ciudad.
- 205/60/15 → un poco más ancho, mejor agarre pero consumirá un poco más de gasolina.
Cada medida te lleva al catálogo con las opciones disponibles."

MARCAS QUE MANEJAMOS: Pirelli, Bridgestone, Continental, Michelin, Goodyear, Hankook, Firestone, Euzkadi, Antares, Cooper, Blackhawk, Laufenn, Goodrich, Tornel, Pegasus, Vinmax.

PROMOCIÓN 4x3: En Continental, Euzkadi, Hankook, Tornel, JK Tyre y Laufenn, al comprar 4 llantas pagas solo 3 + 10% de descuento adicional.`;

async function getInventoryContext(message) {
  try {
    const m = message.toLowerCase();
    const match = m.match(/(\d{3})\s*[-\/ ]\s*(\d{2})\s*(?:r|[-\/ ]\s*)\s*(\d{2})/i);

    let items = [];

    if (match) {
      const ancho = match[1];
      const alto = match[2];
      const rin = match[3];
      const r = await pool.query(
        `SELECT marca, modelo, medida, precio, stock
         FROM catalogo
         WHERE stock > 0
           AND medida ~ $1
         ORDER BY precio ASC
         LIMIT 15`,
        [`^${ancho}/${alto}(R|/)${rin}$`]
      );
      items = r.rows;
    } else {
      const brandMatch = m.match(/\b(pirelli|bridgestone|continental|michelin|goodyear|hankook|firestone|euzkadi|antares|cooper|blackhawk|laufenn|goodrich|tornel|pegasus|vinmax)\b/i);
      if (brandMatch) {
        const r = await pool.query(
          `SELECT marca, modelo, medida, precio, stock
           FROM catalogo
           WHERE stock > 0
             AND UPPER(marca) = $1
           ORDER BY precio ASC
           LIMIT 15`,
          [brandMatch[1].toUpperCase()]
        );
        items = r.rows;
      }
    }

    if (!items.length) return "";

    let ctx = "\n\nINVENTARIO DISPONIBLE:\n";
    for (const it of items) {
      ctx += `- ${it.marca} ${it.modelo} | Medida: ${it.medida} | $${Number(it.precio).toLocaleString("es-MX")} MXN | Stock: ${it.stock}\n`;
    }
    return ctx;
  } catch (e) {
    console.error("Error fetching inventory:", e.message);
    return "";
  }
}

app.post("/api/assistant", async (req, res) => {
  try {
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const singleMessage = (req.body?.message || "").toString().trim();

    if (!messages.length && !singleMessage) {
      return res.status(400).json({ ok: false, error: "message_required" });
    }

    // Support both single message (from Home) and chat history (from IA page)
    const chatMessages = messages.length
      ? messages
      : [{ role: "user", content: singleMessage }];

    const lastUserMsg = [...chatMessages].reverse().find((m) => m.role === "user")?.content || "";

    if (!openai) {
      // Fallback if no API key: use regex-based logic
      const m = lastUserMsg.toLowerCase();
      const match = m.match(/(\d{3})\s*[-\/ ]\s*(\d{2})\s*(?:r|[-\/ ]\s*)\s*(\d{2})/i);

      if (match) {
        const medida = `${match[1]}/${match[2]}/${match[3]}`;
        return res.json({
          ok: true,
          reply: `Encontré la medida ${medida}. Te recomiendo revisar nuestro catálogo para ver opciones disponibles. ¿Necesitas ayuda con algo más?`,
          action: "REPLY",
        });
      }

      return res.json({
        ok: true,
        reply: "Para darte la mejor recomendación necesito tu medida de llanta (ej: 205/55/16) o tu auto y año. ¿Me lo compartes? 🙂",
        action: "REPLY",
      });
    }

    // Get inventory context based on the last user message
    const inventoryCtx = await getInventoryContext(lastUserMsg);

    const systemMsg = SYSTEM_PROMPT + inventoryCtx;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMsg },
        ...chatMessages.slice(-10), // Keep last 10 messages for context
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    const reply = completion.choices?.[0]?.message?.content || "Hubo un problema generando la respuesta. Intenta de nuevo.";

    return res.json({
      ok: true,
      reply,
      action: "REPLY",
    });
  } catch (e) {
    console.error("Assistant error:", e.message);
    res.status(500).json({ ok: false, error: "assistant_error" });
  }
});

// ===================== CHECKOUT (MVP REAL) =====================
const PROMO_4X3_BRANDS = new Set([
  "CONTINENTAL",
  "EUZKADI",
  "HANKOOK",
  "TORNEL",
  "JK TYRE",
  "LAUFENN",
]);

function calcLineTotals({ marca, unitPrice, qty, stock }) {
  const price = Number(unitPrice);
  const q = Number(qty);

  const normalSubtotal = price * q;
  const normalTotal = normalSubtotal * 0.9;

  let promoTotal = normalTotal;
  const brandUp = up(marca);

  if (PROMO_4X3_BRANDS.has(brandUp) && q >= 4 && Number(stock) >= 4) {
    const payUnits = q - Math.floor(q / 4);
    const promoSubtotal = price * payUnits;
    promoTotal = promoSubtotal * 0.9;
  }

  const bestTotal = Math.min(normalTotal, promoTotal);

  return {
    line_total: round2(bestTotal),
    line_discount: round2(normalSubtotal - bestTotal),
  };
}

app.post("/api/checkout/create", async (req, res) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const customer = req.body?.customer || {};

    if (!items.length)
      return res.status(400).json({ ok: false, error: "items_required" });

    const mapQty = new Map();
    for (const it of items) {
      const sku = String(it.sku || "").trim();
      const qty = Math.max(parseInt(it.qty, 10) || 0, 0);
      if (!sku || qty <= 0) continue;
      mapQty.set(sku, (mapQty.get(sku) || 0) + qty);
    }

    const clean = Array.from(mapQty.entries()).map(([sku, qty]) => ({ sku, qty }));
    if (!clean.length)
      return res.status(400).json({ ok: false, error: "invalid_items" });

    const skus = clean.map((x) => x.sku);

    const r = await pool.query(
      `SELECT sku, marca, modelo, medida, precio, stock
       FROM catalogo
       WHERE sku = ANY($1::text[])`,
      [skus]
    );

    const catMap = new Map(r.rows.map((row) => [row.sku, row]));

    const lines = [];
    for (const it of clean) {
      const row = catMap.get(it.sku);
      if (!row)
        return res
          .status(404)
          .json({ ok: false, error: "sku_not_found", sku: it.sku });

      if (Number(row.stock) < it.qty) {
        return res.status(409).json({
          ok: false,
          error: "insufficient_stock",
          sku: it.sku,
          stock: row.stock,
          requested: it.qty,
        });
      }

      const { line_total, line_discount } = calcLineTotals({
        marca: row.marca,
        unitPrice: row.precio,
        qty: it.qty,
        stock: row.stock,
      });

      lines.push({
        sku: row.sku,
        marca: row.marca,
        modelo: row.modelo,
        medida: row.medida,
        qty: it.qty,
        unit_price: Number(row.precio),
        line_total,
        line_discount,
      });
    }

    const subtotal = round2(lines.reduce((s, l) => s + l.unit_price * l.qty, 0));
    const total = round2(lines.reduce((s, l) => s + l.line_total, 0));
    const discount = round2(subtotal - total);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const o = await client.query(
        `INSERT INTO orders (customer_name, customer_phone, customer_email, subtotal, discount, total)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING id, status, created_at`,
        [
          asNull(customer.name),
          asNull(customer.phone),
          asNull(customer.email),
          subtotal,
          discount,
          total,
        ]
      );

      const orderId = o.rows[0].id;

      for (const l of lines) {
        await client.query(
          `INSERT INTO order_items (order_id, sku, marca, modelo, medida, qty, unit_price, line_total)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            orderId,
            l.sku,
            l.marca,
            l.modelo,
            l.medida,
            l.qty,
            l.unit_price,
            l.line_total,
          ]
        );
      }

      await client.query("COMMIT");

      return res.json({
        ok: true,
        order: {
          id: orderId,
          status: o.rows[0].status,
          created_at: o.rows[0].created_at,
          subtotal,
          discount,
          total,
          currency: "MXN",
          items: lines,
        },
      });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "checkout_error" });
  }
});

// ===================== 404 API =====================
app.use("/api", (req, res) => {
  res.status(404).json({ ok: false, error: "not_found" });
});

// ===================== ERROR HANDLER =====================
app.use((err, req, res, next) => {
  if (err && err.message === "CORS_BLOCKED") {
    return res.status(403).json({ ok: false, error: "cors_blocked" });
  }
  console.error(err);
  res.status(500).json({ ok: false, error: "unhandled_error" });
});

// ===================== LISTEN =====================
const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => {
  console.log("✅ Backend activo en http://localhost:" + PORT);
});
