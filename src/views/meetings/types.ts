import type { StoredMeeting } from "../../types";

export interface MeetingsListItem {
  key: string;
  source: "api" | "local";
  meetingId: string | null;
  title: string;
  date: string;
  sortTimestamp: number;
  durationLabel: string;
  participantsLabel: string;
  hasAta: boolean;
  storedMeeting?: StoredMeeting;
}
