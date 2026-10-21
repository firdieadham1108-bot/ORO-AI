// Deterministic enquiry extraction. No AI: plain rules, so results are predictable and explainable.
import { addDays, fromDateString, makeDate, referenceDate } from "./dates";

export interface ParsedEnquiry {
  serviceCode: string | null;
  quantity: number | null;
  specification: string | null;
  items: ParsedItem[];
  requestedDate: string | null;
  location: string | null;
  referenceDate: string;
  missing: string[];
  clarification: string | null;
}

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, fifteen: 15, twenty: 20,
};
const CHINESE_DIGITS: Record<string, number> = {
  一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10,
};
const NUM = `(\\d{1,3}|${Object.keys(NUMBER_WORDS).join("|")})`;
const toNumber = (token: string): number =>
  /^\d+$/.test(token)
    ? Number(token)
    : (CHINESE_DIGITS[token] ?? (NUMBER_WORDS[token.toLowerCase()] as number));

const KNOWN_PLACES = [
  "Taman Connaught", "Taman Desa", "Bukit Jalil", "Sri Petaling", "Mont Kiara", "Petaling Jaya", "Shah Alam",
  "Cheras", "Bangsar", "Kepong", "Ampang", "Subang", "Puchong", "Setapak", "Kajang",
  "Damansara", "Sentul", "Klang", "Cyberjaya", "Putrajaya", "Seri Kembangan",
];

// Chinese place names used by customers for the same areas.
const PLACE_ALIASES: Array<[string, string]> = [
  ["蕉赖", "Cheras"], ["安邦", "Ampang"], ["蒲种", "Puchong"], ["甲洞", "Kepong"], ["孟沙", "Bangsar"],
  ["武吉加里尔", "Bukit Jalil"], ["八打灵再也", "Petaling Jaya"], ["加影", "Kajang"],
];

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const DAY_NAMES: Array<[RegExp, number]> = [
  [/\bsun(?:day)?\b/, 0], [/\bmon(?:day)?\b/, 1], [/\btue(?:s|sday)?\b/, 2],
  [/\bwed(?:nesday)?\b/, 3], [/\bthu(?:rs|rsday)?\b/, 4], [/\bfri(?:day)?\b/, 5],
  [/\bsat(?:urday)?\b/, 6],
  // Bahasa Melayu
  [/\bahad\b/, 0], [/\bisnin\b/, 1], [/\bselasa\b/, 2], [/\brabu\b/, 3],
  [/\bkhamis\b/, 4], [/\bjumaat\b/, 5], [/\bsabtu\b/, 6],
];
// Chinese weekdays (no word boundaries in Chinese text).
const CHINESE_DAYS: Array<[RegExp, number]> = [
  [/(?:星期|礼拜|周)[日天]/, 0], [/(?:星期|礼拜|周)一/, 1], [/(?:星期|礼拜|周)二/, 2], [/(?:星期|礼拜|周)三/, 3],
  [/(?:星期|礼拜|周)四/, 4], [/(?:星期|礼拜|周)五/, 5], [/(?:星期|礼拜|周)六/, 6],
];

function extractQuantity(text: string): number | null {
  const patterns = [
    new RegExp(`(?<![\\d.])${NUM}\\s*(?:x\\s*)?(?:units?|pcs|pieces|sets?|aircon[ds]?|aircons|air[- ]?cons?|acs?|biji|buah)\\b`, "i"),
    new RegExp(`(?<![\\d.])${NUM}\\s*(?:x\\s*)?\\d(?:\\.\\d)?\\s*hp\\b`, "i"),
    // Chinese: 一台, 两台, 3台 ...
    /(?<![\d.])([一二两三四五六七八九十]|\d{1,3})\s*(?:台|个|架|部|粒)/,
  ];
  for (const pattern of patterns) {
    const m = pattern.exec(text);
    if (m?.[1]) return toNumber(m[1]);
  }
  return null;
}

function extractHorsepower(text: string): number | null {
  const m = /(\d(?:\.\d)?)\s*hp\b/i.exec(text);
  return m?.[1] ? parseFloat(m[1]) : null;
}

function extractDate(text: string, ref: string): string | null {
  const lower = text.toLowerCase();
  const refYear = Number(ref.slice(0, 4));

  const iso = /\b(\d{4})-(\d{2})-(\d{2})\b/.exec(lower);
  if (iso) return makeDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const dayMonth = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTHS.join("|")})[a-z]*(?:\\s+(\\d{4}))?`).exec(lower);
  if (dayMonth) {
    const month = MONTHS.indexOf(dayMonth[2] as string) + 1;
    return makeDate(dayMonth[3] ? Number(dayMonth[3]) : refYear, month, Number(dayMonth[1]));
  }

  const chinese = /(\d{1,2})\s*月\s*(\d{1,2})\s*[号日]/.exec(text);
  if (chinese) return makeDate(refYear, Number(chinese[1]), Number(chinese[2]));

  const slash = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/.exec(lower);
  if (slash) {
    const year = slash[3] ? (slash[3].length === 2 ? 2000 + Number(slash[3]) : Number(slash[3])) : refYear;
    return makeDate(year, Number(slash[2]), Number(slash[1]));
  }

  if (/\btoday\b/.test(lower)) return ref;
  if (/\btomorrow\b|\btmr\b|\btmrw\b/.test(lower)) return addDays(ref, 1);

  const refDow = fromDateString(ref).getUTCDay();
  for (const [pattern, dow] of CHINESE_DAYS) {
    const m = new RegExp(`(下)?${pattern.source}`).exec(text);
    if (m) {
      const delta = (dow - refDow + 7) % 7;
      return addDays(ref, m[1] ? delta + 7 : delta);
    }
  }
  for (const [pattern, dow] of DAY_NAMES) {
    const m = new RegExp(`(?:\\b(next|this)\\s+)?${pattern.source}`).exec(lower);
    if (m) {
      // "this Friday" / "Friday": next such day on or after the reference date.
      // "next Friday": that day in the following week.
      const delta = (dow - refDow + 7) % 7;
      return addDays(ref, m[1] === "next" ? delta + 7 : delta);
    }
  }
  return null;
}

function extractLocation(text: string): string | null {
  for (const place of KNOWN_PLACES) {
    if (new RegExp(`\\b${place}\\b`, "i").test(text)) return place;
  }
  for (const [alias, place] of PLACE_ALIASES) {
    if (text.includes(alias)) return place;
  }
  const m = /\b(?:at|in|@|dekat|di)\s+(?:our\s+|the\s+|my\s+)?([A-Z][\w'-]*(?:\s+[A-Z][\w'-]*){0,3})/.exec(text);
  if (!m?.[1]) return null;
  const candidate = m[1].trim();
  const blocked = /^(mon|tue|wed|thu|fri|sat|sun|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|boss|can|please)/i;
  return blocked.test(candidate) ? null : candidate;
}

/** One requested service line, e.g. "2 x 1.0HP installation". */
export interface ParsedItem {
  serviceCode: string | null;
  serviceKind: "install" | "standard_service" | "chemical_wash";
  quantity: number | null;
  specification: string | null;
  issue: string | null; // why this line cannot be priced yet
}

const KIND_LABEL: Record<ParsedItem["serviceKind"], string> = {
  install: "installation",
  standard_service: "standard servicing",
  chemical_wash: "chemical wash",
};

// Keywords in English, Bahasa Melayu and Chinese. Chemical wash is checked first so that
// "chemical wash" / "cuci kimia" is not also read as ordinary servicing.
const CHEMICAL_RE = /chemical\s*(?:wash|clean)\w*|cuci\s*kimia|化学(?:清)?洗/i;
const INSTALL_RE = /\binstall\w*|\bpasang\w*|\bpemasangan\b|安装|装/i;
const SERVICE_RE = /\bservic(?:e|es|ing)\b|\bmaintenance\b|\bservis\b|保养|维修保养/i;

/** Detect which service a piece of text asks for (first match wins, chemical before service). */
function serviceKindOf(text: string): ParsedItem["serviceKind"] | null {
  if (CHEMICAL_RE.test(text)) return "chemical_wash";
  if (INSTALL_RE.test(text)) return "install";
  if (SERVICE_RE.test(text.replace(new RegExp(CHEMICAL_RE.source, "gi"), ""))) return "standard_service";
  return null;
}

/** Split a multi-service message into one segment per service ("dan", "and", "另外", commas...). */
function segmentsOf(message: string): string[] {
  return message
    .split(/\s+(?:dan|and|plus|also|serta)\s+|另外|以及|还有|[，,;；]/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseItem(text: string, kind: ParsedItem["serviceKind"]): ParsedItem {
  const quantity = extractQuantity(text);
  const label = KIND_LABEL[kind];
  if (kind !== "install") {
    return {
      serviceKind: kind,
      serviceCode: kind,
      quantity,
      specification: null,
      issue: quantity === null ? `number of units for ${label}` : null,
    };
  }
  const hp = extractHorsepower(text);
  const specification = hp === null ? null : `${hp.toFixed(1)}HP`;
  let serviceCode: string | null = null;
  let issue: string | null = null;
  if (hp === 1 || hp === 1.5) serviceCode = hp === 1 ? "install_1_0hp" : "install_1_5hp";
  else if (hp !== null) issue = `supported air-conditioner size for the installation (${specification} is not on the price list; only 1.0HP and 1.5HP)`;
  else issue = "air-conditioner size (1.0HP or 1.5HP)";
  if (quantity === null) issue = issue ? `${issue}; number of units for ${label}` : `number of units for ${label}`;
  return { serviceKind: kind, serviceCode, quantity, specification, issue };
}

export function parseEnquiry(message: string): ParsedEnquiry {
  const ref = referenceDate();
  const missing: string[] = [];

  // One service: read the whole message. Several services: read each segment separately.
  const kindsInMessage = (["install", "chemical_wash", "standard_service"] as const).filter((k) =>
    k === "install" ? INSTALL_RE.test(message)
      : k === "chemical_wash" ? CHEMICAL_RE.test(message)
        : SERVICE_RE.test(message.replace(new RegExp(CHEMICAL_RE.source, "gi"), "")),
  );
  let items: ParsedItem[] = [];
  if (kindsInMessage.length === 1) {
    items = [parseItem(message, kindsInMessage[0]!)];
  } else if (kindsInMessage.length > 1) {
    for (const segment of segmentsOf(message)) {
      const kind = serviceKindOf(segment);
      if (kind) items.push(parseItem(segment, kind));
    }
  }

  if (items.length === 0) missing.push("service type (installation, servicing or chemical wash)");
  for (const item of items) if (item.issue) missing.push(item.issue);

  // Primary line (drives the crew rule): installation if any, otherwise the first line.
  const primary = items.find((i) => i.serviceKind === "install") ?? items[0];

  const requestedDate = extractDate(message, ref);
  if (requestedDate === null) missing.push("requested date");

  const location = extractLocation(message);
  if (location === null) missing.push("job location");

  const clarification =
    missing.length > 0
      ? `Please confirm: ${missing.join(", ")}. A quotation is not generated until these are provided.`
      : null;

  return {
    serviceCode: primary?.serviceCode ?? null,
    quantity: primary?.quantity ?? null,
    specification: primary?.specification ?? null,
    items,
    requestedDate,
    location,
    referenceDate: ref,
    missing,
    clarification,
  };
}
