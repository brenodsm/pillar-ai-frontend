import { describe, expect, it, vi } from "vitest";
import * as client from "../../client";
import { confirmMeetingMinutes, editMeetingMinutes, getMeetingMinutes } from "../minutes";

vi.mock("../../client", () => ({ getJson: vi.fn(), patchJson: vi.fn(), postJson: vi.fn() }));

describe("minutes service", () => {
  it("loads meeting minutes", async () => {
    vi.mocked(client.getJson).mockResolvedValue({ id: "min1", meetingId: "m1", status: "draft", content: {}, createdAt: "", updatedAt: "" });

    await getMeetingMinutes("m1");

    expect(client.getJson).toHaveBeenCalledWith("/meetings/m1/minutes");
  });

  it("edits minutes with instruction", async () => {
    vi.mocked(client.patchJson).mockResolvedValue({ id: "min1", meetingId: "m1", status: "draft", content: {}, createdAt: "", updatedAt: "" });

    await editMeetingMinutes("m1", "ajuste o resumo");

    expect(client.patchJson).toHaveBeenCalledWith("/meetings/m1/minutes", { instruction: "ajuste o resumo" });
  });

  it("confirms minutes", async () => {
    vi.mocked(client.postJson).mockResolvedValue({ id: "min1", meetingId: "m1", status: "confirmed", content: {}, createdAt: "", updatedAt: "" });

    await confirmMeetingMinutes("m1");

    expect(client.postJson).toHaveBeenCalledWith("/meetings/m1/minutes/confirm", {});
  });
});
