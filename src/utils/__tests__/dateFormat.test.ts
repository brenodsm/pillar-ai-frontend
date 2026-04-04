import { describe, expect, it } from "vitest";
import { formatDateToBrDate } from "../dateFormat";

describe("formatDateToBrDate", () => {
  it("formats YYYY-MM-DD as dd/mm/yyyy", () => {
    expect(formatDateToBrDate("2026-04-15")).toBe("15/04/2026");
  });

  it("formats ISO datetime using date prefix", () => {
    expect(formatDateToBrDate("2026-04-15T10:30:00Z")).toBe("15/04/2026");
  });
});
