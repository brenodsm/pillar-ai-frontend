import { describe, expect, it, vi } from "vitest";
import * as client from "../../client";
import { getMeetingTranscription } from "../transcription";

vi.mock("../../client", () => ({ getJson: vi.fn(), postFormData: vi.fn() }));

describe("transcription service", () => {
  it("loads transcription route", async () => {
    vi.mocked(client.getJson).mockResolvedValue({ meetingId: "m1", transcription: "text" });

    await getMeetingTranscription("m1");

    expect(client.getJson).toHaveBeenCalledWith("/meetings/m1/transcription");
  });
});
