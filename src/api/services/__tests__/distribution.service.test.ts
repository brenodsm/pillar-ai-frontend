import { describe, expect, it, vi } from "vitest";
import * as client from "../../client";
import { distributeMinutesByEmail } from "../distribution";

vi.mock("../../client", () => ({ postJson: vi.fn() }));

describe("distribution service", () => {
  it("calls distribute endpoint", async () => {
    vi.mocked(client.postJson).mockResolvedValue({ id: "d1", status: "sent" });

    await distributeMinutesByEmail("m1");

    expect(client.postJson).toHaveBeenCalledWith("/meetings/m1/minutes/distribute", {});
  });
});
