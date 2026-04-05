import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const CONFIG_MODULE_PATH = "../config";

async function importConfigModule() {
  return import(`${CONFIG_MODULE_PATH}?test_id=${Date.now()}_${Math.round(Math.random() * 1_000_000)}`);
}

describe("api/config", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("VITE_BACKEND_URL", "http://localhost:8000");
    vi.stubEnv("VITE_API_URL", "");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("builds API_URL from VITE_BACKEND_URL", async () => {
    vi.stubEnv("VITE_BACKEND_URL", "https://api.example.com/");

    const { API_URL } = await importConfigModule();

    expect(API_URL).toBe("https://api.example.com/api/v1");
  });

  it("does not duplicate /api/v1 when already present", async () => {
    vi.stubEnv("VITE_BACKEND_URL", "https://api.example.com/api/v1/");

    const { API_URL } = await importConfigModule();

    expect(API_URL).toBe("https://api.example.com/api/v1");
  });

  it("throws when VITE_BACKEND_URL is missing and logs a structured error", async () => {
    vi.stubEnv("VITE_BACKEND_URL", "  ");
    vi.stubEnv("VITE_API_URL", "");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(importConfigModule()).rejects.toThrow(
      "Missing required environment variable: VITE_BACKEND_URL",
    );

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: "api_config",
        level: "error",
        event: "missing_required_backend_url",
        requiredEnv: "VITE_BACKEND_URL",
      }),
    );
  });
});
