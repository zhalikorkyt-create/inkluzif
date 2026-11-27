import { createRootRoute, HeadContent, Outlet, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";

export const Route = createRootRoute({
  component: () => (
    <>
      <HeadContent />
      <AppShell><Outlet /></AppShell>
    </>
  ),
  notFoundComponent: () => (
    <div className="card text-center">
      <p className="font-bold">Бет табылмады</p>
      <Link to="/" className="btn mt-4">Басты бетке</Link>
    </div>
  ),
});
