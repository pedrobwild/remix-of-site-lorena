import { useEffect, useState } from "react";
import { subscribeRadarCollections } from "@/lib/assistant/radarRealtime";

export function useRadarCollectionsUpdates(enabled = true) {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    return subscribeRadarCollections(() => setRevision((value) => value + 1));
  }, [enabled]);
  return revision;
}