import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import Button from "../components/ui/Button";
import Field from "../components/ui/Field";
import PasswordField from "../components/ui/PasswordField";
import { FormError } from "../components/ui/Misc";
import { getErrorMessage, getFieldErrors } from "../lib/api";
import { isStrongPassword } from "../lib/utils";
import { authService } from "../services/auth";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const local: Record<string, string> = {};
    if (!/^[A-Za-z0-9_]{3,30}$/.test(form.username.trim())) local.username = "3–30 characters: letters, numbers and underscores.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) local.email = "Enter a valid email address.";
    if (!isStrongPassword(form.password)) local.password = "Password doesn't meet all the requirements below.";
    setFieldErrors(local);
    if (Object.keys(local).length) return;

    setBusy(true);
    try {
      const email = form.email.trim().toLowerCase();
      await authService.signup({ username: form.username.trim(), email, password: form.password });
      navigate("/verify-email", { state: { email } });
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="We'll email you a 6-digit code to confirm your address."
      footer={<>Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormError message={Object.keys(fieldErrors).length ? "" : error} />
        <Field label="Username" autoComplete="username" value={form.username} onChange={set("username")} error={fieldErrors.username} autoFocus />
        <Field label="Email" type="email" autoComplete="email" value={form.email} onChange={set("email")} error={fieldErrors.email} />
        <PasswordField label="Password" autoComplete="new-password" value={form.password} onChange={set("password")} error={fieldErrors.password} showRules />
        <Button type="submit" loading={busy} className="w-full" size="lg">Send verification code</Button>
      </form>
    </AuthShell>
  );
}
