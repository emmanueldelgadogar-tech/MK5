import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

/* ── Reseñas de productos ── */
const REVIEWS_DB = [
  {
    author: "Carlos M.",
    location: "Toluca, EDOMEX",
    rating: 5,
    date: "hace 2 semanas",
    title: "Excelente calidad, llegaron rápido",
    text: "Llegaron en perfectas condiciones. Las monté en mi Nissan Sentra y el agarre mejoró notablemente, sobre todo en piso mojado. La instalación fue muy rápida en sucursal. 100% recomendadas.",
    verified: true,
  },
  {
    author: "Laura G.",
    location: "Metepec, EDOMEX",
    rating: 5,
    date: "hace 1 mes",
    title: "Mejor precio que en cualquier otro lado",
    text: "Busqué en varios lugares y MK5 tenía el mejor precio por mucho. El envío fue en 2 días y el producto llegó sellado y nuevo. Muy satisfecha con la compra.",
    verified: true,
  },
  {
    author: "Roberto A.",
    location: "Ciudad de México",
    rating: 4,
    date: "hace 1 mes",
    title: "Buena llanta, atención por WhatsApp muy ágil",
    text: "El producto es exactamente lo que esperaba. Tuve una duda sobre la medida y me respondieron en minutos por WhatsApp. Resté una estrella porque el envío tardó un día más de lo indicado, pero en general muy buena experiencia.",
    verified: true,
  },
  {
    author: "Diana R.",
    location: "Lerma, EDOMEX",
    rating: 5,
    date: "hace 2 meses",
    title: "Compra segura, llantas de primera",
    text: "Ya es la segunda vez que compro aquí. La primera fue para mi Honda City y ahora para la camioneta de mi esposo. Siempre llegan bien empacadas y la garantía da mucha confianza. No compraría en otro lado.",
    verified: true,
  },
];

/* ── Vehículos compatibles por medida (mercado mexicano) ── */
const VEHICULOS_POR_MEDIDA = {
  // Compactos / subcompactos
  "155/70R13": ["Chevrolet Spark", "Daewoo Matiz", "Kia Picanto", "Fiat Seicento"],
  "165/70R13": ["Chevrolet Spark", "Nissan Micra", "VW Lupo"],
  "175/70R13": [
    "Nissan Tsuru",
    "VW Sedan (Vocho)",
    "SEAT Marbella",
    "Ford Ka",
    "Renault Clio",
    "Fiat Uno",
  ],
  "175/65R14": ["Chevrolet Spark", "Nissan March", "Fiat 500", "VW Gol"],
  "185/60R14": ["Chevrolet Aveo", "Kia Rio", "Hyundai Accent", "Renault Logan"],
  "185/65R14": ["Nissan Tiida", "Toyota Yaris", "Chevrolet Sonic", "Ford Fiesta"],
  "185/60R15": ["VW Polo", "Renault Sandero", "Peugeot 207", "SEAT Ibiza 1.4"],
  "185/65R15": ["Honda City", "Nissan March", "Chevrolet Aveo", "Kia Rio", "Hyundai Accent"],
  "195/50R15": ["Honda Civic", "Mazda 3", "SEAT León"],
  "195/55R15": ["VW Golf A4", "SEAT Ibiza", "Opel Astra"],
  "195/60R15": ["Toyota Yaris", "Nissan Tiida", "Chevrolet Beat"],
  "195/65R15": ["VW Jetta A5", "SEAT Ibiza", "Chevrolet Aveo", "Ford Focus", "Nissan Tsuru"],
  // Sedán / compacto mediano
  "195/55R16": ["VW Golf VII", "SEAT León", "Skoda Octavia"],
  "205/45R16": ["Honda Civic", "Mazda 3", "SEAT Ibiza FR"],
  "205/55R16": ["VW Jetta", "VW Golf", "SEAT León", "Mazda 3", "Toyota Corolla", "Nissan Sentra"],
  "205/60R16": ["Toyota Camry", "Honda Accord", "Nissan Altima", "Ford Fusion"],
  "205/65R15": ["Nissan Sentra B14", "Toyota Corolla", "Honda Civic"],
  "205/65R16": ["Nissan X-Trail", "Hyundai Tucson", "Kia Sportage"],
  "215/45R17": ["Honda Civic Si", "Mazda 6", "Toyota Corolla SE"],
  "215/50R17": ["Toyota Corolla", "Honda Civic", "Nissan Sentra"],
  "215/55R17": ["Toyota RAV4", "Honda CR-V", "Nissan Qashqai", "Mazda CX-5"],
  "215/60R16": ["Nissan Altima", "Toyota Camry", "Chevrolet Malibu"],
  "215/60R17": ["Toyota Sienna", "Nissan Pathfinder", "Chevrolet Orlando"],
  "215/65R16": ["Toyota Corolla", "Honda CR-V", "Nissan X-Trail"],
  "225/45R17": ["VW Tiguan", "Chevrolet Equinox", "Ford Edge", "Audi A3"],
  "225/45R18": ["VW Passat", "Audi A4", "BMW Serie 1", "Mercedes CLA"],
  "225/50R17": ["BMW Serie 3", "Audi A4", "Mercedes C200"],
  "225/55R17": ["BMW Serie 3", "Volvo S60", "Ford Taurus"],
  "225/60R16": ["Toyota RAV4 2.4", "Honda CR-V", "Nissan Murano"],
  "225/60R17": ["Toyota Camry XLE", "Nissan Murano", "Ford Escape"],
  "225/60R18": ["Toyota Highlander", "Lexus RX", "Nissan Murano"],
  "225/65R17": ["Chevrolet Trax", "Nissan X-Trail", "Toyota RAV4", "Ford Escape"],
  "225/65R16": ["Honda Pilot", "Toyota Highlander", "Nissan Murano"],
  // SUV / Crossover
  "235/50R18": ["Toyota RAV4", "Mazda CX-5", "Honda CR-V", "Kia Sportage"],
  "235/55R17": ["Toyota Highlander", "Ford Explorer", "Jeep Grand Cherokee"],
  "235/55R18": ["Chevrolet Equinox", "Ford Edge", "Jeep Cherokee"],
  "235/60R16": ["Toyota 4Runner", "Nissan Pathfinder", "Jeep Liberty"],
  "235/60R18": ["Ford Explorer", "Jeep Grand Cherokee", "Dodge Durango"],
  "235/65R17": ["Toyota 4Runner", "Nissan Pathfinder", "Honda Pilot", "Ford Explorer"],
  "235/70R16": ["Toyota 4Runner", "Nissan Pathfinder", "Mitsubishi Montero Sport"],
  "245/45R18": ["BMW Serie 3", "Audi A4", "Mercedes C200", "VW Passat"],
  "245/50R18": ["BMW Serie 5", "Audi A6", "Mercedes E-Class"],
  "245/55R19": ["Ford Explorer", "Jeep Grand Cherokee", "Dodge Durango"],
  "245/60R18": ["Chevrolet Equinox", "Ford Escape", "GMC Terrain"],
  "245/65R17": ["Chevrolet Tahoe", "Toyota Sequoia", "Ford Expedition"],
  "255/50R19": ["Chevrolet Equinox", "Ford Flex", "Buick Enclave"],
  "255/55R18": ["Ford Explorer", "GMC Acadia", "Chevrolet Traverse"],
  "255/60R18": ["Chevrolet Suburban", "GMC Yukon", "Ford Expedition"],
  "255/65R17": ["Toyota 4Runner", "Nissan Xterra", "Jeep Wrangler"],
  "255/70R16": ["Toyota Land Cruiser", "Nissan Xterra", "Mitsubishi Montero"],
  "265/50R20": ["RAM 1500", "Ford F-150", "Chevrolet Silverado"],
  "265/60R18": ["Chevrolet Tahoe", "Ford F-150", "Toyota Tundra"],
  "265/65R17": ["Chevrolet Silverado", "Ford F-150", "GMC Sierra", "RAM 1500", "Toyota Tundra"],
  "265/70R16": ["Chevrolet Silverado", "Ford F-150", "GMC Sierra", "Dodge Ram"],
  "265/70R17": ["Toyota Hilux", "Chevrolet Silverado", "Ford Ranger", "Nissan Frontier"],
  "275/55R20": ["RAM 1500", "Ford F-150 FX4", "Chevrolet Silverado LTZ"],
  "275/60R20": ["RAM 1500", "Ford F-150", "GMC Sierra 1500"],
  "275/65R18": ["Ford F-250", "RAM 2500", "Toyota Tundra Platinum"],
  "285/50R20": ["Ford F-150 Raptor", "Ram 1500 TRX", "GMC Sierra AT4"],
  "285/65R18": ["Ford F-250", "RAM 2500", "Chevrolet Silverado HD"],
  "285/70R17": ["Ford F-250", "RAM 2500", "Toyota Tundra", "Nissan Titan"],
  "305/55R20": ["Ford F-150 Raptor", "RAM TRX", "GMC Canyon AT4X"],
  // Vehículos de alto desempeño
  "225/40R18": ["BMW M3", "Audi TT", "VW Golf GTI", "Renault Megane RS"],
  "235/40R18": ["Audi A3", "VW Golf R", "BMW 1 Series"],
  "245/35R19": ["BMW M5", "Audi S5", "Mercedes AMG C"],
  "255/35R18": ["BMW M3", "Porsche Boxster", "Audi R8"],
  "275/35R18": ["BMW M3", "Porsche 911", "Ferrari"],
  "245/40R18": ["BMW M3", "Audi S4", "Mercedes C63"],
};

function normalizeMedidaKey(medida) {
  const raw = String(medida || "").toUpperCase().trim();
  // Acepta rin de 1-2 dígitos (ej. R8, R13, R22)
  const m = raw.match(/(\d{3})[\/\-](\d{2})[R\/\-]?(\d{1,2})/);
  if (!m) return null;
  return `${m[1]}/${m[2]}R${m[3]}`;
}
import { API_BASE } from "../config";
import llantaPlaceholder from "../assets/llanta.png";
import iconClimaSeco from "../assets/icons/clima_seco.png";
import iconDeCarga from "../assets/icons/de_carga.png";
import iconLluvia from "../assets/icons/lluvia.png";
import iconSilencioso from "../assets/icons/manejo_silencioso.png";
import iconRunFlat from "../assets/icons/run_flat.png";
import iconAllTerrain from "../assets/icons/all_terrain.png";
import logoContinental from "../assets/logos/continental.png";
import logoPirelli from "../assets/logos/pirelli.png";
import logoMichelin from "../assets/logos/michelin.png";
import logoBridgestone from "../assets/logos/bridgestone.png";
import logoGoodyear from "../assets/logos/goodyear.png";
import logoHankook from "../assets/logos/hankook.png";
import logoVinmax from "../assets/logos/vinmax.png";
import logoKumho from "../assets/logos/kumho.png";
import logoDunlop from "../assets/logos/dunlop.png";
import logoFalken from "../assets/logos/falken.png";
import logoNexen from "../assets/logos/nexen.png";
import logoMirage from "../assets/logos/mirage.png";
import logoAgate from "../assets/logos/agate.png";
import logoPegasus from "../assets/logos/pegasus.png";
import logoBlackhawk from "../assets/logos/blackhawk.png";
import logoFirestone from "../assets/logos/firestone.png";
import logoEuzkadi from "../assets/logos/euzkadi.png";
import logoLaufenn from "../assets/logos/laufenn.png";
import logoKpatos from "../assets/logos/kpatos.png";
import {
  addToCart,
  buildProductPath,
  buildProductSlug,
  estimateListPrice,
  formatMoney,
  getProductTitle,
} from "../utils/catalogoHelpers";
import { trackEvent } from "../utils/metrics";
import "../styles/catalogo.css";

const BRAND_LOGOS = {
  CONTINENTAL: logoContinental,
  PIRELLI: logoPirelli,
  MICHELIN: logoMichelin,
  BRIDGESTONE: logoBridgestone,
  GOODYEAR: logoGoodyear,
  HANKOOK: logoHankook,
  VINMAX: logoVinmax,
  KUMHO: logoKumho,
  DUNLOP: logoDunlop,
  FALKEN: logoFalken,
  NEXEN: logoNexen,
  MIRAGE: logoMirage,
  AGATE: logoAgate,
  PEGASUS: logoPegasus,
  BLACKHAWK: logoBlackhawk,
  FIRESTONE: logoFirestone,
  EUZKADI: logoEuzkadi,
  LAUFENN: logoLaufenn,
  KPATOS: logoKpatos,
};

function availabilityLevel(stockValue) {
  const stock = Number(stockValue || 0);
  if (stock >= 100) return 5;
  if (stock >= 50) return 4;
  if (stock >= 20) return 3;
  if (stock >= 10) return 2;
  return 1;
}

function parseMedida(medida) {
  const raw = String(medida || "").toUpperCase().trim();
  const m = raw.match(/^(\d{3})[\/-](\d{2})[R\/-]?(\d{2})/);
  if (!m) return null;
  return {
    ancho: m[1],
    perfil: m[2],
    rin: m[3],
  };
}

function parseLoadAndSpeed(modelo) {
  const text = String(modelo || "").toUpperCase().trim();
  const m = text.match(/(\d{2,3})([A-Z])(?:\s|$)/);
  if (!m) return { carga: "-", velocidad: "-" };
  const speedMap = {
    H: "210 km/h",
    V: "240 km/h",
    W: "270 km/h",
    T: "190 km/h",
    S: "180 km/h",
    R: "170 km/h",
    Y: "300 km/h",
  };
  return {
    carga: m[1],
    velocidad: `${m[2]} (${speedMap[m[2]] || "N/A"})`,
  };
}

function normalizeBrandKey(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeModelKey(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

function normalizeSizeKey(value) {
  const raw = String(value || "").toUpperCase().trim().replace(/^P/, "");
  const match = raw.match(/(\d{3})[\/\-](\d{2})[R\/\-]?(\d{2})/);
  if (!match) return raw;
  return `${match[1]}/${match[2]}R${match[3]}`;
}

const VERIFIED_TIRE_SPECS = {
  "KPATOS|FM601|155/70R14": {
    utqg: "360 A A",
    treadwear: "360",
    traction: "A",
    temperature: "A",
    season: "Verano / Highway Terrain",
    segment: "Turismo",
    vehicleType: "Sedan / Hatchback",
    brandStory:
      "Kpatos es una marca china comercializada por Qingdao Sunfulcess Tyre Co., Ltd., empresa establecida en 2015. Hoy suma mas de 10 anos en el mercado internacional con lineas para auto, SUV y uso comercial.",
    usageNote:
      "En esta configuracion FM601 se enfoca en trayectos de ciudad y carretera, buscando una conduccion estable, buen drenaje en mojado y desgaste equilibrado para uso diario.",
    sourceNote: "UTQG verificado para la medida 155/70R14.",
  },
  "VINMAX|ECOTOUR HP3|175/70R13": {
    utqg: "400 AA A",
    treadwear: "400",
    traction: "AA",
    temperature: "A",
    season: "Touring / Verano",
    segment: "Turismo",
    vehicleType: "Sedan / Hatchback",
    brandStory:
      "Vinmax es una marca china asociada a Anhui Jichi Tire Co. Ltd., fabricante reportado desde 2011 con lineas enfocadas en llantas de pasajero de costo accesible para uso diario.",
    usageNote:
      "La linea Ecotour HP3 esta pensada para trayectos de ciudad y carretera, priorizando una conduccion estable, desgaste uniforme y manejo comodo en autos compactos y subcompactos.",
    sourceNote: "UTQG verificado para la medida 175/70R13.",
  },
  "PEGASUS|TOUR AS|175/70R13": {
    utqg: "560 A A",
    treadwear: "560",
    traction: "A",
    temperature: "A",
    season: "All-Season / Highway Terrain",
    segment: "Turismo",
    vehicleType: "Sedan / Hatchback",
    sourceNote: "UTQG verificado para la medida 175/70R13 82H.",
  },
  "TORNEL|TURBO|175/70R13": {
    utqg: "360 A B",
    treadwear: "360",
    traction: "A",
    temperature: "B",
    season: "Todas las estaciones",
    segment: "Turismo",
    vehicleType: "Sedan / Hatchback",
    sourceNote: "UTQG verificado para la medida 175/70R13 82T.",
  },
  "TORNEL|TURBO RADIAL TL|175/70R13": {
    utqg: "360 A B",
    treadwear: "360",
    traction: "A",
    temperature: "B",
    season: "Todas las estaciones",
    segment: "Turismo",
    vehicleType: "Sedan / Hatchback",
    sourceNote: "UTQG verificado para la medida 175/70R13 82T.",
  },
  "TORNEL|ASTRAL PLUS|175/70R13": {
    utqg: "360 A B",
    treadwear: "360",
    traction: "A",
    temperature: "B",
    season: "Todas las estaciones",
    segment: "Turismo",
    vehicleType: "Sedan / Hatchback",
    sourceNote: "UTQG verificado para la medida 175/70R13 82T.",
  },
  "ILINK|L-GRIP-55|175/70R13": {
    utqg: "400 A A",
    treadwear: "400",
    traction: "A",
    temperature: "A",
    season: "Todas las estaciones",
    segment: "Turismo",
    vehicleType: "Sedan / Hatchback",
    sourceNote: "UTQG verificado para la medida 175/70R13 82T.",
  },
  "MAXTREK|MAXIMUSS M1|175/70R13": {
    utqg: "400 A B",
    treadwear: "400",
    traction: "A",
    temperature: "B",
    season: "Verano / Highway Terrain",
    segment: "Turismo",
    vehicleType: "Sedan / Hatchback",
    sourceNote: "UTQG verificado para la medida 175/70R13 82T.",
  },
  "ARCRON|OPTECO A1|175/70R13": {
    utqg: "380 A A",
    treadwear: "380",
    traction: "A",
    temperature: "A",
    season: "Verano / Highway Terrain",
    segment: "Turismo",
    vehicleType: "Sedan / Hatchback",
    sourceNote: "UTQG verificado para la medida 175/70R13 82T.",
  },
};

const BRAND_PROFILES = {
  KPATOS: {
    story:
      "Kpatos es una marca china con mas de 10 anos en el mercado internacional, enfocada en ofrecer llantas de turismo y SUV con buena relacion costo-beneficio para manejo diario.",
    focus:
      "Suele ser una opcion atractiva para trayectos de ciudad porque busca una conduccion estable, bajo ruido y respuesta predecible en seco y mojado.",
  },
  VINMAX: {
    story:
      "Vinmax es una marca china orientada al segmento economico, enfocada en llantas para uso urbano y carretera con una propuesta accesible para autos de diario.",
    focus:
      "En medidas de turismo como esta, prioriza trayectos de ciudad, manejo comodo y una conduccion estable para sedan y hatchback.",
  },
};

const MEXICO_VEHICLE_OVERRIDES = {
  "155/70R13": ["Chevrolet Spark", "Chevrolet Matiz", "Hyundai Atos", "Kia Picanto"],
};

const MEXICO_VEHICLE_ALIASES = {
  "DAEWOO MATIZ": "Chevrolet Matiz",
};

const MEXICO_BRAND_PRIORITY = [
  "NISSAN",
  "CHEVROLET",
  "FORD",
  "VW",
  "VOLKSWAGEN",
  "TOYOTA",
  "HONDA",
  "HYUNDAI",
  "KIA",
  "RENAULT",
  "MAZDA",
  "SEAT",
  "MITSUBISHI",
  "JEEP",
  "RAM",
  "GMC",
  "AUDI",
  "BMW",
  "MERCEDES",
];

const MEXICO_ALLOWED_BRANDS = new Set(MEXICO_BRAND_PRIORITY);

function getVerifiedTireSpec(item) {
  const brand = normalizeBrandKey(item?.marca);
  let modelo = normalizeModelKey(item?.modelo).replace(/\s+\d{2,3}[A-Z]$/, "");
  if (brand && modelo.startsWith(`${brand} `)) {
    modelo = modelo.slice(brand.length + 1).trim();
  }
  const medida = normalizeSizeKey(item?.medida);
  return VERIFIED_TIRE_SPECS[`${brand}|${modelo}|${medida}`] || null;
}

function getBrandProfile(item) {
  return BRAND_PROFILES[normalizeBrandKey(item?.marca)] || null;
}

function getVehicleCategory(vehicle) {
  const text = String(vehicle || "").toUpperCase();
  if (/HILUX|RANGER|TACOMA|DAKOTA|SILVERADO|F-150|RAM|TITAN|TUNDRA/.test(text)) return "pickup";
  if (/X-TRAIL|XTERRA|TAHOE|SUBURBAN|EXPLORER|DURANGO|4RUNNER|CR-V|RAV4|PATHFINDER|MURANO|SPORTAGE|TUCSON|PILOT|HIGHLANDER|MONTERO/.test(text)) return "suv";
  return "sedan";
}

function getVehicleBrandMeta(vehicle) {
  const raw = String(vehicle || "").trim();
  const upper = raw.toUpperCase();
  const knownBrands = [
    "LAND CRUISER",
    "MERCEDES",
    "VOLKSWAGEN",
    "CHEVROLET",
    "MITSUBISHI",
    "RENAULT",
    "NISSAN",
    "TOYOTA",
    "HONDA",
    "HYUNDAI",
    "FORD",
    "FIAT",
    "SEAT",
    "MAZDA",
    "BMW",
    "AUDI",
    "RAM",
    "GMC",
    "KIA",
    "JEEP",
    "VW",
  ];

  const brandKey = knownBrands.find((brand) => upper.startsWith(`${brand} `)) || raw.split(/\s+/)[0].toUpperCase();
  const labelMap = {
    VOLKSWAGEN: "VW",
    LAND: "LAND",
  };
  const brandLabel = labelMap[brandKey] || brandKey;
  const model = raw.slice(brandKey.length).trim() || raw;

  return { brandKey, brandLabel, model };
}

function getMexicoMarketVehicles(medidaKey, vehicles) {
  const override = MEXICO_VEHICLE_OVERRIDES[medidaKey];
  if (override?.length) return override;

  const normalized = (vehicles || [])
    .map((vehicle) => MEXICO_VEHICLE_ALIASES[String(vehicle || "").toUpperCase()] || vehicle)
    .filter(Boolean);

  const unique = Array.from(new Map(normalized.map((vehicle) => [String(vehicle).toUpperCase(), vehicle])).values());

  return unique
    .filter((vehicle) => {
      const { brandKey } = getVehicleBrandMeta(vehicle);
      return MEXICO_ALLOWED_BRANDS.has(brandKey);
    })
    .sort((a, b) => {
      const aBrand = getVehicleBrandMeta(a).brandKey;
      const bBrand = getVehicleBrandMeta(b).brandKey;
      const aIndex = MEXICO_BRAND_PRIORITY.indexOf(aBrand);
      const bIndex = MEXICO_BRAND_PRIORITY.indexOf(bBrand);
      const safeA = aIndex === -1 ? 999 : aIndex;
      const safeB = bIndex === -1 ? 999 : bIndex;
      if (safeA !== safeB) return safeA - safeB;
      return String(a).localeCompare(String(b), "es");
    })
    .slice(0, 6);
}

function isRunFlatModel(modelo) {
  const text = String(modelo || "").toUpperCase();
  return /\bRFT\b|RUN[- ]FLAT|RUNFLAT|\bSSR\b|\bROF\b|\bMOE\b/.test(text);
}

/* ── Detectar si es llanta AT/off-road con word boundaries ── */
function isAllTerrain(full) {
  return /\bA\/T\b|\bAT\b|ALL[- ]TERRAIN|ALL[- ]TERR|\bM\/T\b|\bMT\b|MUD[- ]TERRAIN|WILDPEAK|GEOLANDER|KO2|\bKO\b|DUELER A\/T|DISCOVERER\s*AT|RIDGE\s*AT|TERRITORY\s*AT|ROCK\s*CRAWL|BAJA|OUTLAW|X-TERRAIN|XTERRAIN|\bRDT\b|ADVENTURE\s*AT|OPEN[- ]COUNTRY|GRABBER|WRANGLER\s*[AM]T|RANGER\s*[AM]T/.test(full);
}

function isExtremeMudTerrain(full) {
  return /\bM\/T\b|\bMT\b|MUD[- ]TERRAIN|MUD\s*TERRAIN/.test(full);
}

/* ── Atributos de desempeño basados en datos reales ── */
function getTireAttributes(item) {
  const modelo = String(item?.modelo || "").toUpperCase();
  const medida = String(item?.medida || "").toUpperCase();
  const marca = String(item?.marca || "").toUpperCase();
  // IMPORTANTE: usar espacios para no mezclar palabras entre campos
  const full = ` ${modelo} | ${medida} | ${marca} `;

  const offRoad = isAllTerrain(full);
  const extremeMud = isExtremeMudTerrain(full);
  const runFlat = isRunFlatModel(modelo);
  const verifiedSpec = getVerifiedTireSpec(item);
  const commercialLoad =
    /\b(?:CARGO|VAN|COMMERCIAL|TRANSFORCE|TRASFORCE|DURAVIS|AGILIS|FLEET|LIGHT TRUCK)\b/.test(full) ||
    /\b(?:6PR|8PR|10PR|12PR|14PR)\b/.test(full) ||
    /\bLT\d{3}/.test(full) ||
    /\b\d{3}(?:\/\d{2})?R\d{2}C\b/.test(full);

  const attrs = [];
  if (!offRoad)      attrs.push({ icon: iconClimaSeco,  label: "Clima seco" });
  if (!extremeMud && verifiedSpec?.traction)
                     attrs.push({ icon: iconLluvia,     label: "Piso mojado" });
  attrs.push(        { icon: iconDeCarga,   label: "Índice de carga" });
  if (!offRoad && !extremeMud)
                     attrs.push({ icon: iconSilencioso, label: "Bajo ruido" });
  if (runFlat)       attrs.push({ icon: iconRunFlat,    label: "Run Flat" });
  if (offRoad)       attrs.push({ icon: iconAllTerrain, label: "All Terrain" });
  return attrs
    .filter(({ icon }) => {
      if (icon === iconDeCarga) return commercialLoad;
      return true;
    })
    .map((entry) => (entry.icon === iconDeCarga ? { ...entry, label: "Indice de carga" } : entry));
}

/* ── Descripción inteligente por tipo de llanta ── */
function getProductDescription(item) {
  const marca  = String(item?.marca  || "").trim();
  const modelo = String(item?.modelo || "").trim();
  const medida = String(item?.medida || "").trim();
  const full   = ` ${modelo.toUpperCase()} | ${medida.toUpperCase()} | ${marca.toUpperCase()} `;
  const verifiedSpec = getVerifiedTireSpec(item);
  const brandProfile = getBrandProfile(item);

  const offRoad    = isAllTerrain(full);
  const extremeMud = isExtremeMudTerrain(full);
  const runFlat    = isRunFlatModel(modelo.toUpperCase());

  // Ancho de llanta para detectar tipo de vehículo
  const widthN = parseInt(medida) || 185;
  const isTruck    = widthN >= 265;
  const isSUV      = widthN >= 225 && widthN < 265;
  const isHighPerf = /\bSPORT\b|RS\b|\bGT\b|PILOT|SPORT MAXX|PS4|POTENZA|SPORT CONTACT|EAGLE F1/i.test(full);

  if (runFlat)
    return `${marca} ${modelo} — Tecnología Run Flat: puedes seguir rodando hasta 80 km con llanta desinflada. Ideal para vehículos BMW, Mercedes y autos de lujo sin aro de repuesto.`;

  if (extremeMud)
    return `${marca} ${modelo} en medida ${medida}. Llanta Mud Terrain de máximo agarre en lodo, barro y terrenos extremos. Perfecta para expediciones, 4x4 y uso intensivo off-road.`;

  if (offRoad && isTruck)
    return `${marca} ${modelo} en medida ${medida}. Llanta All Terrain para camionetas y pickups. Excelente tracción en terracería, grava y caminos rurales, sin sacrificar comodidad en carretera.`;

  if (offRoad)
    return `${marca} ${modelo} en medida ${medida}. Llanta All Terrain para uso mixto ciudad-campo. Banda de rodamiento reforzada para terracería, brechas y carretera con óptimo control en todo terreno.`;

  if (isTruck)
    return `${marca} ${modelo} en medida ${medida}. Llanta para pickup y camioneta. Diseñada para soportar alta carga, resistir el calor y ofrecer estabilidad a alta velocidad en carretera. Larga vida útil y bajo costo por kilómetro.`;

  if (isSUV)
    return `${marca} ${modelo} en medida ${medida}. Llanta para SUV y crossover con excelente agarre en mojado y seco. Cómoda en autopista y confiable en ciudad, con baja resistencia a la rodadura para mejor rendimiento de combustible.`;

  if (isHighPerf)
    return `${marca} ${modelo} en medida ${medida}. Llanta de alto rendimiento para conducción deportiva. Máxima adherencia en curvas, respuesta precisa a la dirección y frenada corta en seco y mojado.`;

  if (brandProfile || verifiedSpec) {
    const parts = [
      `${marca} ${modelo} en medida ${medida}.`,
      brandProfile?.story,
      brandProfile?.focus,
      verifiedSpec?.usageNote,
      verifiedSpec
        ? `Para esta medida se encontro UTQG ${verifiedSpec.utqg}, con treadwear ${verifiedSpec.treadwear}, traccion ${verifiedSpec.traction} y temperatura ${verifiedSpec.temperature}.`
        : "",
    ].filter(Boolean);
    return parts.join(" ");
  }

  // Pasajero/turismo estándar (la mayoría)
  return `${marca} ${modelo} en medida ${medida}. Llanta de turismo para sedán y hatchback. Excelente balance entre confort, agarre en mojado, bajo nivel de ruido y eficiencia en combustible para uso diario en ciudad y carretera.`;
}

/* ── Reseñas de Google (estáticas) ── */
const GOOGLE_REVIEWS = [
  {
    author: "Ruben Camacho",
    avatar: "R",
    date: "12/02/2026",
    rating: 5,
    text: "Encontré el mejor precio en las llantas que buscaba, y la entrega fue rápida. Muy recomendable, y es seguro comprar en esa página, sin problema.",
  },
  {
    author: "Francisco Chavez",
    avatar: "F",
    date: "14/01/2026",
    rating: 5,
    text: "Muy buena atención, siempre atentos a mis dudas... Pagina confiable",
  },
  {
    author: "Ana Martínez",
    avatar: "A",
    date: "05/03/2026",
    rating: 5,
    text: "Excelente servicio, las llantas llegaron en tiempo y en perfectas condiciones. Las instalé en sucursal y fue muy rápido.",
  },
  {
    author: "Jorge Pérez",
    avatar: "J",
    date: "20/02/2026",
    rating: 4,
    text: "Buen precio y producto original. El envío tardó un día más de lo indicado pero el producto llegó en perfectas condiciones.",
  },
];

export default function ProductoDetalle() {
  const { productoSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const sku = useMemo(() => {
    const p = new URLSearchParams(location.search);
    return String(p.get("sku") || "").trim();
  }, [location.search]);

  const [item, setItem] = useState(location.state?.item || null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(!location.state?.item);
  const [error, setError] = useState("");
  const [viewTracked, setViewTracked] = useState(false);
  const [similarItems, setSimilarItems] = useState([]);
  const [activeImg, setActiveImg] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  /* ── Favoritos ── */
  const [isFavorite, setIsFavorite] = useState(() => {
    try {
      const favs = JSON.parse(localStorage.getItem("mk5_favorites") || "[]");
      return favs.includes(sku);
    } catch { return false; }
  });

  /* ── Reseñas del usuario ── */
  const [localReviews, setLocalReviews] = useState(() => {
    try { return JSON.parse(localStorage.getItem("mk5_reviews") || "[]"); }
    catch { return []; }
  });
  const [reviewForm, setReviewForm] = useState({ name: "", text: "", rating: 0 });
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewSent, setReviewSent] = useState(false);
  const [compatQuery, setCompatQuery] = useState("");

  const images = useMemo(() => {
    if (!item) return [llantaPlaceholder];
    if (item.imagenes) {
      try {
        const arr = JSON.parse(item.imagenes);
        if (Array.isArray(arr) && arr.length > 0) return arr;
      } catch { /* ignorar */ }
    }
    return [item.imagen || llantaPlaceholder];
  }, [item]);

  useEffect(() => {
    const stateItem = location.state?.item || null;
    if (stateItem && buildProductSlug(stateItem) === productoSlug) {
      setItem(stateItem);
      setLoading(false);
      setError("");
      return;
    }

    let cancelled = false;
    async function loadItem() {
      try {
        setLoading(true);
        setError("");

        let exact = null;
        if (sku) {
          const res = await fetch(`${API_BASE}/api/catalogo/item?sku=${encodeURIComponent(sku)}`);
          if (res.ok) {
            const data = await res.json();
            exact = data?.item || null;
          }
        }

        if (!exact) {
          const q = productoSlug.replace(/^llanta-/, "").replace(/-+/g, " ").trim();
          const p = new URLSearchParams();
          p.set("q", q);
          p.set("limit", "100");

          const res = await fetch(`${API_BASE}/api/catalogo/items?${p.toString()}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const data = await res.json();
          const rows = Array.isArray(data?.items) ? data.items : [];
          exact = rows.find((row) => buildProductSlug(row) === productoSlug) || null;
        }

        if (!exact) throw new Error("item_not_found");

        if (!cancelled) {
          setItem(exact);
          const canonical = buildProductPath(exact);
          const currentPath = `${location.pathname}${location.search}`;
          if (canonical !== currentPath) navigate(canonical, { replace: true, state: { item: exact } });
        }
      } catch {
        if (!cancelled) setError("No pude cargar ese producto desde la base de datos.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadItem();
    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.search, location.state?.item, navigate, productoSlug, sku]);

  if (loading) {
    return (
      <main className="main product-page">
        <p>Cargando producto...</p>
      </main>
    );
  }

  if (error || !item) {
    return (
      <main className="main product-page">
        <p>{error || "Producto no disponible."}</p>
        <Link to="/catalogo" className="product-back">
          Volver al catálogo
        </Link>
      </main>
    );
  }

  const stock = Math.max(Number(item.stock || 0), 1);
  const oldPrice = estimateListPrice(item.precio);
  const brandKey = String(item.marca || "").trim().toUpperCase();
  const brandLogo = BRAND_LOGOS[brandKey] || null;
  const mk5Price = Number(item.precio || 0);
  const ahorro = oldPrice - mk5Price;
  const medidaData = parseMedida(item.medida);
  const loadSpeed = parseLoadAndSpeed(item.modelo);
  const verifiedSpec = getVerifiedTireSpec(item);
  const brandProfile = getBrandProfile(item);

  const searchText = `${item.marca || ""} ${item.modelo || ""} ${item.medida || ""}`.trim();
  const mlUrl = `https://listado.mercadolibre.com.mx/${encodeURIComponent(searchText)}`;
  const amzUrl = `https://www.amazon.com.mx/s?k=${encodeURIComponent(searchText)}`;

  const compareRows = [
    {
      canal: "Mercado Libre",
      price: mk5Price * 1.12,
      logo: "ML",
      url: mlUrl,
    },
    {
      canal: "Amazon",
      price: mk5Price * 1.18,
      logo: "AMZ",
      url: amzUrl,
    },
    {
      canal: "MK5",
      price: mk5Price,
      logo: "MK5",
      url: "#",
    },
  ];

  /* ── Toggle favoritos ── */
  function toggleFavorite() {
    const skuKey = String(item?.sku || "").trim();
    if (!skuKey) return;
    try {
      const favs = JSON.parse(localStorage.getItem("mk5_favorites") || "[]");
      const next = isFavorite ? favs.filter((s) => s !== skuKey) : [...favs, skuKey];
      localStorage.setItem("mk5_favorites", JSON.stringify(next));
      setIsFavorite(!isFavorite);
    } catch { /* ignorar */ }
  }

  /* ── Enviar reseña ── */
  function submitReview(e) {
    e.preventDefault();
    if (!reviewForm.name.trim() || !reviewForm.text.trim() || reviewForm.rating === 0) return;
    const newReview = {
      author: reviewForm.name.trim(),
      text: reviewForm.text.trim(),
      rating: reviewForm.rating,
      date: "Hace un momento",
      verified: false,
      title: "",
      location: "",
    };
    const updated = [newReview, ...localReviews];
    setLocalReviews(updated);
    try { localStorage.setItem("mk5_reviews", JSON.stringify(updated)); } catch { /* ignorar */ }
    setReviewForm({ name: "", text: "", rating: 0 });
    setReviewHover(0);
    setReviewSent(true);
    setTimeout(() => setReviewSent(false), 4000);
  }

  useEffect(() => {
    if (!item || viewTracked) return;
    trackEvent("product_view", {
      sku: String(item.sku || "").trim(),
      amount: Number(item.precio || 0),
      source: "detalle",
    });
    setViewTracked(true);
  }, [item, viewTracked]);

  useEffect(() => {
    if (!item?.medida) return;
    const parts = parseMedida(item.medida);
    if (!parts) return;
    const params = new URLSearchParams();
    params.set("anchos", parts.ancho);
    params.set("altos", parts.perfil);
    params.set("rines", parts.rin);
    params.set("limit", "8");
    fetch(`${API_BASE}/api/catalogo/items?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        const currentSku = String(item.sku || "").trim();
        const rows = (data.items || []).filter(
          (x) => String(x.sku || "").trim() !== currentSku
        );
        setSimilarItems(rows.slice(0, 6));
      })
      .catch(() => {});
  }, [item?.medida, item?.sku]);

  return (
    <main className="main product-page">
      <Link to="/catalogo" className="product-back">
        ← Volver al catálogo
      </Link>

      <section className="product-layout sketch-top">
        <article className="product-gallery">
          {/* Thumbnails laterales */}
          {images.length > 1 && (
            <div className="gallery-thumbs">
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt=""
                  className={`gallery-thumb${activeImg === i ? " active" : ""}`}
                  onClick={() => setActiveImg(i)}
                />
              ))}
            </div>
          )}

          {/* Imagen principal con botón de zoom */}
          <div className="gallery-main" onClick={() => setZoomOpen(true)}>
            <img
              src={images[activeImg]}
              alt={`${item.marca || ""} ${item.modelo || ""}`.trim()}
              loading="lazy"
              onError={(e) => { e.target.onerror = null; e.target.src = llantaPlaceholder; }}
            />
            <span className="gallery-zoom-btn" title="Ampliar">⊕</span>
          </div>
        </article>

        {/* Modal de zoom */}
        {zoomOpen && (
          <div className="gallery-modal" onClick={() => setZoomOpen(false)}>
            <button className="gallery-modal-close" onClick={() => setZoomOpen(false)}>✕</button>
            {images.length > 1 && (
              <button
                className="gallery-modal-prev"
                onClick={(e) => { e.stopPropagation(); setActiveImg((p) => (p - 1 + images.length) % images.length); }}
              >‹</button>
            )}
            <img
              src={images[activeImg]}
              alt={`${item.marca || ""} ${item.modelo || ""}`.trim()}
              onClick={(e) => e.stopPropagation()}
            />
            {images.length > 1 && (
              <button
                className="gallery-modal-next"
                onClick={(e) => { e.stopPropagation(); setActiveImg((p) => (p + 1) % images.length); }}
              >›</button>
            )}
            <span className="gallery-modal-counter">{activeImg + 1} / {images.length}</span>
          </div>
        )}

        <article className="product-summary">
          <div className="product-brand-row">
            <span className="product-brand-pill">
              {brandLogo ? (
                <img src={brandLogo} alt={item.marca || "Marca"} />
              ) : (
                <span>{item.marca || "Marca"}</span>
              )}
            </span>
            <div className="product-perf-icons product-perf-icons--sm" aria-label="Atributos de desempeño">
              {getTireAttributes(item).map((attr) => (
                <div key={attr.label} className="perf-icon-item perf-icon-item--sm" title={attr.label}>
                  <img src={attr.icon} alt={attr.label} />
                </div>
              ))}
            </div>
          </div>
          <div className="product-title-row">
            <h1>{getProductTitle(item)}</h1>
            <button
              type="button"
              className={`btn-favorite${isFavorite ? " is-fav" : ""}`}
              onClick={toggleFavorite}
              title={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
              aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
            >
              {isFavorite ? "♥" : "♡"}
            </button>
          </div>
          <p className="product-ref">Ref. {item.sku || "N/A"}</p>

          <div className="product-price">
            <strong>{formatMoney(mk5Price)}</strong>
            <small>{formatMoney(oldPrice)}</small>
            <span>¡Ahorras {formatMoney(ahorro)}!</span>
          </div>

          <div className="product-shipping-row">
            <p>Envio a domicilio: 2 - 5 dias</p>
            <p>Entrega en sucursal: 1 - 2 dias</p>
          </div>

          <div className="product-benefits">
            <p>
              <span className="benefit-icon" aria-hidden="true">🛠️</span>
              Instalacion y balanceo gratis en sucursal
            </p>
            <p>
              <span className="benefit-icon" aria-hidden="true">🚚</span>
              Envio gratis 1-2 dias habiles
            </p>
          </div>

          <div className="card-stock">
            <strong>Disponibilidad</strong>
            <div className="stock-line">
              <span>Nacional</span>
              <div className="stock-bars">
                {[0, 1, 2, 3, 4].map((bar) => (
                  <i key={bar} className={bar < availabilityLevel(item.stock) ? "is-on" : ""} />
                ))}
              </div>
              <span>+ {stock} pzs</span>
            </div>
          </div>

          <div className="card-qty product-qty">
            <span>Cantidad</span>
            <div>
              <button type="button" onClick={() => setQty((n) => Math.max(1, n - 1))}>
                -
              </button>
              <strong>{qty}</strong>
              <button type="button" onClick={() => setQty((n) => n + 1)}>
                +
              </button>
            </div>
          </div>

          <div className="product-actions product-actions--top">
            <button
              className="btn-primary"
              type="button"
              onClick={() => {
                const ok = addToCart(item, qty);
                if (!ok) setError("Este producto no tiene SKU válido para carrito.");
                else {
                  trackEvent("add_to_cart", {
                    sku: String(item.sku || "").trim(),
                    qty,
                    amount: Number(item.precio || 0) * qty,
                    source: "detalle",
                  });
                }
              }}
            >
              AGREGAR AL CARRITO
            </button>
          </div>

          <div className="product-actions product-actions--split">
            <button
              className="btn-primary"
              type="button"
              onClick={() => {
                const ok = addToCart(item, 2);
                if (!ok) setError("Este producto no tiene SKU válido para carrito.");
                else {
                  trackEvent("add_to_cart", {
                    sku: String(item.sku || "").trim(),
                    qty: 2,
                    amount: Number(item.precio || 0) * 2,
                    source: "detalle",
                  });
                }
              }}
            >
              AGREGAR 2 LLANTAS
            </button>
            <button
              className="btn-primary"
              type="button"
              onClick={() => {
                const ok = addToCart(item, 4);
                if (!ok) setError("Este producto no tiene SKU válido para carrito.");
                else {
                  trackEvent("add_to_cart", {
                    sku: String(item.sku || "").trim(),
                    qty: 4,
                    amount: Number(item.precio || 0) * 4,
                    source: "detalle",
                  });
                }
              }}
            >
              AGREGAR 4 LLANTAS
            </button>
          </div>

          <div className="product-actions">
            <button
              className="btn-secondary product-buy"
              type="button"
              onClick={() => {
                const ok = addToCart(item, qty);
                if (!ok) {
                  setError("Este producto no tiene SKU válido para carrito.");
                  return;
                }
                trackEvent("begin_checkout", {
                  sku: String(item.sku || "").trim(),
                  qty,
                  amount: Number(item.precio || 0) * qty,
                  source: "detalle",
                });
                navigate("/checkout");
              }}
            >
              COMPRAR AHORA
            </button>
          </div>
        </article>

        <aside className="product-side">
          <div className="side-card">
            <h3>Garantias MK5</h3>
            <ul>
              <li>Producto nuevo y sellado</li>
              <li>Facturacion inmediata</li>
              <li>Soporte por WhatsApp</li>
            </ul>
          </div>
          <div className="side-card side-card--inventory">
            <div className="side-card__top">
              <span className="side-card__eyebrow">Stock nacional</span>
              <span className="side-card__status">Disponible</span>
            </div>
            <h3>Disponibilidad tienda</h3>
            <p>Inventario nacional activo</p>
            <b>{stock} piezas</b>
            <div className="side-card__bars">
              <div className="stock-bars">
                {[0, 1, 2, 3, 4].map((bar) => (
                  <i key={bar} className={bar < availabilityLevel(item.stock) ? "is-on" : ""} />
                ))}
              </div>
            </div>
            <div className="side-card__meta">
              <span>Entrega 24-48 h</span>
              <span>Instalacion en sucursal</span>
            </div>
          </div>
        </aside>
      </section>

      <section className="detail-bottom">
        {/* ── Descripción ── */}
        <div className="detail-section">
          <h3>Descripcion</h3>
          <div className="product-perf-icons" aria-label="Atributos de desempeño">
            {getTireAttributes(item).map((attr) => (
              <div key={attr.label} className="perf-icon-item" title={attr.label}>
                <img src={attr.icon} alt={attr.label} />
                <span>{attr.label}</span>
              </div>
            ))}
          </div>
          <p style={{marginTop: "12px"}}>
            {getProductDescription(item)}
          </p>
          {(brandProfile || verifiedSpec) && (
            <div className="product-story-card">
              {verifiedSpec && (
                <div className="product-story-card__chips">
                  <span>UTQG {verifiedSpec.utqg}</span>
                  <span>Temperatura {verifiedSpec.temperature}</span>
                  <span>Traccion {verifiedSpec.traction}</span>
                </div>
              )}
              {brandProfile?.story && <p>{brandProfile.story}</p>}
              {brandProfile?.focus && <p>{brandProfile.focus}</p>}
              {verifiedSpec?.brandStory && <p>{verifiedSpec.brandStory}</p>}
              {verifiedSpec?.usageNote && <p>{verifiedSpec.usageNote}</p>}
            </div>
          )}
        </div>

        {/* ── Especificaciones ── */}
        <div className="detail-section">
          <h3>Especificaciones</h3>
          <div className="spec-layout">
            <div className="spec-col">
              <h4>Medidas</h4>
              <div className="spec-row"><span>Ancho</span><b>{medidaData?.ancho || "-"}</b></div>
              <div className="spec-row"><span>Perfil</span><b>{medidaData?.perfil || "-"}</b></div>
              <div className="spec-row"><span>Rin</span><b>{medidaData?.rin || "-"}</b></div>
              <div className="spec-row"><span>Medida completa</span><b>{item.medida || "-"}</b></div>
            </div>
            <div className="spec-col">
              <h4>Atributos</h4>
              <div className="spec-row"><span>Indice de carga</span><b>{loadSpeed.carga}</b></div>
              <div className="spec-row"><span>Indice de velocidad</span><b>{loadSpeed.velocidad}</b></div>
              <div className="spec-row"><span>Segmento</span><b>{verifiedSpec?.segment || "Turismo"}</b></div>
              <div className="spec-row"><span>Tipo de vehiculo</span><b>{verifiedSpec?.vehicleType || "Sedan / Hatchback"}</b></div>
              <div className="spec-row"><span>Temporada</span><b>{verifiedSpec?.season || "Todas las estaciones"}</b></div>
              {verifiedSpec?.utqg && (
                <div className="spec-row"><span>UTQG</span><b>{verifiedSpec.utqg}</b></div>
              )}
              {verifiedSpec?.treadwear && (
                <div className="spec-row"><span>Treadwear</span><b>{verifiedSpec.treadwear}</b></div>
              )}
              {verifiedSpec?.traction && (
                <div className="spec-row"><span>Traccion</span><b>{verifiedSpec.traction}</b></div>
              )}
              {verifiedSpec?.temperature && (
                <div className="spec-row"><span>Temperatura</span><b>{verifiedSpec.temperature}</b></div>
              )}
            </div>
          </div>
          {verifiedSpec?.sourceNote && (
            <small className="spec-source-note">{verifiedSpec.sourceNote}</small>
          )}
        </div>

        {/* ── Vehículos compatibles ── */}
        {(() => {
          const key = normalizeMedidaKey(item.medida);
          const vehiculosBase = key ? (VEHICULOS_POR_MEDIDA[key] || []) : [];
          const vehiculos = getMexicoMarketVehicles(key, vehiculosBase);
          return (
            <div className="detail-section">
              <h3>Vehiculos compatibles con esta llanta*</h3>
              <p className="vehicle-copy">
                A continuacion se muestra una lista de vehiculos compatibles con la medida de llantas {key || item.medida || ""}, le pueden quedar segun el ano y opcion del vehiculo. Sin embargo, la lista no cubre todos los vehiculos con los que puede ser compatible esta medida.
              </p>
              {vehiculos.length > 0 ? (
                <div className="vehicle-links-grid">
                  {vehiculos.map((v) => {
                    const vehicleMeta = getVehicleBrandMeta(v);
                    return (
                      <Link
                        key={v}
                        to={`/catalogo?medida=${encodeURIComponent(key || item.medida || "")}`}
                        className={`vehicle-link vehicle-link--${vehicleMeta.brandKey.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                      >
                        <span className="vehicle-link__brandmark" aria-hidden="true">
                          {vehicleMeta.brandLabel}
                        </span>
                        <span className="vehicle-link__text">
                          <small>{vehicleMeta.brandLabel}</small>
                          <strong>{vehicleMeta.model.toUpperCase()}</strong>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p style={{margin:0, color:"#6b7280", fontSize:"14px"}}>
                  Medida {item.medida || ""}. Consulta con nosotros por WhatsApp para verificar compatibilidad con tu vehiculo.
                </p>
              )}
              <div className="compat-assistant">
                <div className="compat-assistant__copy">
                  <span className="compat-assistant__eyebrow">Consulta rapida</span>
                  <h4>Quieres saber si tu auto es compatible con esta llanta?</h4>
                  <p>Escribe marca, modelo y ano y te mando la pregunta lista al asistente IA con la medida {key || item.medida || ""}.</p>
                </div>
                <form
                  className="compat-assistant__form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const query = compatQuery.trim();
                    if (!query) return;
                    navigate(`/ia?q=${encodeURIComponent(`Quiero saber si ${query} es compatible con la llanta ${key || item.medida || ""}`)}`);
                  }}
                >
                  <input
                    type="text"
                    value={compatQuery}
                    onChange={(e) => setCompatQuery(e.target.value)}
                    placeholder="Ej. Nissan March 2020"
                  />
                  <button type="submit">Preguntar a IA</button>
                </form>
              </div>
              <div className="vehicle-note">
                <strong>INFORMACION IMPORTANTE:</strong> La medida puede variar dependiendo de la version de su vehiculo, le recomendamos utilizar el manual de propietario o verificar la medida de su llanta fisicamente, ya que no tenemos devoluciones ni cambios por errores de medida.
              </div>
            </div>
          );
        })()}

        {/* ── Comparacion de precios ── */}
        <div className="detail-section">
          <h3>Comparacion de precios</h3>
          <small className="compare-note">*Referencial en linea para la misma medida/modelo.</small>
          <div className="compare-table">
            {compareRows.map((row) => {
              const ahorroVs = row.price - mk5Price;
              const isMk5 = row.canal === "MK5";
              return (
                <div className={`compare-row ${isMk5 ? "is-mk5" : ""}`} key={row.canal}>
                  <div className={`market-logo ${row.logo.toLowerCase()}`}>{row.logo}</div>
                  <span>{row.canal}</span>
                  <b>{formatMoney(row.price)}</b>
                  <em>{isMk5 ? "Mejor precio" : `Ahorro ${formatMoney(ahorroVs)}`}</em>
                  {!isMk5 && (
                    <a href={row.url} target="_blank" rel="noreferrer">
                      Ver
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Reseñas ── */}
        <div className="detail-section">
          <div className="reviews-head">
            <h3>Reseñas de clientes</h3>
            <div className="reviews-summary">
              <span className="reviews-avg">4.8</span>
              <div className="reviews-stars reviews-stars--lg">
                {"★★★★★".split("").map((s, i) => <span key={i}>{s}</span>)}
              </div>
              <span className="reviews-count">{REVIEWS_DB.length + localReviews.length} reseñas verificadas</span>
            </div>
          </div>
          <div className="reviews-list">
            {[...localReviews, ...REVIEWS_DB].map((r, i) => (
              <div key={i} className="review-card">
                <div className="review-card__top">
                  <div className="review-card__stars">
                    {"★★★★★".split("").map((s, si) => (
                      <span key={si} className={si < r.rating ? "star-on" : "star-off"}>{s}</span>
                    ))}
                  </div>
                  {r.verified && <span className="review-verified">Compra verificada</span>}
                  <span className="review-date">{r.date}</span>
                </div>
                {r.title ? <p className="review-title">{r.title}</p> : null}
                <p className="review-text">{r.text}</p>
                <div className="review-author">
                  {r.author}{r.location ? ` · ${r.location}` : ""}
                </div>
              </div>
            ))}
          </div>

          {/* ── Escribir reseña ── */}
          <div className="write-review">
            <h4>Escribe una reseña</h4>
            {reviewSent && (
              <p className="review-sent-msg">¡Gracias por tu reseña! Ya se publicó.</p>
            )}
            <form className="write-review__form" onSubmit={submitReview}>
              <div className="write-review__stars" aria-label="Selecciona calificación">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`write-review__star${(reviewHover || reviewForm.rating) >= n ? " active" : ""}`}
                    onMouseEnter={() => setReviewHover(n)}
                    onMouseLeave={() => setReviewHover(0)}
                    onClick={() => setReviewForm((f) => ({ ...f, rating: n }))}
                    aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
                  >
                    ★
                  </button>
                ))}
                {reviewForm.rating > 0 && (
                  <span className="write-review__rating-label">
                    {["", "Malo", "Regular", "Bueno", "Muy bueno", "Excelente"][reviewForm.rating]}
                  </span>
                )}
              </div>
              <input
                className="write-review__input"
                type="text"
                placeholder="Tu nombre"
                value={reviewForm.name}
                onChange={(e) => setReviewForm((f) => ({ ...f, name: e.target.value }))}
                maxLength={60}
                required
              />
              <textarea
                className="write-review__textarea"
                placeholder="Cuéntanos tu experiencia con este producto..."
                value={reviewForm.text}
                onChange={(e) => setReviewForm((f) => ({ ...f, text: e.target.value }))}
                rows={4}
                maxLength={500}
                required
              />
              <button
                type="submit"
                className="btn-primary write-review__submit"
                disabled={!reviewForm.name.trim() || !reviewForm.text.trim() || reviewForm.rating === 0}
              >
                Publicar reseña
              </button>
            </form>
          </div>
        </div>

        {/* ── Reseñas de Google ── */}
        <div className="detail-section google-reviews-section">
          <div className="google-reviews-head">
            <svg className="google-logo" viewBox="0 0 272 92" xmlns="http://www.w3.org/2000/svg" aria-label="Google">
              <path d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#EA4335"/>
              <path d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#FBBC05"/>
              <path d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z" fill="#4285F4"/>
              <path d="M225 3v65h-9.5V3h9.5z" fill="#34A853"/>
              <path d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.70-8.23-4.70-4.95 0-11.84 4.37-11.59 12.93z" fill="#EA4335"/>
              <path d="M35.29 41.41V32h31.36c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 35.37.36 16.85 16.32 1.39 34.95 1.39c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.14.09z" fill="#4285F4"/>
            </svg>
            <div className="google-reviews-rating">
              <span className="google-reviews-avg">4.9</span>
              <div className="google-reviews-stars">
                {"★★★★★".split("").map((s, i) => <span key={i}>{s}</span>)}
              </div>
              <span className="google-reviews-count">{GOOGLE_REVIEWS.length * 12}+ reseñas en Google</span>
            </div>
          </div>

          <div className="google-reviews-list">
            {GOOGLE_REVIEWS.map((r, i) => (
              <div key={i} className="google-review-card">
                <div className="google-review-card__top">
                  <div className="google-review-avatar" style={{ background: ["#4285F4","#EA4335","#34A853","#FBBC05"][i % 4] }}>
                    {r.avatar}
                  </div>
                  <div>
                    <p className="google-review-author">{r.author}</p>
                    <p className="google-review-date">{r.date}</p>
                  </div>
                </div>
                <div className="google-review-stars">
                  {"★★★★★".split("").map((s, si) => (
                    <span key={si} className={si < r.rating ? "star-on" : "star-off"}>{s}</span>
                  ))}
                </div>
                <p className="google-review-text">{r.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Productos similares ── */}
        {similarItems.length > 0 && (
          <div className="detail-section">
            <div className="similar-head">
              <div>
                <h3>Modelos recomendados</h3>
                <p>Otras llantas disponibles en medida {item.medida}</p>
              </div>
            </div>
            <div className="similares-grid">
              {similarItems.map((sim) => {
                const simBrandKey = normalizeBrandKey(sim.marca);
                const simBrandLogo = BRAND_LOGOS[simBrandKey] || null;
                const simStock = Math.max(Number(sim.stock || 0), 1);

                return (
                  <Link
                    key={String(sim.sku || sim.id || Math.random())}
                    to={buildProductPath(sim)}
                    state={{ item: sim }}
                    className="similar-card"
                  >
                    <div className="similar-card__badges">
                      <span className="similar-card__badge similar-card__badge--stock">+{simStock} piezas</span>
                    </div>
                    <div className="similar-card__media">
                      {simBrandLogo ? (
                        <img className="similar-card__logo" src={simBrandLogo} alt={sim.marca || "Marca"} />
                      ) : (
                        <p className="similar-card__brand">{sim.marca}</p>
                      )}
                      <img
                        className="similar-card__img"
                        src={sim.imagen || llantaPlaceholder}
                        alt={`${sim.marca || ""} ${sim.modelo || ""}`.trim()}
                        loading="lazy"
                        onError={(e) => { e.target.onerror = null; e.target.src = llantaPlaceholder; }}
                      />
                    </div>
                    <div className="similar-card__body">
                      <p className="similar-card__model">{sim.modelo}</p>
                      <p className="similar-card__size">{sim.medida}</p>
                      <strong className="similar-card__price">{formatMoney(Number(sim.precio || 0))}</strong>
                      <span className="similar-card__cta">Ver llanta</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
