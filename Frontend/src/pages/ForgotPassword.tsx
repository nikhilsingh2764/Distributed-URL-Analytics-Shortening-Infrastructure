import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import Button from "../components/ui/Button";
import Field from "../components/ui/Field";
import { FormError } from "../components/ui/Misc";
import { getErrorMessage } from "../lib/api";
import { authService } from "../services/auth";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState((useLocation().state as { email?: string } | null)?.email ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const clean = email.trim().toLowerCase();
      await authService.forgotPassword(clean);
      navigate("/reset-password", { state: { email: clean } });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send a code to choose a new password."
      footer={<Link to="/login" className="font-medium text-primary hover:underline">Back to sign in</Link>}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormError message={error} />
        <Field label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        <Button type="submit" loading={busy} className="w-full" size="lg">Send reset code</Button>
      </form>
    </AuthShell>
  );
}
