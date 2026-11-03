import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { useToast } from "../context/ToastContext";
import { getErrorMessage, getFieldErrors } from "../lib/api";
import type { UrlItem } from "../lib/types";
import { isoToLocalInput, localInputToIso, nowLocalInput } from "../lib/utils";
import { urlService } from "../services/urls";
import Button from "./ui/Button";
import Field from "./ui/Field";
import { FormError } from "./ui/Misc";
import Modal from "./ui/Modal";

export default function EditLinkModal({ link, onClose }: { link: UrlItem | null; onClose: () => void }) {
  // Re-mount the form whenever a different link is opened so its state starts fresh.
  return (
    <Modal open={!!link} title="Edit link" description={link ? `trimly /${link.shortCode} — the short address stays the same.` : undefined} onClose={onClose}>
      {link && <EditForm key={link.id} link={link} onClose={onClose} />}
    </Modal>
  );
}

function EditForm({ link, onClose }: { link: UrlItem; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [url, setUrl] = useState(link.originalUrl);
  const [expires, setExpires] = useState(link.expiresAt ? isoToLocalInput(link.expiresAt) : "");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: () =>
      urlService.update(link.id, {
        originalUrl: url.trim(),
        expiresAt: expires ? localInputToIso(expires) : null,
      }),
    onSuccess: () => {
      toast.success("Link updated.");
      qc.invalidateQueries({ queryKey: ["urls"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
      qc.invalidateQueries({ queryKey: ["analytics", link.id] });
      onClose();
    },
    onError: (err) => {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err));
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    mutation.mutate();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormError message={Object.keys(fieldErrors).length ? "" : error} />
      <Field label="Destination URL" value={url} onChange={(e) => setUrl(e.target.value)} error={fieldErrors.originalUrl} inputMode="url" />
      <div>
        <Field label="Expires" type="datetime-local" value={expires} min={nowLocalInput()} onChange={(e) => setExpires(e.target.value)} error={fieldErrors.expiresAt} hint={expires ? undefined : "Never expires."} />
        {expires && (
          <button type="button" onClick={() => setExpires("")} className="mt-1.5 text-[13px] font-medium text-primary hover:underline">
            Remove expiry
          </button>
        )}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={mutation.isPending}>Save changes</Button>
      </div>
    </form>
  );
}
