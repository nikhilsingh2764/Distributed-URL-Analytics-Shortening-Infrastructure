import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import OtpInput from "../components/OtpInput";
import Button from "../components/ui/Button";
import Field from "../components/ui/Field";
import PasswordField from "../components/ui/PasswordField";
import { FormError } from "../components/ui/Misc";
import { useToast } from "../context/ToastContext";
import { getErrorMessage, getFieldErrors } from "../lib/api";
import { isStrongPassword } from "../lib/utils";
import { authService } from "../services/auth";

export default function ResetPassword() {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState((useLocation().state as { email?: string } | null)?.email ?? "");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const local: Record<string, string> = {};
    if (otp.length !== 6) local.otp = "Enter the 6-digit code from the email.";
    if (!isStrongPassword(password)) local.newPassword = "Password doesn't meet all the requirements below.";
    setFieldErrors(local);
    if (Object.keys(local).length) return;

    setBusy(true);
    try {
      await authService.resetPassword({ email: email.trim().toLowerCase(), otp, newPassword: password });
      toast.success("Password updated.");
      navigate("/login", { replace: true, state: { email, notice: "Password updated — sign in with the new one." } });
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Enter the code we emailed you, then pick a new password."
      footer={<>No code? <Link to="/forgot-password" state={{ email }} className="font-medium text-primary hover:underline">Send another</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormError message={error} />
        <Field label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <div>
          <span className="mb-1.5 block text-sm font-medium">Verification code</span>
          <OtpInput value={otp} onChange={setOtp} disabled={busy} hasError={!!fieldErrors.otp} />
          {fieldErrors.otp && <p className="mt-1.5 text-[13px] text-danger">{fieldErrors.otp}</p>}
        </div>
        <PasswordField label="New password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} error={fieldErrors.newPassword} showRules />
        <Button type="submit" loading={busy} className="w-full" size="lg">Update password</Button>
      </form>
    </AuthShell>
  );
}
