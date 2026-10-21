import { Link } from "wouter";
import { useListQuotes } from "@workspace/api-client-react";
import { FileText } from "lucide-react";
import { PageHead, ErrorBox, Skeletons, Empty } from "@/components/shell";
import { rm, longDate } from "@/lib/util";

export default function Quotes() {
  const q = useListQuotes();
  return (
    <div className="page">
      <PageHead eyebrow="All drafts" title="Quotations" sub="Newest first.">
        <Link href="/new-enquiry" className="btn btn-primary" data-testid="link-new-enquiry">New enquiry</Link>
      </PageHead>
      {q.isLoading && <Skeletons />}
      {q.isError && <ErrorBox error={q.error} onRetry={() => q.refetch()} />}
      {q.data && (
        <div className="panel">
          {q.data.length === 0 ? (
            <Empty icon={<FileText />} title="No quotations yet" text="Paste a customer message to create the first one.">
              <Link href="/new-enquiry" className="btn btn-primary">Start an enquiry</Link>
            </Empty>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Reference</th><th>Customer</th><th>Service</th><th>Qty</th><th>Total</th><th>Requested</th><th>Status</th></tr></thead>
                <tbody>
                  {q.data.map((x) => (
                    <tr key={x.id} data-testid={`row-quote-${x.id}`}>
                      <td><Link href={`/quotes/${x.id}`} className="table-link mono" data-testid={`link-quote-${x.id}`}>{x.reference}</Link></td>
                      <td className="customer">{x.customerName}</td>
                      <td>{x.serviceName}</td>
                      <td>{x.quantity}</td>
                      <td className="mono">{rm(x.totalPrice)}</td>
                      <td>{longDate(x.requestedDate)}</td>
                      <td><span className="badge badge-amber">{x.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
