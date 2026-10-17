import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
const auth = vi.hoisted(() => ({ user: null as null | { id: string }, isAdmin: false, loading: false, adminError: null, retryAdminCheck: vi.fn() }));
vi.mock("@/lib/useAuth", () => ({ useAuth: () => auth }));
vi.mock("@/lib/useHashRoute", () => ({ navigate: vi.fn(), routes: { adminLogin: "/admin/login", home: "/" } }));
vi.mock("@/components/admin/AdminChunk", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/pages/admin/ColetasRadarAdminPage", () => ({ default: () => <div role="region" aria-label="Coletas autorizadas" /> }));
import { RouteComponent } from "../admin.coletas-radar";
beforeEach(() => { auth.user = null; auth.isAdmin = false; });
it("não abre coletas administrativas para visitante anônimo", () => {
  render(<RouteComponent />);
  expect(screen.queryByRole("region", { name: "Coletas autorizadas" })).toBeNull();
});
it("nega o painel para uma conta não administradora", () => {
  auth.user = { id: "conta-comum" };
  render(<RouteComponent />);
  expect(screen.queryByRole("region", { name: "Coletas autorizadas" })).toBeNull();
  expect(screen.getByText("Sua conta não tem permissão para acessar o painel.")).toBeVisible();
});
it("abre o painel somente após confirmar acesso administrativo", async () => {
  auth.user = { id: "administrador" }; auth.isAdmin = true;
  render(<RouteComponent />);
  expect(await screen.findByRole("region", { name: "Coletas autorizadas" })).toBeVisible();
});