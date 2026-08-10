import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Calendar, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { AppShell } from "@/components/AppShell";
import {
  IntegrityBadge,
  LoadingRows,
  Pill,
  SectionTitle,
  StatCard,
  StatusBadge,
} from "@/components/ui-kit";
import { useAsync } from "@/hooks/useAsync";
import { tenderService } from "@/services/tenderService";
import { shortHash } from "@/services/api";
import type { TenderCategory } from "@/services/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tenders/")({
  head: () => ({
    meta: [
      { title: "Public Tenders Dashboard | DecentralAI Tender" },
      {
        name: "description",
        content:
          "Browse on-chain public tenders with AI integrity scores, smart contract status and live bid counts.",
      },
      { property: "og:title", content: "Public Tenders Dashboard | DecentralAI Tender" },
      {
        property: "og:description",
        content: "On-chain tenders with AI integrity scoring and encrypted bidding.",
      },
    ],
  }),
  component: TendersPage,
});

const CATEGORIES: (TenderCategory | "All")[] = ["All", "Infrastructure", "IT", "Defense"];

function TendersPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<TenderCategory | "All">("All");
  const [budgetPct, setBudgetPct] = useState(100);
  const [deadline, setDeadline] = useState("");

  const { data, loading } = useAsync(
    () => tenderService.listTenders({ search, category, deadlineBefore: deadline || undefined }),
    [search, category, deadline],
  );

  const tenders = useMemo(() => {
    const list = data ?? [];
    const maxEth = 3000;
    return list.filter((t) => {
      const normalized = t.budgetCurrency === "ETH" ? t.budget : t.budget / 2400;
      return normalized <= (budgetPct / 100) * maxEth;
    });
  }, [data, budgetPct]);

  const flagged = tenders.filter((t) => t.status === "Flagged").length;
  const totalBids = tenders.reduce((sum, t) => sum + t.bidCount, 0);

  return (
    <AppShell>
      <SectionTitle
        title="Public Tenders"
        subtitle="Every listing is anchored to a verifiable smart contract."
      />

      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Live" value={String(tenders.length)} />
        <StatCard label="Bids" value={String(totalBids)} tone="success" />
        <StatCard label="Flagged" value={String(flagged)} tone="destructive" />
      </div>

      <div className="panel mt-4 space-y-3 p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tender, ID or issuing body"
            className="bg-surface pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                category === c
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : "border-border bg-surface text-muted-foreground",
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="mono-xs uppercase text-muted-foreground">Budget ceiling</span>
            <span className="mono-xs text-primary">
              ≤ {Math.round((budgetPct / 100) * 3000)} ETH eq.
            </span>
          </div>
          <Slider
            value={[budgetPct]}
            onValueChange={([v]) => setBudgetPct(v ?? 100)}
            min={10}
            max={100}
            step={5}
          />
        </div>

        <div>
          <label className="mono-xs mb-1 block uppercase text-muted-foreground" htmlFor="deadline">
            Deadline before
          </label>
          <Input
            id="deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="bg-surface"
          />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? <LoadingRows rows={4} /> : null}
        {!loading && tenders.length === 0 ? (
          <p className="panel p-6 text-center text-sm text-muted-foreground">
            No tenders match these filters.
          </p>
        ) : null}
        {!loading &&
          tenders.map((t) => (
            <Link
              key={t.id}
              to="/tenders/$tenderId"
              params={{ tenderId: t.id }}
              className="panel hairline-top relative block overflow-hidden p-3 transition-colors hover:border-primary/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="mono-xs text-muted-foreground">{t.id}</p>
                  <h3 className="text-sm font-semibold leading-snug">{t.title}</h3>
                </div>
                <StatusBadge status={t.status} />
              </div>

              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Building2 className="size-3.5" />
                {t.issuingBody}
              </p>

              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="font-display text-lg font-semibold text-primary">
                    {t.budget.toLocaleString()} {t.budgetCurrency}
                  </p>
                  <p className="mono-xs text-muted-foreground">
                    {shortHash(t.smartContractAddr, 8, 6)}
                  </p>
                </div>
                <IntegrityBadge score={t.riskScore} />
              </div>

              <div className="mt-3 flex items-center gap-2 border-t border-border pt-2">
                <Pill tone={t.contractVerified ? "success" : "destructive"}>
                  {t.contractVerified ? "Contract Verified" : "Unverified"}
                </Pill>
                <span className="mono-xs flex items-center gap-1 text-muted-foreground">
                  <Users className="size-3" /> {t.bidCount} bids
                </span>
                <span className="mono-xs ml-auto flex items-center gap-1 text-muted-foreground">
                  <Calendar className="size-3" /> {t.deadline}
                </span>
              </div>
            </Link>
          ))}
      </div>
    </AppShell>
  );
}
