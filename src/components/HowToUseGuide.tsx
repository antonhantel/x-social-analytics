import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const HowToUseGuide = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="w-9 h-9">
          <HelpCircle className="h-4 w-4" />
          <span className="sr-only">How to use</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>How to Use GI Social Analytics</DialogTitle>
          <DialogDescription>
            Track AI researcher engagement with your Twitter/X account
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">1. Upload Target Researchers</h4>
            <p className="text-muted-foreground">
              Upload a CSV with Twitter/X usernames (or profile URLs). Optionally include a name column.
            </p>
            <div className="bg-muted p-2 rounded text-xs font-mono">
              handle,name<br />
              ylecun,Yann LeCun<br />
              https://x.com/AndrewYNg,Andrew Ng
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">2. Upload Follower List</h4>
            <p className="text-muted-foreground">
              Upload a CSV with usernames or profile URLs of your current followers.
              This updates the "Following" status for each target.
            </p>
            <div className="bg-muted p-2 rounded text-xs font-mono">
              handle<br />
              ylecun<br />
              https://x.com/demis_hassabis
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">3. Upload Recent Notifications</h4>
            <p className="text-muted-foreground">
              Upload a Twitter/X notification export CSV. The system auto-detects likes, reposts, and replies from column data.
            </p>
            <div className="bg-muted p-2 rounded text-xs font-mono text-[10px]">
              Col 1: https://x.com/user<br />
              Col 5: "liked your post" or "reposted..."<br />
              Col 8: "Replying to..." (for replies)
            </div>
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <h4 className="font-semibold text-foreground">Understanding the Dashboard</h4>
            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
              <li><span className="text-accent font-medium">Hot</span> researchers have recent new activity</li>
              <li><span className="text-success font-medium">Reached</span> means they're following you</li>
              <li>KPIs show progress vs. previous upload</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
