import { describe, expect, it } from "vitest";
import { mapCalendarEventToMeeting } from "../calendarMapper";

describe("mapCalendarEventToMeeting", () => {
  it("maps calendar event preserving ids and attendees", () => {
    const meeting = mapCalendarEventToMeeting({
      id: "ev1",
      subject: "Sprint Review",
      location: "Sala 3",
      start: { dateTime: "2026-04-05T09:00:00.0000000", timeZone: "E. South America Standard Time" },
      end: { dateTime: "2026-04-05T10:00:00.0000000", timeZone: "E. South America Standard Time" },
      organizer: { name: "Joao", email: "joao@empresa.com" },
      attendees: [{ name: "Maria", email: "maria@empresa.com", status: "accepted", type: "required" }],
      isOnlineMeeting: true,
      joinUrl: "https://teams.example",
    });

    expect(meeting.id).toBe("ev1");
    expect(meeting.attendees[0].email).toBe("maria@empresa.com");
    expect(meeting.start).toContain("2026-04-05T09:00:00");
  });
});
