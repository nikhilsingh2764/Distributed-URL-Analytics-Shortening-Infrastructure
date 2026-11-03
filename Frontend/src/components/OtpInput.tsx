import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "../lib/utils";

/** Six single-digit boxes with paste support and arrow/backspace navigation. */
export default function OtpInput({ value, onChange, disabled, hasError }: { value: string; onChange: (v: string) => void; disabled?: boolean; hasError?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

  const focus = (i: number) => refs.current[Math.max(0, Math.min(5, i))]?.focus();

  const setDigit = (i: number, d: string) => {
    const next = digits.slice();
    next[i] = d;
    onChange(next.join(""));
  };

  const onKeyDown = (i: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i]) { focus(i - 1); }
    else if (e.key === "ArrowLeft") focus(i - 1);
    else if (e.key === "ArrowRight") focus(i + 1);
  };

  const onPaste = (e: ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    focus(pasted.length);
  };

  return (
    <div className="flex justify-between gap-2" onPaste={onPaste} role="group" aria-label="6-digit verification code">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={d}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          aria-invalid={hasError}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(-1);
            setDigit(i, v);
            if (v) focus(i + 1);
          }}
          onKeyDown={onKeyDown(i)}
          onFocus={(e) => e.target.select()}
          className={cn("field-input h-14 w-full px-0 text-center font-mono text-2xl font-semibold", hasError && "border-danger")}
        />
      ))}
    </div>
  );
}
