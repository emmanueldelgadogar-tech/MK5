// src/pages/Catalogo.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { API_BASE } from "../config";
import {
  addToCart,
  buildProductPath,
  estimateListPrice,
  formatMoney,
  getItemSku,
  getProductTitle,
} from "../utils/catalogoHelpers";
import { trackEvent } from "../utils/metrics";


import "../styles/catalogo.css";

import llantaPlaceholder from "../assets/llanta.png";
import iconClimaSeco from "../assets/icons/clima_seco.png";
import iconDeCarga from "../assets/icons/de_carga.png";
import iconLluvia from "../assets/icons/lluvia.png";
import iconSilencioso from "../assets/icons/manejo_silencioso.png";
import iconRunFlat from "../assets/icons/run_flat.png";
import iconAllTerrain from "../assets/icons/all_terrain.png";

import imgContinental from "../assets/CatalogoMarcas/bannercontinental.png";
import imgAntares from "../assets/CatalogoMarcas/antares banner.jpg";
import imgBlackhawk from "../assets/CatalogoMarcas/banner blackhawk.jpg";
import imgBridgestone from "../assets/CatalogoMarcas/banner bridgestone.jpg";
import imgCooper from "../assets/CatalogoMarcas/banner cooper.jpg";
import imgGoodyear from "../assets/CatalogoMarcas/banner goodyear.jpg";
import imgHankook from "../assets/CatalogoMarcas/banner hankook.jpg";
import imgMichelin from "../assets/CatalogoMarcas/banner michelin.jpg";
import imgPirelli from "../assets/CatalogoMarcas/banner pirelli.jpg";
import imgTornel from "../assets/CatalogoMarcas/banner tornel.jpg";
import logoContinental from "../assets/logos/continental.png";
import logoPirelli from "../assets/logos/pirelli.png";
import logoMichelin from "../assets/logos/michelin.png";
import logoBridgestone from "../assets/logos/bridgestone.png";
import logoGoodyear from "../assets/logos/goodyear.png";
import logoHankook from "../assets/logos/hankook.png";
import logoCooper from "../assets/logos/coopertires.png";
import logoEuzkadi from "../assets/logos/euzkadi.png";
import logoFirestone from "../assets/logos/firestone.png";
import logoLaufenn from "../assets/logos/laufenn.png";
import logoTornel from "../assets/logos/tornel.png";
import logoVinmax from "../assets/logos/vinmax.png";
import logoBlackhawk from "../assets/logos/blackhawk.png";
import logoAntares from "../assets/logos/antares.png";
import logoGeneral from "../assets/logos/generaltire.png";
import logoGoodrich from "../assets/logos/bfgoodrich.png";
import logoMirage from "../assets/logos/mirage.png";
import logoSaferich from "../assets/logos/saferich.png";
import logoJkTyre from "../assets/logos/jktyre.png";
import logoDoubleking from "../assets/logos/doubleking.png";
import logoOvation from "../assets/logos/ovation.png";
import logoAccelera from "../assets/logos/accelera.png";
import logoAgate from "../assets/logos/agate.png";
import logoAlfamotors from "../assets/logos/alfamotors.png";
import logoAnsu from "../assets/logos/ansu.png";
import logoAplus from "../assets/logos/aplus.png";
import logoArcron from "../assets/logos/arcron.png";
import logoArdent from "../assets/logos/ardent.png";
import logoAtlas from "../assets/logos/atlas.png";
import logoBlackarrow from "../assets/logos/blackarrow.png";
import logoBroadpeak from "../assets/logos/broadpeak.png";
import logoChuanshi from "../assets/logos/Chuanshi.png";
import logoDirezza from "../assets/logos/direzza.png";
import logoDstar from "../assets/logos/dstar.png";
import logoDunlop from "../assets/logos/dunlop.png";
import logoFalken from "../assets/logos/falken.png";
import logoForceland from "../assets/logos/forceland_new.jpg";
import logoForerunner from "../assets/logos/forerunner.png";
import logoFullrun from "../assets/logos/fullrun.png";
import logoGiti from "../assets/logos/giti.png";
import logoGopro from "../assets/logos/gopro.png";
import logoGreentrac from "../assets/logos/greentrac.png";
import logoGuteroad from "../assets/logos/guteroad.png";
import logoHaida from "../assets/logos/haida.png";
import logoIlink from "../assets/logos/ilink.png";
import logoKeter from "../assets/logos/keter.png";
import logoKpatos from "../assets/logos/kpatos.png";
import logoKumho from "../assets/logos/kumho.png";
import logoKustom from "../assets/logos/kustom.png";
import logoLinglong from "../assets/logos/linglone.png";
import logoMassimo from "../assets/logos/massimo.png";
import logoMaxtrek from "../assets/logos/maxtrek.png";
import logoMazzini from "../assets/logos/mazzini.png";
import logoMickeythompson from "../assets/logos/mickeythompson.jpg";
import logoMileking from "../assets/logos/mileking.png";
import logoMinnell from "../assets/logos/minnell.png";
import logoMrf from "../assets/logos/mrf.png";
import logoNexen from "../assets/logos/nexen.png";
import logoNovamaxx from "../assets/logos/novamaxx.png";
import logoRoadclaw from "../assets/logos/roadclaw.png";
import logoSierra from "../assets/logos/sierra.png";
import logoStarfire from "../assets/logos/starfire.png";
import logoSumaxx from "../assets/logos/sumaxx.png";
import logoPegasus from "../assets/logos/pegasus.png";
import logoSunew from "../assets/logos/sunew.png";
import logoTeraflex from "../assets/logos/teraflex.png";
import logoTransmate from "../assets/logos/transmate.png";
import logoUniroyal from "../assets/logos/uniroyal.png";
import logoWanliPng from "../assets/logos/wanli.png";
import logoWinrun from "../assets/logos/winrun.png";
import logoYusta from "../assets/logos/yusta.png";

const BRAND_SLUG_TO_DB = {
  continental: "CONTINENTAL",
  blackhawk: "BLACKHAWK",
  bridgestone: "BRIDGESTONE",
  cooper: "COOPER",
  goodyear: "GOODYEAR",
  hankook: "HANKOOK",
  michelin: "MICHELIN",
  pirelli: "PIRELLI",
  tornel: "TORNEL",
  antares: "ANTARES",
  jk: "TORNEL",
  "jk tyre": "TORNEL",
  jktyre: "TORNEL",
};

function slugToDbMarca(slug) {
  const s = (slug || "").toString().trim().toLowerCase();
  if (!s) return "";
  return (BRAND_SLUG_TO_DB[s] || s.toUpperCase()).trim();
}

const makeBrandMeta = (name, image, desc) => ({
  name,
  image,
  desc:
    desc ||
    `${name} ofrece rendimiento, seguridad y respaldo para tu manejo diario. En MK5 Llantas seleccionamos marcas confiables para que compres con certeza.`,
});

const BRAND_META = {
  CONTINENTAL: makeBrandMeta(
    "Continental",
    imgContinental,
    "Continental es una marca alemana reconocida por su tecnologia enfocada en seguridad y control. Sus llantas ofrecen gran frenado, estabilidad y desempeno en piso mojado para una conduccion comoda y confiable."
  ),
  ANTARES: makeBrandMeta("Antares", imgAntares),
  BLACKHAWK: makeBrandMeta("Blackhawk", imgBlackhawk),
  BRIDGESTONE: makeBrandMeta("Bridgestone", imgBridgestone),
  COOPER: makeBrandMeta("Cooper", imgCooper),
  GOODYEAR: makeBrandMeta("Goodyear", imgGoodyear),
  HANKOOK: makeBrandMeta("Hankook", imgHankook),
  MICHELIN: makeBrandMeta("Michelin", imgMichelin),
  PIRELLI: makeBrandMeta("Pirelli", imgPirelli),
  TORNEL: makeBrandMeta("Tornel", imgTornel),
};

const CARD_BRAND_LOGOS = {
  CONTINENTAL: logoContinental,
  PIRELLI: logoPirelli,
  MICHELIN: logoMichelin,
  BRIDGESTONE: logoBridgestone,
  GOODYEAR: logoGoodyear,
  HANKOOK: logoHankook,
  COOPER: logoCooper,
  COOPERTIRES: logoCooper,
  "COOPER TIRES": logoCooper,
  EUZKADI: logoEuzkadi,
  FIRESTONE: logoFirestone,
  LAUFENN: logoLaufenn,
  TORNEL: logoTornel,
  VINMAX: logoVinmax,
  BLACKHAWK: logoBlackhawk,
  ANTARES: logoAntares,
  GENERAL: logoGeneral,
  "GENERAL TIRE": logoGeneral,
  GENERALTIRE: logoGeneral,
  GOODRICH: logoGoodrich,
  "BF GOODRICH": logoGoodrich,
  BFGOODRICH: logoGoodrich,
  MIRAGE: logoMirage,
  "MIRAGE TIRES": logoMirage,
  SAFERICH: logoSaferich,
  WANLI: logoWanliPng,
  JKTYRE: logoJkTyre,
  "JK TYRE": logoJkTyre,
  DOUBLEKING: logoDoubleking,
  "DOUBLE KING": logoDoubleking,
  OVATION: logoOvation,
  "OVATION TIRES": logoOvation,
  PEGASUS: logoPegasus,
  ACCELERA: logoAccelera,
  AGATE: logoAgate,
  ALFAMOTORS: logoAlfamotors,
  ANSU: logoAnsu,
  APLUS: logoAplus,
  "A PLUS": logoAplus,
  ARCRON: logoArcron,
  ARDENT: logoArdent,
  ATLAS: logoAtlas,
  "ATLAS TIRES": logoAtlas,
  BLACKARROW: logoBlackarrow,
  "BLACK ARROW": logoBlackarrow,
  BROADPEAK: logoBroadpeak,
  "BROAD PEAK": logoBroadpeak,
  CHUANSHI: logoChuanshi,
  DIREZZA: logoDirezza,
  DSTAR: logoDstar,
  "D STAR": logoDstar,
  DUNLOP: logoDunlop,
  "DUNLOP TIRES": logoDunlop,
  FALKEN: logoFalken,
  "FALKEN TIRE": logoFalken,
  FORCELAND: logoForceland,
  FORERUNNER: logoForerunner,
  FULLRUN: logoFullrun,
  GITI: logoGiti,
  GOPRO: logoGopro,
  "GO PRO": logoGopro,
  GREENTRAC: logoGreentrac,
  GUTEROAD: logoGuteroad,
  "GUTE ROAD": logoGuteroad,
  HAIDA: logoHaida,
  ILINK: logoIlink,
  "I LINK": logoIlink,
  KETER: logoKeter,
  KPATOS: logoKpatos,
  KUMHO: logoKumho,
  "KUMHO TIRES": logoKumho,
  KUSTOM: logoKustom,
  LINGLONG: logoLinglong,
  "LINGLONG TIRE": logoLinglong,
  MASSIMO: logoMassimo,
  "MASSIMO TYRES": logoMassimo,
  MAXTREK: logoMaxtrek,
  MAZZINI: logoMazzini,
  "MICKEY THOMPSON": logoMickeythompson,
  MICKEYTHOMPSON: logoMickeythompson,
  MILEKING: logoMileking,
  "MILE KING": logoMileking,
  MINNELL: logoMinnell,
  MINNEL: logoMinnell,
  MRF: logoMrf,
  NEXEN: logoNexen,
  NOVAMAXX: logoNovamaxx,
  "NOVA MAXX": logoNovamaxx,
  ROADCLAW: logoRoadclaw,
  "ROAD CLAW": logoRoadclaw,
  SIERRA: logoSierra,
  "SIERRA TIRES": logoSierra,
  STARFIRE: logoStarfire,
  "STARFIRE TIRES": logoStarfire,
  SUMAXX: logoSumaxx,
  SUNEW: logoSunew,
  TERAFLEX: logoTeraflex,
  TRANSMATE: logoTransmate,
  UNIROYAL: logoUniroyal,
  WINRUN: logoWinrun,
  YUSTA: logoYusta,
};

const BRAND_CANONICAL_MAP = {
  "M,ASSIMO": "MASSIMO",
  "MASSIMO TYRES": "MASSIMO",
  MINELL: "MINNELL",
  MINNEL: "MINNELL",
  PAGASUS: "PEGASUS",
  EUZKADY: "EUZKADI",
  JK: "TORNEL",
  JKTYRE: "TORNEL",
  "JK TYRE": "TORNEL",
  LAUFEN: "HANKOOK",
  LAUFENN: "HANKOOK",
  "MICKY THOMSON": "MICKEY THOMPSON",
  "MICKEY THOMSON": "MICKEY THOMPSON",
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

const BRAND_FILTER_GROUPS = {
  EUZKADI: ["EUZKADI", "EUZKADY"],
  TORNEL: ["TORNEL", "JK", "JKTYRE", "JK TYRE"],
  HANKOOK: ["HANKOOK", "LAUFENN", "LAUFEN"],
  MASSIMO: ["MASSIMO", "M,ASSIMO", "MASSIMO TYRES"],
  MINNELL: ["MINNELL", "MINELL", "MINNEL"],
  PEGASUS: ["PEGASUS", "PAGASUS"],
  "MICKEY THOMPSON": ["MICKEY THOMPSON", "MICKEY THOMSON", "MICKY THOMSON"],
  KUSTOM: ["KUSTOM", "KUSTON"],
  LINGLONG: ["LINGLONG", "LING LONG", "LINGLONG TIRE"],
  COOPER: ["COOPER", "COOPER TIRES", "COOPERTIRES"],
  GOODRICH: ["GOODRICH", "BF GOODRICH", "BFGOODRICH"],
  GENERAL: ["GENERAL", "GENERAL TIRE", "GENERALTIRE"],
};

function normalizeCatalogBrand(value) {
  const upper = String(value || "").trim().toUpperCase();
  if (!upper) return "";
  return BRAND_CANONICAL_MAP[upper] || upper;
}

function expandCatalogBrandFilter(brand) {
  const canonical = normalizeCatalogBrand(brand);
  return BRAND_FILTER_GROUPS[canonical] || [canonical];
}

function parseMedidaParts(medida) {
  if (!medida) return null;
  const s = String(medida || "").toUpperCase().trim();
  // Acepta: 215/55/17  215-55-17  215 55 17  215.5517  21555R17  215/55R17
  const match = s.match(/^(\d{3})[\/\-\.\s]*(\d{2})[R\/\-\.\s]*(\d{2})$/);
  if (!match) return null;

  const ancho = parseInt(match[1], 10);
  const alto = parseInt(match[2], 10);
  const rin = parseInt(match[3], 10);

  if (!Number.isFinite(ancho) || !Number.isFinite(alto) || !Number.isFinite(rin)) return null;
  if (ancho < 100 || alto < 20 || rin < 10) return null;
  return { ancho, alto, rin };
}

function toggleSetValue(setter, value) {
  setter((prev) => {
    const next = new Set(prev);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  });
}

function Accordion({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="facc">
      <button
        type="button"
        className="facc__head"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="facc__title">{title}</span>
        <span className={`facc__chev ${open ? "is-open" : ""}`}>▾</span>
      </button>

      {open && <div className="facc__body">{children}</div>}
    </div>
  );
}

function stockInfo(stockValue) {
  const s = Number(stockValue || 0);
  if (s < 15) return { filled: 1, color: "red" };
  if (s < 50) return { filled: 2, color: "yellow" };
  return { filled: 3, color: "green" };
}

function isRunFlat(item) {
  const text = `${item?.modelo || ""} ${item?.marca || ""}`.toUpperCase();
  return text.includes("RUN FLAT") || text.includes("RFT");
}

function normalizePerfBrandKey(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizePerfModelKey(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/\s+\d{2,3}[A-Z]$/, "");
}

function normalizePerfSizeKey(value) {
  const raw = String(value || "").toUpperCase().trim().replace(/^P/, "");
  const match = raw.match(/(\d{3})[\/\-](\d{2})[R\/\-]?(\d{2})/);
  if (!match) return raw;
  return `${match[1]}/${match[2]}R${match[3]}`;
}

const VERIFIED_WET_GRIP_KEYS = new Set([
  "KPATOS|FM601|155/70R14",
  "VINMAX|ECOTOUR HP3|175/70R13",
  "PEGASUS|TOUR AS|175/70R13",
  "TORNEL|TURBO|175/70R13",
  "TORNEL|TURBO RADIAL TL|175/70R13",
  "TORNEL|ASTRAL PLUS|175/70R13",
  "ILINK|L-GRIP-55|175/70R13",
  "MAXTREK|MAXIMUSS M1|175/70R13",
  "ARCRON|OPTECO A1|175/70R13",
]);

function hasVerifiedWetGrip(item) {
  const brand = normalizePerfBrandKey(item?.marca);
  let model = normalizePerfModelKey(item?.modelo);
  if (brand && model.startsWith(`${brand} `)) {
    model = model.slice(brand.length + 1).trim();
  }
  const size = normalizePerfSizeKey(item?.medida);
  return VERIFIED_WET_GRIP_KEYS.has(`${brand}|${model}|${size}`);
}

function isCommercialLoadTire(item) {
  const full = `${item?.modelo || ""} ${item?.medida || ""} ${item?.marca || ""}`.toUpperCase();
  return (
    /\b(?:CARGO|VAN|COMMERCIAL|TRANSFORCE|TRASFORCE|DURAVIS|AGILIS|FLEET|LIGHT TRUCK)\b/.test(full) ||
    /\b(?:6PR|8PR|10PR|12PR|14PR)\b/.test(full) ||
    /\bLT\d{3}/.test(full) ||
    /\b\d{3}(?:\/\d{2})?R\d{2}C\b/.test(full)
  );
}

function getCardPerfIcons(item) {
  // Separar campos con | para evitar que palabras de campos distintos se combinen
  const full = ` ${String(item?.modelo || "").toUpperCase()} | ${String(item?.medida || "").toUpperCase()} | ${String(item?.marca || "").toUpperCase()} `;
  const offRoad    = /\bA\/T\b|\bAT\b|ALL[- ]TERRAIN|\bM\/T\b|\bMT\b|MUD[- ]TERRAIN|WILDPEAK|GEOLANDER|KO2|\bKO\b|DUELER A\/T|DISCOVERER\s*AT|OPEN[- ]COUNTRY|GRABBER|WRANGLER\s*[AM]T|BAJA|OUTLAW|XTERRAIN|X-TERRAIN/.test(full);
  const extremeMud = /\bM\/T\b|\bMT\b|MUD[- ]TERRAIN/.test(full);
  const icons = [];
  if (!offRoad) icons.push({ icon: iconClimaSeco, label: "Clima seco" });
  if (!extremeMud && hasVerifiedWetGrip(item)) icons.push({ icon: iconLluvia, label: "Piso mojado" });
  icons.push(                { icon: iconDeCarga,   label: "Índice de carga" });
  if (!offRoad && !extremeMud) icons.push({ icon: iconSilencioso, label: "Bajo ruido" });
  if (isRunFlat(item))       icons.push({ icon: iconRunFlat,    label: "Run Flat" });
  if (offRoad)               icons.push({ icon: iconAllTerrain, label: "All Terrain" });
  return icons
    .filter(({ icon }) => {
      if (icon === iconDeCarga) return isCommercialLoadTire(item);
      return true;
    })
    .map((entry) => (entry.icon === iconDeCarga ? { ...entry, label: "Indice de carga" } : entry));
}

export default function Catalogo() {
  const navigate = useNavigate();
  const location = useLocation();

  const { marca: marcaParam } = useParams();
  const marcaFixedUpper = slugToDbMarca(marcaParam);
  const brandMeta = marcaFixedUpper ? BRAND_META[marcaFixedUpper] : null;

  const [marcas, setMarcas] = useState([]);
  const [medidas, setMedidas] = useState([]);

  const [marcasSel, setMarcasSel] = useState(() => {
    try {
      const f = JSON.parse(sessionStorage.getItem("mk5_catalogo_filters") || "{}");
      return f.marcas?.length ? new Set(f.marcas.map((brand) => normalizeCatalogBrand(brand))) : new Set();
    } catch { return new Set(); }
  });
  const [anchosSel, setAnchosSel] = useState(() => {
    try {
      const f = JSON.parse(sessionStorage.getItem("mk5_catalogo_filters") || "{}");
      return f.anchos?.length ? new Set(f.anchos) : new Set();
    } catch { return new Set(); }
  });
  const [altosSel, setAltosSel] = useState(() => {
    try {
      const f = JSON.parse(sessionStorage.getItem("mk5_catalogo_filters") || "{}");
      return f.altos?.length ? new Set(f.altos) : new Set();
    } catch { return new Set(); }
  });
  const [rinesSel, setRinesSel] = useState(() => {
    try {
      const f = JSON.parse(sessionStorage.getItem("mk5_catalogo_filters") || "{}");
      return f.rines?.length ? new Set(f.rines) : new Set();
    } catch { return new Set(); }
  });

  // Persist filters to sessionStorage on every change
  useEffect(() => {
    sessionStorage.setItem("mk5_catalogo_filters", JSON.stringify({
      marcas: Array.from(marcasSel),
      anchos: Array.from(anchosSel),
      altos: Array.from(altosSel),
      rines: Array.from(rinesSel),
    }));
  }, [marcasSel, anchosSel, altosSel, rinesSel]);

  const [qUrl, setQUrl] = useState("");
  const [medidaUrl, setMedidaUrl] = useState("");

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [total, setTotal] = useState(0);

  const [items, setItems] = useState([]);
  const [qtyBySku, setQtyBySku] = useState({});

  // Build the canonical params string for a given filter state (used for cache keying)
  const buildParamsKey = useCallback(({ marcas, anchos, altos, rines, q = "" } = {}) => {
    const p = new URLSearchParams();
    const mFinal = new Set(marcas || []);
    if (marcaFixedUpper) { mFinal.clear(); mFinal.add(marcaFixedUpper); }
    const qF = (q || "").trim();
    if (qF) p.set("q", qF);
    if (mFinal.size) {
      const expandedBrands = Array.from(
        new Set(Array.from(mFinal).flatMap((brand) => expandCatalogBrandFilter(brand)))
      );
      p.set("marcas", expandedBrands.join(","));
    }
    if (anchos?.size) p.set("anchos", Array.from(anchos).join(","));
    if (altos?.size) p.set("altos", Array.from(altos).join(","));
    if (rines?.size) p.set("rines", Array.from(rines).join(","));
    p.set("sort", "price_asc");
    return p.toString();
  }, [marcaFixedUpper]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setQty = (sku, next) => {
    const key = String(sku || "").trim();
    if (!key) return;
    setQtyBySku((prev) => {
      const current = Math.max(parseInt(prev[key], 10) || 1, 1);
      const candidate = typeof next === "function" ? next(current) : next;
      return { ...prev, [key]: Math.max(parseInt(candidate, 10) || 1, 1) };
    });
  };

  const qtyFor = (sku) => {
    const key = String(sku || "").trim();
    return Math.max(parseInt(qtyBySku[key], 10) || 1, 1);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setQUrl((params.get("q") || "").trim());
    setMedidaUrl((params.get("medida") || "").trim());
  }, [location.search]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (marcaFixedUpper) params.set("marca", marcaFixedUpper);

    fetch(`${API_BASE}/api/catalogo/filtros?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        const normalizedBrands = Array.from(
          new Set((data.marcas || []).map((brand) => normalizeCatalogBrand(brand)).filter(Boolean))
        ).sort((a, b) => a.localeCompare(b, "es"));
        setMarcas(normalizedBrands);
        setMedidas(data.medidas || []);
      })
      .catch(() => {
        setMarcas([]);
        setMedidas([]);
      });
  }, [marcaFixedUpper]);

  const { anchos, altos, rines } = useMemo(() => {
    const A = new Set();
    const H = new Set();
    const R = new Set();

    for (const m of medidas || []) {
      const p = parseMedidaParts(m);
      if (!p) continue;
      A.add(p.ancho);
      H.add(p.alto);
      R.add(p.rin);
    }

    const sortNum = (x, y) => x - y;
    return {
      anchos: Array.from(A).sort(sortNum),
      altos: Array.from(H).sort(sortNum),
      rines: Array.from(R).sort(sortNum),
    };
  }, [medidas]);

  useEffect(() => {
    if (!medidaUrl) return;
    const p = parseMedidaParts(medidaUrl);
    if (!p) return;

    // Clear cache so filters apply immediately
    sessionStorage.removeItem("mk5_catalogo_results");
    sessionStorage.removeItem("mk5_catalogo_filters");
    setAnchosSel(new Set([p.ancho]));
    setAltosSel(new Set([p.alto]));
    setRinesSel(new Set([p.rin]));
  }, [medidaUrl]);

  const aplicarFiltros = async ({ append = false, pageOverride } = {}) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      const marcasFinal = new Set(marcasSel);
      if (marcaFixedUpper) {
        marcasFinal.clear();
        marcasFinal.add(marcaFixedUpper);
      }

      const qFinal = (qUrl || "").trim();
      if (qFinal) params.set("q", qFinal);

      if (marcasFinal.size) {
        const expandedBrands = Array.from(
          new Set(Array.from(marcasFinal).flatMap((brand) => expandCatalogBrandFilter(brand)))
        );
        params.set("marcas", expandedBrands.join(","));
      }
      // Merge medidaUrl into filter sets so first API call already has correct values
      const anchosFinal = new Set(anchosSel);
      const altosFinal  = new Set(altosSel);
      const rinesFinal  = new Set(rinesSel);
      if (medidaUrl) {
        const mp = parseMedidaParts(medidaUrl);
        if (mp) { anchosFinal.add(mp.ancho); altosFinal.add(mp.alto); rinesFinal.add(mp.rin); }
      }
      if (anchosFinal.size) params.set("anchos", Array.from(anchosFinal).join(","));
      if (altosFinal.size)  params.set("altos",  Array.from(altosFinal).join(","));
      if (rinesFinal.size)  params.set("rines",  Array.from(rinesFinal).join(","));

      params.set("sort", "price_asc");

      const nextPage = pageOverride ?? (append ? page + 1 : 1);
      params.set("page", String(nextPage));
      params.set("limit", "24");

      const res = await fetch(`${API_BASE}/api/catalogo/items?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const newItems = data.items || [];

      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setPage(data.page || nextPage);

      if (append) {
        setItems((prev) => [...prev, ...newItems]);
      } else {
        setItems(newItems);
        // Cache page-1 results for instant back-navigation restore
        try {
          sessionStorage.setItem("mk5_catalogo_results", JSON.stringify({
            items: newItems,
            total: data.total || 0,
            pages: data.pages || 1,
            page: data.page || nextPage,
            key: params.toString(),
            ts: Date.now(),
          }));
        } catch { }
      }
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar el catálogo. Reintenta.");
      setItems([]);
      setTotal(0);
      setPages(1);
      setPage(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if we have fresh cached results for exactly these filters
    try {
      const cached = JSON.parse(sessionStorage.getItem("mk5_catalogo_results") || "null");
      const currentKey = buildParamsKey({ marcas: marcasSel, anchos: anchosSel, altos: altosSel, rines: rinesSel, q: qUrl });
      if (cached && cached.key === currentKey && Date.now() - cached.ts < 3 * 60 * 1000) {
        setItems(cached.items);
        setTotal(cached.total);
        setPages(cached.pages);
        setPage(cached.page);
        return;
      }
    } catch { }

    setItems([]);
    setPage(1);
    setPages(1);
    setTotal(0);
    aplicarFiltros({ append: false, pageOverride: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marcaFixedUpper, qUrl, medidaUrl, marcasSel, anchosSel, altosSel, rinesSel, buildParamsKey]);

  const limpiar = () => {
    sessionStorage.removeItem("mk5_catalogo_filters");
    sessionStorage.removeItem("mk5_catalogo_results");
    if (!marcaFixedUpper) setMarcasSel(new Set());
    setAnchosSel(new Set());
    setAltosSel(new Set());
    setRinesSel(new Set());

    const target = marcaParam ? `/catalogo/${marcaParam}` : "/catalogo";
    navigate(target, { replace: true });

    setTimeout(() => aplicarFiltros({ append: false, pageOverride: 1 }), 0);
  };

  const totalSel =
    (marcaFixedUpper ? 0 : marcasSel.size) + anchosSel.size + altosSel.size + rinesSel.size;

  return (
    <main className="main catalogo catalogoWide">
      {mobileFiltersOpen && <div className="filters-overlay" onClick={() => setMobileFiltersOpen(false)} />}
      <aside className={`filters filters-ecom ${mobileFiltersOpen ? "filters--open" : ""}`}>
        <div className="filters-ecom__top">
          <h2>Filtros</h2>
          <button type="button" className="filters-ecom__close" onClick={() => setMobileFiltersOpen(false)} aria-label="Cerrar filtros">&times;</button>
          {totalSel > 0 && (
            <button type="button" className="filters-ecom__clear" onClick={limpiar}>
              Limpiar ({totalSel})
            </button>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            aplicarFiltros({ append: false, pageOverride: 1 });
          }}
        >
          {!marcaFixedUpper && (
            <Accordion title="Marca">
              <div className="fchk__list">
                {marcas.map((m) => {
                  const canonicalBrand = normalizeCatalogBrand(m);
                  const logo = CARD_BRAND_LOGOS[canonicalBrand] || null;
                  return (
                    <label
                      key={m}
                      className={`fchk${marcasSel.has(m) ? " fchk--active" : ""}${logo ? " fchk--with-logo" : ""}`}
                      aria-label={canonicalBrand}
                    >
                      <input
                        type="checkbox"
                        checked={marcasSel.has(m)}
                        onChange={() => toggleSetValue(setMarcasSel, m)}
                      />
                      {logo
                        ? (
                          <span className="fchk__logoWrap" aria-hidden="true">
                            <img src={logo} alt={canonicalBrand} className="fchk__logo" />
                          </span>
                        )
                        : <span className="fchk__dot" />
                      }
                      <span className="fchk__brand">{canonicalBrand}</span>
                    </label>
                  );
                })}
              </div>
            </Accordion>
          )}

          <Accordion title="Ancho">
            <div className="fpills">
              {anchos.map((a) => (
                <button
                  key={a}
                  type="button"
                  className={`fpill${anchosSel.has(a) ? " is-active" : ""}`}
                  onClick={() => toggleSetValue(setAnchosSel, a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </Accordion>

          <Accordion title="Alto de perfil">
            <div className="fpills">
              {altos.map((h) => (
                <button
                  key={h}
                  type="button"
                  className={`fpill${altosSel.has(h) ? " is-active" : ""}`}
                  onClick={() => toggleSetValue(setAltosSel, h)}
                >
                  {h}
                </button>
              ))}
            </div>
          </Accordion>

          <Accordion title="Rin">
            <div className="fpills">
              {rines.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`fpill${rinesSel.has(r) ? " is-active" : ""}`}
                  onClick={() => toggleSetValue(setRinesSel, r)}
                >
                  R{r}
                </button>
              ))}
            </div>
          </Accordion>

          <button className="filters-ecom__apply" type="submit" disabled={loading} onClick={() => setMobileFiltersOpen(false)}>
            {loading ? "Cargando..." : `Aplicar (${totalSel})`}
          </button>
        </form>
      </aside>

      <button className="filters-fab" type="button" onClick={() => setMobileFiltersOpen(true)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="8" cy="6" r="2" fill="currentColor"/><circle cx="16" cy="12" r="2" fill="currentColor"/><circle cx="10" cy="18" r="2" fill="currentColor"/></svg>
        Filtrar
      </button>

      <section className="results">
        {marcaFixedUpper && brandMeta && (
          <div className="brandHero">
            <div className="brandHero__media">
              <img src={brandMeta.image} alt={brandMeta.name} />
            </div>

            <div className="brandHero__info">
              <h1>Catálogo {brandMeta.name}</h1>
              <p>{brandMeta.desc}</p>

              <div className="brandHero__chips">
                <span>Instalación</span>
                <span>Garantía</span>
                <span>Atención WhatsApp</span>
              </div>
            </div>
          </div>
        )}

        <div className="catalogHead">
          <h2>{marcaFixedUpper ? `Productos ${marcaFixedUpper}` : "Resultados"}</h2>
          <small>{total} encontrados</small>
        </div>

        {/* Active filter chips */}
        {((!marcaFixedUpper && marcasSel.size > 0) || anchosSel.size > 0 || altosSel.size > 0 || rinesSel.size > 0) && (
          <div className="active-filters">
            {!marcaFixedUpper && Array.from(marcasSel).map((m) => (
              <button key={m} type="button" className="active-chip" onClick={() => toggleSetValue(setMarcasSel, m)}>
                {m} <span aria-hidden="true">×</span>
              </button>
            ))}
            {Array.from(anchosSel).map((a) => (
              <button key={a} type="button" className="active-chip" onClick={() => toggleSetValue(setAnchosSel, a)}>
                Ancho {a} <span aria-hidden="true">×</span>
              </button>
            ))}
            {Array.from(altosSel).map((h) => (
              <button key={h} type="button" className="active-chip" onClick={() => toggleSetValue(setAltosSel, h)}>
                /{h} <span aria-hidden="true">×</span>
              </button>
            ))}
            {Array.from(rinesSel).map((r) => (
              <button key={r} type="button" className="active-chip" onClick={() => toggleSetValue(setRinesSel, r)}>
                R{r} <span aria-hidden="true">×</span>
              </button>
            ))}
            <button type="button" className="active-chip active-chip--clear" onClick={limpiar}>
              Limpiar todo
            </button>
          </div>
        )}

        {error && <p className="catalogError">{error}</p>}
        {!error && items.length === 0 && !loading && <p>No hay resultados con esos filtros.</p>}

        <div className="catalog-grid">
          {items.map((it, idx) => {
            const skuKey = getItemSku(it) || `tmp-${idx}`;
            const price = Number(it?.precio || 0);
            const listPrice = estimateListPrice(price);
            const discountAmount = Math.max(listPrice - price, 0);
            const runFlat = isRunFlat(it);
            const canonicalBrand = normalizeCatalogBrand(it?.marca);
            const brandLogo = CARD_BRAND_LOGOS[canonicalBrand] || null;
            const productName = String(it?.modelo || "").trim() || getProductTitle(it);
            return (
              <article className="catalog-card" key={skuKey}>
              <div className="card-discount-ribbon">4x3 o 25% de descuento</div>
              <div className="card-perf-icons">
                  {getCardPerfIcons(it).map((a) => (
                    <img key={a.label} src={a.icon} alt={a.label} title={a.label} />
                  ))}
                </div>

                <Link
                  to={buildProductPath(it)}
                  state={{ item: it }}
                  className="card-image card-link"
                  onClick={() =>
                    trackEvent("product_click", {
                      sku: getItemSku(it),
                      source: "catalogo",
                    })
                  }
                >
                  <img
                    src={it.imagen || llantaPlaceholder}
                    alt={`${it.marca || ""} ${it.modelo || ""}`.trim()}
                    loading="lazy"
                    onError={(e) => { e.target.onerror = null; e.target.src = llantaPlaceholder; }}
                  />
                </Link>

                <div className="card-body">
                  <Link
                    to={buildProductPath(it)}
                    state={{ item: it }}
                    className="card-link card-title"
                    onClick={() =>
                      trackEvent("product_click", {
                        sku: getItemSku(it),
                        source: "catalogo",
                      })
                    }
                  >
                    <h3 className="model">{productName}</h3>
                  </Link>

                  {it.medida && <p className="card-medida">{it.medida}</p>}

                  <div className="card-brand-stock">
                    {brandLogo ? (
                        <img className="card-brand-stock__logo" src={brandLogo} alt={`Logo ${canonicalBrand || "Marca"}`} />
                      ) : (
                        <strong className="card-brand-stock__name">{canonicalBrand || "Marca"}</strong>
                      )}
                    {(() => {
                      const { filled, color } = stockInfo(it.stock);
                      return (
                        <div className="stock-indicator">
                          <span className="stock-indicator__label">Stock {Math.max(Number(it.stock || 0), 1)} pzas</span>
                          <div className="stock-indicator__bars">
                            {[1, 2, 3].map(n => (
                              <i key={n} className={n <= filled ? `is-on stock-bar--${color}` : ""} />
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="card-price">
                    <strong>{formatMoney(price)}</strong>
                    <small>{formatMoney(listPrice)}</small>
                    <span>-{Math.max(Math.round((discountAmount / Math.max(listPrice, 1)) * 100), 0)}%</span>
                  </div>
                  <p className="card-price-note">Precio final con 25% de descuento aplicado. Promo equivalente a 4x3.</p>

                  <div className="card-qty">
                    <span>Cantidad</span>
                    <div>
                      <button type="button" onClick={() => setQty(skuKey, (n) => n - 1)}>
                        -
                      </button>
                      <strong>{qtyFor(skuKey)}</strong>
                      <button type="button" onClick={() => setQty(skuKey, (n) => n + 1)}>
                        +
                      </button>
                    </div>
                  </div>

                  <div className="card-actions">
                    <button
                      className="btn-add-cart"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(it, qtyFor(skuKey));
                        alert("Agregado al carrito: " + getProductTitle(it));
                      }}
                    >
                      Agregar al carrito
                    </button>
                    <button
                      className="btn-buy-now"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(it, qtyFor(skuKey));
                        navigate("/checkout");
                      }}
                    >
                      Comprar ahora
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        <div className="catalogMore">
          {page < pages && (
            <button
              className="filters-ecom__apply catalogMore__btn"
              type="button"
              disabled={loading}
              onClick={() => aplicarFiltros({ append: true })}
            >
              {loading ? "Cargando..." : "Cargar más"}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
