import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { getBuyers, addBuyer, getAggregatedStock, getLatestMarketPrice, Buyer } from "@/lib/crpMockData";
import { toast } from "sonner";
import { Loader2, MessageCircle, Search } from "lucide-react";

const CrpBuyersTab = () => {
  const { t } = useLanguage();
  const [buyers, setBuyersList] = useState(getBuyers());
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState<Buyer["type"]>("Individual");
  const [loading, setLoading] = useState(false);

  const stock = getAggregatedStock();
  const marketPrice = getLatestMarketPrice();

  const handleAdd = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    addBuyer({ name, phone, type });
    setBuyersList(getBuyers());
    setLoading(false);
    toast.success(t("buyerAdded") + " ✅");
    setName("");
    setPhone("");
  };

  const handleShareStock = (buyer: Buyer) => {
    const msg = `🐔 கோழி இருப்பு\n\n${t("youngChicks")}: ${stock.chicks}\n${t("growers")}: ${stock.growers}\n${t("layers")}: ${stock.layers}\n${t("broilerChicken")}: ${stock.broilers}\n${t("total")}: ${stock.total}\n\n${marketPrice}`;
    window.open(`https://wa.me/${buyer.phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const filtered = buyers.filter((b) => !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.phone.includes(search));

  const buyerTypes: { value: Buyer["type"]; label: string }[] = [
    { value: "Hotel industry", label: t("hotelIndustry") },
    { value: "Broker", label: t("broker") },
    { value: "Retailer", label: t("retailer") },
    { value: "Individual", label: t("individual") },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Saleable Stock */}
      <Card className="p-5 bg-primary text-primary-foreground">
        <h2 className="text-base font-bold mb-2">{t("saleableStock")}</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span>{t("youngChicks")}: {stock.chicks}</span>
          <span>{t("growers")}: {stock.growers}</span>
          <span>{t("layers")}: {stock.layers}</span>
          <span>{t("broilerChicken")}: {stock.broilers}</span>
        </div>
        <p className="text-base font-bold mt-2">{t("total")}: {stock.total}</p>
        <p className="text-xs mt-1 opacity-90">{marketPrice}</p>
      </Card>

      {/* Add Buyer — wireframe 12 */}
      <Card className="p-5 bg-card">
        <h2 className="text-base font-bold mb-4 text-center text-foreground leading-tight">{t("addBuyersTitle")}</h2>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-[100px_1fr] items-center gap-3">
            <Label className="text-sm font-medium">{t("buyerName")}:</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="tap-target" />
          </div>

          <div className="grid grid-cols-[100px_1fr] items-center gap-3">
            <Label className="text-sm font-medium">{t("buyerPhone")}:</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              inputMode="tel"
              className="tap-target"
            />
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">{t("buyerType")}:</Label>
            <div className="pl-3 flex flex-col gap-2">
              {buyerTypes.map((bt) => (
                <label key={bt.value} className="flex items-center gap-3 py-1 cursor-pointer">
                  <input
                    type="radio"
                    name="buyerType"
                    value={bt.value}
                    checked={type === bt.value}
                    onChange={() => setType(bt.value)}
                    className="w-4 h-4 accent-primary"
                  />
                  <span className="text-base text-foreground">{bt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <Button
            onClick={handleAdd}
            disabled={!name.trim() || phone.length !== 10 || loading}
            className="tap-target bg-primary text-primary-foreground"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : t("addBuyer")}
          </Button>
        </div>
      </Card>

      {/* Buyer List */}
      <Card className="p-5 bg-card">
        <h2 className="text-base font-bold mb-3 text-foreground">{t("buyerList")}</h2>
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("searchBuyers")} className="pl-9" />
        </div>
        <div className="flex flex-col gap-2">
          {filtered.map((b) => (
            <div key={b.id} className="flex items-center justify-between py-2 border-b border-border/30">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{b.name}</p>
                <p className="text-xs text-muted-foreground">{b.phone} • <Badge variant="outline" className="text-xs">{b.type}</Badge></p>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleShareStock(b)} className="gap-1 text-success border-success text-xs shrink-0">
                <MessageCircle size={14} /> {t("shareStock")}
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default CrpBuyersTab;
