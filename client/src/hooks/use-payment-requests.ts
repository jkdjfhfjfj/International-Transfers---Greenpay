import { useQuery } from '@tanstack/react-query';
import { useAuth } from './use-auth';

export function usePaymentRequests() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['payment-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return { requests: [] };
      const response = await fetch(`/api/payment-requests/${user.id}`);
      const data = await response.json();
      const list = data.requests || data.paymentRequests || [];
      return { requests: list };
    },
    enabled: !!user?.id,
  });
}

export function useIncomingPaymentRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['payment-requests-received', user?.id],
    queryFn: async () => {
      if (!user?.id) return { requests: [] };
      const response = await fetch('/api/payment-requests-received');
      if (!response.ok) return { requests: [] };
      const data = await response.json();
      const list = data.requests || data.paymentRequests || [];
      return { requests: list };
    },
    enabled: !!user?.id,
  });
}