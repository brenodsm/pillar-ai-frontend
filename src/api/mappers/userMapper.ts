import type { SessionUser } from "../../types";
import type { MeResponse } from "../types/swagger";

export function mapMeToSessionUser(payload: MeResponse): SessionUser {
  return {
    email: payload.email,
    display_name: payload.name,
  };
}
