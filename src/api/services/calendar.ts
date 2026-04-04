import { getJson } from "../client";
import { API_ROUTES } from "../config";
import { mapCalendarEventToMeeting } from "../mappers/calendarMapper";
import type { CalendarMeeting } from "../../types";
import type { CalendarEventResponse } from "../types/swagger";

function buildEventsQuery(startDateTime: string, endDateTime: string): string {
  return new URLSearchParams({ startDateTime, endDateTime }).toString();
}

export async function getCalendarEvents(startDateTime: string, endDateTime: string): Promise<CalendarMeeting[]> {
  const query = buildEventsQuery(startDateTime, endDateTime);
  const events = await getJson<CalendarEventResponse[]>(`${API_ROUTES.calendar.events}?${query}`);
  return events.map(mapCalendarEventToMeeting);
}
