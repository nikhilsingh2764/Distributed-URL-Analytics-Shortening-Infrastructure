import { Link } from "react-router-dom";
import { buttonClass } from "../components/ui/Button";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function NotFound() {
  useDocumentTitle("Page not found");
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-md place-items-center px-4 text-center">
      <div>
        <p className="font-mono text-sm text-muted">404</p>
        <h1 className="mt-2 text-4xl font-bold">This page was trimmed away.</h1>
        <p className="mt-3 text-muted">The address may be mistyped, or the page has moved.</p>
        <Link to="/" className={buttonClass("primary", "md", "mt-6")}>Back to home</Link>
      </div>
    </div>
  );
}
