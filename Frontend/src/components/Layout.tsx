import { Outlet } from "react-router-dom";
import { API_ORIGIN } from "../lib/api";
import Header from "./Header";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-line py-6 text-sm text-muted">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Trimly. Short links, honest analytics.</p>
          <a href={`${API_ORIGIN}/api/docs`} target="_blank" rel="noreferrer" className="underline-offset-4 hover:text-ink hover:underline">
            API documentation
          </a>
        </div>
      </footer>
    </div>
  );
}
