// Demo role switch (simulated Orbyte roles). Not real authentication: the chosen name is sent
// with approval requests and the server refuses anyone who is not the manager.
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

export type RoleKey = "sales" | "manager";
export const ROLES: Record<RoleKey, { name: string; label: string }> = {
  sales: { name: "Mei", label: "Sales Staff (Mei)" },
  manager: { name: "Faizal", label: "Manager (Faizal)" },
};
export const MANAGER_LOCK_TEXT = "Requires Manager (Faizal) Approval";

const STORAGE_KEY = "oro-demo-role";
const RoleContext = createContext<{ role: RoleKey; setRole: (r: RoleKey) => void } | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<RoleKey>(() =>
    typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY) === "sales" ? "sales" : "manager",
  );
  useEffect(() => window.localStorage.setItem(STORAGE_KEY, role), [role]);
  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside RoleProvider");
  const { role, setRole } = ctx;
  return { role, setRole, isManager: role === "manager", name: ROLES[role].name, label: ROLES[role].label };
}
