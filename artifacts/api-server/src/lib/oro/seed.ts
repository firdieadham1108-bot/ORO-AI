// Synthetic demo data for the fictional CoolAir Services Sdn Bhd (Cheras, Kuala Lumpur).
// Nothing here is real. "Simulated" references stand in for Orbyte People / eLeave / Work records.
// Friday 23 Oct 2026 has no spare qualified crew purely because of these records;
// availability is always calculated from the database, never hard-coded.

// dispatchOrder = the manager's preferred order for picking technicians (1 = first choice).
// When several people are free, the scheduler picks the lowest numbers first.
// Chong is ahead of Ali, so he is the first-choice senior stand-in if Bala drops out on Monday.
export const SEED_STAFF = [
  { id: 1, name: "Ali", role: "Senior Installation Technician", isSenior: true, canInstall: true, dispatchOrder: 4 },
  { id: 2, name: "Bala", role: "Senior Installation Technician", isSenior: true, canInstall: true, dispatchOrder: 1 },
  { id: 3, name: "Mei", role: "Installation Technician", isSenior: false, canInstall: true, dispatchOrder: 2 },
  { id: 4, name: "Chong", role: "Senior Installation Technician", isSenior: true, canInstall: true, dispatchOrder: 3 },
  { id: 5, name: "Faizal", role: "Business Manager", isSenior: false, canInstall: false, dispatchOrder: 99 },
];

export const SEED_BLOCKS = [
  {
    id: 1,
    staffId: 1,
    kind: "leave",
    title: "Approved annual leave",
    startAt: "2026-10-23T00:00:00+08:00",
    endAt: "2026-10-24T00:00:00+08:00",
    reference: "SIM-ELEAVE-0142",
  },
  {
    id: 2,
    staffId: 2,
    kind: "assignment",
    title: "Taman Desa installation",
    startAt: "2026-10-23T09:00:00+08:00",
    endAt: "2026-10-23T17:00:00+08:00",
    reference: "SIM-WORK-TD-2310",
  },
  {
    id: 3,
    staffId: 3,
    kind: "assignment",
    title: "Bukit Jalil servicing visit",
    startAt: "2026-10-23T09:00:00+08:00",
    endAt: "2026-10-23T17:00:00+08:00",
    reference: "SIM-WORK-BJ-2311",
  },
  {
    id: 4,
    staffId: 4,
    kind: "assignment",
    title: "Ampang installation",
    startAt: "2026-10-23T09:00:00+08:00",
    endAt: "2026-10-23T17:00:00+08:00",
    reference: "SIM-WORK-AM-2312",
  },
];

export const SEED_ACTIVITY = [
  {
    action: "demo_seeded",
    description: "Synthetic CoolAir Services staff, leave and job records loaded (simulated Orbyte data).",
    actor: "System",
    severity: "info" as const,
  },
];
