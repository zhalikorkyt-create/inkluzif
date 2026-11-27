import { createRootRoute, HeadContent, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { TeacherProvider } from "@/lib/store";

function Root() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const publicPage = path.startsWith("/play") || path.startsWith("/parent");
  return (
    <>
      <HeadContent />
      {publicPage ? <Outlet /> : <AppShell><TeacherProvider><Outlet /></TeacherProvider></AppShell>}
    </>
  );
}

export const Route = createRootRoute({
  component: Root,
  notFoundComponent: () => (
    <div className="card text-center">
      <p className="font-bold">Бет табылмады</p>
      <Link to="/" className="btn mt-4">Басты бетке</Link>
    </div>
  ),
});
