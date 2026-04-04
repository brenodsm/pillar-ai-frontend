import { describe, expect, it, vi } from "vitest";
import * as client from "../../client";
import { fetchActionsBoard, updateActionStatus } from "../actions";

vi.mock("../../client", () => ({ getJson: vi.fn(), patchJson: vi.fn() }));

describe("actions service", () => {
  it("loads assigned and organized lists", async () => {
    vi.mocked(client.getJson)
      .mockResolvedValueOnce({ actions: [], total: 0, limit: 100, offset: 0 })
      .mockResolvedValueOnce({ actions: [], total: 0, limit: 100, offset: 0 });

    await fetchActionsBoard();

    expect(client.getJson).toHaveBeenNthCalledWith(1, "/actions/assigned?limit=100&offset=0");
    expect(client.getJson).toHaveBeenNthCalledWith(2, "/actions/organized?limit=100&offset=0");
  });

  it("patches status route", async () => {
    vi.mocked(client.patchJson).mockResolvedValue({
      id: "a1",
      description: "ok",
      status: "done",
      meetingId: "m1",
      minutesId: "min1",
      createdAt: "2026-04-01T00:00:00Z",
      updatedAt: "2026-04-01T00:00:00Z",
    });

    await updateActionStatus("a1", "done");

    expect(client.patchJson).toHaveBeenCalledWith("/actions/a1/status", { status: "done" });
  });
});
