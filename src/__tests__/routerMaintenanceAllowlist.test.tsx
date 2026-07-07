import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("@/config/site", () => ({
  MAINTENANCE_MODE: true,
}));

vi.mock("@/App", () => ({ default: () => <div data-testid="home">home</div> }));
vi.mock("@/pages/MaintenancePage", () => ({ default: () => <div data-testid="maintenance">maintenance</div> }));
vi.mock("@/pages/LpObraPage", () => ({ default: () => <div data-testid="lp-obra">lp-obra</div> }));
vi.mock("@/pages/LpPanfletoPage", () => ({ default: () => <div data-testid="lp-panfleto">lp-panfleto</div> }));
vi.mock("@/pages/NotFoundPage", () => ({ default: () => <div data-testid="not-found">404</div> }));
vi.mock("@/pages/admin/LoginPage", () => ({ default: () => <div data-testid="admin-login">admin-login</div> }));
vi.mock("@/components/admin/ProtectedRoute", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/pages/admin/BewildOverviewPage", () => ({ default: () => <div data-testid="admin-dashboard">admin-dashboard</div> }));

import { renderRoute } from "@/router";

describe("maintenance gate allowlist", () => {
  it("home falls to MaintenancePage", () => {
    const { getByTestId } = render(<>{renderRoute({ name: "home" })}</>);
    expect(getByTestId("maintenance")).toBeDefined();
  });

  it("lp-obra passes the gate", () => {
    const { getByTestId } = render(<>{renderRoute({ name: "lp-obra" })}</>);
    expect(getByTestId("lp-obra")).toBeDefined();
  });

  it("lp-panfleto passes the gate", () => {
    const { getByTestId } = render(<>{renderRoute({ name: "lp-panfleto" })}</>);
    expect(getByTestId("lp-panfleto")).toBeDefined();
  });

  it("admin-login passes the gate", () => {
    const { getByTestId } = render(<>{renderRoute({ name: "admin-login" })}</>);
    expect(getByTestId("admin-login")).toBeDefined();
  });

  it("portfolio falls to MaintenancePage", () => {
    const { getByTestId } = render(<>{renderRoute({ name: "portfolio" })}</>);
    expect(getByTestId("maintenance")).toBeDefined();
  });
});
