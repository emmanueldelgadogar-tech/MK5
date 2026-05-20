const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { Pool } = require("pg");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const OpenAI = require("openai");
const crypto = require("crypto");
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");

const app = express();

// ===================== TRUST PROXY (Render/Vercel/NGINX) =====================
app.set("trust proxy", 1);

// ===================== SECURITY + PARSERS =====================
app.use(helmet({
  hsts: process.env.NODE_ENV === "production"
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  contentSecurityPolicy: false,
}));
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
  "https://mk5.com.mx",
  "https://www.mk5.com.mx",
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

// Bloquear requests sin Origin en producción
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    const origin = req.headers["origin"];
    const isWebhook = req.path.startsWith("/webhooks/");
    if (!origin && !isWebhook) {
      return res.status(403).json({ error: "Forbidden" });
    }
  }
  next();
});


// ===================== RATE LIMIT =====================
const authRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Demasiados intentos, espera un minuto." },
  standardHeaders: true, legacyHeaders: false,
});
const assistantRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 10,
  message: { ok: false, error: "ia_limit", message: "Has usado tus 10 consultas del día. Vuelve mañana." },
  standardHeaders: true, legacyHeaders: false,
});
const webhookRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Demasiadas solicitudes de webhook." },
  standardHeaders: true, legacyHeaders: false,
});

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
  if (req.headers["x-admin-key"] === process.env.ADMIN_KEY) return next();
  const auth = req.headers["authorization"] || "";
  if (auth.startsWith("Bearer ")) {
    const payload = verifyToken(auth.slice(7));
    if (payload && payload.is_admin) return next();
  }
  return res.status(403).json({ error: "Forbidden" });
};


// SEGURIDAD: ADMIN_KEY es obligatoria. Si falta o es débil, el servidor se niega a arrancar.
// Esto previene el caso peligroso de que la env var no se cargue y se firme con un valor
// conocido público ('mk5-secret-fallback' anterior), permitiendo a cualquiera firmar tokens admin.
(function validateAdminKey() {
  const key = process.env.ADMIN_KEY;
  if (!key || key.length < 32) {
    console.error("\n========================================================");
    console.error("FATAL: ADMIN_KEY faltante o demasiado corta (<32 chars).");
    console.error("Genera una con: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"");
    console.error("Agrégala a /var/www/MK5-main/server/.env y reinicia.");
    console.error("========================================================\n");
    process.exit(1);
  }
})();

function signToken(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', process.env.ADMIN_KEY)
    .update(data).digest('base64url');
  return data + '.' + sig;
}
function verifyToken(token) {
  try {
    const dot = (token || '').lastIndexOf('.');
    if (dot < 1) return null;
    const data = token.slice(0, dot);
    const sig  = token.slice(dot + 1);
    const expected = crypto.createHmac('sha256', process.env.ADMIN_KEY)
      .update(data).digest('base64url');
    if (sig !== expected) return null;
    return JSON.parse(Buffer.from(data, 'base64url').toString());
  } catch { return null; }
}

// Geo-block opcional para endpoints admin. Se activa con ADMIN_GEO_LOCK=true en .env
// Usa el header 'cf-ipcountry' que Cloudflare agrega a cada request.
// Si no hay Cloudflare delante (dev local), no aplica.
const ALLOWED_ADMIN_COUNTRIES = String(process.env.ALLOWED_ADMIN_COUNTRIES || "MX")
  .split(",").map(s => s.trim().toUpperCase()).filter(Boolean);

function requireAllowedCountry(req, res, next) {
  if (process.env.ADMIN_GEO_LOCK !== "true") return next();
  const country = String(req.headers["cf-ipcountry"] || "").toUpperCase();
  // Si no hay header (no detrás de Cloudflare), permitir solo localhost
  if (!country) {
    const ip = String(req.ip || "").replace("::ffff:", "");
    if (ip === "127.0.0.1" || ip === "::1") return next();
    console.warn(`[GEO-BLOCK] Sin header cf-ipcountry y no es localhost (ip=${ip})`);
    return res.status(403).json({ ok: false, error: "geo_blocked" });
  }
  if (!ALLOWED_ADMIN_COUNTRIES.includes(country)) {
    console.warn(`[GEO-BLOCK] Acceso bloqueado a ${req.path} desde país=${country}`);
    return res.status(403).json({ ok: false, error: "geo_blocked" });
  }
  next();
}

// Aplicar geo-block ANTES de cualquier endpoint admin
app.use("/api/admin", requireAllowedCountry);

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

// Accept both GET (IPN) and POST (Webhooks) from Mercado Pago
app.all("/api/payments/mercadopago/webhook", webhookRateLimit, async (req, res) => {
  // Verificación de firma Mercado Pago
  const mpSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (mpSecret) {
    const xSig = req.headers["x-signature"] || "";
    const xReqId = req.headers["x-request-id"] || "";
    const dataId = req.query["data.id"] || (req.body && req.body.data && req.body.data.id) || "";
    const tsVal = xSig.split(",").find(p => p.trim().startsWith("ts="))?.split("=")[1] || "";
    const manifest = `id:${dataId};request-id:${xReqId};ts:${tsVal};`;
    const crypto = require("crypto");
    const hmac = crypto.createHmac("sha256", mpSecret);
    hmac.update(manifest);
    const digest = hmac.digest("hex");
    const receivedHash = xSig.split(",").find(p => p.trim().startsWith("v1="))?.split("=")[1] || "";
    if (receivedHash && !crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(receivedHash))) {
      return res.status(401).json({ error: "Firma de webhook inválida" });
    }
  }

  if (req.method !== "GET" && req.method !== "POST") return res.status(405).end();
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
    const providerStatus = String(paymentData?.status || "").toLowerCase();
    const providerStatusDetail = String(paymentData?.status_detail || "").toLowerCase();
    const providerPaymentId = String(paymentData?.id || "").trim();
    const normalizedStatus = normalizeMercadoPagoStatus(providerStatus);

    // Cargar datos actuales de la orden para validar el pago contra el monto y método esperados
    const existingRes = await pool.query(
      `SELECT o.status AS order_status, o.total, op.method, op.status AS payment_status
         FROM orders o
         LEFT JOIN order_payments op ON op.order_id = o.id
         WHERE o.id = $1
         ORDER BY op.id DESC
         LIMIT 1`,
      [orderId]
    );
    const existing = existingRes.rows[0];
    if (!existing) return res.status(200).json({ ok: true, ignored: "order_not_found" });

    // Solo aceptamos webhooks de MP para órdenes cuyo método de pago sea mercado_pago
    if (existing.method && existing.method !== "mercado_pago") {
      return res.status(200).json({ ok: true, ignored: "method_mismatch" });
    }

    const expectedTotal = Number(existing.total || 0);
    const txAmount = Number(
      paymentData?.transaction_amount ??
      paymentData?.transaction_details?.total_paid_amount ??
      0
    );
    const currency = String(paymentData?.currency_id || "").toUpperCase();

    // Validación dura para marcar como pagada:
    //   1) MP debe reportar literalmente "approved" (no confiar solo en el normalize)
    //   2) status_detail debe ser "accredited" (acreditado realmente)
    //   3) El monto pagado debe cubrir el total de la orden (tolerancia 1 centavo)
    //   4) La moneda debe ser MXN
    const amountOk = expectedTotal > 0 && txAmount + 0.01 >= expectedTotal;
    const isApproved =
      providerStatus === "approved" &&
      providerStatusDetail === "accredited" &&
      amountOk &&
      currency === "MXN";

    // Si MP no dice "approved + accredited + monto correcto", NO marcamos paid
    // aunque normalizeMercadoPagoStatus lo hubiera permitido.
    let finalStatus = normalizedStatus;
    if (normalizedStatus === "paid" && !isApproved) {
      finalStatus = "pending";
      console.warn(
        `[MP webhook] Orden ${orderId}: status approved pero falló validación`,
        { providerStatus, providerStatusDetail, txAmount, expectedTotal, currency }
      );
    }

    // Nunca degradar una orden ya pagada (race condition / webhooks duplicados)
    const currentOrderStatus = String(existing.order_status || "").toLowerCase();
    const isTerminalPaid = currentOrderStatus === "paid"
      || currentOrderStatus === "processing"
      || currentOrderStatus === "shipped"
      || currentOrderStatus === "delivered";

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
        [finalStatus, providerStatus, asNull(providerPaymentId), JSON.stringify({ mp: paymentData }), orderId]
      );

      // Solo actualizamos orders.status si:
      //   - la orden NO está ya en un estado terminal de pagado, O
      //   - el nuevo status es "paid" (única transición permitida hacia adelante)
      if (!isTerminalPaid) {
        await client.query(
          `UPDATE orders
           SET status = $1
           WHERE id = $2`,
          [finalStatus, orderId]
        );
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    if (finalStatus === "paid" && !isTerminalPaid) {
      const oRow = await pool.query(
        `SELECT customer_email, customer_name, total FROM orders WHERE id = $1`, [orderId]
      );
      const o = oRow.rows[0];
      if (o?.customer_email) {
        sendPaymentSuccessEmail(orderId, o.customer_email, o.customer_name || "Cliente", o.total).catch(() => {});
      }
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

    if (normalizedStatus === "paid") {
      const oRow = await pool.query(
        `SELECT customer_email, customer_name, total FROM orders WHERE id = $1`, [orderId]
      );
      const o = oRow.rows[0];
      if (o?.customer_email) {
        sendPaymentSuccessEmail(orderId, o.customer_email, o.customer_name || "Cliente", o.total).catch(() => {});
      }
    }

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error("PayPal webhook error:", e.message);
    res.status(200).json({ ok: true });
  }
});

app.post("/api/auth/register", authRateLimit, async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const phone = String(req.body?.phone || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!email || !password || password.length < 8) {
      return res.status(400).json({ ok: false, error: "invalid_credentials" });
    }

    // Verificar si el email ya existe antes de registrar
    const existing = await pool.query(
      `SELECT id FROM customers WHERE email = $1 LIMIT 1`, [email]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ ok: false, error: "email_already_registered" });
    }

    const passHash = hashPassword(password);
    await pool.query(
      `INSERT INTO customers (name, phone, email, password_hash)
       VALUES ($1,$2,$3,$4)`,
      [asNull(name), asNull(phone), email, passHash]
    );
    const r2 = await pool.query(
      `SELECT id, name, phone, email, is_admin FROM customers WHERE email = $1 LIMIT 1`,
      [email]
    );
    const newUser = r2.rows[0];
    const sessionToken = signToken({ id: newUser.id, email: newUser.email, is_admin: newUser.is_admin || false });

    // Email de bienvenida (no bloqueante)
    sendWelcomeAccountEmail(newUser.email, newUser.name).catch(() => {});

    res.json({
      ok: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        phone: newUser.phone,
        email: newUser.email,
        is_admin: newUser.is_admin || false,
        session_token: sessionToken,
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "register_error" });
  }
});

app.post("/api/auth/login", authRateLimit, async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!email || !password) return res.status(400).json({ ok: false, error: "invalid_credentials" });

    const r = await pool.query(
      `SELECT id, name, phone, email, password_hash, is_admin FROM customers WHERE email = $1 LIMIT 1`,
      [email]
    );
    const user = r.rows[0];
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ ok: false, error: "auth_failed" });
    }

    const sessionToken = signToken({ id: user.id, email: user.email, is_admin: user.is_admin || false });
    res.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        is_admin: user.is_admin || false,
        session_token: sessionToken,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "login_error" });
  }
});


app.get("/api/auth/me", (req, res) => {
  const auth = req.headers["authorization"] || "";
  if (!auth.startsWith("Bearer ")) return res.status(401).json({ ok: false, error: "unauthorized" });
  const payload = verifyToken(auth.slice(7));
  if (!payload) return res.status(401).json({ ok: false, error: "session_expired" });
  res.json({ ok: true, user: payload });
});

app.post("/api/auth/logout", (req, res) => {
  res.json({ ok: true });
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

async function ensureNewsletterTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id BIGSERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

// ===================== EMAIL TEMPLATE (reutilizable) =====================
// Template HTML profesional inline-styled (max compat con clientes de correo)
function emailTemplate({
  preheader = "",
  title,
  heading,
  intro,
  highlightBoxes = [], // [{ label, value }]
  body = "",
  ctaText = "",
  ctaUrl = "",
  footerNote = "",
}) {
  const boxesHtml = highlightBoxes.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0">
        ${highlightBoxes.map(b => `
          <tr><td style="padding:10px 14px;background:#fff7ed;border-left:3px solid #e85c00;border-radius:4px;margin-bottom:6px;">
            <div style="font-size:11px;color:#9a6328;letter-spacing:0.3px;text-transform:uppercase;font-weight:700">${b.label}</div>
            <div style="font-size:15px;color:#111;margin-top:3px;font-weight:600">${b.value}</div>
          </td></tr>
          <tr><td style="height:6px;line-height:6px">&nbsp;</td></tr>
        `).join("")}
       </table>`
    : "";

  const ctaHtml = ctaText && ctaUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px auto">
         <tr><td style="border-radius:8px;background:#e85c00">
           <a href="${ctaUrl}" target="_blank"
              style="display:inline-block;padding:14px 32px;color:#fff;text-decoration:none;font-weight:700;font-size:15px;font-family:Arial,sans-serif">
              ${ctaText}
           </a>
         </td></tr>
       </table>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">
  <span style="display:none;font-size:1px;color:#f4f5f7;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${preheader}</span>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f4f5f7">
    <tr><td align="center" style="padding:32px 12px">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.04)">

        <!-- Header con barra de marca -->
        <tr><td style="background:#111;padding:0;height:6px;border-top:6px solid #e85c00">&nbsp;</td></tr>
        <tr><td style="background:#111;padding:22px 32px" align="left">
          <div style="font-family:Arial Black,sans-serif;font-size:24px;font-weight:900;letter-spacing:1px">
            <span style="color:#fff">MK</span><span style="color:#e85c00">5</span>
            <span style="color:#fff;font-size:11px;font-weight:600;letter-spacing:2px;margin-left:4px">LLANTERA</span>
          </div>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 32px 12px">
          <h1 style="margin:0 0 12px;font-size:22px;color:#111;line-height:1.3;font-weight:700">${heading}</h1>
          ${intro ? `<p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.5">${intro}</p>` : ""}
          ${boxesHtml}
          ${body ? `<div style="font-size:14px;color:#444;line-height:1.6">${body}</div>` : ""}
          ${ctaHtml}
        </td></tr>

        <!-- Soporte -->
        <tr><td style="padding:0 32px 24px">
          <div style="background:#f9fafb;border-radius:8px;padding:14px 18px;font-size:13px;color:#555;line-height:1.5">
            ¿Necesitas ayuda? Escríbenos por <a href="https://wa.me/527291136254" style="color:#e85c00;text-decoration:none;font-weight:600">WhatsApp</a>
            o a <a href="mailto:ventas@mk5.com.mx" style="color:#e85c00;text-decoration:none;font-weight:600">ventas@mk5.com.mx</a>.
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#fafafa;padding:22px 32px;border-top:1px solid #eee" align="center">
          <div style="font-size:12px;color:#888;line-height:1.6">
            <a href="https://mk5.com.mx" style="color:#888;text-decoration:none">mk5.com.mx</a> ·
            <a href="https://mk5.com.mx/catalogo" style="color:#888;text-decoration:none">Catálogo</a> ·
            <a href="https://mk5.com.mx/sucursales" style="color:#888;text-decoration:none">Sucursales</a> ·
            <a href="https://mk5.com.mx/rastrear-pedido" style="color:#888;text-decoration:none">Rastrear pedido</a>
          </div>
          ${footerNote ? `<div style="margin-top:10px;font-size:11px;color:#aaa">${footerNote}</div>` : ""}
          <div style="margin-top:10px;font-size:11px;color:#aaa">
            © ${new Date().getFullYear()} MK5 Llantera · Llantas para todas las marcas con envío a toda la República Mexicana
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const EMAIL_FROM = "MK5 Llantera <ventas@mk5.com.mx>";
const EMAIL_BCC = ["llanteramk5.online@gmail.com"];

// Wrapper que loguea correctamente errores de Resend (sin afectar el flujo)
async function sendEmail({ to, subject, html, includeBcc = true }) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[CORREO SIMULADO] → ${to} | ${subject}`);
    return { ok: false, simulated: true };
  }
  try {
    const payload = { from: EMAIL_FROM, to: [to], subject, html };
    if (includeBcc) payload.bcc = EMAIL_BCC;
    const { data, error } = await resend.emails.send(payload);
    if (error) {
      console.error(`[RESEND ERROR] ${subject} → ${to}:`, error?.message || error);
      return { ok: false, error };
    }
    console.log(`[RESEND OK] ${subject} → ${to} (id=${data?.id})`);
    return { ok: true, id: data?.id };
  } catch (err) {
    console.error(`[RESEND EXCEPTION] ${subject} → ${to}:`, err.message);
    return { ok: false, error: err };
  }
}

function money(n) {
  return `$${Number(n || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
}

async function sendOrderReceivedEmail(orderId, email, name, total) {
  const html = emailTemplate({
    preheader: `Recibimos tu orden #${orderId}. Total: ${money(total)}`,
    title: `Pedido recibido - Orden #${orderId}`,
    heading: `¡Recibimos tu pedido, ${name || "cliente"}!`,
    intro: `Tu orden ha sido registrada en nuestro sistema. En cuanto confirmemos tu pago iniciamos la preparación del envío.`,
    highlightBoxes: [
      { label: "Número de orden", value: `#${orderId}` },
      { label: "Total", value: money(total) },
      { label: "Estado", value: "Pendiente de pago" },
    ],
    body: `<p>Si elegiste pago en OXXO o transferencia, recuerda completar el pago dentro del plazo indicado para que tu pedido no se cancele.</p>`,
    ctaText: "Rastrear mi pedido",
    ctaUrl: `https://mk5.com.mx/rastrear-pedido?order=${orderId}`,
    footerNote: "Recibirás otro correo cuando confirmemos tu pago.",
  });
  return sendEmail({
    to: email,
    subject: `Tu pedido fue recibido - Orden #${orderId}`,
    html,
  });
}

async function sendNewsletterWelcomeEmail(email) {
  const html = emailTemplate({
    preheader: "Ya formas parte del club MK5.",
    title: "¡Bienvenido a las ofertas MK5!",
    heading: "¡Ya estás suscrito! 🎉",
    intro: `A partir de ahora recibirás <strong>promociones exclusivas</strong>, descuentos especiales y lanzamientos de las mejores marcas directo en tu correo.`,
    body: `<p>Bridgestone, Michelin, Pirelli, Goodyear, Continental, Hankook y muchas más — siempre al mejor precio.</p>`,
    ctaText: "Ver catálogo",
    ctaUrl: "https://mk5.com.mx/catalogo",
    footerNote: "Si no solicitaste esta suscripción, ignora este mensaje.",
  });
  return sendEmail({
    to: email,
    subject: "¡Bienvenido a las ofertas de MK5!",
    html,
    includeBcc: false,
  });
}

async function sendPaymentSuccessEmail(orderId, email, name, total) {
  const html = emailTemplate({
    preheader: `Tu pago de ${money(total)} fue confirmado. Preparamos tu envío.`,
    title: `Pago confirmado - Orden #${orderId}`,
    heading: `¡Pago confirmado, ${name || "cliente"}! 🎉`,
    intro: `Hemos recibido correctamente tu pago. Ya estamos preparando tus llantas para el envío y te notificaremos en cuanto el paquete esté en camino con su número de guía.`,
    highlightBoxes: [
      { label: "Orden", value: `#${orderId}` },
      { label: "Total pagado", value: money(total) },
      { label: "Estado", value: "En preparación" },
    ],
    body: `<p>Tiempo estimado de envío: <strong>24–72 horas hábiles</strong> según tu ubicación.</p>`,
    ctaText: "Rastrear mi pedido",
    ctaUrl: `https://mk5.com.mx/rastrear-pedido?order=${orderId}`,
    footerNote: "Gracias por confiar en MK5 Llantera.",
  });
  return sendEmail({
    to: email,
    subject: `Pago confirmado - Orden #${orderId}`,
    html,
  });
}

// NUEVO: bienvenida al registrar cuenta
async function sendWelcomeAccountEmail(email, name) {
  const html = emailTemplate({
    preheader: "Tu cuenta MK5 está activa.",
    title: "¡Bienvenido a MK5!",
    heading: `¡Bienvenido, ${name || "cliente"}! 🚗`,
    intro: `Tu cuenta MK5 está lista. Ahora puedes <strong>rastrear pedidos, guardar favoritos, ver historial de compras</strong> y recibir promociones exclusivas.`,
    highlightBoxes: [
      { label: "Correo registrado", value: email },
      { label: "Acceso", value: "mk5.com.mx/mi-cuenta" },
    ],
    body: `
      <p><strong>Lo que puedes hacer con tu cuenta:</strong></p>
      <ul style="padding-left:20px;color:#444;line-height:1.7">
        <li>Compras más rápidas (datos guardados)</li>
        <li>Rastreo en tiempo real de tus pedidos</li>
        <li>Lista de favoritos para no perder llantas</li>
        <li>Promociones exclusivas para miembros</li>
      </ul>`,
    ctaText: "Explorar catálogo",
    ctaUrl: "https://mk5.com.mx/catalogo",
    footerNote: "Si no creaste esta cuenta, contáctanos de inmediato.",
  });
  return sendEmail({
    to: email,
    subject: "¡Bienvenido a MK5 Llantera!",
    html,
    includeBcc: false, // No es correo de compra → sin BCC
  });
}

app.get("/api/admin/metrics", [requireAdmin], async (req, res) => {
  try {
    const [clientsResult, ordersResult, byStatusResult, revenueByMethodResult] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM customers"),
      pool.query("SELECT COUNT(*) as count, SUM(total) as revenue FROM orders WHERE status = 'paid'"),
      pool.query(`
        SELECT status, COUNT(*) as count
        FROM orders
        GROUP BY status
        ORDER BY count DESC
      `),
      pool.query(`
        SELECT op.method, COUNT(*) as count, SUM(o.total) as revenue
        FROM orders o
        LEFT JOIN order_payments op ON op.order_id = o.id
        WHERE o.status = 'paid'
        GROUP BY op.method
        ORDER BY revenue DESC
      `),
    ]);

    const totalClients = parseInt(clientsResult.rows[0].count, 10);
    const totalOrders = parseInt(ordersResult.rows[0].count, 10);
    const totalRevenue = parseFloat(ordersResult.rows[0].revenue) || 0;

    // Pedidos pendientes de pago (alerta)
    const byStatus = {};
    for (const row of byStatusResult.rows) {
      byStatus[row.status] = parseInt(row.count, 10);
    }
    const pendingOrders = byStatus["pending_payment"] || 0;
    const processingOrders = byStatus["processing"] || 0;

    res.json({
      ok: true,
      metrics: {
        totalClients,
        totalOrders,
        totalRevenue,
        pendingOrders,
        processingOrders,
        byStatus,
        revenueByMethod: revenueByMethodResult.rows.map(r => ({
          method: r.method || "sin método",
          count: parseInt(r.count, 10),
          revenue: parseFloat(r.revenue) || 0,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching metrics:", error);
    res.status(500).json({ ok: false, error: "Internal Server Error" });
  }
});

app.post("/api/assistant", assistantRateLimit, async (req, res) => {
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
    unit_price: round2(Number(l.line_total) / Number(l.qty)),
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

/**
 * Consulta a Mercado Pago en vivo el estado real de los pagos asociados a una orden
 * y reconcilia el status local. Se usa cuando el cliente vuelve de MP al sitio y no
 * podemos esperar al webhook (por si MP tarda o no llega).
 *
 * - Busca pagos en MP por external_reference = MK5-{orderId}
 * - Aplica las MISMAS reglas duras que el webhook (approved + accredited + monto + MXN)
 * - Nunca degrada una orden ya pagada
 * - Devuelve el status final actualizado
 */
async function reconcileMercadoPagoOrder(orderId) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!accessToken) return { ok: false, error: "no_token" };

  try {
    const orderRes = await pool.query(
      `SELECT o.status AS order_status, o.total, op.method, op.status AS payment_status
         FROM orders o
         LEFT JOIN order_payments op ON op.order_id = o.id
         WHERE o.id = $1
         ORDER BY op.id DESC
         LIMIT 1`,
      [orderId]
    );
    const existing = orderRes.rows[0];
    if (!existing) return { ok: false, error: "order_not_found" };
    if (existing.method && existing.method !== "mercado_pago") {
      return { ok: false, error: "method_mismatch" };
    }

    const currentOrderStatus = String(existing.order_status || "").toLowerCase();
    const isTerminalPaid = currentOrderStatus === "paid"
      || currentOrderStatus === "processing"
      || currentOrderStatus === "shipped"
      || currentOrderStatus === "delivered";
    // Si ya está pagada, no hace falta consultar MP
    if (isTerminalPaid) return { ok: true, status: currentOrderStatus, skipped: true };

    // Buscar el/los pagos asociados a esta orden por external_reference
    const searchUrl = `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent("MK5-" + orderId)}`;
    const searchRes = await fetch(searchUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!searchRes.ok) {
      return { ok: false, error: `mp_search_${searchRes.status}` };
    }
    const searchData = await searchRes.json();
    const results = Array.isArray(searchData?.results) ? searchData.results : [];
    if (!results.length) {
      // No hay ningún pago en MP todavía → la orden sigue pendiente
      return { ok: true, status: currentOrderStatus, mp_payments: 0 };
    }

    // Tomamos el pago "más fuerte": el approved si existe, si no el más reciente
    const approved = results.find(
      (p) => String(p?.status || "").toLowerCase() === "approved" &&
             String(p?.status_detail || "").toLowerCase() === "accredited"
    );
    const paymentData = approved || results.sort(
      (a, b) => new Date(b?.date_created || 0) - new Date(a?.date_created || 0)
    )[0];

    const providerStatus = String(paymentData?.status || "").toLowerCase();
    const providerStatusDetail = String(paymentData?.status_detail || "").toLowerCase();
    const providerPaymentId = String(paymentData?.id || "").trim();
    const expectedTotal = Number(existing.total || 0);
    const txAmount = Number(
      paymentData?.transaction_amount ??
      paymentData?.transaction_details?.total_paid_amount ??
      0
    );
    const currency = String(paymentData?.currency_id || "").toUpperCase();

    const amountOk = expectedTotal > 0 && txAmount + 0.01 >= expectedTotal;
    const isApproved =
      providerStatus === "approved" &&
      providerStatusDetail === "accredited" &&
      amountOk &&
      currency === "MXN";

    let finalStatus = normalizeMercadoPagoStatus(providerStatus);
    if (finalStatus === "paid" && !isApproved) finalStatus = "pending";

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE order_payments
         SET status = $1,
             provider_status = $2,
             provider_payment_id = COALESCE($3, provider_payment_id),
             reference = COALESCE(reference, $3),
             updated_at = now(),
             meta = COALESCE(meta, '{}'::jsonb) || $4::jsonb
         WHERE order_id = $5 AND method = 'mercado_pago'`,
        [finalStatus, providerStatus, asNull(providerPaymentId), JSON.stringify({ mp_reconcile: paymentData }), orderId]
      );
      await client.query(
        `UPDATE orders SET status = $1 WHERE id = $2`,
        [finalStatus, orderId]
      );
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    if (finalStatus === "paid") {
      const oRow = await pool.query(
        `SELECT customer_email, customer_name, total FROM orders WHERE id = $1`, [orderId]
      );
      const o = oRow.rows[0];
      if (o?.customer_email) {
        sendPaymentSuccessEmail(orderId, o.customer_email, o.customer_name || "Cliente", o.total).catch(() => {});
      }
    }

    return { ok: true, status: finalStatus, mp_payments: results.length };
  } catch (e) {
    console.error("[MP reconcile] error:", e.message);
    return { ok: false, error: "reconcile_exception" };
  }
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
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    try {
      const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": `mk5-oxxo-${order.id}-${Date.now()}`,
        },
        body: JSON.stringify({
          transaction_amount: Number(order.total),
          description: `MK5 Llantas - Orden MK5-${order.id}`,
          payment_method_id: "oxxo",
          payer: {
            email: customer.email || "cliente@mk5.com.mx",
            first_name: String(customer.name || "Cliente").split(" ")[0],
            last_name: String(customer.name || "MK5").split(" ").slice(1).join(" ") || "MK5",
          },
        }),
      });
      const mpData = await mpRes.json();
      if (mpData.id && mpData.transaction_details?.external_resource_url) {
        const expiry = mpData.date_of_expiration
          ? new Date(mpData.date_of_expiration).toLocaleDateString("es-MX", { day: "numeric", month: "long" })
          : "72 horas";
        return {
          method,
          status: "pending",
          reference: String(mpData.id),
          type: "voucher",
          provider_url: mpData.transaction_details.external_resource_url,
          instructions: `Paga en cualquier OXXO antes del ${expiry}. Muestra el código de barras al cajero.`,
          error: null,
        };
      }
      console.error("OXXO MP error:", JSON.stringify(mpData).slice(0, 300));
      return {
        method,
        status: "pending",
        reference: `MK5-${order.id}`,
        type: "voucher",
        provider_url: null,
        instructions: "No se pudo generar el voucher OXXO. Contacta soporte con tu número de orden.",
        error: mpData.message || "oxxo_payment_failed",
      };
    } catch (e) {
      console.error("OXXO fetch error:", e.message);
      return {
        method,
        status: "pending",
        reference: `MK5-${order.id}`,
        type: "voucher",
        provider_url: null,
        instructions: "Error al generar voucher OXXO. Contacta soporte.",
        error: "oxxo_fetch_error",
      };
    }
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
  const promoPrice = Number(unitPrice);
  const q = Number(qty);
  const listPrice = promoPrice > 0 ? promoPrice / 0.75 : 0;

  const normalSubtotal = listPrice * q;
  let bestTotal = normalSubtotal;

  if (q >= 4 && Number(stock) >= 4) {
    // 4x3 Promotion applied to ANY brand when buying 4 or more
    const payUnits = q - Math.floor(q / 4);
    bestTotal = listPrice * payUnits;
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
        unit_price: Number(row.precio) / 0.75,
        line_total,
        line_discount,
      });
    }

    const subtotal = round2(lines.reduce((s, l) => s + l.unit_price * l.qty, 0));
    const totalLines = round2(lines.reduce((s, l) => s + l.line_total, 0));
    const discount = round2(subtotal - totalLines);
    
    // Shipping: $150 for Baja California, Baja California Sur, Campeche; free everywhere else
    const ESTADOS_ENVIO_150 = new Set(["Baja California","Baja California Sur","Campeche"]);
    const shippingState = (shipping.state || "").trim();
    const shipping_cost = ESTADOS_ENVIO_150.has(shippingState) ? 150 : 0;
    const total = round2(totalLines + shipping_cost);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // IMPORTANTE: status SIEMPRE arranca en 'pending_payment'.
      // Nunca confiar en el DEFAULT de la columna en la BD — si por accidente
      // estuviera mal configurado a 'paid', generaríamos órdenes pagadas sin cobrar.
      const o = await client.query(
        `INSERT INTO orders (order_code, customer_name, customer_phone, customer_email, subtotal, discount, total, status)
         VALUES ('MK5-' || to_char(now(), 'YYMMDD') || '-' || lpad(floor(random()*10000)::text, 4, '0'), $1,$2,$3,$4,$5,$6,'pending_payment')
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
          `INSERT INTO order_items (order_id, sku, marca, modelo, medida, qty, charged_qty, unit_price, line_total)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            orderId,
            l.sku,
            l.marca,
            l.modelo,
            l.medida,
            l.qty,
            l.charged_qty ?? l.qty,
            l.unit_price,
            l.line_total,
          ]
        );

        // Descontar stock
        await client.query(
          `UPDATE catalogo SET stock = GREATEST(stock - $1, 0) WHERE sku = $2`,
          [l.qty, l.sku]
        );
      }
      await client.query("COMMIT");

      // Enviar correo de confirmación de orden (fire & forget)
      if (customer.email) {
        sendOrderReceivedEmail(orderId, customer.email, customer.name, total).catch(() => {});
      }

      // Calcular risk score (no bloqueante; si falla, deja score=0)
      try {
        const risk = await calculateRiskScore({
          customer_email: customer.email,
          customer_phone: customer.phone,
          total,
          items: lines,
          shipping,
        });
        await client.query(
          `UPDATE orders SET risk_score = $1, risk_flags = $2::jsonb WHERE id = $3`,
          [risk.score, JSON.stringify(risk.flags), orderId]
        );
        if (risk.score >= 60) {
          console.warn(`[ANTIFRAUDE] Orden #${orderId} HIGH risk (score=${risk.score}): ${risk.flags.map(f => f.code).join(", ")}`);
        } else if (risk.score >= 30) {
          console.log(`[ANTIFRAUDE] Orden #${orderId} medium risk (score=${risk.score})`);
        }
      } catch (e) {
        console.error("[ANTIFRAUDE] Error calculando score:", e.message);
      }

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

    // Lectura inicial para saber qué método de pago tiene la orden
    const r1 = await pool.query(
      `SELECT o.id, o.status AS order_status, o.total, o.created_at,
              p.method, p.status AS payment_status, p.reference, p.provider_url, p.provider_payment_id, p.provider_status, p.updated_at
       FROM orders o
       LEFT JOIN order_payments p ON p.order_id = o.id
       WHERE o.id = $1
       ORDER BY p.id DESC
       LIMIT 1`,
      [orderId]
    );
    let row = r1.rows[0];
    if (!row) return res.status(404).json({ ok: false, error: "order_not_found" });

    // Si la orden es de Mercado Pago y todavía está pendiente, consultamos a MP
    // en vivo para reconciliar (no esperamos al webhook). Esto cierra la ventana
    // donde el cliente vuelve a /gracias antes de que el webhook llegue.
    const orderStatusLc = String(row.order_status || "").toLowerCase();
    const isPendingMP =
      row.method === "mercado_pago" &&
      (orderStatusLc === "pending_payment" || orderStatusLc === "pending" || orderStatusLc === "");
    if (isPendingMP) {
      await reconcileMercadoPagoOrder(orderId);
      // Releemos el estado actualizado
      const r2 = await pool.query(
        `SELECT o.id, o.status AS order_status, o.total, o.created_at,
                p.method, p.status AS payment_status, p.reference, p.provider_url, p.provider_payment_id, p.provider_status, p.updated_at
         FROM orders o
         LEFT JOIN order_payments p ON p.order_id = o.id
         WHERE o.id = $1
         ORDER BY p.id DESC
         LIMIT 1`,
        [orderId]
      );
      if (r2.rows[0]) row = r2.rows[0];
    }

    res.json({ ok: true, order: row });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "payment_status_error" });
  }
});

// ===================== NEWSLETTER =====================
app.post("/api/newsletter/subscribe", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ ok: false, error: "email_invalido" });
    }
    const result = await pool.query(
      `INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING RETURNING id`,
      [email]
    );
    const isNew = result.rowCount > 0;
    if (isNew) {
      sendNewsletterWelcomeEmail(email).catch(() => {});
    }
    res.json({ ok: true, new: isNew });
  } catch (e) {
    console.error("newsletter subscribe error:", e.message);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

// ===================== LISTEN =====================
const PORT = Number(process.env.PORT || 4000);

// =================== ADMIN ENDPOINTS ===================

app.get("/api/admin/orders", [requireAdmin], async (req, res) => {
  try {
    const { status, search } = req.query;
    let q = `SELECT o.id, o.order_code, o.customer_name, o.customer_email, o.customer_phone,
             o.total, o.status, o.created_at, op.method as payment_method
             FROM orders o LEFT JOIN order_payments op ON op.order_id = o.id WHERE 1=1`;
    const params = [];
    if (status && status !== 'all') { params.push(status); q += ` AND o.status = $${params.length}`; }
    if (search) {
      params.push('%' + search + '%');
      q += ` AND (o.order_code ILIKE $${params.length} OR o.customer_name ILIKE $${params.length} OR o.customer_email ILIKE $${params.length})`;
    }
    q += ' ORDER BY o.created_at DESC LIMIT 200';
    const result = await pool.query(q, params);
    res.json({ ok: true, orders: result.rows });
  } catch (err) { console.error("[ADMIN ORDERS ERROR]", err); res.status(500).json({ ok: false }); }
});

app.patch("/api/admin/orders/:id/cancel", [requireAdmin], async (req, res) => {
  try {
    await pool.query("UPDATE orders SET status = 'cancelled' WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ ok: false }); }
});

app.get("/api/admin/orders/:id", [requireAdmin], async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: "bad_id" });

    const orderRes = await pool.query(
      `SELECT o.id, o.order_code, o.customer_name, o.customer_email, o.customer_phone,
              o.subtotal, o.discount, o.total, o.status, o.tracking_number, o.created_at,
              op.method AS payment_method, op.status AS payment_status,
              op.reference AS payment_reference, op.meta AS payment_meta
         FROM orders o
         LEFT JOIN order_payments op ON op.order_id = o.id
         WHERE o.id = $1
         LIMIT 1`,
      [id]
    );
    if (!orderRes.rows.length) return res.status(404).json({ ok: false, error: "not_found" });

    const itemsRes = await pool.query(
      `SELECT id, sku, marca, modelo, medida, qty, charged_qty, unit_price, line_total
         FROM order_items
         WHERE order_id = $1
         ORDER BY id ASC`,
      [id]
    );

    res.json({ ok: true, order: orderRes.rows[0], items: itemsRes.rows });
  } catch (err) {
    console.error("[ADMIN ORDER DETAIL ERROR]", err);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});


app.patch("/api/admin/orders/:id/status", [requireAdmin], async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, tracking_number } = req.body || {};
    const validStatuses = ["pending_payment","paid","processing","shipped","delivered","cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ ok: false, error: "invalid_status" });
    }

    // Obtener datos del pedido para el email
    const orderRes = await pool.query(
      `SELECT o.id, o.order_code, o.customer_name, o.customer_email, o.total,
              op.method AS payment_method
       FROM orders o
       LEFT JOIN order_payments op ON op.order_id = o.id
       WHERE o.id = $1 LIMIT 1`,
      [id]
    );
    const order = orderRes.rows[0];
    if (!order) return res.status(404).json({ ok: false, error: "not_found" });

    // Actualizar estado (y tracking si aplica)
    await pool.query(
      `UPDATE orders SET status = $1, tracking_number = COALESCE($2, tracking_number), updated_at = NOW()
       WHERE id = $3`,
      [status, tracking_number || null, id]
    );

    let email_sent = false;
    if (status === "shipped" && order.customer_email) {
      const orderRef = order.order_code || `#${order.id}`;
      const boxes = [
        { label: "Pedido", value: orderRef },
        { label: "Estado", value: "Enviado" },
      ];
      if (tracking_number) {
        boxes.push({ label: "Número de guía", value: tracking_number });
      }
      const html = emailTemplate({
        preheader: `Tu pedido ${orderRef} ya está en camino 🚚`,
        title: `Pedido en camino - ${orderRef}`,
        heading: `¡Tu pedido está en camino, ${order.customer_name || "cliente"}! 🚚`,
        intro: `Tu pedido ya fue despachado y va rumbo a tu dirección de envío.`,
        highlightBoxes: boxes,
        body: `<p>El tiempo estimado de entrega es de <strong>24–72 horas hábiles</strong> según tu ubicación. Puedes consultar el estado en cualquier momento desde tu cuenta o el rastreador.</p>`,
        ctaText: "Rastrear mi pedido",
        ctaUrl: `https://mk5.com.mx/rastrear-pedido?order=${order.id}`,
        footerNote: "Avísanos por WhatsApp si tienes cualquier problema con la entrega.",
      });
      const result = await sendEmail({
        to: order.customer_email,
        subject: `Tu pedido ${orderRef} está en camino 🚚`,
        html,
      });
      email_sent = result.ok;
    }

    res.json({ ok: true, email_sent });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});



app.get("/api/admin/customers", [requireAdmin], async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COALESCE(c.id, 0) as id,
        COALESCE(c.name, o_agg.customer_name) as name,
        COALESCE(c.email, o_agg.customer_email) as email,
        COALESCE(c.phone, o_agg.customer_phone) as phone,
        COALESCE(c.created_at, o_agg.first_order) as created_at,
        COALESCE(o_agg.orders_count, 0) as orders_count
      FROM (
        SELECT customer_email,
               MIN(customer_name) as customer_name,
               MIN(customer_phone) as customer_phone,
               MIN(created_at) as first_order,
               COUNT(*) as orders_count
        FROM orders
        WHERE customer_email IS NOT NULL AND customer_email != ''
        GROUP BY customer_email
      ) o_agg
      FULL OUTER JOIN customers c ON LOWER(c.email) = LOWER(o_agg.customer_email)
      ORDER BY COALESCE(c.created_at, o_agg.first_order) DESC
      LIMIT 500`);
    res.json({ ok: true, customers: result.rows });
  } catch (err) { console.error("[ADMIN CUSTOMERS ERROR]", err); res.status(500).json({ ok: false }); }
});

app.get("/api/admin/newsletter", [requireAdmin], async (req, res) => {
  try {
    const result = await pool.query('SELECT email, created_at FROM newsletter_subscribers ORDER BY created_at DESC');
    res.json({ ok: true, subscribers: result.rows });
  } catch (err) { res.status(500).json({ ok: false }); }
});

// ===================== PASSWORD RESET =====================

async function ensurePasswordResetTokensTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id BIGSERIAL PRIMARY KEY,
      customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_prt_token ON password_reset_tokens(token);
  `);
}

app.post("/api/auth/forgot-password", authRateLimit, async (req, res) => {
  // Siempre responder ok para no revelar si el email existe
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!email) return res.json({ ok: true });

  try {
    const r = await pool.query(
      `SELECT id, name FROM customers WHERE email = $1 LIMIT 1`, [email]
    );
    if (!r.rows.length) return res.json({ ok: true });

    const customer = r.rows[0];
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Invalida tokens anteriores del mismo usuario
    await pool.query(
      `UPDATE password_reset_tokens SET used_at = now() WHERE customer_id = $1 AND used_at IS NULL`,
      [customer.id]
    );
    await pool.query(
      `INSERT INTO password_reset_tokens (customer_id, token, expires_at) VALUES ($1, $2, $3)`,
      [customer.id, token, expiresAt]
    );

    const frontendBase = (process.env.FRONTEND_BASE_URL || "https://mk5.com.mx").replace(/\/+$/, "");
    const resetUrl = `${frontendBase}/mi-cuenta?reset=${token}`;

    const html = emailTemplate({
      preheader: "Solicitud para restablecer tu contraseña MK5.",
      title: "Restablecer contraseña",
      heading: `Restablecer tu contraseña`,
      intro: `Hola <strong>${customer.name || "cliente"}</strong>, recibimos una solicitud para restablecer la contraseña de tu cuenta MK5.`,
      body: `<p style="color:#666;font-size:13px;margin-top:18px">⏱️ Este enlace es válido por <strong>1 hora</strong>. Si no solicitaste esto, ignora este correo — tu cuenta sigue segura.</p>`,
      ctaText: "Restablecer contraseña",
      ctaUrl: resetUrl,
      footerNote: "Por seguridad, nunca compartas este enlace con nadie.",
    });
    await sendEmail({
      to: email,
      subject: "Recupera tu contraseña — MK5 Llantas",
      html,
      includeBcc: false,
    });
  } catch (e) {
    console.error("forgot-password error:", e.message);
  }

  res.json({ ok: true });
});

app.post("/api/auth/reset-password", authRateLimit, async (req, res) => {
  const token = String(req.body?.token || "").trim();
  const newPassword = String(req.body?.password || "");

  if (!token || newPassword.length < 8) {
    return res.status(400).json({ ok: false, error: "invalid_request" });
  }

  try {
    const r = await pool.query(
      `SELECT id, customer_id, expires_at, used_at FROM password_reset_tokens WHERE token = $1 LIMIT 1`,
      [token]
    );
    const row = r.rows[0];
    if (!row) return res.status(400).json({ ok: false, error: "token_invalid" });
    if (row.used_at) return res.status(400).json({ ok: false, error: "token_already_used" });
    if (new Date(row.expires_at) < new Date()) return res.status(400).json({ ok: false, error: "token_expired" });

    const passHash = hashPassword(newPassword);
    await pool.query(`UPDATE customers SET password_hash = $1 WHERE id = $2`, [passHash, row.customer_id]);
    await pool.query(`UPDATE password_reset_tokens SET used_at = now() WHERE id = $1`, [row.id]);

    res.json({ ok: true });
  } catch (e) {
    console.error("reset-password error:", e.message);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

// ===================== ANTIFRAUDE (risk score, blacklist, zones) =====================

async function ensureFraudTablesAndColumns() {
  // Lista negra: emails, teléfonos, IPs, códigos postales
  await pool.query(`
    CREATE TABLE IF NOT EXISTS fraud_blacklist (
      id BIGSERIAL PRIMARY KEY,
      type TEXT NOT NULL,                    -- 'email' | 'phone' | 'ip' | 'cp'
      value TEXT NOT NULL,
      reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (type, value)
    );
    CREATE INDEX IF NOT EXISTS idx_fraud_blacklist_type_value ON fraud_blacklist (type, value);
  `);

  // Zonas de riesgo: CPs / ciudades / estados
  await pool.query(`
    CREATE TABLE IF NOT EXISTS fraud_risk_zones (
      id BIGSERIAL PRIMARY KEY,
      type TEXT NOT NULL,                    -- 'cp' | 'city' | 'state' | 'colonia'
      value TEXT NOT NULL,
      severity INTEGER NOT NULL DEFAULT 30,  -- 0-100 (puntos que suma al score)
      reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_fraud_risk_zones_type_value
      ON fraud_risk_zones (type, value);
  `);

  // Columnas en orders para guardar score y banderas
  await pool.query(`
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS risk_flags JSONB DEFAULT '[]'::jsonb;
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_orders_risk_score ON orders (risk_score DESC) WHERE risk_score > 0;`
  );
}

// Dominios de email desechables conocidos
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "tempmail.com", "10minutemail.com", "guerrillamail.com", "mailinator.com",
  "throwaway.email", "yopmail.com", "trash-mail.com", "fakeinbox.com",
  "tempinbox.com", "getnada.com", "maildrop.cc", "sharklasers.com",
  "temp-mail.org", "dispostable.com", "mintemail.com", "spambox.us",
]);

/**
 * Calcula el risk score (0-100+) de una orden a partir de:
 *  - orderData: { customer_email, customer_phone, total, items, shipping }
 *  - customerHistory: { totalOrders, ordersLastHour, ordersLastDay, hasChargeback }
 *
 * Retorna { score, flags: [{ code, points, message }] }
 */
async function calculateRiskScore(orderData) {
  const flags = [];
  let score = 0;

  const email = String(orderData.customer_email || "").trim().toLowerCase();
  const phone = String(orderData.customer_phone || "").trim();
  const total = Number(orderData.total || 0);
  const items = Array.isArray(orderData.items) ? orderData.items : [];
  const shipping = orderData.shipping || {};
  const cp = String(shipping.zip || "").trim();
  const city = String(shipping.city || "").trim().toLowerCase();
  const state = String(shipping.state || "").trim().toLowerCase();

  // 1. Blacklist (puntos altos: si está en lista, casi automático rechazar)
  try {
    const bl = await pool.query(
      `SELECT type, value, reason FROM fraud_blacklist
       WHERE (type = 'email' AND value = $1)
          OR (type = 'phone' AND value = $2)
          OR (type = 'cp'    AND value = $3)`,
      [email, phone, cp]
    );
    for (const row of bl.rows) {
      score += 100;
      flags.push({
        code: `blacklist_${row.type}`,
        points: 100,
        message: `${row.type.toUpperCase()} en lista negra${row.reason ? `: ${row.reason}` : ""}`,
      });
    }
  } catch { /* tabla puede no existir aún en primer arranque */ }

  // 2. Zonas de riesgo (CP/ciudad/estado)
  try {
    const zones = await pool.query(
      `SELECT type, value, severity, reason FROM fraud_risk_zones
       WHERE (type = 'cp'      AND value = $1)
          OR (type = 'city'    AND lower(value) = $2)
          OR (type = 'state'   AND lower(value) = $3)`,
      [cp, city, state]
    );
    for (const z of zones.rows) {
      score += z.severity;
      flags.push({
        code: `risk_zone_${z.type}`,
        points: z.severity,
        message: `Zona de riesgo (${z.type}): ${z.value}${z.reason ? ` — ${z.reason}` : ""}`,
      });
    }
  } catch { /* idem */ }

  // 3. Email desechable
  if (email.includes("@")) {
    const domain = email.split("@")[1];
    if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
      score += 30;
      flags.push({
        code: "disposable_email",
        points: 30,
        message: `Email desechable detectado (${domain})`,
      });
    }
  }

  // 4. Frecuencia: ¿múltiples órdenes del mismo email últimamente?
  if (email) {
    try {
      const freq = await pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE created_at >= now() - interval '1 hour') AS last_hour,
           COUNT(*) FILTER (WHERE created_at >= now() - interval '24 hours') AS last_day,
           COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_count,
           COUNT(*) AS total_orders
         FROM orders WHERE lower(customer_email) = $1`,
        [email]
      );
      const f = freq.rows[0] || {};
      const lastHour = Number(f.last_hour || 0);
      const lastDay = Number(f.last_day || 0);
      const cancelled = Number(f.cancelled_count || 0);
      const totalOrders = Number(f.total_orders || 0);

      if (lastHour >= 2) {
        score += 25;
        flags.push({
          code: "velocity_hour",
          points: 25,
          message: `${lastHour} órdenes del mismo email en la última hora`,
        });
      }
      if (lastDay >= 3) {
        score += 15;
        flags.push({
          code: "velocity_day",
          points: 15,
          message: `${lastDay} órdenes del mismo email en 24h`,
        });
      }
      if (totalOrders === 0) {
        // Cliente totalmente nuevo (en lo que va de la BD)
        score += 5;
        flags.push({ code: "new_customer", points: 5, message: "Cliente nuevo (primera orden)" });
      }
      if (cancelled >= 2) {
        score += 20;
        flags.push({
          code: "many_cancelled",
          points: 20,
          message: `${cancelled} órdenes canceladas previamente con este email`,
        });
      }
    } catch { /* sin error si la tabla orders no existe aún */ }
  }

  // 5. Total alto
  if (total > 30000) {
    score += 25;
    flags.push({ code: "very_high_total", points: 25, message: `Total muy alto: ${money(total)}` });
  } else if (total > 15000) {
    score += 12;
    flags.push({ code: "high_total", points: 12, message: `Total alto: ${money(total)}` });
  }

  // 6. Cantidad sospechosa de llantas del mismo SKU
  const qtyBySku = new Map();
  for (const it of items) {
    const sku = String(it.sku || "");
    const qty = Number(it.qty || it.charged_qty || 0);
    if (sku) qtyBySku.set(sku, (qtyBySku.get(sku) || 0) + qty);
  }
  let maxQty = 0;
  let maxSku = "";
  for (const [sku, qty] of qtyBySku) {
    if (qty > maxQty) { maxQty = qty; maxSku = sku; }
  }
  if (maxQty >= 8) {
    score += 25;
    flags.push({
      code: "bulk_purchase",
      points: 25,
      message: `${maxQty} llantas del mismo SKU (${maxSku}) — posible revendedor`,
    });
  } else if (maxQty >= 5) {
    score += 10;
    flags.push({
      code: "high_qty",
      points: 10,
      message: `${maxQty} llantas mismo SKU (${maxSku})`,
    });
  }

  // 7. Teléfono inválido
  const phoneDigits = phone.replace(/\D/g, "");
  if (!phone) {
    score += 8;
    flags.push({ code: "no_phone", points: 8, message: "Sin teléfono de contacto" });
  } else if (phoneDigits.length < 10 || phoneDigits.length > 13) {
    score += 10;
    flags.push({ code: "invalid_phone", points: 10, message: `Teléfono con formato anómalo (${phone})` });
  }

  // 8. CP no provisto
  if (!cp) {
    score += 8;
    flags.push({ code: "no_zip", points: 8, message: "Sin código postal de envío" });
  } else if (!/^\d{5}$/.test(cp)) {
    score += 10;
    flags.push({ code: "invalid_zip", points: 10, message: `CP con formato anómalo (${cp})` });
  }

  return { score, flags };
}

function riskLabel(score) {
  if (score >= 60) return "high";
  if (score >= 30) return "medium";
  return "low";
}

// Endpoints admin
app.get("/api/admin/fraud/orders", [requireAdmin], async (req, res) => {
  try {
    const minScore = parseInt(req.query.min_score, 10) || 30;
    const r = await pool.query(
      `SELECT id, order_code, customer_name, customer_email, customer_phone,
              total, status, risk_score, risk_flags, created_at
       FROM orders
       WHERE risk_score >= $1
       ORDER BY risk_score DESC, created_at DESC
       LIMIT 200`,
      [minScore]
    );
    const orders = r.rows.map(o => ({ ...o, risk_label: riskLabel(o.risk_score || 0) }));
    res.json({ ok: true, orders });
  } catch (e) {
    console.error("GET /api/admin/fraud/orders:", e.message);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

app.get("/api/admin/fraud/blacklist", [requireAdmin], async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, type, value, reason, created_at FROM fraud_blacklist ORDER BY created_at DESC`
    );
    res.json({ ok: true, items: r.rows });
  } catch (e) { console.error(e); res.status(500).json({ ok: false }); }
});

app.post("/api/admin/fraud/blacklist", [requireAdmin], async (req, res) => {
  try {
    const type = String(req.body?.type || "").trim().toLowerCase();
    const value = String(req.body?.value || "").trim().toLowerCase();
    const reason = asNull(req.body?.reason);
    if (!["email", "phone", "ip", "cp"].includes(type)) {
      return res.status(400).json({ ok: false, error: "invalid_type" });
    }
    if (!value) return res.status(400).json({ ok: false, error: "value_required" });

    const r = await pool.query(
      `INSERT INTO fraud_blacklist (type, value, reason) VALUES ($1,$2,$3)
       ON CONFLICT (type, value) DO UPDATE SET reason = EXCLUDED.reason
       RETURNING id, type, value, reason, created_at`,
      [type, value, reason]
    );
    res.json({ ok: true, item: r.rows[0] });
  } catch (e) { console.error(e); res.status(500).json({ ok: false }); }
});

app.delete("/api/admin/fraud/blacklist/:id", [requireAdmin], async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: "invalid_id" });
    await pool.query(`DELETE FROM fraud_blacklist WHERE id = $1`, [id]);
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ ok: false }); }
});

app.get("/api/admin/fraud/zones", [requireAdmin], async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, type, value, severity, reason, created_at FROM fraud_risk_zones ORDER BY severity DESC, created_at DESC`
    );
    res.json({ ok: true, items: r.rows });
  } catch (e) { console.error(e); res.status(500).json({ ok: false }); }
});

app.post("/api/admin/fraud/zones", [requireAdmin], async (req, res) => {
  try {
    const type = String(req.body?.type || "").trim().toLowerCase();
    const value = String(req.body?.value || "").trim();
    const severity = Math.min(100, Math.max(0, parseInt(req.body?.severity, 10) || 30));
    const reason = asNull(req.body?.reason);
    if (!["cp", "city", "state", "colonia"].includes(type)) {
      return res.status(400).json({ ok: false, error: "invalid_type" });
    }
    if (!value) return res.status(400).json({ ok: false, error: "value_required" });

    const r = await pool.query(
      `INSERT INTO fraud_risk_zones (type, value, severity, reason) VALUES ($1,$2,$3,$4)
       RETURNING id, type, value, severity, reason, created_at`,
      [type, value, severity, reason]
    );
    res.json({ ok: true, item: r.rows[0] });
  } catch (e) { console.error(e); res.status(500).json({ ok: false }); }
});

app.delete("/api/admin/fraud/zones/:id", [requireAdmin], async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ ok: false, error: "invalid_id" });
    await pool.query(`DELETE FROM fraud_risk_zones WHERE id = $1`, [id]);
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ ok: false }); }
});

// ===================== HOME BANNERS / PROMOS (admin) =====================

async function ensureHomeBannersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS home_banners (
      id BIGSERIAL PRIMARY KEY,
      type TEXT NOT NULL DEFAULT 'header',
      title TEXT,
      image_url TEXT NOT NULL,
      link_url TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_home_banners_type_active
      ON home_banners (type, active, sort_order);
  `);
}

const BANNER_TYPES = new Set(["header", "monthly", "hotsale"]);

// Público: lista solo banners activos (cualquiera puede consultarlos)
app.get("/api/banners", async (req, res) => {
  try {
    const type = String(req.query.type || "").trim().toLowerCase();
    const params = [];
    let sql = `SELECT id, type, title, image_url, link_url, sort_order
               FROM home_banners
               WHERE active = true`;
    if (BANNER_TYPES.has(type)) {
      params.push(type);
      sql += ` AND type = $1`;
    }
    sql += ` ORDER BY sort_order ASC, id ASC`;
    const r = await pool.query(sql, params);
    res.json({ ok: true, banners: r.rows });
  } catch (e) {
    console.error("GET /api/banners:", e.message);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

// Admin: lista todo (incluyendo inactivos)
app.get("/api/admin/banners", [requireAdmin], async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, type, title, image_url, link_url, sort_order, active,
              created_at, updated_at
       FROM home_banners
       ORDER BY type, sort_order ASC, id ASC`
    );
    res.json({ ok: true, banners: r.rows });
  } catch (e) {
    console.error("GET /api/admin/banners:", e.message);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

// Admin: crear banner
app.post("/api/admin/banners", [requireAdmin], async (req, res) => {
  try {
    const type = String(req.body?.type || "header").trim().toLowerCase();
    const image_url = String(req.body?.image_url || "").trim();
    const title = asNull(req.body?.title);
    const link_url = asNull(req.body?.link_url);
    const sort_order = parseInt(req.body?.sort_order, 10) || 0;
    const active = req.body?.active !== false;

    if (!BANNER_TYPES.has(type)) {
      return res.status(400).json({ ok: false, error: "invalid_type" });
    }
    if (!image_url) {
      return res.status(400).json({ ok: false, error: "image_url_required" });
    }

    const r = await pool.query(
      `INSERT INTO home_banners (type, title, image_url, link_url, sort_order, active)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, type, title, image_url, link_url, sort_order, active, created_at`,
      [type, title, image_url, link_url, sort_order, active]
    );
    res.json({ ok: true, banner: r.rows[0] });
  } catch (e) {
    console.error("POST /api/admin/banners:", e.message);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

// Admin: actualizar (parcial)
app.patch("/api/admin/banners/:id", [requireAdmin], async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ ok: false, error: "invalid_id" });
    }

    const fields = [];
    const values = [];
    let i = 1;

    if (req.body?.type !== undefined) {
      const t = String(req.body.type).trim().toLowerCase();
      if (!BANNER_TYPES.has(t)) {
        return res.status(400).json({ ok: false, error: "invalid_type" });
      }
      fields.push(`type = $${i++}`); values.push(t);
    }
    if (req.body?.title !== undefined) {
      fields.push(`title = $${i++}`); values.push(asNull(req.body.title));
    }
    if (req.body?.image_url !== undefined) {
      const u = String(req.body.image_url || "").trim();
      if (!u) return res.status(400).json({ ok: false, error: "image_url_required" });
      fields.push(`image_url = $${i++}`); values.push(u);
    }
    if (req.body?.link_url !== undefined) {
      fields.push(`link_url = $${i++}`); values.push(asNull(req.body.link_url));
    }
    if (req.body?.sort_order !== undefined) {
      fields.push(`sort_order = $${i++}`); values.push(parseInt(req.body.sort_order, 10) || 0);
    }
    if (req.body?.active !== undefined) {
      fields.push(`active = $${i++}`); values.push(Boolean(req.body.active));
    }

    if (!fields.length) {
      return res.status(400).json({ ok: false, error: "no_fields" });
    }

    fields.push(`updated_at = now()`);
    values.push(id);

    const r = await pool.query(
      `UPDATE home_banners SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
      values
    );

    if (!r.rows.length) {
      return res.status(404).json({ ok: false, error: "not_found" });
    }
    res.json({ ok: true, banner: r.rows[0] });
  } catch (e) {
    console.error("PATCH /api/admin/banners/:id:", e.message);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

// Admin: eliminar
app.delete("/api/admin/banners/:id", [requireAdmin], async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ ok: false, error: "invalid_id" });
    }
    const r = await pool.query(`DELETE FROM home_banners WHERE id = $1`, [id]);
    res.json({ ok: true, deleted: r.rowCount > 0 });
  } catch (e) {
    console.error("DELETE /api/admin/banners/:id:", e.message);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

// ===================== 404 API (must be after ALL /api routes) =====================
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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
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
  ensureNewsletterTable()
    .then(() => console.log("Tabla newsletter_subscribers lista"))
    .catch((e) => console.error("No pude inicializar newsletter_subscribers:", e.message));
  ensurePasswordResetTokensTable()
    .then(() => console.log("Tabla password_reset_tokens lista"))
    .catch((e) => console.error("No pude inicializar password_reset_tokens:", e.message));
  ensureHomeBannersTable()
    .then(() => console.log("Tabla home_banners lista"))
    .catch((e) => console.error("No pude inicializar home_banners:", e.message));
  ensureFraudTablesAndColumns()
    .then(() => console.log("Tablas antifraude listas"))
    .catch((e) => console.error("No pude inicializar antifraude:", e.message));
});
