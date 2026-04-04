import { describe, expect, it } from "vitest";
import { ApiError } from "../client";

describe("ApiError metadata", () => {
  it("stores status and details for UX decisions", () => {
    const error = new ApiError("Too many requests", 429, { retryAfter: "60" });
    expect(error.status).toBe(429);
    expect(error.details).toEqual({ retryAfter: "60" });
  });
});
