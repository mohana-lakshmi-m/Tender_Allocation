import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { UserRole } from "@/services/types";

interface RoleContextValue {
  role: UserRole;
  setRole: (role: UserRole) => void;
  vendorIdentity: { name: string; address: string };
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

const STORAGE_KEY = "dai-tender-role";

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>("issuer");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as UserRole | null;
    if (stored === "issuer" || stored === "bidder" || stored === "inspector") setRole(stored);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, role);
  }, [role]);

  const value = useMemo<RoleContextValue>(
    () => ({
      role,
      setRole,
      vendorIdentity: {
        name: "Vanta Infra Works",
        address: "0x71c9e0a3b5482df6910c47bb8e2a3f5d6c0918ae",
      },
    }),
    [role],
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}

export const ROLE_META: Record<UserRole, { label: string; short: string; blurb: string }> = {
  issuer: {
    label: "Tender Authority",
    short: "Issuer",
    blurb: "Publish tenders, review AI audits, trigger allocation.",
  },
  bidder: {
    label: "Contractor / Vendor",
    short: "Bidder",
    blurb: "Submit encrypted bids and track compliance feedback.",
  },
  inspector: {
    label: "AI Fraud Auditor",
    short: "Inspector",
    blurb: "Investigate fraud signals and verify on-chain proofs.",
  },
};
