import { describe, expect, it, vi } from "vitest";
import {
  getInitialPillarUiState,
  persistPillarUiState,
  type PersistedPillarUiState,
} from "../pillarUiStateStorage";

function createStorageMock(initialValue: string | null = null) {
  let value = initialValue;

  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn((_key: string, nextValue: string) => {
      value = nextValue;
    }),
  };
}

function createValidResult() {
  return {
    transcription: {
      text: "Transcrição",
      language: "pt-BR",
      segments: [],
    },
    minutes: {
      title: "Reunião semanal",
      date: "2026-04-04",
      participants: ["breno@exemplo.com"],
      summary: "Resumo",
      topics: [],
      action_items: [],
      decisions: [],
      next_steps: "Próximos passos",
    },
  };
}

describe("pillarUiStateStorage", () => {
  it("returns null when there is no persisted state", () => {
    const storage = createStorageMock(null);

    expect(getInitialPillarUiState(storage)).toBeNull();
  });

  it("restores a finished state when payload is valid", () => {
    const storedState = {
      sidebarView: "acoes",
      appState: "finished",
      activeTab: "transcricao",
      showPanel: true,
      result: createValidResult(),
      notes: "Nota salva",
      participants: [{ name: "Breno", email: "breno@exemplo.com", isOwner: true }],
      emailInput: "time@exemplo.com",
      meetingContext: "Contexto",
      ataText: "Ata",
      isAtaConfirmed: true,
      currentMeetingId: "meeting-1",
      currentMinutesId: "minutes-1",
      selectedCalendarEventId: "event-1",
      selectedMeetingId: 123,
    };
    const storage = createStorageMock(JSON.stringify(storedState));

    const result = getInitialPillarUiState(storage);

    expect(result?.appState).toBe("finished");
    expect(result?.sidebarView).toBe("acoes");
    expect(result?.showPanel).toBe(true);
    expect(result?.selectedMeetingId).toBe(123);
  });

  it("sanitizes invalid payloads and strips transient states", () => {
    const storage = createStorageMock(JSON.stringify({
      sidebarView: "desconhecida",
      appState: "recording",
      activeTab: 10,
      showPanel: true,
      result: null,
      notes: 42,
      participants: [
        { name: "Sem email", email: "", isOwner: false },
        { name: "Participante", email: "part@exemplo.com", isOwner: false },
      ],
      emailInput: false,
      meetingContext: 100,
      ataText: [],
      isAtaConfirmed: "sim",
      currentMeetingId: 12,
      currentMinutesId: {},
      selectedCalendarEventId: [],
      selectedMeetingId: "123",
    }));

    const result = getInitialPillarUiState(storage);

    expect(result).toEqual({
      sidebarView: "home",
      appState: "idle",
      activeTab: "notas",
      showPanel: false,
      result: null,
      notes: "",
      participants: [{ name: "Participante", email: "part@exemplo.com", isOwner: false }],
      emailInput: "",
      meetingContext: null,
      ataText: "",
      isAtaConfirmed: false,
      currentMeetingId: null,
      currentMinutesId: null,
      selectedCalendarEventId: null,
      selectedMeetingId: null,
    });
  });

  it("persists the ui state snapshot", () => {
    const storage = createStorageMock();
    const state: PersistedPillarUiState = {
      sidebarView: "home",
      appState: "idle",
      activeTab: "notas",
      showPanel: false,
      result: null,
      notes: "",
      participants: [],
      emailInput: "",
      meetingContext: null,
      ataText: "",
      isAtaConfirmed: false,
      currentMeetingId: null,
      currentMinutesId: null,
      selectedCalendarEventId: null,
      selectedMeetingId: null,
    };

    persistPillarUiState(state, storage);

    expect(storage.setItem).toHaveBeenCalledTimes(1);
  });
});
