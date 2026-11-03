import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import Button from "../components/ui/Button";
import Field from "../components/ui/Field";
import PasswordField from "../components/ui/PasswordField";
import { FormError } from "../components/ui/Misc";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../lib/api";

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { from?: string; email?: string; notice?: string } | null;

  const [email, setEmail] = useState(state?.email ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
      toast.success("Signed in.");
      navigate(state?.from ?? "/dashboard", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage your links."
      footer={<>New to Trimly? <Link to="/register" className="font-medium text-primary hover:underline">Create an account</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {state?.notice && <p role="status" className="rounded-lg bg-primary-soft px-3.5 py-2.5 text-sm text-primary">{state.notice}</p>}
        <FormError message={error} />
        <Field label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus={!email} />
        <PasswordField label="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <div className="flex justify-end">
          <Link to="/forgot-password" state={{ email }} className="text-sm text-muted hover:text-ink hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" loading={busy} className="w-full" size="lg">Sign in</Button>
      </form>
    </AuthShell>
  );
}
