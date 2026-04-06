import { describe, expect, it } from "vitest";
import type { MeetingListItemResponse } from "../../api/types/swagger";
import { buildMeetingsListItems } from "../meetings/meetingListMapper";

function createApiMeeting(overrides: Partial<MeetingListItemResponse> = {}): MeetingListItemResponse {
  return {
    id: "m1",
    title: "API meeting",
    status: "done",
    createdAt: "2026-04-06T10:00:00Z",
    updatedAt: "2026-04-06T10:00:00Z",
    ...overrides,
  };
}

describe("buildMeetingsListItems", () => {
  it("maps API meetings with default labels", () => {
    const [item] = buildMeetingsListItems([
      createApiMeeting({
        id: "m1",
        title: "Kickoff API",
        status: "processing",
      }),
    ]);

    expect(item.meetingId).toBe("m1");
    expect(item.title).toBe("Kickoff API");
    expect(item.durationLabel).toBe("-");
    expect(item.participantsLabel).toBe("-");
    expect(item.hasAta).toBe(false);
    expect(item.source).toBe("api");
  });

  it("derives hasAta from API status", () => {
    const items = buildMeetingsListItems([
      createApiMeeting({
        id: "done-meeting",
        status: "done",
        createdAt: "2026-04-05T09:00:00Z",
      }),
      createApiMeeting({
        id: "pending-meeting",
        status: "pending",
        createdAt: "2026-04-04T09:00:00Z",
      }),
    ]);

    expect(items.find((meeting) => meeting.meetingId === "done-meeting")?.hasAta).toBe(true);
    expect(items.find((meeting) => meeting.meetingId === "pending-meeting")?.hasAta).toBe(false);
  });

  it("sorts meetings by the most recent API timestamp", () => {
    const items = buildMeetingsListItems([
      createApiMeeting({
        id: "created-newest",
        createdAt: "2026-04-07T12:00:00Z",
        updatedAt: "2026-04-07T12:00:00Z",
      }),
      createApiMeeting({
        id: "scheduled-middle",
        scheduledAt: "2026-04-06T12:00:00Z",
        createdAt: "2026-04-01T12:00:00Z",
        updatedAt: "2026-04-06T12:00:00Z",
      }),
      createApiMeeting({
        id: "created-oldest",
        createdAt: "2026-04-05T12:00:00Z",
        updatedAt: "2026-04-05T12:00:00Z",
      }),
    ]);

    expect(items.map((item) => item.meetingId)).toEqual([
      "created-newest",
      "scheduled-middle",
      "created-oldest",
    ]);
  });
});
