import { describe, expect, it } from "vitest";
import { formatMinutesToAta } from "../formatters";
import type { Minutes } from "../../types";

describe("formatMinutesToAta", () => {
  it("formats meeting date and keeps topic spacing compact", () => {
    const minutes: Minutes = {
      title: "Reunião de alinhamento",
      date: "2026-04-04T02:07:33.916Z",
      participants: ["Ana", "João"],
      summary: "Resumo geral",
      topics: [
        { title: "Implementação do Pilar AI", discussion: "" },
        { title: "Integração com frontend", discussion: "" },
      ],
      action_items: [
        {
          description: "Integrar backend com frontend",
          responsible: "Ana (ana@empresa.com)",
          deadline: "2026-04-07",
        },
      ],
      decisions: [],
      next_steps: "",
    };

    const ataText = formatMinutesToAta(minutes);

    expect(ataText).toMatch(/Data: \d{2}\/\d{2}\/\d{4}/);
    expect(ataText).toContain("Tópicos discutidos");
    expect(ataText).toContain("• Implementação do Pilar AI");
    expect(ataText).toContain("• Integração com frontend");
    expect(ataText).toContain("• Responsável: Ana (ana@empresa.com)");
    expect(ataText).toContain("Ação: Integrar backend com frontend");
    expect(ataText).toContain("Prazo: 07/04/2026");
    expect(ataText).not.toMatch(/\n\s{3}\n/);
  });

  it("uses fallback when action responsible is empty", () => {
    const minutes: Minutes = {
      title: "Reunião sem responsável",
      date: "2026-04-04T02:07:33.916Z",
      participants: [],
      summary: "",
      topics: [],
      action_items: [
        {
          description: "Definir próximos passos",
          responsible: "",
        },
      ],
      decisions: [],
      next_steps: "",
    };

    const ataText = formatMinutesToAta(minutes);
    expect(ataText).toContain("• Responsável: Sem responsável");
  });
});
