import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { C } from "./constants/colors";
import { useAppServices } from "./services";
import { isApiError } from "./services/errors";
import { getApiErrorMessage } from "./services/apiErrorMessage";
import { formatMinutesToAta, formatTranscription } from "./utils/formatters";
import { isMissingActionResponsible } from "./utils/actionResponsible";
import { mapMinutesResponseToMinutes, toProcessResultViewModel } from "./api/mappers/meetingMapper";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { HomeView } from "./views/HomeView";
import { MeetingsView } from "./views/MeetingsView";
import { SettingsView } from "./views/SettingsView";
import { CalendarView } from "./views/CalendarView";
import { ActionsView } from "./views/ActionsView";
import { MeetingDetailModal } from "./components/MeetingDetailModal";
import type { AppState, ProcessResult, StoredMeeting, Participant, CalendarMeeting, SessionUser } from "./types";
import type { MeetingResponse, ParticipantResponse, TranscriptionResponse } from "./api/types/swagger";
import {
  getInitialPillarUiState,
  persistPillarUiState,
  type SidebarView,
} from "./pillarUiStateStorage";

const DEFAULT_OWNER: Participant = {
  name: "Breno Moreira",
  email: "breno.moreira@rottasconstrutora.com.br",
  isOwner: true,
};

interface MeetingSnapshot {
  title: string;
  scheduledAt?: string;
  createdAt: string;
  participants: ParticipantResponse[];
}

function formatStoredMeetingDate(isoDate: string): string {
  const parsedDate = Date.parse(isoDate);
  if (Number.isNaN(parsedDate)) {
    return "-";
  }

  return new Date(parsedDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function mapParticipantToLabel(participant: ParticipantResponse): string {
  const name = participant.name?.trim();
  if (name) {
    return name;
  }

  const email = participant.email?.trim();
  if (email) {
    return email;
  }

  return "";
}

function buildFallbackProcessResult(
  meeting: MeetingResponse,
  transcription: TranscriptionResponse,
): ProcessResult {
  return {
    meeting_id: meeting.id,
    minutes_id: null,
    transcription: {
      text: transcription.transcription,
      language: "unknown",
      segments: [],
    },
    minutes: {
      title: meeting.title || "Reunião sem título",
      date: meeting.scheduledAt || meeting.createdAt,
      participants: (meeting.participants || [])
        .map(mapParticipantToLabel)
        .filter((participant): participant is string => Boolean(participant)),
      summary: "",
      topics: [],
      action_items: [],
      decisions: [],
      next_steps: "",
    },
  };
}

export default function PillarAI({ onLogout, user }: { onLogout?: () => void; user?: SessionUser | null }) {
  const {
    users: usersService,
    meetings: meetingsService,
    transcription: transcriptionService,
    minutes: minutesService,
    notes: notesService,
    actions: actionsService,
  } = useAppServices();
  const restoredUiState = useMemo(() => getInitialPillarUiState(), []);
  const [sidebarView, setSidebarView] = useState<SidebarView>(restoredUiState?.sidebarView ?? "home");
  const [appState, setAppState] = useState<AppState>(restoredUiState?.appState ?? "idle");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState(restoredUiState?.activeTab ?? "notas");
  const [notes, setNotes] = useState(restoredUiState?.notes ?? "");
  const [showPanel, setShowPanel] = useState(restoredUiState?.showPanel ?? false);
  const [result, setResult] = useState<ProcessResult | null>(restoredUiState?.result ?? null);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>(() =>
    restoredUiState?.participants.length ? restoredUiState.participants : [DEFAULT_OWNER]
  );
  const [emailInput, setEmailInput] = useState(restoredUiState?.emailInput ?? "");
  const [emailSent, setEmailSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [pastMeetings, setPastMeetings] = useState<StoredMeeting[]>(() => {
    try {
      const stored = localStorage.getItem("pillar_meetings");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [selectedMeeting, setSelectedMeeting] = useState<StoredMeeting | null>(() => {
    const selectedMeetingId = restoredUiState?.selectedMeetingId;
    if (selectedMeetingId === null || selectedMeetingId === undefined) {
      return null;
    }

    return pastMeetings.find((meeting) => meeting.id === selectedMeetingId) ?? null;
  });
  const [calendarMeeting, setCalendarMeeting] = useState<CalendarMeeting | null>(null);
  const [calendarMeetings, setCalendarMeetings] = useState<CalendarMeeting[]>([]);
  const [meetingContext, setMeetingContext] = useState<string | null>(restoredUiState?.meetingContext ?? null);
  const [ataText, setAtaText] = useState(restoredUiState?.ataText ?? "");
  const [isAiRewriting, setIsAiRewriting] = useState(false);
  const [showSystemAudioHint, setShowSystemAudioHint] = useState(false);
  const [isAtaConfirmed, setIsAtaConfirmed] = useState(restoredUiState?.isAtaConfirmed ?? false);
  const [isConfirmingAta, setIsConfirmingAta] = useState(false);
  const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(restoredUiState?.currentMeetingId ?? null);
  const [currentMinutesId, setCurrentMinutesId] = useState<string | null>(restoredUiState?.currentMinutesId ?? null);
  const [currentMeetingSnapshot, setCurrentMeetingSnapshot] = useState<MeetingSnapshot | null>(null);
  const [selectedCalendarEventId, setSelectedCalendarEventId] = useState<string | null>(
    restoredUiState?.selectedCalendarEventId ?? null
  );
  const [actionsRefreshToken, setActionsRefreshToken] = useState(0);
  const pastMeetingsRef = useRef<StoredMeeting[]>(pastMeetings);

  const owner: Participant = useMemo(
    () => user
      ? { name: user.display_name, email: user.email, isOwner: true }
      : DEFAULT_OWNER,
    [user?.email, user?.display_name],
  );

  useEffect(() => {
    pastMeetingsRef.current = pastMeetings;
  }, [pastMeetings]);

  useEffect(() => {
    setParticipants((previousParticipants) => {
      const nonOwnerParticipants = previousParticipants.filter((participant) => {
        const isSameAsOwner = participant.email.toLowerCase() === owner.email.toLowerCase();
        return !participant.isOwner && !isSameAsOwner;
      });

      return [owner, ...nonOwnerParticipants];
    });
  }, [owner]);

  useEffect(() => {
    try {
      localStorage.setItem("pillar_meetings", JSON.stringify(pastMeetings));
    } catch {
      // localStorage cheio ou indisponível — ignorar silenciosamente
    }
  }, [pastMeetings]);

  useEffect(() => {
    persistPillarUiState({
      sidebarView,
      appState: appState === "finished" ? "finished" : "idle",
      activeTab,
      showPanel,
      result,
      notes,
      participants,
      emailInput,
      meetingContext,
      ataText,
      isAtaConfirmed,
      currentMeetingId,
      currentMinutesId,
      selectedCalendarEventId,
      selectedMeetingId: selectedMeeting?.id ?? null,
    });
  }, [
    activeTab,
    appState,
    ataText,
    currentMeetingId,
    currentMinutesId,
    emailInput,
    isAtaConfirmed,
    meetingContext,
    notes,
    participants,
    result,
    selectedCalendarEventId,
    selectedMeeting?.id,
    showPanel,
    sidebarView,
  ]);

  useEffect(() => {
    if (!selectedMeeting) {
      return;
    }

    const updatedMeeting = pastMeetings.find((meeting) => meeting.id === selectedMeeting.id);
    if (!updatedMeeting) {
      setSelectedMeeting(null);
      return;
    }

    if (updatedMeeting !== selectedMeeting) {
      setSelectedMeeting(updatedMeeting);
    }
  }, [pastMeetings, selectedMeeting]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingDurationRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const systemAudioTrackRef = useRef<MediaStreamTrack | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await usersService.getCurrentUser();
      } catch (err) {
        if (!mounted) {
          return;
        }
        if (isApiError(err) && err.status === 401) {
          return;
        }
        setError(getApiErrorMessage(err, "Erro ao sincronizar usuário autenticado."));
      }
    })();

    return () => {
      mounted = false;
    };
  }, [usersService]);

  const applyMeetingMinutesSnapshot = useCallback((
    meetingId: string,
    snapshot: MeetingSnapshot,
    mappedMinutes: ProcessResult["minutes"],
    minutesId: string,
    confirmed: boolean,
  ) => {
    const nextAtaText = formatMinutesToAta(mappedMinutes);

    setCurrentMeetingSnapshot(snapshot);
    setResult((prev) => (prev ? { ...prev, meeting_id: meetingId, minutes_id: minutesId, minutes: mappedMinutes } : prev));
    setCurrentMinutesId(minutesId);
    setAtaText(nextAtaText);
    setIsAtaConfirmed(confirmed);

    setPastMeetings((prev) => {
      const fallbackStoredMeetingId = selectedMeeting?.id ?? prev[0]?.id;
      return prev.map((meeting) => {
        const matchesMeetingId = meeting.result.meeting_id === meetingId;
        const matchesFallback = fallbackStoredMeetingId !== undefined && meeting.id === fallbackStoredMeetingId;

        if (!matchesMeetingId && !matchesFallback) {
          return meeting;
        }

        return {
          ...meeting,
          hasAta: true,
          isConfirmed: confirmed,
          editedAtaText: nextAtaText,
          result: {
            ...meeting.result,
            meeting_id: meetingId,
            minutes_id: minutesId,
            minutes: mappedMinutes,
          },
        };
      });
    });
  }, [selectedMeeting?.id]);

  const refreshMeetingMinutesState = useCallback(async (meetingId: string) => {
    const [meeting, minutes] = await Promise.all([
      meetingsService.getMeetingById(meetingId),
      minutesService.getMeetingMinutes(meetingId),
    ]);

    const snapshot: MeetingSnapshot = {
      title: meeting.title,
      scheduledAt: meeting.scheduledAt,
      createdAt: meeting.createdAt,
      participants: meeting.participants || [],
    };

    const mappedMinutes = mapMinutesResponseToMinutes(
      {
        title: snapshot.title,
        scheduledAt: snapshot.scheduledAt,
        createdAt: snapshot.createdAt,
      },
      minutes,
      snapshot.participants,
    );

    applyMeetingMinutesSnapshot(meeting.id, snapshot, mappedMinutes, minutes.id, minutes.status === "confirmed");

    return { meeting, minutes, mappedMinutes };
  }, [applyMeetingMinutesSnapshot, meetingsService, minutesService]);

  const syncMeetingParticipantsWithServer = useCallback(async (meetingId: string): Promise<MeetingSnapshot> => {
    const meeting = await meetingsService.getMeetingById(meetingId);
    const currentParticipants = meeting.participants || [];
    const localEmailSet = new Set(
      participants
        .map((participant) => participant.email.trim().toLowerCase())
        .filter(Boolean),
    );
    const participantsByEmail = new Map(
      currentParticipants.map((participant) => [participant.email.trim().toLowerCase(), participant]),
    );

    const participantsToAdd = participants
      .map((participant) => participant.email.trim())
      .filter((email) => email.length > 0)
      .filter((email) => !participantsByEmail.has(email.toLowerCase()));

    const participantsToRemove = currentParticipants.filter((participant) => {
      const email = participant.email.trim().toLowerCase();
      return participant.source !== "organizer" && !localEmailSet.has(email);
    });

    for (const email of participantsToAdd) {
      await meetingsService.addMeetingParticipant(meetingId, email);
    }

    for (const participant of participantsToRemove) {
      await meetingsService.removeMeetingParticipant(meetingId, participant.id);
    }

    const refreshedMeeting = participantsToAdd.length > 0 || participantsToRemove.length > 0
      ? await meetingsService.getMeetingById(meetingId)
      : meeting;

    return {
      title: refreshedMeeting.title,
      scheduledAt: refreshedMeeting.scheduledAt,
      createdAt: refreshedMeeting.createdAt,
      participants: refreshedMeeting.participants || [],
    };
  }, [meetingsService, participants]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setResult(null);
      setCurrentMeetingId(null);
      setCurrentMinutesId(null);
      setCurrentMeetingSnapshot(null);
      setIsAtaConfirmed(false);
      setEmailSent(false);
      setSendError(null);

      // 1. Microfone
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = micStream;

      // 2. Áudio do sistema — mostra hint antes do dialog
      setShowSystemAudioHint(true);
      let systemAudioTrack: MediaStreamTrack | null = null;
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        // descarta trilhas de vídeo imediatamente
        displayStream.getVideoTracks().forEach((t) => t.stop());
        systemAudioTrack = displayStream.getAudioTracks()[0] ?? null;
      } catch {
        // usuário cancelou ou browser não suporta — continua com mic apenas
      }
      setShowSystemAudioHint(false);
      systemAudioTrackRef.current = systemAudioTrack;

      // 3. Mix via AudioContext
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;
      const dest = audioCtx.createMediaStreamDestination();

      const micSource = audioCtx.createMediaStreamSource(micStream);
      micSource.connect(dest);

      if (systemAudioTrack) {
        const sysSource = audioCtx.createMediaStreamSource(
          new MediaStream([systemAudioTrack])
        );
        sysSource.connect(dest);
      }

      // 4. Gravar o stream combinado
      const combinedStream = dest.stream;
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: "audio/webm;codecs=opus",
      });
      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start(1000);
      setAppState("recording");
      setStartTime(Date.now());
      setActiveTab("notas");
      setNotes("");
      setTimeout(() => setShowPanel(true), 100);
    } catch {
      setShowSystemAudioHint(false);
      setError("Erro ao acessar microfone. Verifique as permissões.");
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current) return null;
    return new Promise<Blob>((resolve) => {
      mediaRecorderRef.current!.onstop = () => {
        micStreamRef.current?.getTracks().forEach((t) => t.stop());
        systemAudioTrackRef.current?.stop();
        audioContextRef.current?.close();
        micStreamRef.current = null;
        systemAudioTrackRef.current = null;
        audioContextRef.current = null;
        resolve(new Blob(chunksRef.current, { type: "audio/webm" }));
      };
      mediaRecorderRef.current!.stop();
    });
  }, []);

  const waitFor = useCallback(async (ms: number) => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }, []);

  const handleStop = useCallback(async () => {
    if (startTime) recordingDurationRef.current = Date.now() - startTime;
    setAppState("processing");

    const audioBlob = await stopRecording();
    if (!audioBlob) { setAppState("idle"); return; }

    try {
      const createdMeeting = selectedCalendarEventId
        ? await meetingsService.createMeetingFromCalendarEvent(selectedCalendarEventId)
        : await meetingsService.createManualMeeting(
          meetingContext
            ? meetingContext.split("\n").find((line) => line.startsWith("Título"))?.replace("Título da reunião: ", "") || "Reunião sem título"
            : "Reunião sem título",
          new Date().toISOString(),
        );

      setCurrentMeetingId(createdMeeting.id);
      setCurrentMeetingSnapshot({
        title: createdMeeting.title,
        scheduledAt: createdMeeting.scheduledAt,
        createdAt: createdMeeting.createdAt,
        participants: createdMeeting.participants || [],
      });

      await meetingsService.startMeetingRecording(createdMeeting.id);
      await transcriptionService.uploadTranscriptionAudio(createdMeeting.id, audioBlob);

      try {
        await notesService.upsertMeetingNote(createdMeeting.id, notes);
      } catch {
        // Notes persistence should not block transcription/minutes pipeline.
      }

      let meetingStatus = createdMeeting.status;
      let attempts = 0;
      while (meetingStatus !== "done" && attempts < 20) {
        attempts += 1;
        const meeting = await meetingsService.getMeetingById(createdMeeting.id);
        meetingStatus = meeting.status;
        setCurrentMeetingSnapshot({
          title: meeting.title,
          scheduledAt: meeting.scheduledAt,
          createdAt: meeting.createdAt,
          participants: meeting.participants || [],
        });
        if (meetingStatus === "done") break;
        await new Promise((resolve) => setTimeout(resolve, Math.min(1000 * attempts, 8000)));
      }

      if (meetingStatus !== "done") {
        throw new Error("A reunião ainda está sendo processada. Tente novamente em instantes.");
      }

      const getTranscriptionWithRetry = async () => {
        const maxAttempts = 8;
        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
          try {
            return await transcriptionService.getMeetingTranscription(createdMeeting.id);
          } catch (err) {
            if (isApiError(err) && (err.status === 404 || err.status === 409) && attempt < maxAttempts) {
              await waitFor(Math.min(750 * attempt, 4000));
              continue;
            }
            throw err;
          }
        }
        throw new Error("Transcrição ainda não está disponível.");
      };

      const getMinutesWithRetry = async () => {
        const maxAttempts = 12;
        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
          try {
            return await minutesService.getMeetingMinutes(createdMeeting.id);
          } catch (err) {
            if (isApiError(err) && (err.status === 404 || err.status === 409) && attempt < maxAttempts) {
              await waitFor(Math.min(1000 * attempt, 5000));
              continue;
            }
            throw err;
          }
        }
        throw new Error("A minuta ainda está sendo gerada. Tente novamente em instantes.");
      };

      const [transcription, minutes] = await Promise.all([getTranscriptionWithRetry(), getMinutesWithRetry()]);

      const latestMeeting = await meetingsService.getMeetingById(createdMeeting.id);
      const data: ProcessResult = toProcessResultViewModel(latestMeeting, minutes, transcription);

      setResult(data);
      setCurrentMeetingId(data.meeting_id ?? null);
      setCurrentMinutesId(data.minutes_id ?? null);
      setAtaText(formatMinutesToAta(data.minutes));
      setAppState("finished");
      setActiveTab("transcricao");

      const totalSec = Math.floor(recordingDurationRef.current / 1000);
      const durationStr = totalSec >= 3600
        ? `${Math.floor(totalSec / 3600)}h ${Math.floor((totalSec % 3600) / 60)}min`
        : totalSec >= 60 ? `${Math.floor(totalSec / 60)}min` : `${totalSec}s`;

      setPastMeetings((prev) => [{
        id: Date.now(),
        title: data.minutes.title || "Reunião sem título",
        date: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }),
        duration: durationStr,
        participants: data.minutes.participants.length || 1,
        hasAta: true,
        isConfirmed: false,
        result: data,
        notes,
      }, ...prev]);
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro desconhecido"));
      setAppState("idle");
    }
  }, [
    meetingContext,
    meetingsService,
    minutesService,
    notes,
    selectedCalendarEventId,
    startTime,
    stopRecording,
    notesService,
    transcriptionService,
    waitFor,
  ]);

  const handleConfirmAta = useCallback(async () => {
    if (!currentMeetingId || !result || !ataText) return;
    setIsConfirmingAta(true);
    setError(null);
    try {
      await syncMeetingParticipantsWithServer(currentMeetingId);
      await minutesService.confirmMeetingMinutes(currentMeetingId);
      await refreshMeetingMinutesState(currentMeetingId);
      await actionsService.fetchActionsBoard();
      setActionsRefreshToken((prev) => prev + 1);
    } catch (err) {
      if (isApiError(err) && err.status === 409) {
        try {
          await refreshMeetingMinutesState(currentMeetingId);
        } catch {
          // Keep UX resilient even if refresh fails.
        }
      }
      setError(getApiErrorMessage(err, "Erro ao confirmar ata."));
    } finally {
      setIsConfirmingAta(false);
    }
  }, [actionsService, ataText, currentMeetingId, refreshMeetingMinutesState, result, syncMeetingParticipantsWithServer, minutesService]);

  const resetRecording = useCallback(() => {
    setAppState("idle");
    setStartTime(null);
    setShowPanel(false);
    setResult(null);
    setAtaText("");
    setError(null);
    setNotes("");
    setActiveTab("notas");
    setParticipants([owner]);
    setEmailInput("");
    setEmailSent(false);
    setIsSending(false);
    setSendError(null);
    setSelectedMeeting(null);
    setMeetingContext(null);
    setSelectedCalendarEventId(null);
    setCurrentMeetingId(null);
    setCurrentMinutesId(null);
    setCurrentMeetingSnapshot(null);
    setIsAtaConfirmed(false);
    setShowSystemAudioHint(false);
    micStreamRef.current = null;
    systemAudioTrackRef.current = null;
  }, [owner]);

  const clearMeetingContext = useCallback(() => {
    setSelectedMeeting(null);
    setCurrentMeetingId(null);
    setCurrentMinutesId(null);
    setCurrentMeetingSnapshot(null);
    setResult(null);
    setAtaText("");
    setIsAtaConfirmed(false);
    setActiveTab("notas");
    setAppState("idle");
    setShowPanel(false);
  }, []);

  const addParticipant = useCallback(() => {
    const trimmed = emailInput.trim();
    if (!trimmed || !trimmed.includes("@")) return;
    if (participants.some((p) => p.email.toLowerCase() === trimmed.toLowerCase())) return;
    const namePart = trimmed.split("@")[0].replace(/[._-]/g, " ");
    const name = namePart.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    setParticipants((prev) => [...prev, { name, email: trimmed, isOwner: false }]);
    setEmailInput("");
  }, [emailInput, participants]);

  const removeParticipant = useCallback((email: string) => {
    setParticipants((prev) => prev.filter((p) => p.email !== email));
  }, []);

  const handleEmailKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); addParticipant(); }
  }, [addParticipant]);

  const handleSendEmails = useCallback(async () => {
    if (!currentMeetingId || !isAtaConfirmed) return;
    setIsSending(true);
    setSendError(null);
    try {
      await minutesService.distributeMinutesByEmail(currentMeetingId);
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    } catch (err) {
      setSendError(getApiErrorMessage(err, "Erro ao enviar email"));
    } finally {
      setIsSending(false);
    }
  }, [currentMeetingId, isAtaConfirmed, minutesService]);

  const handleAtaChange = useCallback((text: string) => {
    setAtaText(text);
    setPastMeetings((prev) => prev.map((m) => {
      const targetId = selectedMeeting?.id ?? prev[0]?.id;
      return m.id === targetId ? { ...m, editedAtaText: text } : m;
    }));
  }, [selectedMeeting]);

  const handleUpdateActionItems = useCallback(async (actionItems: ProcessResult["minutes"]["action_items"]) => {
    if (!result) {
      return;
    }

    const applyMinutesUpdate = (nextMinutes: ProcessResult["minutes"], nextMinutesId?: string) => {
      const nextAtaText = formatMinutesToAta(nextMinutes);

      setResult((prevResult) => {
        if (!prevResult) {
          return prevResult;
        }
        return {
          ...prevResult,
          minutes: nextMinutes,
          minutes_id: nextMinutesId ?? prevResult.minutes_id,
        };
      });

      if (nextMinutesId) {
        setCurrentMinutesId(nextMinutesId);
      }

      setAtaText(nextAtaText);
      setPastMeetings((prevMeetings) => prevMeetings.map((meeting) => {
        const targetId = selectedMeeting?.id ?? prevMeetings[0]?.id;
        if (meeting.id !== targetId) {
          return meeting;
        }

        return {
          ...meeting,
          editedAtaText: nextAtaText,
          result: {
            ...meeting.result,
            minutes: nextMinutes,
            minutes_id: nextMinutesId ?? meeting.result.minutes_id,
          },
        };
      }));
    };

    const normalizedItems = actionItems.map((item) => ({
      description: item.description.trim(),
      responsible: item.responsible.trim(),
      deadline: item.deadline?.trim() || undefined,
    }));
    const hasActionWithoutResponsible = normalizedItems.some((item) => isMissingActionResponsible(item.responsible));

    // Defensive guard: UI should block this, but keep backend payload safe for any future callers.
    if (hasActionWithoutResponsible) {
      const message = "Atribua um responsável para cada ação antes de salvar.";
      setError(message);
      throw new Error(message);
    }

    if (!currentMeetingId) {
      applyMinutesUpdate({ ...result.minutes, action_items: normalizedItems });
      return;
    }

    setError(null);

    try {
      const actionLines = normalizedItems.map((item, index) => {
        const deadlineLabel = item.deadline || "Sem prazo";
        return `${index + 1}. Responsável: ${item.responsible}; Ação: ${item.description}; Prazo: ${deadlineLabel}.`;
      });

      const instruction = actionLines.length > 0
        ? [
          "Atualize somente a seção \"Ações definidas\" da ata.",
          "Substitua todas as ações atuais pela lista abaixo.",
          ...actionLines,
          "Mantenha resumo, tópicos, decisões e próximos passos sem alterações.",
        ].join("\n")
        : [
          "Atualize somente a seção \"Ações definidas\" da ata.",
          "Remova todas as ações desta seção.",
          "Mantenha resumo, tópicos, decisões e próximos passos sem alterações.",
        ].join("\n");

      const updatedMinutes = await minutesService.editMeetingMinutes(currentMeetingId, instruction);
      let snapshot = currentMeetingSnapshot ?? {
        title: result.minutes.title || "Reunião sem título",
        createdAt: new Date().toISOString(),
        participants: [],
      };

      if (snapshot.participants.length === 0) {
        try {
          const latestMeeting = await meetingsService.getMeetingById(currentMeetingId);
          snapshot = {
            title: latestMeeting.title,
            scheduledAt: latestMeeting.scheduledAt,
            createdAt: latestMeeting.createdAt,
            participants: latestMeeting.participants || [],
          };
          setCurrentMeetingSnapshot(snapshot);
        } catch {
          // If this lookup fails, keep rendering with the best snapshot we already have.
        }
      }

      const mappedMinutes = mapMinutesResponseToMinutes(
        {
          title: snapshot.title,
          createdAt: snapshot.createdAt,
          scheduledAt: snapshot.scheduledAt,
        },
        updatedMinutes,
        snapshot.participants,
      );

      applyMinutesUpdate(mappedMinutes, updatedMinutes.id);
    } catch (err) {
      if (isApiError(err) && err.status === 409) {
        try {
          await refreshMeetingMinutesState(currentMeetingId);
        } catch {
          // Keep UX resilient even if refresh fails.
        }
      }
      const message = getApiErrorMessage(err, "Erro ao salvar alterações das ações.");
      setError(message);
      throw new Error(message);
    }
  }, [currentMeetingId, currentMeetingSnapshot, meetingsService, minutesService, refreshMeetingMinutesState, result, selectedMeeting?.id]);

  const handleNotesChange = useCallback((text: string) => {
    setNotes(text);
    setPastMeetings((prev) => prev.map((m) => {
      const targetId = selectedMeeting?.id ?? prev[0]?.id;
      return m.id === targetId ? { ...m, notes: text } : m;
    }));
  }, [selectedMeeting]);


  const transcriptionText = result ? formatTranscription(result) : "";

  const handleAiRewrite = useCallback(async (instruction: string) => {
    if (!result || !currentMeetingId || isAiRewriting) return;
    setIsAiRewriting(true);
    setError(null);

    try {
      const updatedMinutes = await minutesService.editMeetingMinutes(currentMeetingId, instruction);
      let snapshot = currentMeetingSnapshot ?? {
        title: result.minutes.title || "Reunião sem título",
        createdAt: new Date().toISOString(),
        participants: [],
      };

      if (snapshot.participants.length === 0) {
        try {
          const latestMeeting = await meetingsService.getMeetingById(currentMeetingId);
          snapshot = {
            title: latestMeeting.title,
            scheduledAt: latestMeeting.scheduledAt,
            createdAt: latestMeeting.createdAt,
            participants: latestMeeting.participants || [],
          };
          setCurrentMeetingSnapshot(snapshot);
        } catch {
          // If this lookup fails, keep rendering with the best snapshot we already have.
        }
      }

      const mappedMinutes = mapMinutesResponseToMinutes(
        {
          title: snapshot.title,
          createdAt: snapshot.createdAt,
          scheduledAt: snapshot.scheduledAt,
        },
        updatedMinutes,
        snapshot.participants,
      );

      setResult((prev) => (prev ? { ...prev, minutes: mappedMinutes, minutes_id: updatedMinutes.id } : prev));
      setCurrentMinutesId(updatedMinutes.id);
      handleAtaChange(formatMinutesToAta(mappedMinutes));
    } catch (err) {
      if (isApiError(err) && err.status === 409) {
        try {
          await refreshMeetingMinutesState(currentMeetingId);
        } catch {
          // Keep UX resilient even if refresh fails.
        }
      }
      setError(getApiErrorMessage(err, "Erro ao reescrever a ata"));
    } finally {
      setIsAiRewriting(false);
    }
  }, [currentMeetingId, currentMeetingSnapshot, handleAtaChange, isAiRewriting, meetingsService, minutesService, refreshMeetingMinutesState, result]);

  const viewMeeting = useCallback((meeting: StoredMeeting) => {
    setSelectedMeeting(meeting);
    setResult(meeting.result);
    setAtaText(meeting.editedAtaText ?? formatMinutesToAta(meeting.result.minutes));
    setNotes(meeting.notes ?? "");
    setCurrentMeetingId(meeting.result.meeting_id ?? null);
    setCurrentMinutesId(meeting.result.minutes_id ?? null);
    setCurrentMeetingSnapshot({
      title: meeting.result.minutes.title || meeting.title,
      createdAt: new Date().toISOString(),
      participants: [],
    });
    setIsAtaConfirmed(Boolean(meeting.isConfirmed));
    setSelectedCalendarEventId(null);
    setSidebarView("home");
    setAppState("finished");
    setShowPanel(true);
    setActiveTab("transcricao");
  }, []);

  const openMeetingById = useCallback(async (meetingId: string) => {
    setError(null);
    const existingMeeting = pastMeetingsRef.current.find((meeting) => meeting.result.meeting_id === meetingId);

    try {
      const meeting = await meetingsService.getMeetingById(meetingId);
      const [minutes, transcription] = await Promise.all([
        minutesService.getMeetingMinutes(meetingId).catch((err) => {
          if (isApiError(err) && err.status === 404) {
            return null;
          }
          throw err;
        }),
        transcriptionService.getMeetingTranscription(meetingId).catch((err) => {
          if (isApiError(err) && err.status === 404) {
            return {
              meetingId,
              transcription: "",
            } satisfies TranscriptionResponse;
          }
          throw err;
        }),
      ]);

      const resultFromApi = minutes
        ? toProcessResultViewModel(meeting, minutes, transcription)
        : buildFallbackProcessResult(meeting, transcription);
      const nextStoredMeeting: StoredMeeting = {
        id: existingMeeting?.id ?? Date.now(),
        title: resultFromApi.minutes.title || meeting.title || "Reunião sem título",
        date: formatStoredMeetingDate(meeting.scheduledAt || meeting.createdAt),
        duration: existingMeeting?.duration ?? "-",
        participants: existingMeeting?.participants ?? Math.max(
          meeting.participants?.length || 0,
          resultFromApi.minutes.participants.length || 0,
          1,
        ),
        hasAta: existingMeeting?.hasAta ?? Boolean(minutes),
        isConfirmed: existingMeeting?.isConfirmed ?? minutes?.status === "confirmed",
        result: {
          ...resultFromApi,
          meeting_id: meeting.id,
        },
        editedAtaText: minutes ? formatMinutesToAta(resultFromApi.minutes) : existingMeeting?.editedAtaText,
        notes: existingMeeting?.notes,
      };

      setPastMeetings((previousMeetings) => {
        const existingIndex = previousMeetings.findIndex((stored) => stored.result.meeting_id === meeting.id);
        if (existingIndex === -1) {
          return [nextStoredMeeting, ...previousMeetings];
        }

        return previousMeetings.map((stored, index) => {
          if (index !== existingIndex) {
            return stored;
          }

          return {
            ...stored,
            ...nextStoredMeeting,
            id: stored.id,
          };
        });
      });

      viewMeeting(nextStoredMeeting);
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao abrir reunião."));
    }
  }, [meetingsService, minutesService, transcriptionService, viewMeeting]);

  const goHome = useCallback(() => {
    setSidebarView("home");
    resetRecording();
  }, [resetRecording]);

  const handleStartManual = useCallback(() => {
    setSelectedCalendarEventId(null);
    setMeetingContext(null);
    void startRecording();
  }, [startRecording]);

  const handleStartCalendarMeeting = useCallback((meeting: CalendarMeeting) => {
    const calendarParticipants: Participant[] = [
      owner,
      ...meeting.attendees
        .filter((a) => a.email.toLowerCase() !== owner.email.toLowerCase())
        .map((a) => ({ name: a.name, email: a.email, isOwner: false })),
    ];

    const allNames = [meeting.organizer.name, ...meeting.attendees.map((a) => a.name)]
      .filter((n, i, arr) => n && arr.indexOf(n) === i);
    const context = [
      `Título da reunião: ${meeting.subject}`,
      `Participantes confirmados: ${allNames.join(", ")}`,
      meeting.location ? `Local: ${meeting.location}` : "",
    ].filter(Boolean).join("\n");

    setMeetingContext(context);
    setSelectedCalendarEventId(meeting.id);
    setCalendarMeeting(null);
    setSidebarView("home");
    setParticipants(calendarParticipants);
    void startRecording();
  }, [startRecording, owner]);

  // suppress unused variable warning
  void selectedMeeting;

  return (
    <div style={{
      display: "flex", height: "100vh", width: "100vw",
      background: C.bg,
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      color: C.dark, overflow: "hidden",
    }}>
      <Sidebar
        sidebarView={sidebarView}
        setSidebarView={setSidebarView}
        pastMeetings={pastMeetings}
        onViewMeeting={viewMeeting}
        onReset={resetRecording}
        onClearMeetingContext={clearMeetingContext}
        onLogout={onLogout ?? (() => {})}
        user={user}
      />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header sidebarView={sidebarView} appState={appState} startTime={startTime} />

        <div style={{ flex: 1, overflow: "auto", padding: "32px" }}>
          {sidebarView === "home" && (
            <HomeView
              appState={appState}
              startTime={startTime}
              showPanel={showPanel}
              error={error}
              result={result}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              notes={notes}
              setNotes={handleNotesChange}
              ataText={ataText}
              setAtaText={handleAtaChange}
              transcriptionText={transcriptionText}
              participants={participants}
              isAiRewriting={isAiRewriting}
              showSystemAudioHint={showSystemAudioHint}
              onStart={handleStartManual}
              onStop={handleStop}
              onReset={resetRecording}
              onAiRewrite={handleAiRewrite}
              onUpdateActionItems={handleUpdateActionItems}
              emailInput={emailInput}
              setEmailInput={setEmailInput}
              onAddParticipant={addParticipant}
              onRemoveParticipant={removeParticipant}
              onEmailKeyDown={handleEmailKeyDown}
              onSendEmails={handleSendEmails}
              emailSent={emailSent}
              isSending={isSending}
              sendError={sendError}
              calendarMeetings={calendarMeetings}
              pastMeetings={pastMeetings}
              user={user ?? null}
              hasAta={selectedMeeting?.hasAta ?? false}
              isAtaConfirmed={isAtaConfirmed}
              isConfirmingAta={isConfirmingAta}
              onConfirmAta={handleConfirmAta}
            />
          )}

          {(sidebarView === "meetings" || sidebarView === "atas") && (
            <MeetingsView
              sidebarView={sidebarView}
              onOpenMeetingById={openMeetingById}
              onGoHome={goHome}
            />
          )}

          {sidebarView === "calendario" && (
            <CalendarView
              userEmail={user?.email ?? DEFAULT_OWNER.email}
              onSelectMeeting={setCalendarMeeting}
            />
          )}

          {sidebarView === "acoes" && (
            <ActionsView
              userEmail={user?.email}
              refreshToken={actionsRefreshToken}
            />
          )}

          {sidebarView === "settings" && <SettingsView />}
        </div>
      </main>

      {calendarMeeting && (
        <MeetingDetailModal
          meeting={calendarMeeting}
          onClose={() => setCalendarMeeting(null)}
          onStartMeeting={handleStartCalendarMeeting}
        />
      )}
    </div>
  );
}
