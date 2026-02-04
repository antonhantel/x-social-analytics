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
              Upload a CSV file with two columns: <code className="bg-muted px-1 rounded">handle</code> and <code className="bg-muted px-1 rounded">name</code>. 
              This is your list of AI researchers you want to track.
            </p>
            <div className="bg-muted p-2 rounded text-xs font-mono">
              handle,name<br />
              ylecun,Yann LeCun<br />
              AndrewYNg,Andrew Ng
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">2. Upload Follower List</h4>
            <p className="text-muted-foreground">
              Upload a CSV with a single <code className="bg-muted px-1 rounded">handle</code> column containing your current followers. 
              This updates the "Following" status for each target.
            </p>
            <div className="bg-muted p-2 rounded text-xs font-mono">
              handle<br />
              ylecun<br />
              demis_hassabis
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">3. Upload Recent Notifications</h4>
            <p className="text-muted-foreground">
              Upload a CSV with <code className="bg-muted px-1 rounded">handle</code> and <code className="bg-muted px-1 rounded">type</code> columns. 
              Type can be: <code className="bg-muted px-1 rounded">like</code>, <code className="bg-muted px-1 rounded">repost</code>, or <code className="bg-muted px-1 rounded">reply</code>.
            </p>
            <div className="bg-muted p-2 rounded text-xs font-mono">
              handle,type<br />
              ylecun,like<br />
              AndrewYNg,repost
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
