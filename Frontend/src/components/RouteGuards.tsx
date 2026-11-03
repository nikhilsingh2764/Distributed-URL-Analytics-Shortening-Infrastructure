import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Spinner } from "./ui/Misc";

const Loading = () => (
  <div className="grid min-h-[50vh] place-items-center">
    <Spinner className="size-7" />
  </div>
);

/** Only signed-in users; others are sent to /login and returned afterwards. */
export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

/** Login/register pages: signed-in users go straight to the dashboard. */
export function GuestRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
