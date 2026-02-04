import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  delta: number;
  subtitle?: string;
}

export const KPICard = ({ title, value, delta, subtitle }: KPICardProps) => {
  const isPositive = delta > 0;
  const isNeutral = delta === 0;

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors">
      <p className="text-muted-foreground text-sm font-medium mb-1">{title}</p>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium ${
            isNeutral
              ? "bg-muted text-muted-foreground"
              : isPositive
              ? "bg-success/10 text-success"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {isNeutral ? (
            <Minus className="w-3 h-3" />
          ) : isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          <span>{isPositive ? "+" : ""}{delta}%</span>
        </div>
      </div>
    </div>
  );
};
