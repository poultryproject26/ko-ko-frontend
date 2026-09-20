import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { api, AdminOverview as AdminOverviewData } from "@/lib/api";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Users, UserCog, MapPinned, Bird, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const AdminOverview = () => {
  const { t } = useLanguage();
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await api.getAdminOverview());
    } catch (err: any) {
      setError(err?.message || t("adminLoadFailedToast"));
      toast.error(err?.message || t("adminLoadFailedToast"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadData(); }, [loadData]);

  const tiles: { key: string; label: string; value: number | null; icon: LucideIcon }[] = [
    { key: "crps", label: t("totalCrps"), value: data?.totalCrps ?? null, icon: UserCog },
    { key: "farmers", label: t("totalFarmers"), value: data?.totalFarmers ?? null, icon: Users },
    { key: "hamlets", label: t("totalHamlets"), value: data?.totalHamlets ?? null, icon: MapPinned },
    { key: "birds", label: t("totalActiveBirds"), value: data?.totalActiveBirds ?? null, icon: Bird },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-foreground">{t("adminOverview")}</h2>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          {t("refresh")}
        </Button>
      </div>

      {error ? (
        <Card className="p-0 overflow-hidden">
          <div className="flex flex-col items-center gap-2 py-16">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={loadData}>{t("refresh")}</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiles.map((tile) => (
            <Card key={tile.key} className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{tile.label}</span>
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <tile.icon size={18} />
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground">
                {loading ? (
                  <Loader2 className="animate-spin text-muted-foreground" size={24} />
                ) : (
                  (tile.value ?? 0).toLocaleString()
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Always visible — not a tooltip — so the estimate caveat can't be missed. */}
      <Card className="p-4 border-2 border-warning/30 bg-warning/5 flex items-start gap-3">
        <Info size={18} className="text-warning shrink-0 mt-0.5" />
        <p className="text-sm text-foreground">
          <span className="font-semibold">{t("totalActiveBirds")}:</span>{" "}
          {t("activeBirdsEstimateNote")}
        </p>
      </Card>
    </div>
  );
};

export default AdminOverview;
