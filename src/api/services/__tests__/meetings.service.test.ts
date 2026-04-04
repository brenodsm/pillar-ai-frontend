import { describe, expect, it, vi } from "vitest";
import * as client from "../../client";
import { createMeetingFromCalendarEvent, getMeetingById, startMeetingRecording } from "../meetings";

vi.mock("../../client", () => ({ getJson: vi.fn(), postJson: vi.fn(), patchJson: vi.fn(), deleteJson: vi.fn() }));

describe("meetings service", () => {
  it("creates meeting with calendarEventId payload", async () => {
    vi.mocked(client.postJson).mockResolvedValue({ id: "m1" });

    await createMeetingFromCalendarEvent("ev1");

    expect(client.postJson).toHaveBeenCalledWith("/meetings", { calendarEventId: "ev1" });
  });

  it("starts recording route", async () => {
    vi.mocked(client.postJson).mockResolvedValue({ id: "m1", status: "recording" });

    await startMeetingRecording("m1");

    expect(client.postJson).toHaveBeenCalledWith("/meetings/m1/recording/start", {});
  });

  it("loads meeting details", async () => {
    vi.mocked(client.getJson).mockResolvedValue({ id: "m1", title: "R", status: "pending" });

    await getMeetingById("m1");

    expect(client.getJson).toHaveBeenCalledWith("/meetings/m1");
  });
});
