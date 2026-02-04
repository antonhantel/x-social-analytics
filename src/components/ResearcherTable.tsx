import { Researcher } from "@/types/researcher";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X, Flame, Heart, Repeat2, MessageCircle } from "lucide-react";

interface ResearcherTableProps {
  researchers: Researcher[];
}

export const ResearcherTable = ({ researchers }: ResearcherTableProps) => {
  if (researchers.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <p className="text-muted-foreground">
          No researchers added yet. Upload a target list to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground font-medium">Researcher</TableHead>
            <TableHead className="text-muted-foreground font-medium text-center">Following</TableHead>
            <TableHead className="text-muted-foreground font-medium text-center">
              <div className="flex items-center justify-center gap-1">
                <Heart className="w-3 h-3" /> Likes
              </div>
            </TableHead>
            <TableHead className="text-muted-foreground font-medium text-center">
              <div className="flex items-center justify-center gap-1">
                <Repeat2 className="w-3 h-3" /> Reposts
              </div>
            </TableHead>
            <TableHead className="text-muted-foreground font-medium text-center">
              <div className="flex items-center justify-center gap-1">
                <MessageCircle className="w-3 h-3" /> Replies
              </div>
            </TableHead>
            <TableHead className="text-muted-foreground font-medium">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {researchers.map((researcher) => (
            <TableRow key={researcher.id} className="border-border hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center gap-3">
                  {researcher.isHot && (
                    <Flame className="w-4 h-4 text-accent animate-pulse" />
                  )}
                  <div>
                    <p className="font-medium text-foreground">{researcher.name}</p>
                    <p className="text-sm text-muted-foreground">@{researcher.handle}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-center">
                {researcher.isFollowing ? (
                  <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-success/10">
                    <Check className="w-4 h-4 text-success" />
                  </div>
                ) : (
                  <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </TableCell>
              <TableCell className="text-center">
                <span className="text-foreground font-medium">{researcher.likes}</span>
                {researcher.previousLikes !== undefined && researcher.likes > researcher.previousLikes && (
                  <span className="text-success text-xs ml-1">
                    +{researcher.likes - researcher.previousLikes}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-center">
                <span className="text-foreground font-medium">{researcher.reposts}</span>
                {researcher.previousReposts !== undefined && researcher.reposts > researcher.previousReposts && (
                  <span className="text-success text-xs ml-1">
                    +{researcher.reposts - researcher.previousReposts}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-center">
                <span className="text-foreground font-medium">{researcher.replies}</span>
                {researcher.previousReplies !== undefined && researcher.replies > researcher.previousReplies && (
                  <span className="text-success text-xs ml-1">
                    +{researcher.replies - researcher.previousReplies}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {researcher.isHot ? (
                  <Badge className="bg-accent/10 text-accent border-accent/20 hover:bg-accent/20">
                    Hot
                  </Badge>
                ) : researcher.isFollowing ? (
                  <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20">
                    Reached
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-muted text-muted-foreground">
                    Target
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
