export interface MeetingsListItem {
  key: string;
  source: "api";
  meetingId: string | null;
  title: string;
  date: string;
  sortTimestamp: number;
  durationLabel: string;
  participantsLabel: string;
  hasAta: boolean;
}
