import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { C } from "./constants/colors";
import { useAppServices } from "./services";
import { formatMinutesToAta, formatTranscription } from "./utils/formatters";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { HomeView } from "./views/HomeView";
import { MeetingsView } from "./views/MeetingsView";
import { SettingsView } from "./views/SettingsView";
import { CalendarView } from "./views/CalendarView";
import { ActionsView } from "./views/ActionsView";
import { MeetingDetailModal } from "./components/MeetingDetailModal";
import type { AppState, ProcessResult, StoredMeeting, Participant, CalendarMeeting, SessionUser, PendingAction } from "./types";

const DEFAULT_OWNER: Participant = {
  name: "Breno Moreira",
  email: "breno.moreira@rottasconstrutora.com.br",
  isOwner: true,
};

export default function PillarAI({ onLogout, user }: { onLogout?: () => void; user?: SessionUser | null }) {
  const { meetings: meetingsService, actions: actionsService } = useAppServices();
  const [sidebarView, setSidebarView] = useState("home");
  const [appState, setAppState] = useState<AppState>("idle");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("notas");
  const [notes, setNotes] = useState("");
  const [showPanel, setShowPanel] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([DEFAULT_OWNER]);
  const [emailInput, setEmailInput] = useState("");
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
  const [selectedMeeting, setSelectedMeeting] = useState<StoredMeeting | null>(null);
  const [calendarMeeting, setCalendarMeeting] = useState<CalendarMeeting | null>(null);
  const [calendarMeetings, setCalendarMeetings] = useState<CalendarMeeting[]>([]);
  const [meetingContext, setMeetingContext] = useState<string | null>(null);
  const [ataText, setAtaText] = useState("");
  const [isAiRewriting, setIsAiRewriting] = useState(false);
  const [showSystemAudioHint, setShowSystemAudioHint] = useState(false);
  const [isAtaConfirmed, setIsAtaConfirmed] = useState(false);
  const [isConfirmingAta, setIsConfirmingAta] = useState(false);
  const [pendingActions, setPendingActions] = useState<PendingAction[] | null>(null);
  const [currentMeetingId, setCurrentMeetingId] = useState<string | null>(null);
  const [currentMinutesId, setCurrentMinutesId] = useState<string | null>(null);

  const owner: Participant = useMemo(
    () => user
      ? { name: user.display_name, email: user.email, isOwner: true }
      : DEFAULT_OWNER,
    [user?.email, user?.display_name],
  );

  useEffect(() => {
    setParticipants([owner]);
  }, [user?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      localStorage.setItem("pillar_meetings", JSON.stringify(pastMeetings));
    } catch {
      // localStorage cheio ou indisponível — ignorar silenciosamente
    }
  }, [pastMeetings]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingDurationRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const systemAudioTrackRef = useRef<MediaStreamTrack | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setResult(null);

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

  const handleStop = useCallback(async () => {
    if (startTime) recordingDurationRef.current = Date.now() - startTime;
    setAppState("processing");

    const audioBlob = await stopRecording();
    if (!audioBlob) { setAppState("idle"); return; }

    try {
      const data: ProcessResult = await meetingsService.processMeeting(audioBlob, meetingContext, user?.email);
      setResult(data);
      // Persist meeting/minutes IDs returned by the backend.
      if (data.meeting_id) setCurrentMeetingId(data.meeting_id);
      if (data.minutes_id) setCurrentMinutesId(data.minutes_id);
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
        result: data,
        notes,
      }, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setAppState("idle");
    }
  }, [meetingContext, meetingsService, notes, startTime, stopRecording, user?.email]);

  const handleConfirmAta = useCallback(async () => {
    if (!result || !ataText) return;
    setIsConfirmingAta(true);
    try {
      const items = await meetingsService.extractActions(ataText);
      const newPendingActions: PendingAction[] = [];
      for (const item of items) {
        if (!item.description) continue;
        
        let resolvedEmail = "";
        let rawResp = item.responsible || "";

        if (rawResp) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (emailRegex.test(rawResp)) {
            resolvedEmail = rawResp;
          } else {
            const pMatch = participants.find(p => 
              p.name.toLowerCase().includes(rawResp.toLowerCase()) || 
              rawResp.toLowerCase().includes(p.name.toLowerCase())
            );
            if (pMatch) {
              resolvedEmail = pMatch.email;
            }
          }
        }

        const deadlineText = item.deadline || "";

        newPendingActions.push({
          id: Date.now().toString() + Math.random().toString(),
          title: item.description,
          responsibleEmail: resolvedEmail, 
          rawResponsible: rawResp,
          deadline: deadlineText, // keeps the friendly DD/MM/AAAA for the UI
        });
      }

      setPendingActions(newPendingActions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao extrair ações.");
    } finally {
      setIsConfirmingAta(false);
    }
  }, [ataText, meetingsService, participants, result]);

  const handleApproveActions = useCallback(async (approvedActions: PendingAction[]) => {
    setIsConfirmingAta(true);
    try {
      for (const act of approvedActions) {
        let deadlinePayload: string | undefined = undefined;
        if (act.deadline && act.deadline.includes("/")) {
           const parts = act.deadline.split("/");
           if (parts.length === 3) {
             const day = parts[0].padStart(2, "0");
             const month = parts[1].padStart(2, "0");
             const year = parts[2];
             deadlinePayload = `${year}-${month}-${day}T12:00:00Z`;
           }
        }

        await actionsService.createAction({
          title: act.title,
          description: "",
          priority: "medium",
          action_type: "task",
          responsible_email: act.responsibleEmail || owner.email, // fallback
          deadline: deadlinePayload,
          ...(currentMeetingId ? { meeting_id: currentMeetingId } : {}),
          ...(currentMinutesId ? { minutes_id: currentMinutesId } : {}),
        });
      }

      setPendingActions(null);
      setIsAtaConfirmed(true);
      setPastMeetings((prev) => {
        const cloned = [...prev];
        const targetId = selectedMeeting ? selectedMeeting.id : (cloned.length > 0 ? cloned[0].id : null);
        if (targetId) {
          const idx = cloned.findIndex((m) => m.id === targetId);
          if (idx !== -1) {
            cloned[idx].isConfirmed = true;
            cloned[idx].editedAtaText = ataText;
          }
        }
        return cloned;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar as ações finais.");
    } finally {
      setIsConfirmingAta(false);
    }
  }, [actionsService, ataText, currentMeetingId, currentMinutesId, owner, selectedMeeting]);

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
    setShowSystemAudioHint(false);
    micStreamRef.current = null;
    systemAudioTrackRef.current = null;
  }, [owner]);

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
    if (!result) return;
    setIsSending(true);
    setSendError(null);
    try {
      await meetingsService.sendMinutes({
        meeting_title: result.minutes.title || "Reunião sem título",
        ata_text: ataText,
        participants: participants.map((p) => p.email),
      });
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Erro ao enviar email");
    } finally {
      setIsSending(false);
    }
  }, [ataText, meetingsService, participants, result]);

  const handleAtaChange = useCallback((text: string) => {
    setAtaText(text);
    setPastMeetings((prev) => prev.map((m) => {
      const targetId = selectedMeeting?.id ?? prev[0]?.id;
      return m.id === targetId ? { ...m, editedAtaText: text } : m;
    }));
  }, [selectedMeeting]);

  const handleNotesChange = useCallback((text: string) => {
    setNotes(text);
    setPastMeetings((prev) => prev.map((m) => {
      const targetId = selectedMeeting?.id ?? prev[0]?.id;
      return m.id === targetId ? { ...m, notes: text } : m;
    }));
  }, [selectedMeeting]);

  const transcriptionText = result ? formatTranscription(result) : "";

  const handleAiRewrite = useCallback(async (instruction: string) => {
    if (!result || isAiRewriting) return;
    setIsAiRewriting(true);
    setError(null);

    try {
      const participantNames = meetingContext
        ? participants.map((p) => p.name).join(", ")
        : "";
      const meetingTitle = meetingContext
        ? meetingContext.split("\n").find((l) => l.startsWith("Título"))?.replace("Título da reunião: ", "") ?? ""
        : "";

      const rewrittenAta = await meetingsService.rewriteMeeting({
        current_ata: ataText,
        transcription: transcriptionText,
        notes,
        user_request: instruction,
        participants: participantNames,
        meeting_title: meetingTitle,
      });
      handleAtaChange(rewrittenAta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao reescrever a ata");
    } finally {
      setIsAiRewriting(false);
    }
  }, [ataText, handleAtaChange, isAiRewriting, meetingContext, meetingsService, notes, participants, result, transcriptionText]);

  const viewMeeting = useCallback((meeting: StoredMeeting) => {
    setSelectedMeeting(meeting);
    setResult(meeting.result);
    setAtaText(meeting.editedAtaText ?? formatMinutesToAta(meeting.result.minutes));
    setNotes(meeting.notes ?? "");
    // Restaura os IDs de reunião/ata para que handleApproveActions funcione corretamente.
    setCurrentMeetingId(meeting.result.meeting_id ?? null);
    setCurrentMinutesId(meeting.result.minutes_id ?? null);
    setSidebarView("home");
    setAppState("finished");
    setShowPanel(true);
    setActiveTab("transcricao");
  }, []);

  const goHome = useCallback(() => {
    setSidebarView("home");
    resetRecording();
  }, [resetRecording]);

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
    setCalendarMeeting(null);
    setSidebarView("home");
    setParticipants(calendarParticipants);
    startRecording();
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
              onStart={startRecording}
              onStop={handleStop}
              onReset={resetRecording}
              onAiRewrite={handleAiRewrite}
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
              isAtaConfirmed={isAtaConfirmed}
              isConfirmingAta={isConfirmingAta}
              onConfirmAta={handleConfirmAta}
              pendingActions={pendingActions}
              setPendingActions={setPendingActions}
              onApproveActions={handleApproveActions}
            />
          )}

          {(sidebarView === "meetings" || sidebarView === "atas" || sidebarView === "recentes") && (
            <MeetingsView
              sidebarView={sidebarView}
              pastMeetings={pastMeetings}
              onViewMeeting={viewMeeting}
              onGoHome={goHome}
            />
          )}

          {sidebarView === "calendario" && (
            <CalendarView
              userEmail={user?.email ?? DEFAULT_OWNER.email}
              onSelectMeeting={setCalendarMeeting}
            />
          )}

          {sidebarView === "acoes" && <ActionsView userEmail={user?.email} />}

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
