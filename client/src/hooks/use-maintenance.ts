import { useSyncExternalStore } from "react";
import {
  getMaintenanceState,
  subscribeToMaintenance,
} from "@/lib/queryClient";

export function useMaintenanceState() {
  return useSyncExternalStore(
    subscribeToMaintenance,
    getMaintenanceState,
    getMaintenanceState,
  );
}