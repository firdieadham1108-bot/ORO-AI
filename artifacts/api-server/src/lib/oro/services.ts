// Approved price list. Synthetic demo prices for CoolAir Services Sdn Bhd -
// not a universal Malaysian market rate. Stored in whole sen to avoid float errors.

export interface ServiceItem {
  code: string;
  name: string;
  specification: string | null;
  unitPriceSen: number;
  unit: string;
}

export const COMPANY_NAME = "CoolAir Services Sdn Bhd";

export const SERVICES: readonly ServiceItem[] = [
  {
    code: "install_1_0hp",
    name: "Air-conditioning installation (1.0HP)",
    specification: "1.0HP",
    unitPriceSen: 16000,
    unit: "per unit",
  },
  {
    code: "install_1_5hp",
    name: "Air-conditioning installation (1.5HP)",
    specification: "1.5HP",
    unitPriceSen: 19000,
    unit: "per unit",
  },
  {
    code: "standard_service",
    name: "Standard air-conditioning service",
    specification: null,
    unitPriceSen: 8000,
    unit: "per unit",
  },
  {
    code: "chemical_wash",
    name: "Chemical wash",
    specification: null,
    unitPriceSen: 15000,
    unit: "per unit",
  },
];

export function findService(code: string): ServiceItem | undefined {
  return SERVICES.find((s) => s.code === code);
}

/** Total in sen = quantity x unit price. Integer maths only. */
export function calculateTotalSen(quantity: number, unitPriceSen: number): number {
  return quantity * unitPriceSen;
}

export function senToRm(sen: number): number {
  return sen / 100;
}
