import { getJson } from "../client";
import { API_ROUTES } from "../config";
import { mapMeToSessionUser } from "../mappers/userMapper";
import type { SessionUser } from "../../types";
import type { MeResponse } from "../types/swagger";

export async function getCurrentUser(): Promise<SessionUser> {
  const data = await getJson<MeResponse>(API_ROUTES.users.me);
  return mapMeToSessionUser(data);
}
