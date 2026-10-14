import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { User } from "@/lib/auth";
import { isValidFourDigitPassword } from "@/lib/authValidation";
import { useLanguage } from "@/i18n/LanguageContext";

interface PasswordSetupScreenProps {
  phone: string;
  onBack: () => void;
  onResend: () => Promise<unknown>;
  onSetupSuccess: (user: User, token: string) => void;
}

const PasswordSetupScreen = ({ phone, onBack, onResend, onSetupSuccess }: PasswordSetupScreenProps) => {
  const { t, lang, setLang } = useLanguage();
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async () => {
    if (!/^\d{6}$/.test(otp)) {
      toast.error(t("invalidOtpToast"));
      return;
    }
    if (!isValidFourDigitPassword(password)) {
      toast.error(t("passwordFormatError"));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t("passwordMismatchError"));
      return;
    }

    setLoading(true);
    try {
      await api.setupPassword(phone, otp, password);
      const result = await api.login(phone, password);
      onSetupSuccess(result.user, result.token);
    } catch (err: any) {
      toast.error(err?.status === 409 ? t("passwordSetupUnavailable") : t("invalidOtpToast"));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await onResend();
      setOtp("");
      toast.success(t("otpResentToast"));
    } catch (err: any) {
      toast.error(err?.status === 503 ? t("otpDeliveryUnavailable") : t("otpRequestFailed"));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "linear-gradient(160deg, #f1f8e9 0%, #e8f5e9 50%, #f9fbe7 100%)" }}>
      <div className="relative agri-header-gradient px-5 pt-12 pb-8 flex flex-col">
        <div className="flex justify-between items-start">
          <button onClick={onBack} className="flex items-center gap-1.5 text-white/80 hover:text-white mb-5 w-fit">
            <ArrowLeft size={18} /> <span className="text-sm font-medium">{t("back")}</span>
          </button>
          <button
            onClick={() => setLang(lang === "ta" ? "en" : "ta")}
            className="text-xs font-bold border border-white/30 rounded-lg px-2.5 py-1 text-white/80 hover:text-white hover:border-white/60 bg-white/10"
          >
            {lang === "ta" ? "EN" : "தமிழ்"}
          </button>
        </div>
        <h1 className="text-xl font-bold text-white">{t("setPasswordTitle")}</h1>
        <p className="text-sm text-white/75 mt-1">{t("setPasswordDescription")} {phone}</p>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col gap-5">
        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-5 flex flex-col gap-4">
          <div>
            <Label className="text-sm font-semibold text-foreground mb-2 block">{t("otpCodeLabel")}</Label>
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="tap-target text-lg font-semibold tracking-widest border-2 focus:border-primary rounded-xl"
              placeholder={t("otpPlaceholder")}
              inputMode="numeric"
              type="text"
            />
          </div>

          <div>
            <Label className="text-sm font-semibold text-foreground mb-2 block">{t("createFourDigitPassword")}</Label>
            <div className="relative">
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="tap-target text-base border-2 focus:border-primary rounded-xl pr-10"
                placeholder="••••"
                type={showPassword ? "text" : "password"}
                inputMode="numeric"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label={showPassword ? t("hidePassword") : t("showPassword")}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold text-foreground mb-2 block">{t("confirmFourDigitPassword")}</Label>
            <Input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="tap-target text-base border-2 focus:border-primary rounded-xl"
              placeholder="••••"
              type={showPassword ? "text" : "password"}
              inputMode="numeric"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || resending}
            className="tap-target w-full text-base font-bold rounded-xl shadow-sm disabled:opacity-40"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : t("createPassword") + " →"}
          </Button>

          <button
            type="button"
            onClick={handleResend}
            disabled={loading || resending}
            className="text-primary text-sm font-semibold underline underline-offset-2 disabled:opacity-50"
          >
            {resending ? <Loader2 className="animate-spin inline" size={16} /> : t("resendCode")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordSetupScreen;
