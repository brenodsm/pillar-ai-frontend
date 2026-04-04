import { describe, expect, it } from "vitest";
import { mapMeToSessionUser } from "../userMapper";

describe("mapMeToSessionUser", () => {
  it("maps swagger me payload to SessionUser", () => {
    const result = mapMeToSessionUser({
      id: "u1",
      email: "alice@example.com",
      name: "Alice Silva",
      azure_id: "az-1",
      created_at: "2026-03-28T10:00:00Z",
    });

    expect(result).toEqual({
      email: "alice@example.com",
      display_name: "Alice Silva",
    });
  });
});
