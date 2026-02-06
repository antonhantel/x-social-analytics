import { supabase, isSupabaseConfigured } from "./supabase";
import { Researcher, AlertItem } from "@/types/researcher";

// localStorage keys (fallback)
const STORAGE_KEYS = {
  RESEARCHERS: "gi_researchers",
  ALERTS: "gi_alerts",
  TOTAL_FOLLOWERS: "gi_total_followers",
  NOTIFICATION_HASHES: "gi_notification_hashes",
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

// Generate a simple hash from a string
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

// Generate notification hash from row data
export const generateNotificationHash = (
  handle: string,
  actionType: string,
  rawRow: string
): string => {
  // Combine handle, action, and raw row content for uniqueness
  const content = `${handle.toLowerCase()}|${actionType}|${rawRow}`;
  return simpleHash(content);
};

// Data service interface
export interface DataState {
  researchers: Researcher[];
  alerts: AlertItem[];
  totalFollowers: number;
  lastUpdated: string | null;
}

// Map Supabase row (snake_case) to Researcher (camelCase)
const mapDbToResearcher = (row: Record<string, unknown>): Researcher => ({
  id: row.id as string,
  handle: row.handle as string,
  name: row.name as string,
  isFollowing: row.is_following as boolean,
  likes: row.likes as number,
  reposts: row.reposts as number,
  replies: row.replies as number,
  lastInteraction: row.last_interaction as string | null,
  isHot: row.is_hot as boolean,
  previousLikes: row.previous_likes as number,
  previousReposts: row.previous_reposts as number,
  previousReplies: row.previous_replies as number,
  previousIsFollowing: row.previous_is_following as boolean,
});

// Map Researcher (camelCase) to Supabase row (snake_case)
const mapResearcherToDb = (r: Researcher) => ({
  id: r.id,
  handle: r.handle,
  name: r.name,
  is_following: r.isFollowing,
  likes: r.likes,
  reposts: r.reposts,
  replies: r.replies,
  last_interaction: r.lastInteraction,
  is_hot: r.isHot,
  previous_likes: r.previousLikes || 0,
  previous_reposts: r.previousReposts || 0,
  previous_replies: r.previousReplies || 0,
  previous_is_following: r.previousIsFollowing || false,
  updated_at: new Date().toISOString(),
});

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

      const researchers = (researchersRes.data || []).map(mapDbToResearcher);

      return {
        researchers,
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
      const dbRows = researchers.map(mapResearcherToDb);
      const { error } = await supabase.from("researchers").upsert(dbRows, {
        onConflict: "handle",
      });
      if (error) throw error;

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

// ============================================
// NOTIFICATION DEDUPLICATION
// ============================================

interface NotificationCheck {
  hash: string;
  handle: string;
  actionType: string;
  rawRow: string;
}

// Check which notification hashes already exist
export const checkExistingNotifications = async (
  hashes: string[]
): Promise<Set<string>> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from("notifications_log")
        .select("notification_hash")
        .in("notification_hash", hashes);

      if (error) throw error;
      return new Set((data || []).map((r) => r.notification_hash));
    } catch (error) {
      console.error("Supabase check failed:", error);
    }
  }

  // Fallback to localStorage
  const storedHashes = loadFromStorage<string[]>(STORAGE_KEYS.NOTIFICATION_HASHES, []);
  const hashSet = new Set(storedHashes);
  return new Set(hashes.filter((h) => hashSet.has(h)));
};

// Save new notification hashes
export const saveNotificationHashes = async (
  notifications: NotificationCheck[]
): Promise<void> => {
  if (notifications.length === 0) return;

  // Save to localStorage
  const storedHashes = loadFromStorage<string[]>(STORAGE_KEYS.NOTIFICATION_HASHES, []);
  const newHashes = notifications.map((n) => n.hash);
  const combined = [...new Set([...newHashes, ...storedHashes])].slice(0, 10000); // Keep last 10k
  saveToStorage(STORAGE_KEYS.NOTIFICATION_HASHES, combined);

  if (isSupabaseConfigured && supabase) {
    try {
      const rows = notifications.map((n) => ({
        id: `notif-${n.hash}-${Date.now()}`,
        notification_hash: n.hash,
        handle: n.handle,
        action_type: n.actionType,
        raw_row: n.rawRow.substring(0, 500), // Limit size
        created_at: new Date().toISOString(),
      }));

      // Use upsert to handle any potential duplicates
      const { error } = await supabase
        .from("notifications_log")
        .upsert(rows, { onConflict: "notification_hash" });

      if (error) throw error;
    } catch (error) {
      console.error("Supabase notification save failed:", error);
    }
  }
};

// Process notifications with deduplication
// Returns only NEW notifications (not seen before)
// Stops processing when 3+ consecutive duplicates are found (overlap zone)
// NOTE: Does NOT save hashes - caller must call markNotificationsAsProcessed for matched ones
export interface ProcessedNotification {
  handle: string;
  type: "like" | "repost" | "reply";
  hash: string;
  rawRow: string;
}

export const processNotificationsWithDedup = async (
  notifications: Array<{
    handle: string;
    type: "like" | "repost" | "reply";
    rawRow: string;
  }>
): Promise<ProcessedNotification[]> => {
  if (notifications.length === 0) return [];

  // Generate hashes for all notifications
  const withHashes = notifications.map((n) => ({
    ...n,
    hash: generateNotificationHash(n.handle, n.type, n.rawRow),
  }));

  // Check which already exist
  const allHashes = withHashes.map((n) => n.hash);
  const existingHashes = await checkExistingNotifications(allHashes);

  // Process from top (newest) and stop at overlap zone
  const newNotifications: ProcessedNotification[] = [];
  let consecutiveDupes = 0;
  const OVERLAP_THRESHOLD = 3;

  for (const notification of withHashes) {
    if (existingHashes.has(notification.hash)) {
      consecutiveDupes++;
      if (consecutiveDupes >= OVERLAP_THRESHOLD) {
        console.log(
          `Found ${OVERLAP_THRESHOLD}+ consecutive duplicates, stopping (overlap zone)`
        );
        break;
      }
    } else {
      consecutiveDupes = 0; // Reset counter
      newNotifications.push(notification);
    }
  }

  console.log(
    `Processed ${notifications.length} notifications, ${newNotifications.length} new, ${notifications.length - newNotifications.length} duplicates/skipped`
  );

  return newNotifications;
};

// Mark notifications as processed (call this AFTER matching to researchers)
export const markNotificationsAsProcessed = async (
  notifications: ProcessedNotification[]
): Promise<void> => {
  if (notifications.length === 0) return;

  await saveNotificationHashes(
    notifications.map((n) => ({
      hash: n.hash,
      handle: n.handle,
      actionType: n.type,
      rawRow: n.rawRow,
    }))
  );

  console.log(`Marked ${notifications.length} notifications as processed`);
};

// Reset all data
export const resetAllData = async (): Promise<void> => {
  // Clear localStorage
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });

  if (isSupabaseConfigured && supabase) {
    try {
      // Delete all data from tables
      await Promise.all([
        supabase.from("researchers").delete().neq("id", ""),
        supabase.from("alerts").delete().neq("id", ""),
        supabase.from("notifications_log").delete().neq("id", ""),
        supabase.from("metadata").delete().eq("key", "state"),
      ]);
      console.log("All data cleared from Supabase");
    } catch (error) {
      console.error("Supabase reset failed:", error);
    }
  }

  console.log("All data reset");
};
