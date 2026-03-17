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

/* ── Vehículos compatibles por medida (mercado mexicano, modelos 2010+) ── */
const VEHICULOS_POR_MEDIDA = {
  // ── Compactos / subcompactos ──
  "155/65R14": ["Hyundai Atos 2010-2015", "Kia Picanto 2010-2011"],
  "155/70R13": ["Chevrolet Spark 2010-2018", "Chevrolet Matiz 2010", "Hyundai Atos", "Kia Picanto 2010"],
  "165/70R13": ["Chevrolet Spark 2010-2012", "Nissan March 2011"],
  "175/65R14": ["Nissan March 2011-2020", "Chevrolet Spark 2013+", "Hyundai Grand i10 2015+", "Kia Picanto 2012-2017", "Toyota Yaris 2011-2014"],
  "175/65R15": ["Toyota Yaris 2015-2020", "Hyundai Grand i10 2018+", "Kia Picanto 2018+", "Ford Figo 2015+"],
  "175/70R13": ["Nissan Tsuru 2010-2017", "VW Sedan (Vocho)", "Chevrolet Spark 2010"],
  "185/55R15": ["Ford Fiesta 2013-2018", "Mazda 2 2011-2014", "VW Polo 2010-2017"],
  "185/60R14": ["Chevrolet Aveo 2010-2017", "Kia Rio 2010-2017", "Hyundai Accent 2010-2016", "Nissan Tiida 2010-2015"],
  "185/60R15": ["VW Polo 2012-2019", "Ford Fiesta 2013-2018", "Chevrolet Beat 2018+", "Nissan March 2016+", "Hyundai Grand i10 2015+"],
  "185/65R14": ["Toyota Yaris 2010-2014", "Chevrolet Sonic 2012-2016", "Ford Fiesta 2010-2012", "Nissan Tiida 2012+"],
  "185/65R15": [
    "Nissan March 2011-2021", "Nissan Versa 2012-2019",
    "Chevrolet Aveo 2016-2021", "Chevrolet Sonic 2012-2019",
    "Kia Rio 2012-2021", "Hyundai Accent 2012-2021",
    "Toyota Yaris 2014-2020", "Toyota Rush 2018+",
    "Ford Fiesta 2014-2018", "Mazda 2 2015+", "VW Gol 2013+",
  ],
  "195/50R15": ["Honda Civic 2010-2015", "Mazda 3 2010-2013"],
  "195/55R15": ["VW Golf A4 2010-2012", "Mazda 3 2011"],
  "195/55R16": ["VW Golf VII 2013+", "Chevrolet Sonic 2017+", "Mazda 2 2016+"],
  "195/60R15": ["Toyota Yaris 2015-2022", "Nissan Tiida 2014+", "Chevrolet Beat 2018-2023", "Kia Rio 2018+"],
  "195/65R15": [
    "VW Jetta 2010-2021", "VW Vento 2011+", "VW Golf 2010-2014", "VW T-Cross 2021+",
    "Chevrolet Aveo 2018+", "Chevrolet Sonic 2012-2019", "Chevrolet Cruze 2011-2016",
    "Nissan Sentra 2010-2016", "Nissan Tiida 2016+",
    "Hyundai Elantra 2012-2017", "Kia Forte 2013-2018",
    "Ford Focus 2012-2018", "Toyota Corolla 2010-2013", "Mazda 3 2010-2013",
  ],
  // ── Sedán / compacto mediano ──
  "205/45R16": ["Honda Civic 2016+", "Mazda 3 2014+", "Ford Focus ST 2015+"],
  "205/45R17": ["Nissan Sentra SR 2016+", "Hyundai Elantra Sport 2017+", "Kia Forte GT 2019+", "Mazda 3 Turbo 2021+"],
  "205/50R17": ["Honda Civic 2016-2021", "Toyota Corolla 2014-2018", "Nissan Sentra 2016+"],
  "205/55R16": [
    "VW Jetta 2016+", "VW Golf VII 2013+", "VW Polo 2018+",
    "Chevrolet Cruze 2013-2018", "Chevrolet Sonic 2017+",
    "Nissan Sentra 2013-2019", "Nissan Kicks 2017+",
    "Hyundai Elantra 2017+", "Kia Forte 2016+", "Kia Soul 2014+",
    "Mazda 3 2014+", "Toyota Corolla 2014-2018", "Ford Focus 2016+",
  ],
  "205/60R16": [
    "Toyota Camry 2012-2017", "Nissan Altima 2013-2018",
    "Hyundai Sonata 2011-2015", "Kia Optima 2011-2015",
    "Ford Fusion 2013-2016", "Chevrolet Malibu 2013-2016", "Mazda 6 2010-2013",
  ],
  "205/65R15": ["Nissan Sentra B15 2010+", "Toyota Corolla 2010"],
  "205/65R16": ["Nissan X-Trail 2014-2017", "Hyundai Tucson 2011-2016", "Kia Sportage 2011-2016"],
  "215/45R17": [
    "Honda Civic Si 2012+", "Toyota Corolla SE 2017+",
    "Chevrolet Cruze RS 2017+", "Hyundai Elantra Sport 2019+", "Nissan Sentra SR 2020+",
  ],
  "215/50R17": ["Toyota Corolla 2014+", "Honda Civic 2016+", "Nissan Sentra 2016+", "Chevrolet Cruze 2017+"],
  "215/50R18": ["Mazda CX-30 2020+", "Toyota C-HR 2018+", "Hyundai Kona 2018+", "Ford EcoSport 2018+"],
  "215/55R17": [
    "Toyota RAV4 2013-2019", "Honda CR-V 2012-2018",
    "Nissan Kicks 2018+", "Nissan Qashqai 2014+",
    "Mazda CX-5 2013-2016", "Ford Escape 2013-2019",
    "Chevrolet Equinox 2010-2017", "Jeep Renegade 2015+",
    "Hyundai Tucson 2016+", "Kia Sportage 2016+",
    "MG ZS 2019+", "VW Taos 2021+",
  ],
  "215/55R18": ["Chevrolet Trailblazer 2021+", "Toyota RAV4 2021+", "Ford Bronco Sport 2021+"],
  "215/60R16": ["Nissan Altima 2013+", "Toyota Camry 2012+", "Chevrolet Malibu 2013-2016", "Kia Optima 2011+"],
  "215/60R17": [
    "MG ZS 2019+", "Kia Seltos 2020+", "Hyundai Creta 2022+",
    "Toyota Sienna 2012+", "Nissan Pathfinder 2013-2017",
  ],
  "215/65R16": [
    "Nissan X-Trail 2014+", "Toyota Corolla Cross 2021+",
    "Honda CR-V 2010-2016", "Kia Sportage 2011-2015", "Hyundai Tucson 2011-2015",
  ],
  "215/65R17": ["Jeep Compass 2017+", "Jeep Renegade Sport 2017+", "Ford EcoSport 2019+"],
  // ── SUV / Crossover ──
  "225/45R17": [
    "VW Tiguan 2012-2017", "Chevrolet Equinox 2018+",
    "Ford Edge 2011-2014", "Mazda CX-5 2016+",
  ],
  "225/45R18": [
    "VW Tiguan 2017+", "VW Taos 2021+",
    "Hyundai Sonata 2015+", "Kia Optima/K5 2016+",
    "Toyota Camry 2018+", "Nissan Altima 2019+",
  ],
  "225/50R17": [
    "Ford Fusion 2013-2018", "Nissan Altima 2013-2018",
    "Toyota Camry 2012-2017", "Mazda 6 2014+",
    "Hyundai Sonata 2015+", "Kia Optima 2016+", "Chevrolet Malibu 2016+",
  ],
  "225/50R18": ["Mazda CX-5 2017+", "Ford Escape 2020+", "Jeep Cherokee 2019+"],
  "225/55R17": [
    "Ford Taurus 2010-2018", "Nissan Murano 2015+",
    "Chevrolet Traverse 2015+", "Hyundai Santa Fe 2019+", "Kia Sorento 2016+",
  ],
  "225/55R18": ["Jeep Cherokee 2014+", "Ford Escape 2017+", "Hyundai Tucson 2019+", "Toyota RAV4 2019+"],
  "225/60R16": ["Honda CR-V 2010-2014", "Toyota RAV4 2010-2012", "Nissan Murano 2011"],
  "225/60R17": [
    "Toyota Camry XLE 2012+", "Nissan Murano 2015-2018",
    "Ford Escape 2013-2017", "Hyundai Santa Fe 2013+", "Kia Sorento 2011-2015",
  ],
  "225/60R18": [
    "Toyota Highlander 2014-2019", "Jeep Compass 2019+",
    "Nissan Pathfinder 2017+", "Mazda CX-9 2016+",
  ],
  "225/65R17": [
    "Chevrolet Equinox 2018+", "Chevrolet Trax 2013+",
    "Toyota RAV4 2013-2018", "Nissan X-Trail 2017+",
    "Ford Escape 2017+", "Jeep Compass 2017+",
    "Hyundai Santa Fe 2013-2018", "Kia Sorento 2011-2015",
    "MG HS 2020+", "Toyota Fortuner 2016+",
  ],
  "225/65R16": ["Toyota Highlander 2010-2013", "Honda Pilot 2010-2015", "Nissan Murano 2011-2014"],
  "235/50R18": [
    "Toyota RAV4 2019+", "Mazda CX-5 2017+", "Honda CR-V 2017+",
    "Kia Sportage 2017+", "Hyundai Tucson 2019+", "MG RX5 2021+",
  ],
  "235/55R17": [
    "Toyota Highlander 2014+", "Ford Explorer 2011-2016",
    "Jeep Grand Cherokee 2011-2015", "Chevrolet Traverse 2013+", "GMC Acadia 2013+",
  ],
  "235/55R18": [
    "Chevrolet Equinox 2018+", "Ford Edge 2015+", "Jeep Cherokee 2014+",
    "Hyundai Santa Fe 2013+", "Kia Sorento 2015+", "Toyota Camry 2018+",
  ],
  "235/55R19": ["Mazda CX-5 2020+", "Toyota RAV4 2021+", "Hyundai Tucson 2021+", "Kia Sportage 2022+"],
  "235/60R16": ["Toyota 4Runner 2010-2014", "Nissan Pathfinder 2010-2012", "Jeep Liberty 2010-2012"],
  "235/60R17": ["Toyota Fortuner 2016+", "Nissan Frontier 2017+", "Ford Explorer 2011-2014"],
  "235/60R18": [
    "Ford Explorer 2016+", "Jeep Grand Cherokee 2011+",
    "Toyota Highlander 2020+", "Nissan Pathfinder 2013+",
    "Hyundai Santa Fe XL 2013+", "Kia Sorento 2016+",
  ],
  "235/65R17": [
    "Toyota 4Runner 2010+", "Nissan Pathfinder 2013+",
    "Ford Explorer 2011-2015", "Jeep Grand Cherokee 2011-2014",
    "Chevrolet Traverse 2018+", "Toyota Land Cruiser Prado 2010+", "Mazda CX-9 2016+",
  ],
  "235/65R18": ["Nissan Pathfinder 2017+", "Toyota Highlander 2014+", "Ford Expedition 2018+"],
  "235/70R16": ["Toyota 4Runner 2010+", "Nissan Pathfinder 2010+", "Jeep Wrangler 2010+"],
  "245/45R18": ["Nissan Maxima 2016+", "Toyota Avalon 2013+", "Ford Mustang 2015+", "Mazda 6 2014+"],
  "245/50R18": ["Toyota Highlander 2014+", "Mazda CX-9 2016+", "Jeep Grand Cherokee 2015+"],
  "245/50R20": ["Jeep Grand Cherokee 2017+", "Ford Explorer 2020+", "Kia Telluride 2020+"],
  "245/55R19": [
    "Ford Explorer 2017+", "Jeep Grand Cherokee 2017+",
    "Kia Telluride 2020+", "Hyundai Palisade 2020+", "Toyota Highlander 2014+",
  ],
  "245/60R18": [
    "Chevrolet Equinox 2018+", "GMC Terrain 2018+",
    "Ford Escape 2018+", "Jeep Cherokee 2016+", "Hyundai Santa Fe 2019+",
  ],
  "245/65R17": [
    "Chevrolet Tahoe 2015+", "Toyota Sequoia 2010+",
    "Ford Expedition 2018+", "Nissan Armada 2017+", "Toyota Land Cruiser 200",
  ],
  // ── Pickups y SUV grandes ──
  "255/50R20": ["Chevrolet Silverado 2014+", "Ford F-150 2013+", "Jeep Grand Cherokee SRT 2018+"],
  "255/55R18": [
    "Ford Explorer 2013+", "GMC Acadia 2017+",
    "Chevrolet Traverse 2018+", "Toyota Highlander 2020+", "Jeep Grand Cherokee 2011+",
  ],
  "255/60R18": [
    "Chevrolet Suburban 2015+", "GMC Yukon 2015+",
    "Ford Expedition 2018+", "Toyota Land Cruiser 200", "Nissan Armada 2017+",
  ],
  "255/65R17": [
    "Toyota 4Runner 2010+", "Nissan Xterra 2010-2015",
    "Jeep Wrangler 2012+", "Ford F-150 4x4 2010+", "Chevrolet Colorado 2015+",
  ],
  "255/70R16": ["Toyota Land Cruiser 2010+", "Nissan Xterra 2010+", "Jeep Wrangler 2010-2014"],
  "265/50R20": ["RAM 1500 2013+", "Ford F-150 2013+", "Chevrolet Silverado 2014+", "GMC Sierra 2014+"],
  "265/60R18": [
    "Chevrolet Tahoe 2015+", "GMC Yukon 2015+",
    "Ford F-150 2010+", "Toyota Tundra 2010+", "Nissan Armada 2017+",
  ],
  "265/65R17": [
    "Chevrolet Silverado 2010+", "Ford F-150 2010+",
    "GMC Sierra 2010+", "RAM 1500 2010+", "Toyota Tundra 2010+",
    "Toyota Hilux 2016+", "Toyota 4Runner 2010+", "Nissan Frontier 2017+",
  ],
  "265/70R16": [
    "Chevrolet Silverado 2010+", "Ford F-150 2010+",
    "GMC Sierra 2010+", "Toyota Tacoma 2010+", "Jeep Wrangler 2010+",
  ],
  "265/70R17": [
    "Toyota Hilux 2016+", "Toyota Tundra 2014+",
    "Ford Ranger 2019+", "Ford F-150 4x4 2015+",
    "Chevrolet Colorado 2016+", "Nissan Frontier 2020+",
    "Jeep Wrangler 2018+", "RAM 1500 4x4 2019+",
  ],
  "275/55R20": [
    "RAM 1500 2013+", "Ford F-150 FX4 2013+",
    "Chevrolet Silverado LTZ 2013+", "GMC Sierra SLT 2014+", "Toyota Tundra Platinum 2014+",
  ],
  "275/60R20": ["RAM 1500 2015+", "Ford F-150 2015+", "GMC Sierra 1500 2015+"],
  "275/65R18": ["Ford F-250 2011+", "RAM 2500 2011+", "Toyota Tundra Platinum 2014+", "Chevrolet Silverado HD 2015+"],
  "285/50R20": ["Ford F-150 Raptor 2017+", "RAM 1500 TRX 2021+", "GMC Sierra AT4 2019+"],
  "285/65R18": ["Ford F-250 2011+", "RAM 2500 2011+", "Chevrolet Silverado HD 2015+", "Nissan Titan XD 2016+"],
  "285/70R17": [
    "Ford F-250 2011+", "RAM 2500 2011+", "Toyota Tundra 2010+",
    "Nissan Titan 2010+", "Jeep Gladiator 2020+", "Chevrolet Silverado HD 2015+",
  ],
  "305/55R20": ["Ford F-150 Raptor 2017+", "RAM TRX 2021+", "GMC Canyon AT4X 2022+"],
  "315/70R17": ["Ford Bronco 2021+", "Jeep Wrangler Rubicon 2018+"],
  // ── Alto desempeño ──
  "225/40R18": ["VW Golf GTI 2013+", "Ford Focus ST 2013+", "Hyundai Elantra N 2022+"],
  "235/40R18": ["VW Golf R 2013+", "Kia Forte GT 2020+", "Toyota GR86 2022+"],
  "245/35R19": ["Ford Mustang GT500 2020+", "Chevrolet Camaro SS 2016+"],
  "245/40R18": ["Ford Mustang 2015+", "Chevrolet Camaro 2016+", "Kia Stinger 2018+"],
  "245/45R19": ["Toyota Camry XSE 2018+", "Hyundai Sonata N-Line 2021+", "Kia Stinger 2018+"],
  "255/35R18": ["Chevrolet Camaro SS 2016+", "Ford Mustang GT 2015+"],
  "275/35R18": ["Chevrolet Camaro ZL1 2017+", "Ford Mustang Shelby 2016+"],
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
import logoAntares from "../assets/logos/antares.png";
import logoCooper from "../assets/logos/coopertires.png";
import logoGoodrich from "../assets/logos/bfgoodrich.png";
import logoTornel from "../assets/logos/tornel.png";
import logoMaxtrek from "../assets/logos/maxtrek.png";
import logoLinglong from "../assets/logos/linglone.png";
import logoMinnel from "../assets/logos/minnell.png";
import logoMickey from "../assets/logos/mickeytomson.png";
import logoMK5mini from "../assets/logos/mini-logo.png";
import logoMileking from "../assets/logos/mileking.png";
import logoSumaxx from "../assets/logos/sumaxx.png";
import logoAccelera from "../assets/logos/accelera.png";
import logoAgate2 from "../assets/logos/agate.png";
import {
  addToCart,
  buildProductPath,
  buildProductSlug,
  estimateListPrice,
  formatMoney,
  getProductTitle,
} from "../utils/catalogoHelpers";
import { trackEvent } from "../utils/metrics";
import GoogleMapsReviewsEmbed from "../components/GoogleMapsReviewsEmbed";
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
  ANTARES: logoAntares,
  COOPER: logoCooper,
  'COOPER TIRES': logoCooper,
  COOPERTIRES: logoCooper,
  'BF GOODRICH': logoGoodrich,
  BFGOODRICH: logoGoodrich,
  GOODRICH: logoGoodrich,
  TORNEL: logoTornel,
  MAXTREK: logoMaxtrek,
  'LING LONG': logoLinglong,
  LINGLONG: logoLinglong,
  'LING-LONG': logoLinglong,
  MINNELL: logoMinnel,
  MINELL: logoMinnel,
  'MICKEY THOMPSON': logoMickey,
  'MICKEY THOMSON': logoMickey,
  MILEKING: logoMileking,
  SUMAXX: logoSumaxx,
  ACCELERA: logoAccelera,
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
  // ── Marcas premium europeas ──
  MICHELIN: {
    story:
      "Michelin nacio en 1889 en Clermont-Ferrand, Francia, y durante mas de 130 anos ha liderado la industria llantera mundial. Pionera de la llanta radial y la tecnologia Run Flat, equipa en equipamiento original a Ferrari, BMW, Porsche y Audi. Sus lineas Pilot Sport, Primacy y Energy Saver marcan el estandar global en seguridad, durabilidad y eficiencia.",
    focus:
      "En esta medida Michelin ofrece adherencia superior en mojado y seco, bajo ruido de rodamiento y larga vida util. La eleccion de quienes no aceptan compromisos en seguridad ni en kilometraje.",
  },
  CONTINENTAL: {
    story:
      "Continental nacio en Hannover, Alemania en 1871. Con mas de 150 anos de ingenieria alemana es proveedor original de BMW, Mercedes-Benz, Audi y Porsche. Sus llantas integran tecnologia ContiSilent para reducir ruido, ContiSeal para sellado automatico ante perforaciones y compuestos de silicio de ultima generacion.",
    focus:
      "Esta Continental destaca por su respuesta precisa en direccion, frenado corto en mojado y un nivel de ruido por debajo del promedio del mercado. Ingenieria alemana para quienes valoran el manejo tecnico.",
  },
  PIRELLI: {
    story:
      "Pirelli fue fundada en 1872 en Milan, Italia. Sinonimo de estilo, precision y desempeno extremo, es el proveedor oficial exclusivo de la Formula 1 desde 2011. Equipa a Ferrari, Lamborghini, Maserati y McLaren en equipamiento original. Sus lineas P Zero, Cinturato y Scorpion son el referente mundial en llantas de alta performance.",
    focus:
      "Esta Pirelli garantiza adherencia en curvas a alta velocidad, respuesta inmediata a la direccion y frenada corta en seco y mojado. La eleccion de pilotos y conductores que exigen el maximo en cada frenada.",
  },
  // ── Marcas premium japonesas / americanas ──
  BRIDGESTONE: {
    story:
      "Bridgestone fue fundada en 1931 en Kurume, Japon, por Shojiro Ishibashi. Hoy es el fabricante de llantas mas grande del mundo, presente en mas de 150 paises. Proveedor tecnico de Formula 1, NASCAR y equipamiento original en Toyota, Honda, Ford y Audi. Sus lineas Potenza, Ecopia y Dueler son referente en desempeno, eficiencia y traccion.",
    focus:
      "En esta medida Bridgestone prioriza el equilibrio entre adherencia en curvas, eficiencia de combustible y durabilidad. Su banda de rodamiento optimiza la evacuacion de agua para mayor seguridad en pavimento mojado.",
  },
  GOODYEAR: {
    story:
      "Goodyear fue fundada en 1898 en Akron, Ohio, por Frank Seiberling. Con mas de 125 anos de historia es proveedor oficial de NASCAR, IndyCar y multiple campeones de resistencia. Sus lineas Eagle F1, EfficientGrip y Wrangler son lideres en desempeno deportivo, eficiencia y traccion todo terreno.",
    focus:
      "Esta Goodyear ofrece frenado corto en humedo y seco, bajo ruido de rodamiento y resistencia superior al desgaste para mayor kilometraje. Tecnologia americana con respaldo de competicion.",
  },
  DUNLOP: {
    story:
      "Dunlop lleva el nombre de John Boyd Dunlop, inventor del neumatico pneumatico en 1888. Con mas de 135 anos de historia, pertenece al grupo Sumitomo Rubber Industries. Sus lineas Sport Maxx, SP Sport y AT20 son preferidas en Europa, Japon y Mexico por su equilibrio entre desempeno y durabilidad en todo tipo de vehiculo.",
    focus:
      "Esta Dunlop ofrece una conduccion firme y segura con buena respuesta en mojado y bajo ruido. Mas de un siglo de experiencia en el automovilismo mundial respaldando cada kilometro.",
  },
  FALKEN: {
    story:
      "Falken es la marca deportiva de Sumitomo Rubber Industries, creada en Japon en 1983. Disenada para entusiastas y competencia en circuitos, equipa autos de drift, time attack y rallycross a nivel mundial. Sus series Ziex, Azenis y Wildpeak combinan tecnologia de competencia con versatilidad para uso diario.",
    focus:
      "La Falken en esta medida aporta agarre lateral superior, respuesta precisa en direccion y durabilidad para conduccion dinamica. Opcion deportiva confiable con ingenieria japonesa comprobada en pista.",
  },
  BFGOODRICH: {
    story:
      "BF Goodrich fue fundada en 1870 en Akron, Ohio, y hoy forma parte del grupo Michelin. Es la llanta Trail Rated OEM para Jeep y proveedora de llantas de competencia para el Baja 1000 y el SCORE International. Sus lineas All-Terrain T/A y Mud-Terrain T/A son el referente mundial en traccion mixta y off-road extremo.",
    focus:
      "Esta BFGoodrich entrega maximo agarre en terraceria, grava y superficies irregulares manteniendo control en carretera. Para conductores que no ponen limites al terreno.",
  },
  COOPER: {
    story:
      "Cooper Tires fue fundada en 1914 en Findlay, Ohio. Con mas de 110 anos de fabricacion americana combina tradicion e innovacion en llantas de turismo, SUV y off-road. Sus series Discoverer y CS5 son reconocidas en Norteamerica por durabilidad, traccion y precio competitivo.",
    focus:
      "La Cooper en esta medida ofrece traccion confiable en seco y mojado, bajo nivel de ruido y mayor kilometraje. Calidad americana sin pagar precio de importacion europea.",
  },
  FIRESTONE: {
    story:
      "Firestone fue fundada en 1900 en Akron, Ohio, por Harvey Firestone. Hoy pertenece al grupo Bridgestone y es una de las marcas mas reconocidas en America del Norte. Sus lineas Destination y FR710 son referentes en llantas para SUV, pickups y turismo con enfasis en durabilidad y traccion.",
    focus:
      "La Firestone en esta medida prioriza traccion confiable, larga vida util y bajo costo por kilometro. Eleccion americana solida para uso diario intensivo en ciudad y carretera.",
  },
  // ── Marcas premium coreanas ──
  HANKOOK: {
    story:
      "Hankook fue fundada en 1941 en Seoul, Corea del Sur. Con mas de 80 anos de innovacion es proveedor OEM de BMW, Mercedes y Audi, y patrocinador tecnico del DTM y campeonatos europeos. Sus plantas en Alemania, Hungria y Corea producen llantas Ventus, Kinergy y Dynapro certificadas bajo los estandares europeos mas exigentes.",
    focus:
      "En esta medida Hankook combina bajo ruido, buena traccion en mojado y larga vida util. Tecnologia coreana certificada en Europa a un precio mas competitivo que las marcas premium.",
  },
  KUMHO: {
    story:
      "Kumho Tire fue fundada en 1960 en Corea del Sur. Con mas de 60 anos de experiencia exporta a mas de 180 paises y es proveedor OEM de Hyundai, Kia y GM. Sus lineas Ecsta y Solus combinan polimeros de ultima generacion para alto desempeno en mojado y seco con larga durabilidad y bajo ruido.",
    focus:
      "Esta Kumho entrega adherencia solida, buena respuesta de direccion y comodidad acustica. Alternativa coreana de calidad comprobada para conductores que valoran la relacion costo-beneficio.",
  },
  NEXEN: {
    story:
      "Nexen Tire, fundada en 1942 en Corea del Sur, es hoy un fabricante global con plantas en Corea, China y la Republica Checa. Sus modelos N'Fera y Roadian son proveedores OEM de Kia, Hyundai y Renault en Europa, con compuestos de silicio de ultima generacion para maxima eficiencia.",
    focus:
      "La Nexen en esta medida ofrece bajo nivel de ruido, buena evacuacion de agua y respuesta equilibrada en direccion. Calidad coreana en crecimiento con presencia en los mercados europeos mas exigentes.",
  },
  LAUFENN: {
    story:
      "Laufenn es la marca de valor premium del grupo Hankook, lanzada en 2015. Fabricada en la misma planta y con los mismos estandares de produccion que Hankook, ofrece tecnologia coreana certificada a un precio mas accesible. Sus modelos G FIT EQ y S FIT AS son opcion OEM recomendada por talleres en Europa y America.",
    focus:
      "Esta Laufenn combina confort de rodamiento, buena traccion en mojado y durabilidad a un precio mas competitivo. Tecnologia Hankook sin el precio premium, ideal para conductores que exigen calidad sin gastar de mas.",
  },
  // ── Marcas mexicanas / regionales ──
  EUZKADI: {
    story:
      "Euzkadi es la marca mexicana mas emblematica de la industria llantera nacional, con raices que se remontan a 1945 en El Salto, Jalisco. Hoy forma parte del grupo Continental, combinando identidad mexicana con ingenieria alemana. Sus llantas estan disenadas especificamente para las condiciones de carretera, clima y uso del mercado mexicano.",
    focus:
      "Llanta disenada para el conductor mexicano: resistente al calor intenso, adaptada a la variedad de pavimentos del pais y con precio accesible sin sacrificar seguridad. La eleccion nacional de confianza.",
  },
  TORNEL: {
    story:
      "Tornel es una marca 100% mexicana con mas de 70 anos de historia, fundada en 1953 en la Ciudad de Mexico. Disenada para las condiciones del mercado nacional, sus llantas Turbo y Astral son una de las opciones mas populares para autos compactos y subcompactos en Mexico por su accesibilidad y amplia distribucion.",
    focus:
      "Llanta de turismo economica pensada para el uso diario urbano en Mexico. Ofrece durabilidad basica, resistencia al calor y buena relacion precio-kilometro para conductores con presupuesto ajustado.",
  },
  // ── Marcas chinas de mediana gama ──
  LINGLONG: {
    story:
      "Linglong Tire fue fundada en 1975 en Shandong, China, y hoy es uno de los 10 fabricantes de llantas mas grandes del mundo. Con plantas en China y Serbia exporta a mas de 100 paises y es proveedor de Volkswagen en Europa. Sus lineas Green-Max y Crosswind ofrecen calidad consistente y precio competitivo en turismo, SUV y camioneta.",
    focus:
      "Llanta china de mediana gama con calidad documentada para el mercado europeo. Ofrece durabilidad confiable, buen nivel de ruido y traccion aceptable en mojado para uso diario.",
  },
  ACCELERA: {
    story:
      "Accelera es la marca premium de Elang Perdana Tyre, fabricante indonesio fundado en 1995 con exportacion a mas de 60 paises. Sus lineas PHI-R e Iota ST-68 son populares entre entusiastas del automovilismo en Asia y America Latina por su desempeno en mojado y relacion costo-beneficio superior.",
    focus:
      "Llanta de mediana gama con enfasis en desempeno. Ofrece buena traccion lateral, respuesta en direccion y durabilidad competente para conductores que buscan algo mas que lo basico sin pagar precio premium.",
  },
  GENERAL: {
    story:
      "General Tire fue fundada en 1915 en Akron, Ohio, y hoy pertenece al grupo Continental. Con mas de 100 anos de historia americana y la ingenieria alemana de Continental, sus llantas Grabber para pickups y SUV son referente de durabilidad para uso de trabajo intensivo y todo terreno en Norteamerica.",
    focus:
      "Esta General Tire ofrece durabilidad comprobada para uso de trabajo intensivo, con traccion confiable en seco y grava. Tecnologia Continental a precio competitivo para conductores que exigen rendimiento en cada kilómetro.",
  },
  MAXTREK: {
    story:
      "Maxtrek es una marca china fabricada por Shandong Hengfeng Rubber & Plastic Co., fundada en 2007. Disenada para el mercado latinoamericano y asiatico, combina precios accesibles con una gama amplia que cubre turismo, SUV y todo terreno para conductores de presupuesto moderado.",
    focus:
      "Llanta economica que cubre las necesidades basicas de traccion, durabilidad y confort para manejo urbano y de carretera. Buena opcion para conductores que priorizan el precio sin sacrificar funcionalidad.",
  },
  // ── Marcas de entrada ──
  ANTARES: {
    story:
      "Antares es una marca china del grupo Triangle Tire, uno de los 10 fabricantes de llantas mas grandes de China con mas de 60 anos de produccion. Orientada al segmento economico en America Latina, ofrece llantas de turismo, SUV y camioneta con precio competitivo respaldado por infraestructura industrial de gran escala.",
    focus:
      "Llanta de entrada con precio muy competitivo para conductores que priorizan la accesibilidad. Ideal para vehiculos de uso urbano moderado con presupuesto reducido de mantenimiento.",
  },
  BLACKHAWK: {
    story:
      "Blackhawk es la marca de valor del grupo Hankook, fabricada con los mismos estandares de produccion coreana. Lanzada para el mercado latinoamericano y de Medio Oriente, combina tecnologia Hankook con un precio mas asequible para conductores que buscan calidad verificada sin pagar precio premium.",
    focus:
      "Llanta de valor con respaldo tecnologico del grupo Hankook. Ofrece traccion confiable en seco y buena durabilidad para uso urbano diario a un precio muy competitivo.",
  },
  MIRAGE: {
    story:
      "Mirage es una marca china orientada al mercado latinoamericano, producida por fabricantes de Shandong, China. Disenada para el segmento de precio economico, ofrece una propuesta practica para conductores que buscan cubrir sus necesidades de movilidad sin una gran inversion inicial.",
    focus:
      "Opcion economica para uso urbano moderado. Su relacion precio-durabilidad la hace accesible para autos de segundo uso y flotas de bajo presupuesto con necesidades basicas de transporte.",
  },
  SAFERICH: {
    story:
      "Saferich es una marca china del grupo Triangle Tire, uno de los fabricantes con mayor volumen de produccion en Asia. Sus llantas estan disenadas para America Latina con enfasis en precio accesible y disponibilidad amplia en las medidas mas populares del mercado.",
    focus:
      "Propuesta economica para uso urbano y de carretera. Adecuada para conductores con presupuesto limitado que buscan cubrir sus necesidades basicas de transporte diario.",
  },
  VINMAX: {
    story:
      "Vinmax es una marca china producida por Anhui Jichi Tire Co. Ltd., fabricante activo desde 2011 con distribucion en America Latina y Asia. Sus lineas Ecotour estan orientadas al transporte urbano de pasajeros en vehiculos compactos y subcompactos con una propuesta de precio muy accesible.",
    focus:
      "Llanta de entrada para uso urbano diario en vehiculos compactos. Cumple funciones basicas de traccion y durabilidad con una propuesta de precio accesible para conductores con presupuesto ajustado.",
  },
  KPATOS: {
    story:
      "Kpatos es una marca china comercializada por Qingdao Sunfulcess Tyre Co., Ltd., empresa establecida en 2015. Con presencia en America Latina, Asia y Africa, ofrece llantas de turismo y SUV con calidad media a precio competitivo para conductores que buscan accesibilidad en medidas populares.",
    focus:
      "Llanta de entrada orientada a conductores que buscan precio accesible para uso urbano moderado. Su propuesta de valor se centra en la disponibilidad de medidas populares a bajo costo inicial.",
  },
  PEGASUS: {
    story:
      "Pegasus es una marca americana fabricada en China bajo estandares norteamericanos para el mercado de America Latina y Medio Oriente. Ofrece una gama de llantas de turismo y SUV con enfasis en precio competitivo y disponibilidad en medidas de alta rotacion.",
    focus:
      "Llanta de valor para uso urbano y de carretera. Combina diseno accesible con un nivel de durabilidad aceptable para conductores de presupuesto moderado que buscan fiabilidad en el dia a dia.",
  },
  HAIDA: {
    story:
      "Haida Tire es una marca china de Shandong Haohua Tire Co., fundada en 2000. Con exportacion a mas de 60 paises en Asia, America Latina y Africa, ofrece llantas de turismo, SUV y camioneta con una calidad media a precio competitivo, siendo una opcion de valor creciente en el mercado latinoamericano.",
    focus:
      "Llanta de mediana gama para uso urbano y de carretera. Ofrece traccion funcional y durabilidad aceptable a un precio accesible para conductores que buscan mas kilometraje por su inversion.",
  },
  ILINK: {
    story:
      "Ilink es una marca china del grupo Shandong Yinbao Tyre Group, uno de los fabricantes con mayor capacidad de produccion en China. Disenada para el mercado latinoamericano con una gama de llantas de turismo y todas las estaciones que combina precio accesible con calidad funcional.",
    focus:
      "Llanta de entrada con buena relacion precio-durabilidad para uso diario en ciudad y carretera. Opcion funcional para conductores de vehiculos compactos con presupuesto moderado.",
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
  "MG",
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
    "MG",
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
    });
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

  const widthN     = parseInt(medida) || 185;
  const isTruck    = widthN >= 265;
  const isSUV      = widthN >= 225 && widthN < 265;
  const isHighPerf = /\bSPORT\b|RS\b|\bGT\b|PILOT|SPORT MAXX|PS4|POTENZA|SPORT CONTACT|EAGLE F1/i.test(full);

  // Sufijo de marca: se agrega cuando el perfil está disponible
  const usageSuffix = verifiedSpec?.usageNote ? ` ${verifiedSpec.usageNote}` : "";

  if (runFlat)
    return `${marca} ${modelo} — Tecnología Run Flat: puedes seguir rodando hasta 80 km con llanta desinflada. Ideal para vehículos BMW, Mercedes y autos de lujo sin aro de repuesto.${brandSuffix}`;

  if (extremeMud)
    return `${marca} ${modelo} en medida ${medida}. Llanta Mud Terrain de máximo agarre en lodo, barro y terrenos extremos. Perfecta para expediciones, 4x4 y uso intensivo off-road.${brandSuffix}`;

  if (offRoad && isTruck)
    return `${marca} ${modelo} en medida ${medida}. Llanta All Terrain para camionetas y pickups. Excelente tracción en terracería, grava y caminos rurales, sin sacrificar comodidad en carretera.${brandSuffix}`;

  if (offRoad)
    return `${marca} ${modelo} en medida ${medida}. Llanta All Terrain para uso mixto ciudad-campo. Banda de rodamiento reforzada para terracería, brechas y carretera con óptimo control en todo terreno.${brandSuffix}`;

  if (isTruck)
    return `${marca} ${modelo} en medida ${medida}. Llanta para pickup y camioneta. Diseñada para soportar alta carga, resistir el calor y ofrecer estabilidad a alta velocidad en carretera. Larga vida útil y bajo costo por kilómetro.${brandSuffix}`;

  if (isSUV)
    return `${marca} ${modelo} en medida ${medida}. Llanta para SUV y crossover con excelente agarre en mojado y seco. Cómoda en autopista y confiable en ciudad, con baja resistencia a la rodadura para mejor rendimiento de combustible.${brandSuffix}`;

  if (isHighPerf)
    return `${marca} ${modelo} en medida ${medida}. Llanta de alto rendimiento para conducción deportiva. Máxima adherencia en curvas, respuesta precisa a la dirección y frenada corta en seco y mojado.${brandSuffix}`;

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

  // Turismo estándar sin perfil de marca
  return `${marca} ${modelo} en medida ${medida}. Llanta de turismo para sedán y hatchback. Excelente balance entre confort, agarre en mojado, bajo nivel de ruido y eficiencia en combustible para uso diario en ciudad y carretera.`;
}


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
          <div className="product-discount-ribbon">4x3 o 25% de descuento</div>
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
          <p className="product-price-legend">Precio final con 25% de descuento aplicado. Promo equivalente a 4x3.</p>

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
              <button type="button" onClick={() => setQty((n) => Math.min(stock, n + 1))}>
                +
              </button>
            </div>
          </div>

          <div className="product-actions product-actions--top">
            <button
              className="btn-primary"
              type="button"
              onClick={() => {
                const ok = addToCart(item, Math.min(qty, stock));
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
                const ok = addToCart(item, Math.min(2, stock));
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
                const ok = addToCart(item, Math.min(4, stock));
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
                const ok = addToCart(item, Math.min(qty, stock));
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
              {Array.from(new Set([
                brandProfile?.story,
                brandProfile?.focus,
                verifiedSpec?.brandStory,
                verifiedSpec?.usageNote,
              ].filter(Boolean))).map((text) => (
                <p key={text}>{text}</p>
              ))}
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
                A continuación se muestra una lista de vehículos compatibles con la medida de llantas {key || item.medida || ""}. Le pueden quedar según el año y versión del vehículo. Sin embargo, la lista no cubre todos los vehículos con los que puede ser compatible esta medida.
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
                  <p>Escribe marca, modelo y año y te mando la pregunta lista al asistente IA con la medida {key || item.medida || ""}.</p>
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
                  <div className={`market-logo ${row.logo.toLowerCase()}`}>
                    {row.logo === "ML" && (
                      <svg viewBox="0 0 40 40" width="30" height="30" xmlns="http://www.w3.org/2000/svg">
                        <rect width="40" height="40" rx="8" fill="#ffe600"/>
                        <text x="20" y="26" textAnchor="middle" fontWeight="900" fontSize="14" fontFamily="Arial" fill="#2968c8">ML</text>
                      </svg>
                    )}
                    {row.logo === "AMZ" && (
                      <svg viewBox="0 0 40 40" width="30" height="30" xmlns="http://www.w3.org/2000/svg">
                        <rect width="40" height="40" rx="8" fill="#fff"/>
                        <text x="20" y="22" textAnchor="middle" fontWeight="900" fontSize="18" fontFamily="Arial" fill="#111">a</text>
                        <path d="M10 29 Q20 34 30 29" stroke="#f59e0b" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                      </svg>
                    )}
                    {row.logo === "MK5" && (
                      <img src={logoMK5mini} alt="MK5" style={{width:30,height:30,objectFit:"contain",filter:"brightness(0) invert(1)"}} />
                    )}
                  </div>
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

        <div className="detail-section">
          <GoogleMapsReviewsEmbed
            title="Reseñas en Google Maps"
            subtitle="Tambien puedes ver las opiniones publicas de la sucursal MK5 directamente desde Google Maps."
          />
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
