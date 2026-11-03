import { Eye, EyeOff } from "lucide-react";
import { useState, type InputHTMLAttributes } from "react";
import Field from "./Field";
import { PASSWORD_RULES, cn } from "../../lib/utils";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
  /** Show the live checklist of password rules. */
  showRules?: boolean;
}

export default function PasswordField({ showRules, value, ...rest }: Props) {
  const [visible, setVisible] = useState(false);
  const text = typeof value === "string" ? value : "";

  return (
    <div>
      <Field
        {...rest}
        value={value}
        type={visible ? "text" : "password"}
        trailing={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="rounded-md p-2 text-muted hover:text-ink"
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
      />
      {showRules && (
        <ul className="mt-2.5 grid grid-cols-1 gap-x-4 gap-y-1 text-[13px] sm:grid-cols-2" aria-label="Password requirements">
          {PASSWORD_RULES.map((rule) => {
            const ok = rule.test(text);
            return (
              <li key={rule.id} className={cn("flex items-center gap-2", ok ? "text-success" : "text-muted")}>
                <span aria-hidden className={cn("grid size-3.5 place-items-center rounded-full border text-[9px]", ok ? "border-success bg-success text-primary-ink" : "border-line")}>
                  {ok ? "✓" : ""}
                </span>
                {rule.label}
                <span className="sr-only">{ok ? "(met)" : "(not met)"}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
