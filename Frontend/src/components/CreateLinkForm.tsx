import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Link2, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useToast } from "../context/ToastContext";
import { getErrorMessage, getFieldErrors } from "../lib/api";
import type { UrlItem } from "../lib/types";
import { cn, localInputToIso, nowLocalInput } from "../lib/utils";
import { urlService } from "../services/urls";
import CopyButton from "./CopyButton";
import Button from "./ui/Button";
import Field from "./ui/Field";
import { FormError } from "./ui/Misc";

export default function CreateLinkForm() {
  const qc = useQueryClient();
  const toast = useToast();
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [expires, setExpires] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<UrlItem | null>(null);

  const mutation = useMutation({
    mutationFn: urlService.create,
    onSuccess: (item) => {
      setCreated(item);
      setUrl("");
      setAlias("");
      setExpires("");
      setError("");
      setFieldErrors({});
      qc.invalidateQueries({ queryKey: ["urls"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
    },
    onError: (err) => {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err));
      setCreated(null);
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    let value = url.trim();
    if (!value) return setFieldErrors({ originalUrl: "Paste a link to shorten." });
    // Friendly: "example.com/page" works too.
    if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
    setFieldErrors({});
    mutation.mutate(
      {
        originalUrl: value,
        customAlias: alias.trim() || undefined,
        expiresAt: expires ? localInputToIso(expires) : undefined,
      },
      { onError: () => toast.error("Couldn't create the link.") },
    );
  };

  return (
    <section aria-labelledby="create-heading" className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h2 id="create-heading" className="flex items-center gap-2 text-lg font-semibold">
        <Sparkles className="size-[18px] text-accent" aria-hidden /> Shorten a link
      </h2>

      <form onSubmit={onSubmit} className="mt-4" noValidate>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex-1">
            <label htmlFor="long-url" className="sr-only">Long URL</label>
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
              <input
                id="long-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste a long link, e.g. https://example.com/very/long/path"
                inputMode="url"
                autoComplete="off"
                aria-invalid={!!fieldErrors.originalUrl}
                className={cn("field-input h-12 pl-10", fieldErrors.originalUrl && "border-danger")}
              />
            </div>
            {fieldErrors.originalUrl && <p className="mt-1.5 text-[13px] text-danger">{fieldErrors.originalUrl}</p>}
          </div>
          <Button type="submit" size="lg" loading={mutation.isPending} className="sm:w-36">Shorten</Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
        >
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden /> Custom name & expiry
        </button>

        {open && (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field
              label="Custom name (optional)"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="spring-sale"
              error={fieldErrors.customAlias}
              hint="3–32 letters, numbers, - or _"
              autoComplete="off"
            />
            <Field
              label="Expires (optional)"
              type="datetime-local"
              value={expires}
              min={nowLocalInput()}
              onChange={(e) => setExpires(e.target.value)}
              error={fieldErrors.expiresAt}
              hint="After this time the link stops working."
            />
          </div>
        )}

        {error && !["originalUrl", "customAlias", "expiresAt"].some((k) => fieldErrors[k]) && (
          <div className="mt-4"><FormError message={error} /></div>
        )}
      </form>

      {created && (
        <div role="status" className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-primary/30 bg-primary-soft px-4 py-3">
          <span className="text-sm font-medium text-primary">Your short link is ready:</span>
          <a href={created.shortUrl} target="_blank" rel="noreferrer" className="link-code font-medium text-ink underline-offset-4 hover:underline">
            {created.shortUrl}
          </a>
          <CopyButton text={created.shortUrl} className="ml-auto hover:bg-surface" />
        </div>
      )}
    </section>
  );
}
