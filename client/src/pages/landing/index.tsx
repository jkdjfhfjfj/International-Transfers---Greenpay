import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useLocation } from "wouter";
import {
  ArrowRight, Send, CreditCard, Zap, Shield, Globe, Phone,
  Star, ChevronRight, Menu, X, Check, TrendingUp, Users, Clock,
  RefreshCcw, Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { label: "Send Money", href: "/features/send-money" },
  { label: "Virtual Cards", href: "/features/virtual-cards" },
  { label: "Exchange Rates", href: "/features/exchange" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
];

const FEATURES = [
  {
    icon: Send,
    color: "from-emerald-500 to-green-600",
    title: "Instant Transfers",
    desc: "Send money to Kenya in seconds. Real-time processing with live tracking every step of the way.",
  },
  {
    icon: CreditCard,
    color: "from-blue-500 to-indigo-600",
    title: "Virtual Cards",
    desc: "Get a USD virtual Mastercard instantly. Shop online worldwide without any physical card.",
  },
  {
    icon: Smartphone,
    color: "from-orange-500 to-amber-600",
    title: "M-Pesa Direct",
    desc: "Send straight to M-Pesa wallets. No bank account needed — just a phone number.",
  },
  {
    icon: TrendingUp,
    color: "from-purple-500 to-violet-600",
    title: "Live Exchange Rates",
    desc: "Get the best USD to KES rates, updated in real-time so you never miss a good rate.",
  },
  {
    icon: Shield,
    color: "from-rose-500 to-pink-600",
    title: "Bank-Level Security",
    desc: "End-to-end encryption, KYC verification, and two-factor authentication keep your money safe.",
  },
  {
    icon: Zap,
    color: "from-teal-500 to-cyan-600",
    title: "Airtime Top-up",
    desc: "Buy airtime for any Kenyan network instantly. Safaricom, Airtel, and Telkom supported.",
  },
];

const STEPS = [
  { n: "01", title: "Create your account", desc: "Sign up in under 2 minutes with just your email. Verify your identity once and you're ready to go." },
  { n: "02", title: "Add funds", desc: "Fund your USD wallet via bank transfer or card. Your money is secured and ready to send." },
  { n: "03", title: "Send to Kenya", desc: "Enter the recipient's M-Pesa or bank details and confirm. Money arrives in seconds." },
];

const TESTIMONIALS = [
  { name: "Amara K.", role: "Kenyan diaspora, London", text: "I used to lose $30+ per transfer in fees. GreenPay saves me that every month. My family gets more money — that's what matters.", stars: 5, avatar: "A" },
  { name: "David M.", role: "Freelancer, Nairobi", text: "The virtual card changed everything for me. I can receive USD from international clients and spend online. Best fintech app for Kenya.", stars: 5, avatar: "D" },
  { name: "Sarah N.", role: "Student, Toronto", text: "Sending money home used to stress me out. Now it's as easy as sending a text message. And the rates are amazing!", stars: 5, avatar: "S" },
];

const STATS = [
  { value: "50K+", label: "Active users" },
  { value: "$2M+", label: "Transferred monthly" },
  { value: "< 30s", label: "Transfer time" },
  { value: "128+", label: "KES per USD" },
];

export default function LandingPage() {
  const [, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [rate, setRate] = useState<string | null>(null);
  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 80], ["rgba(255,255,255,0)", "rgba(255,255,255,0.97)"]);
  const navShadow = useTransform(scrollY, [0, 80], ["0 0 0 0 rgba(0,0,0,0)", "0 2px 20px rgba(0,0,0,0.08)"]);

  useEffect(() => {
    fetch("/api/exchange-rate")
      .then(r => r.json())
      .then(d => { if (d.rate) setRate(Number(d.rate).toFixed(2)); })
      .catch(() => setRate("129.50"));
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <motion.nav
        style={{ backgroundColor: navBg, boxShadow: navShadow }}
        className="fixed top-0 left-0 right-0 z-50 transition-colors duration-300"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/landing")} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="font-bold text-lg text-gray-900">GreenPay</span>
          </button>

          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(l => (
              <button key={l.label} onClick={() => navigate(l.href)}
                className="text-sm text-gray-600 hover:text-emerald-600 font-medium transition-colors">
                {l.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" className="text-gray-700 hover:text-emerald-600" onClick={() => navigate("/login")}>Sign in</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5" onClick={() => navigate("/signup")}>
              Get started
            </Button>
          </div>

          <button className="md:hidden p-2 text-gray-700" onClick={() => setMobileOpen(v => !v)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
            {NAV_LINKS.map(l => (
              <button key={l.label} onClick={() => { navigate(l.href); setMobileOpen(false); }}
                className="block w-full text-left py-2 text-sm text-gray-700 font-medium border-b border-gray-50 last:border-0">
                {l.label}
              </button>
            ))}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/login")}>Sign in</Button>
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => navigate("/signup")}>Get started</Button>
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* ── HERO ── */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 bg-gradient-to-br from-emerald-50 via-white to-green-50 overflow-hidden">
        {/* background blobs */}
        <div className="absolute top-10 right-0 w-[600px] h-[600px] rounded-full bg-emerald-100/50 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-green-100/40 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            {rate && (
              <div className="inline-flex items-center gap-2 bg-white border border-emerald-200 rounded-full px-4 py-1.5 text-sm text-emerald-700 font-semibold mb-6 shadow-sm">
                <RefreshCcw className="w-3.5 h-3.5" />
                Live rate: 1 USD = {rate} KES
              </div>
            )}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-gray-900">
              Send money to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-green-600">
                Kenya
              </span>{" "}
              instantly
            </h1>
            <p className="mt-5 text-lg text-gray-600 leading-relaxed max-w-lg">
              Best USD to KES exchange rates, M-Pesa transfers, virtual cards, and airtime top-ups — all in one secure app. Join 50,000+ users sending money home.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 h-13 text-base shadow-lg shadow-emerald-200"
                onClick={() => navigate("/signup")}>
                Start sending for free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline"
                className="rounded-xl px-8 h-13 text-base border-gray-300 hover:border-emerald-400 hover:text-emerald-600"
                onClick={() => navigate("/features/send-money")}>
                See how it works
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
              {["No hidden fees", "Instant to M-Pesa", "Bank-level security"].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> {t}
                </span>
              ))}
            </div>
          </motion.div>

          {/* App card mockup */}
          <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}
            className="flex justify-center md:justify-end">
            <div className="relative">
              <div className="w-72 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-6 text-white">
                  <p className="text-sm opacity-80 font-medium">USD Balance</p>
                  <p className="text-3xl font-bold mt-1">$1,240.00</p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="opacity-75">KES Wallet</span>
                    <span className="font-semibold">KES 159,048</span>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  {[
                    { label: "Sent to Nairobi", amount: "-$200", time: "2 min ago", color: "text-red-500" },
                    { label: "M-Pesa received", amount: "+KES 5,000", time: "1 hr ago", color: "text-emerald-500" },
                    { label: "Card purchase", amount: "-$12.99", time: "Yesterday", color: "text-red-500" },
                  ].map((tx, i) => (
                    <div key={i} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{tx.label}</p>
                        <p className="text-xs text-gray-400">{tx.time}</p>
                      </div>
                      <span className={`text-sm font-bold ${tx.color}`}>{tx.amount}</span>
                    </div>
                  ))}
                </div>
                <div className="px-5 pb-5">
                  <button className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors">
                    Send Money Now
                  </button>
                </div>
              </div>
              {/* Floating badges */}
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="absolute -left-12 top-16 bg-white rounded-2xl shadow-lg border border-gray-100 px-3 py-2 flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-green-100 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">Instant</p>
                  <p className="text-[10px] text-gray-400">M-Pesa delivery</p>
                </div>
              </motion.div>
              <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.5 }}
                className="absolute -right-10 bottom-20 bg-white rounded-2xl shadow-lg border border-gray-100 px-3 py-2 flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">Secured</p>
                  <p className="text-[10px] text-gray-400">256-bit SSL</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-gray-900 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
              <p className="text-3xl font-extrabold text-emerald-400">{s.value}</p>
              <p className="text-sm text-gray-400 mt-1 font-medium">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-full mb-4">Simple process</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">How it works</h2>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto">From sign-up to delivery in under a minute. No paperwork, no queues.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="relative bg-gray-50 rounded-3xl p-8 hover:shadow-lg transition-shadow">
                <span className="text-5xl font-black text-emerald-100 select-none">{step.n}</span>
                <h3 className="text-xl font-bold text-gray-900 mt-2">{step.title}</h3>
                <p className="text-gray-500 mt-2 leading-relaxed text-sm">{step.desc}</p>
                {i < STEPS.length - 1 && (
                  <ChevronRight className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 text-emerald-300 z-10" />
                )}
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-10" onClick={() => navigate("/signup")}>
              Create free account <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-full mb-4">Everything you need</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Packed with features</h2>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto">One app for all your financial needs between the US and Kenya.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="bg-white rounded-3xl p-7 hover:shadow-xl transition-all duration-300 group border border-gray-100 hover:border-emerald-100">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 shadow-lg`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EXCHANGE RATE WIDGET ── */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-emerald-600 to-green-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center text-white">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <Globe className="w-12 h-12 mx-auto mb-4 opacity-80" />
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Today's exchange rate</h2>
            <div className="flex items-center justify-center gap-4 mt-8 flex-wrap">
              <div className="bg-white/10 backdrop-blur rounded-2xl px-10 py-7 border border-white/20">
                <p className="text-sm opacity-75 font-medium">You send</p>
                <p className="text-4xl font-black mt-1">1 USD</p>
              </div>
              <ArrowRight className="w-8 h-8 opacity-60 shrink-0" />
              <div className="bg-white/15 backdrop-blur rounded-2xl px-10 py-7 border border-white/30 shadow-xl">
                <p className="text-sm opacity-75 font-medium">They receive</p>
                <p className="text-4xl font-black mt-1 text-emerald-200">{rate ? `${rate} KES` : "loading..."}</p>
              </div>
            </div>
            <p className="mt-6 text-sm opacity-70">Rate updated every 60 minutes · No hidden markups · No transfer fees</p>
            <Button size="lg" className="mt-8 bg-white text-emerald-700 hover:bg-gray-50 rounded-xl px-10 font-bold shadow-lg"
              onClick={() => navigate("/signup")}>
              Lock in this rate <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-full mb-4">Real stories</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Loved by our community</h2>
            <div className="flex items-center justify-center gap-1 mt-3">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
              <span className="ml-2 text-gray-500 text-sm font-medium">4.9 / 5 from 2,000+ reviews</span>
            </div>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-gray-50 rounded-3xl p-7 border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.stars)].map((_, s) => <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-gray-700 leading-relaxed text-sm">"{t.text}"</p>
                <div className="flex items-center gap-3 mt-5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="py-20 md:py-28 bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="inline-block px-4 py-1.5 bg-emerald-900/50 text-emerald-400 text-sm font-semibold rounded-full mb-6 border border-emerald-800">Free to get started</span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
              Start sending money<br className="hidden md:block" /> to Kenya today
            </h2>
            <p className="text-gray-400 mt-4 max-w-lg mx-auto text-lg leading-relaxed">
              Join 50,000+ people who trust GreenPay for fast, secure, and affordable international transfers.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-10">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-10 text-base shadow-lg shadow-emerald-900/30"
                onClick={() => navigate("/signup")}>
                Create free account <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 rounded-xl px-10 text-base"
                onClick={() => navigate("/login")}>
                Sign in
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 mt-10 text-sm text-gray-500">
              {["No monthly fees", "Free account", "Instant KYC", "Cancel anytime"].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> {t}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-950 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow">
                  <span className="text-white font-bold text-sm">G</span>
                </div>
                <span className="font-bold text-lg text-white">GreenPay</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                The fastest way to send money to Kenya. Trusted by thousands of families worldwide.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <Users className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-gray-400">50,000+ active users</span>
              </div>
            </div>
            {[
              { heading: "Product", links: [["Send Money", "/features/send-money"], ["Virtual Cards", "/features/virtual-cards"], ["Exchange Rates", "/features/exchange"], ["Airtime", "/features/airtime"]] },
              { heading: "Company", links: [["About Us", "/about"], ["Pricing", "/pricing"], ["Security", "/security"], ["Contact", "/contact"]] },
              { heading: "Legal", links: [["Terms of Service", "/terms"], ["Privacy Policy", "/privacy"], ["Help Center", "/help"]] },
            ].map(col => (
              <div key={col.heading}>
                <h4 className="text-white font-semibold text-sm mb-4">{col.heading}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <button onClick={() => navigate(href)} className="text-gray-500 hover:text-emerald-400 text-sm transition-colors">
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-sm">© 2025 GreenPay. All rights reserved.</p>
            <div className="flex items-center gap-3 text-gray-600 text-sm">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Bank-level encryption · Licensed & regulated</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
