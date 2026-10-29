import { createRootRoute, createRoute, createRouter, Link, Outlet } from "@tanstack/react-router";
import { Workbench } from "@/features/workbench/Workbench";
import { buttonVariants } from "@/components/ui/button";

const rootRoute = createRootRoute({
  component: Outlet,
  notFoundComponent: () => (
    <main className="space-y-4 p-12">
      <h1 className="text-xl font-semibold">페이지를 찾을 수 없습니다.</h1>
      <Link to="/" className={buttonVariants({ variant: "outline" })}>
        작업 화면으로 돌아가기
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
