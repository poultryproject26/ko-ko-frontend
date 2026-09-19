import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/mockData";
import { User } from "@/lib/auth";
import { Loader2, Bug, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface DiseaseReportTabProps { user: User; }

const SYMPTOM_KEYS = [
  "symptomGreenWhiteDischarge", "symptomNeckBending", "symptomLyingOnFloor",
  "symptomBreathingDifficulty", "symptomCombColorChange", "symptomBleeding",
  "symptomPoxLesions", "symptomEyeSwelling",
] as const;

const DiseaseReportTab = ({ user }: DiseaseReportTabProps) => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [symptoms, setSymptoms] = useState<Record<string, boolean>>({});
  const [affected, setAffected] = useState("");
  const [death, setDeath] = useState("");
  const [otherNote, setOtherNote] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: reports = [] } = useQuery({
    queryKey: ["diseaseReports"],
    queryFn: () => api.getDiseaseReports(),
    staleTime: 30_000,
  });

  const toggleSymptom = (key: string) => setSymptoms((s) => ({ ...s, [key]: !s[key] }));

  const handleSubmit = async () => {
    const selected = SYMPTOM_KEYS.filter((k) => symptoms[k]).map((k) => t(k));
    if (selected.length === 0 && !affected && !death && !otherNote) {
      toast.error(t("selectSymptomToast")); return;
    }
    setLoading(true);
    try {
      const parts = [];
      if (selected.length > 0) parts.push(`${t("symptoms")} ${selected.join(", ")}`);
      if (otherNote.trim()) parts.push(`${t("otherNotes")}: ${otherNote.trim()}`);
      parts.push(`${t("affectedCount")}: ${affected || 0}`);
      parts.push(`${t("deathCount")}: ${death || 0}`);
      await api.submitDiseaseReport({ description: parts.join(" | ") });
      toast.success(t("reportSent") + " ✅");
      setSymptoms({}); setAffected(""); setDeath(""); setOtherNote("");
      queryClient.invalidateQueries({ queryKey: ["diseaseReports"] });
    } catch (err: any) {
      toast.error(err.message || "Submit failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-3" style={{ background: "linear-gradient(135deg, #c62828, #e53935)" }}>
          <Bug size={20} className="text-white" />
          <div>
            <h2 className="text-sm font-bold text-white">{t("reportDisease")}</h2>
            <p className="text-[11px] text-white/75">{t("reportDiseaseEn")}</p>
          </div>
        </div>
        <div className="p-4 flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">{t("hamlet")}</p>
            <div className="bg-muted/40 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground border border-border/40">{user.hamlet}</div>
          </div>
          <div>
            <p className="text-sm font-bold text-foreground mb-2">{t("symptoms")}</p>
            <div className="flex flex-col gap-1">
              {SYMPTOM_KEYS.map((key) => (
                <label key={key} className={`flex items-center justify-between py-2.5 px-3 rounded-xl cursor-pointer transition-colors border ${symptoms[key] ? "bg-danger/5 border-danger/30" : "border-transparent hover:bg-muted/30"}`}>
                  <span className="text-sm text-foreground flex-1">{t(key)}</span>
                  <Checkbox checked={!!symptoms[key]} onCheckedChange={() => toggleSymptom(key)} className="w-5 h-5" />
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t("affectedCount")}</label>
              <Input value={affected} onChange={(e) => setAffected(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className="text-center text-base font-bold border-2 focus:border-danger rounded-xl" placeholder="0" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t("deathCount")}</label>
              <Input value={death} onChange={(e) => setDeath(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className="text-center text-base font-bold border-2 focus:border-danger rounded-xl" placeholder="0" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">{t("otherNotes")}</label>
            <Textarea value={otherNote} onChange={(e) => setOtherNote(e.target.value)} placeholder={t("otherNotesPlaceholder")} rows={3} className="text-sm resize-none border-2 focus:border-danger rounded-xl" />
          </div>
          <Button onClick={handleSubmit} disabled={loading} className="tap-target w-full text-base font-bold rounded-xl shadow-sm bg-danger text-danger-foreground hover:bg-danger/90 disabled:opacity-40">
            {loading ? <Loader2 className="animate-spin" size={20} /> : t("register") + " →"}
          </Button>
        </div>
      </div>

      {reports.length > 0 && (
        <div>
          <h2 className="text-sm font-bold mb-3 text-foreground px-1">{t("myPastReports")}</h2>
          <div className="flex flex-col gap-3">
            {reports.map((r: any) => (
              <div key={r._id} className="bg-white rounded-2xl border border-border/60 shadow-sm p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className={r.status === "Reviewed" ? "text-success" : "text-warning"} />
                    <p className="text-xs text-muted-foreground">{formatDate(r.reportedAt)}</p>
                  </div>
                  <Badge className={r.status === "Reviewed" ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}>
                    {r.status === "Reviewed" ? "🟢 " + t("reviewed") : "🟡 " + t("pending")}
                  </Badge>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{r.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiseaseReportTab;
