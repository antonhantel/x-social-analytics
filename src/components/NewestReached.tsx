import { Researcher } from "@/types/researcher";
import { Flame } from "lucide-react";

interface NewestReachedProps {
  researchers: Researcher[];
}

export const NewestReached = ({ researchers }: NewestReachedProps) => {
  // Filter to show only "hot" researchers (newly reached/active)
  const hotResearchers = researchers.filter((r) => r.isHot).slice(0, 6);

  if (hotResearchers.length === 0) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">Newest Researchers Reached</h3>
      </div>
      <div className="flex flex-wrap gap-4">
        {hotResearchers.map((researcher) => (
          <div
            key={researcher.id}
            className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-accent/50 bg-accent/5 hover:bg-accent/10 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent/30 to-primary/30 border-2 border-accent flex items-center justify-center">
              <span className="text-lg font-bold text-foreground">
                {researcher.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground truncate max-w-[100px]">
                {researcher.name}
              </p>
              <p className="text-xs text-muted-foreground">@{researcher.handle}</p>
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="text-success">♥</span> {researcher.likes}
              </span>
              <span className="flex items-center gap-1">
                <span className="text-primary">↻</span> {researcher.reposts + researcher.replies}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
