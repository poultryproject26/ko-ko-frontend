import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HAMLET_STREETS } from "@/lib/auth";
import { api } from "@/lib/api";
import { ArrowLeft, Loader2 } from "lucide-react";

const HAMLETS_LIST = Object.keys(HAMLET_STREETS);

interface RegistrationScreenProps {
  onNext: (data: {
    name: string;
    phone: string;
    hamlet: string;
    houseNo: string;
    street: string;
    shgName: string;
  }) => void;
  onBack: () => void;
}

/* MOVE THIS OUTSIDE THE COMPONENT */
const FieldRow = ({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <Label
      htmlFor={htmlFor}
      className="text-sm font-semibold text-foreground"
    >
      {label}
    </Label>
    {children}
  </div>
);

const RegistrationScreen = ({
  onNext,
  onBack,
}: RegistrationScreenProps) => {
  const { t, lang, setLang } = useLanguage();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [houseNo, setHouseNo] = useState("");
  const [street, setStreet] = useState("");
  const [hamlet, setHamlet] = useState("");
  const [shgName, setShgName] = useState("");
  const [shgNames, setShgNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .getShgGroups()
      .then((data: any[]) => setShgNames(data.map((g) => g.name)))
      .catch(() => {});
  }, []);

  const availableStreets = hamlet
    ? HAMLET_STREETS[hamlet] || []
    : [];

  const isValid =
    name.trim() &&
    phone.length === 10 &&
    hamlet &&
    street &&
    shgName;

  const handleSubmit = async () => {
    if (!isValid) return;

    setLoading(true);

    await new Promise((r) => setTimeout(r, 400));

    setLoading(false);

    onNext({
      name,
      phone,
      hamlet,
      houseNo,
      street,
      shgName,
    });
  };

  const handleHamletChange = (value: string) => {
    setHamlet(value);
    setStreet("");
  };

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{
        background:
          "linear-gradient(160deg, #f1f8e9 0%, #e8f5e9 50%, #f9fbe7 100%)",
      }}
    >
      {/* Header */}
      <div className="relative agri-header-gradient px-5 pt-12 pb-8">
        <div className="flex justify-between items-start">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-white/80 hover:text-white mb-4 w-fit"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">
              {t("back")}
            </span>
          </button>

          <button
            onClick={() => setLang(lang === "ta" ? "en" : "ta")}
            className="text-xs font-bold border border-white/30 rounded-lg px-2.5 py-1 text-white/80 hover:text-white hover:border-white/60 bg-white/10"
          >
            {lang === "ta" ? "EN" : "தமிழ்"}
          </button>
        </div>

        <h1 className="text-xl font-bold text-white">
          {t("registration")}
        </h1>

        <p className="text-sm text-white/75 mt-1">
          {t("newRegistrationSub")}
        </p>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-5 flex flex-col gap-4">

          <FieldRow label={t("fullName")} htmlFor="name">
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-base border-2 focus:border-primary rounded-xl"
              placeholder={t("yourNamePlaceholder")}
            />
          </FieldRow>

          <FieldRow label={t("phoneNumber")} htmlFor="phone">
            <Input
              id="phone"
              value={phone}
              onChange={(e) =>
                setPhone(
                  e.target.value.replace(/\D/g, "").slice(0, 10)
                )
              }
              className="text-base border-2 focus:border-primary rounded-xl tracking-widest font-semibold"
              inputMode="numeric"
              type="tel"
              placeholder="9876543210"
            />
          </FieldRow>

          {/* Address section */}
          <div className="bg-muted/40 rounded-xl p-4 flex flex-col gap-3">
            <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <span>🏠</span> {t("address")}
            </p>

            <FieldRow label={t("houseNo")} htmlFor="houseNo">
              <Input
                id="houseNo"
                value={houseNo}
                onChange={(e) => setHouseNo(e.target.value)}
                className="text-base bg-white border-2 focus:border-primary rounded-xl"
              />
            </FieldRow>

            <FieldRow label={t("village")}>
              <Select
                value={hamlet}
                onValueChange={handleHamletChange}
              >
                <SelectTrigger className="tap-target text-base bg-white border-2 focus:border-primary rounded-xl">
                  <SelectValue placeholder={t("selectHamlet")} />
                </SelectTrigger>

                <SelectContent>
                  {HAMLETS_LIST.map((h) => (
                    <SelectItem
                      key={h}
                      value={h}
                      className="text-base py-3"
                    >
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>

            <FieldRow label={t("street")}>
              <Select
                value={street}
                onValueChange={setStreet}
                disabled={!hamlet}
              >
                <SelectTrigger className="tap-target text-base bg-white border-2 focus:border-primary rounded-xl">
                  <SelectValue placeholder={t("selectStreet")} />
                </SelectTrigger>

                <SelectContent>
                  {availableStreets.map((s) => (
                    <SelectItem
                      key={s}
                      value={s}
                      className="text-base py-3"
                    >
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
          </div>

          <FieldRow label={t("shgGroupName")}>
            <Select value={shgName} onValueChange={setShgName}>
              <SelectTrigger className="tap-target text-base border-2 focus:border-primary rounded-xl">
                <SelectValue placeholder={t("selectShg")} />
              </SelectTrigger>

              <SelectContent>
                {shgNames.map((s) => (
                  <SelectItem
                    key={s}
                    value={s}
                    className="text-base py-3"
                  >
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!isValid || loading}
          className="tap-target w-full text-base font-bold rounded-xl shadow-sm disabled:opacity-40 mt-1"
          style={{
            background: isValid
              ? "linear-gradient(135deg, #2E7D32, #4CAF50)"
              : undefined,
          }}
        >
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            t("submit") + " →"
          )}
        </Button>
      </div>
    </div>
  );
};

export default RegistrationScreen;