import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getMockFarmers, getBuyers } from "@/lib/crpMockData";
import { Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

type Recipient = "all" | "hamlet1" | "hamlet2" | "specific" | "buyers";

const CrpSendSmsTab = () => {
  const { t } = useLanguage();
  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState<Recipient>("all");
  const [loading, setLoading] = useState(false);

  const farmers = getMockFarmers();
  const buyers = getBuyers();

  const getRecipientCount = () => {
    switch (recipient) {
      case "all": return farmers.length + buyers.length;
      case "hamlet1": return farmers.filter((f, i) => i % 2 === 0).length;
      case "hamlet2": return farmers.filter((f, i) => i % 2 === 1).length;
      case "specific": return 5;
      case "buyers": return buyers.length;
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    toast.success(`${t("smsSent")} (${getRecipientCount()} ${t("smsRecipients")})`);
    setMessage("");
  };

  const handleWhatsapp = () => {
    if (!message.trim()) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const options: { value: Recipient; label: string }[] = [
    { value: "all", label: t("smsAll") },
    { value: "hamlet1", label: t("smsHamlet1") },
    { value: "hamlet2", label: t("smsHamlet2") },
    { value: "specific", label: t("smsSpecificMembers") },
    { value: "buyers", label: t("smsBuyers") },
  ];

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-bold text-center text-foreground">{t("sendSms")}</h2>

      <Card className="p-5 bg-card flex flex-col gap-4">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("message")}
          rows={5}
          className="text-base resize-none"
        />

        <div>
          <Label className="text-base font-medium mb-3 block">{t("smsRecipients")}:</Label>
          <div className="pl-3 flex flex-col gap-2">
            {options.map((o) => (
              <label key={o.value} className="flex items-center gap-3 py-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="recipient"
                  value={o.value}
                  checked={recipient === o.value}
                  onChange={() => setRecipient(o.value)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-base text-foreground">{o.label}</span>
              </label>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {getRecipientCount()} {t("smsRecipients")}
        </p>

        <div className="flex gap-2">
          <Button
            onClick={handleSend}
            disabled={!message.trim() || loading}
            className="tap-target flex-1 text-base font-semibold bg-primary text-primary-foreground"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : t("send")}
          </Button>
          <Button
            onClick={handleWhatsapp}
            disabled={!message.trim()}
            variant="outline"
            className="tap-target gap-2 text-success border-success"
          >
            <MessageCircle size={16} /> WhatsApp
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CrpSendSmsTab;
