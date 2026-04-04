import type { Minutes, ProcessResult } from "../../types";
import type {
  MeetingResponse,
  MinutesResponse,
  ParticipantResponse,
  TranscriptionResponse,
} from "../types/swagger";

function formatParticipantLabel(participant: ParticipantResponse): string {
  const name = participant.name?.trim();
  const email = participant.email?.trim();

  if (name && email) {
    if (name.toLowerCase() === email.toLowerCase()) {
      return email;
    }
    return `${name} (${email})`;
  }

  return name || email || "";
}

function resolveResponsibleLabel(
  responsibleId: string | undefined,
  participantsIndex: Map<string, ParticipantResponse>,
): string {
  if (!responsibleId) {
    return "";
  }

  const participant = participantsIndex.get(responsibleId);
  if (!participant) {
    return responsibleId;
  }

  return formatParticipantLabel(participant) || responsibleId;
}

export function mapMinutesResponseToMinutes(
  meeting: Pick<MeetingResponse, "title" | "scheduledAt" | "createdAt">,
  minutes: MinutesResponse,
  meetingParticipants: ParticipantResponse[] = [],
): Minutes {
  const participantsIndex = new Map<string, ParticipantResponse>();
  for (const participant of meetingParticipants) {
    if (participant.id) {
      participantsIndex.set(participant.id, participant);
    }
    if (participant.userId) {
      participantsIndex.set(participant.userId, participant);
    }
  }

  const minutesParticipants = (minutes.content?.participants || [])
    .map((participant) => participant.name || participant.email)
    .filter((participant): participant is string => Boolean(participant));

  const fallbackParticipants = meetingParticipants
    .map((participant) => formatParticipantLabel(participant))
    .filter((participant): participant is string => Boolean(participant));

  return {
    title: minutes.content?.title || meeting.title,
    date: meeting.scheduledAt || meeting.createdAt,
    participants: minutesParticipants.length > 0 ? minutesParticipants : fallbackParticipants,
    summary: minutes.content?.summary || "",
    topics: (minutes.content?.topics || []).map((topic) => ({ title: topic, discussion: "" })),
    action_items: (minutes.content?.actions || []).map((action) => ({
      description: action.description,
      responsible: resolveResponsibleLabel(action.responsible_id, participantsIndex),
      deadline: action.due_date,
    })),
    decisions: [],
    next_steps: "",
  };
}

export function toProcessResultViewModel(
  meeting: MeetingResponse,
  minutes: MinutesResponse,
  transcription: TranscriptionResponse,
): ProcessResult {
  const mappedMinutes = mapMinutesResponseToMinutes(meeting, minutes, meeting.participants);

  return {
    meeting_id: meeting.id,
    minutes_id: minutes.id,
    transcription: {
      text: transcription.transcription,
      language: "unknown",
      segments: [],
    },
    minutes: mappedMinutes,
  };
}
