import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

export interface Wallet {
  id: string;
  userId: string;
  currency: string;
  label: string | null;
  balance: string;
  holdAmount: string;
  withdrawalHoldAmount?: string;
  isDefault: boolean;
  isActive: boolean;
  isSuspended: boolean;
  suspendReason: string | null;
  createdAt: string;
  updatedAt: string;
  availableBalance: number;
  currencyMeta?: {
    name: string;
    flag: string;
    color: string;
    channel: string;
    gateway: string;
  };
}

export interface CurrencyMeta {
  code: string;
  name: string;
  flag: string;
  color: string;
  gateway: string;
  channel: string;
  correspondents?: Array<{ id: string; label: string }>;
  countryName: string;
}

export function useWallets() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<{ wallets: Wallet[] }>({
    queryKey: ["/api/wallets"],
    queryFn: async () => {
      const r = await apiRequest("GET", "/api/wallets");
      return r.json();
    },
    enabled: !!user?.id,
  });

  const wallets = data?.wallets || [];
  const defaultWallet = wallets.find(w => w.isDefault) || wallets[0] || null;
  const activeWallets = wallets.filter(w => w.isActive && !w.isSuspended);

  const setDefaultMutation = useMutation({
    mutationFn: async (walletId: string) => {
      const r = await apiRequest("PUT", `/api/wallets/${walletId}/default`);
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
    },
  });

  const totalUSDValue = wallets.reduce((sum, w) => {
    return sum + Math.max(0, parseFloat(w.balance || "0") - parseFloat(w.holdAmount || "0") - parseFloat(w.withdrawalHoldAmount || "0"));
  }, 0);

  return {
    wallets,
    activeWallets,
    defaultWallet,
    isLoading,
    refetch,
    setDefault: setDefaultMutation.mutate,
    isSettingDefault: setDefaultMutation.isPending,
    totalUSDValue,
  };
}

export function useCurrencies() {
  const { data, isLoading } = useQuery<{ currencies: CurrencyMeta[] }>({
    queryKey: ["/api/currencies"],
    queryFn: async () => {
      const r = await apiRequest("GET", "/api/currencies");
      return r.json();
    },
  });

  return {
    currencies: data?.currencies || [],
    isLoading,
  };
}

export function useNexusDeposit() {
  const queryClient = useQueryClient();

  const initiateMutation = useMutation({
    mutationFn: async (params: {
      walletId: string;
      currency: string;
      amount: number;
      phone?: string;
      email?: string;
      correspondent?: string;
    }) => {
      const r = await apiRequest("POST", "/api/deposit/nexuspay", params);
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || data.error || "Deposit failed");
      return data;
    },
  });

  const pollStatus = async (reference: string) => {
    const r = await apiRequest("GET", `/api/deposit/nexuspay/status/${reference}`);
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || "Status check failed");
    if (data.status === "completed") {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    }
    return data;
  };

  return {
    initiate: initiateMutation.mutateAsync,
    isInitiating: initiateMutation.isPending,
    pollStatus,
  };
}

export function useWalletExchange() {
  const queryClient = useQueryClient();

  const exchangeMutation = useMutation({
    mutationFn: async (params: {
      fromWalletId: string;
      toWalletId: string;
      amount: number;
    }) => {
      const r = await apiRequest("POST", "/api/exchange/swap", params);
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || "Exchange failed");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
  });

  return {
    exchange: exchangeMutation.mutateAsync,
    isExchanging: exchangeMutation.isPending,
  };
}
