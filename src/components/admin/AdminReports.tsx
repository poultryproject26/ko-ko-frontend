import { useState, useEffect, useCallback, ReactNode } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  api,
  AdminReportFarmerRef,
  AdminBirdBatchRow,
  AdminBirdUpdateRow,
  AdminSaleStockRow,
  AdminVaccinationStockRow,
  AdminServiceDemandRow,
  AdminDiseaseReportRow,
} from "@/lib/api";
import { downloadExcel, downloadPDF, num } from "@/lib/reportExport";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Loader2, RefreshCw, ChevronDown, ChevronUp, Download, FileText, Info, ChevronRight } from "lucide-react";

type Row = (string | number)[];
type FarmerRef = AdminReportFarmerRef | string | null | undefined;

// Groups arbitrary report rows by the farmer's canonical hamlet (userId.hamletId),
// falling back to a single "Unresolved" bucket when hamletId is null — mirrors the
// same unresolved-farmer concept already surfaced in Admin Farmer Management.
function groupByHamlet<T>(rows: T[], getUserId: (row: T) => FarmerRef, unresolvedLabel: string) {
  const buckets = new Map<string, { label: string; rows: T[] }>();
  for (const row of rows) {
    const userId = getUserId(row);
    let key = "__unresolved__";
    let label = unresolvedLabel;
    if (userId && typeof userId === "object") {
      const h = userId.hamletId;
      if (h && typeof h === "object" && h._id) {
        key = h._id;
        label = h.nameEn || h.nameTa || h._id;
      }
    }
    if (!buckets.has(key)) buckets.set(key, { label, rows: [] });
    buckets.get(key)!.rows.push(row);
  }
  const entries = Array.from(buckets.entries()).map(([key, v]) => ({ key, label: v.label, rows: v.rows }));
  entries.sort((a, b) => {
    if (a.key === "__unresolved__") return 1;
    if (b.key === "__unresolved__") return -1;
    return a.label.localeCompare(b.label);
  });
  return entries;
}

function ExportButtons({ onExcel, onPdf }: { onExcel: () => void; onPdf: () => Promise<void> }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const handlePdf = async () => { setLoading(true); await onPdf(); setLoading(false); };
  return (
    <div className="flex gap-2 mt-2">
      <Button size="sm" onClick={onExcel} className="gap-1 bg-success text-success-foreground flex-1">
        <Download size={13} /> Excel
      </Button>
      <Button size="sm" onClick={handlePdf} disabled={loading} variant="outline" className="gap-1 flex-1">
        <FileText size={13} /> {loading ? t("generatingPdf") : "PDF"}
      </Button>
    </div>
  );
}

// One aggregated table (headers + rows + a bold totals row) with its own
// Excel/PDF export — the on-screen table and the exported file are built
// from the exact same headers/rows/totalsRow, so what you see is what exports.
function ReportTable({ subtitle, headers, rows, totalsRow, filename, pdfTitle }: {
  subtitle?: string; headers: string[]; rows: Row[]; totalsRow: Row; filename: string; pdfTitle: string;
}) {
  const { t } = useLanguage();
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">{t("noReportDataFound")}</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {subtitle && <p className="text-sm font-semibold text-foreground">{subtitle}</p>}
      <div className="overflow-x-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((h) => <TableHead key={h}>{h}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i}>
                {row.map((cell, j) => (
                  <TableCell key={j} className={j === 0 ? "font-medium text-foreground" : "text-muted-foreground"}>
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              {totalsRow.map((cell, j) => (
                <TableCell key={j} className="font-bold text-foreground">{cell}</TableCell>
              ))}
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      <ExportButtons
        onExcel={() => downloadExcel(headers, [...rows, totalsRow], filename)}
        onPdf={() => downloadPDF(pdfTitle, headers, [...rows, totalsRow], filename)}
      />
    </div>
  );
}

function CollapsibleSection({ title, defaultOpen = true, note, children }: {
  title: string; defaultOpen?: boolean; note?: ReactNode; children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="p-4">
      <button className="w-full flex items-center justify-between" onClick={() => setOpen(!open)}>
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        {open ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-4">
          {note}
          {children}
        </div>
      )}
    </Card>
  );
}

function EstimateNote({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 p-3">
      <Info size={16} className="text-warning shrink-0 mt-0.5" />
      <p className="text-xs text-foreground">{text}</p>
    </div>
  );
}

const AdminReports = () => {
  const { t, lang } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [batches, setBatches] = useState<AdminBirdBatchRow[]>([]);
  const [birdUpdates, setBirdUpdates] = useState<AdminBirdUpdateRow[]>([]);
  const [saleStock, setSaleStock] = useState<AdminSaleStockRow[]>([]);
  const [vaccinationStock, setVaccinationStock] = useState<AdminVaccinationStockRow[]>([]);
  const [services, setServices] = useState<AdminServiceDemandRow[]>([]);
  const [diseases, setDiseases] = useState<AdminDiseaseReportRow[]>([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [b, bu, ss, vs, sv, dr] = await Promise.all([
        api.getAdminBirdBatches(),
        api.getAdminBirdUpdatesLatest(),
        api.getAdminSaleStock(),
        api.getAdminVaccinationStock(),
        api.getAdminServices(),
        api.getAdminDiseases(),
      ]);
      setBatches(b); setBirdUpdates(bu); setSaleStock(ss);
      setVaccinationStock(vs); setServices(sv); setDiseases(dr);
    } catch (err: any) {
      setError(err?.message || t("adminLoadFailedToast"));
      toast.error(err?.message || t("adminLoadFailedToast"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const unresolvedLabel = t("unresolvedHamletLabel");
  const countLabel = lang === "en" ? "Count" : "எண்ணிக்கை";
  const hamletHeader = t("hamlet");
  const totalLabel = t("total");

  // ── Bird Stock: registered batches ────────────────────────────────────────
  const batchGroups = groupByHamlet(batches, (r) => r.userId, unresolvedLabel);
  const batchHeaders = [hamletHeader, lang === "en" ? "Batches" : "தொகுதிகள்", t("registeredChicksLabel"), t("totalActiveBirds")];
  const batchRows: Row[] = batchGroups.map((g) => {
    const registered = g.rows.reduce((s, r) => s + num(r.numberOfChicks), 0);
    const active = g.rows.filter((r) => r.batchStatus === "active").reduce((s, r) => s + num(r.activeBirdCount), 0);
    return [g.label, g.rows.length, registered, active];
  });
  const batchTotalsRow: Row = [
    totalLabel, batches.length,
    batches.reduce((s, r) => s + num(r.numberOfChicks), 0),
    batches.filter((r) => r.batchStatus === "active").reduce((s, r) => s + num(r.activeBirdCount), 0),
  ];

  // ── Bird Stock: latest weekly update per farmer ───────────────────────────
  const updateGroups = groupByHamlet(birdUpdates, (r) => r.userId, unresolvedLabel);
  const updateHeaders = [hamletHeader, lang === "en" ? "Farmers Reporting" : "பதிவிட்ட விவசாயிகள்", t("chicks"), t("growers"), t("layers"), t("broilers"), totalLabel];
  const updateRows: Row[] = updateGroups.map((g) => {
    const chicks = g.rows.reduce((s, r) => s + num(r.chicks), 0);
    const growers = g.rows.reduce((s, r) => s + num(r.growers), 0);
    const layers = g.rows.reduce((s, r) => s + num(r.layers), 0);
    const broilers = g.rows.reduce((s, r) => s + num(r.broilers), 0);
    return [g.label, g.rows.length, chicks, growers, layers, broilers, chicks + growers + layers + broilers];
  });
  const updateChicksTotal = birdUpdates.reduce((s, r) => s + num(r.chicks), 0);
  const updateGrowersTotal = birdUpdates.reduce((s, r) => s + num(r.growers), 0);
  const updateLayersTotal = birdUpdates.reduce((s, r) => s + num(r.layers), 0);
  const updateBroilersTotal = birdUpdates.reduce((s, r) => s + num(r.broilers), 0);
  const updateTotalsRow: Row = [
    totalLabel, birdUpdates.length, updateChicksTotal, updateGrowersTotal, updateLayersTotal, updateBroilersTotal,
    updateChicksTotal + updateGrowersTotal + updateLayersTotal + updateBroilersTotal,
  ];

  // ── Bird Sales & Available Stock ──────────────────────────────────────────
  const availableStock = saleStock.filter((s) => s.status === "available");
  const soldStock = saleStock.filter((s) => s.status === "sold");
  const stockHeaders = [hamletHeader, countLabel, t("broilers"), t("chicks"), t("eggs"), totalLabel];
  function buildStockTable(list: AdminSaleStockRow[]): { rows: Row[]; totalsRow: Row } {
    const groups = groupByHamlet(list, (r) => r.userId, unresolvedLabel);
    const rows: Row[] = groups.map((g) => {
      const broilers = g.rows.reduce((s, r) => s + num(r.broilers), 0);
      const chicks = g.rows.reduce((s, r) => s + num(r.chicks), 0);
      const eggs = g.rows.reduce((s, r) => s + num(r.eggs), 0);
      return [g.label, g.rows.length, broilers, chicks, eggs, broilers + chicks + eggs];
    });
    const broilersTotal = list.reduce((s, r) => s + num(r.broilers), 0);
    const chicksTotal = list.reduce((s, r) => s + num(r.chicks), 0);
    const eggsTotal = list.reduce((s, r) => s + num(r.eggs), 0);
    const totalsRow: Row = [totalLabel, list.length, broilersTotal, chicksTotal, eggsTotal, broilersTotal + chicksTotal + eggsTotal];
    return { rows, totalsRow };
  }
  const availableTable = buildStockTable(availableStock);
  const soldTable = buildStockTable(soldStock);

  // ── Vaccination Stock ──────────────────────────────────────────────────────
  const vaxGroups = groupByHamlet(vaccinationStock, (r) => r.userId, unresolvedLabel);
  const vaxHeaders = [
    hamletHeader, lang === "en" ? "Farmers" : "விவசாயிகள்",
    t("vaccinationWithinMonthLabel"), t("vaccinationMonth2Label"), t("vaccinationMonth3Label"), t("vaccinationMonth4PlusLabel"), totalLabel,
    lang === "en" ? "Pending" : "நிலுவை", lang === "en" ? "Completed" : "நிறைவு",
  ];
  const vaxRows: Row[] = vaxGroups.map((g) => {
    const wm = g.rows.reduce((s, r) => s + num(r.withinMonth), 0);
    const m2 = g.rows.reduce((s, r) => s + num(r.month2), 0);
    const m3 = g.rows.reduce((s, r) => s + num(r.month3), 0);
    const m4 = g.rows.reduce((s, r) => s + num(r.month4Plus), 0);
    const pending = g.rows.filter((r) => r.status === "pending").length;
    const completed = g.rows.filter((r) => r.status === "completed").length;
    return [g.label, g.rows.length, wm, m2, m3, m4, wm + m2 + m3 + m4, pending, completed];
  });
  const vaxWmTotal = vaccinationStock.reduce((s, r) => s + num(r.withinMonth), 0);
  const vaxM2Total = vaccinationStock.reduce((s, r) => s + num(r.month2), 0);
  const vaxM3Total = vaccinationStock.reduce((s, r) => s + num(r.month3), 0);
  const vaxM4Total = vaccinationStock.reduce((s, r) => s + num(r.month4Plus), 0);
  const vaxTotalsRow: Row = [
    totalLabel, vaccinationStock.length, vaxWmTotal, vaxM2Total, vaxM3Total, vaxM4Total, vaxWmTotal + vaxM2Total + vaxM3Total + vaxM4Total,
    vaccinationStock.filter((r) => r.status === "pending").length,
    vaccinationStock.filter((r) => r.status === "completed").length,
  ];

  // ── Service Requests (excludes Loan — reported separately below) ─────────
  const nonLoanDemands = services.filter((d) => d.type !== "Loan");
  const svcGroups = groupByHamlet(nonLoanDemands, (r) => r.userId, unresolvedLabel);
  const svcHeaders = [
    hamletHeader, lang === "en" ? "Requests" : "கோரிக்கைகள்",
    lang === "en" ? "Pending" : "நிலுவை", lang === "en" ? "Completed" : "நிறைவு", lang === "en" ? "Rejected" : "நிராகரிப்பு",
  ];
  const svcRows: Row[] = svcGroups.map((g) => [
    g.label, g.rows.length,
    g.rows.filter((r) => r.status === "Pending").length,
    g.rows.filter((r) => r.status === "Completed").length,
    g.rows.filter((r) => r.status === "Rejected").length,
  ]);
  const svcTotalsRow: Row = [
    totalLabel, nonLoanDemands.length,
    nonLoanDemands.filter((r) => r.status === "Pending").length,
    nonLoanDemands.filter((r) => r.status === "Completed").length,
    nonLoanDemands.filter((r) => r.status === "Rejected").length,
  ];
  const demandTypes = ["Feed Stock", "Equipment", "Vaccination", "Deworming"];
  const byTypeHeaders = [t("type"), totalLabel, lang === "en" ? "Pending" : "நிலுவை", lang === "en" ? "Completed" : "நிறைவு", lang === "en" ? "Rejected" : "நிராகரிப்பு"];
  const byTypeRows: Row[] = demandTypes.map((type) => {
    const list = nonLoanDemands.filter((d) => d.type === type);
    return [type, list.length, list.filter((d) => d.status === "Pending").length, list.filter((d) => d.status === "Completed").length, list.filter((d) => d.status === "Rejected").length];
  });
  const byTypeTotalsRow: Row = [
    totalLabel, nonLoanDemands.length,
    nonLoanDemands.filter((r) => r.status === "Pending").length,
    nonLoanDemands.filter((r) => r.status === "Completed").length,
    nonLoanDemands.filter((r) => r.status === "Rejected").length,
  ];

  // ── Loans (ServiceDemand where type === "Loan") ───────────────────────────
  const loans = services.filter((d) => d.type === "Loan");
  const loanGroups = groupByHamlet(loans, (r) => r.userId, unresolvedLabel);
  const loanHeaders = [
    hamletHeader, lang === "en" ? "Requests" : "கோரிக்கைகள்",
    t("loanTotalRequestedLabel"), t("loanTotalApprovedLabel"), t("loanTotalRejectedLabel"), t("loanTotalPendingLabel"),
  ];
  const loanRows: Row[] = loanGroups.map((g) => [
    g.label, g.rows.length,
    g.rows.reduce((s, r) => s + num(r.amount), 0),
    g.rows.filter((r) => r.status === "Completed").reduce((s, r) => s + num(r.amount), 0),
    g.rows.filter((r) => r.status === "Rejected").reduce((s, r) => s + num(r.amount), 0),
    g.rows.filter((r) => r.status === "Pending").reduce((s, r) => s + num(r.amount), 0),
  ]);
  const loanRequestedTotal = loans.reduce((s, r) => s + num(r.amount), 0);
  const loanApprovedTotal = loans.filter((r) => r.status === "Completed").reduce((s, r) => s + num(r.amount), 0);
  const loanRejectedTotal = loans.filter((r) => r.status === "Rejected").reduce((s, r) => s + num(r.amount), 0);
  const loanPendingTotal = loans.filter((r) => r.status === "Pending").reduce((s, r) => s + num(r.amount), 0);
  const loanTotalsRow: Row = [totalLabel, loans.length, loanRequestedTotal, loanApprovedTotal, loanRejectedTotal, loanPendingTotal];

  // ── Disease Reports ────────────────────────────────────────────────────────
  const diseaseGroups = groupByHamlet(diseases, (r) => r.userId, unresolvedLabel);
  const diseaseHeaders = [
    hamletHeader, lang === "en" ? "Reports" : "அறிக்கைகள்",
    lang === "en" ? "Pending" : "நிலுவை", lang === "en" ? "Reviewed" : "மதிப்பாய்வு செய்யப்பட்டது",
  ];
  const diseaseRows: Row[] = diseaseGroups.map((g) => [
    g.label, g.rows.length,
    g.rows.filter((r) => r.status === "Pending").length,
    g.rows.filter((r) => r.status === "Reviewed").length,
  ]);
  const diseaseTotalsRow: Row = [
    totalLabel, diseases.length,
    diseases.filter((r) => r.status === "Pending").length,
    diseases.filter((r) => r.status === "Reviewed").length,
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-foreground">{t("adminReports")}</h2>
        <Button variant="outline" size="sm" onClick={loadAll} disabled={loading}>
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          {t("refresh")}
        </Button>
      </div>

      {loading ? (
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-muted-foreground" size={24} />
          </div>
        </Card>
      ) : error ? (
        <Card className="p-0 overflow-hidden">
          <div className="flex flex-col items-center gap-2 py-16">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={loadAll}>{t("refresh")}</Button>
          </div>
        </Card>
      ) : (
        <>
          <CollapsibleSection title={t("reportBirdStock")}>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <ChevronRight size={14} className="text-muted-foreground" />
              {lang === "en" ? "Registered Batches (hamlet-wise)" : "பதிவு செய்யப்பட்ட தொகுதிகள் (குக்கிராமவாரி)"}
            </div>
            <EstimateNote text={t("activeBirdsEstimateNote")} />
            <ReportTable
              headers={batchHeaders} rows={batchRows} totalsRow={batchTotalsRow}
              filename="admin_bird_batches" pdfTitle={t("reportBirdStock")}
            />

            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground pt-2 border-t border-border/60">
              <ChevronRight size={14} className="text-muted-foreground" />
              {lang === "en" ? "Weekly Updates — Latest per Farmer (hamlet-wise)" : "வார பதிவுகள் — விவசாயிக்கு சமீபத்தியது (குக்கிராமவாரி)"}
            </div>
            <EstimateNote text={t("birdUpdatesLatestNote")} />
            <ReportTable
              headers={updateHeaders} rows={updateRows} totalsRow={updateTotalsRow}
              filename="admin_bird_updates_latest" pdfTitle={t("reportBirdStock")}
            />
          </CollapsibleSection>

          <CollapsibleSection title={t("reportBirdSalesStock")}>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <ChevronRight size={14} className="text-muted-foreground" />
              {t("stockAvailableLabel")}
            </div>
            <ReportTable
              headers={stockHeaders} rows={availableTable.rows} totalsRow={availableTable.totalsRow}
              filename="admin_available_stock" pdfTitle={`${t("reportBirdSalesStock")} — ${t("stockAvailableLabel")}`}
            />

            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground pt-2 border-t border-border/60">
              <ChevronRight size={14} className="text-muted-foreground" />
              {t("stockSoldLabel")}
            </div>
            <ReportTable
              headers={stockHeaders} rows={soldTable.rows} totalsRow={soldTable.totalsRow}
              filename="admin_sold_stock" pdfTitle={`${t("reportBirdSalesStock")} — ${t("stockSoldLabel")}`}
            />
          </CollapsibleSection>

          <CollapsibleSection title={t("reportVaccinationStock")}>
            <ReportTable
              headers={vaxHeaders} rows={vaxRows} totalsRow={vaxTotalsRow}
              filename="admin_vaccination_stock" pdfTitle={t("reportVaccinationStock")}
            />
          </CollapsibleSection>

          <CollapsibleSection title={t("reportServiceRequests")}>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <ChevronRight size={14} className="text-muted-foreground" />
              {t("hamletWiseSummaryLabel")}
            </div>
            <ReportTable
              headers={svcHeaders} rows={svcRows} totalsRow={svcTotalsRow}
              filename="admin_service_requests_by_hamlet" pdfTitle={t("reportServiceRequests")}
            />

            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground pt-2 border-t border-border/60">
              <ChevronRight size={14} className="text-muted-foreground" />
              {lang === "en" ? "By Type" : "வகை வாரியாக"}
            </div>
            <ReportTable
              headers={byTypeHeaders} rows={byTypeRows} totalsRow={byTypeTotalsRow}
              filename="admin_service_requests_by_type" pdfTitle={t("reportServiceRequests")}
            />
          </CollapsibleSection>

          <CollapsibleSection title={t("reportLoans")}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: t("loanTotalRequestedLabel"), value: loanRequestedTotal },
                { label: t("loanTotalApprovedLabel"), value: loanApprovedTotal },
                { label: t("loanTotalRejectedLabel"), value: loanRejectedTotal },
                { label: t("loanTotalPendingLabel"), value: loanPendingTotal },
              ].map((tile) => (
                <div key={tile.label} className="rounded-md border border-border p-3 bg-muted/20">
                  <p className="text-xs text-muted-foreground">{tile.label}</p>
                  <p className="text-lg font-bold text-foreground">₹{tile.value.toLocaleString()}</p>
                </div>
              ))}
            </div>
            <ReportTable
              headers={loanHeaders} rows={loanRows} totalsRow={loanTotalsRow}
              filename="admin_loans" pdfTitle={t("reportLoans")}
            />
          </CollapsibleSection>

          <CollapsibleSection title={t("reportDiseaseReports")}>
            <ReportTable
              headers={diseaseHeaders} rows={diseaseRows} totalsRow={diseaseTotalsRow}
              filename="admin_disease_reports" pdfTitle={t("reportDiseaseReports")}
            />
          </CollapsibleSection>
        </>
      )}
    </div>
  );
};

export default AdminReports;
