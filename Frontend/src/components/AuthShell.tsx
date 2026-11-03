import type { ReactNode } from "react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

/** Shared frame for sign-in, sign-up, OTP and password pages. */
export default function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  useDocumentTitle(title);
  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem-5rem)] max-w-md place-items-center px-4 py-10">
      <div className="w-full">
        <h1 className="text-3xl font-bold">{title}</h1>
        {subtitle && <p className="mt-2 text-[15px] text-muted">{subtitle}</p>}
        <div className="mt-7 rounded-2xl border border-line bg-surface p-6 sm:p-7">{children}</div>
        {footer && <p className="mt-5 text-center text-sm text-muted">{footer}</p>}
      </div>
    </div>
  );
}
