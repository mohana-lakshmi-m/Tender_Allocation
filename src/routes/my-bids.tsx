import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, CloudUpload, Loader2, Lock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { blockchainService } from "@/services/blockchainService";
import { shortHash } from "@/services/api";
import { useRole } from "@/context/RoleContext";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/my-bids")({
  head: () => ({
    meta: [
      { title: "Vendor Portal | DecentralAI Tender" },
      {
        name: "description",
        content:
          "Submit encrypted bids, pin proposals to IPFS and review AI compliance feedback before locking.",
      },
      { property: "og:title", content: "Vendor Portal | DecentralAI Tender" },
      {
        property: "og:description",
        content: "Track bid status, IPFS CIDs and AI compliance feedback.",
      },
    ],
  }),
  component: MyBidsPage,
});

function MyBidsPage() {
  const { vendorIdentity } = useRole();
  const { data: tenders } = useAsync(() => tenderService.listTenders(), []);
  const myBids = useAsync(() => tenderService.listBidsByVendor(vendorIdentity.name), []);

  const [tenderId, setTenderId] = useState("TND-1042");
  const [amount, setAmount] = useState("");
  const [proposal, setProposal] = useState("");
  const [cid, setCid] = useState<string>();

  const pin = useAsyncAction(blockchainService.pinToIpfs);
  const submit = useAsyncAction(tenderService.submitBid);
  const compliance = useAsyncAction(tenderService.getComplianceFeedback);
  const [feedback, setFeedback] = useState<{ label: string; ok: boolean; detail: string }[]>();

  const selected = (tenders ?? []).find((t) => t.id === tenderId);

  async function handlePin() {
    const result = await pin.run(`proposal-${tenderId}.pdf`);
    if (result) {
      setCid(result.cid);
      toast.success("Proposal pinned to IPFS", {
        description: `${result.fileName} · ${result.sizeKb} KB · ${shortHash(result.cid, 12, 5)}`,
      });
    }
  }

  async function handleCheck() {
    const result = await compliance.run(proposal, Number(amount) || 0, selected);
    if (result) {
      setFeedback(result.notes);
      toast.message("AI compliance pre-check complete", {
        description: `Narrative uniqueness ${result.uniqueness}% against the live corpus.`,
      });
    }
  }

  async function handleSubmit() {
    if (!amount || proposal.trim().length < 20) {
      toast.error("Add a bid amount and a proposal of at least 20 characters.");
      return;
    }
    const bid = await submit.run({
      tenderId,
      bidderName: vendorIdentity.name,
      bidderAddress: vendorIdentity.address,
      bidAmount: Number(amount),
      proposalText: proposal,
    });
    if (bid) {
      toast.success("Bid successfully hashed and submitted to blockchain testnet", {
        description: `${bid.id} · ${bid.encryptedProposalHash}`,
      });
      if (bid.flaggedForFraud) {
        toast.warning("AI Flag Raised: Suspicious wallet cluster detected", {
          description: "Your submission was routed to the auditor queue for manual review.",
        });
      }
      setAmount("");
      setProposal("");
      setCid(undefined);
      setFeedback(undefined);
      myBids.refetch();
    }
  }

  const bids = myBids.data ?? [];

  return (
    <AppShell>
      <SectionTitle title="Vendor Portal" subtitle={vendorIdentity.name} />

      <div className="panel mb-4 p-3">
        <p className="mono-xs uppercase text-muted-foreground">Bidder wallet</p>
        <p className="mono-xs mt-1 text-primary">{vendorIdentity.address}</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Submitted" value={String(bids.length)} />
        <StatCard
          label="Sealed"
          value={String(bids.filter((b) => b.status === "Sealed").length)}
          tone="success"
        />
        <StatCard
          label="Flagged"
          value={String(bids.filter((b) => b.flaggedForFraud).length)}
          tone="destructive"
        />
      </div>

      <div className="panel mt-4 space-y-3 p-3">
        <p className="mono-xs uppercase text-muted-foreground">New bid draft</p>

        <Select value={tenderId} onValueChange={setTenderId}>
          <SelectTrigger className="bg-surface">
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

        <div>
          <Label className="mono-xs uppercase" htmlFor="bid-amount">
            Bid amount {selected ? `(${selected.budgetCurrency})` : ""}
          </Label>
          <Input
            id="bid-amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 bg-surface"
            placeholder="0.00"
          />
        </div>

        <div>
          <Label className="mono-xs uppercase" htmlFor="bid-proposal">
            Technical proposal
          </Label>
          <Textarea
            id="bid-proposal"
            rows={4}
            value={proposal}
            onChange={(e) => setProposal(e.target.value)}
            className="mt-1 bg-surface"
            placeholder="Methodology, mobilisation plan, key personnel…"
          />
        </div>

        <Button variant="secondary" onClick={handlePin} disabled={pin.pending} className="w-full gap-2">
          {pin.pending ? <Loader2 className="size-4 animate-spin" /> : <CloudUpload className="size-4" />}
          {cid ? `Pinned · ${shortHash(cid, 10, 4)}` : "Upload & pin proposal to IPFS"}
        </Button>

        <Button
          variant="outline"
          onClick={handleCheck}
          disabled={compliance.pending}
          className="w-full"
        >
          {compliance.pending ? "Running AI compliance check…" : "Run AI compliance pre-check"}
        </Button>

        {feedback ? (
          <ul className="space-y-2 rounded-md border border-border bg-surface p-3">
            {feedback.map((f) => (
              <li key={f.label} className="flex gap-2">
                {f.ok ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                ) : (
                  <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                )}
                <span>
                  <span className="block text-xs font-medium">{f.label}</span>
                  <span className="block text-[11px] text-muted-foreground">{f.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <Button onClick={handleSubmit} disabled={submit.pending} className="w-full gap-2">
          {submit.pending ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
          {submit.pending ? "Sealing…" : "Lock & Submit Encrypted Bid"}
        </Button>
      </div>

      <div className="mt-5">
        <SectionTitle title="Submission History" />
        {myBids.loading ? <LoadingRows rows={3} /> : null}
        <div className="space-y-2">
          {bids.map((b) => (
            <div key={b.id} className="panel p-3">
              <div className="flex items-center gap-2">
                <span className="mono-xs text-muted-foreground">{b.id}</span>
                <Pill tone={b.flaggedForFraud ? "destructive" : "success"}>{b.status}</Pill>
                <span className="ml-auto font-display text-sm font-semibold text-primary">
                  {b.bidAmount.toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Tender {b.tenderId}</p>
              <div className="mono-xs mt-2 space-y-0.5 text-muted-foreground">
                <p>Hash {b.encryptedProposalHash}</p>
                <p>CID {shortHash(b.ipfsCid ?? "—", 14, 5)}</p>
                <p
                  className={cn(
                    b.aiSimilarityScore > 60 ? "text-destructive" : "text-success",
                  )}
                >
                  NLP similarity {b.aiSimilarityScore}%
                </p>
              </div>
            </div>
          ))}
          {!myBids.loading && bids.length === 0 ? (
            <p className="panel p-6 text-center text-xs text-muted-foreground">
              No submissions yet.
            </p>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
