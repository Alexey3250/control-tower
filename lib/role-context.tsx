"use client";

import * as React from "react";
import type { UserRole } from "@/lib/types";

interface RoleContextValue {
  role: UserRole;
  setRole: (r: UserRole) => void;
}

const RoleContext = React.createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = React.useState<UserRole>("Network Director");
  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = React.useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be inside <RoleProvider>");
  return ctx;
}

export const ROLES: UserRole[] = [
  "Network Director",
  "Station Manager",
  "Vendor Manager",
];
