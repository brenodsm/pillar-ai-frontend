import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

if (!import.meta.env.VITE_BACKEND_URL?.trim()) {
  vi.stubEnv("VITE_BACKEND_URL", "http://localhost:8000");
}
