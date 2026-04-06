import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MeetingListItemResponse } from "../../api/types/swagger";
import { getApiErrorMessage } from "../../services/apiErrorMessage";
import { useAppServices } from "../../services/context";
import type { StoredMeeting } from "../../types";
import { buildMeetingsListItems } from "./meetingListMapper";

export function useMeetingsList(storedMeetings: StoredMeeting[]) {
  const { meetings: meetingsService } = useAppServices();
  const [apiMeetings, setApiMeetings] = useState<MeetingListItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const reload = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setLoading(true);
    setError(null);

    try {
      const meetings = await meetingsService.listMeetings();
      if (requestIdRef.current !== requestId) {
        return;
      }
      setApiMeetings(meetings);
    } catch (err) {
      if (requestIdRef.current !== requestId) {
        return;
      }
      setError(getApiErrorMessage(err, "Não foi possível carregar as reuniões."));
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [meetingsService]);

  useEffect(() => {
    void reload();
    return () => {
      requestIdRef.current += 1;
    };
  }, [reload]);

  const meetings = useMemo(
    () => buildMeetingsListItems(apiMeetings, storedMeetings),
    [apiMeetings, storedMeetings],
  );

  return {
    meetings,
    loading,
    error,
    reload,
  };
}
