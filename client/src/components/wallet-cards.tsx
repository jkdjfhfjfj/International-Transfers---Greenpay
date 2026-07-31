import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Plus, Star, AlertTriangle, Lock, Building2 } from "lucide-react";
import type { Wallet } from "@/hooks/use-wallets";
import { formatNumber } from "@/lib/formatters";
import { useLocation } from "wouter";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', KES: 'KSh', UGX: 'UGX', GHS: '₵', NGN: '₦',
  ZAR: 'R', TZS: 'TSh', XOF: 'CFA', CDF: 'FC', XAF: 'FCFA',
  RWF: 'RF', SLE: 'Le', ZMW: 'ZK', EUR: '€', GBP: '£',
};

const CURRENCY_COLORS: Record<string, string> = {
  USD: 'from-emerald-500 via-green-500 to-teal-600',
  KES: 'from-red-500 via-red-400 to-orange-500',
  UGX: 'from-yellow-500 via-yellow-400 to-orange-500',
  GHS: 'from-red-600 via-orange-500 to-green-600',
  NGN: 'from-green-700 via-green-600 to-green-500',
  ZAR: 'from-blue-600 via-blue-500 to-yellow-500',
  TZS: 'from-cyan-600 via-cyan-500 to-blue-500',
  XOF: 'from-purple-600 via-purple-500 to-violet-500',
  CDF: 'from-sky-600 via-sky-500 to-blue-500',
  XAF: 'from-teal-600 via-teal-500 to-green-500',
  RWF: 'from-blue-700 via-blue-500 to-cyan-400',
  SLE: 'from-green-600 via-teal-500 to-green-400',
  ZMW: 'from-orange-500 via-orange-400 to-red-400',
  EUR: 'from-blue-700 via-indigo-600 to-blue-500',
  GBP: 'from-indigo-700 via-purple-600 to-indigo-500',
};

const CURRENCY_FLAGS: Record<string, string> = {
  USD: '🇺🇸', KES: '🇰🇪', UGX: '🇺🇬', GHS: '🇬🇭', NGN: '🇳🇬',
  ZAR: '🇿🇦', TZS: '🇹🇿', XOF: '🌍', CDF: '🇨🇩', XAF: '🌍',
  RWF: '🇷🇼', SLE: '🇸🇱', ZMW: '🇿🇲', EUR: '🇪🇺', GBP: '🇬🇧',
};

const VIRTUAL_ACCOUNT_LIVE = new Set(["USD", "GBP", "EUR"]);

const CURRENCY_NAMES: Record<string, string> = {
  USD: 'US Dollar', KES: 'Kenyan Shilling', UGX: 'Ugandan Shilling',
  GHS: 'Ghanaian Cedi', NGN: 'Nigerian Naira', ZAR: 'South African Rand',
  TZS: 'Tanzanian Shilling', XOF: 'West African CFA', CDF: 'Congolese Franc',
  XAF: 'Central African CFA', RWF: 'Rwandan Franc', SLE: 'Sierra Leonean Leone',
  ZMW: 'Zambian Kwacha', EUR: 'Euro', GBP: 'British Pound',
};

interface WalletCardsProps {
  wallets: Wallet[];
  onWalletSelect?: (wallet: Wallet) => void;
  selectedWalletId?: string;
  showBalance?: boolean;
  onToggleBalance?: () => void;
  onAddWallet?: () => void;
  showAdd?: boolean;
}

export default function WalletCards({
  wallets,
  onWalletSelect,
  selectedWalletId,
  showBalance = true,
  onToggleBalance,
  onAddWallet,
  showAdd = true,
}: WalletCardsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [, setLocation] = useLocation();

  // Sort: default wallet first, then rest
  const activeWallets = wallets
    .filter(w => w.isActive)
    .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));

  useEffect(() => {
    if (selectedWalletId) {
      const idx = activeWallets.findIndex(w => w.id === selectedWalletId);
      if (idx !== -1) setActiveIndex(idx);
    }
  }, [selectedWalletId]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const cardWidth = 272 + 12;
    const idx = Math.round(scrollLeft / cardWidth);
    setActiveIndex(Math.min(idx, activeWallets.length - 1));
    if (activeWallets[idx]) onWalletSelect?.(activeWallets[idx]);
  };

  const scrollTo = (idx: number) => {
    if (!scrollRef.current) return;
    const cardWidth = 272 + 12;
    scrollRef.current.scrollTo({ left: idx * cardWidth, behavior: "smooth" });
    setActiveIndex(idx);
    if (activeWallets[idx]) onWalletSelect?.(activeWallets[idx]);
  };

  return (
    <div className="space-y-3">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {activeWallets.map((wallet, i) => {
          const symbol = CURRENCY_SYMBOLS[wallet.currency] || wallet.currency;
          const color = CURRENCY_COLORS[wallet.currency] || 'from-gray-600 to-gray-700';
          const flag = CURRENCY_FLAGS[wallet.currency] || '💰';
          const name = wallet.label || CURRENCY_NAMES[wallet.currency] || wallet.currency;
          const balance = parseFloat(wallet.balance || "0");
          const hold = parseFloat(wallet.holdAmount || "0");
          const available = balance - hold;
          const isSelected = wallet.id === selectedWalletId || (!selectedWalletId && i === activeIndex);

          return (
            <motion.div
              key={wallet.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => { onWalletSelect?.(wallet); setActiveIndex(i); }}
              className={`
                snap-center flex-shrink-0 w-[272px] h-[152px] rounded-2xl relative overflow-hidden cursor-pointer
                transition-all duration-200
                ${isSelected ? 'ring-2 ring-white ring-offset-2 shadow-2xl scale-[1.02]' : 'shadow-lg hover:shadow-xl'}
              `}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${color}`} />
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_bottom_right,_white_0%,_transparent_70%)]" />
              <div className="absolute inset-0 opacity-5"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

              <div className="relative p-4 h-full flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xl">{flag}</span>
                      <span className="text-white/80 text-xs font-medium truncate max-w-[130px]">{name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-bold text-lg tracking-wider">{wallet.currency}</span>
                      {wallet.isDefault && (
                        <span className="bg-white/20 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Star className="w-2 h-2" /> DEFAULT
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {wallet.isSuspended && (
                      <span className="bg-red-500/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Lock className="w-2 h-2" /> SUSPENDED
                      </span>
                    )}
                    {hold > 0 && (
                      <span className="bg-yellow-500/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <AlertTriangle className="w-2 h-2" /> HOLD
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  {showBalance ? (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-white/70 text-xs">{symbol}</span>
                        <span className="text-white font-bold text-2xl tracking-tight">
                          {formatNumber(available, 2)}
                        </span>
                      </div>
                      {hold > 0 && (
                        <p className="text-white/50 text-[10px] mt-0.5">
                          {symbol}{formatNumber(hold, 2)} on hold
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-white font-bold text-2xl tracking-widest">••••••</span>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-white/50 text-[10px]">Available balance</p>
                    <button
                      onClick={e => { e.stopPropagation(); setLocation(`/virtual-accounts?currency=${wallet.currency}`); }}
                      className="text-white/85 hover:text-white text-[10px] font-semibold bg-white/15 rounded-full px-2 py-1 flex items-center gap-1"
                    >
                      <Building2 className="w-3 h-3" /> {VIRTUAL_ACCOUNT_LIVE.has(wallet.currency) ? "Account" : "Soon"}
                    </button>
                    {onToggleBalance && (
                      <button
                        onClick={e => { e.stopPropagation(); onToggleBalance?.(); }}
                        className="text-white/60 hover:text-white transition-colors"
                      >
                        {showBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {showAdd && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onAddWallet || (() => setLocation("/settings"))}
            className="snap-center flex-shrink-0 w-[272px] h-[152px] rounded-2xl border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Add Wallet</p>
            <p className="text-xs text-muted-foreground/60">15 currencies supported</p>
          </motion.div>
        )}
      </div>

      {activeWallets.length > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {activeWallets.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={`transition-all duration-200 rounded-full ${
                i === activeIndex
                  ? 'w-5 h-1.5 bg-primary'
                  : 'w-1.5 h-1.5 bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
