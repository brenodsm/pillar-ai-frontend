import { getJson, postJson } from "../client";
import { API_ROUTES } from "../config";
import type { CalendarMeeting, SessionUser } from "../../types";

export function resolveUser(email: string): Promise<SessionUser> {
  return postJson<SessionUser>(API_ROUTES.users.resolve, { email });
}

export function getUserMeetings(email: string): Promise<CalendarMeeting[]> {
  return getJson<CalendarMeeting[]>(API_ROUTES.users.meetings(email));
}