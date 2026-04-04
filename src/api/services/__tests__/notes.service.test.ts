import { describe, expect, it, vi } from "vitest";
import * as client from "../../client";
import { upsertMeetingNote } from "../notes";

vi.mock("../../client", () => ({ getJson: vi.fn(), putJson: vi.fn() }));

describe("notes service", () => {
  it("upserts note using PUT /meetings/{id}/notes", async () => {
    vi.mocked(client.putJson).mockResolvedValue({ id: "n1", content: "abc" });

    await upsertMeetingNote("m1", "abc");

    expect(client.putJson).toHaveBeenCalledWith("/meetings/m1/notes", { content: "abc" });
  });
});
