import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  FileLock2,
  Loader2,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { AppShell } from "@/components/AppShell";
import { IntegrityBadge, LoadingRows, Pill, SectionTitle, StatusBadge } from "@/components/ui-kit";
import { useAsync, useAsyncAction } from "@/hooks/useAsync";
import { tenderService } from "@/services/tenderService";
import { fraudDetectionService } from "@/services/fraudDetectionService";
import { shortHash } from "@/services/api";
import { useRole } from "@/context/RoleContext";
import type { Tender } from "@/services/types";

export const Route = createFileRoute("/tenders/$tenderId")({
  head: () => ({
    meta: [
      { title: "Tender Detail | DecentralAI Tender" },
      {
        name: "description",
        content:
          "Full tender specification, deliverables, on-chain timeline and encrypted bid submission.",
      },
      { property: "og:title", content: "Tender Detail | DecentralAI Tender" },
      {
        property: "og:description",
        content: "Specifications, deliverables and encrypted bidding for a public tender.",
      },
    ],
  }),
  component: TenderDetailPage,
});

function TenderDetailPage() {
  const { tenderId } = Route.useParams();
  const { data: tender, loading } = useAsync(() => tenderService.getTender(tenderId), [tenderId]);
  const { data: bids, refetch: refetchBids } = useAsync(
    () => tenderService.listBids(tenderId),
    [tenderId],
  );
  const { data: alerts } = useAsync(
    () => fraudDetectionService.listAlertsForTender(tenderId),
    [tenderId],
  );

  return (
    <AppShell>
      <Link
        to="/tenders"
        className="mono-xs mb-3 inline-flex items-center gap-1 text-muted-foreground"
      >
        <ArrowLeft className="size-3.5" /> All tenders
      </Link>

      {loading || !tender ? (
        <LoadingRows rows={4} />
      ) : (
        <>
          <div className="panel hairline-top relative overflow-hidden p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="mono-xs text-muted-foreground">{tender.id}</p>
                <h1 className="font-display text-lg font-semibold leading-snug">{tender.title}</h1>
                <p className="mt-1 text-xs text-muted-foreground">{tender.issuingBody}</p>
              </div>
              <StatusBadge status={tender.status} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <p className="mono-xs uppercase text-muted-foreground">Budget</p>
                <p className="font-display text-xl font-semibold text-primary">
                  {tender.budget.toLocaleString()} {tender.budgetCurrency}
                </p>
              </div>
              <div>
                <p className="mono-xs uppercase text-muted-foreground">AI Integrity</p>
                <div className="mt-1">
                  <IntegrityBadge score={tender.riskScore} />
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-1.5 border-t border-border pt-3">
              <Row label="Contract" value={shortHash(tender.smartContractAddr, 10, 8)} />
              <Row label="IPFS CID" value={shortHash(tender.IPFS_CID, 12, 6)} />
              <Row label="Deadline" value={tender.deadline} />
              <Row label="Bids received" value={String(tender.bidCount)} />
            </div>

            <div className="mt-4">
              <SubmitBidDialog tender={tender} onSubmitted={refetchBids} />
            </div>
          </div>

          <div className="mt-5">
            <SectionTitle title="Scope & Specifications" />
            <p className="panel p-3 text-sm leading-relaxed text-muted-foreground">
              {tender.description}
            </p>
          </div>

          <div className="mt-5">
            <SectionTitle title="Required Deliverables" />
            <ul className="panel divide-y divide-border p-0">
              {tender.deliverables.map((d) => (
                <li key={d} className="flex items-start gap-2 p-3 text-sm">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5">
            <SectionTitle title="Timeline" />
            <ol className="panel space-y-3 p-3">
              {tender.timeline.map((t, i) => (
                <li key={t.phase} className="flex items-center gap-3">
                  <span className="mono-xs flex size-6 items-center justify-center rounded-full border border-primary/50 bg-primary/10 text-primary">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm">{t.phase}</span>
                  <span className="mono-xs text-muted-foreground">{t.date}</span>
                </li>
              ))}
            </ol>
          </div>

          {alerts && alerts.length > 0 ? (
            <div className="mt-5">
              <SectionTitle title="Active AI Flags" />
              <div className="space-y-2">
                {alerts.map((a) => (
                  <div key={a.id} className="panel border-destructive/30 p-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="size-4 text-destructive" />
                      <span className="text-xs font-semibold">{a.detectionType}</span>
                      <Pill tone="destructive" className="ml-auto">
                        {a.riskScore}%
                      </Pill>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {a.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-5">
            <SectionTitle title="Sealed Bids" subtitle="Amounts stay encrypted until reveal." />
            <div className="space-y-2">
              {(bids ?? []).map((b) => (
                <div key={b.id} className="panel flex items-center gap-3 p-3">
                  <FileLock2 className="size-4 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{b.bidderName}</p>
                    <p className="mono-xs truncate text-muted-foreground">
                      {b.encryptedProposalHash}
                    </p>
                  </div>
                  <Pill tone={b.flaggedForFraud ? "destructive" : "success"}>
                    {b.aiSimilarityScore}% sim
                  </Pill>
                </div>
              ))}
              {bids && bids.length === 0 ? (
                <p className="panel p-4 text-center text-xs text-muted-foreground">
                  No bids sealed yet.
                </p>
              ) : null}
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="mono-xs uppercase text-muted-foreground">{label}</span>
      <span className="mono-xs text-foreground">{value}</span>
    </div>
  );
}

function SubmitBidDialog({ tender, onSubmitted }: { tender: Tender; onSubmitted: () => void }) {
  const { vendorIdentity } = useRole();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [proposal, setProposal] = useState("");
  const [encrypting, setEncrypting] = useState(0);
  const submit = useAsyncAction(tenderService.submitBid);

  async function handleSubmit() {
    const value = Number(amount);
    if (!value || proposal.trim().length < 20) {
      toast.error("Enter a bid amount and a proposal of at least 20 characters.");
      return;
    }
    setEncrypting(30);
    const timer = setInterval(() => setEncrypting((p) => Math.min(90, p + 15)), 180);
    const bid = await submit.run({
      tenderId: tender.id,
      bidderName: vendorIdentity.name,
      bidderAddress: vendorIdentity.address,
      bidAmount: value,
      proposalText: proposal,
    });
    clearInterval(timer);
    setEncrypting(100);
    if (bid) {
      toast.success("Bid successfully hashed and submitted to blockchain testnet", {
        description: `${bid.encryptedProposalHash} · CID ${shortHash(bid.ipfsCid ?? "", 10, 4)}`,
      });
      if (bid.flaggedForFraud) {
        toast.warning("AI Flag Raised: proposal similarity above cartel threshold", {
          description: `NLP similarity ${bid.aiSimilarityScore}% against the live bid corpus.`,
        });
      }
      setOpen(false);
      setAmount("");
      setProposal("");
      setEncrypting(0);
      onSubmitted();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2">
          <FileLock2 className="size-4" /> Submit Encrypted Bid
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-2rem)] rounded-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Submit Encrypted Bid</DialogTitle>
          <DialogDescription className="text-xs">
            Your amount is committed as a hash. Nothing is revealed until the seal expires.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="mono-xs uppercase" htmlFor="amount">
              Bid amount ({tender.budgetCurrency})
            </Label>
            <Input
              id="amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={String(Math.round(tender.budget * 0.93))}
              className="mt-1 bg-surface"
            />
          </div>
          <div>
            <Label className="mono-xs uppercase" htmlFor="proposal">
              Technical proposal
            </Label>
            <Textarea
              id="proposal"
              rows={5}
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              placeholder="Methodology, mobilisation plan, key personnel…"
              className="mt-1 bg-surface"
            />
          </div>
          <div className="rounded-md border border-border bg-surface p-3">
            <p className="mono-xs flex items-center gap-1.5 text-muted-foreground">
              <Sparkles className="size-3 text-primary" /> AES-256 commit · zk bid proof · IPFS pin
            </p>
            <Progress value={encrypting} className="mt-2 h-1.5" />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={submit.pending} className="w-full gap-2">
            {submit.pending ? <Loader2 className="size-4 animate-spin" /> : null}
            {submit.pending ? "Sealing on-chain…" : "Seal & Broadcast"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
