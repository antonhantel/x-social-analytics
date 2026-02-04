import { AlertItem } from "@/types/researcher";
import { Flame, UserPlus, Heart, Repeat2, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AlertsPanelProps {
  alerts: AlertItem[];
}

const getAlertIcon = (type: AlertItem["type"]) => {
  switch (type) {
    case "new_follow":
      return <UserPlus className="w-4 h-4 text-success" />;
    case "like":
      return <Heart className="w-4 h-4 text-destructive" />;
    case "repost":
      return <Repeat2 className="w-4 h-4 text-primary" />;
    case "reply":
      return <MessageCircle className="w-4 h-4 text-accent" />;
  }
};

const getAlertLabel = (type: AlertItem["type"]) => {
  switch (type) {
    case "new_follow":
      return "started following";
    case "like":
      return "liked a post";
    case "repost":
      return "reposted";
    case "reply":
      return "replied";
  }
};

export const AlertsPanel = ({ alerts }: AlertsPanelProps) => {
  if (alerts.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-accent" />
          <h3 className="text-foreground font-semibold">Hot Activity</h3>
        </div>
        <p className="text-muted-foreground text-sm">
          No recent activity from target researchers.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-accent" />
        <h3 className="text-foreground font-semibold">Hot Activity</h3>
        <span className="bg-accent/10 text-accent text-xs font-medium px-2 py-0.5 rounded-full">
          {alerts.length}
        </span>
      </div>
      <div className="space-y-3">
        {alerts.slice(0, 5).map((alert) => (
          <div
            key={alert.id}
            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border/50"
          >
            {getAlertIcon(alert.type)}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate">
                <span className="font-medium">@{alert.handle}</span>{" "}
                <span className="text-muted-foreground">{getAlertLabel(alert.type)}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
