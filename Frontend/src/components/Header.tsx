import { BarChart3, BookOpen, LogOut, Moon, Settings, Sun } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { API_ORIGIN } from "../lib/api";
import { cn } from "../lib/utils";
import Logo from "./Logo";
import { buttonClass } from "./ui/Button";

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn("inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition", isActive ? "bg-primary-soft text-primary" : "text-muted hover:bg-sunken hover:text-ink");

export default function Header() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const onLogout = async () => {
    navigate("/");
    await logout();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Logo to={user ? "/dashboard" : "/"} />
          {user && (
            <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
              <NavLink to="/dashboard" className={navClass}>
                <BarChart3 className="size-4" /> Links
              </NavLink>
              <NavLink to="/settings" className={navClass}>
                <Settings className="size-4" /> Settings
              </NavLink>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <a href={`${API_ORIGIN}/api/docs`} target="_blank" rel="noreferrer" className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-sunken hover:text-ink md:inline-flex">
            <BookOpen className="size-4" /> API docs
          </a>
          <button onClick={toggle} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-sunken hover:text-ink">
            {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
          </button>

          {user ? (
            <>
              <span className="mx-1 hidden max-w-[10rem] truncate text-sm text-muted lg:inline" title={user.email}>
                {user.username}
              </span>
              <button onClick={onLogout} className={buttonClass("secondary", "sm")}>
                <LogOut className="size-4" /> <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={buttonClass("ghost", "sm")}>
                Sign in
              </Link>
              <Link to="/register" className={buttonClass("primary", "sm")}>
                Get started
              </Link>
            </>
          )}
        </div>
      </div>

      {user && (
        <nav className="flex gap-1 border-t border-line px-3 py-1.5 sm:hidden" aria-label="Main">
          <NavLink to="/dashboard" className={navClass}>Links</NavLink>
          <NavLink to="/settings" className={navClass}>Settings</NavLink>
        </nav>
      )}
    </header>
  );
}
