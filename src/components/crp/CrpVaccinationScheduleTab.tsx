import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Syringe, Calendar, CheckCircle2, AlertTriangle,
  ChevronDown, ChevronUp, Plus, XCircle, RefreshCw, FileText, CalendarCheck, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Age category display config — mirrors backend CATEGORY_MAP
const STOCK_CATEGORIES = [
  { key: "withinMonth", labelEn: "Within 1 month",    labelTa: "1 மாதத்திற்குள்",              vaccine: "Lasota" },
  { key: "month2",      labelEn: "2 months old",       labelTa: "2 மாத வயது",                   vaccine: "Fowl Pox" },
  { key: "month3",      labelEn: "3 months old",       labelTa: "3 மாத வயது",                   vaccine: "Infectious Coryza" },
  { key: "month4Plus",  labelEn: "4–7 months & above", labelTa: "4 முதல் 7 மாதங்கள் மற்றும் மேல்", vaccine: "RDVK + Deworming" },
];

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function fmtDDMMYYYY(date: Date | string): string {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

// ── Vaccination Stock Request Card ────────────────────────────────────────────
interface StockCardProps {
  stock: any;
  onDone: () => void;
}

const VaccinationStockCard = ({ stock, onDone }: StockCardProps) => {
  const [completing, setCompleting] = useState(false);
  const farmer = stock.userId || {};
  const vaccinationDate = stock.entryDate
    ? fmtDDMMYYYY(addDays(new Date(stock.entryDate), 3))
    : "—";
  const isCompleted = stock.status === "completed";

  const handleComplete = async () => {
    if (!window.confirm("Mark this vaccination as completed?")) return;
    setCompleting(true);
    try {
      await api.completeVaccinationStock(stock._id);
      toast.success("✅ Vaccination marked as completed");
      onDone();
    } catch (err: any) {
      toast.error(err?.message || "Failed to complete");
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-4 flex flex-col gap-3 ${
      isCompleted ? "border-success/40 bg-success/5" : "border-border/60"
    }`}>
      {/* Farmer info */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-foreground">{farmer.name || "—"}</p>
          <p className="text-xs text-muted-foreground">{farmer.hamlet || ""}</p>
          <p className="text-xs text-muted-foreground">{farmer.phone || ""}</p>
          {farmer.createdAt && (
            <p className="text-xs text-muted-foreground">
              Reg: {fmtDDMMYYYY(farmer.createdAt)}
            </p>
          )}
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 ${
          isCompleted ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
        }`}>
          {isCompleted ? "✅ Completed" : "⏳ Pending"}
        </span>
      </div>

      {/* Age category counts */}
      <div className="grid grid-cols-2 gap-1.5">
        {STOCK_CATEGORIES.map(({ key, labelEn, vaccine }) => {
          const count = stock[key] ?? 0;
          return (
            <div key={key} className="bg-muted/40 rounded-xl px-3 py-2">
              <p className="text-[10px] text-muted-foreground">{labelEn}</p>
              <p className="text-sm font-bold text-foreground">{count} Nos</p>
              {vaccine ? (
                <p className="text-[10px] text-teal-700 font-semibold">{vaccine}</p>
              ) : (
                <p className="text-[10px] text-muted-foreground italic">No vaccine</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Vaccination date */}
      <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-xl px-3 py-2">
        <CalendarCheck size={14} className="text-teal-700 shrink-0" />
        <div>
          <p className="text-[10px] text-teal-700">Vaccination Date</p>
          <p className="text-sm font-extrabold text-teal-900">{vaccinationDate}</p>
        </div>
      </div>

      {/* Completed button — only shown when pending */}
      {!isCompleted && (
        <Button
          onClick={handleComplete}
          disabled={completing}
          className="w-full bg-success text-white hover:bg-success/90"
        >
          {completing ? "Saving..." : "✅ Completed"}
        </Button>
      )}

      {isCompleted && stock.completedAt && (
        <p className="text-xs text-success text-center font-semibold">
          Completed on {fmtDDMMYYYY(stock.completedAt)}
        </p>
      )}
    </div>
  );
};

// ── Vaccination Stock Requests Section ───────────────────────────────────────
const VaccinationStockRequestsSection = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);

  const { data: allStocks = [], isLoading } = useQuery({
    queryKey: ["allVaccinationStock"],
    queryFn: () => api.getAllVaccinationStock().catch(() => []),
    staleTime: 30_000,
  });

  const stocks = allStocks as any[];
  const pending   = stocks.filter((s) => s.status !== "completed");
  const completed = stocks.filter((s) => s.status === "completed");
  const displayed = showCompleted ? stocks : pending;

  const handleDone = () => queryClient.invalidateQueries({ queryKey: ["allVaccinationStock"] });

  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Users size={16} className="text-primary" />
          <div>
            <p className="text-sm font-bold text-foreground">Farmer Vaccination Stock Requests</p>
            <p className="text-xs text-muted-foreground">
              {pending.length} pending • {completed.length} completed
            </p>
          </div>
        </div>
        <ChevronDown size={18} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-border/60 px-4 py-3 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCompleted(false)}
              className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-all ${
                !showCompleted ? "bg-primary text-white border-primary" : "border-border text-muted-foreground"
              }`}
            >
              Pending ({pending.length})
            </button>
            <button
              onClick={() => setShowCompleted(true)}
              className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-all ${
                showCompleted ? "bg-success text-white border-success" : "border-border text-muted-foreground"
              }`}
            >
              All ({stocks.length})
            </button>
          </div>

          {isLoading && (
            <div className="flex flex-col gap-2">
              {[1, 2].map((i) => <div key={i} className="h-32 bg-muted/40 rounded-xl animate-pulse" />)}
            </div>
          )}

          {!isLoading && displayed.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              {showCompleted ? "No stock requests yet" : "No pending vaccination stock requests"}
            </p>
          )}

          {!isLoading && displayed.map((stock: any) => (
            <VaccinationStockCard key={stock._id} stock={stock} onDone={handleDone} />
          ))}
        </div>
      )}
    </div>
  );
};

function fmt(d: string | Date): string {
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
}

const TYPE_LABELS: Record<string, string> = {
  F_vaccine:   "F Vaccine (Day 0)",
  IBD:         "IBD Vaccine (Day 14)",
  LaSota:      "LaSota Vaccine (Day 28)",
  fowl_pox:    "Fowl Pox Vaccine (Day 42)",
  deworming:   "Deworming (Day 56)",
  R2B:         "R2B + Deworming (Day 70)",
  multivitamin: "Multivitamins (Day 84)",
  R2B_booster: "R2B Booster + Deworming",
};

const STATUS_STYLE: Record<string, string> = {
  completed:   "text-success bg-success/10",
  scheduled:   "text-primary bg-primary/10",
  overdue:     "text-destructive bg-destructive/10",
  missed:      "text-amber-700 bg-amber-100",
  rescheduled: "text-warning bg-warning/10",
};

// ── Action modal ──────────────────────────────────────────────────────────────
interface ActionModalProps {
  event: any;
  onClose: () => void;
  onDone: () => void;
}

const ActionModal = ({ event, onClose, onDone }: ActionModalProps) => {
  const [action, setAction] = useState<"complete" | "missed" | "reschedule" | null>(null);
  const [notes, setNotes] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [loading, setLoading] = useState(false);

  const label = TYPE_LABELS[event.type] ?? event.label;

  const handleSubmit = async () => {
    if (!action) return;
    setLoading(true);
    try {
      if (action === "complete") {
        await api.completeVaccination(event._id, notes);
        toast.success(`✅ ${label} marked as completed`);
      } else if (action === "missed") {
        await api.missVaccination(event._id, notes);
        toast.success(`⚠️ ${label} marked as skipped`);
      } else if (action === "reschedule") {
        if (!rescheduleDate) { toast.error("Select a new date"); setLoading(false); return; }
        await api.rescheduleVaccination(event._id, rescheduleDate, notes);
        toast.success(`📅 ${label} rescheduled to ${fmt(rescheduleDate)}`);
      }
      onDone();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-foreground">{label}</p>
          <button onClick={onClose} className="text-muted-foreground"><XCircle size={20} /></button>
        </div>
        <p className="text-xs text-muted-foreground">Scheduled: {fmt(event.scheduledDate)}</p>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2">
          {(["complete", "missed", "reschedule"] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAction(a)}
              className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                action === a
                  ? a === "complete" ? "bg-success text-white border-success"
                    : a === "missed" ? "bg-danger text-white border-danger"
                    : "bg-warning text-white border-warning"
                  : "border-border text-muted-foreground"
              }`}
            >
              {a === "complete" ? "✅ Done" : a === "missed" ? "❌ Skipped" : "📅 Reschedule"}
            </button>
          ))}
        </div>

        {action === "reschedule" && (
          <Input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} className="text-sm" />
        )}

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes / Remarks (optional)"
          rows={2}
          className="w-full border border-input rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
        />

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" disabled={!action || loading} onClick={handleSubmit}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Batch card ────────────────────────────────────────────────────────────────
interface BatchCardProps {
  batch: any;
  onRefetch: () => void;
}

const BatchCard = ({ batch, onRefetch }: BatchCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [actionEvent, setActionEvent] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [mortalityInput, setMortalityInput] = useState("");
  const [recordingMortality, setRecordingMortality] = useState(false);

  const handleRecordMortality = async () => {
    const count = parseInt(mortalityInput, 10);
    if (!Number.isInteger(count) || count <= 0) {
      toast.error("Enter a whole number greater than 0");
      return;
    }
    setRecordingMortality(true);
    try {
      await api.recordMortality(batch.batchId, count);
      toast.success(`✅ Recorded ${count} death(s)`);
      setMortalityInput("");
      onRefetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to record mortality");
    } finally {
      setRecordingMortality(false);
    }
  };

  const schedule: any[] = batch.schedule ?? [];
  const overdue   = schedule.filter((e) => e.status === "overdue");
  const upcoming  = schedule.filter((e) => e.status === "scheduled" || e.status === "rescheduled");
  const done      = schedule.filter((e) => e.status === "completed" || e.status === "missed");

  return (
    <>
      {actionEvent && (
        <ActionModal
          event={actionEvent}
          onClose={() => setActionEvent(null)}
          onDone={onRefetch}
        />
      )}

      <div className="bg-muted/30 rounded-xl border border-border/40 overflow-hidden">
        <button
          onClick={() => setExpanded((p) => !p)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
        >
          <div>
            <p className="text-sm font-bold text-foreground">{batch.batchName}</p>
            <p className="text-xs text-muted-foreground">
              {batch.numberOfChicks} chicks • Batch date: {fmt(batch.batchDate)}
              {batch.batchStatus === "inactive" && <span className="ml-2 text-danger font-semibold">• Inactive</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {overdue.length > 0 && (
              <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-lg">
                {overdue.length} overdue
              </span>
            )}
            <button
              disabled={deleting}
              onClick={async (e) => {
                e.stopPropagation();
                if (deleting) return;
                if (!window.confirm("Delete this batch and all its vaccination records?")) return;
                setDeleting(true);
                try {
                  await api.deleteBatch(batch.batchId);
                  toast.success(`✅ Batch "${batch.batchName}" deleted`);
                  onRefetch();
                } catch (err: any) {
                  toast.error(err?.message || "Failed to delete batch");
                } finally {
                  setDeleting(false);
                }
              }}
              className="text-xs font-semibold text-danger border border-danger/20 rounded-xl px-2 py-1 hover:bg-danger/10"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
            {expanded ? <ChevronUp size={15} className="text-muted-foreground" /> : <ChevronDown size={15} className="text-muted-foreground" />}
          </div>
        </button>

        {expanded && (
          <div className="border-t border-border/40 px-4 py-3 flex flex-col gap-2">
            {typeof batch.activeBirdCount === "number" && (
              <div className="flex items-center justify-between gap-2 bg-card border border-border/40 rounded-lg px-3 py-2 mb-1">
                <div className="text-xs text-muted-foreground">
                  Active: <span className="font-bold text-foreground">{batch.activeBirdCount}</span>
                  {"  •  "}Deaths recorded: <span className="font-bold text-foreground">{batch.mortalityCount ?? 0}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Input
                    value={mortalityInput}
                    onChange={(e) => setMortalityInput(e.target.value.replace(/\D/g, ""))}
                    placeholder="+deaths"
                    inputMode="numeric"
                    className="h-7 w-20 text-xs px-2"
                    disabled={recordingMortality || batch.activeBirdCount === 0}
                  />
                  <button
                    onClick={handleRecordMortality}
                    disabled={recordingMortality || !mortalityInput || batch.activeBirdCount === 0}
                    className="text-xs font-semibold text-danger border border-danger/20 rounded-lg px-2 py-1 hover:bg-danger/10 disabled:opacity-40"
                  >
                    {recordingMortality ? "..." : "Record"}
                  </button>
                </div>
              </div>
            )}

            {[...overdue, ...upcoming].length === 0 && done.length > 0 && (
              <p className="text-xs text-success font-semibold flex items-center gap-1">
                <CheckCircle2 size={12} /> All vaccinations completed
              </p>
            )}

            {[...overdue, ...upcoming].map((e) => (
              <div key={e.type + e.scheduledDate} className="flex items-center justify-between gap-2 py-2 border-b border-border/20 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{TYPE_LABELS[e.type] ?? e.label}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar size={10} />
                    {e.status === "rescheduled" && e.rescheduledDate
                      ? `Rescheduled: ${fmt(e.rescheduledDate)}`
                      : fmt(e.scheduledDate)}
                  </p>
                  {e.notes && <p className="text-xs text-muted-foreground italic mt-0.5">"{e.notes}"</p>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${STATUS_STYLE[e.status] ?? ""}`}>
                    {e.status === "missed" ? "skipped" : e.status}
                  </span>
                  {e._id && (
                    <button
                      onClick={() => setActionEvent(e)}
                      className="text-xs font-semibold px-2 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20"
                    >
                      <FileText size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {done.length > 0 && (
              <details className="mt-1">
                <summary className="text-xs text-muted-foreground cursor-pointer">
                  Completed ({done.length})
                </summary>
                <div className="flex flex-col gap-1 mt-2">
                  {done.map((e) => {
                    const skipped = e.status === "missed" || (e.notes && String(e.notes).toLowerCase().includes("skipped"));
                    return (
                      <div key={e.type + e.scheduledDate} className="flex items-center justify-between py-1">
                        <p className="text-xs text-muted-foreground">
                          {TYPE_LABELS[e.type] ?? e.label} {skipped ? "(skipped)" : ""}
                        </p>
                        <span className="text-xs font-bold text-success flex items-center gap-1">
                          <CheckCircle2 size={11} /> {e.completedDate ? fmt(e.completedDate) : fmt(e.scheduledDate)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    </>
  );
};

// ── Farmer row ────────────────────────────────────────────────────────────────
interface FarmerRowProps { farmer: any }

const FarmerScheduleRow = ({ farmer }: FarmerRowProps) => {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [batchName, setBatchName] = useState("");
  const [numChicks, setNumChicks] = useState("");
  const [batchDate, setBatchDate] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: batches = [], isLoading, refetch } = useQuery({
    queryKey: ["farmerSchedule", farmer._id],
    queryFn: () => api.getFarmerSchedule(farmer._id).catch(() => []),
    enabled: expanded,
    staleTime: 60_000,
  });

  const totalOverdue = (batches as any[]).reduce((sum, b) =>
    sum + (b.schedule ?? []).filter((e: any) => e.status === "overdue").length, 0);

  const handleAddBatch = async () => {
    if (!batchName || !batchDate) { toast.error("Batch name and date required"); return; }
    setSaving(true);
    try {
      await api.createBatch({ userId: farmer._id, batchName, numberOfChicks: parseInt(numChicks) || 0, batchDate });
      toast.success(`✅ Batch "${batchName}" created`);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["allBatches"] });
      setBatchName(""); setNumChicks(""); setBatchDate("");
      setShowAddBatch(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create batch");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Syringe size={16} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{farmer.name}</p>
            <p className="text-xs text-muted-foreground">{farmer.hamlet} • {farmer.phone}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {totalOverdue > 0 && (
            <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-lg">
              {totalOverdue} overdue
            </span>
          )}
          {expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/60 p-4 flex flex-col gap-3">

          {/* Add batch form */}
          {showAddBatch ? (
            <div className="bg-muted/30 rounded-xl p-3 flex flex-col gap-2">
              <p className="text-xs font-bold text-foreground">New Batch</p>
              <Input placeholder="Batch name (e.g. Batch 1)" value={batchName} onChange={(e) => setBatchName(e.target.value)} className="text-sm" />
              <Input placeholder="Number of chicks" type="number" value={numChicks} onChange={(e) => setNumChicks(e.target.value)} className="text-sm" />
              <Input type="date" value={batchDate} onChange={(e) => setBatchDate(e.target.value)} className="text-sm" />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowAddBatch(false)}>Cancel</Button>
                <Button size="sm" className="flex-1" disabled={saving} onClick={handleAddBatch}>
                  {saving ? "..." : "Create & Generate Schedule"}
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddBatch(true)}
              className="flex items-center gap-2 text-xs font-semibold text-primary border border-primary/30 rounded-xl px-3 py-2 hover:bg-primary/5"
            >
              <Plus size={14} /> Add New Batch
            </button>
          )}

          {isLoading && (
            <div className="flex flex-col gap-2">
              {[1, 2].map((i) => <div key={i} className="h-12 bg-muted/40 rounded-xl animate-pulse" />)}
            </div>
          )}

          {!isLoading && (batches as any[]).length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">No batches yet. Add one above.</p>
          )}

          {!isLoading && (batches as any[]).map((batch: any) => (
            <BatchCard key={batch.batchId} batch={batch} onRefetch={refetch} />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main tab ──────────────────────────────────────────────────────────────────
const CrpVaccinationScheduleTab = () => {
  const [search, setSearch] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [summaryDate, setSummaryDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  });

  const { data: farmers = [], isLoading } = useQuery({
    queryKey: ["crpFarmers"],
    queryFn: () => api.getFarmers(),
    staleTime: 60_000,
  });

  const { data: allVaccines = [], isLoading: isSummaryLoading } = useQuery({
    queryKey: ["allVaccinations"],
    queryFn: () => api.getAllVaccinations().catch(() => []),
    staleTime: 60_000,
  });

  const summaryRecords = (allVaccines as any[])
    .map((r: any) => ({
      ...r,
      effectiveDate: r.status === "rescheduled" && r.rescheduledDate ? r.rescheduledDate : r.scheduledDate,
      farmerName: r.userId?.name || "Unknown",
      batchName: r.batchId?.batchName || "",
    }))
    .filter((r: any) => ["scheduled", "overdue", "rescheduled"].includes(r.status))
    .filter((r: any) => {
      const d = new Date(r.effectiveDate);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` === summaryDate;
    });

  const summaryCount = summaryRecords.length;

  const filtered = (farmers as any[]).filter((f) =>
    !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.phone.includes(search)
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl p-4 text-white shadow-sm" style={{ background: "linear-gradient(135deg, #2E7D32, #4CAF50)" }}>
        <div className="flex items-center gap-3">
          <Syringe size={22} className="text-white" />
          <div>
            <p className="text-base font-bold">Vaccination Schedule</p>
            <p className="text-xs opacity-80">Manage batches & track all farmers</p>
          </div>
        </div>
      </div>

      {/* Farmer vaccination stock requests — shown first for easy CRP action */}
      <VaccinationStockRequestsSection />

      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <button
          onClick={() => setSummaryOpen((p) => !p)}
          className="w-full px-4 py-3 flex items-center justify-between text-left"
        >
          <div>
            <p className="text-sm font-bold text-foreground">Vaccination due on {summaryDate}</p>
            <p className="text-xs text-muted-foreground">
              {summaryOpen ? "Collapse" : "Expand"} to see which farmer needs which vaccine
            </p>
          </div>
          <ChevronDown size={18} className={`transition-transform ${summaryOpen ? "rotate-180" : ""}`} />
        </button>
        {summaryOpen && (
          <div className="border-t border-border/60 px-4 py-3 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{summaryCount} pending vaccination{summaryCount === 1 ? "" : "s"}</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-foreground">Date</label>
                <Input
                  type="date"
                  value={summaryDate}
                  onChange={(e) => setSummaryDate(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>
            </div>
            {isSummaryLoading ? (
              <div className="text-xs text-muted-foreground">Loading schedule...</div>
            ) : summaryCount === 0 ? (
              <div className="text-xs text-muted-foreground">No vaccinations scheduled for this date.</div>
            ) : (
              <div className="grid gap-2">
                {summaryRecords.slice(0, 6).map((record: any) => (
                  <div key={`${record._id}-${record.batchId}`} className="rounded-2xl border border-border/70 bg-muted/30 p-3">
                    <p className="text-xs font-bold text-foreground truncate">{record.farmerName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {record.batchName ? `${record.batchName} • ` : ""}{TYPE_LABELS[record.type] ?? record.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {record.status === "rescheduled" ? "Rescheduled" : record.status === "overdue" ? "Overdue" : "Scheduled"}
                    </p>
                  </div>
                ))}
                {summaryCount > 6 && (
                  <p className="text-xs text-muted-foreground">+{summaryCount - 6} more farmers</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search farmers..."
        className="w-full border border-input rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
      />

      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white rounded-2xl border border-border/60 animate-pulse" />)}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-border/60 p-8 text-center">
          <p className="text-sm text-muted-foreground">No farmers found</p>
        </div>
      )}

      {!isLoading && (
        <div className="flex flex-col gap-3">
          {filtered.map((f: any) => (
            <FarmerScheduleRow key={f._id} farmer={f} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CrpVaccinationScheduleTab;
