import type { AppState, Participant, ProcessResult } from "./types";

export type SidebarView = "home" | "calendario" | "meetings" | "atas" | "recentes" | "acoes" | "settings";

export interface PersistedPillarUiState {
  sidebarView: SidebarView;
  appState: AppState;
  activeTab: string;
  showPanel: boolean;
  result: ProcessResult | null;
  notes: string;
  participants: Participant[];
  emailInput: string;
  meetingContext: string | null;
  ataText: string;
  isAtaConfirmed: boolean;
  currentMeetingId: string | null;
  currentMinutesId: string | null;
  selectedCalendarEventId: string | null;
  selectedMeetingId: number | null;
}

const PILLAR_UI_STATE_STORAGE_KEY = "pillar.ui.state.v1";
const DEFAULT_SIDEBAR_VIEW: SidebarView = "home";
const VALID_SIDEBAR_VIEWS = new Set<SidebarView>([
  "home",
  "calendario",
  "meetings",
  "atas",
  "recentes",
  "acoes",
  "settings",
]);

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "setItem">;

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getStringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function getNullableStringValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function getBooleanValue(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function getMeetingIdValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function sanitizeSidebarView(value: unknown): SidebarView {
  if (typeof value !== "string") {
    return DEFAULT_SIDEBAR_VIEW;
  }

  return VALID_SIDEBAR_VIEWS.has(value as SidebarView) ? (value as SidebarView) : DEFAULT_SIDEBAR_VIEW;
}

function sanitizeParticipants(value: unknown): Participant[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item): Participant[] => {
    if (!isRecord(item)) {
      return [];
    }

    const name = getStringValue(item.name).trim();
    const email = getStringValue(item.email).trim();
    const isOwner = getBooleanValue(item.isOwner);

    if (!email) {
      return [];
    }

    return [{
      name,
      email,
      isOwner,
    }];
  });
}

function sanitizeResult(value: unknown): ProcessResult | null {
  if (!isRecord(value)) {
    return null;
  }

  if (!isRecord(value.transcription) || !isRecord(value.minutes)) {
    return null;
  }

  return value as unknown as ProcessResult;
}

function sanitizeAppState(value: unknown, result: ProcessResult | null): AppState {
  if (value === "finished" && result) {
    return "finished";
  }

  return "idle";
}

export function getInitialPillarUiState(storage?: ReadableStorage | null): PersistedPillarUiState | null {
  const targetStorage = storage ?? getBrowserStorage();

  try {
    const rawState = targetStorage?.getItem(PILLAR_UI_STATE_STORAGE_KEY);
    if (!rawState) {
      return null;
    }

    const parsedState = JSON.parse(rawState) as unknown;
    if (!isRecord(parsedState)) {
      return null;
    }

    const result = sanitizeResult(parsedState.result);
    const appState = sanitizeAppState(parsedState.appState, result);

    return {
      sidebarView: sanitizeSidebarView(parsedState.sidebarView),
      appState,
      activeTab: getStringValue(parsedState.activeTab, "notas"),
      showPanel: appState === "finished" ? getBooleanValue(parsedState.showPanel) : false,
      result,
      notes: getStringValue(parsedState.notes),
      participants: sanitizeParticipants(parsedState.participants),
      emailInput: getStringValue(parsedState.emailInput),
      meetingContext: getNullableStringValue(parsedState.meetingContext),
      ataText: getStringValue(parsedState.ataText),
      isAtaConfirmed: getBooleanValue(parsedState.isAtaConfirmed),
      currentMeetingId: getNullableStringValue(parsedState.currentMeetingId),
      currentMinutesId: getNullableStringValue(parsedState.currentMinutesId),
      selectedCalendarEventId: getNullableStringValue(parsedState.selectedCalendarEventId),
      selectedMeetingId: getMeetingIdValue(parsedState.selectedMeetingId),
    };
  } catch {
    return null;
  }
}

export function persistPillarUiState(state: PersistedPillarUiState, storage?: WritableStorage | null): void {
  const targetStorage = storage ?? getBrowserStorage();

  try {
    targetStorage?.setItem(PILLAR_UI_STATE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore persistence failures to keep the UI responsive.
  }
}
