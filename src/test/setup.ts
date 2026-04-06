import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

if (!import.meta.env.VITE_BACKEND_URL?.trim()) {
  vi.stubEnv("VITE_BACKEND_URL", "http://localhost:8000");
}

if (!import.meta.env.VITE_SUPABASE_URL?.trim()) {
  vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
}

if (!import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()) {
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "test-anon-key");
}
