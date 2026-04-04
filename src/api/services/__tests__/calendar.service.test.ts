import { describe, expect, it, vi } from "vitest";
import * as client from "../../client";
import { getCalendarEvents } from "../calendar";

vi.mock("../../client", () => ({ getJson: vi.fn() }));

describe("getCalendarEvents", () => {
  it("calls calendar/events with range query", async () => {
    vi.mocked(client.getJson).mockResolvedValue([]);

    await getCalendarEvents("2026-04-01T00:00:00Z", "2026-04-30T00:00:00Z");

    expect(vi.mocked(client.getJson).mock.calls[0][0]).toContain("/calendar/events?");
    expect(vi.mocked(client.getJson).mock.calls[0][0]).toContain("startDateTime=");
    expect(vi.mocked(client.getJson).mock.calls[0][0]).toContain("endDateTime=");
  });
});
