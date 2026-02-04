import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, ArrowRight } from "lucide-react";

interface AccessGateProps {
  onAccessGranted: () => void;
}

const ACCESS_CODE = "GI123";

export const AccessGate = ({ onAccessGranted }: AccessGateProps) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === ACCESS_CODE) {
      onAccessGranted();
    } else {
      setError(true);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-6">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            GI Social Analytics
          </h1>
          <p className="text-muted-foreground text-sm">
            Enter access code to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className={`transition-transform ${isShaking ? "animate-shake" : ""}`}>
            <Input
              type="password"
              placeholder="Access code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(false);
              }}
              className={`h-12 text-center text-lg tracking-widest bg-card border-border focus:border-primary ${
                error ? "border-destructive" : ""
              }`}
            />
          </div>
          {error && (
            <p className="text-destructive text-sm text-center">
              Invalid access code
            </p>
          )}
          <Button
            type="submit"
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          >
            Access Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>
      </div>
    </div>
  );
};
