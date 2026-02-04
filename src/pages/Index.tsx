import { useState } from "react";
import { AccessGate } from "@/components/AccessGate";
import { Dashboard } from "@/components/Dashboard";

const Index = () => {
  const [hasAccess, setHasAccess] = useState(false);

  if (!hasAccess) {
    return <AccessGate onAccessGranted={() => setHasAccess(true)} />;
  }

  return <Dashboard />;
};

export default Index;
