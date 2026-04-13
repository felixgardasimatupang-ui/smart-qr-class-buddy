import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  getPendingAttendance,
  markAsSynced,
  getPendingCount,
  PendingAttendance,
} from "./use-offline-queue";

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const updatePendingCount = useCallback(async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  }, []);

  const syncPendingAttendance = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    setIsSyncing(true);
    const pending = await getPendingAttendance();

    for (const attendance of pending) {
      const { error } = await supabase.from("attendance").upsert(
        {
          session_id: attendance.session_id,
          student_id: attendance.student_id,
          status: attendance.status,
          scanned_at: attendance.scanned_at,
          geo_lat: attendance.geo_lat,
          geo_lng: attendance.geo_lng,
        },
        { onConflict: "session_id,student_id" }
      );

      if (!error) {
        await markAsSynced(attendance.id!);
      }
    }

    await updatePendingCount();
    setIsSyncing(false);
  }, [isSyncing, updatePendingCount]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingAttendance();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    updatePendingCount();

    const interval = setInterval(() => {
      if (navigator.onLine) {
        syncPendingAttendance();
      }
    }, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [syncPendingAttendance, updatePendingCount]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    syncNow: syncPendingAttendance,
    refreshPendingCount: updatePendingCount,
  };
}

export function useGeolocation() {
  const [geoLocation, setGeoLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation tidak didukung");
      return null;
    }

    return new Promise<{ lat: number; lng: number } | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setGeoLocation(loc);
          resolve(loc);
        },
        (err) => {
          setError(err.message);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  return { geoLocation, error, getCurrentPosition };
}