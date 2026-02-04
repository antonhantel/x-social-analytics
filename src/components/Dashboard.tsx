import { useState, useCallback, useEffect } from "react";
import { KPICard } from "./KPICard";
import { UploadSection } from "./UploadSection";
import { ResearcherTable } from "./ResearcherTable";
import { AlertsPanel } from "./AlertsPanel";
import { NewestReached } from "./NewestReached";
import { ThemeToggle } from "./ThemeToggle";
import { HowToUseGuide } from "./HowToUseGuide";
import { Researcher, KPIData, AlertItem } from "@/types/researcher";
import { BarChart3, Target } from "lucide-react";

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
  const [kpis, setKpis] = useState<KPIData>({
    targetsReached: 0,
    targetsReachedDelta: 0,
    heavilyEngaged: 0,
    heavilyEngagedDelta: 0,
    relevantFollowership: 0,
    relevantFollowershipDelta: 0,
    totalTargets: 0,
  });

  const calculateKPIs = useCallback((data: Researcher[]) => {
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

    setKpis({
      targetsReached: total > 0 ? Math.round((reached / total) * 100) : 0,
      targetsReachedDelta:
        total > 0 ? Math.round(((reached - prevReached) / total) * 100) : 0,
      heavilyEngaged: total > 0 ? Math.round((engaged / total) * 100) : 0,
      heavilyEngagedDelta:
        total > 0 ? Math.round(((engaged - prevEngaged) / total) * 100) : 0,
      relevantFollowership: reached,
      relevantFollowershipDelta: reached - prevReached,
      totalTargets: total,
    });
  }, []);

  // Calculate KPIs on initial load with dummy data
  useEffect(() => {
    calculateKPIs(researchers);
  }, []);

  const handleTargetUpload = useCallback(
    (data: string[][]) => {
      // Skip header row, expect: handle (or URL), optional name
      const newResearchers: Researcher[] = data
        .slice(1)
        .filter((row) => row[0] && row[0].trim() !== "")
        .map((row, index) => {
          const handle = extractHandle(row[0]);
          return {
            id: `researcher-${index}-${Date.now()}`,
            handle,
            name: row[1]?.trim() || handle,
            isFollowing: false,
            likes: 0,
            reposts: 0,
            replies: 0,
            lastInteraction: null,
            isHot: false,
          };
        });

      setResearchers(newResearchers);
      setAlerts([]);
      calculateKPIs(newResearchers);
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

      setResearchers((prev) => {
        const updated = prev.map((r) => ({
          ...r,
          previousIsFollowing: r.isFollowing,
          isFollowing: followerHandles.has(r.handle.toLowerCase()),
          isHot:
            !r.isFollowing && followerHandles.has(r.handle.toLowerCase())
              ? true
              : r.isHot,
        }));

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
        calculateKPIs(updated);
        return updated;
      });
    },
    [calculateKPIs]
  );

  const handleNotificationUpload = useCallback(
    (data: string[][]) => {
      // Parse Twitter/X notification export format:
      // Column 0: Profile URL (e.g., https://x.com/username)
      // Column 4: Action text (e.g., "liked your post", "reposted your post")
      // Column 7: Reply indicator (e.g., "Replying to...")
      const interactions = data
        .slice(1)
        .map((row) => {
          const handle = extractHandle(row[0]);
          const type = detectInteractionType(row[4] || "", row[7] || "");
          return { handle: handle.toLowerCase(), type };
        })
        .filter(({ handle, type }) => handle !== "" && type !== null) as Array<{
        handle: string;
        type: "like" | "repost" | "reply";
      }>;

      const interactionCounts: Record<
        string,
        { likes: number; reposts: number; replies: number }
      > = {};

      interactions.forEach(({ handle, type }) => {
        if (!handle) return;
        if (!interactionCounts[handle]) {
          interactionCounts[handle] = { likes: 0, reposts: 0, replies: 0 };
        }
        if (type === "like") interactionCounts[handle].likes++;
        else if (type === "repost") interactionCounts[handle].reposts++;
        else if (type === "reply") interactionCounts[handle].replies++;
      });

      setResearchers((prev) => {
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
        interactions.forEach(({ handle, type }) => {
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
            <div className="flex items-center gap-1">
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
              subtitle={`${kpis.relevantFollowership} of ${kpis.totalTargets} following`}
            />
            <KPICard
              title="Heavily Engaged"
              value={`${kpis.heavilyEngaged}%`}
              delta={kpis.heavilyEngagedDelta}
              subtitle="3+ interactions"
            />
            <KPICard
              title="Relevant Followership"
              value={`${kpis.relevantFollowership}`}
              delta={kpis.relevantFollowershipDelta}
              subtitle="AI researchers following"
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
          <div className="flex items-center gap-2 mb-4">
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
          <ResearcherTable researchers={researchers} />
        </section>
      </main>
    </div>
  );
};
