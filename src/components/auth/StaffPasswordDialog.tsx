import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { isValidFourDigitPassword } from "@/lib/authValidation";

interface StaffPasswordDialogProps {
  open: boolean;
  targetName: string;
  onOpenChange: (open: boolean) => void;
  onSave: (password: string) => Promise<void>;
}

const StaffPasswordDialog = ({ open, targetName, onOpenChange, onSave }: StaffPasswordDialogProps) => {
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setPassword("");
      setConfirmation("");
    }
  }, [open]);

  const handleSave = async () => {
    if (!isValidFourDigitPassword(password)) {
      toast.error(t("passwordFormatError"));
      return;
    }
    if (password !== confirmation) {
      toast.error(t("passwordMismatchError"));
      return;
    }

    setLoading(true);
    try {
      await onSave(password);
      setPassword("");
      setConfirmation("");
      onOpenChange(false);
    } catch {
      toast.error(t("staffPasswordSaveFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !loading && onOpenChange(nextOpen)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("staffPasswordTitle")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {t("staffPasswordDescription")} <span className="font-semibold text-foreground">{targetName}</span>
        </p>
        <p className="text-sm text-amber-700">{t("staffPasswordVerifyInPerson")}</p>
        <div>
          <Label className="mb-1.5 block">{t("newFourDigitPassword")}</Label>
          <Input
            value={password}
            onChange={(event) => setPassword(event.target.value.replace(/\D/g, "").slice(0, 4))}
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            placeholder="••••"
          />
        </div>
        <div>
          <Label className="mb-1.5 block">{t("confirmFourDigitPassword")}</Label>
          <Input
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value.replace(/\D/g, "").slice(0, 4))}
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            placeholder="••••"
            onKeyDown={(event) => event.key === "Enter" && handleSave()}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={16} /> : t("savePassword")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StaffPasswordDialog;
