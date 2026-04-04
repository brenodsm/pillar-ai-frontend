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
