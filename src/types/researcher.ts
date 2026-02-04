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
  previousLikes?: number;
  previousReposts?: number;
  previousReplies?: number;
  previousIsFollowing?: boolean;
}

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
