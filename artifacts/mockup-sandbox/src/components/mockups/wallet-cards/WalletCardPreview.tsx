import { useState } from "react";
import { AlertTriangle, Building2, Eye, EyeOff, Lock, Star } from "lucide-react";
import "./_group.css";

const demoWallet = {
  currency: "USD",
  label: "US Dollar",
  balance: "2430.75",
  holdAmount: "85.25",
  withdrawalHoldAmount: "210.00",
  availableBalance: 2135.5,
  isDefault: true,
  isSuspended: false,
};

const currencyColors: Record<string, string> = {
  USD: "from-emerald-500 via-green-500 to-teal-600",
};

const currencyFlags: Record<string, string> = {
  USD: "🇺🇸",
};

const currencySymbols: Record<string, string> = {
  USD: "$",
};

function formatNumber(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function WalletCardPreview() {
  const [showBalance, setShowBalance] = useState(true);
  const balance = Number.parseFloat(demoWallet.balance);
  const hold = Number.parseFloat(demoWallet.holdAmount);
  const withdrawalHold = Number.parseFloat(demoWallet.withdrawalHoldAmount);
  const available = demoWallet.availableBalance;
  const symbol = currencySymbols[demoWallet.currency];

  return (
    <main className="min-h-screen bg-background p-4 text-foreground">
      <h1 className="mb-3 text-sm font-semibold">Wallet cards</h1>
      <div className="w-full overflow-x-auto pb-1">
        <div
          className="group relative min-h-[180px] w-[272px] cursor-pointer overflow-hidden rounded-2xl border-2 border-white/80 shadow-2xl"
          role="group"
          aria-label="US Dollar wallet card"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${currencyColors[demoWallet.currency]}`} />
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_bottom_right,_white_0%,_transparent_70%)]" />
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            }}
          />

          <div className="relative flex min-h-[180px] flex-col justify-between p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="mb-0.5 flex items-center gap-1.5">
                  <span className="text-xl">{currencyFlags[demoWallet.currency]}</span>
                  <span className="max-w-[130px] truncate text-xs font-medium text-white/80">
                    {demoWallet.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold tracking-wider text-white">
                    {demoWallet.currency}
                  </span>
                  {demoWallet.isDefault && (
                    <span className="flex items-center gap-0.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      <Star className="h-2 w-2" /> DEFAULT
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {demoWallet.isSuspended && (
                  <span className="flex items-center gap-0.5 rounded-full bg-red-500/80 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    <Lock className="h-2 w-2" /> SUSPENDED
                  </span>
                )}
                {hold > 0 && (
                  <span className="flex items-center gap-0.5 rounded-full bg-yellow-500/80 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    <AlertTriangle className="h-2 w-2" /> HOLD
                  </span>
                )}
              </div>
            </div>

            <div>
              {showBalance ? (
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-white/70">{symbol}</span>
                    <span className="text-2xl font-bold tracking-tight text-white transition-all duration-200 group-hover:tracking-normal group-hover:drop-shadow-md">
                      {formatNumber(available)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[9px] leading-3 text-white/55">
                    Total {symbol}{formatNumber(balance)} · On hold {symbol}{formatNumber(hold)}
                    <span className="block">
                      Withdrawal reserve {symbol}{formatNumber(withdrawalHold)}
                    </span>
                  </p>
                </div>
              ) : (
                <div>
                  <span className="text-2xl font-bold tracking-widest text-white">••••••</span>
                  <p className="mt-0.5 text-[9px] text-white/55">
                    Total · On hold · Withdrawal reserve hidden
                  </p>
                </div>
              )}
              <div className="mt-1 flex items-center justify-between">
                <p className="text-[10px] text-white/50">Available balance</p>
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[10px] font-semibold text-white/85 hover:text-white"
                >
                  <Building2 className="h-3 w-3" />
                  Account
                </button>
                <button
                  type="button"
                  onClick={() => setShowBalance(value => !value)}
                  className="text-white/60 transition-colors hover:text-white"
                  aria-label={showBalance ? "Hide balance" : "Show balance"}
                >
                  {showBalance ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 max-w-[272px] text-xs text-muted-foreground">
        Available, total, on-hold, and withdrawal-reserve information stays inside the card.
      </p>
    </main>
  );
}
