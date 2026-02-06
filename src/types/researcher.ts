export type EngagementLevel = "target" | "engaged" | "hot";

export interface Researcher {
  id: string;
  handle: string;
  name: string;
  isFollowing: boolean;
  likes: number;
  reposts: number;
  replies: number;
  lastInteraction: string | null;
  isHot: boolean;
  engagementLevel: EngagementLevel;
  previousLikes?: number;
  previousReposts?: number;
  previousReplies?: number;
  previousIsFollowing?: boolean;
}

// Helper to calculate engagement level
export const getEngagementLevel = (r: Researcher): EngagementLevel => {
  const totalInteractions = r.likes + r.reposts + r.replies;
  if (totalInteractions >= 3) return "hot";
  if (r.isFollowing || totalInteractions > 0) return "engaged";
  return "target";
};

export interface KPIData {
  targetsReached: number;
  targetsReachedDelta: number;
  heavilyEngaged: number;
  heavilyEngagedDelta: number;
  relevantFollowership: number;
  relevantFollowershipDelta: number;
  totalTargets: number;
  totalFollowers: number;
  reachedCount: number;
}

export interface AlertItem {
  id: string;
  handle: string;
  name: string;
  type: 'new_follow' | 'like' | 'repost' | 'reply';
  timestamp: string;
}
