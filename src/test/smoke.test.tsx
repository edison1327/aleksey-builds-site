import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const wrap = (ui: React.ReactNode) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe("smoke", () => {
  it("environment works", () => {
    expect(1 + 1).toBe(2);
  });

  it("renders a basic component tree", () => {
    const { container } = render(wrap(<div data-testid="root">ok</div>));
    expect(container.querySelector("[data-testid=root]")).toBeTruthy();
  });
});
