import { API_URL } from "../api/config";
import {
  createAction,
  createActionComment,
  fetchActionAttachments,
  fetchActionReminders,
  fetchActions,
  getActionComments,
  getActionHistory,
  updateAction,
} from "../api/services/actions";
import { extractActions, processMeeting, rewriteMeeting, sendMinutes } from "../api/services/meetings";
import { getUserMeetings, resolveUser } from "../api/services/users";
import type { AppServices } from "./contracts";

export function createRestServices(): AppServices {
  return {
    users: {
      resolveUser,
      getUserMeetings,
    },
    meetings: {
      processMeeting,
      rewriteMeeting,
      sendMinutes,
      extractActions,
    },
    actions: {
      fetchActions,
      createAction,
      updateAction,
      getActionComments,
      createActionComment,
      fetchActionAttachments,
      fetchActionReminders,
      getActionHistory,
      setActionStatus: (id, status) => updateAction(id, { status }),
    },
    runtime: {
      apiUrl: API_URL,
    },
  };
}

export const defaultAppServices = createRestServices();
