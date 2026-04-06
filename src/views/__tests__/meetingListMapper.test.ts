import { describe, expect, it } from "vitest";
import type { MeetingListItemResponse } from "../../api/types/swagger";
import type { StoredMeeting } from "../../types";
import { buildMeetingsListItems } from "../meetings/meetingListMapper";

function createStoredMeeting(overrides: Partial<StoredMeeting> = {}): StoredMeeting {
  return {
    id: 1,
    title: "Reunião local",
    date: "06 de abr. de 2026",
    duration: "43min",
    participants: 2,
    hasAta: true,
    result: {
      meeting_id: "m1",
      minutes_id: "min1",
      transcription: {
        text: "",
        language: "pt-BR",
        segments: [],
      },
      minutes: {
        title: "Reunião local",
        date: "2026-04-06T10:00:00Z",
        participants: ["Ana"],
        summary: "",
        topics: [],
        action_items: [],
        decisions: [],
        next_steps: "",
      },
    },
    ...overrides,
  };
}

function createApiMeeting(overrides: Partial<MeetingListItemResponse> = {}): MeetingListItemResponse {
  return {
    id: "m1",
    title: "Reunião API",
    status: "done",
    createdAt: "2026-04-06T10:00:00Z",
    updatedAt: "2026-04-06T10:00:00Z",
    ...overrides,
  };
}

describe("buildMeetingsListItems", () => {
  it("prefers API as source of truth and reuses local metadata when meeting_id matches", () => {
    const local = createStoredMeeting({
      duration: "1h 05min",
      participants: 4,
      hasAta: true,
      result: {
        ...createStoredMeeting().result,
        meeting_id: "m1",
      },
    });

    const [item] = buildMeetingsListItems([createApiMeeting({ id: "m1", title: "Kickoff API" })], [local]);

    expect(item.meetingId).toBe("m1");
    expect(item.title).toBe("Kickoff API");
    expect(item.durationLabel).toBe("1h 05min");
    expect(item.participantsLabel).toBe("4");
    expect(item.hasAta).toBe(true);
    expect(item.storedMeeting).toBe(local);
  });

  it("includes local-only meetings that are not linked to API ids", () => {
    const localOnly = createStoredMeeting({
      id: 99,
      title: "Offline",
      result: {
        ...createStoredMeeting().result,
        meeting_id: null,
      },
    });

    const items = buildMeetingsListItems([], [localOnly]);

    expect(items).toHaveLength(1);
    expect(items[0].source).toBe("local");
    expect(items[0].title).toBe("Offline");
    expect(items[0].storedMeeting).toBe(localOnly);
  });

  it("derives hasAta from API status when no local snapshot exists", () => {
    const [item] = buildMeetingsListItems([
      createApiMeeting({
        id: "m2",
        status: "done",
        createdAt: "2026-04-05T09:00:00Z",
      }),
    ], []);

    expect(item.meetingId).toBe("m2");
    expect(item.hasAta).toBe(true);
    expect(item.durationLabel).toBe("-");
    expect(item.participantsLabel).toBe("-");
    expect(item.source).toBe("api");
  });
});
