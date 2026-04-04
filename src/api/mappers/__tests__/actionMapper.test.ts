import { describe, expect, it } from "vitest";
import { fromSwaggerAction } from "../actionMapper";

describe("fromSwaggerAction", () => {
  it("maps swagger action to domain action", () => {
    const mapped = fromSwaggerAction({
      id: "a1",
      description: "Revisar contrato",
      status: "in_progress",
      dueDate: "2026-04-15",
      meetingId: "m1",
      minutesId: "min1",
      meeting: { id: "m1", title: "Alinhamento" },
      responsible: { id: "u1", name: "Maria", email: "maria@empresa.com" },
      createdAt: "2026-04-01T10:00:00Z",
      updatedAt: "2026-04-02T10:00:00Z",
    });

    expect(mapped.status).toBe("in_progress");
    expect(mapped.progress).toBe(50);
    expect(mapped.responsible_email).toBe("maria@empresa.com");
  });
});
