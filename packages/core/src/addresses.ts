/**
 * International shipping addresses: per-country field labels, region lists,
 * postal-code rules, and display formatting in each country's usual order.
 * Countries without a specific format get generic optional region/postal fields.
 */
import type { Address } from "./people";
import { defaultT, intlTag, type Tr } from "./i18n";

type Region = { code: string; name: string };

/**
 * Field labels are message keys under core.address (see addressLabels for the text).
 */
export interface AddressFormat {
  /** Label key for line2 (Mexico's colonia and Brazil's bairro matter for delivery). */
  line2Label: string;
  line2Required?: boolean;
  regionLabel: string;
  regionRequired: boolean;
  /** Pick-list when the country has a fixed set; stored value is `code`. */
  regions?: Region[];
  postalLabel: string;
  postalRequired: boolean;
  postalPattern?: RegExp;
  postalExample?: string;
  /** Normalize the typed postal code (uppercase, add the usual separator). */
  postalFormat?: (raw: string) => string;
  /** Lines after the street lines, in local order. */
  localityLines: (a: Address, regionName: string) => string[];
}

const r = (pairs: string): Region[] =>
  pairs.split("|").map((p) => {
    const [code, name] = p.split(":");
    return { code: code!, name: name ?? code! };
  });

const US_STATES = r(
  "AL:Alabama|AK:Alaska|AZ:Arizona|AR:Arkansas|CA:California|CO:Colorado|CT:Connecticut|DE:Delaware|DC:District of Columbia|FL:Florida|GA:Georgia|HI:Hawaii|ID:Idaho|IL:Illinois|IN:Indiana|IA:Iowa|KS:Kansas|KY:Kentucky|LA:Louisiana|ME:Maine|MD:Maryland|MA:Massachusetts|MI:Michigan|MN:Minnesota|MS:Mississippi|MO:Missouri|MT:Montana|NE:Nebraska|NV:Nevada|NH:New Hampshire|NJ:New Jersey|NM:New Mexico|NY:New York|NC:North Carolina|ND:North Dakota|OH:Ohio|OK:Oklahoma|OR:Oregon|PA:Pennsylvania|RI:Rhode Island|SC:South Carolina|SD:South Dakota|TN:Tennessee|TX:Texas|UT:Utah|VT:Vermont|VA:Virginia|WA:Washington|WV:West Virginia|WI:Wisconsin|WY:Wyoming|PR:Puerto Rico|GU:Guam|VI:U.S. Virgin Islands|AS:American Samoa|MP:Northern Mariana Islands|AA:Armed Forces Americas|AE:Armed Forces Europe|AP:Armed Forces Pacific",
);
const CA_PROVINCES = r(
  "AB:Alberta|BC:British Columbia|MB:Manitoba|NB:New Brunswick|NL:Newfoundland and Labrador|NS:Nova Scotia|NT:Northwest Territories|NU:Nunavut|ON:Ontario|PE:Prince Edward Island|QC:Quebec|SK:Saskatchewan|YT:Yukon",
);
const MX_STATES = r(
  "AGS:Aguascalientes|BC:Baja California|BCS:Baja California Sur|CAMP:Campeche|CHIS:Chiapas|CHIH:Chihuahua|CDMX:Ciudad de México|COAH:Coahuila|COL:Colima|DGO:Durango|MEX:Estado de México|GTO:Guanajuato|GRO:Guerrero|HGO:Hidalgo|JAL:Jalisco|MICH:Michoacán|MOR:Morelos|NAY:Nayarit|NL:Nuevo León|OAX:Oaxaca|PUE:Puebla|QRO:Querétaro|QROO:Quintana Roo|SLP:San Luis Potosí|SIN:Sinaloa|SON:Sonora|TAB:Tabasco|TAMPS:Tamaulipas|TLAX:Tlaxcala|VER:Veracruz|YUC:Yucatán|ZAC:Zacatecas",
);
const BR_STATES = r(
  "AC:Acre|AL:Alagoas|AP:Amapá|AM:Amazonas|BA:Bahia|CE:Ceará|DF:Distrito Federal|ES:Espírito Santo|GO:Goiás|MA:Maranhão|MT:Mato Grosso|MS:Mato Grosso do Sul|MG:Minas Gerais|PA:Pará|PB:Paraíba|PR:Paraná|PE:Pernambuco|PI:Piauí|RJ:Rio de Janeiro|RN:Rio Grande do Norte|RS:Rio Grande do Sul|RO:Rondônia|RR:Roraima|SC:Santa Catarina|SP:São Paulo|SE:Sergipe|TO:Tocantins",
);
const CO_DEPARTMENTS = r(
  "AMA:Amazonas|ANT:Antioquia|ARA:Arauca|ATL:Atlántico|DC:Bogotá D.C.|BOL:Bolívar|BOY:Boyacá|CAL:Caldas|CAQ:Caquetá|CAS:Casanare|CAU:Cauca|CES:Cesar|CHO:Chocó|COR:Córdoba|CUN:Cundinamarca|GUA:Guainía|GUV:Guaviare|HUI:Huila|LAG:La Guajira|MAG:Magdalena|MET:Meta|NAR:Nariño|NSA:Norte de Santander|PUT:Putumayo|QUI:Quindío|RIS:Risaralda|SAP:San Andrés y Providencia|SAN:Santander|SUC:Sucre|TOL:Tolima|VAC:Valle del Cauca|VAU:Vaupés|VID:Vichada",
);

const upper = (s: string) => s.toUpperCase();
const join = (...parts: (string | undefined)[]) => parts.filter((p) => p && p.trim()).join(" ");

const FORMATS: Record<string, AddressFormat> = {
  US: {
    line2Label: "aptSuite",
    regionLabel: "state",
    regionRequired: true,
    regions: US_STATES,
    postalLabel: "zip",
    postalRequired: true,
    postalPattern: /^\d{5}(-\d{4})?$/,
    postalExample: "94110",
    localityLines: (a) => [`${a.city}, ${join(a.region, a.postalCode)}`],
  },
  CA: {
    line2Label: "aptSuite",
    regionLabel: "province",
    regionRequired: true,
    regions: CA_PROVINCES,
    postalLabel: "postalCode",
    postalRequired: true,
    postalPattern: /^[A-Z]\d[A-Z] \d[A-Z]\d$/,
    postalExample: "K1A 0B1",
    postalFormat: (raw) => {
      const s = upper(raw).replace(/[^A-Z0-9]/g, "");
      return s.length > 3 ? `${s.slice(0, 3)} ${s.slice(3, 6)}` : s;
    },
    localityLines: (a) => [`${a.city} ${join(a.region, a.postalCode)}`],
  },
  MX: {
    line2Label: "colonia",
    line2Required: true,
    regionLabel: "state",
    regionRequired: true,
    regions: MX_STATES,
    postalLabel: "codigoPostal",
    postalRequired: true,
    postalPattern: /^\d{5}$/,
    postalExample: "06700",
    localityLines: (a, region) => [`C.P. ${a.postalCode} ${a.city}, ${region}`],
  },
  BR: {
    line2Label: "complementBairro",
    line2Required: true,
    regionLabel: "state",
    regionRequired: true,
    regions: BR_STATES,
    postalLabel: "cep",
    postalRequired: true,
    postalPattern: /^\d{5}-\d{3}$/,
    postalExample: "01310-100",
    postalFormat: (raw) => {
      const d = raw.replace(/\D/g, "").slice(0, 8);
      return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
    },
    localityLines: (a) => [`${a.city} - ${a.region}`, `CEP ${a.postalCode}`],
  },
  CO: {
    line2Label: "barrioApt",
    regionLabel: "department",
    regionRequired: true,
    regions: CO_DEPARTMENTS,
    postalLabel: "postalCodeOptional",
    postalRequired: false,
    postalPattern: /^\d{6}$/,
    postalExample: "110111",
    localityLines: (a, region) => [`${a.city}, ${region}${a.postalCode ? ` ${a.postalCode}` : ""}`],
  },
  GB: {
    line2Label: "flatBuilding",
    regionLabel: "countyOptional",
    regionRequired: false,
    postalLabel: "postcode",
    postalRequired: true,
    postalPattern: /^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/,
    postalExample: "SW1A 1AA",
    postalFormat: (raw) => {
      const s = upper(raw).replace(/[^A-Z0-9]/g, "");
      return s.length > 3 ? `${s.slice(0, -3)} ${s.slice(-3)}` : s;
    },
    localityLines: (a) => [a.city.toUpperCase(), ...(a.region ? [a.region] : []), a.postalCode],
  },
};

const GENERIC: AddressFormat = {
  line2Label: "aptUnitBuilding",
  regionLabel: "regionGeneric",
  regionRequired: false,
  postalLabel: "postalCode",
  postalRequired: false,
  localityLines: (a) => [join(a.postalCode, a.city), ...(a.region ? [a.region] : [])].filter(Boolean),
};

export function addressFormat(country: string | undefined): AddressFormat {
  return FORMATS[(country ?? "US").toUpperCase()] ?? GENERIC;
}

/** The country's field labels in the translator's language. */
export function addressLabels(country: string | undefined, t: Tr = defaultT): { line2: string; region: string; postal: string } {
  const f = addressFormat(country);
  return { line2: t(`core.address.${f.line2Label}`), region: t(`core.address.${f.regionLabel}`), postal: t(`core.address.${f.postalLabel}`) };
}

/** ISO 3166-1 alpha-2 codes, most likely destinations first, then everyone else. */
export const PRIORITY_COUNTRIES = ["US", "CA", "MX", "BR", "CO", "GB"] as const;
const ALL_CODES =
  "AD AE AF AG AI AL AM AO AR AT AU AW AZ BA BB BD BE BF BG BH BI BJ BM BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CW CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FO FR GA GB GD GE GF GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KI KM KN KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MO MQ MR MT MU MV MW MX MY MZ NA NC NE NG NI NL NO NP NR NZ OM PA PE PF PG PH PK PL PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WS XK YE ZA ZM ZW".split(" ");

const displayNames = new Map<string, Intl.DisplayNames | null>();
/** Country name in the translator's language ("BR" → "Brazil"/"Brasil"); the code where Intl.DisplayNames is missing. */
export function countryName(code: string, t: Tr = defaultT): string {
  const tag = intlTag(t);
  if (!displayNames.has(tag)) {
    try {
      displayNames.set(tag, new Intl.DisplayNames([tag], { type: "region" }));
    } catch {
      displayNames.set(tag, null);
    }
  }
  return displayNames.get(tag)?.of(code.toUpperCase()) ?? code.toUpperCase();
}

/** Countries for a picker: priority ones first, then the rest alphabetically by name. */
export function countryOptions(t: Tr = defaultT): { code: string; name: string }[] {
  const prio = new Set<string>(PRIORITY_COUNTRIES);
  const rest = ALL_CODES.filter((c) => !prio.has(c))
    .map((code) => ({ code, name: countryName(code, t) }))
    .sort((a, b) => a.name.localeCompare(b.name, intlTag(t)));
  return [...PRIORITY_COUNTRIES.map((code) => ({ code, name: countryName(code, t) })), ...rest];
}

export function isCountryCode(v: unknown): v is string {
  return typeof v === "string" && ALL_CODES.includes(v.toUpperCase());
}

/** Country implied by a browser locale ("pt-BR" → "BR"), if it's a real country code. */
export function countryForLocale(locale: string | undefined): string | null {
  const region = locale?.split(/[-_]/)[1]?.toUpperCase();
  return region && isCountryCode(region) ? region : null;
}

function regionName(a: Address): string {
  return addressFormat(a.country).regions?.find((x) => x.code === a.region)?.name ?? a.region;
}

/** Address lines in the country's usual order; adds the country unless it matches `home`. */
export function formatAddress(a: Address, home = "US", t: Tr = defaultT): string[] {
  const f = addressFormat(a.country);
  const lines = [a.name, a.line1, a.line2, ...f.localityLines(a, regionName(a))].filter((l): l is string => !!l && !!l.trim());
  if (a.country && a.country.toUpperCase() !== home.toUpperCase()) lines.push(countryName(a.country, t));
  return lines;
}

/** "City, Region, Country" for short mentions (e.g. reminder emails). */
export function shortPlace(a: Address, home = "US", t: Tr = defaultT): string {
  // US, Canada and Brazil conventionally write the short code ("Portland, OR"; "São Paulo, SP").
  const useCode = ["US", "CA", "BR"].includes((a.country ?? "US").toUpperCase());
  const parts = [a.city, useCode ? a.region : regionName(a)];
  if (a.country && a.country.toUpperCase() !== home.toUpperCase()) parts.push(countryName(a.country, t));
  return parts.filter(Boolean).join(", ");
}

export type AddressErrors = Partial<Record<keyof Address, string>>;

/** Field errors for a filled-in address (empty optional fields are fine). */
export function validateAddress(a: Partial<Address>, t: Tr = defaultT): AddressErrors {
  const f = addressFormat(a.country);
  const L = addressLabels(a.country, t);
  const err = (k: string, v?: Record<string, string>) => t(`core.address.errors.${k}`, v);
  const lower = (s: string) => s.toLocaleLowerCase(intlTag(t));
  const e: AddressErrors = {};
  if (!a.country || !isCountryCode(a.country)) e.country = err("country");
  if (!a.line1?.trim()) e.line1 = err("line1");
  if (f.line2Required && !a.line2?.trim()) e.line2 = err("required", { field: L.line2 });
  if (!a.city?.trim()) e.city = err("city");
  if (f.regionRequired && !a.region?.trim()) e.region = err("required", { field: L.region });
  else if (f.regions && a.region && !f.regions.some((x) => x.code === a.region)) e.region = err("choose", { field: L.region, fieldLower: lower(L.region) });
  const postal = a.postalCode?.trim() ?? "";
  if (f.postalRequired && !postal) e.postalCode = err("required", { field: L.postal });
  else if (postal && f.postalPattern && !f.postalPattern.test(postal)) e.postalCode = f.postalExample ? err("format", { example: f.postalExample }) : err("postal");
  return e;
}

export function isCompleteAddress(a: Partial<Address>): a is Address {
  return Object.keys(validateAddress(a)).length === 0;
}

/**
 * Server-side cleanup of an untrusted address: trims, caps lengths, normalizes
 * the country and postal code. Returns undefined if it isn't a usable address.
 */
export function cleanAddress(input: unknown): Address | undefined {
  if (!input || typeof input !== "object") return undefined;
  const o = input as Record<string, unknown>;
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const country = str(o.country, 2).toUpperCase() || "US";
  const f = addressFormat(country);
  const rawPostal = str(o.postalCode, 20);
  const a: Address = {
    name: str(o.name, 120) || undefined,
    line1: str(o.line1, 200),
    line2: str(o.line2, 200) || undefined,
    city: str(o.city, 120),
    region: str(o.region, 120),
    postalCode: f.postalFormat ? f.postalFormat(rawPostal) : rawPostal,
    country,
  };
  return isCompleteAddress(a) ? a : undefined;
}
