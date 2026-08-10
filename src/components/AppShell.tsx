import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, FileStack, GitBranch, ShieldAlert, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { ROLE_META, useRole } from "@/context/RoleContext";
import type { UserRole } from "@/services/types";
import { cn } from "@/lib/utils";

const ROLES: UserRole[] = ["issuer", "bidder", "inspector"];

const NAV = [
  { to: "/tenders", label: "Tenders", icon: FileStack },
  { to: "/fraud-monitor", label: "Fraud AI", icon: ShieldAlert },
  { to: "/allocations", label: "Allocate", icon: GitBranch },
  { to: "/my-bids", label: "My Bids", icon: Wallet },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { role, setRole } = useRole();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 pt-3">
          <Link to="/tenders" className="flex items-center gap-2">
            <span className="relative flex size-8 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/40">
              <Activity className="size-4 text-primary scan-pulse" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-sm font-semibold tracking-tight">
                DecentralAI Tender
              </span>
              <span className="mono-xs block text-muted-foreground">sepolia · node synced</span>
            </span>
          </Link>
          <span className="mono-xs rounded-full border border-success/40 bg-success/10 px-2 py-1 text-success">
            ON-CHAIN
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1 p-3">
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                "rounded-md border px-2 py-2 text-[11px] font-medium transition-colors",
                role === r
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground",
              )}
            >
              {ROLE_META[r].short}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md border-t border-border bg-background/90 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        <div className="grid grid-cols-4">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
