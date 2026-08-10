import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Fingerprint, Radar, RefreshCw, ShieldAlert, Snowflake, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppShell } from "@/components/AppShell";
import { LoadingRows, Pill, RiskBadge, SectionTitle, StatCard } from "@/components/ui-kit";
import { useAsync, useAsyncAction } from "@/hooks/useAsync";
import { fraudDetectionService } from "@/services/fraudDetectionService";
import type { AlertStatus } from "@/services/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/fraud-monitor")({
  head: () => ({
    meta: [
      { title: "AI Fraud Detection Monitor | DecentralAI Tender" },
      {
        name: "description",
        content:
          "Real-time collusion, front-running and ghost-vendor detection across public tender bidding.",
      },
      { property: "og:title", content: "AI Fraud Detection Monitor | DecentralAI Tender" },
      {
        property: "og:description",
        content: "Collusion clustering, cartel heatmaps and ghost vendor verification.",
      },
    ],
  }),
  component: FraudMonitorPage,
});

function FraudMonitorPage() {
  const [seed, setSeed] = useState(0);
  const alerts = useAsync(() => fraudDetectionService.listAlerts(), []);
  const clusters = useAsync(() => fraudDetectionService.getCollusionClusters(), []);
  const heatmap = useAsync(() => fraudDetectionService.getRiskHeatmap(), []);
  const ghosts = useAsync(() => fraudDetectionService.getGhostVendorChecks(), []);
  const trend = useAsync(() => fraudDetectionService.getRiskTrend(seed), [seed]);
  const scan = useAsyncAction(fraudDetectionService.runScan);
  const updateStatus = useAsyncAction(fraudDetectionService.updateAlertStatus);

  const list = alerts.data ?? [];
  const critical = list.filter((a) => a.riskLevel === "Critical").length;

  async function handleScan() {
    const result = await scan.run();
    setSeed((s) => s + 1);
    trend.refetch();
    if (result) {
      toast.success(`Scan complete · ${result.scanned} bid vectors analysed`, {
        description: `${result.newFlags} new anomaly candidate(s) in ${result.durationMs}ms.`,
      });
      if (result.newFlags > 0) {
        toast.warning("AI Flag Raised: Suspicious wallet cluster detected");
      }
    }
  }

  async function act(id: string, status: AlertStatus, message: string) {
    await updateStatus.run(id, status);
    alerts.refetch();
    toast.success(message);
  }

  return (
    <AppShell>
      <SectionTitle
        title="Fraud Detection Control Center"
        subtitle="Models re-score every sealed bid on each new block."
      />

      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Open flags" value={String(list.length)} tone="warning" />
        <StatCard label="Critical" value={String(critical)} tone="destructive" />
        <StatCard label="Models" value="4 live" tone="success" />
      </div>

      <Button
        onClick={handleScan}
        disabled={scan.pending}
        variant="secondary"
        className="mt-3 w-full gap-2"
      >
        <RefreshCw className={cn("size-4", scan.pending && "animate-spin")} />
        {scan.pending ? "Running anomaly sweep…" : "Run Live Anomaly Sweep"}
      </Button>

      <div className="panel mt-4 p-3">
        <p className="mono-xs mb-2 uppercase text-muted-foreground">Risk signal · last 24h</p>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend.data ?? []}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" stroke="var(--color-muted-foreground)" fontSize={10} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={10} width={24} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface-raised)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="collusion"
                stroke="var(--color-chart-1)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="frontRunning"
                stroke="var(--color-chart-2)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="phantom"
                stroke="var(--color-chart-5)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Tabs defaultValue="collusion" className="mt-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="collusion" className="text-[11px]">
            Collusion
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="text-[11px]">
            Cartel Map
          </TabsTrigger>
          <TabsTrigger value="ghost" className="text-[11px]">
            Ghost Vendor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="collusion" className="mt-3">
          <div className="panel p-3">
            <p className="mono-xs mb-2 flex items-center gap-1.5 uppercase text-muted-foreground">
              <Radar className="size-3.5 text-primary" /> Shared IP · wallet overlap · price anomaly
            </p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clusters.data ?? []}>
                  <CartesianGrid
                    stroke="var(--color-border)"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="cluster"
                    stroke="var(--color-muted-foreground)"
                    fontSize={9}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={48}
                  />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={10} width={24} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-surface-raised)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="sharedIp" fill="var(--color-chart-1)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="walletOverlap" fill="var(--color-chart-2)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="priceAnomaly" fill="var(--color-chart-4)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="heatmap" className="mt-3">
          <div className="panel p-3">
            <p className="mono-xs mb-3 uppercase text-muted-foreground">
              Front-running &amp; cartel risk by seal window
            </p>
            <div className="grid grid-cols-6 gap-1 text-center">
              <span />
              {["T-24h", "T-12h", "T-6h", "T-1h", "Seal"].map((w) => (
                <span key={w} className="mono-xs text-muted-foreground">
                  {w}
                </span>
              ))}
              {(["Infrastructure", "IT", "Defense"] as const).map((cat) => (
                <HeatRow
                  key={cat}
                  category={cat}
                  cells={(heatmap.data ?? []).filter((c) => c.category === cat)}
                />
              ))}
            </div>
            <div className="mono-xs mt-3 flex items-center gap-2 text-muted-foreground">
              <span className="size-3 rounded-sm bg-success/70" /> low
              <span className="size-3 rounded-sm bg-warning/70" /> elevated
              <span className="size-3 rounded-sm bg-destructive/70" /> critical
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ghost" className="mt-3">
          <div className="panel divide-y divide-border p-0">
            {(ghosts.data ?? []).map((g) => (
              <div key={g.vendor} className="p-3">
                <div className="flex items-center gap-2">
                  <Fingerprint className="size-4 text-primary" />
                  <span className="flex-1 truncate text-sm font-medium">{g.vendor}</span>
                  <Pill
                    tone={
                      g.verdict === "Verified"
                        ? "success"
                        : g.verdict === "Suspicious"
                          ? "warning"
                          : "destructive"
                    }
                  >
                    {g.verdict}
                  </Pill>
                </div>
                <div className="mono-xs mt-2 grid grid-cols-3 gap-2 text-muted-foreground">
                  <span>Reg: {g.registration ? "✓ found" : "✗ missing"}</span>
                  <span>Tax: {g.taxRecords ? "✓ filed" : "✗ none"}</span>
                  <span>Wallet: {g.walletAge}d</span>
                </div>
                <p className="mono-xs mt-1 text-muted-foreground">
                  Model confidence of fraud: {g.confidence}%
                </p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-5">
        <SectionTitle title="Audit Log Feed" subtitle="Most recent AI risk flags." />
        {alerts.loading ? <LoadingRows rows={3} /> : null}
        <div className="space-y-3">
          {list.map((a) => (
            <div key={a.id} className="panel hairline-top relative overflow-hidden p-3">
              <div className="flex items-center gap-2">
                <ShieldAlert
                  className={cn(
                    "size-4",
                    a.riskLevel === "Critical" ? "text-destructive" : "text-warning",
                  )}
                />
                <span className="text-sm font-semibold">{a.detectionType}</span>
                <RiskBadge level={a.riskLevel} />
                <span className="mono-xs ml-auto text-muted-foreground">{a.id}</span>
              </div>

              <p className="mono-xs mt-1 text-muted-foreground">{a.tenderTitle}</p>

              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-raised">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      a.riskScore > 70
                        ? "bg-destructive"
                        : a.riskScore > 40
                          ? "bg-warning"
                          : "bg-success",
                    )}
                    style={{ width: `${a.riskScore}%` }}
                  />
                </div>
                <span className="mono-xs">{a.riskScore}%</span>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{a.description}</p>

              <div className="mono-xs mt-2 flex flex-wrap gap-1">
                {a.vendors.map((v) => (
                  <span
                    key={v}
                    className="rounded border border-border bg-surface px-1.5 py-0.5 text-muted-foreground"
                  >
                    {v}
                  </span>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <Pill tone={a.status === "Approved" ? "success" : "muted"}>{a.status}</Pill>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8 gap-1 px-2 text-[11px]"
                    onClick={() => act(a.id, "Frozen", `Tender ${a.tenderId} frozen on-chain`)}
                  >
                    <Snowflake className="size-3" /> Freeze
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 px-2 text-[11px]"
                    onClick={() =>
                      act(a.id, "Audit Requested", "On-chain audit requested from validator quorum")
                    }
                  >
                    Audit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1 px-2 text-[11px]"
                    onClick={() => act(a.id, "Approved", "Flag cleared and signed by auditor")}
                  >
                    <ThumbsUp className="size-3" /> Approve
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function HeatRow({
  category,
  cells,
}: {
  category: string;
  cells: { window: string; risk: number }[];
}) {
  return (
    <>
      <span className="mono-xs self-center text-left text-muted-foreground">
        {category.slice(0, 5)}
      </span>
      {cells.map((c) => (
        <span
          key={c.window}
          className={cn(
            "mono-xs flex h-9 items-center justify-center rounded-sm font-semibold",
            c.risk > 70
              ? "bg-destructive/70 text-destructive-foreground"
              : c.risk > 45
                ? "bg-warning/70 text-warning-foreground"
                : "bg-success/60 text-success-foreground",
          )}
        >
          {c.risk}
        </span>
      ))}
    </>
  );
}
