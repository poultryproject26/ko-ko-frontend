import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { User } from "@/lib/auth";
import { api } from "@/lib/api";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface OtpScreenProps {
  phone: string;
  devOtp?: string | null;
  onVerified: (user: User, token: string) => void;
  onBack: () => void;
}

const OtpScreen = ({ phone, devOtp, onVerified, onBack }: OtpScreenProps) => {
  const { t, lang, setLang } = useLanguage();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) refs.current[index - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) return;
    setLoading(true);
    try {
      const result = await api.verifyOtp(phone, code);
      toast.success("✅ " + t("done"));
      onVerified(result.user, result.token);
    } catch (err: any) {
      setLoading(false);
      if (err?.message === "pending") {
        toast(t("pendingCrpApprovalToast"));
        onBack();
      } else {
        toast.error(err?.message || t("invalidOtpToast"));
        setOtp(["", "", "", "", "", ""]);
        refs.current[0]?.focus();
      }
    }
    setLoading(false);
  };

  const handleResend = async () => {
    try {
      await api.sendOtp(phone);
      setResendTimer(30);
      toast(t("otpResentToast"));
    } catch {
      toast.error(t("otpResendFailedToast"));
    }
  };

  const isComplete = otp.every((d) => d !== "");

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "linear-gradient(160deg, #f1f8e9 0%, #e8f5e9 50%, #f9fbe7 100%)" }}>
      {/* Header strip */}
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
        <h1 className="text-xl font-bold text-white">{t("otpVerification")}</h1>
        <p className="text-sm text-white/75 mt-1">{t("otpSentTo")} <span className="font-bold text-white">{phone}</span></p>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col gap-5">
        {devOtp && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2">
            <span className="text-amber-500 text-lg">🔑</span>
            <p className="text-sm text-amber-800">சோதனை OTP: <span className="font-bold font-mono text-amber-900 text-base">{devOtp}</span></p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-5 flex flex-col gap-5">
          <Label className="text-sm font-semibold text-foreground">{t("enterOtp")}</Label>

          <div className="flex gap-2.5 justify-center">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { refs.current[i] = el; }}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-white focus:outline-none transition-all ${
                  digit ? "border-primary bg-primary/5 text-primary" : "border-input text-foreground"
                } focus:border-primary focus:ring-2 focus:ring-primary/20`}
              />
            ))}
          </div>

          <Button
            onClick={handleVerify}
            disabled={!isComplete || loading}
            className="tap-target w-full text-base font-bold rounded-xl shadow-sm disabled:opacity-40"
            style={{ background: isComplete ? "linear-gradient(135deg, #2E7D32, #4CAF50)" : undefined }}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : t("verifyOtp") + " →"}
          </Button>

          <div className="text-center">
            {resendTimer > 0 ? (
              <p className="text-xs text-muted-foreground">{t("pleaseWaitResend")} <span className="font-bold text-primary">{resendTimer}s</span></p>
            ) : (
              <button onClick={handleResend} className="text-primary font-semibold text-sm underline underline-offset-2">
                {t("resendOtp")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpScreen;
