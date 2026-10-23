import type { Quote } from "@workspace/api-client-react";
import type { QuoteDocData } from "@/components/quote-document";

/** Printable document data for a saved quotation. */
export function quoteToDoc(x: Quote): QuoteDocData {
  return {
    companyName: x.companyName,
    reference: x.reference,
    status: x.status === "rejected" ? "rejected" : x.riskStatus === "AT_RISK" ? "at_risk" : x.status === "approved" ? "approved" : "draft",
    rejectionReason: x.rejectionReason,
    customerName: x.customerName,
    location: x.location,
    lines: x.lineItems,
    totalPrice: x.totalPrice,
    requestedDate: x.requestedDate,
    promisedDate: x.appointmentDate,
    crew: x.crew,
    crewIsProposal: false,
    approvedBy: x.approvedBy,
    approvedAt: x.approvedAt,
  };
}
