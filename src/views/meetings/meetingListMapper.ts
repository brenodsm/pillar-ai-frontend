import type { MeetingListItemResponse } from "../../api/types/swagger";
import type { MeetingsListItem } from "./types";

function parseTimestamp(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatMeetingDate(value: string): string {
  const timestamp = parseTimestamp(value);
  if (timestamp === 0) {
    return value;
  }

  return new Date(timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function mapApiMeeting(meeting: MeetingListItemResponse): MeetingsListItem {
  const dateSource = meeting.scheduledAt || meeting.createdAt;

  return {
    key: meeting.id,
    source: "api",
    meetingId: meeting.id,
    title: meeting.title,
    date: formatMeetingDate(dateSource),
    sortTimestamp: parseTimestamp(dateSource),
    durationLabel: "-",
    participantsLabel: "-",
    hasAta: meeting.status === "done",
  };
}

export function buildMeetingsListItems(apiMeetings: MeetingListItemResponse[]): MeetingsListItem[] {
  return apiMeetings
    .map(mapApiMeeting)
    .sort((left, right) => right.sortTimestamp - left.sortTimestamp);
}
