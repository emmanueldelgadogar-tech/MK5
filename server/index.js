const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { Pool } = require("pg");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const OpenAI = require("openai");
const crypto = require("crypto");

const app = express();

// ===================== TRUST PROXY (Render/Vercel/NGINX) =====================
app.set("trust proxy", 1);

// ===================== SECURITY + PARSERS =====================
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

if (String(process.env.ENFORCE_SSL || "").toLowerCase() === "true") {
  app.use((req, res, next) => {
    const xfProto = String(req.headers["x-forwarded-proto"] || "").toLowerCase();
    if (xfProto === "https" || req.secure) return next();
    const host = req.headers.host;
    if (!host) return next();
    return res.redirect(301, `https://${host}${req.originalUrl}`);
  });
}

// ===================== CORS =====================
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const isDevLocalhost = (origin) =>
  /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (isDevLocalhost(origin)) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error("CORS_BLOCKED"), false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
};

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
  console.error("Falta DATABASE_URL en .env");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function ensureAnalyticsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id BIGSERIAL PRIMARY KEY,
      event_name TEXT NOT NULL,
      session_id TEXT,
      sku TEXT,
      qty INT,
      amount NUMERIC(12,2),
      page TEXT,
      source TEXT,
      meta JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events (created_at DESC);`
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events (event_name);`
  );
}

async function ensureOrderPaymentsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_payments (
      id BIGSERIAL PRIMARY KEY,
      order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      method TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      reference TEXT,
      provider_url TEXT,
      provider_payment_id TEXT,
      provider_status TEXT,
      meta JSONB,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`ALTER TABLE order_payments ADD COLUMN IF NOT EXISTS provider_payment_id TEXT;`);
  await pool.query(`ALTER TABLE order_payments ADD COLUMN IF NOT EXISTS provider_status TEXT;`);
  await pool.query(`ALTER TABLE order_payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();`);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_order_payments_order_id ON order_payments (order_id);`
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_order_payments_provider_payment_id ON order_payments (provider_payment_id);`
  );
}

async function ensurePaymentWebhookTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_webhook_events (
      id BIGSERIAL PRIMARY KEY,
      provider TEXT NOT NULL,
      provider_event_id TEXT NOT NULL,
      topic TEXT,
      payload JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (provider, provider_event_id)
    );
  `);
}

async function ensureCustomersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id BIGSERIAL PRIMARY KEY,
      name TEXT,
      phone TEXT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, fullHash) {
  const [salt, hash] = String(fullHash || "").split(":");
  if (!salt || !hash) return false;
  const check = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(check, "hex"));
}

// ===================== HELPERS =====================
const requireAdmin = (req, res, next) => {
  const reqKey = req.headers["x-admin-key"] || req.query.key || req.query.admin_key;
  if (process.env.NODE_ENV === "production" || process.env.ADMIN_API_KEY) {
    if (!reqKey || reqKey !== process.env.ADMIN_API_KEY) {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }
  }
  next();
};

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
          NULLIF(substring(medida from '^[0-9]{3}-([0-9]{2})'), '') as altura,
          NULLIF(substring(medida from '^[0-9]{3}-[0-9]{2}-([0-9]{2,3})'), '') as rin
        FROM catalogo
        WHERE stock > 0
          AND ($4 = '' OR UPPER(marca) = $4)
          AND medida ~ '^[0-9]{3}-[0-9]{2}-[0-9]{2}'
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
      medida = "",
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

    // Normaliza medida a formato BD: 245/35R20 → 245-35-20
    const medidaNorm = medida.trim()
      ? medida.trim().replace(/\//g, "-").replace(/[Rr]([0-9])/g, "-$1").replace(/-+/g, "-").replace(/-$/, "")
      : "";

    const params = [];
    const where = [`base.stock > 0`];

    const qTrim = q.trim();
    if (qTrim) {
      params.push(`%${up(qTrim)}%`);
      const p = `$${params.length}`;
      where.push(`(
        UPPER(base.sku) LIKE ${p}
        OR
        UPPER(base.marca)  LIKE ${p}
        OR UPPER(base.modelo) LIKE ${p}
        OR UPPER(base.medida) LIKE ${p}
      )`);
    }

    if (marcasUniq.length) {
      params.push(marcasUniq);
      where.push(`UPPER(base.marca) = ANY($${params.length})`);
    }

    if (medidaNorm) {
      params.push(`${medidaNorm}%`);
      where.push(`UPPER(base.medida) LIKE UPPER($${params.length})`);
    }

    const baseCTE = `
      WITH base AS (
        SELECT
          sku, marca, modelo, medida, precio, stock, imagen,
          NULLIF(substring(medida from '^([0-9]{3})'), '')::int AS ancho_i,
          NULLIF(substring(medida from '^[0-9]{3}-([0-9]{2})'), '')::int AS alto_i,
          NULLIF(substring(medida from '^[0-9]{3}-[0-9]{2}-([0-9]{2,3})'), '')::int AS rin_i
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
      SELECT sku, marca, modelo, medida, precio, stock, imagen
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

// ===================== ITEM POR SKU =====================
app.get("/api/catalogo/item", async (req, res) => {
  try {
    const sku = String(req.query.sku || "").trim();
    if (!sku) return res.status(400).json({ ok: false, error: "sku_required" });

    const r = await pool.query(
      `SELECT sku, marca, modelo, medida, precio, stock, imagen
       FROM catalogo
       WHERE stock > 0 AND sku = $1
       LIMIT 1`,
      [sku]
    );

    const item = r.rows[0] || null;
    if (!item) return res.status(404).json({ ok: false, error: "sku_not_found" });
    res.json({ ok: true, item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

// Backward-compatible route (evitar usar para SKU con "/")
app.get("/api/catalogo/item/:sku", async (req, res) => {
  try {
    const sku = String(req.params.sku || "").trim();
    if (!sku) return res.status(400).json({ ok: false, error: "sku_required" });

    const r = await pool.query(
      `SELECT sku, marca, modelo, medida, precio, stock, imagen
       FROM catalogo
       WHERE stock > 0 AND sku = $1
       LIMIT 1`,
      [sku]
    );

    const item = r.rows[0] || null;
    if (!item) return res.status(404).json({ ok: false, error: "sku_not_found" });
    res.json({ ok: true, item });
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

// ===================== METRICAS =====================
app.post("/api/metrics/track", async (req, res) => {
  try {
    const eventName = String(req.body?.event_name || "").trim().toLowerCase();
    if (!eventName) return res.status(400).json({ ok: false, error: "event_required" });

    const sessionId = asNull(req.body?.session_id);
    const sku = asNull(req.body?.sku);
    const qty = Number.isFinite(Number(req.body?.qty)) ? Math.max(parseInt(req.body.qty, 10), 0) : null;
    const amount = Number.isFinite(Number(req.body?.amount)) ? Number(req.body.amount) : null;
    const page = asNull(req.body?.page);
    const source = asNull(req.body?.source);
    const meta = req.body?.meta && typeof req.body.meta === "object" ? req.body.meta : null;

    await pool.query(
      `INSERT INTO analytics_events (event_name, session_id, sku, qty, amount, page, source, meta)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [eventName, sessionId, sku, qty, amount, page, source, meta]
    );

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "metrics_track_error" });
  }
});

app.get("/api/metrics/overview", async (req, res) => {
  try {
    const daysRaw = parseInt(req.query.days, 10);
    const days = Number.isFinite(daysRaw) ? Math.min(Math.max(daysRaw, 1), 90) : 7;

    const totalsQ = `
      SELECT
        COALESCE(COUNT(*) FILTER (WHERE event_name='product_view'), 0)::int AS product_views,
        COALESCE(COUNT(*) FILTER (WHERE event_name='add_to_cart'), 0)::int AS add_to_cart,
        COALESCE(COUNT(*) FILTER (WHERE event_name IN ('checkout_view','begin_checkout')), 0)::int AS checkout_views,
        COALESCE(COUNT(*) FILTER (WHERE event_name='purchase'), 0)::int AS purchases,
        COALESCE(SUM(amount) FILTER (WHERE event_name='purchase'), 0)::numeric(12,2) AS revenue
      FROM analytics_events
      WHERE created_at >= now() - ($1::text || ' days')::interval
    `;
    const totalsR = await pool.query(totalsQ, [days]);
    const totals = totalsR.rows[0] || {
      product_views: 0,
      add_to_cart: 0,
      checkout_views: 0,
      purchases: 0,
      revenue: 0,
    };

    const seriesQ = `
      SELECT
        to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
        COALESCE(COUNT(*) FILTER (WHERE event_name='product_view'), 0)::int AS product_views,
        COALESCE(COUNT(*) FILTER (WHERE event_name='add_to_cart'), 0)::int AS add_to_cart,
        COALESCE(COUNT(*) FILTER (WHERE event_name='purchase'), 0)::int AS purchases
      FROM analytics_events
      WHERE created_at >= now() - ($1::text || ' days')::interval
      GROUP BY 1
      ORDER BY 1
    `;
    const seriesR = await pool.query(seriesQ, [days]);

    const topQ = `
      SELECT
        sku,
        COALESCE(COUNT(*) FILTER (WHERE event_name='product_view'), 0)::int AS views,
        COALESCE(COUNT(*) FILTER (WHERE event_name='add_to_cart'), 0)::int AS adds,
        COALESCE(COUNT(*) FILTER (WHERE event_name='purchase'), 0)::int AS purchases
      FROM analytics_events
      WHERE created_at >= now() - ($1::text || ' days')::interval
        AND sku IS NOT NULL
      GROUP BY sku
      ORDER BY adds DESC, views DESC
      LIMIT 8
    `;
    const topR = await pool.query(topQ, [days]);

    res.json({
      ok: true,
      days,
      totals: {
        product_views: Number(totals.product_views || 0),
        add_to_cart: Number(totals.add_to_cart || 0),
        checkout_views: Number(totals.checkout_views || 0),
        purchases: Number(totals.purchases || 0),
        revenue: Number(totals.revenue || 0),
      },
      series: seriesR.rows || [],
      top_products: topR.rows || [],
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "metrics_overview_error" });
  }
});

app.get("/api/checkout/payment-methods", (req, res) => {
  res.json({
    ok: true,
    methods: [
      { id: "mercado_pago", label: "Mercado Pago", description: "Tarjeta, meses, wallet" },
      { id: "paypal", label: "PayPal", description: "Pago con cuenta PayPal" },
      { id: "oxxo_pay", label: "OXXO Pay", description: "Paga en tienda con referencia" },
      { id: "transferencia", label: "Transferencia", description: "SPEI / transferencia bancaria" },
    ],
  });
});

app.post("/api/payments/mercadopago/webhook", async (req, res) => {
  try {
    const topic =
      String(req.query.type || req.query.topic || req.body?.type || req.body?.topic || "").toLowerCase();
    const dataId =
      String(req.query["data.id"] || req.body?.data?.id || req.body?.id || "").trim();
    const requestId = String(req.headers["x-request-id"] || "").trim();
    const providerEventId = requestId || `${topic}:${dataId}:${Date.now()}`;

    await pool.query(
      `INSERT INTO payment_webhook_events (provider, provider_event_id, topic, payload)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (provider, provider_event_id) DO NOTHING`,
      ["mercado_pago", providerEventId, asNull(topic), req.body || null]
    );

    if (!dataId || topic !== "payment") return res.status(200).json({ ok: true, ignored: true });

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) return res.status(200).json({ ok: true, ignored: "no_token" });

    const pRes = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!pRes.ok) {
      const detail = await pRes.text().catch(() => "");
      console.error("MP webhook fetch payment error:", pRes.status, detail.slice(0, 220));
      return res.status(200).json({ ok: true, ignored: "payment_fetch_error" });
    }

    const paymentData = await pRes.json();
    const externalRef = String(paymentData?.external_reference || "").trim();
    const m = externalRef.match(/^MK5-(\d+)$/);
    if (!m) return res.status(200).json({ ok: true, ignored: "external_reference_invalid" });

    const orderId = Number(m[1]);
    const normalizedStatus = normalizeMercadoPagoStatus(paymentData?.status);
    const providerStatus = String(paymentData?.status || "").toLowerCase();
    const providerPaymentId = String(paymentData?.id || "").trim();

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE order_payments
         SET status = $1,
             provider_status = $2,
             provider_payment_id = $3,
             reference = COALESCE(reference, $3),
             updated_at = now(),
             meta = COALESCE(meta, '{}'::jsonb) || $4::jsonb
         WHERE order_id = $5 AND method = 'mercado_pago'`,
        [normalizedStatus, providerStatus, asNull(providerPaymentId), JSON.stringify({ mp: paymentData }), orderId]
      );

      await client.query(
        `UPDATE orders
         SET status = $1
         WHERE id = $2`,
        [normalizedStatus, orderId]
      );
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error("MP webhook error:", e.message);
    res.status(200).json({ ok: true });
  }
});

app.post("/api/payments/paypal/webhook", async (req, res) => {
  try {
    const verify = await verifyPayPalWebhook(req);
    if (!verify.ok) {
      console.error("PayPal webhook signature error:", verify.error);
      return res.status(200).json({ ok: true, ignored: "signature_invalid" });
    }

    const eventId = String(req.body?.id || "").trim();
    const eventType = String(req.body?.event_type || "").trim();
    const resource = req.body?.resource || {};
    const providerEventId = eventId || `paypal:${Date.now()}`;

    await pool.query(
      `INSERT INTO payment_webhook_events (provider, provider_event_id, topic, payload)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (provider, provider_event_id) DO NOTHING`,
      ["paypal", providerEventId, asNull(eventType), req.body || null]
    );

    const customId =
      String(resource?.custom_id || resource?.supplementary_data?.related_ids?.order_id || "").trim();
    const direct = customId.match(/^MK5-(\d+)$/);
    if (!direct) return res.status(200).json({ ok: true, ignored: "custom_id_not_found" });

    const orderId = Number(direct[1]);
    const normalizedStatus = normalizePayPalStatus(eventType, resource?.status);
    const providerStatus = String(resource?.status || "").toLowerCase();
    const providerPaymentId = String(resource?.id || "").trim();

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE order_payments
         SET status = $1,
             provider_status = $2,
             provider_payment_id = $3,
             reference = COALESCE(reference, $3),
             updated_at = now(),
             meta = COALESCE(meta, '{}'::jsonb) || $4::jsonb
         WHERE order_id = $5 AND method = 'paypal'`,
        [normalizedStatus, providerStatus, asNull(providerPaymentId), JSON.stringify({ paypal: resource }), orderId]
      );
      await client.query(`UPDATE orders SET status = $1 WHERE id = $2`, [normalizedStatus, orderId]);
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error("PayPal webhook error:", e.message);
    res.status(200).json({ ok: true });
  }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const phone = String(req.body?.phone || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!email || !password || password.length < 8) {
      return res.status(400).json({ ok: false, error: "invalid_credentials" });
    }

    const passHash = hashPassword(password);
    await pool.query(
      `INSERT INTO customers (name, phone, email, password_hash)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (email) DO UPDATE
       SET name = EXCLUDED.name,
           phone = EXCLUDED.phone,
           password_hash = EXCLUDED.password_hash`,
      [asNull(name), asNull(phone), email, passHash]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "register_error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!email || !password) return res.status(400).json({ ok: false, error: "invalid_credentials" });

    const r = await pool.query(
      `SELECT id, name, phone, email, password_hash FROM customers WHERE email = $1 LIMIT 1`,
      [email]
    );
    const user = r.rows[0];
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ ok: false, error: "auth_failed" });
    }

    res.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "login_error" });
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
- Cuando el cliente pregunte por vehículo + año, usa este formato base (ajústalo según inventario real):
  "Para la [Marca Modelo Año], la medida más común es [MEDIDA]. Aquí te comparto algunas opciones que están con promoción en esa medida:".
  Después lista hasta 3 productos reales del inventario en bullets y en CADA bullet incluye:
  - Marca y modelo
  - Precio antes y precio ahora (si hay promo / descuento)
  - Link de producto usando formato markdown con URL relativa: [Ver modelo](/catalogo?q=MARCA%20MODELO&medida=MEDIDA)
  Luego agrega: "Si deseas más información o ayuda con otra medida, no dudes en preguntar."
  Y después: "Otras medidas que podrías considerar y que son compatibles con tu vehículo son:" seguido de bullets con medida + efecto breve + link markdown: [Ver opciones](/catalogo?medida=MEDIDA)
- Compara opciones: económica vs premium, explica diferencias brevemente.
- Menciona precios en MXN cuando tengas datos del inventario.
- Si hay promoción 4x3 (Continental, Euzkadi, Hankook, Tornel, JK Tyre, Laufenn), menciónala.
- Sé conciso: máximo 3-4 párrafos cortos.
- Usa emojis con moderación (1-2 por respuesta).
- Si no sabes algo, sé honesto y sugiere contactar por WhatsApp.
- NUNCA inventes productos que no estén en el inventario proporcionado.
- Si el inventario está vacío para esa medida, dilo honestamente y sugiere medidas similares.
- Si incluyes links, usa SIEMPRE markdown [texto](url) con rutas internas /catalogo... para que el frontend los haga clickeables.`;


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

async function sendPaymentSuccessEmail(orderId, email, name, total) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[CORREO SIMULADO] Se enviaría correo de confirmación a ${email} por la orden ${orderId}`);
    return;
  }
  
  try {
    const { data, error } = await resend.emails.send({
      from: "MK5 Auto parts <ventas@mk5.mx>",
      to: [email],
      subject: `Confirmación de pago - Orden #${orderId}`,
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h2>¡Pago confirmado, ${name}! 🎉</h2>
          <p>Hemos recibido correctamente tu pago por <strong>$${total}</strong> correspondiente a la orden <strong>#${orderId}</strong>.</p>
          <p>Ya estamos preparando tus llantas para el envío. Te notificaremos en cuanto el paquete esté en camino.</p>
          <br/>
          <p>Gracias por confiar en <strong>MK5</strong>.</p>
        </div>
      `,
    });
    console.log(`[RESEND] Correo enviado: `, data);
  } catch (error) {
    console.error(`[RESEND ERROR]: `, error);
  }
}

app.get("/api/admin/metrics", [requireAdmin], async (req, res) => {
  try {
    const clientsResult = await pool.query("SELECT COUNT(*) FROM customers");
    const totalClients = parseInt(clientsResult.rows[0].count, 10);

    const ordersResult = await pool.query(
      "SELECT COUNT(*) as count, SUM(total) as revenue FROM orders WHERE status = 'paid'"
    );
    const totalOrders = parseInt(ordersResult.rows[0].count, 10);
    const totalRevenue = parseFloat(ordersResult.rows[0].revenue) || 0;

    res.json({
      ok: true,
      metrics: {
        totalClients,
        totalOrders,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error("Error fetching metrics:", error);
    res.status(500).json({ ok: false, error: "Internal Server Error" });
  }
});

app.post("/api/assistant", async (req, res) => {
  try {
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const singleMessage = (req.body?.message || "").toString().trim();

    if (!messages.length && !singleMessage) {
      return res.status(400).json({ ok: false, error: "message_required" });
    }

    const chatMessages = messages.length
      ? messages
      : [{ role: "user", content: singleMessage }];

    const lastUserMsg = [...chatMessages].reverse().find((m) => m.role === "user")?.content || "";

    if (!openai) {
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
        reply: "Para darte la mejor recomendación necesito tu medida de llanta (ej: 205/55/16) o tu auto y año. ¿Me lo compartes?",
        action: "REPLY",
      });
    }

    const inventoryCtx = await getInventoryContext(lastUserMsg);

    const systemMsg = SYSTEM_PROMPT + inventoryCtx;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMsg },
        ...chatMessages.slice(-10),
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

const PAYMENT_METHODS = new Set([
  "mercado_pago",
  "paypal",
  "transferencia",
  "oxxo_pay",
]);

async function createMercadoPagoPreference({ order, lines, customer, shipping }) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return {
      ok: false,
      error: "missing_access_token",
      detail: "Falta MERCADO_PAGO_ACCESS_TOKEN",
    };
  }

  const frontendBase = (process.env.FRONTEND_BASE_URL || "http://localhost:5173").replace(/\/+$/, "");
  const orderCode = `MK5-${order.id}`;

  const items = lines.map((l) => ({
    id: String(l.sku),
    title: `${l.marca} ${l.modelo} ${l.medida}`.trim(),
    description: `SKU ${l.sku}`,
    quantity: Number(l.qty),
    currency_id: "MXN",
    unit_price: Number(l.unit_price),
  }));

  const body = {
    external_reference: orderCode,
    statement_descriptor: "MK5 LLANTAS",
    notification_url: process.env.MERCADO_PAGO_WEBHOOK_URL || null,
    back_urls: {
      success: `${frontendBase}/checkout?payment=success&order=${order.id}`,
      failure: `${frontendBase}/checkout?payment=failure&order=${order.id}`,
      pending: `${frontendBase}/checkout?payment=pending&order=${order.id}`,
    },
    auto_return: "approved",
    items,
    payer: {
      name: String(customer?.name || "").trim() || undefined,
      email: String(customer?.email || "").trim() || undefined,
      phone: {
        number: String(customer?.phone || "").trim() || undefined,
      },
      address: {
        zip_code: String(shipping?.zip || "").trim() || undefined,
        street_name: String(shipping?.address || "").trim() || undefined,
      },
    },
    metadata: {
      order_id: order.id,
      customer_phone: String(customer?.phone || "").trim() || null,
    },
  };

  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return {
      ok: false,
      error: `mercado_pago_preference_error_${res.status}`,
      detail: detail.slice(0, 500),
    };
  }

  const data = await res.json();
  return {
    ok: true,
    preference_id: data.id,
    init_point: data.init_point,
    sandbox_init_point: data.sandbox_init_point,
  };
}

function normalizeMercadoPagoStatus(mpStatus) {
  const s = String(mpStatus || "").toLowerCase();
  if (s === "approved") return "paid";
  if (s === "in_process" || s === "pending") return "pending";
  if (s === "authorized") return "authorized";
  if (s === "rejected" || s === "cancelled" || s === "refunded" || s === "charged_back") return "failed";
  return "pending";
}

function paypalBaseUrl() {
  return String(process.env.PAYPAL_MODE || "sandbox").toLowerCase() === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function getPayPalAccessToken() {
  const clientId = String(process.env.PAYPAL_CLIENT_ID || "").trim();
  const clientSecret = String(process.env.PAYPAL_CLIENT_SECRET || "").trim();
  if (!clientId || !clientSecret) {
    return { ok: false, error: "missing_paypal_credentials" };
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return { ok: false, error: `paypal_token_error_${res.status}`, detail: detail.slice(0, 500) };
  }
  const data = await res.json();
  return { ok: true, token: data.access_token };
}

async function createPayPalOrder({ order, total }) {
  const tk = await getPayPalAccessToken();
  if (!tk.ok) return tk;

  const frontendBase = (process.env.FRONTEND_BASE_URL || "http://localhost:5173").replace(/\/+$/, "");
  const orderCode = `MK5-${order.id}`;

  const body = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: String(order.id),
        custom_id: orderCode,
        amount: {
          currency_code: "MXN",
          value: Number(total || 0).toFixed(2),
        },
      },
    ],
    application_context: {
      brand_name: "MK5 Llantas",
      shipping_preference: "NO_SHIPPING",
      user_action: "PAY_NOW",
      return_url: `${frontendBase}/checkout?payment=success&order=${order.id}`,
      cancel_url: `${frontendBase}/checkout?payment=failure&order=${order.id}`,
    },
  };

  const res = await fetch(`${paypalBaseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tk.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return { ok: false, error: `paypal_order_error_${res.status}`, detail: detail.slice(0, 500) };
  }
  const data = await res.json();
  const approve = Array.isArray(data.links)
    ? data.links.find((l) => l.rel === "approve")?.href || null
    : null;
  return {
    ok: true,
    order_id: data.id,
    approve_url: approve,
    raw_status: data.status,
  };
}

function normalizePayPalStatus(eventType, resourceStatus = "") {
  const e = String(eventType || "").toUpperCase();
  const s = String(resourceStatus || "").toUpperCase();
  if (e === "PAYMENT.CAPTURE.COMPLETED" || s === "COMPLETED") return "paid";
  if (e.includes("DENIED") || e.includes("REVERSED") || e.includes("REFUNDED") || s === "DECLINED")
    return "failed";
  if (e === "CHECKOUT.ORDER.APPROVED") return "authorized";
  return "pending";
}

async function verifyPayPalWebhook(req) {
  const webhookId = String(process.env.PAYPAL_WEBHOOK_ID || "").trim();
  if (!webhookId) return { ok: true, skipped: true };

  const tk = await getPayPalAccessToken();
  if (!tk.ok) return { ok: false, error: tk.error || "paypal_token_error" };

  const body = {
    transmission_id: req.headers["paypal-transmission-id"],
    transmission_time: req.headers["paypal-transmission-time"],
    cert_url: req.headers["paypal-cert-url"],
    auth_algo: req.headers["paypal-auth-algo"],
    transmission_sig: req.headers["paypal-transmission-sig"],
    webhook_id: webhookId,
    webhook_event: req.body,
  };

  const res = await fetch(`${paypalBaseUrl()}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tk.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) return { ok: false, error: `paypal_verify_error_${res.status}` };
  const data = await res.json();
  if (String(data.verification_status || "").toUpperCase() !== "SUCCESS") {
    return { ok: false, error: "paypal_signature_invalid" };
  }
  return { ok: true };
}

async function buildPaymentPayload(method, order, lines = [], customer = {}, shipping = {}) {
  const orderCode = `MK5-${order.id}`;

  if (method === "mercado_pago") {
    const pref = await createMercadoPagoPreference({ order, lines, customer, shipping });
    if (pref?.ok && (pref?.init_point || pref?.sandbox_init_point)) {
      const providerUrl = pref.init_point || pref.sandbox_init_point;
      return {
        method,
        status: "pending",
        reference: pref.preference_id || orderCode,
        type: "redirect",
        provider_url: providerUrl,
        instructions: "Te redirigiremos a Mercado Pago para completar tu pago seguro.",
        error: null,
      };
    }

    console.error("Mercado Pago preference warning:", pref?.error, pref?.detail || "");
    return {
      method,
      status: "pending",
      reference: orderCode,
      type: "provider_error",
      provider_url: null,
      instructions:
        "No pudimos iniciar Mercado Pago en este momento. Tu orden quedó creada; intenta pagar de nuevo o usa transferencia.",
      error: pref?.error || "mercado_pago_init_failed",
    };
  }

  if (method === "paypal") {
    const po = await createPayPalOrder({ order, total: order.total || 0 });
    if (po?.ok && po?.approve_url) {
      return {
        method,
        status: "pending",
        reference: po.order_id || orderCode,
        type: "redirect",
        provider_url: po.approve_url,
        instructions: "Te redirigiremos a PayPal para completar tu pago.",
        error: null,
      };
    }
    console.error("PayPal order warning:", po?.error, po?.detail || "");
    return {
      method,
      status: "pending",
      reference: orderCode,
      type: "redirect",
      provider_url: null,
      instructions: "No pudimos iniciar PayPal en este momento. Intenta más tarde o usa otro método.",
      error: po?.error || "paypal_init_failed",
    };
  }

  if (method === "oxxo_pay") {
    const voucher = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    return {
      method,
      status: "pending",
      reference: voucher,
      type: "voucher",
      provider_url: null,
      instructions: "Genera tu referencia y paga en cualquier tienda OXXO.",
      error: null,
    };
  }

  return {
    method: "transferencia",
    status: "pending",
    reference: orderCode,
    type: "bank_transfer",
    provider_url: null,
    instructions:
      "Realiza tu transferencia a CLABE 012345678901234567, Banco BBVA, beneficiario MK5 Llantas.",
    error: null,
    error: null,
  };
}

function calcLineTotals({ marca, unitPrice, qty, stock }) {
  const price = Number(unitPrice);
  const q = Number(qty);

  const normalSubtotal = price * q;
  let bestTotal = normalSubtotal;

  if (q >= 4 && Number(stock) >= 4) {
    // 4x3 Promotion applied to ANY brand when buying 4 or more
    const payUnits = q - Math.floor(q / 4);
    bestTotal = price * payUnits;
  } else if (q >= 1 && q <= 3) {
    // 25% Discount applied to ANY brand when buying 1 to 3 tires
    bestTotal = normalSubtotal * 0.75;
  }

  return {
    line_total: round2(bestTotal),
    line_discount: round2(normalSubtotal - bestTotal),
  };
}

app.post("/api/checkout/create", async (req, res) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const customer = req.body?.customer || {};
    const shipping = req.body?.shipping || {};
    const createAccount = Boolean(req.body?.customer?.create_account);
    const customerPassword = String(req.body?.customer?.password || "");
    const paymentMethodRaw = String(req.body?.payment?.method || req.body?.payment_method || "").trim().toLowerCase();
    const paymentMethod = PAYMENT_METHODS.has(paymentMethodRaw) ? paymentMethodRaw : "transferencia";

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
    const totalLines = round2(lines.reduce((s, l) => s + l.line_total, 0));
    const discount = round2(subtotal - totalLines);
    
    // Base shipping rule: free for now, but ready for future dynamic value injected from UI zip codes
    const shipping_cost = 0; 
    const total = round2(totalLines + shipping_cost);

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

      if (createAccount && customer.email && customerPassword.length >= 8) {
        const emailNorm = String(customer.email || "").trim().toLowerCase();
        const passHash = hashPassword(customerPassword);
        await client.query(
          `INSERT INTO customers (name, phone, email, password_hash)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (email) DO UPDATE
           SET name = EXCLUDED.name,
               phone = EXCLUDED.phone,
               password_hash = EXCLUDED.password_hash`,
          [asNull(customer.name), asNull(customer.phone), emailNorm, passHash]
        );
      }
      const orderMeta = {
        address: asNull(shipping.address),
        city: asNull(shipping.city),
        state: asNull(shipping.state),
        zip: asNull(shipping.zip),
      };
      const payment = await buildPaymentPayload(
        paymentMethod,
        { id: orderId, total },
        lines,
        customer,
        shipping
      );

      await client.query(
        `INSERT INTO order_payments (order_id, method, status, reference, provider_url, meta)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          orderId,
          payment.method,
          payment.status,
          asNull(payment.reference),
          asNull(payment.provider_url),
          { ...orderMeta, init_error: payment.error || null },
        ]
      );

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
          payment,
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

app.get("/api/checkout/order/:id/payment", async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    if (!Number.isFinite(orderId) || orderId <= 0) {
      return res.status(400).json({ ok: false, error: "invalid_order_id" });
    }

    const r = await pool.query(
      `SELECT o.id, o.status AS order_status, o.total, o.created_at,
              p.method, p.status AS payment_status, p.reference, p.provider_url, p.provider_payment_id, p.provider_status, p.updated_at
       FROM orders o
       LEFT JOIN order_payments p ON p.order_id = o.id
       WHERE o.id = $1
       ORDER BY p.id DESC
       LIMIT 1`,
      [orderId]
    );
    const row = r.rows[0];
    if (!row) return res.status(404).json({ ok: false, error: "order_not_found" });

    res.json({ ok: true, order: row });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "payment_status_error" });
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
  console.log("Backend activo en http://localhost:" + PORT);
  ensureAnalyticsTable()
    .then(() => console.log("Tabla analytics_events lista"))
    .catch((e) => console.error("No pude inicializar analytics_events:", e.message));
  ensureOrderPaymentsTable()
    .then(() => console.log("Tabla order_payments lista"))
    .catch((e) => console.error("No pude inicializar order_payments:", e.message));
  ensurePaymentWebhookTable()
    .then(() => console.log("Tabla payment_webhook_events lista"))
    .catch((e) => console.error("No pude inicializar payment_webhook_events:", e.message));
  ensureCustomersTable()
    .then(() => console.log("Tabla customers lista"))
    .catch((e) => console.error("No pude inicializar customers:", e.message));
});
