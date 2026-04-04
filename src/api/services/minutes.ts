import { getJson, patchJson, postJson } from "../client";
import { API_ROUTES } from "../config";
import type { MinutesResponse } from "../types/swagger";

export function getMeetingMinutes(meetingId: string): Promise<MinutesResponse> {
  return getJson<MinutesResponse>(API_ROUTES.minutes.get(meetingId));
}

export function editMeetingMinutes(meetingId: string, instruction: string): Promise<MinutesResponse> {
  return patchJson<MinutesResponse>(API_ROUTES.minutes.edit(meetingId), { instruction });
}

export function confirmMeetingMinutes(meetingId: string): Promise<MinutesResponse> {
  return postJson<MinutesResponse>(API_ROUTES.minutes.confirm(meetingId), {});
}
