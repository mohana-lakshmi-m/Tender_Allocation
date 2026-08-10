import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CircleCheck, Cpu, Link2, Loader2, Trophy, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppShell } from "@/components/AppShell";
import { LoadingRows, Pill, SectionTitle, StatCard } from "@/components/ui-kit";
import { useAsync, useAsyncAction } from "@/hooks/useAsync";
import { tenderService } from "@/services/tenderService";
import { ALLOCATION_WEIGHTS, blockchainService, pipelineStages } from "@/services/blockchainService";
import { shortHash } from "@/services/api";
import type { AllocationScore, OnChainProof } from "@/services/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/allocations")({
  head: () => ({
    meta: [
      { title: "Smart Contract Allocation Hub | DecentralAI Tender" },
      {
        name: "description",
        content:
          "Tender lifecycle pipeline, weighted winner simulation and on-chain proof verification.",
      },
      { property: "og:title", content: "Smart Contract Allocation Hub | DecentralAI Tender" },
      {
        property: "og:description",
        content: "Weighted allocation simulator with zk bid proof verification.",
      },
    ],
  }),
  component: AllocationsPage,
});

function AllocationsPage() {
  const { data: tenders } = useAsync(() => tenderService.listTenders(), []);
  const [tenderId, setTenderId] = useState("TND-1042");
  const [stage, setStage] = useState(2);
  const [scores, setScores] = useState<AllocationScore[]>([]);
  const [proof, setProof] = useState<OnChainProof>();

  const { data: bids, loading } = useAsync(() => tenderService.listBids(tenderId), [tenderId]);
  const simulate = useAsyncAction(blockchainService.simulateAllocation);
  const verify = useAsyncAction(blockchainService.verifyOnChainProof);
  const payout = useAsyncAction(blockchainService.releasePayout);

  async function runSimulation() {
    const result = await simulate.run(bids ?? []);
    if (result) {
      setScores(result);
      setStage(3);
      toast.success("Decentralized evaluation complete", {
        description: result[0]
          ? `${result[0].bidderName} leads with a weighted score of ${result[0].weightedTotal}.`
          : "No sealed bids for this tender.",
      });
    }
  }

  async function runVerify() {
    const result = await verify.run(tenderId);
    if (result) {
      setProof(result);
      toast.success("Zero-knowledge bid proof verified", {
        description: `Block #${result.blockNumber.toLocaleString()} on ${result.network}.`,
      });
    }
  }

  async function runPayout() {
    const winner = scores[0];
    if (!winner) {
      toast.error("Run the allocation simulator first.");
      return;
    }
    const result = await payout.run(tenderId, winner.bidderName);
    if (result) {
      setStage(4);
      toast.success("Escrow released by smart contract", {
        description: `${result.milestone} → ${winner.bidderName} · ${shortHash(result.txHash, 10, 6)}`,
      });
    }
  }

  return (
    <AppShell>
      <SectionTitle
        title="Allocation Hub"
        subtitle="From publication to automated escrow payout."
      />

      <Select value={tenderId} onValueChange={setTenderId}>
        <SelectTrigger className="w-full bg-surface">
          <SelectValue placeholder="Select tender" />
        </SelectTrigger>
        <SelectContent>
          {(tenders ?? []).map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.id} · {t.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="panel mt-4 p-3">
        <p className="mono-xs mb-3 uppercase text-muted-foreground">Lifecycle pipeline</p>
        <ol className="space-y-0">
          {pipelineStages.map((s, i) => {
            const done = i < stage;
            const active = i === stage;
            return (
              <li key={s.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full border text-[11px] font-semibold",
                      done && "border-success/60 bg-success/15 text-success",
                      active && "border-primary bg-primary/15 text-primary scan-pulse",
                      !done && !active && "border-border bg-surface text-muted-foreground",
                    )}
                  >
                    {done ? <CircleCheck className="size-4" /> : i + 1}
                  </span>
                  {i < pipelineStages.length - 1 ? (
                    <span
                      className={cn(
                        "my-1 w-px flex-1",
                        done ? "bg-success/50" : "bg-border",
                      )}
                    />
                  ) : null}
                </div>
                <div className="pb-4">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {s.label}
                  </p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {s.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => setStage((p) => (p + 1) % pipelineStages.length)}
        >
          Advance pipeline stage
        </Button>
      </div>

      <div className="mt-5">
        <SectionTitle
          title="Winner Selection Simulator"
          subtitle={`Fraud risk ${ALLOCATION_WEIGHTS.fraudRisk * 100}% · Price ${
            ALLOCATION_WEIGHTS.price * 100
          }% · Track record ${ALLOCATION_WEIGHTS.trackRecord * 100}%`}
        />

        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Sealed bids" value={String(bids?.length ?? 0)} />
          <StatCard
            label="Top score"
            value={scores[0] ? String(scores[0].weightedTotal) : "—"}
            tone="success"
          />
          <StatCard
            label="Flagged"
            value={String((bids ?? []).filter((b) => b.flaggedForFraud).length)}
            tone="destructive"
          />
        </div>

        <Button onClick={runSimulation} disabled={simulate.pending} className="mt-3 w-full gap-2">
          {simulate.pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Cpu className="size-4" />
          )}
          {simulate.pending ? "Evaluating weighted criteria…" : "Run Allocation Simulation"}
        </Button>

        {loading ? <LoadingRows rows={2} /> : null}

        <div className="mt-3 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-raised">
              <tr className="mono-xs uppercase text-muted-foreground">
                <th className="px-2 py-2">Vendor</th>
                <th className="px-1 py-2">Risk</th>
                <th className="px-1 py-2">Price</th>
                <th className="px-1 py-2">Rec.</th>
                <th className="px-2 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {scores.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-2 py-6 text-center text-muted-foreground">
                    Run the simulation to rank sealed bids.
                  </td>
                </tr>
              ) : (
                scores.map((s, i) => (
                  <tr key={s.bidId} className={cn(i === 0 && "bg-success/10")}>
                    <td className="px-2 py-2">
                      <span className="flex items-center gap-1">
                        {i === 0 ? <Trophy className="size-3 text-success" /> : null}
                        {s.bidderName}
                      </span>
                    </td>
                    <td className="px-1 py-2">{s.fraudRiskScore}</td>
                    <td className="px-1 py-2">{s.priceScore}</td>
                    <td className="px-1 py-2">{s.trackRecordScore}</td>
                    <td className="px-2 py-2 text-right font-semibold text-primary">
                      {s.weightedTotal}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5">
        <SectionTitle title="On-Chain Proof Verification" />
        <div className="panel space-y-2 p-3">
          <ProofRow label="Tx hash" value={proof ? shortHash(proof.txHash, 14, 8) : "—"} />
          <ProofRow label="IPFS proposal" value={proof ? shortHash(proof.ipfsHash, 14, 6) : "—"} />
          <ProofRow label="Block" value={proof ? `#${proof.blockNumber.toLocaleString()}` : "—"} />
          <ProofRow label="Gas used" value={proof ? proof.gasUsed.toLocaleString() : "—"} />
          <div className="flex items-center justify-between pt-1">
            <span className="mono-xs uppercase text-muted-foreground">zk bid proof</span>
            <Pill tone={proof ? "success" : "muted"}>{proof ? proof.zkProofStatus : "Pending"}</Pill>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={runVerify}
              disabled={verify.pending}
              className="gap-2"
            >
              <Link2 className="size-4" /> Verify
            </Button>
            <Button onClick={runPayout} disabled={payout.pending} className="gap-2">
              <Wallet className="size-4" /> Payout
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function ProofRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="mono-xs uppercase text-muted-foreground">{label}</span>
      <span className="mono-xs">{value}</span>
    </div>
  );
}
