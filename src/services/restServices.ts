import { API_URL } from "../api/config";
import { fetchActionsBoard, updateActionStatus } from "../api/services/actions";
import { getCalendarEvents } from "../api/services/calendar";
import { distributeMinutesByEmail } from "../api/services/distribution";
import {
  addMeetingParticipant,
  createManualMeeting,
  createMeetingFromCalendarEvent,
  getMeetingById,
  listMeetings,
  removeMeetingParticipant,
  startMeetingRecording,
  updateMeetingTitle,
} from "../api/services/meetings";
import { confirmMeetingMinutes, editMeetingMinutes, getMeetingMinutes } from "../api/services/minutes";
import { getMeetingNote, upsertMeetingNote } from "../api/services/notes";
import { getMeetingTranscription, uploadTranscriptionAudio } from "../api/services/transcription";
import { getCurrentUser } from "../api/services/users";
import type { AppServices } from "./contracts";

export function createRestServices(): AppServices {
  return {
    users: {
      getCurrentUser,
      getCalendarEvents,
    },
    meetings: {
      listMeetings,
      createMeetingFromCalendarEvent,
      createManualMeeting,
      getMeetingById,
      updateMeetingTitle,
      addMeetingParticipant,
      removeMeetingParticipant,
      startMeetingRecording,
    },
    transcription: {
      uploadTranscriptionAudio,
      getMeetingTranscription,
    },
    minutes: {
      getMeetingMinutes,
      editMeetingMinutes,
      confirmMeetingMinutes,
      distributeMinutesByEmail,
    },
    notes: {
      getMeetingNote,
      upsertMeetingNote,
    },
    actions: {
      fetchActionsBoard,
      updateActionStatus,
    },
    runtime: {
      apiUrl: API_URL,
    },
  };
}

export const defaultAppServices = createRestServices();
