"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AvailabilityMap,
  AvailabilityRecord,
  AvailabilityStatus,
} from "@/lib/availability/types";

interface AvailabilityContextValue {
  getRecord: (keyboardId: string) => AvailabilityRecord | undefined;
  getStatus: (keyboardId: string) => AvailabilityStatus | undefined;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AvailabilityContext = createContext<AvailabilityContextValue | null>(
  null,
);

const CLIENT_REFRESH_MS = 30 * 60 * 1000;

async function fetchAvailability(): Promise<AvailabilityMap> {
  const response = await fetch("/api/availability", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load availability");
  }

  const data = (await response.json()) as { availability: AvailabilityMap };
  return data.availability;
}

export function AvailabilityProvider({ children }: { children: ReactNode }) {
  const [availability, setAvailability] = useState<AvailabilityMap>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const next = await fetchAvailability();
    setAvailability(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchAvailability()
      .then((next) => {
        if (!cancelled) {
          setAvailability(next);
        }
      })
      .catch(() => {
        // Keep last known values on transient failures.
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    const interval = window.setInterval(() => {
      fetchAvailability()
        .then((next) => {
          if (!cancelled) {
            setAvailability(next);
          }
        })
        .catch(() => {
          // Ignore background refresh failures.
        });
    }, CLIENT_REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const value = useMemo<AvailabilityContextValue>(
    () => ({
      getRecord: (keyboardId) => availability[keyboardId],
      getStatus: (keyboardId) => availability[keyboardId]?.status,
      loading,
      refresh,
    }),
    [availability, loading, refresh],
  );

  return (
    <AvailabilityContext.Provider value={value}>
      {children}
    </AvailabilityContext.Provider>
  );
}

export function useAvailability(keyboardId: string) {
  const context = useContext(AvailabilityContext);

  if (!context) {
    throw new Error("useAvailability must be used within AvailabilityProvider");
  }

  const record = context.getRecord(keyboardId);

  return {
    status: record?.status,
    checkedAt: record?.checkedAt,
    loading: context.loading && !record,
    refresh: context.refresh,
  };
}
