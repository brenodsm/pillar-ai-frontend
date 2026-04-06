import { act, renderHook, waitFor } from "@testing-library/react";
import type { MeetingListItemResponse } from "../../api/types/swagger";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { listMeetingsMock, appServicesMock } = vi.hoisted(() => {
  const listMeetingsSpy = vi.fn<() => Promise<MeetingListItemResponse[]>>();
  return {
    listMeetingsMock: listMeetingsSpy,
    appServicesMock: {
      meetings: {
        listMeetings: listMeetingsSpy,
      },
    },
  };
});

vi.mock("../../services/context", () => ({
  useAppServices: () => appServicesMock,
}));

import { useMeetingsList } from "../meetings/useMeetingsList";

describe("useMeetingsList", () => {
  beforeEach(() => {
    listMeetingsMock.mockReset();
  });

  it("loads meetings from API and exposes mapped view model", async () => {
    listMeetingsMock.mockResolvedValue([
      {
        id: "m-api",
        title: "Reuniao API",
        status: "done",
        scheduledAt: "2026-04-06T10:00:00Z",
        createdAt: "2026-04-06T09:00:00Z",
        updatedAt: "2026-04-06T09:00:00Z",
      },
    ]);

    const { result } = renderHook(() => useMeetingsList([]));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(listMeetingsMock).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
    expect(result.current.meetings).toHaveLength(1);
    expect(result.current.meetings[0].meetingId).toBe("m-api");
    expect(result.current.meetings[0].title).toBe("Reuniao API");
  });

  it("keeps the latest reload result when older requests resolve later", async () => {
    const resolvers: Array<(value: MeetingListItemResponse[]) => void> = [];

    listMeetingsMock.mockImplementation(
      () =>
        new Promise<MeetingListItemResponse[]>((resolve) => {
          resolvers.push(resolve);
        }),
    );

    const { result } = renderHook(() => useMeetingsList([]));

    await waitFor(() => {
      expect(listMeetingsMock).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      void result.current.reload();
    });

    await waitFor(() => {
      expect(listMeetingsMock).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      resolvers[1]([
        {
          id: "latest",
          title: "Latest",
          status: "done",
          createdAt: "2026-04-06T09:00:00Z",
          updatedAt: "2026-04-06T09:00:00Z",
        },
      ]);
    });

    await waitFor(() => {
      expect(result.current.meetings[0].meetingId).toBe("latest");
    });

    await act(async () => {
      resolvers[0]([
        {
          id: "stale",
          title: "Stale",
          status: "done",
          createdAt: "2026-04-05T09:00:00Z",
          updatedAt: "2026-04-05T09:00:00Z",
        },
      ]);
    });

    await waitFor(() => {
      expect(result.current.meetings[0].meetingId).toBe("latest");
    });
  });
});
