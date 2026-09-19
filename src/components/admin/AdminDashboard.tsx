import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { User } from "@/lib/auth";
import { Hamlet } from "@/lib/api";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import HamletManagement from "./HamletManagement";
import StreetManagement from "./StreetManagement";
import CrpManagement from "./CrpManagement";
import FarmerManagement from "./FarmerManagement";

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

type AdminSection = "hamlets" | "streets" | "crps" | "farmers";

const AdminDashboard = ({ user, onLogout }: AdminDashboardProps) => {
  const { t, lang, setLang } = useLanguage();
  const [section, setSection] = useState<AdminSection>("hamlets");
  const [streetsHamletId, setStreetsHamletId] = useState<string | null>(null);

  const handleViewStreets = (hamlet: Hamlet) => {
    setStreetsHamletId(hamlet._id);
    setSection("streets");
  };

  const sections: { key: AdminSection; label: string }[] = [
    { key: "hamlets", label: t("adminHamletManagement") },
    { key: "streets", label: t("adminStreetManagement") },
    { key: "crps", label: t("adminCrpManagement") },
    { key: "farmers", label: t("adminFarmerManagement") },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <header
        className="sticky top-0 z-10 border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between flex-wrap gap-2"
        style={{ background: "linear-gradient(135deg, #2E7D32, #388E3C)" }}
      >
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-lg bg-white/10" />
          <div>
            <h1 className="text-base font-bold text-white leading-tight">{t("appNameTamil")}</h1>
            <p className="text-xs text-white/75">{t("adminRoleLabel")} — {user.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === "ta" ? "en" : "ta")}
            className="text-xs font-bold border border-white/30 rounded-lg px-2.5 py-1 text-white/80 hover:text-white hover:border-white/60 bg-white/10"
          >
            {lang === "ta" ? "EN" : "தமிழ்"}
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-white/80 hover:text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg hover:bg-white/10"
          >
            <LogOut size={16} />
            {t("logout")}
          </button>
        </div>
      </header>

      <nav className="bg-card border-b border-border px-4 sm:px-6 overflow-x-auto">
        <div className="max-w-6xl mx-auto flex gap-1 py-2">
          {sections.map((s) => (
            <Button
              key={s.key}
              variant={section === s.key ? "default" : "ghost"}
              size="sm"
              onClick={() => setSection(s.key)}
              className="whitespace-nowrap"
            >
              {s.label}
            </Button>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 sm:p-6">
        {section === "hamlets" && <HamletManagement onViewStreets={handleViewStreets} />}
        {section === "streets" && <StreetManagement initialHamletId={streetsHamletId} />}
        {section === "crps" && <CrpManagement />}
        {section === "farmers" && <FarmerManagement />}
      </main>
    </div>
  );
};

export default AdminDashboard;
