import { useState, useEffect, useRef, useCallback } from "react";
import { getUser, setUser, getToken, clearUser, User } from "@/lib/auth";
import { api } from "@/lib/api";
import ChooseActionScreen from "@/components/auth/ChooseActionScreen";
import RegistrationScreen from "@/components/auth/RegistrationScreen";
import OtpScreen from "@/components/auth/OtpScreen";
import AdminLoginScreen from "@/components/auth/AdminLoginScreen";
import PasswordLoginScreen from "@/components/auth/PasswordLoginScreen";
import PasswordSetupScreen from "@/components/auth/PasswordSetupScreen";
import AdminDashboard from "@/components/admin/AdminDashboard";
import Dashboard from "@/components/dashboard/Dashboard";
import CrpDashboard from "@/components/crp/CrpDashboard";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";
import { setupPushNotifications, teardownPushNotifications } from "@/lib/pushNotifications";

const INACTIVITY_MS = 30 * 60 * 1000; // 30 minutes

type Screen = "choose" | "register" | "otp" | "login" | "password-setup" | "admin-login" | "app";

const Index = () => {
  const { t } = useLanguage();
  const [user, setUserState] = useState<User | null>(null);
  const [screen, setScreen] = useState<Screen>("choose");
  const [pendingPhone, setPendingPhone] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogout = useCallback((reason?: string) => {
    teardownPushNotifications();
    clearUser();
    setUserState(null);
    setScreen("choose");
    if (reason) toast(reason);
  }, []);

// Inactivity auto-logout
  useEffect(() => {
    if (screen !== "app") return;
    const reset = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => handleLogout(t("sessionExpiredToast")), INACTIVITY_MS);
    };
    const events = ["mousemove", "keydown", "touchstart", "click", "scroll"];
    events.forEach((e) => window.addEventListener(e, reset));
    reset();
    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [screen, handleLogout, t]);

  useEffect(() => {
    const stored = getUser();
    if (stored) { setUserState(stored); setScreen("app"); }
  }, []);

  // Register for push notifications once an authenticated session exists —
  // covers both a fresh login (handleOtpVerified) and a restored session
  // (effect above), since both set `user`. setupPushNotifications() itself
  // guards against being run more than once.
  useEffect(() => {
    if (!user) return;
    setupPushNotifications(getToken());
  }, [user]);

  const handleLogin = async (phone: string) => {
    setPendingPhone(phone);
    setScreen("login");
  };

  const handlePasswordSetup = async (phone: string) => {
    try {
      await api.sendOtp(phone);
      setPendingPhone(phone);
      setScreen("password-setup");
    } catch (err: any) {
      toast.error(err?.status === 503 ? t("otpDeliveryUnavailable") : t("otpRequestFailed"));
    }
  };

  const handleRegisterData = async (data: any) => {
    try {
      await api.register({
        phone: data.phone,
        name: data.name,
        hamlet: data.hamlet,
        hamletId: data.hamletId,
        street: data.street,
        streetId: data.streetId,
        houseNo: data.houseNo,
        shg_name: data.shgName,
      });
      await api.sendOtp(data.phone);
      setPendingPhone(data.phone);
      setIsRegistering(true);
      setScreen("otp");
    } catch (err: any) {
      toast.error(err?.status === 503 ? t("otpDeliveryUnavailable") : t("registrationFailed"));
    }
  };

  const handleOtpVerified = (verifiedUser: User, token: string) => {
    setUser(verifiedUser, token);
    setUserState(verifiedUser);
    setScreen("app");
  };

  const handleAdminLoginSuccess = (adminUser: User, token: string) => {
    setUser(adminUser, token);
    setUserState(adminUser);
    setScreen("app");
  };

  if (screen === "app" && user) {
    if (user.role === "ADMIN") return <AdminDashboard user={user} onLogout={handleLogout} />;
    if (user.role === "CRP") return <CrpDashboard user={user} onLogout={handleLogout} />;
    return (
      <div className="max-w-[430px] mx-auto min-h-screen shadow-lg">
        <Dashboard user={user} onLogout={handleLogout} />
      </div>
    );
  }

  return (
    <div className="max-w-[430px] mx-auto min-h-screen shadow-lg" style={{ background: "linear-gradient(160deg, #f1f8e9 0%, #e8f5e9 50%, #f9fbe7 100%)" }}>
      {screen === "choose" && (
        <ChooseActionScreen onRegister={() => setScreen("register")} onLogin={handleLogin} />
      )}
      {screen === "register" && (
        <RegistrationScreen onNext={handleRegisterData} onBack={() => setScreen("choose")} />
      )}
      {screen === "otp" && (
        <OtpScreen
          phone={pendingPhone}
          onVerified={handleOtpVerified}
          onBack={() => setScreen("choose")}
        />
      )}
      {screen === "login" && (
        <PasswordLoginScreen
          phone={pendingPhone}
          onBack={() => setScreen("choose")}
          onSetupPassword={() => handlePasswordSetup(pendingPhone)}
          onLoginSuccess={handleOtpVerified}
        />
      )}
      {screen === "password-setup" && (
        <PasswordSetupScreen
          phone={pendingPhone}
          onBack={() => setScreen("login")}
          onResend={() => api.sendOtp(pendingPhone)}
          onSetupSuccess={handleOtpVerified}
        />
      )}
      {screen === "admin-login" && (
        <AdminLoginScreen onLoginSuccess={handleAdminLoginSuccess} onBack={() => setScreen("choose")} />
      )}
    </div>
  );
};

export default Index;
