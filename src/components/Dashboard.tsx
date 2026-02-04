import { useState, useCallback, useEffect } from "react";
import { KPICard } from "./KPICard";
import { UploadSection } from "./UploadSection";
import { ResearcherTable } from "./ResearcherTable";
import { AlertsPanel } from "./AlertsPanel";
import { NewestReached } from "./NewestReached";
import { ThemeToggle } from "./ThemeToggle";
import { Researcher, KPIData, AlertItem } from "@/types/researcher";
import { BarChart3, Target } from "lucide-react";

// Dummy data for demonstration
const DUMMY_RESEARCHERS: Researcher[] = [
  { id: "1", handle: "ylecun", name: "Yann LeCun", isFollowing: true, likes: 12, reposts: 3, replies: 5, lastInteraction: new Date().toISOString(), isHot: true, previousLikes: 8, previousReposts: 2, previousReplies: 3 },
  { id: "2", handle: "kaboris", name: "Kai-Fu Lee", isFollowing: true, likes: 8, reposts: 2, replies: 1, lastInteraction: new Date().toISOString(), isHot: true, previousLikes: 5, previousReposts: 1, previousReplies: 0 },
  { id: "3", handle: "sama", name: "Sam Altman", isFollowing: false, likes: 3, reposts: 1, replies: 0, lastInteraction: null, isHot: false },
  { id: "4", handle: "demaboris", name: "Demis Hassabis", isFollowing: true, likes: 15, reposts: 4, replies: 3, lastInteraction: new Date().toISOString(), isHot: true, previousLikes: 10, previousReposts: 2, previousReplies: 1 },
  { id: "5", handle: "fchollet", name: "François Chollet", isFollowing: true, likes: 6, reposts: 2, replies: 2, lastInteraction: new Date().toISOString(), isHot: false, previousLikes: 6, previousReposts: 2, previousReplies: 2 },
  { id: "6", handle: "jeffdean", name: "Jeff Dean", isFollowing: false, likes: 2, reposts: 0, replies: 1, lastInteraction: null, isHot: false },
  { id: "7", handle: "hardmaru", name: "David Ha", isFollowing: true, likes: 9, reposts: 3, replies: 4, lastInteraction: new Date().toISOString(), isHot: true, previousLikes: 5, previousReposts: 1, previousReplies: 2 },
  { id: "8", handle: "goodfellow_ian", name: "Ian Goodfellow", isFollowing: false, likes: 1, reposts: 0, replies: 0, lastInteraction: null, isHot: false },
  { id: "9", handle: "AndrewYNg", name: "Andrew Ng", isFollowing: true, likes: 11, reposts: 5, replies: 2, lastInteraction: new Date().toISOString(), isHot: false, previousLikes: 11, previousReposts: 5, previousReplies: 2 },
  { id: "10", handle: "ilozhinska", name: "Ilya Sutskever", isFollowing: true, likes: 7, reposts: 1, replies: 3, lastInteraction: new Date().toISOString(), isHot: true, previousLikes: 3, previousReposts: 0, previousReplies: 1 },
];

const DUMMY_ALERTS: AlertItem[] = [
  { id: "a1", handle: "ylecun", name: "Yann LeCun", type: "like", timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { id: "a2", handle: "demaboris", name: "Demis Hassabis", type: "new_follow", timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
  { id: "a3", handle: "hardmaru", name: "David Ha", type: "repost", timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { id: "a4", handle: "kaboris", name: "Kai-Fu Lee", type: "reply", timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
  { id: "a5", handle: "ilozhinska", name: "Ilya Sutskever", type: "like", timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
];

export const Dashboard = () => {
  const [researchers, setResearchers] = useState<Researcher[]>(DUMMY_RESEARCHERS);
  const [alerts, setAlerts] = useState<AlertItem[]>(DUMMY_ALERTS);
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
      // Skip header row, expect: handle, name
      const newResearchers: Researcher[] = data.slice(1).map((row, index) => ({
        id: `researcher-${index}-${Date.now()}`,
        handle: row[0]?.replace("@", "") || "",
        name: row[1] || row[0]?.replace("@", "") || "",
        isFollowing: false,
        likes: 0,
        reposts: 0,
        replies: 0,
        lastInteraction: null,
        isHot: false,
      }));

      setResearchers(newResearchers);
      calculateKPIs(newResearchers);
    },
    [calculateKPIs]
  );

  const handleFollowerUpload = useCallback(
    (data: string[][]) => {
      // Expect: handle
      const followerHandles = new Set(
        data.slice(1).map((row) => row[0]?.replace("@", "").toLowerCase())
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
      // Expect: handle, type (like/repost/reply)
      const interactions = data.slice(1).map((row) => ({
        handle: row[0]?.replace("@", "").toLowerCase(),
        type: row[1]?.toLowerCase() as "like" | "repost" | "reply",
      }));

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
            <ThemeToggle />
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
              description="CSV with handle, name columns"
              onUpload={handleTargetUpload}
            />
            <UploadSection
              title="Follower List"
              description="CSV with handle column"
              onUpload={handleFollowerUpload}
            />
            <UploadSection
              title="Recent Notifications"
              description="CSV with handle, type (like/repost/reply)"
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
