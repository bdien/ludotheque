import { useEffect } from "react";
import { Loading } from "../components/loading";
import { useGlobalStore } from "../hooks/global_store";
import { NotFound } from "./not_found";

export function PlanningRedirect() {
  const info = useGlobalStore((state) => state.info);

  // Spec: show loading while info not ready (though App.tsx blocks before routing)
  if (!info) return <Loading />;

  const url = info.planning_url;

  useEffect(() => {
    if (url) {
      window.location.replace(url);
    }
  }, [url]);

  if (!url) return <NotFound />;

  return <Loading />;
}
