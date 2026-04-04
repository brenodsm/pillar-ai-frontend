import { createContext, useContext, type PropsWithChildren } from "react";
import type { AppServices } from "./contracts";
import { defaultAppServices } from "./restServices";

const AppServicesContext = createContext<AppServices>(defaultAppServices);

interface AppServicesProviderProps extends PropsWithChildren {
  services?: AppServices;
}

export function AppServicesProvider({ children, services = defaultAppServices }: AppServicesProviderProps) {
  return <AppServicesContext.Provider value={services}>{children}</AppServicesContext.Provider>;
}

export function useAppServices(): AppServices {
  return useContext(AppServicesContext);
}
