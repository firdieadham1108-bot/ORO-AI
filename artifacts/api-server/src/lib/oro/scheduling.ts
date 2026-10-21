// Decision logic: can CoolAir actually do this job on this date, and if not, when can it?
// Everything is derived from capacity_blocks (via getStaffAvailability); nothing is hard-coded per date.
import { getStaffAvailability } from "./availability";
import { addDays, formatLongDate, fromDateString, referenceDate, WORKING_WINDOW_LABEL } from "./dates";

/** Demo business rules (fictional, not industry standards). Change here to tune the demo. */
export const WORKING_DAYS = [1, 2, 3, 4, 5]; // Monday to Friday (0 = Sunday)
export const ALTERNATIVE_SEARCH_DAYS = 14; // how far ahead to look for another date
export const MAX_ALTERNATIVES = 3;

export interface CrewRequirement {
  crewSize: number;
  minSeniors: number;
  windowHours: number;
}

/** Installation needs two technicians (one senior) for an eight-hour window. Other services: one technician. */
export function crewRequirementFor(serviceCode: string): CrewRequirement {
  if (serviceCode.startsWith("install_")) return { crewSize: 2, minSeniors: 1, windowHours: 8 };
  return { crewSize: 1, minSeniors: 0, windowHours: 8 };
}

export function isWorkingDay(date: string): boolean {
  return WORKING_DAYS.includes(fromDateString(date).getUTCDay());
}

export interface CrewMember {
  id: number;
  name: string;
  role: string;
  isSenior: boolean;
}

export interface CapacityConflict {
  staffId: number;
  staffName: string;
  kind: "leave" | "assignment";
  title: string;
  reference: string;
  startAt: string;
  endAt: string;
  description: string;
}

export interface ScheduleCheck {
  date: string;
  weekday: string;
  verdict: "feasible" | "not_feasible" | "needs_verification";
  workingDay: boolean;
  windowStart: string;
  windowEnd: string;
  requirement: CrewRequirement;
  availableInstallers: number;
  availableSeniorInstallers: number;
  crew: CrewMember[];
  conflicts: CapacityConflict[];
  reasons: string[];
  explanation: string;
}

type Technician = ReturnType<typeof getStaffAvailability>["staff"][number];

const toCrewMember = (s: Technician): CrewMember => ({
  id: s.id,
  name: s.name,
  role: s.role,
  isSenior: s.isSenior,
});

const labelled = (s: { name: string; isSenior: boolean }): string =>
  s.isSenior ? `${s.name} (senior)` : s.name;

function joinNames(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** Smallest crew that meets the rules: required seniors first, then fill up in dispatch order. */
function pickCrew(free: Technician[], requirement: CrewRequirement): Technician[] | null {
  const seniors = free.filter((s) => s.isSenior).slice(0, requirement.minSeniors);
  if (seniors.length < requirement.minSeniors) return null;
  const others = free.filter((s) => !seniors.includes(s)).slice(0, requirement.crewSize - seniors.length);
  const crew = [...seniors, ...others];
  if (crew.length < requirement.crewSize) return null;
  return crew.sort((a, b) => a.dispatchOrder - b.dispatchOrder);
}

export function checkSchedule(date: string, serviceCode: string): ScheduleCheck {
  const requirement = crewRequirementFor(serviceCode);
  const day = getStaffAvailability(date);
  const installers = day.staff.filter((s) => s.canInstall);
  const free = installers
    .filter((s) => s.status === "available")
    .sort((a, b) => a.dispatchOrder - b.dispatchOrder);
  const freeSeniors = free.filter((s) => s.isSenior);
  const workingDay = isWorkingDay(date);
  const isPast = date < referenceDate();

  const conflicts: CapacityConflict[] = installers
    .filter((s) => s.status !== "available")
    .flatMap((s) =>
      s.blocks.map((b) => ({
        staffId: s.id,
        staffName: s.name,
        kind: b.kind,
        title: b.title,
        reference: b.reference,
        startAt: b.startAt,
        endAt: b.endAt,
        description:
          b.kind === "leave"
            ? `${s.name} is on approved leave (${b.reference}).`
            : `${s.name} is already assigned to ${b.title} (${b.reference}).`,
      })),
    );

  const base = {
    date,
    weekday: day.weekday,
    workingDay,
    windowStart: day.windowStart,
    windowEnd: day.windowEnd,
    requirement,
    availableInstallers: free.length,
    availableSeniorInstallers: freeSeniors.length,
    conflicts,
  };
  const longDate = formatLongDate(date);

  // Missing staff records: never claim a date works when there is nothing to check against.
  if (installers.length === 0) {
    const reasons = ["No installation technicians are recorded in the staff directory."];
    return {
      ...base,
      verdict: "needs_verification",
      crew: [],
      reasons,
      explanation: `${longDate} needs verification. ${reasons.join(" ")} Availability cannot be confirmed.`,
    };
  }

  const reasons: string[] = [];
  if (isPast) reasons.push("The requested date has already passed.");
  if (!workingDay) reasons.push(`${day.weekday} is not a working day (the team works Monday to Friday).`);

  const crew = pickCrew(free, requirement);
  if (crew === null) {
    reasons.push(...conflicts.map((c) => c.description));
    if (free.length < requirement.crewSize) {
      reasons.push(
        `Only ${free.length} of the ${requirement.crewSize} qualified technician${requirement.crewSize === 1 ? "" : "s"} needed ${free.length === 1 ? "is" : "are"} free.`,
      );
    }
    if (freeSeniors.length < requirement.minSeniors) {
      reasons.push(
        `${freeSeniors.length === 0 ? "No" : freeSeniors.length} senior installation technician${freeSeniors.length === 1 ? " is" : "s are"} free; at least ${requirement.minSeniors} required.`,
      );
    }
  }

  if (reasons.length === 0 && crew !== null) {
    const names = crew.map(labelled);
    const spare = free.filter((s) => !crew.includes(s)).map((s) => s.name);
    return {
      ...base,
      verdict: "feasible",
      crew: crew.map(toCrewMember),
      reasons: [],
      explanation:
        `${longDate} is feasible. Suggested crew: ${joinNames(names)}, for ${WORKING_WINDOW_LABEL}. ` +
        `No leave or job records overlap that window for them.` +
        (spare.length > 0 ? ` Also free: ${joinNames(spare)}.` : ""),
    };
  }

  return {
    ...base,
    verdict: "not_feasible",
    crew: [],
    reasons,
    explanation: `${longDate} is not feasible. ${reasons.join(" ")}`,
  };
}

/** Next feasible dates after the requested one, within ALTERNATIVE_SEARCH_DAYS. */
export function findAlternatives(requestedDate: string, serviceCode: string): ScheduleCheck[] {
  const ref = referenceDate();
  const from = requestedDate < ref ? addDays(ref, -1) : requestedDate;
  const found: ScheduleCheck[] = [];
  for (let i = 1; i <= ALTERNATIVE_SEARCH_DAYS && found.length < MAX_ALTERNATIVES; i++) {
    const candidate = checkSchedule(addDays(from, i), serviceCode);
    if (candidate.verdict === "feasible") found.push(candidate);
  }
  return found;
}
