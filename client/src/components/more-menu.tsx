import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Briefcase, PiggyBank, Shield, BarChart2, Users, ShoppingBag, Wallet, Grid, RefreshCw } from 'lucide-react';
import { useMultipleExchangeRates } from '@/hooks/use-exchange-rates';

const CURRENCY_META: Record<string, { flag: string; name: string; symbol: string }> = {
  KES: { flag: '🇰🇪', name: 'Kenyan Shilling', symbol: 'KSh' },
  EUR: { flag: '🇪🇺', name: 'Euro', symbol: '€' },
  GBP: { flag: '🇬🇧', name: 'British Pound', symbol: '£' },
  NGN: { flag: '🇳🇬', name: 'Nigerian Naira', symbol: '₦' },
  GHS: { flag: '🇬🇭', name: 'Ghanaian Cedi', symbol: 'GH₵' },
  TZS: { flag: '🇹🇿', name: 'Tanzanian Shilling', symbol: 'TSh' },
  UGX: { flag: '🇺🇬', name: 'Ugandan Shilling', symbol: 'USh' },
  ZAR: { flag: '🇿🇦', name: 'South African Rand', symbol: 'R' },
  CAD: { flag: '🇨🇦', name: 'Canadian Dollar', symbol: 'CA$' },
  AUD: { flag: '🇦🇺', name: 'Australian Dollar', symbol: 'A$' },
  JPY: { flag: '🇯🇵', name: 'Japanese Yen', symbol: '¥' },
  CNY: { flag: '🇨🇳', name: 'Chinese Yuan', symbol: '¥' },
  INR: { flag: '🇮🇳', name: 'Indian Rupee', symbol: '₹' },
  AED: { flag: '🇦🇪', name: 'UAE Dirham', symbol: 'د.إ' },
  SAR: { flag: '🇸🇦', name: 'Saudi Riyal', symbol: '﷼' },
};

const COMING_SOON = [
  {
    icon: Briefcase,
    label: 'Business',
    description: 'Business accounts & payroll',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    icon: PiggyBank,
    label: 'Savings',
    description: 'Goal-based savings plans',
    color: 'from-pink-500 to-rose-600',
  },
  {
    icon: Shield,
    label: 'Insurance',
    description: 'Health & travel coverage',
    color: 'from-purple-500 to-violet-600',
  },
  {
    icon: BarChart2,
    label: 'Investments',
    description: 'Stocks, bonds & ETFs',
    color: 'from-amber-500 to-orange-600',
  },
  {
    icon: Users,
    label: 'Group Payments',
    description: 'Split bills & collect from groups',
    color: 'from-teal-500 to-cyan-600',
  },
  {
    icon: ShoppingBag,
    label: 'Merchant Pay',
    description: 'Pay at stores with GreenPay',
    color: 'from-red-500 to-pink-600',
  },
  {
    icon: Wallet,
    label: 'Crypto Wallet',
    description: 'Buy, sell & hold crypto',
    color: 'from-yellow-500 to-amber-600',
  },
];

function RatesPanel() {
  const { data, isLoading, refetch, isFetching } = useMultipleExchangeRates('USD');
  const rates: Record<string, number> = data?.rates || {};

  const displayCurrencies = Object.keys(CURRENCY_META).filter(
    code => rates[code] !== undefined
  );

  const formatRate = (rate: number) => {
    if (rate >= 100) return rate.toFixed(2);
    if (rate >= 1) return rate.toFixed(4);
    return rate.toFixed(6);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Live rates · 1 USD =</p>
        </div>
        <button
          onClick={() => refetch()}
          className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all ${isFetching ? 'animate-spin' : ''}`}
        >
          <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : displayCurrencies.length === 0 ? (
        <p className="text-xs text-center text-gray-400 py-4">
          Rates unavailable — check API key in settings
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {displayCurrencies.map(code => {
            const meta = CURRENCY_META[code];
            return (
              <div
                key={code}
                className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/60 rounded-xl px-3 py-2.5"
              >
                <span className="text-xl leading-none">{meta.flag}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 leading-tight">{code}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight truncate">
                    {meta.symbol} {formatRate(rates[code])}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface MoreMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MoreMenu({ open, onClose }: MoreMenuProps) {
  const [activeTab, setActiveTab] = useState<'rates' | 'features'>('rates');

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl flex flex-col"
            style={{ maxHeight: '82vh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">More</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Explore GreenPay features</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            {/* Tab Pills */}
            <div className="flex gap-2 px-5 pb-3 flex-shrink-0">
              <button
                onClick={() => setActiveTab('rates')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'rates'
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Rates
              </button>
              <button
                onClick={() => setActiveTab('features')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'features'
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                Features
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-5 pb-8">
              {activeTab === 'rates' && <RatesPanel />}

              {activeTab === 'features' && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                    Exciting new features coming soon to GreenPay
                  </p>
                  {COMING_SOON.map(({ icon: Icon, label, description, color }) => (
                    <div
                      key={label}
                      className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl"
                    >
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 shadow-md`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{description}</p>
                      </div>
                      <span className="text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-full flex-shrink-0">
                        Soon
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
