import { postJson } from "../client";
import { API_ROUTES } from "../config";
import type { DistributionResponse } from "../types/swagger";

export function distributeMinutesByEmail(meetingId: string): Promise<DistributionResponse> {
  return postJson<DistributionResponse>(API_ROUTES.minutes.distribute(meetingId), {});
}
