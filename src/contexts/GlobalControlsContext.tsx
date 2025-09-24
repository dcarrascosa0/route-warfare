import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type GlobalPeriod = "ALL_TIME" | "MONTHLY" | "WEEKLY";

interface GlobalControlsState {
  period: GlobalPeriod;
  live: boolean;
  setPeriod: (p: GlobalPeriod) => void;
  setLive: (live: boolean) => void;
}

const GlobalControlsContext = createContext<GlobalControlsState | undefined>(undefined);

const STORAGE_KEYS = {
  period: "global_period",
  live: "global_live",
} as const;

export const GlobalControlsProvider = ({ children }: { children: React.ReactNode }) => {
  const [period, setPeriodState] = useState<GlobalPeriod>(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEYS.period) as GlobalPeriod | null;
      return v === "ALL_TIME" || v === "MONTHLY" || v === "WEEKLY" ? v : "ALL_TIME";
    } catch {
      return "ALL_TIME";
    }
  });

  const [live, setLiveState] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEYS.live);
      if (v === null) return true;
      return v === "true";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.period, period);
    } catch {}
  }, [period]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.live, String(live));
    } catch {}
  }, [live]);

  const setPeriod = useCallback((p: GlobalPeriod) => setPeriodState(p), []);
  const setLive = useCallback((v: boolean) => setLiveState(v), []);

  const value = useMemo<GlobalControlsState>(() => ({ period, live, setPeriod, setLive }), [period, live, setPeriod, setLive]);

  return (
    <GlobalControlsContext.Provider value={value}>
      {children}
    </GlobalControlsContext.Provider>
  );
};

export const useGlobalControls = (): GlobalControlsState => {
  const ctx = useContext(GlobalControlsContext);
  if (!ctx) throw new Error("useGlobalControls must be used within GlobalControlsProvider");
  return ctx;
};


