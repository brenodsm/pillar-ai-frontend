import type { CalendarMeeting } from "../../types";
import type { CalendarEventDateTime, CalendarEventResponse } from "../types/swagger";

function normalizeDateTime(value: CalendarEventDateTime): string {
  const withFractionTrimmed = value.dateTime.replace(/\.\d{7}$/, "");
  if (/[zZ]|[+\-]\d{2}:?\d{2}$/.test(withFractionTrimmed)) {
    return withFractionTrimmed;
  }

  // Graph-like payload uses local datetime + timezone label, keep deterministic parse for current UI.
  return `${withFractionTrimmed}Z`;
}

export function mapCalendarEventToMeeting(event: CalendarEventResponse): CalendarMeeting {
  return {
    id: event.id,
    subject: event.subject,
    location: event.location || "",
    start: normalizeDateTime(event.start),
    end: normalizeDateTime(event.end),
    organizer: {
      name: event.organizer?.name || "",
      email: event.organizer?.email || "",
    },
    attendees: (event.attendees || []).map((attendee) => ({
      name: attendee.name || "",
      email: attendee.email || "",
    })),
  };
}
