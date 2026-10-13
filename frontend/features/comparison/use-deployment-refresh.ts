"use client";

import { useEffect } from "react";

import { deploymentChanged } from "./deployment-version";

const VERSION_CHECK_INTERVAL_MS = 60_000;

type VersionResponse = {
  deploymentId?: unknown;
};

export function useDeploymentRefresh(): void {
  useEffect(() => {
    const currentDeployment = document.documentElement.dataset.dplId ?? "";
    if (!currentDeployment) return;

    let checking = false;
    let disposed = false;

    const checkForNewDeployment = async () => {
      if (checking || disposed) return;
      checking = true;

      try {
        const response = await fetch("/api/version", { cache: "no-store" });
        if (!response.ok) return;

        const body = await response.json() as VersionResponse;
        const latestDeployment = typeof body.deploymentId === "string"
          ? body.deploymentId
          : "";

        if (!disposed && deploymentChanged(currentDeployment, latestDeployment)) {
          window.location.reload();
        }
      } catch {
        // A transient version-check failure must never interrupt the comparison.
      } finally {
        checking = false;
      }
    };

    const checkWhenVisible = () => {
      if (document.visibilityState === "visible") void checkForNewDeployment();
    };

    void checkForNewDeployment();
    window.addEventListener("focus", checkForNewDeployment);
    document.addEventListener("visibilitychange", checkWhenVisible);
    const interval = window.setInterval(checkForNewDeployment, VERSION_CHECK_INTERVAL_MS);

    return () => {
      disposed = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", checkForNewDeployment);
      document.removeEventListener("visibilitychange", checkWhenVisible);
    };
  }, []);
}
