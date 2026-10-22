// Commitment risk monitoring UI: the simulated Orbyte eLeave trigger and the red at-risk / recovery cards.
import { useQueryClient } from "@tanstack/react-query";
import {
  useSimulateEmergencyLeave,
  useListCommitments,
  useRecoverCommitment,
  getListCommitmentsQueryKey,
  getListActivityQueryKey,
  getGetOrbyteWalletQueryKey,
} from "@workspace/api-client-react";
import type { Commitment } from "@workspace/api-client-react";
import { AlertOctagon, CalendarX2, CheckCircle2, Loader2, Lock, Radio, ShieldCheck, UserRoundCheck, XCircle } from "lucide-react";
import { ErrorBox } from "@/components/shell";
import { LockBadge } from "@/components/lock-badge";
import { useRole } from "@/lib/role";

const shortDate = (d: string) =>
  new Date(d + "T00:00:00+08:00").toLocaleDateString("en-GB", { timeZone: "Asia/Kuala_Lumpur", weekday: "short", day: "numeric", month: "short" });

export function SimulationBar() {
  const qc = useQueryClient();
  const sim = useSimulateEmergencyLeave();
  const fire = () =>
    sim.mutate(undefined, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListCommitmentsQueryKey() });
        qc.invalidateQueries({ queryKey: getListActivityQueryKey() });
      },
    });
  return (
    <section
      className="no-print mb-5 rounded-xl border border-dashed border-[#d9b46a] bg-[#fbf4e4] px-4 py-3 flex flex-wrap items-center gap-3"
      data-testid="bar-simulation"
    >
      <div className="flex items-center gap-2 text-[#795d2c] flex-1 min-w-[220px]">
        <Radio size={16} className="shrink-0" />
        <div>
          <div className="eyebrow !mb-0 !text-[#996b23]">Demo control · Simulated Orbyte eLeave event</div>
          <div className="text-[12px]">
            {sim.data ? sim.data.message : "Approve the Monday job first, then fire this event to see ORO AI react."}
          </div>
        </div>
      </div>
      <button className="btn w-full sm:w-auto !whitespace-normal !h-auto !py-2 !text-left" onClick={fire} disabled={sim.isPending} data-testid="button-simulate-leave">
        {sim.isPending ? <Loader2 className="spin" /> : <CalendarX2 />}
        Simulate Orbyte Event: Approve Bala's Emergency Leave (Mon, 26 Oct)
      </button>
      {sim.isError && <div className="w-full"><ErrorBox error={sim.error} /></div>}
    </section>
  );
}

/** Red cards for every at-risk commitment, plus a green confirmation after a recovery. */
export function RiskAlerts({ recovered, onRecovered }: { recovered: Commitment | null; onRecovered: (c: Commitment) => void }) {
  const q = useListCommitments();
  const atRisk = (q.data ?? []).filter((c) => c.quote.riskStatus === "AT_RISK");
  if (q.isError) return <div className="mb-5"><ErrorBox error={q.error} onRetry={() => q.refetch()} /></div>;
  const showRecovered = !!recovered && !atRisk.some((c) => c.quote.id === recovered.quote.id);
  if (atRisk.length === 0 && !showRecovered) return null;
  return (
    <div className="grid gap-4 mb-5 no-print">
      {atRisk.map((c) => <AtRiskCard key={c.quote.id} commitment={c} onRecovered={onRecovered} />)}
      {showRecovered && recovered && (
        <div className="notice success" role="status" data-testid="notice-recovered" style={{ animation: "fade-up .3s ease both" }}>
          <CheckCircle2 />
          <div>
            <strong>Recovery approved for #{recovered.quote.reference}.</strong> Crew is now {recovered.quote.crew.join(", ")} on{" "}
            {shortDate(recovered.quote.appointmentDate!)}. Commitment is feasible again and the change is in the activity log.
          </div>
        </div>
      )}
    </div>
  );
}

function AtRiskCard({ commitment: c, onRecovered }: { commitment: Commitment; onRecovered: (c: Commitment) => void }) {
  const qc = useQueryClient();
  const { isManager, name: actorName } = useRole();
  const recover = useRecoverCommitment();
  const plan = c.recovery;
  const x = c.quote;
  const approve = () =>
    recover.mutate(
      { id: x.id, data: { managerName: actorName, replacementStaffId: plan?.replacement?.id ?? null } },
      {
        onSuccess: (r) => onRecovered(r),
        onSettled: () => {
          qc.invalidateQueries({ queryKey: getListCommitmentsQueryKey() });
          qc.invalidateQueries({ queryKey: getListActivityQueryKey() });
          qc.invalidateQueries({ queryKey: getGetOrbyteWalletQueryKey() });
        },
      },
    );

  return (
    <section
      className="rounded-xl border-2 border-[#c9574e] bg-[#fdf3f1] p-5 shadow-[0_8px_24px_#a8474018]"
      role="alert"
      data-testid={`card-at-risk-${x.id}`}
      style={{ animation: "fade-up .3s ease both" }}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-[#a84740]">
          <AlertOctagon size={22} />
          <span className="font-extrabold tracking-wide text-[16px]" style={{ fontFamily: "Manrope" }}>COMMITMENT AT RISK</span>
        </div>
        {plan && (
          <span className="badge badge-red !normal-case" data-testid="badge-eleave">eLeave #{plan.leaveReference}</span>
        )}
      </div>

      <dl className="grid grid-cols-3 gap-3 mt-4 text-[13px]">
        <div><dt className="text-[10px] uppercase tracking-wider text-[#9b6a65]" style={{ fontFamily: "IBM Plex Mono" }}>Quote</dt><dd className="m-0 font-semibold mono" data-testid="text-risk-reference">#{x.reference}</dd></div>
        <div><dt className="text-[10px] uppercase tracking-wider text-[#9b6a65]" style={{ fontFamily: "IBM Plex Mono" }}>Customer</dt><dd className="m-0 font-medium">{x.customerName}</dd></div>
        <div><dt className="text-[10px] uppercase tracking-wider text-[#9b6a65]" style={{ fontFamily: "IBM Plex Mono" }}>Date</dt><dd className="m-0 font-medium">{x.appointmentDate ? shortDate(x.appointmentDate) : "-"}</dd></div>
      </dl>

      <div className="mt-4 text-[13px] text-[#7d3b35]">
        <div className="font-semibold mb-1">Why it is at risk</div>
        <p className="m-0" data-testid="text-risk-reason">{x.riskReason}</p>
        <p className="m-0 mt-1 text-[11px] text-[#9b6a65]">Leave details stay in Orbyte eLeave; only the approval reference is shown here (PDPA).</p>
      </div>

      {plan && (
        <div className="mt-4 rounded-lg bg-white/70 border border-[#ecd2cd] p-4">
          <div className="eyebrow !text-[#347956]">Recommended recovery</div>
          {plan.replacement ? (
            <div className="flex items-start gap-2 text-[14px] font-semibold text-[#2d3a40]" data-testid="text-recovery-summary">
              <UserRoundCheck size={18} className="text-[#347956] shrink-0 mt-0.5" />
              {plan.summary}
            </div>
          ) : (
            <div className="text-[13px] text-[#7d3b35]" data-testid="text-recovery-summary">{plan.summary}</div>
          )}
          {(plan.otherEligible.length > 0 || plan.rejected.length > 0) && (
            <ul className="mt-2 mb-0 pl-0 list-none text-[11px] text-[#6b7570] grid gap-1">
              {plan.otherEligible.map((m) => (
                <li key={m.id} className="flex gap-1.5"><CheckCircle2 size={13} className="text-[#347956] shrink-0" /> {m.name} is also free and qualified (backup).</li>
              ))}
              {plan.rejected.map((r) => (
                <li key={r.staffName} className="flex gap-1.5"><XCircle size={13} className="text-[#a84740] shrink-0" /> {r.staffName} rejected: {r.reason}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {plan?.replacement && !isManager && <div className="mt-4"><LockBadge /></div>}
      {plan?.replacement && (
        <button
          className={`btn w-full ${isManager ? "mt-4" : "mt-2"} !min-h-[46px] !text-[13px] ${isManager ? "!bg-[#a84740] !border-[#a84740] !text-white hover:!bg-[#933b35]" : ""}`}
          onClick={approve}
          disabled={recover.isPending || !isManager}
          data-testid={`button-approve-recovery-${x.id}`}
        >
          {recover.isPending ? <Loader2 className="spin" /> : isManager ? <ShieldCheck /> : <Lock />}
          Approve Recovery &amp; Update Orbyte Work
        </button>
      )}
      <p className="text-[11px] text-[#9b6a65] mt-2 mb-0">Manager-only action. The replacement is re-checked by the server before the crew changes.</p>
      {recover.isError && <div className="mt-3"><ErrorBox error={recover.error} /></div>}
    </section>
  );
}
