import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import OtpInput from "../components/OtpInput";
import Button from "../components/ui/Button";
import { FormError } from "../components/ui/Misc";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../lib/api";
import { authService } from "../services/auth";

const COOLDOWN = 60;

export default function VerifyEmail() {
  const email = (useLocation().state as { email?: string } | null)?.email;
  const navigate = useNavigate();
  const toast = useToast();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [wait, setWait] = useState(COOLDOWN);

  useEffect(() => {
    if (wait <= 0) return;
    const id = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(id);
  }, [wait]);

  if (!email) return <Navigate to="/register" replace />;

  const verify = async (code: string) => {
    setError("");
    setBusy(true);
    try {
      await authService.verifyOtp({ email, otp: code });
      toast.success("Email verified. Sign in to continue.");
      navigate("/login", { replace: true, state: { email, notice: "Your account is ready — sign in below." } });
    } catch (err) {
      setError(getErrorMessage(err));
      setOtp("");
    } finally {
      setBusy(false);
    }
  };

  const onChange = (v: string) => {
    setOtp(v);
    if (v.length === 6 && !busy) void verify(v); // submit automatically on the 6th digit
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (otp.length === 6) void verify(otp);
    else setError("Enter all 6 digits.");
  };

  const resend = async () => {
    setResending(true);
    setError("");
    try {
      await authService.resendOtp(email);
      toast.success("New code sent.");
      setWait(COOLDOWN);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell
      title="Check your email"
      subtitle={<>We sent a 6-digit code to <strong className="text-ink">{email}</strong>. It expires in 10 minutes.</>}
      footer={<>Wrong address? <Link to="/register" className="font-medium text-primary hover:underline">Start over</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <FormError message={error} />
        <OtpInput value={otp} onChange={onChange} disabled={busy} hasError={!!error} />
        <Button type="submit" loading={busy} className="w-full" size="lg">Verify email</Button>
        <div className="text-center text-sm text-muted">
          Didn't get it?{" "}
          {wait > 0 ? (
            <span>Resend in {wait}s</span>
          ) : (
            <button type="button" onClick={resend} disabled={resending} className="font-medium text-primary hover:underline disabled:opacity-60">
              Send a new code
            </button>
          )}
        </div>
      </form>
    </AuthShell>
  );
}
