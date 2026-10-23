// PILOT quotation preview: the customer-facing document, shown in a DS Dialog. Draft or approved.
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@workspace/oro-design-system/components/ui/dialog";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@workspace/oro-design-system/components/ui/table";
import { StatusBadge } from "@workspace/oro-design-system/components/ui/status-badges";
import { Separator } from "@workspace/oro-design-system/components/ui/separator";
import { COMPANY, type PricingLine } from "../_shared/sample-data";
import { longDate, myTime, rm } from "./format";

export interface QuoteSheetData {
  reference: string | null;
  status: "draft" | "approved";
  customerName: string;
  location: string;
  lines: PricingLine[];
  totalPrice: number;
  requestedDate: string | null;
  promisedDate: string | null;
  crew: string[];
  approvedBy: string | null;
  approvedAt: string | null;
}

export function QuoteSheet({ q }: { q: QuoteSheetData }) {
  return (
    <article className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{COMPANY}</p>
          <p className="text-xs text-muted-foreground">Cheras, Kuala Lumpur · synthetic demo company</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm tabular-nums">{q.reference ?? "Number assigned on approval"}</p>
          <div className="mt-1">
            {q.status === "approved" ? <StatusBadge tone="green">Approved</StatusBadge> : <StatusBadge tone="amber">Draft · awaiting manager approval</StatusBadge>}
          </div>
        </div>
      </div>
      <Separator />
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div><dt className="text-xs text-muted-foreground">Customer</dt><dd className="font-medium">{q.customerName}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Job location</dt><dd className="font-medium">{q.location || "Not given"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Requested date</dt><dd className="font-medium">{q.requestedDate ? longDate(q.requestedDate) : "Not given"}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Promised date</dt><dd className="font-medium">{q.promisedDate ? `${longDate(q.promisedDate)}${q.status === "draft" ? " (proposed)" : ""}` : "To be confirmed"}</dd></div>
        <div className="col-span-2"><dt className="text-xs text-muted-foreground">Crew</dt><dd className="font-medium">{q.crew.length ? `${q.crew.join(", ")}${q.status === "draft" ? " (proposed)" : ""}` : "To be assigned"}</dd></div>
      </dl>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Service</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Unit price</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {q.lines.map((l) => (
            <TableRow key={l.serviceCode}>
              <TableCell>{l.serviceName}</TableCell>
              <TableCell className="text-right tabular-nums">{l.quantity}</TableCell>
              <TableCell className="text-right tabular-nums">{rm(l.unitPrice)}</TableCell>
              <TableCell className="text-right tabular-nums">{rm(l.lineTotal)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total</TableCell>
            <TableCell className="text-right text-base tabular-nums">{rm(q.totalPrice)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      <p className="text-xs text-muted-foreground">
        {q.status === "draft"
          ? "Not yet approved. This draft is not a confirmed booking."
          : `Approved by ${q.approvedBy ?? "manager"}${q.approvedAt ? ` on ${myTime(q.approvedAt)} (Malaysia time)` : ""}.`}{" "}
        Prices from the approved CoolAir Services price list, valid 7 days.
      </p>
    </article>
  );
}

export function QuoteDialog({ q, open, onOpenChange }: { q: QuoteSheetData | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-dvh max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quotation {q?.reference ? q.reference : "(draft)"}</DialogTitle>
          <DialogDescription>What the customer receives. Printing is handled by the live app, not this mockup.</DialogDescription>
        </DialogHeader>
        {q && <QuoteSheet q={q} />}
      </DialogContent>
    </Dialog>
  );
}
