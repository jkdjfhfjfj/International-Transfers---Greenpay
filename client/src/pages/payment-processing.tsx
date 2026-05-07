import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WavyHeader } from "@/components/wavy-header";
import BottomNavigation from "@/components/bottom-navigation";

export default function PaymentProcessingPage() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'processing' | 'success' | 'failed' | 'timeout'>('processing');
  const [pollCount, setPollCount] = useState(0);
  const [reference, setReference] = useState<string>('');
  const [type, setType] = useState<string>('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get('reference');
    const typeParam = urlParams.get('type');
    if (refParam) setReference(refParam);
    if (typeParam) setType(typeParam);
  }, []);

  useEffect(() => {
    if (!reference) return;

    const pollInterval = setInterval(async () => {
      try {
        setPollCount(prev => prev + 1);
        const response = await fetch(`/api/transaction-status/${reference}`);
        const data = await response.json();

        if (data.success && data.status) {
          const s = data.status.toLowerCase();
          if (s === 'success' || s === 'completed') {
            setStatus('success');
            clearInterval(pollInterval);
            setTimeout(() => {
              if (type === 'virtual-card') setLocation('/virtual-card');
              else setLocation('/dashboard');
            }, 3000);
          } else if (s === 'failed' || s === 'cancelled') {
            setStatus('failed');
            clearInterval(pollInterval);
          }
        }

        if (pollCount >= 60) {
          setStatus('timeout');
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Status polling error:', error);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [reference, pollCount]);

  const handleTryAgain = () => {
    if (type === 'virtual-card') setLocation('/virtual-card');
    else setLocation('/dashboard');
  };

  const title =
    type === 'virtual-card' ? 'Card Purchase' :
    type === 'deposit' ? 'Deposit' : 'Payment';

  return (
    <div className="min-h-screen bg-background pb-20">
      <WavyHeader
        title={title}
        onBack={status !== 'processing' ? handleTryAgain : undefined}
      />

      <div className="flex items-center justify-center min-h-[calc(100vh-120px)] p-6">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {status === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center space-y-6"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="mx-auto w-20 h-20 flex items-center justify-center bg-primary/10 rounded-full"
                >
                  <Loader2 className="w-10 h-10 text-primary" />
                </motion.div>

                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-foreground">Processing Payment</h1>
                  <p className="text-muted-foreground">
                    Please wait while we confirm your M-Pesa payment...
                  </p>
                </div>

                <div className="bg-card p-4 rounded-xl border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Reference</p>
                  <p className="font-mono text-sm text-foreground break-all">{reference}</p>
                </div>

                <div className="space-y-3">
                  {[
                    'STK push sent to your phone',
                    'Waiting for M-Pesa confirmation',
                    'Activating your account',
                  ].map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                      className="flex items-center gap-3 text-sm text-muted-foreground"
                    >
                      <div className="w-2 h-2 bg-primary rounded-full shrink-0" />
                      {step}
                    </motion.div>
                  ))}
                </div>

                <motion.p
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-xs text-muted-foreground"
                >
                  This may take up to 2 minutes...
                </motion.p>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-center space-y-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto"
                >
                  <CheckCircle className="w-14 h-14 text-green-500" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <h1 className="text-2xl font-bold text-green-600">Payment Successful!</h1>
                  <p className="text-muted-foreground">
                    {type === 'virtual-card'
                      ? 'Your virtual card has been activated successfully.'
                      : 'Your payment has been processed successfully.'}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800"
                >
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Redirecting in 3 seconds...
                  </p>
                </motion.div>
              </motion.div>
            )}

            {(status === 'failed' || status === 'timeout') && (
              <motion.div
                key="failed"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-center space-y-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto"
                >
                  <XCircle className="w-14 h-14 text-red-500" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <h1 className="text-2xl font-bold text-red-600">
                    {status === 'timeout' ? 'Payment Timeout' : 'Payment Failed'}
                  </h1>
                  <p className="text-muted-foreground">
                    {status === 'timeout'
                      ? "We couldn't confirm your payment status. Contact support if you completed the payment."
                      : 'Your payment was not completed. Please try again.'}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-3"
                >
                  <Button
                    onClick={handleTryAgain}
                    className="w-full"
                    data-testid="button-try-again"
                  >
                    {type === 'virtual-card' ? 'Try Purchase Again' : 'Back to Dashboard'}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setLocation('/support')}
                  >
                    Contact Support
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}
