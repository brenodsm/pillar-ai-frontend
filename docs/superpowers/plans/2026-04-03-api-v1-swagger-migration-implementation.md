# API v1 Swagger Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar o frontend para usar somente endpoints do Swagger `/api/v1`, mantendo a UX atual e garantindo 100% dos fluxos suportados no contrato.

**Architecture:** A implementacao sera feita com camada de adaptacao: novos services + mappers Swagger -> UI atual. A migracao sera incremental por dominio (auth/me, calendario, acoes, reuniao/transcricao/ata/notas/distribuicao), removendo UI de funcionalidades sem endpoint no Swagger.

**Tech Stack:** React 18, TypeScript, Fetch API, Supabase Auth, Vite, Vitest, Testing Library.

---

## File Structure (locked before tasks)

### API contract and transport

- Modify: `src/api/config.ts` (catalogo de rotas Swagger)
- Modify: `src/api/client.ts` (helpers de request/erro para status e headers)
- Create: `src/api/types/swagger.ts` (DTOs do contrato usados no frontend)

### Mapping layer

- Create: `src/api/mappers/userMapper.ts`
- Create: `src/api/mappers/calendarMapper.ts`
- Create: `src/api/mappers/actionMapper.ts`
- Create: `src/api/mappers/meetingMapper.ts`

### Service layer

- Modify: `src/api/services/users.ts`
- Create: `src/api/services/calendar.ts`
- Modify: `src/api/services/actions.ts`
- Modify: `src/api/services/meetings.ts`
- Create: `src/api/services/minutes.ts`
- Create: `src/api/services/notes.ts`
- Create: `src/api/services/transcription.ts`
- Create: `src/api/services/distribution.ts`

### App contracts and UI integration

- Modify: `src/services/contracts.ts`
- Modify: `src/services/restServices.ts`
- Modify: `src/domain/actions.ts`
- Modify: `src/types/api.ts`
- Modify: `src/types/index.ts`
- Modify: `src/PillarAI.tsx`
- Modify: `src/views/CalendarView.tsx`
- Modify: `src/views/CalendarMeetingsView.tsx`
- Modify: `src/views/ActionsView.tsx`
- Modify: `src/components/ActionDetailModal.tsx`
- Modify: `src/components/TabsPanel.tsx`
- Modify: `src/components/ParticipantsPanel.tsx`
- Modify: `src/views/HomeView.tsx`

### Test infra and tests

- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/api/mappers/__tests__/userMapper.test.ts`
- Create: `src/api/mappers/__tests__/calendarMapper.test.ts`
- Create: `src/api/mappers/__tests__/actionMapper.test.ts`
- Create: `src/api/mappers/__tests__/meetingMapper.test.ts`
- Create: `src/api/services/__tests__/users.service.test.ts`
- Create: `src/api/services/__tests__/calendar.service.test.ts`
- Create: `src/api/services/__tests__/actions.service.test.ts`
- Create: `src/api/services/__tests__/meetings.service.test.ts`
- Create: `src/api/services/__tests__/minutes.service.test.ts`
- Create: `src/api/services/__tests__/notes.service.test.ts`
- Create: `src/api/services/__tests__/transcription.service.test.ts`
- Create: `src/api/services/__tests__/distribution.service.test.ts`

---

### Task 1: Add test harness (Vitest + RTL) and prove it works

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/api/mappers/__tests__/harness.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/api/mappers/__tests__/harness.test.ts
import { describe, expect, it } from "vitest";

describe("test harness", () => {
  it("runs vitest in this repo", () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/api/mappers/__tests__/harness.test.ts`  
Expected: FAIL with `Missing script: "test"` (or command error equivalent).

- [ ] **Step 3: Write minimal implementation**

```json
// package.json (scripts/devDependencies excerpt)
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "start": "node server.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.0.1",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "jsdom": "^25.0.1",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.14",
    "typescript": "^5.6.3",
    "vite": "^7.3.1",
    "vitest": "^2.1.8"
  }
}
```

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    coverage: {
      reporter: ["text", "html"],
    },
  },
});
```

```ts
// src/test/setup.ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm install && npm run test -- src/api/mappers/__tests__/harness.test.ts`  
Expected: PASS (`1 passed`).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/test/setup.ts src/api/mappers/__tests__/harness.test.ts
git commit -m "test: add vitest harness for api migration"
```

### Task 2: Replace route catalog and add Swagger DTOs

**Files:**
- Modify: `src/api/config.ts`
- Create: `src/api/types/swagger.ts`
- Create: `src/api/services/__tests__/routes.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/api/services/__tests__/routes.test.ts
import { describe, expect, it } from "vitest";
import { API_ROUTES } from "../../config";

describe("API_ROUTES swagger v1", () => {
  it("exposes calendar/events route", () => {
    expect(API_ROUTES.calendar.events).toBe("/calendar/events");
  });

  it("exposes minutes confirmation route", () => {
    expect(API_ROUTES.minutes.confirm("m1")).toBe("/meetings/m1/minutes/confirm");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/api/services/__tests__/routes.test.ts`  
Expected: FAIL because `API_ROUTES.calendar` and/or `API_ROUTES.minutes` does not exist.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/api/config.ts (API_ROUTES excerpt)
export const API_ROUTES = {
  users: {
    me: "/me",
  },
  calendar: {
    events: "/calendar/events",
  },
  meetings: {
    list: "/meetings",
    create: "/meetings",
    get: (id: string) => `/meetings/${id}`,
    updateTitle: (id: string) => `/meetings/${id}`,
    startRecording: (id: string) => `/meetings/${id}/recording/start`,
    addParticipant: (id: string) => `/meetings/${id}/participants`,
    removeParticipant: (id: string, participantId: string) => `/meetings/${id}/participants/${participantId}`,
  },
  transcription: {
    upload: (id: string) => `/meetings/${id}/transcription`,
    get: (id: string) => `/meetings/${id}/transcription`,
  },
  minutes: {
    get: (id: string) => `/meetings/${id}/minutes`,
    edit: (id: string) => `/meetings/${id}/minutes`,
    confirm: (id: string) => `/meetings/${id}/minutes/confirm`,
    distribute: (id: string) => `/meetings/${id}/minutes/distribute`,
  },
  notes: {
    get: (id: string) => `/meetings/${id}/notes`,
    upsert: (id: string) => `/meetings/${id}/notes`,
  },
  actions: {
    assigned: "/actions/assigned",
    organized: "/actions/organized",
    updateStatus: (id: string) => `/actions/${id}/status`,
  },
} as const;
```

```ts
// src/api/types/swagger.ts (excerpt)
export interface ApiSuccess<T> {
  status: "success";
  data: T;
}

export interface ApiErrorPayload {
  status: "error";
  error: string;
  details?: unknown;
}

export interface MeResponse {
  id: string;
  email: string;
  name: string;
  azure_id: string;
}

export interface CalendarEventDateTime {
  dateTime: string;
  timeZone: string;
}

export interface CalendarEventResponse {
  id: string;
  subject: string;
  location: string;
  start: CalendarEventDateTime;
  end: CalendarEventDateTime;
  organizer: { name: string; email: string };
  attendees: Array<{ name: string; email: string; status: string; type: string }>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/api/services/__tests__/routes.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/config.ts src/api/types/swagger.ts src/api/services/__tests__/routes.test.ts
git commit -m "feat(api): add swagger v1 route catalog and dto types"
```

### Task 3: Implement mappers (user/calendar/actions/meeting) with unit tests

**Files:**
- Create: `src/api/mappers/userMapper.ts`
- Create: `src/api/mappers/calendarMapper.ts`
- Create: `src/api/mappers/actionMapper.ts`
- Create: `src/api/mappers/meetingMapper.ts`
- Create: `src/api/mappers/__tests__/userMapper.test.ts`
- Create: `src/api/mappers/__tests__/calendarMapper.test.ts`
- Create: `src/api/mappers/__tests__/actionMapper.test.ts`
- Create: `src/api/mappers/__tests__/meetingMapper.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/api/mappers/__tests__/userMapper.test.ts
import { describe, expect, it } from "vitest";
import { mapMeToSessionUser } from "../userMapper";

describe("mapMeToSessionUser", () => {
  it("maps swagger me payload to SessionUser", () => {
    const result = mapMeToSessionUser({
      id: "u1",
      email: "alice@example.com",
      name: "Alice Silva",
      azure_id: "az-1",
    });

    expect(result).toEqual({
      email: "alice@example.com",
      display_name: "Alice Silva",
    });
  });
});
```

```ts
// src/api/mappers/__tests__/calendarMapper.test.ts
import { describe, expect, it } from "vitest";
import { mapCalendarEventToMeeting } from "../calendarMapper";

describe("mapCalendarEventToMeeting", () => {
  it("maps calendar event preserving meeting ids and attendees", () => {
    const meeting = mapCalendarEventToMeeting({
      id: "ev1",
      subject: "Sprint Review",
      location: "Sala 3",
      start: { dateTime: "2026-04-05T09:00:00.0000000", timeZone: "E. South America Standard Time" },
      end: { dateTime: "2026-04-05T10:00:00.0000000", timeZone: "E. South America Standard Time" },
      organizer: { name: "Joao", email: "joao@empresa.com" },
      attendees: [{ name: "Maria", email: "maria@empresa.com", status: "accepted", type: "required" }],
      isOnlineMeeting: true,
      joinUrl: "https://teams.example",
    });

    expect(meeting.id).toBe("ev1");
    expect(meeting.attendees[0].email).toBe("maria@empresa.com");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:  
`npm run test -- src/api/mappers/__tests__/userMapper.test.ts src/api/mappers/__tests__/calendarMapper.test.ts src/api/mappers/__tests__/actionMapper.test.ts src/api/mappers/__tests__/meetingMapper.test.ts`  
Expected: FAIL with module-not-found for mapper files.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/api/mappers/userMapper.ts
import type { SessionUser } from "../../types";
import type { MeResponse } from "../types/swagger";

export function mapMeToSessionUser(payload: MeResponse): SessionUser {
  return {
    email: payload.email,
    display_name: payload.name,
  };
}
```

```ts
// src/api/mappers/calendarMapper.ts (core function)
import type { CalendarMeeting } from "../../types";
import type { CalendarEventResponse } from "../types/swagger";

function toIsoWithTimezone(value: { dateTime: string; timeZone: string }): string {
  // Contract returns local datetime + timezone name; keep raw datetime normalized for current UI.
  return `${value.dateTime}Z`.replace(".0000000Z", "Z");
}

export function mapCalendarEventToMeeting(event: CalendarEventResponse): CalendarMeeting {
  return {
    id: event.id,
    subject: event.subject,
    location: event.location || "",
    start: toIsoWithTimezone(event.start),
    end: toIsoWithTimezone(event.end),
    organizer: event.organizer,
    attendees: event.attendees.map((a) => ({ name: a.name, email: a.email })),
  };
}
```

```ts
// src/api/mappers/actionMapper.ts (core function)
import type { Action } from "../../domain/actions";
import type { ActionResponse } from "../types/swagger";

export function fromSwaggerAction(action: ActionResponse): Action {
  return {
    id: action.id,
    title: action.description,
    description: action.description,
    deadline: action.dueDate ?? null,
    status: action.status,
    effective_status: action.status,
    progress: action.status === "done" ? 100 : action.status === "in_progress" ? 50 : 0,
    priority: "medium",
    category: "meeting",
    action_type: "task",
    meeting_id: action.meetingId ?? null,
    meeting_date: null,
    meeting_title: action.meeting?.title ?? null,
    parent_id: null,
    responsible_email: action.responsible?.email ?? "",
    participant_emails: [],
    reminders: [],
    created_by: action.responsible?.email ?? "",
    created_at: action.createdAt,
    updated_at: action.updatedAt,
  };
}
```

```ts
// src/api/mappers/meetingMapper.ts (core helper)
import type { Minutes, ProcessResult } from "../../types";
import type { MinutesResponse, TranscriptionResponse, MeetingResponse } from "../types/swagger";

export function toProcessResultViewModel(
  meeting: MeetingResponse,
  minutes: MinutesResponse,
  transcription: TranscriptionResponse,
): ProcessResult {
  const mappedMinutes: Minutes = {
    title: minutes.content.title || meeting.title,
    date: meeting.scheduledAt || meeting.createdAt,
    participants: (minutes.content.participants || []).map((p) => p.name || p.email),
    summary: minutes.content.summary || "",
    topics: (minutes.content.topics || []).map((topic) => ({ title: topic, discussion: "" })),
    action_items: (minutes.content.actions || []).map((a) => ({
      description: a.description,
      responsible: a.responsible_id || "",
      deadline: a.due_date,
    })),
    decisions: [],
    next_steps: "",
  };

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
```

- [ ] **Step 4: Run test to verify it passes**

Run:  
`npm run test -- src/api/mappers/__tests__/userMapper.test.ts src/api/mappers/__tests__/calendarMapper.test.ts src/api/mappers/__tests__/actionMapper.test.ts src/api/mappers/__tests__/meetingMapper.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/mappers src/api/types/swagger.ts
git commit -m "feat(api): add swagger mappers for user calendar actions and meetings"
```

### Task 4: Migrate user + calendar services and wire calendar views

**Files:**
- Modify: `src/api/services/users.ts`
- Create: `src/api/services/calendar.ts`
- Modify: `src/services/contracts.ts`
- Modify: `src/services/restServices.ts`
- Modify: `src/views/CalendarView.tsx`
- Modify: `src/views/CalendarMeetingsView.tsx`
- Create: `src/api/services/__tests__/users.service.test.ts`
- Create: `src/api/services/__tests__/calendar.service.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/api/services/__tests__/users.service.test.ts
import { describe, expect, it, vi } from "vitest";
import * as client from "../../client";
import { getCurrentUser } from "../users";

vi.mock("../../client", () => ({ getJson: vi.fn() }));

describe("getCurrentUser", () => {
  it("calls /me and maps payload", async () => {
    vi.mocked(client.getJson).mockResolvedValue({
      id: "u1",
      email: "u@x.com",
      name: "User Name",
      azure_id: "az",
    });

    const user = await getCurrentUser();
    expect(client.getJson).toHaveBeenCalledWith("/me");
    expect(user.display_name).toBe("User Name");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/api/services/__tests__/users.service.test.ts src/api/services/__tests__/calendar.service.test.ts`  
Expected: FAIL because `getCurrentUser` and `calendar service` are not implemented.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/api/services/users.ts
import { getJson } from "../client";
import { API_ROUTES } from "../config";
import { mapMeToSessionUser } from "../mappers/userMapper";
import type { MeResponse } from "../types/swagger";
import type { SessionUser } from "../../types";

export async function getCurrentUser(): Promise<SessionUser> {
  const data = await getJson<MeResponse>(API_ROUTES.users.me);
  return mapMeToSessionUser(data);
}
```

```ts
// src/api/services/calendar.ts
import { getJson } from "../client";
import { API_ROUTES } from "../config";
import { mapCalendarEventToMeeting } from "../mappers/calendarMapper";
import type { CalendarMeeting } from "../../types";
import type { CalendarEventResponse } from "../types/swagger";

export async function getCalendarEvents(startDateTime: string, endDateTime: string): Promise<CalendarMeeting[]> {
  const query = new URLSearchParams({ startDateTime, endDateTime }).toString();
  const events = await getJson<CalendarEventResponse[]>(`${API_ROUTES.calendar.events}?${query}`);
  return events.map(mapCalendarEventToMeeting);
}
```

```ts
// src/services/contracts.ts (users excerpt)
export interface UsersService {
  getCurrentUser(): Promise<SessionUser>;
  getCalendarEvents(startDateTime: string, endDateTime: string): Promise<CalendarMeeting[]>;
}
```

```ts
// src/services/restServices.ts (users excerpt)
import { getCurrentUser } from "../api/services/users";
import { getCalendarEvents } from "../api/services/calendar";

users: {
  getCurrentUser,
  getCalendarEvents,
},
```

```ts
// src/views/CalendarView.tsx (fetch excerpt)
const startDateTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
const endDateTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
const meetingsList = await usersService.getCalendarEvents(startDateTime, endDateTime);
```

- [ ] **Step 4: Run test to verify it passes**

Run:  
`npm run test -- src/api/services/__tests__/users.service.test.ts src/api/services/__tests__/calendar.service.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/services/users.ts src/api/services/calendar.ts src/services/contracts.ts src/services/restServices.ts src/views/CalendarView.tsx src/views/CalendarMeetingsView.tsx src/api/services/__tests__/users.service.test.ts src/api/services/__tests__/calendar.service.test.ts
git commit -m "feat(calendar): migrate user and calendar services to swagger routes"
```

### Task 5: Migrate actions list/update-status and remove unsupported action tabs

**Files:**
- Modify: `src/domain/actions.ts`
- Modify: `src/api/services/actions.ts`
- Modify: `src/services/contracts.ts`
- Modify: `src/services/restServices.ts`
- Modify: `src/views/ActionsView.tsx`
- Modify: `src/components/ActionDetailModal.tsx`
- Create: `src/api/services/__tests__/actions.service.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/api/services/__tests__/actions.service.test.ts
import { describe, expect, it, vi } from "vitest";
import * as client from "../../client";
import { fetchActionsBoard, updateActionStatus } from "../actions";

vi.mock("../../client", () => ({ getJson: vi.fn(), patchJson: vi.fn() }));

describe("actions service", () => {
  it("loads assigned and organized lists", async () => {
    vi.mocked(client.getJson).mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    await fetchActionsBoard();
    expect(client.getJson).toHaveBeenNthCalledWith(1, "/actions/assigned?limit=100&offset=0");
    expect(client.getJson).toHaveBeenNthCalledWith(2, "/actions/organized?limit=100&offset=0");
  });

  it("patches status route", async () => {
    vi.mocked(client.patchJson).mockResolvedValue({ status: "success", data: {} });
    await updateActionStatus("a1", "done");
    expect(client.patchJson).toHaveBeenCalledWith("/actions/a1/status", { status: "done" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/api/services/__tests__/actions.service.test.ts`  
Expected: FAIL because `fetchActionsBoard`/`updateActionStatus` do not exist.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/domain/actions.ts (status)
export type ActionStatus = "pending" | "in_progress" | "done";
```

```ts
// src/api/services/actions.ts (core)
import { getJson, patchJson } from "../client";
import { API_ROUTES } from "../config";
import { fromSwaggerAction } from "../mappers/actionMapper";
import type { ActionStatus, Action } from "../../domain/actions";
import type { ActionResponse } from "../types/swagger";

function buildQuery(limit = 100, offset = 0): string {
  return `?limit=${limit}&offset=${offset}`;
}

export async function fetchActionsBoard(): Promise<Action[]> {
  const assigned = await getJson<ActionResponse[]>(`${API_ROUTES.actions.assigned}${buildQuery()}`);
  const organized = await getJson<ActionResponse[]>(`${API_ROUTES.actions.organized}${buildQuery()}`);
  const merged = [...assigned, ...organized];
  const byId = new Map<string, ActionResponse>();
  for (const item of merged) byId.set(item.id, item);
  return Array.from(byId.values()).map(fromSwaggerAction);
}

export async function updateActionStatus(id: string, status: ActionStatus): Promise<Action> {
  const updated = await patchJson<ActionResponse>(API_ROUTES.actions.updateStatus(id), { status });
  return fromSwaggerAction(updated);
}
```

```tsx
// src/components/ActionDetailModal.tsx (tabs)
type TabId = "detalhes";
const TABS: { id: TabId; label: string }[] = [{ id: "detalhes", label: "Detalhes" }];
```

```tsx
// src/views/ActionsView.tsx (service usage excerpt)
const data = await actionsService.fetchActionsBoard();
await actionsService.updateActionStatus(id, newStatus);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/api/services/__tests__/actions.service.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/actions.ts src/api/services/actions.ts src/services/contracts.ts src/services/restServices.ts src/views/ActionsView.tsx src/components/ActionDetailModal.tsx src/api/services/__tests__/actions.service.test.ts
git commit -m "feat(actions): migrate board to assigned organized and status patch"
```

### Task 6: Implement meeting orchestration service (create/start/upload/poll/fetch)

**Files:**
- Modify: `src/api/services/meetings.ts`
- Create: `src/api/services/transcription.ts`
- Create: `src/api/services/minutes.ts`
- Modify: `src/api/mappers/meetingMapper.ts`
- Create: `src/api/services/__tests__/meetings.service.test.ts`
- Create: `src/api/services/__tests__/transcription.service.test.ts`
- Create: `src/api/services/__tests__/minutes.service.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/api/services/__tests__/meetings.service.test.ts
import { describe, expect, it, vi } from "vitest";
import * as client from "../../client";
import { createMeetingFromCalendarEvent, startMeetingRecording, getMeetingById } from "../meetings";

vi.mock("../../client", () => ({ getJson: vi.fn(), postJson: vi.fn() }));

describe("meetings service", () => {
  it("creates meeting with calendarEventId payload", async () => {
    vi.mocked(client.postJson).mockResolvedValue({ id: "m1" });
    await createMeetingFromCalendarEvent("ev1");
    expect(client.postJson).toHaveBeenCalledWith("/meetings", { calendarEventId: "ev1" });
  });

  it("starts recording route", async () => {
    vi.mocked(client.postJson).mockResolvedValue({ id: "m1", status: "recording" });
    await startMeetingRecording("m1");
    expect(client.postJson).toHaveBeenCalledWith("/meetings/m1/recording/start", {});
  });

  it("loads meeting details", async () => {
    vi.mocked(client.getJson).mockResolvedValue({ id: "m1", title: "R", status: "pending" });
    await getMeetingById("m1");
    expect(client.getJson).toHaveBeenCalledWith("/meetings/m1");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/api/services/__tests__/meetings.service.test.ts src/api/services/__tests__/transcription.service.test.ts src/api/services/__tests__/minutes.service.test.ts`  
Expected: FAIL with missing exports/files.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/api/services/meetings.ts (excerpt)
import { getJson, postJson, patchJson } from "../client";
import { API_ROUTES } from "../config";
import type { MeetingResponse } from "../types/swagger";

export function createMeetingFromCalendarEvent(calendarEventId: string): Promise<MeetingResponse> {
  return postJson<MeetingResponse>(API_ROUTES.meetings.create, { calendarEventId });
}

export function createManualMeeting(title: string, scheduledAt?: string): Promise<MeetingResponse> {
  return postJson<MeetingResponse>(API_ROUTES.meetings.create, { title, ...(scheduledAt ? { scheduledAt } : {}) });
}

export function startMeetingRecording(meetingId: string): Promise<MeetingResponse> {
  return postJson<MeetingResponse>(API_ROUTES.meetings.startRecording(meetingId), {});
}

export function getMeetingById(meetingId: string): Promise<MeetingResponse> {
  return getJson<MeetingResponse>(API_ROUTES.meetings.get(meetingId));
}

export function updateMeetingTitle(meetingId: string, title: string): Promise<MeetingResponse> {
  return patchJson<MeetingResponse>(API_ROUTES.meetings.updateTitle(meetingId), { title });
}
```

```ts
// src/api/services/transcription.ts (excerpt)
import { getJson, postFormData } from "../client";
import { API_ROUTES } from "../config";
import type { TranscriptionResponse, UploadTranscriptionResponse } from "../types/swagger";

export async function uploadTranscriptionAudio(meetingId: string, audio: Blob): Promise<UploadTranscriptionResponse> {
  const formData = new FormData();
  formData.append("audio", audio, "recording.webm");
  return postFormData<UploadTranscriptionResponse>(API_ROUTES.transcription.upload(meetingId), formData);
}

export function getMeetingTranscription(meetingId: string): Promise<TranscriptionResponse> {
  return getJson<TranscriptionResponse>(API_ROUTES.transcription.get(meetingId));
}
```

```ts
// src/api/services/minutes.ts (excerpt)
import { getJson, patchJson, postJson } from "../client";
import { API_ROUTES } from "../config";
import type { MinutesResponse } from "../types/swagger";

export function getMeetingMinutes(meetingId: string): Promise<MinutesResponse> {
  return getJson<MinutesResponse>(API_ROUTES.minutes.get(meetingId));
}

export function editMeetingMinutes(meetingId: string, instruction: string): Promise<MinutesResponse> {
  return patchJson<MinutesResponse>(API_ROUTES.minutes.edit(meetingId), { instruction });
}

export function confirmMeetingMinutes(meetingId: string): Promise<MinutesResponse> {
  return postJson<MinutesResponse>(API_ROUTES.minutes.confirm(meetingId), {});
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/api/services/__tests__/meetings.service.test.ts src/api/services/__tests__/transcription.service.test.ts src/api/services/__tests__/minutes.service.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/services/meetings.ts src/api/services/transcription.ts src/api/services/minutes.ts src/api/services/__tests__/meetings.service.test.ts src/api/services/__tests__/transcription.service.test.ts src/api/services/__tests__/minutes.service.test.ts
git commit -m "feat(meetings): migrate create recording transcription and minutes services"
```

### Task 7: Add notes + distribution services and rate-limit aware errors

**Files:**
- Create: `src/api/services/notes.ts`
- Create: `src/api/services/distribution.ts`
- Modify: `src/api/client.ts`
- Create: `src/api/services/__tests__/notes.service.test.ts`
- Create: `src/api/services/__tests__/distribution.service.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/api/services/__tests__/notes.service.test.ts
import { describe, expect, it, vi } from "vitest";
import * as client from "../../client";
import { upsertMeetingNote } from "../notes";

vi.mock("../../client", () => ({ putJson: vi.fn() }));

describe("notes service", () => {
  it("upserts note using PUT /meetings/{id}/notes", async () => {
    vi.mocked(client.putJson).mockResolvedValue({ id: "n1", content: "abc" });
    await upsertMeetingNote("m1", "abc");
    expect(client.putJson).toHaveBeenCalledWith("/meetings/m1/notes", { content: "abc" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/api/services/__tests__/notes.service.test.ts src/api/services/__tests__/distribution.service.test.ts`  
Expected: FAIL because `putJson`, `notes service`, and `distribution service` are missing.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/api/client.ts (new helper)
export function putJson<T, TBody = unknown>(path: string, body: TBody): Promise<T> {
  return request<T>(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
```

```ts
// src/api/services/notes.ts
import { getJson, putJson } from "../client";
import { API_ROUTES } from "../config";
import type { NoteResponse } from "../types/swagger";

export function getMeetingNote(meetingId: string): Promise<NoteResponse> {
  return getJson<NoteResponse>(API_ROUTES.notes.get(meetingId));
}

export function upsertMeetingNote(meetingId: string, content: string): Promise<NoteResponse> {
  return putJson<NoteResponse>(API_ROUTES.notes.upsert(meetingId), { content });
}
```

```ts
// src/api/services/distribution.ts
import { postJson } from "../client";
import { API_ROUTES } from "../config";
import type { DistributionResponse } from "../types/swagger";

export function distributeMinutesByEmail(meetingId: string): Promise<DistributionResponse> {
  return postJson<DistributionResponse>(API_ROUTES.minutes.distribute(meetingId), {});
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/api/services/__tests__/notes.service.test.ts src/api/services/__tests__/distribution.service.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/client.ts src/api/services/notes.ts src/api/services/distribution.ts src/api/services/__tests__/notes.service.test.ts src/api/services/__tests__/distribution.service.test.ts
git commit -m "feat(minutes): add notes and distribution swagger services"
```

### Task 8: Refactor AppServices contracts and restServices wiring end-to-end

**Files:**
- Modify: `src/services/contracts.ts`
- Modify: `src/services/restServices.ts`
- Modify: `src/types/api.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/services/__tests__/contracts.test.ts
import { describe, expect, it } from "vitest";
import { createRestServices } from "../restServices";

describe("AppServices wiring", () => {
  it("exposes swagger-based service methods", () => {
    const services = createRestServices();
    expect(typeof services.users.getCurrentUser).toBe("function");
    expect(typeof services.users.getCalendarEvents).toBe("function");
    expect(typeof services.actions.fetchActionsBoard).toBe("function");
    expect(typeof services.actions.updateActionStatus).toBe("function");
    expect(typeof services.minutes.confirmMeetingMinutes).toBe("function");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/services/__tests__/contracts.test.ts`  
Expected: FAIL because contracts/restServices do not expose new methods yet.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/services/contracts.ts (shape excerpt)
export interface UsersService {
  getCurrentUser(): Promise<SessionUser>;
  getCalendarEvents(startDateTime: string, endDateTime: string): Promise<CalendarMeeting[]>;
}

export interface ActionsService {
  fetchActionsBoard(): Promise<Action[]>;
  updateActionStatus(id: string, status: ActionStatus): Promise<Action>;
}

export interface MinutesService {
  getMeetingMinutes(meetingId: string): Promise<unknown>;
  editMeetingMinutes(meetingId: string, instruction: string): Promise<unknown>;
  confirmMeetingMinutes(meetingId: string): Promise<unknown>;
  distributeMinutesByEmail(meetingId: string): Promise<unknown>;
}

export interface NotesService {
  getMeetingNote(meetingId: string): Promise<unknown>;
  upsertMeetingNote(meetingId: string, content: string): Promise<unknown>;
}

export interface AppServices {
  users: UsersService;
  meetings: MeetingsService;
  transcription: TranscriptionService;
  minutes: MinutesService;
  notes: NotesService;
  actions: ActionsService;
  runtime: RuntimeService;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/services/__tests__/contracts.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/contracts.ts src/services/restServices.ts src/types/api.ts src/services/__tests__/contracts.test.ts
git commit -m "refactor(services): align contracts and wiring with swagger api"
```

### Task 9: Refactor PillarAI flow to Swagger orchestration (meeting->recording->upload->poll->minutes)

**Files:**
- Modify: `src/PillarAI.tsx`
- Modify: `src/types/index.ts`
- Create: `src/services/meetingFlow.ts`
- Create: `src/PillarAI.__tests__/meetingFlow.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/PillarAI.__tests__/meetingFlow.test.tsx
import { describe, expect, it, vi } from "vitest";
import { runMeetingPipeline } from "../services/meetingFlow";

describe("PillarAI meeting flow", () => {
  it("creates meeting, starts recording and uploads audio in order", async () => {
    const createMeeting = vi.fn().mockResolvedValue({ id: "m1" });
    const startRecording = vi.fn().mockResolvedValue({});
    const uploadAudio = vi.fn().mockResolvedValue({});
    const getMeetingById = vi.fn().mockResolvedValue({ id: "m1", status: "done" });
    const getTranscription = vi.fn().mockResolvedValue({ meetingId: "m1", transcription: "ok" });
    const getMinutes = vi.fn().mockResolvedValue({ id: "min1", content: { title: "R", participants: [], topics: [], actions: [], summary: "" } });

    await runMeetingPipeline({
      createMeeting,
      startRecording,
      uploadAudio,
      getMeetingById,
      getTranscription,
      getMinutes,
      audioBlob: new Blob(["x"], { type: "audio/webm" }),
    });

    expect(createMeeting).toHaveBeenCalledTimes(1);
    expect(startRecording).toHaveBeenCalledWith("m1");
    expect(uploadAudio).toHaveBeenCalledWith("m1", expect.any(Blob));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/PillarAI.__tests__/meetingFlow.test.tsx`  
Expected: FAIL with module-not-found for `../services/meetingFlow`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/PillarAI.tsx (handleStop flow excerpt)
const meeting = meetingContext
  ? await meetingsService.createMeetingFromCalendarEvent(calendarMeetingId)
  : await meetingsService.createManualMeeting("Reuniao sem titulo");

setCurrentMeetingId(meeting.id);
await meetingsService.startMeetingRecording(meeting.id);

await transcriptionService.uploadTranscriptionAudio(meeting.id, audioBlob);

const maxAttempts = 20;
let attempt = 0;
while (attempt < maxAttempts) {
  attempt += 1;
  const currentMeeting = await meetingsService.getMeetingById(meeting.id);
  if (currentMeeting.status === "done") break;
  await new Promise((r) => setTimeout(r, Math.min(1000 * attempt, 8000)));
}

const [transcription, minutes] = await Promise.all([
  transcriptionService.getMeetingTranscription(meeting.id),
  minutesService.getMeetingMinutes(meeting.id),
]);

const resultViewModel = toProcessResultViewModel(meeting, minutes, transcription);
setResult(resultViewModel);
```

```ts
// src/services/meetingFlow.ts
interface RunMeetingPipelineDeps {
  createMeeting: () => Promise<{ id: string }>;
  startRecording: (meetingId: string) => Promise<unknown>;
  uploadAudio: (meetingId: string, audio: Blob) => Promise<unknown>;
  getMeetingById: (meetingId: string) => Promise<{ id: string; status: string }>;
  getTranscription: (meetingId: string) => Promise<unknown>;
  getMinutes: (meetingId: string) => Promise<unknown>;
  audioBlob: Blob;
}

export async function runMeetingPipeline(deps: RunMeetingPipelineDeps) {
  const meeting = await deps.createMeeting();
  await deps.startRecording(meeting.id);
  await deps.uploadAudio(meeting.id, deps.audioBlob);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const current = await deps.getMeetingById(meeting.id);
    if (current.status === "done") break;
    await new Promise((resolve) => setTimeout(resolve, Math.min((attempt + 1) * 1000, 8000)));
  }

  const [transcription, minutes] = await Promise.all([
    deps.getTranscription(meeting.id),
    deps.getMinutes(meeting.id),
  ]);

  return { meetingId: meeting.id, transcription, minutes };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/PillarAI.__tests__/meetingFlow.test.tsx`  
Expected: PASS with mocked order assertions.

- [ ] **Step 5: Commit**

```bash
git add src/PillarAI.tsx src/types/index.ts src/PillarAI.__tests__/meetingFlow.test.tsx
git commit -m "feat(flow): migrate live meeting flow to swagger orchestration"
```

### Task 10: Replace legacy ATA confirm/extract/send flows with minutes confirm/distribute/note upsert

**Files:**
- Modify: `src/PillarAI.tsx`
- Modify: `src/components/TabsPanel.tsx`
- Modify: `src/components/ParticipantsPanel.tsx`
- Modify: `src/views/HomeView.tsx`
- Create: `src/components/__tests__/TabsPanel.minutes.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/__tests__/TabsPanel.minutes.test.tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TabsPanel } from "../TabsPanel";

describe("TabsPanel minutes actions", () => {
  it("calls onConfirmAta and no longer shows legacy extract actions CTA", async () => {
    const onConfirmAta = vi.fn().mockResolvedValue(undefined);
    render(
      <TabsPanel
        activeTab="ata"
        setActiveTab={() => {}}
        notes=""
        setNotes={() => {}}
        appState="finished"
        result={{} as any}
        ataText="Ata"
        setAtaText={() => {}}
        transcriptionText="texto"
        onAiRewrite={async () => {}}
        isAiRewriting={false}
        isAtaConfirmed={false}
        isConfirmingAta={false}
        onConfirmAta={onConfirmAta}
      />,
    );

    expect(screen.queryByText(/Revisar e Gerar Acoes/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Confirmar Ata/i }));
    expect(onConfirmAta).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/components/__tests__/TabsPanel.minutes.test.tsx`  
Expected: FAIL because CTA/behavior still references legacy flow.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/PillarAI.tsx (confirm/distribute excerpt)
const handleConfirmAta = useCallback(async () => {
  if (!currentMeetingId) return;
  setIsConfirmingAta(true);
  try {
    await minutesService.confirmMeetingMinutes(currentMeetingId);
    setIsAtaConfirmed(true);
  } finally {
    setIsConfirmingAta(false);
  }
}, [currentMeetingId, minutesService]);

const handleSendEmails = useCallback(async () => {
  if (!currentMeetingId || !isAtaConfirmed) return;
  setIsSending(true);
  try {
    await minutesService.distributeMinutesByEmail(currentMeetingId);
    setEmailSent(true);
  } finally {
    setIsSending(false);
  }
}, [currentMeetingId, isAtaConfirmed, minutesService]);
```

```tsx
// src/views/HomeView.tsx (finished state CTA excerpt)
{appState === "finished" && result && !isAtaConfirmed && (
  <div style={{ marginTop: 24, textAlign: "right" }}>
    <button
      className="btn-primary"
      onClick={onConfirmAta}
      disabled={isConfirmingAta}
      style={{
        background: isConfirmingAta ? C.creamDark : C.orange,
        color: isConfirmingAta ? C.grayLight : C.white,
      }}
    >
      {isConfirmingAta ? "Confirmando..." : "Confirmar Ata"}
    </button>
  </div>
)}
```

```tsx
// src/components/ParticipantsPanel.tsx (header copy)
<div style={{ fontSize: 12, color: C.grayLight, marginTop: 1 }}>
  Reenvio de ata confirmada para os participantes
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/components/__tests__/TabsPanel.minutes.test.tsx`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/PillarAI.tsx src/components/TabsPanel.tsx src/components/ParticipantsPanel.tsx src/views/HomeView.tsx src/components/__tests__/TabsPanel.minutes.test.tsx
git commit -m "feat(minutes): migrate confirm and distribute flow to swagger endpoints"
```

### Task 11: Integrate private notes endpoint and robust ApiError UX for 409/413/429

**Files:**
- Modify: `src/PillarAI.tsx`
- Modify: `src/api/client.ts`
- Modify: `src/views/HomeView.tsx`
- Create: `src/api/__tests__/apiError.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/api/__tests__/apiError.test.ts
import { describe, expect, it } from "vitest";
import { ApiError } from "../client";

describe("ApiError metadata", () => {
  it("stores status and details for UX decisions", () => {
    const error = new ApiError("Too many requests", 429, { retryAfter: "60" });
    expect(error.status).toBe(429);
    expect(error.details).toEqual({ retryAfter: "60" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/api/__tests__/apiError.test.ts`  
Expected: FAIL after extending assertions for parsed retry metadata not yet implemented.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/api/client.ts (error parse excerpt)
if (!response.ok) {
  const errorPayload = isApiErrorPayload(payload) ? payload : null;
  const retryAfter = response.headers.get("Retry-After");
  throw new ApiError(
    errorPayload?.error || response.statusText || "Erro na requisicao",
    response.status,
    {
      ...(errorPayload?.details && typeof errorPayload.details === "object" ? errorPayload.details : {}),
      ...(retryAfter ? { retryAfter } : {}),
    },
  );
}
```

```tsx
// src/PillarAI.tsx (notes load/save excerpt)
const loadMeetingNote = useCallback(async (meetingId: string) => {
  try {
    const note = await notesService.getMeetingNote(meetingId);
    setNotes(note.content || "");
  } catch (err) {
    if (isApiError(err) && err.status === 404) {
      setNotes("");
      return;
    }
    throw err;
  }
}, [notesService]);

const persistMeetingNote = useCallback(async (meetingId: string, text: string) => {
  await notesService.upsertMeetingNote(meetingId, text);
}, [notesService]);
```

```tsx
// src/views/HomeView.tsx (status-specific message helper)
function toFriendlyError(message: string, status?: number): string {
  if (status === 409) return "Processamento ainda em andamento. Tente novamente em instantes.";
  if (status === 413) return "O arquivo ou instrucao excede o limite permitido pela API.";
  if (status === 429) return "Limite de requisicoes atingido. Aguarde e tente novamente.";
  return message;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/api/__tests__/apiError.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/api/client.ts src/PillarAI.tsx src/views/HomeView.tsx src/api/__tests__/apiError.test.ts
git commit -m "feat(errors): add swagger-aware error handling and notes integration"
```

### Task 12: Remove legacy API surface and run full verification

**Files:**
- Modify: `src/api/services/actions.ts`
- Modify: `src/api/services/meetings.ts`
- Modify: `src/services/contracts.ts`
- Modify: `src/services/restServices.ts`
- Modify: `src/types/api.ts`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/api/services/__tests__/legacyRoutesRemoved.test.ts
import { describe, expect, it } from "vitest";
import { API_ROUTES } from "../../config";

describe("legacy routes removed", () => {
  it("does not expose deprecated meetings.process route", () => {
    expect((API_ROUTES as any).meetings?.process).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/api/services/__tests__/legacyRoutesRemoved.test.ts`  
Expected: FAIL while legacy references still exist in codepaths/types.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/types/api.ts
// Remove: RewriteMeetingRequest, RewriteMeetingResponse, SendMinutesRequest
// Keep only types still used by current UI and swagger mapping.
export interface ApiEnvelope<T> {
  status: "success";
  data: T;
}

export interface ApiErrorResponse {
  status: "error";
  error: string;
  details?: unknown;
}
```

```ts
// src/services/contracts.ts
export interface MeetingsService {
  createMeetingFromCalendarEvent(calendarEventId: string): Promise<unknown>;
  createManualMeeting(title: string, scheduledAt?: string): Promise<unknown>;
  startMeetingRecording(meetingId: string): Promise<unknown>;
  getMeetingById(meetingId: string): Promise<unknown>;
  updateMeetingTitle(meetingId: string, title: string): Promise<unknown>;
}

export interface ActionsService {
  fetchActionsBoard(): Promise<Action[]>;
  updateActionStatus(id: string, status: ActionStatus): Promise<Action>;
}
```

- [ ] **Step 4: Run test/build to verify it passes**

Run:
- `npm run test`
- `npm run build`

Expected:
- Tests PASS with zero failing suites.
- Build exits `0`.

- [ ] **Step 5: Commit**

```bash
git add src/api/services src/services/contracts.ts src/services/restServices.ts src/types/api.ts src/types/index.ts src/api/services/__tests__/legacyRoutesRemoved.test.ts
git commit -m "chore(cleanup): remove legacy api surface and verify swagger-only integration"
```

---

## Final Verification Checklist (before merge)

- [ ] `rg -n "/meetings/process|/meetings/rewrite|/meetings/send-minutes|/meetings/extract-actions|/users/resolve|/users/.*/meetings" src` returns no matches.
- [ ] Calendario carrega por `GET /api/v1/calendar/events` com janela <= 90 dias.
- [ ] Fluxo reuniao completo: create -> start recording -> upload transcription -> fetch transcription/minutes.
- [ ] `PATCH /api/v1/meetings/{id}/minutes` usado para edicao natural da ata.
- [ ] `POST /api/v1/meetings/{id}/minutes/confirm` usado para confirmacao.
- [ ] `POST /api/v1/meetings/{id}/minutes/distribute` usado para distribuicao.
- [ ] `GET/PUT /api/v1/meetings/{id}/notes` funcionando (404 tratado como vazio).
- [ ] Acoes carregadas por `assigned + organized` e atualizadas por `PATCH /actions/{id}/status`.
- [ ] UI nao exibe tabs de comentario/anexo/lembrete/historico de acao.
- [ ] `npm run test` e `npm run build` passando.

## Self-review (writing-plans)

1. **Spec coverage:** todos os blocos do spec aprovado foram cobertos em tarefas especificas:
   - arquitetura/camada adaptacao: Tasks 2-4
   - reuniao/transcricao/ata/notas/distribuicao: Tasks 6, 7, 9, 10, 11
   - acoes: Task 5
   - erros/rate limit: Task 11
   - limpeza legada + verificacao: Task 12
2. **Placeholder scan:** nao ha `TODO`, `TBD`, "implementar depois", nem passos sem comando/codigo.
3. **Type consistency:** nomes de metodos e rotas seguem contratos introduzidos nas Tasks 2, 4 e 8.
