import { useState, useCallback, useEffect } from "react";
import { KPICard } from "./KPICard";
import { UploadSection } from "./UploadSection";
import { ResearcherTable } from "./ResearcherTable";
import { AlertsPanel } from "./AlertsPanel";
import { NewestReached } from "./NewestReached";
import { ThemeToggle } from "./ThemeToggle";
import { HowToUseGuide } from "./HowToUseGuide";
import { Researcher, KPIData, AlertItem } from "@/types/researcher";
import { BarChart3, Target, Plus, Database, Cloud, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  loadData,
  saveResearchers,
  saveAlerts,
  saveTotalFollowers,
  processNotificationsWithDedup,
  markNotificationsAsProcessed,
  ProcessedNotification,
} from "@/lib/dataService";
import { isSupabaseConfigured, testConnection } from "@/lib/supabase";

// Helper function to extract username from Twitter/X URL or handle
const extractHandle = (input: string): string => {
  if (!input) return "";
  // Handle URLs like https://x.com/username or https://twitter.com/username
  const urlMatch = input.match(/(?:x\.com|twitter\.com)\/([^\/\?\s]+)/i);
  if (urlMatch) {
    return urlMatch[1].replace("@", "");
  }
  // Handle plain usernames with or without @
  return input.replace("@", "").trim();
};

// Helper function to detect interaction type from notification text
const detectInteractionType = (
  col4: string,
  col7: string
): "like" | "repost" | "reply" | null => {
  const col4Lower = (col4 || "").toLowerCase();
  const col7Lower = (col7 || "").toLowerCase();

  if (col4Lower.includes("liked")) return "like";
  if (col4Lower.includes("repost")) return "repost";
  if (col7Lower.includes("replying to") || col7Lower.includes("reply")) return "reply";

  return null;
};

export const Dashboard = () => {
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [totalFollowers, setTotalFollowers] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [newHandle, setNewHandle] = useState("");
  const [dbStatus, setDbStatus] = useState<"checking" | "cloud" | "local">("checking");
  const [kpis, setKpis] = useState<KPIData>({
    targetsReached: 0,
    targetsReachedDelta: 0,
    heavilyEngaged: 0,
    heavilyEngagedDelta: 0,
    relevantFollowership: 0,
    relevantFollowershipDelta: 0,
    totalTargets: 0,
    totalFollowers: 0,
    reachedCount: 0,
  });

  // Load data and check connection on mount
  useEffect(() => {
    const load = async () => {
      // Check Supabase connection
      if (isSupabaseConfigured) {
        const result = await testConnection();
        setDbStatus(result.connected ? "cloud" : "local");
        if (!result.connected) {
          console.warn("[Dashboard] Supabase error:", result.error);
          toast({
            title: "Using Local Storage",
            description: `Cloud connection failed: ${result.error}`,
            variant: "destructive",
          });
        }
      } else {
        setDbStatus("local");
      }

      const data = await loadData();
      setResearchers(data.researchers);
      setAlerts(data.alerts);
      setTotalFollowers(data.totalFollowers);
      setIsLoading(false);
    };
    load();
  }, []);

  const calculateKPIs = useCallback(
    (data: Researcher[], followers: number = totalFollowers) => {
      const total = data.length;
      const reached = data.filter((r) => r.isFollowing).length;
      const engaged = data.filter(
        (r) => r.likes + r.reposts + r.replies >= 3
      ).length;

      const prevReached = data.filter((r) => r.previousIsFollowing).length;
      const prevEngaged = data.filter(
        (r) =>
          (r.previousLikes || 0) +
            (r.previousReposts || 0) +
            (r.previousReplies || 0) >=
          3
      ).length;

      // Relevant Followership = reached / total followers (as percentage)
      const relevantPct =
        followers > 0 ? Math.round((reached / followers) * 100 * 10) / 10 : 0;
      const prevRelevantPct =
        followers > 0 ? Math.round((prevReached / followers) * 100 * 10) / 10 : 0;

      setKpis({
        targetsReached: total > 0 ? Math.round((reached / total) * 100) : 0,
        targetsReachedDelta:
          total > 0 ? Math.round(((reached - prevReached) / total) * 100) : 0,
        heavilyEngaged: total > 0 ? Math.round((engaged / total) * 100) : 0,
        heavilyEngagedDelta:
          total > 0 ? Math.round(((engaged - prevEngaged) / total) * 100) : 0,
        relevantFollowership: relevantPct,
        relevantFollowershipDelta:
          Math.round((relevantPct - prevRelevantPct) * 10) / 10,
        totalTargets: total,
        totalFollowers: followers,
        reachedCount: reached,
      });
    },
    [totalFollowers]
  );

  // Save researchers whenever they change
  useEffect(() => {
    if (!isLoading && researchers.length > 0) {
      saveResearchers(researchers);
    }
  }, [researchers, isLoading]);

  // Save alerts whenever they change
  useEffect(() => {
    if (!isLoading) {
      saveAlerts(alerts);
    }
  }, [alerts, isLoading]);

  // Save total followers whenever it changes
  useEffect(() => {
    if (!isLoading && totalFollowers > 0) {
      saveTotalFollowers(totalFollowers);
    }
  }, [totalFollowers, isLoading]);

  // Calculate KPIs when data is loaded
  useEffect(() => {
    if (!isLoading) {
      calculateKPIs(researchers, totalFollowers);
    }
  }, [isLoading, researchers.length]);

  const handleTargetUpload = useCallback(
    (data: string[][]) => {
      // Skip header row, expect: handle (or URL), optional name
      // Merge with existing researchers - don't lose data
      let addedCount = 0;
      let updatedCount = 0;

      setResearchers((prev) => {
        const existingByHandle = new Map(
          prev.map((r) => [r.handle.toLowerCase(), r])
        );

        data
          .slice(1)
          .filter((row) => row[0] && row[0].trim() !== "")
          .forEach((row, index) => {
            const handle = extractHandle(row[0]);
            const handleLower = handle.toLowerCase();

            if (!existingByHandle.has(handleLower)) {
              // New researcher - add them
              existingByHandle.set(handleLower, {
                id: `researcher-${index}-${Date.now()}`,
                handle,
                name: row[1]?.trim() || handle,
                isFollowing: false,
                likes: 0,
                reposts: 0,
                replies: 0,
                lastInteraction: null,
                isHot: false,
              });
              addedCount++;
            } else {
              // Existing researcher - update name if provided
              const existing = existingByHandle.get(handleLower)!;
              if (row[1]?.trim()) {
                existingByHandle.set(handleLower, {
                  ...existing,
                  name: row[1].trim(),
                });
                updatedCount++;
              }
            }
          });

        const updated = Array.from(existingByHandle.values());
        calculateKPIs(updated);
        return updated;
      });

      // Show feedback
      toast({
        title: "Targets Uploaded",
        description: `Added ${addedCount} new researcher${addedCount !== 1 ? "s" : ""}${updatedCount > 0 ? `, updated ${updatedCount}` : ""}`,
      });
    },
    [calculateKPIs]
  );

  const handleFollowerUpload = useCallback(
    (data: string[][]) => {
      // Expect: handle or URL
      const followerHandles = new Set(
        data
          .slice(1)
          .map((row) => extractHandle(row[0]).toLowerCase())
          .filter((h) => h !== "")
      );

      // Update total followers count
      const newTotalFollowers = followerHandles.size;
      setTotalFollowers(newTotalFollowers);

      let newFollowerCount = 0;
      let matchedTargets = 0;

      setResearchers((prev) => {
        if (prev.length === 0) {
          toast({
            title: "No Targets",
            description: `Loaded ${newTotalFollowers} followers. Upload targets first to track matches.`,
            variant: "default",
          });
          return prev;
        }

        const updated = prev.map((r) => {
          const isNowFollowing = followerHandles.has(r.handle.toLowerCase());
          const wasFollowing = r.isFollowing;
          if (isNowFollowing && !wasFollowing) newFollowerCount++;
          if (isNowFollowing) matchedTargets++;
          return {
            ...r,
            previousIsFollowing: r.isFollowing,
            isFollowing: isNowFollowing,
            isHot: !wasFollowing && isNowFollowing ? true : r.isHot,
          };
        });

        // Generate alerts for new followers
        const newFollowAlerts: AlertItem[] = updated
          .filter((r) => r.isFollowing && !r.previousIsFollowing)
          .map((r) => ({
            id: `alert-follow-${r.id}-${Date.now()}`,
            handle: r.handle,
            name: r.name,
            type: "new_follow" as const,
            timestamp: new Date().toISOString(),
          }));

        setAlerts((prevAlerts) => [...newFollowAlerts, ...prevAlerts]);
        calculateKPIs(updated, newTotalFollowers);

        toast({
          title: "Followers Updated",
          description: `${newTotalFollowers} total followers. ${matchedTargets} targets reached${newFollowerCount > 0 ? `, ${newFollowerCount} new` : ""}.`,
        });

        return updated;
      });
    },
    [calculateKPIs]
  );

  const handleNotificationUpload = useCallback(
    async (data: string[][]) => {
      // Parse Twitter/X notification export format:
      // Column 0: Profile URL (e.g., https://x.com/username)
      // Column 4: Action text (e.g., "liked your post", "reposted your post")
      // Column 7: Reply indicator (e.g., "Replying to...")
      const rawNotifications = data
        .slice(1)
        .map((row) => {
          const handle = extractHandle(row[0]);
          const type = detectInteractionType(row[4] || "", row[7] || "");
          const rawRow = row.join("|"); // Join row for hash uniqueness
          return { handle: handle.toLowerCase(), type, rawRow };
        })
        .filter(
          (n): n is { handle: string; type: "like" | "repost" | "reply"; rawRow: string } =>
            n.handle !== "" && n.type !== null
        );

      if (rawNotifications.length === 0) {
        toast({
          title: "No Notifications Found",
          description: "Could not parse any notifications from the CSV. Check the format.",
          variant: "destructive",
        });
        return;
      }

      // Deduplicate against previously seen notifications (does NOT save hashes yet)
      const newNotifications = await processNotificationsWithDedup(rawNotifications);
      const skippedCount = rawNotifications.length - newNotifications.length;

      if (newNotifications.length === 0) {
        toast({
          title: "All Duplicates",
          description: `${skippedCount} notification${skippedCount !== 1 ? "s" : ""} already processed.`,
        });
        return;
      }

      // Get current researchers to match against
      // We need to do this outside setResearchers to properly track matched notifications
      setResearchers((prev) => {
        if (prev.length === 0) {
          toast({
            title: "No Targets",
            description: `Found ${newNotifications.length} new notifications. Upload targets first to track.`,
            variant: "default",
          });
          return prev;
        }

        // Find which notifications match our researchers
        const researcherHandles = new Set(prev.map((r) => r.handle.toLowerCase()));
        const matchedNotifications: ProcessedNotification[] = [];
        const unmatchedNotifications: ProcessedNotification[] = [];

        newNotifications.forEach((n) => {
          if (researcherHandles.has(n.handle)) {
            matchedNotifications.push(n);
          } else {
            unmatchedNotifications.push(n);
          }
        });

        // Only mark MATCHED notifications as processed (so unmatched can be retried after adding targets)
        if (matchedNotifications.length > 0) {
          markNotificationsAsProcessed(matchedNotifications);
        }

        // Count interactions from matched notifications
        const interactionCounts: Record<
          string,
          { likes: number; reposts: number; replies: number }
        > = {};

        matchedNotifications.forEach(({ handle, type }) => {
          if (!interactionCounts[handle]) {
            interactionCounts[handle] = { likes: 0, reposts: 0, replies: 0 };
          }
          if (type === "like") interactionCounts[handle].likes++;
          else if (type === "repost") interactionCounts[handle].reposts++;
          else if (type === "reply") interactionCounts[handle].replies++;
        });

        const matchedResearcherCount = Object.keys(interactionCounts).length;

        const updated = prev.map((r) => {
          const counts = interactionCounts[r.handle.toLowerCase()];
          if (!counts) return r;

          const newLikes = r.likes + counts.likes;
          const newReposts = r.reposts + counts.reposts;
          const newReplies = r.replies + counts.replies;
          const hasNewActivity =
            counts.likes > 0 || counts.reposts > 0 || counts.replies > 0;

          return {
            ...r,
            previousLikes: r.likes,
            previousReposts: r.reposts,
            previousReplies: r.replies,
            likes: newLikes,
            reposts: newReposts,
            replies: newReplies,
            lastInteraction: hasNewActivity
              ? new Date().toISOString()
              : r.lastInteraction,
            isHot: hasNewActivity,
          };
        });

        // Generate alerts for new interactions
        const newAlerts: AlertItem[] = [];
        matchedNotifications.forEach(({ handle, type }) => {
          const researcher = prev.find(
            (r) => r.handle.toLowerCase() === handle
          );
          if (researcher && type) {
            newAlerts.push({
              id: `alert-${type}-${researcher.id}-${Date.now()}-${Math.random()}`,
              handle: researcher.handle,
              name: researcher.name,
              type,
              timestamp: new Date().toISOString(),
            });
          }
        });

        setAlerts((prevAlerts) => [...newAlerts, ...prevAlerts]);
        calculateKPIs(updated);

        const desc = [
          `${matchedNotifications.length} matched (${matchedResearcherCount} targets)`,
        ];
        if (unmatchedNotifications.length > 0) {
          desc.push(`${unmatchedNotifications.length} unmatched`);
        }
        if (skippedCount > 0) {
          desc.push(`${skippedCount} duplicates`);
        }

        toast({
          title: "Notifications Processed",
          description: desc.join(", "),
        });

        return updated;
      });
    },
    [calculateKPIs]
  );

  // Add a single researcher manually
  const handleAddResearcher = useCallback(() => {
    const handle = extractHandle(newHandle);
    if (!handle) return;

    setResearchers((prev) => {
      // Check if already exists
      if (prev.some((r) => r.handle.toLowerCase() === handle.toLowerCase())) {
        return prev;
      }

      const newResearcher: Researcher = {
        id: `researcher-manual-${Date.now()}`,
        handle,
        name: handle,
        isFollowing: false,
        likes: 0,
        reposts: 0,
        replies: 0,
        lastInteraction: null,
        isHot: false,
      };

      const updated = [...prev, newResearcher];
      calculateKPIs(updated);
      return updated;
    });

    setNewHandle("");
  }, [newHandle, calculateKPIs]);

  // Delete a researcher
  const handleDeleteResearcher = useCallback(
    (id: string) => {
      setResearchers((prev) => {
        const updated = prev.filter((r) => r.id !== id);
        calculateKPIs(updated);
        return updated;
      });
    },
    [calculateKPIs]
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  GI Social Analytics
                </h1>
                <p className="text-sm text-muted-foreground">
                  AI Researcher Engagement Tracker
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {dbStatus !== "checking" && (
                <div
                  className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
                    dbStatus === "cloud"
                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                      : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                  }`}
                  title={
                    dbStatus === "cloud"
                      ? "Connected to Supabase cloud database"
                      : "Using local browser storage (data won't sync across devices)"
                  }
                >
                  {dbStatus === "cloud" ? (
                    <Cloud className="w-3 h-3" />
                  ) : (
                    <HardDrive className="w-3 h-3" />
                  )}
                  <span>{dbStatus === "cloud" ? "Cloud" : "Local"}</span>
                </div>
              )}
              <HowToUseGuide />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* KPIs */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard
              title="Targets Reached"
              value={`${kpis.targetsReached}%`}
              delta={kpis.targetsReachedDelta}
              subtitle={`${kpis.reachedCount} of ${kpis.totalTargets} targets`}
            />
            <KPICard
              title="Heavily Engaged"
              value={`${kpis.heavilyEngaged}%`}
              delta={kpis.heavilyEngagedDelta}
              subtitle="3+ interactions"
            />
            <KPICard
              title="Relevant Followership"
              value={`${kpis.relevantFollowership}%`}
              delta={kpis.relevantFollowershipDelta}
              subtitle={`${kpis.reachedCount} of ${kpis.totalFollowers} followers`}
            />
          </div>
        </section>

        {/* Newest Reached Section */}
        <section className="mb-8">
          <NewestReached researchers={researchers} />
        </section>

        {/* Uploads and Alerts */}
        <section className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <UploadSection
              title="Target Researchers"
              description="CSV with usernames or X profile URLs"
              onUpload={handleTargetUpload}
            />
            <UploadSection
              title="Follower List"
              description="CSV with usernames or X profile URLs"
              onUpload={handleFollowerUpload}
            />
            <UploadSection
              title="Recent Notifications"
              description="Twitter/X notification export CSV"
              onUpload={handleNotificationUpload}
            />
          </div>
        </section>

        {/* Alerts Panel */}
        {alerts.length > 0 && (
          <section className="mb-8">
            <AlertsPanel alerts={alerts} />
          </section>
        )}

        {/* Researcher Table */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">
                Target Researchers
              </h2>
              {researchers.length > 0 && (
                <span className="bg-muted text-muted-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                  {researchers.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="@handle or URL"
                value={newHandle}
                onChange={(e) => setNewHandle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddResearcher()}
                className="w-48 h-9"
              />
              <Button
                size="sm"
                onClick={handleAddResearcher}
                disabled={!newHandle.trim()}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
          <ResearcherTable
            researchers={researchers}
            onDelete={handleDeleteResearcher}
          />
        </section>
      </main>
    </div>
  );
};
