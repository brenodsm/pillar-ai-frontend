import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HomeView } from "../HomeView";
import type { ComponentProps } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";

type HomeViewProps = ComponentProps<typeof HomeView>;

beforeAll(() => {
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    value: vi.fn(() => ({
      clearRect: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      beginPath: vi.fn(),
      roundRect: vi.fn(),
      fill: vi.fn(),
      fillStyle: "",
    })),
    writable: true,
  });
});

function buildProps(overrides: Partial<HomeViewProps> = {}): HomeViewProps {
  return {
    appState: "finished",
    startTime: null,
    showPanel: true,
    error: null,
    result: {
      transcription: {
        text: "",
        language: "pt-BR",
        segments: [],
      },
      minutes: {
        title: "Reunião de status",
        date: "2026-04-04",
        participants: ["Ana"],
        summary: "Resumo",
        topics: [],
        action_items: [],
        decisions: [],
        next_steps: "",
      },
      meeting_id: "1",
      minutes_id: "1",
    },
    activeTab: "ata",
    setActiveTab: () => {},
    notes: "",
    setNotes: () => {},
    ataText: "",
    setAtaText: () => {},
    transcriptionText: "",
    participants: [
      { name: "Ana Silva", email: "ana@empresa.com", isOwner: true },
    ],
    emailInput: "",
    emailSent: false,
    isSending: false,
    sendError: null,
    setEmailInput: () => {},
    onStart: () => {},
    onStop: () => {},
    onReset: () => {},
    onAddParticipant: () => {},
    onRemoveParticipant: () => {},
    onEmailKeyDown: () => {},
    onSendEmails: () => {},
    onAiRewrite: async () => {},
    onUpdateActionItems: async () => {},
    isAiRewriting: false,
    calendarMeetings: [],
    pastMeetings: [],
    user: null,
    showSystemAudioHint: false,
    isAtaConfirmed: true,
    isConfirmingAta: false,
    onConfirmAta: async () => {},
    ...overrides,
  };
}

describe("HomeView participants modal", () => {
  it("opens participant management only through the modal button", async () => {
    const user = userEvent.setup();

    render(<HomeView {...buildProps()} />);

    expect(screen.getByRole("button", { name: /gerenciar participantes/i })).toBeInTheDocument();
    expect(screen.queryByText(/Adicione ou remova participantes em uma janela dedicada/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Digite o e-mail do participante/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /gerenciar participantes/i }));

    expect(screen.getByRole("dialog", { name: /gerenciar participantes/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Digite o e-mail do participante/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /fechar modal de participantes/i }));

    expect(screen.queryByRole("dialog", { name: /gerenciar participantes/i })).not.toBeInTheDocument();
  });

  it("disables minutes confirmation when any action has no responsible", () => {
    render(
      <HomeView
        {...buildProps({
          isAtaConfirmed: false,
          result: {
            transcription: {
              text: "",
              language: "pt-BR",
              segments: [],
            },
            minutes: {
              title: "Reunião de status",
              date: "2026-04-04",
              participants: ["Ana"],
              summary: "Resumo",
              topics: [],
              action_items: [
                {
                  description: "Enviar cronograma atualizado",
                  responsible: "",
                },
              ],
              decisions: [],
              next_steps: "",
            },
            meeting_id: "1",
            minutes_id: "1",
          },
        })}
      />,
    );

    expect(screen.getByRole("button", { name: /confirmar ata/i })).toBeDisabled();
    expect(screen.getByText(/defina um responsável para cada ação antes de confirmar a ata/i)).toBeInTheDocument();
  });
});
