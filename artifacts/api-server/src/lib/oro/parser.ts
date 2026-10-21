// Deterministic enquiry extraction. No AI: plain rules, so results are predictable and explainable.
import { addDays, fromDateString, makeDate, referenceDate } from "./dates";

export interface ParsedEnquiry {
  serviceCode: string | null;
  quantity: number | null;
  specification: string | null;
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
const NUM = `(\\d{1,3}|${Object.keys(NUMBER_WORDS).join("|")})`;
const toNumber = (token: string): number =>
  /^\d+$/.test(token) ? Number(token) : (NUMBER_WORDS[token.toLowerCase()] as number);

const KNOWN_PLACES = [
  "Taman Desa", "Bukit Jalil", "Sri Petaling", "Mont Kiara", "Petaling Jaya", "Shah Alam",
  "Cheras", "Bangsar", "Kepong", "Ampang", "Subang", "Puchong", "Setapak", "Kajang",
  "Damansara", "Sentul", "Klang", "Cyberjaya", "Putrajaya", "Seri Kembangan",
];

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const DAY_NAMES: Array<[RegExp, number]> = [
  [/\bsun(?:day)?\b/, 0], [/\bmon(?:day)?\b/, 1], [/\btue(?:s|sday)?\b/, 2],
  [/\bwed(?:nesday)?\b/, 3], [/\bthu(?:rs|rsday)?\b/, 4], [/\bfri(?:day)?\b/, 5],
  [/\bsat(?:urday)?\b/, 6],
];

function extractQuantity(text: string): number | null {
  const patterns = [
    new RegExp(`(?<![\\d.])${NUM}\\s*(?:x\\s*)?(?:units?|pcs|pieces|sets?|aircons?|air[- ]?cons?|acs?)\\b`, "i"),
    new RegExp(`(?<![\\d.])${NUM}\\s*(?:x\\s*)?\\d(?:\\.\\d)?\\s*hp\\b`, "i"),
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

  const slash = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/.exec(lower);
  if (slash) {
    const year = slash[3] ? (slash[3].length === 2 ? 2000 + Number(slash[3]) : Number(slash[3])) : refYear;
    return makeDate(year, Number(slash[2]), Number(slash[1]));
  }

  if (/\btoday\b/.test(lower)) return ref;
  if (/\btomorrow\b|\btmr\b|\btmrw\b/.test(lower)) return addDays(ref, 1);

  const refDow = fromDateString(ref).getUTCDay();
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
  const m = /\b(?:at|in|@)\s+(?:our\s+|the\s+|my\s+)?([A-Z][\w'-]*(?:\s+[A-Z][\w'-]*){0,3})/.exec(text);
  if (!m?.[1]) return null;
  const candidate = m[1].trim();
  const blocked = /^(mon|tue|wed|thu|fri|sat|sun|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|boss|can|please)/i;
  return blocked.test(candidate) ? null : candidate;
}

export function parseEnquiry(message: string): ParsedEnquiry {
  const ref = referenceDate();
  const lower = message.toLowerCase();
  const missing: string[] = [];
  const notes: string[] = [];

  const wantsChemical = /chemical\s*(?:wash|clean)/.test(lower);
  const wantsInstall = /\binstall/.test(lower);
  const wantsService = /\bservic(?:e|ing)\b|\bmaintenance\b/.test(lower.replace(/chemical\s*(?:wash|clean)\w*/g, ""));
  const detected = [wantsInstall, wantsChemical, wantsService].filter(Boolean).length;
  if (detected > 1) {
    notes.push("More than one service was mentioned. Quotations cover one service at a time, so please check the selected service is the one this quotation is for.");
  }

  const hp = extractHorsepower(message);
  let serviceCode: string | null = null;
  let specification: string | null = null;

  if (wantsInstall) {
    if (hp === 1 || hp === 1.5) {
      specification = `${hp.toFixed(1)}HP`;
      serviceCode = hp === 1 ? "install_1_0hp" : "install_1_5hp";
    } else if (hp !== null) {
      specification = `${hp.toFixed(1)}HP`;
      missing.push("supported air-conditioner size (price list covers 1.0HP and 1.5HP installation)");
    } else {
      missing.push("air-conditioner size (1.0HP or 1.5HP)");
    }
  } else if (wantsChemical) {
    serviceCode = "chemical_wash";
  } else if (wantsService) {
    serviceCode = "standard_service";
  } else {
    missing.push("service type (installation, servicing or chemical wash)");
  }

  const quantity = extractQuantity(message);
  if (quantity === null) missing.push("number of units");

  const requestedDate = extractDate(message, ref);
  if (requestedDate === null) missing.push("requested date");

  const location = extractLocation(message);
  if (location === null) missing.push("job location");

  const clarification =
    missing.length > 0
      ? `Please confirm: ${missing.join(", ")}. A quotation is not generated until these are provided.${notes.length ? " " + notes.join(" ") : ""}`
      : notes.length > 0
        ? notes.join(" ")
        : null;

  return { serviceCode, quantity, specification, requestedDate, location, referenceDate: ref, missing, clarification };
}
