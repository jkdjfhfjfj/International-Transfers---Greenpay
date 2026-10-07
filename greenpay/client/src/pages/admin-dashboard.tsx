import { useEffect } from "react";
import { useLocation } from "wouter";
export default function AdminDashboardOld() {
  const [, setLocation] = useLocation();
  useEffect(() => { setLocation("/admin/dashboard"); }, []);
  return null;
}
