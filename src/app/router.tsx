import { createRootRoute, createRoute, createRouter, Link, Outlet } from "@tanstack/react-router";
import { Workbench } from "@/components/workbench";
import { buttonVariants } from "@/components/ui/button";

const rootRoute = createRootRoute({
  component: Outlet,
  notFoundComponent: () => (
    <main className="space-y-4 p-12">
      <h1 className="text-xl font-semibold">Page not found.</h1>
      <Link to="/" className={buttonVariants({ variant: "outline" })}>
        Back to editor
      </Link>
    </main>
  ),
});
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Workbench,
});

export const router = createRouter({ routeTree: rootRoute.addChildren([indexRoute]) });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
