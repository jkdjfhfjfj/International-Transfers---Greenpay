import { useEffect, useState } from "react";
import { apiRequest, setMaintenanceState } from "@/lib/queryClient";

type SettingValue = { value: string };

interface SystemSettings {
  general?: {
    maintenance_mode?: { value: string };
    maintenance_message?: { value: string };
    maintenance_title?: { value: string };
    maintenance_estimated_time?: { value: string };
    maintenance_affected_services?: { value: string };
    maintenance_severity?: { value: string };
    maintenance_started_at?: { value: string };
    maintenance_status_label?: { value: string };
    support_email?: { value: string };
    [key: string]: SettingValue | undefined;
  };
  platform?: {
    maintenance_mode?: { value: string };
    maintenance_message?: { value: string };
    maintenance_title?: { value: string };
    maintenance_estimated_time?: { value: string };
    maintenance_affected_services?: { value: string };
    maintenance_severity?: { value: string };
    maintenance_started_at?: { value: string };
    maintenance_status_label?: { value: string };
    support_email?: { value: string };
    [key: string]: SettingValue | undefined;
  };
  security?: {
    pin_required?: { value: string };
    two_factor_required?: { value: string };
    kyc_auto_approval?: { value: string };
  };
  messaging?: {
    enable_otp_messages?: { value: string };
    otp_email_enabled?: { value: string };
    otp_sms_enabled?: { value: string };
    otp_whatsapp_enabled?: { value: string };
  };
  [key: string]: any;
}

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await apiRequest("GET", "/api/system-settings");
        const data = await response.json();
        setSettings(data);

        const maintenanceSetting =
          data?.general?.maintenance_mode?.value ??
          data?.platform?.maintenance_mode?.value;
        const maintenanceMessage =
          data?.general?.maintenance_message?.value ??
          data?.platform?.maintenance_message?.value;
        setMaintenanceState({
          active: String(maintenanceSetting) === "true",
          message: maintenanceMessage,
        });
      } catch (error) {
        console.error("Failed to fetch system settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch immediately
    fetchSettings();

    // Poll every 30 seconds
    const interval = setInterval(fetchSettings, 30000);

    return () => clearInterval(interval);
  }, []);

  const getMaintenanceMode = () => {
    return (
      settings?.general?.maintenance_mode?.value === 'true' ||
      settings?.platform?.maintenance_mode?.value === 'true'
    );
  };

  const getMaintenanceMessage = () => {
    return (
      settings?.general?.maintenance_message?.value ||
      settings?.platform?.maintenance_message?.value ||
      "System maintenance in progress"
    );
  };

  const getMaintenanceValue = (key: string, fallback = "") => {
    const generalValue = settings?.general?.[key]?.value;
    const platformValue = settings?.platform?.[key]?.value;
    return generalValue || platformValue || fallback;
  };

  const getMaintenanceTitle = () =>
    getMaintenanceValue("maintenance_title", "We’ll be back shortly");

  const getMaintenanceEstimatedTime = () =>
    getMaintenanceValue("maintenance_estimated_time", "We expect to be back soon");

  const getMaintenanceAffectedServices = () =>
    getMaintenanceValue(
      "maintenance_affected_services",
      "Wallets and transfers\nDeposits and withdrawals\nCrypto services",
    );

  const getMaintenanceSeverity = () =>
    getMaintenanceValue("maintenance_severity", "moderate");

  const getMaintenanceStartedAt = () =>
    getMaintenanceValue("maintenance_started_at", "");

  const getMaintenanceStatusLabel = () =>
    getMaintenanceValue("maintenance_status_label", "Maintenance in progress");

  const getPinRequired = () => {
    return settings?.security?.pin_required?.value === 'true';
  };

  const getTwoFactorRequired = () => {
    return settings?.security?.two_factor_required?.value === 'true';
  };

  return {
    settings,
    isLoading,
    isLoaded: !isLoading,
    getMaintenanceMode,
    getMaintenanceMessage,
    getMaintenanceTitle,
    getMaintenanceEstimatedTime,
    getMaintenanceAffectedServices,
    getMaintenanceSeverity,
    getMaintenanceStartedAt,
    getMaintenanceStatusLabel,
    getPinRequired,
    getTwoFactorRequired,
  };
}
