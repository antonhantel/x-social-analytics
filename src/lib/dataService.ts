import { supabase, isSupabaseConfigured } from "./supabase";
import { Researcher, AlertItem } from "@/types/researcher";

// localStorage keys (fallback)
const STORAGE_KEYS = {
  RESEARCHERS: "gi_researchers",
  ALERTS: "gi_alerts",
  TOTAL_FOLLOWERS: "gi_total_followers",
  LAST_UPDATED: "gi_last_updated",
};

// Helper for localStorage
const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save to localStorage:", e);
  }
};

// Data service interface
export interface DataState {
  researchers: Researcher[];
  alerts: AlertItem[];
  totalFollowers: number;
  lastUpdated: string | null;
}

// Load all data
export const loadData = async (): Promise<DataState> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const [researchersRes, alertsRes, metaRes] = await Promise.all([
        supabase.from("researchers").select("*").order("handle"),
        supabase
          .from("alerts")
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(100),
        supabase.from("metadata").select("*").eq("key", "state").single(),
      ]);

      return {
        researchers: (researchersRes.data as Researcher[]) || [],
        alerts: (alertsRes.data as AlertItem[]) || [],
        totalFollowers: metaRes.data?.value?.totalFollowers || 0,
        lastUpdated: metaRes.data?.value?.lastUpdated || null,
      };
    } catch (error) {
      console.error("Supabase load failed, falling back to localStorage:", error);
    }
  }

  // Fallback to localStorage
  return {
    researchers: loadFromStorage(STORAGE_KEYS.RESEARCHERS, []),
    alerts: loadFromStorage(STORAGE_KEYS.ALERTS, []),
    totalFollowers: loadFromStorage(STORAGE_KEYS.TOTAL_FOLLOWERS, 0),
    lastUpdated: loadFromStorage(STORAGE_KEYS.LAST_UPDATED, null),
  };
};

// Save researchers
export const saveResearchers = async (researchers: Researcher[]): Promise<void> => {
  saveToStorage(STORAGE_KEYS.RESEARCHERS, researchers);
  saveToStorage(STORAGE_KEYS.LAST_UPDATED, new Date().toISOString());

  if (isSupabaseConfigured && supabase) {
    try {
      // Upsert researchers (update if exists, insert if not)
      const { error } = await supabase.from("researchers").upsert(
        researchers.map((r) => ({
          ...r,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: "handle" }
      );
      if (error) throw error;

      // Update metadata
      await supabase.from("metadata").upsert({
        key: "state",
        value: { lastUpdated: new Date().toISOString() },
      });
    } catch (error) {
      console.error("Supabase save failed:", error);
    }
  }
};

// Save alerts
export const saveAlerts = async (alerts: AlertItem[]): Promise<void> => {
  const trimmed = alerts.slice(0, 100);
  saveToStorage(STORAGE_KEYS.ALERTS, trimmed);

  if (isSupabaseConfigured && supabase) {
    try {
      // Insert new alerts (ignore duplicates)
      const { error } = await supabase.from("alerts").upsert(trimmed, {
        onConflict: "id",
      });
      if (error) throw error;
    } catch (error) {
      console.error("Supabase alerts save failed:", error);
    }
  }
};

// Save total followers
export const saveTotalFollowers = async (count: number): Promise<void> => {
  saveToStorage(STORAGE_KEYS.TOTAL_FOLLOWERS, count);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from("metadata").upsert({
        key: "state",
        value: {
          totalFollowers: count,
          lastUpdated: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Supabase metadata save failed:", error);
    }
  }
};
