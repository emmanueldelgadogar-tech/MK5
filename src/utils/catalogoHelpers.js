const CART_KEY = "mk5_cart";
const SKU_KEYS = ["sku", "SKU", "codigo", "codigo_sku", "clave"];

const BRAND_NAME_NORMALIZATION = {
  "M,ASSIMO": "MASSIMO",
  "MASSIMO TYRES": "MASSIMO",
  MINELL: "MINNELL",
  MINNEL: "MINNELL",
  PAGASUS: "PEGASUS",
  LAUFEN: "LAUFENN",
  "MICKY THOMSON": "MICKEY THOMPSON",
  "MICKEY THOMSON": "MICKEY THOMPSON",
  "MICKEY TOMSON": "MICKEY THOMPSON",
  KUSTON: "KUSTOM",
  "LING LONG": "LINGLONG",
  "LINGLONG TIRE": "LINGLONG",
  "COOPER TIRES": "COOPER",
  COOPERTIRES: "COOPER",
  "BF GOODRICH": "GOODRICH",
  BFGOODRICH: "GOODRICH",
  "GENERAL TIRE": "GENERAL",
  GENERALTIRE: "GENERAL",
};

const MODEL_TEXT_NORMALIZATION = [
  { pattern: /\bMICKY\s+THOMSON\b/gi, replacement: "Mickey Thompson" },
  { pattern: /\bMICKY\s+THOMSOM\b/gi, replacement: "Mickey Thompson" },
  { pattern: /\bMICK?EY\s+THOMS?ON\b/gi, replacement: "Mickey Thompson" },
  { pattern: /\bMICKY\s+THOMSOM\b/gi, replacement: "Mickey Thompson" },
  { pattern: /\bMICKEY\s+TOMSON\b/gi, replacement: "Mickey Thompson" },
];

function safeQty(v) {
  return Math.max(parseInt(v, 10) || 1, 1);
}

function safeStock(v) {
  return Math.max(parseInt(v, 10) || 0, 0);
}

export function formatMoney(value) {
  return Number(value || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 2,
  });
}

export function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeBrandName(value) {
  const raw = String(value || "").trim();
  const upper = raw.toUpperCase();
  if (!upper) return raw;
  return BRAND_NAME_NORMALIZATION[upper] || raw;
}

export function normalizeModelName(value) {
  let text = String(value || "").trim();
  for (const rule of MODEL_TEXT_NORMALIZATION) {
    text = text.replace(rule.pattern, rule.replacement);
  }
  return text;
}

export function buildProductSlug(item) {
  const medidaSlug = String(item?.medida || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/\//g, "-")
    .replace(/^(\d{3})-(\d{2})-(\d{2})$/, "$1-$2-r$3");

  const canonicalBrand = normalizeBrandName(item?.marca);
  const canonicalModel = normalizeModelName(item?.modelo);
  const chunks = ["llanta", medidaSlug, canonicalBrand, canonicalModel].filter(Boolean);
  const slug = slugify(chunks.join(" "));
  return slug || "llanta";
}

export function buildProductPath(item) {
  const slug = buildProductSlug(item);
  const sku = encodeURIComponent(String(item?.sku || "").trim());
  return sku ? `/${slug}/p?sku=${sku}` : `/${slug}/p`;
}

export function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) return [];

    const map = new Map();
    for (const row of parsed) {
      const sku =
        getItemSku(row) ||
        getItemSku(row?.snapshot) ||
        getItemSku(row?.item) ||
        getItemSku(row?.product);
      const qty = safeQty(row?.qty);
      if (!sku) continue;

      const prev = map.get(sku);
      if (prev) {
        map.set(sku, {
          sku,
          qty: prev.qty + qty,
          snapshot: prev.snapshot || row?.snapshot || null,
        });
      } else {
        map.set(sku, {
          sku,
          qty,
          snapshot: row?.snapshot || null,
        });
      }
    }

    return Array.from(map.values());
  } catch {
    return [];
  }
}

export function writeCart(items) {
  const rows = Array.isArray(items)
    ? items
        .map((it) => ({
          sku: String(it?.sku || "").trim(),
          qty: safeQty(it?.qty),
          snapshot: it?.snapshot || null,
        }))
        .filter((it) => it.sku)
    : [];
  localStorage.setItem(CART_KEY, JSON.stringify(rows));
}

export function getItemSku(item) {
  for (const key of SKU_KEYS) {
    const value = String(item?.[key] || "").trim();
    if (value) return value;
  }
  return "";
}

export function addToCart(item, qty = 1) {
  const sku = getItemSku(item);
  if (!sku) return false;

  const safeQty = Math.max(parseInt(qty, 10) || 1, 1);
  try {
    const cart = readCart();
    const idx = cart.findIndex((row) => String(row?.sku || "").trim() === sku);

    const snapshot = {
      marca: item?.marca || "",
      modelo: item?.modelo || "",
      medida: item?.medida || "",
      precio: Number(item?.precio || 0),
      stock: safeStock(item?.stock),
    };

    const maxStock = safeStock(item?.stock);

    if (idx >= 0) {
      const nextQty = Math.max(parseInt(cart[idx]?.qty, 10) || 0, 0) + safeQty;
      cart[idx] = {
        ...cart[idx],
        qty: maxStock > 0 ? Math.min(nextQty, maxStock) : nextQty,
        snapshot: cart[idx]?.snapshot || snapshot,
      };
    } else {
      cart.push({
        sku,
        qty: maxStock > 0 ? Math.min(safeQty, maxStock) : safeQty,
        snapshot,
      });
    }

    writeCart(cart);
    window.dispatchEvent(new Event("mk5-cart-updated"));
    return true;
  } catch {
    return false;
  }
}

export function estimateListPrice(precio) {
  const value = Number(precio || 0);
  if (!value) return 0;
  return value / 0.70;
}

export function getProductTitle(item) {
  const marca = normalizeBrandName(item?.marca);
  const medida = String(item?.medida || "").trim();
  const modelo = normalizeModelName(item?.modelo);

  if (!modelo) return `Llanta ${medida} ${marca}`.replace(/\s+/g, " ").trim();

  const modelUp = modelo.toUpperCase();
  const marcaUp = marca.toUpperCase();
  const medidaUp = medida.toUpperCase();

  const hasMarca = marcaUp && modelUp.includes(marcaUp);
  const hasMedida = medidaUp && modelUp.includes(medidaUp);

  if (hasMarca || hasMedida) {
    return modelUp.startsWith("LLANTA") ? modelo : `Llanta ${modelo}`.trim();
  }

  return `Llanta ${medida} ${marca} ${modelo}`.replace(/\s+/g, " ").trim();
}
