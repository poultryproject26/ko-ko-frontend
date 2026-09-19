import { useLanguage } from "@/i18n/LanguageContext";
import { User, clearUser } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAggregatedStock, getLatestMarketPrice, getCrpPhone } from "@/lib/crpMockData";
import { Bird, DollarSign, MessageCircle, LogOut } from "lucide-react";

interface BuyerDashboardProps {
  user: User;
  onLogout: () => void;
}

const BuyerDashboard = ({ user, onLogout }: BuyerDashboardProps) => {
  const { t, lang, setLang } = useLanguage();
  const stock = getAggregatedStock();
  const marketPrice = getLatestMarketPrice();
  const crpPhone = getCrpPhone();

  const handleLogout = () => {
    clearUser();
    onLogout();
  };

  const handleContactCRP = () => {
    const msg = t("interestedMessage");
    window.open(`https://wa.me/${crpPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="max-w-[430px] mx-auto min-h-screen bg-card shadow-lg flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground leading-tight">{t("appName")}</h1>
          <p className="text-xs text-muted-foreground">{t("buyerDashboard")}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === "ta" ? "en" : "ta")}
            className="text-xs font-bold border border-border rounded-md px-2 py-1 text-foreground hover:bg-muted"
          >
            {lang === "ta" ? "EN" : "தமிழ்"}
          </button>
          <button onClick={handleLogout} className="text-muted-foreground p-1">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 flex flex-col gap-5">
        {/* Welcome */}
        <Card className="bg-primary text-primary-foreground p-5 rounded-xl">
          <p className="text-xl font-bold">{t("hello")}, {user.name} 👋</p>
          <p className="text-sm opacity-90 mt-1">{t("buyerDashboard")}</p>
        </Card>

        {/* Available Stock */}
        <Card className="p-5 bg-card">
          <div className="flex items-center gap-2 mb-3">
            <Bird size={24} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">{t("availableStock")}</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{stock.chicks}</p>
              <p className="text-xs text-muted-foreground">{t("chicks")}</p>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{stock.growers}</p>
              <p className="text-xs text-muted-foreground">{t("growers")}</p>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{stock.layers}</p>
              <p className="text-xs text-muted-foreground">{t("layers")}</p>
            </div>
            <div className="bg-muted rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{stock.broilers}</p>
              <p className="text-xs text-muted-foreground">{t("broilers")}</p>
            </div>
          </div>
          <div className="mt-3 bg-primary/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-primary">{stock.total}</p>
            <p className="text-sm text-muted-foreground">{t("total")} {t("birds")}</p>
          </div>
        </Card>

        {/* Price Info */}
        <Card className="p-5 bg-card">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={24} className="text-warning" />
            <h2 className="text-lg font-bold text-foreground">{t("priceInfo")}</h2>
          </div>
          <p className="text-lg font-medium text-foreground">{marketPrice}</p>
        </Card>

        {/* Contact CRP */}
        <Card className="p-5 bg-card">
          <h2 className="text-lg font-bold mb-3 text-foreground">{t("contactCRP")}</h2>
          <Button onClick={handleContactCRP} className="tap-target w-full gap-2 bg-success text-success-foreground text-lg font-semibold">
            <MessageCircle size={20} /> WhatsApp
          </Button>
        </Card>
      </main>
    </div>
  );
};

export default BuyerDashboard;
