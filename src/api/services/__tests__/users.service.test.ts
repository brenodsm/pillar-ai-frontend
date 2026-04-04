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
      created_at: "2026-04-03T10:00:00Z",
    });

    const user = await getCurrentUser();

    expect(client.getJson).toHaveBeenCalledWith("/me");
    expect(user.display_name).toBe("User Name");
  });
});
