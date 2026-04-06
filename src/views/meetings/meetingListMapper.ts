import type { MeetingListItemResponse } from "../../api/types/swagger";
import type { StoredMeeting } from "../../types";
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

function resolveLocalSortTimestamp(meeting: StoredMeeting): number {
  const minutesDateTimestamp = parseTimestamp(meeting.result.minutes.date);
  if (minutesDateTimestamp > 0) {
    return minutesDateTimestamp;
  }

  const meetingDateTimestamp = parseTimestamp(meeting.date);
  if (meetingDateTimestamp > 0) {
    return meetingDateTimestamp;
  }

  return meeting.id;
}

function mapLocalMeeting(meeting: StoredMeeting): MeetingsListItem {
  return {
    key: `local-${meeting.id}`,
    source: "local",
    meetingId: meeting.result.meeting_id ?? null,
    title: meeting.title,
    date: meeting.date,
    sortTimestamp: resolveLocalSortTimestamp(meeting),
    durationLabel: meeting.duration,
    participantsLabel: String(meeting.participants),
    hasAta: Boolean(meeting.hasAta),
    storedMeeting: meeting,
  };
}

function mapApiMeeting(meeting: MeetingListItemResponse, localSnapshot?: StoredMeeting): MeetingsListItem {
  const dateSource = meeting.scheduledAt || meeting.createdAt;

  return {
    key: meeting.id,
    source: "api",
    meetingId: meeting.id,
    title: meeting.title,
    date: formatMeetingDate(dateSource),
    sortTimestamp: parseTimestamp(dateSource),
    durationLabel: localSnapshot?.duration ?? "-",
    participantsLabel: localSnapshot ? String(localSnapshot.participants) : "-",
    hasAta: localSnapshot?.hasAta ?? (meeting.status === "done"),
    ...(localSnapshot ? { storedMeeting: localSnapshot } : {}),
  };
}

export function buildMeetingsListItems(
  apiMeetings: MeetingListItemResponse[],
  storedMeetings: StoredMeeting[],
): MeetingsListItem[] {
  const storedByMeetingId = new Map<string, StoredMeeting>();
  for (const storedMeeting of storedMeetings) {
    if (!storedMeeting.result.meeting_id) {
      continue;
    }
    storedByMeetingId.set(storedMeeting.result.meeting_id, storedMeeting);
  }

  const apiMeetingIds = new Set(apiMeetings.map((meeting) => meeting.id));

  const mergedApiMeetings = apiMeetings.map((meeting) => mapApiMeeting(meeting, storedByMeetingId.get(meeting.id)));
  const localOnlyMeetings = storedMeetings
    .filter((storedMeeting) => {
      if (!storedMeeting.result.meeting_id) {
        return true;
      }

      return !apiMeetingIds.has(storedMeeting.result.meeting_id);
    })
    .map(mapLocalMeeting);

  return [...mergedApiMeetings, ...localOnlyMeetings].sort((left, right) => right.sortTimestamp - left.sortTimestamp);
}
