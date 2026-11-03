import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useToast } from "../context/ToastContext";
import { copyToClipboard, cn } from "../lib/utils";

export default function CopyButton({ text, label = "Copy link", className }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(undefined);
  const toast = useToast();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onClick = async () => {
    if (await copyToClipboard(text)) {
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1800);
    } else {
      toast.error("Couldn't copy. Select the link and copy it manually.");
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={copied ? "Copied" : label}
      title={copied ? "Copied" : label}
      className={cn("grid size-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-sunken hover:text-ink", copied && "text-success", className)}
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
    </button>
  );
}
