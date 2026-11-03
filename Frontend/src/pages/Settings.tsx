import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Field from "../components/ui/Field";
import Modal from "../components/ui/Modal";
import PasswordField from "../components/ui/PasswordField";
import { FormError } from "../components/ui/Misc";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { getErrorMessage, getFieldErrors } from "../lib/api";
import { formatDate, isStrongPassword } from "../lib/utils";
import { authService } from "../services/auth";

export default function Settings() {
  useDocumentTitle("Settings");
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-1 text-muted">{user.email} · member since {formatDate(user.createdAt)}</p>
      </div>
      <ProfileCard />
      <PasswordCard />
      <DangerZone />
    </div>
  );
}

function Card({ title, description, children, tone }: { title: string; description?: string; children: ReactNode; tone?: "danger" }) {
  return (
    <section className={`rounded-2xl border bg-surface p-5 sm:p-6 ${tone === "danger" ? "border-danger/40" : "border-line"}`}>
      <h2 className={`text-lg font-semibold ${tone === "danger" ? "text-danger" : ""}`}>{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ProfileCard() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [username, setUsername] = useState(user?.username ?? "");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () => authService.updateProfile(username.trim()),
    onSuccess: (u) => { setUser(u); setError(""); toast.success("Username updated."); },
    onError: (err) => setError(getFieldErrors(err).username ?? getErrorMessage(err)),
  });

  const unchanged = username.trim() === user?.username;
  const onSubmit = (e: FormEvent) => { e.preventDefault(); setError(""); mutation.mutate(); };

  return (
    <Card title="Profile" description="Your username is shown in the header. Email can't be changed.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-start" noValidate>
        <Field label="Username" value={username} onChange={(e) => setUsername(e.target.value)} error={error} className="flex-1" autoComplete="username" />
        <Button type="submit" loading={mutation.isPending} disabled={unchanged || username.trim().length < 3} className="sm:mt-[1.7rem]">Save</Button>
      </form>
    </Card>
  );
}

function PasswordCard() {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: () => authService.changePassword({ currentPassword: current, newPassword: next }),
    onSuccess: () => { setCurrent(""); setNext(""); setError(""); setFieldErrors({}); toast.success("Password changed. Other devices were signed out."); },
    onError: (err) => { setFieldErrors(getFieldErrors(err)); setError(getErrorMessage(err)); },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isStrongPassword(next)) return setFieldErrors({ newPassword: "Password doesn't meet all the requirements below." });
    setFieldErrors({});
    mutation.mutate();
  };

  return (
    <Card title="Password" description="Changing it signs you out everywhere else.">
      <form onSubmit={onSubmit} className="max-w-md space-y-4" noValidate>
        <FormError message={Object.keys(fieldErrors).length ? "" : error} />
        <PasswordField label="Current password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} error={fieldErrors.currentPassword} />
        <PasswordField label="New password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} error={fieldErrors.newPassword} showRules />
        <Button type="submit" loading={mutation.isPending} disabled={!current || !next}>Update password</Button>
      </form>
    </Card>
  );
}

function DangerZone() {
  const { logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const finish = async (message: string) => {
    await logout().catch(() => undefined);
    toast.success(message);
    navigate("/", { replace: true });
  };

  const deactivate = useMutation({
    mutationFn: authService.deactivate,
    onSuccess: () => finish("Account deactivated."),
    onError: (err) => { setConfirmDeactivate(false); toast.error(getErrorMessage(err)); },
  });

  const remove = useMutation({
    mutationFn: () => authService.deleteAccount(password),
    onSuccess: () => finish("Your account and all its data were deleted."),
    onError: (err) => setError(getErrorMessage(err)),
  });

  const closeDelete = () => { setDeleting(false); setPassword(""); setError(""); };

  return (
    <Card tone="danger" title="Danger zone" description="These actions affect your whole account.">
      <div className="divide-y divide-line">
        <div className="flex flex-col gap-3 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Deactivate account</p>
            <p className="text-sm text-muted">Signs you out and blocks sign-in. Your links keep working.</p>
          </div>
          <Button variant="secondary" onClick={() => setConfirmDeactivate(true)}>Deactivate</Button>
        </div>
        <div className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Delete account</p>
            <p className="text-sm text-muted">Permanently erases your account, every link and all click history.</p>
          </div>
          <Button variant="danger" onClick={() => setDeleting(true)}>Delete account</Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeactivate}
        title="Deactivate your account?"
        confirmLabel="Deactivate"
        loading={deactivate.isPending}
        onClose={() => setConfirmDeactivate(false)}
        onConfirm={() => deactivate.mutate()}
        description="You'll be signed out and won't be able to sign in again until the account is reactivated by an administrator."
      />

      <Modal open={deleting} title="Delete your account?" description="This can't be undone. Enter your password to confirm." onClose={closeDelete}>
        <form onSubmit={(e) => { e.preventDefault(); setError(""); remove.mutate(); }} className="space-y-4">
          <FormError message={error} />
          <PasswordField label="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeDelete}>Cancel</Button>
            <Button type="submit" variant="danger" loading={remove.isPending} disabled={!password}>Delete everything</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
