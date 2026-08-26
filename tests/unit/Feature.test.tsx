import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMockRoom } from "@baditaflorin/mesh-common/testing";
import { Feature } from "../../src/Feature";
import { config } from "../../src/config";

describe("Feature (component)", () => {
  it("renders the human product name when connected", () => {
    const room = createMockRoom();
    render(<Feature room={room} config={config} />);
    expect(screen.getByRole("heading", { level: 1, name: "Field Check-in" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check in" })).toBeDisabled();
  });

  it("shows a connecting state when room is null", () => {
    render(<Feature room={null} config={config} />);
    expect(screen.getByRole("heading", { level: 1, name: "Field Check-in" })).toBeInTheDocument();
    expect(screen.getByText("Joining your check-in room…")).toBeInTheDocument();
  });
});
