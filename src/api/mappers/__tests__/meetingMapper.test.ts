import { describe, expect, it } from "vitest";
import { mapMinutesResponseToMinutes, toProcessResultViewModel } from "../meetingMapper";

describe("toProcessResultViewModel", () => {
  it("maps meeting + minutes + transcription to ProcessResult", () => {
    const result = toProcessResultViewModel(
      {
        id: "m1",
        title: "Reuniao",
        status: "done",
        createdAt: "2026-04-05T09:00:00Z",
        updatedAt: "2026-04-05T10:00:00Z",
        participants: [
          {
            id: "p1",
            userId: "u2",
            name: "Ana",
            email: "ana@empresa.com",
            source: "manual",
          },
        ],
      },
      {
        id: "min1",
        meetingId: "m1",
        status: "draft",
        createdAt: "2026-04-05T10:10:00Z",
        updatedAt: "2026-04-05T10:10:00Z",
        content: {
          title: "Reuniao",
          summary: "Resumo",
          topics: ["Topic 1"],
          participants: [{ name: "Ana", email: "ana@empresa.com" }],
          actions: [{ description: "Acao", responsible_id: "u2", due_date: "2026-04-15" }],
        },
      },
      { meetingId: "m1", transcription: "Texto" },
    );

    expect(result.meeting_id).toBe("m1");
    expect(result.minutes_id).toBe("min1");
    expect(result.transcription.text).toBe("Texto");
    expect(result.minutes.topics[0].title).toBe("Topic 1");
    expect(result.minutes.action_items[0].responsible).toBe("Ana (ana@empresa.com)");
  });

  it("avoids duplicated email label when participant name equals email", () => {
    const mapped = mapMinutesResponseToMinutes(
      {
        title: "Reuniao",
        createdAt: "2026-04-05T09:00:00Z",
      },
      {
        id: "min1",
        meetingId: "m1",
        status: "draft",
        createdAt: "2026-04-05T10:10:00Z",
        updatedAt: "2026-04-05T10:10:00Z",
        content: {
          title: "Reuniao",
          summary: "Resumo",
          topics: [],
          participants: [],
          actions: [{ description: "Acao", responsible_id: "u1", due_date: "2026-04-15" }],
        },
      },
      [
        {
          id: "p1",
          userId: "u1",
          name: "ana@empresa.com",
          email: "ana@empresa.com",
          source: "manual",
        },
      ],
    );

    expect(mapped.action_items[0].responsible).toBe("ana@empresa.com");
  });
});
