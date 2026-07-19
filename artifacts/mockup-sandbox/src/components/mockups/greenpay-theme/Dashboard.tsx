import { useState } from "react";

const DOMAIN = "a395c8c9-b97f-4b61-a031-803039608486-00-1cx1e4cgg2xsy.kirk.replit.dev";

function HomeIcon() {
  return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
}
function CardIcon() {
  return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
}
function SwapIcon() {
  return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
}
function HistoryIcon() {
  return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
}
function ProfileIcon() {
  return <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
}
function BellIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
}
function SupportIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M5.636 18.364l3.536-3.536m5.656 0l3.536 3.536M12 21a9 9 0 100-18 9 9 0 000 18z" /></svg>;
}
function EyeIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
}
function CopyIcon() {
  return <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>;
}
function ExchangeIcon() {
  return <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
}
function SendIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
}
function ReceiveIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
}
function PhoneIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
}
function BillsIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
}
function AddMoneyIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
}
function CryptoIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function AnalyticsIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
}
function LocationIcon() {
  return <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>;
}
function DownArrowIcon() {
  return <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>;
}
function VCardIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
}
function ClipboardIcon() {
  return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" /></svg>;
}
function ShieldIcon() {
  return <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  
  .gp-root {
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    background: #f8fafc;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }
  .gp-app {
    width: 390px;
    min-height: 100vh;
    background: #f8fafc;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }
  .gp-header {
    background: linear-gradient(135deg, #0f766e 0%, #16a34a 100%);
    padding: 16px 16px 20px;
    border-bottom-left-radius: 24px;
    border-bottom-right-radius: 24px;
    color: white;
    flex-shrink: 0;
  }
  .gp-profile-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  .gp-user-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .gp-avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 13px;
    border: 1.5px solid rgba(255,255,255,0.4);
    flex-shrink: 0;
  }
  .gp-header-actions {
    display: flex;
    gap: 6px;
  }
  .gp-icon-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(255,255,255,0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    color: white;
    cursor: pointer;
    transition: background 0.15s;
  }
  .gp-icon-btn:hover { background: rgba(255,255,255,0.25); }
  .gp-location-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    background: rgba(255,255,255,0.12);
    padding: 3px 9px;
    border-radius: 20px;
    margin-bottom: 10px;
    opacity: 0.85;
  }
  .gp-balance-card {
    background: rgba(255,255,255,0.12);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255,255,255,0.18);
    border-radius: 16px;
    padding: 14px;
  }
  .gp-card-top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }
  .gp-currency-selector {
    display: inline-flex;
    background: rgba(0,0,0,0.18);
    padding: 2px;
    border-radius: 8px;
    gap: 2px;
  }
  .gp-currency-btn {
    padding: 3px 10px;
    border-radius: 6px;
    border: none;
    font-size: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }
  .gp-currency-btn.active {
    background: white;
    color: #0f172a;
  }
  .gp-currency-btn:not(.active) {
    background: transparent;
    color: rgba(255,255,255,0.65);
  }
  .gp-balance-amount {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.5px;
    margin-bottom: 2px;
  }
  .gp-balance-sub {
    font-size: 11px;
    opacity: 0.75;
    margin-bottom: 12px;
  }
  .gp-card-actions {
    display: flex;
    gap: 8px;
  }
  .gp-action-btn {
    flex: 1;
    padding: 8px;
    border-radius: 10px;
    border: none;
    font-size: 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .gp-action-btn:hover { opacity: 0.88; }
  .gp-action-btn.secondary {
    background: rgba(255,255,255,0.2);
    color: white;
  }
  .gp-action-btn.primary {
    background: white;
    color: #059669;
  }
  .gp-scroll-body {
    padding: 14px 14px 90px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    overflow-y: auto;
    flex-grow: 1;
  }
  .gp-section-title {
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 10px;
    color: #0f172a;
  }
  .gp-banner-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    border-radius: 14px;
    gap: 12px;
    border: 1px solid #e2e8f0;
    background: white;
  }
  .gp-banner-card.warning {
    background: #fff7ed;
    border-color: rgba(234,88,12,0.15);
  }
  .gp-banner-title {
    font-size: 13px;
    font-weight: 700;
    color: #1e293b;
  }
  .gp-banner-desc {
    font-size: 11px;
    color: #64748b;
    margin-top: 1px;
  }
  .gp-banner-btn {
    padding: 6px 12px;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    flex-shrink: 0;
    white-space: nowrap;
  }
  .gp-banner-btn.orange { background: #ea580c; }
  .gp-banner-btn.green { background: #10b981; }
  .gp-quick-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .gp-grid-box {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    cursor: pointer;
    transition: box-shadow 0.15s, border-color 0.15s;
  }
  .gp-grid-box:hover {
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    border-color: #10b981;
  }
  .gp-grid-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .gp-grid-label {
    font-size: 13px;
    font-weight: 600;
    color: #0f172a;
  }
  .gp-grid-desc {
    font-size: 11px;
    color: #64748b;
  }
  .gp-list-stack {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .gp-list-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
  }
  .gp-row-left { display: flex; align-items: center; gap: 10px; }
  .gp-row-icon {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .gp-row-title { font-size: 13px; font-weight: 600; color: #0f172a; }
  .gp-row-desc { font-size: 11px; color: #64748b; }
  .gp-row-right { text-align: right; }
  .gp-amount { font-size: 13px; font-weight: 700; }
  .gp-amount.plus { color: #059669; }
  .gp-badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: 6px;
    margin-top: 2px;
  }
  .gp-badge.pending { background: #fef3c7; color: #b45309; }
  .gp-badge.success { background: #d1fae5; color: #059669; }
  .gp-badge.inactive { background: #fee2e2; color: #dc2626; }
  .gp-login-row {
    background: white;
    border: 1px solid #e2e8f0;
    border-left: 3px solid #10b981;
    border-radius: 8px;
    padding: 10px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .gp-login-title { font-size: 12px; font-weight: 600; color: #0f172a; }
  .gp-login-desc { font-size: 11px; color: #64748b; }
  .gp-bottom-bar {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 390px;
    height: 72px;
    background: white;
    border-top: 1px solid #e2e8f0;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    align-items: center;
    z-index: 10;
  }
  .gp-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    font-size: 10px;
    font-weight: 500;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 6px 0;
    transition: color 0.15s;
    color: #64748b;
  }
  .gp-nav-item.active { color: #059669; font-weight: 600; }
  .gp-nav-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  .gp-fab {
    width: 48px;
    height: 48px;
    background: #059669;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    position: absolute;
    top: -28px;
    box-shadow: 0 6px 16px rgba(5,150,105,0.35);
    border: 3px solid white;
    cursor: pointer;
    transition: transform 0.15s;
  }
  .gp-fab:hover { transform: scale(1.05); }
  .gp-fab-label {
    font-size: 10px;
    font-weight: 600;
    color: #64748b;
    margin-top: 24px;
  }
`;

export function Dashboard() {
  const [activeCurrency, setActiveCurrency] = useState<'USD' | 'KES'>('USD');
  const [activeNav, setActiveNav] = useState('home');

  return (
    <div className="gp-root">
      <style>{css}</style>
      <div className="gp-app">
        {/* Header */}
        <header className="gp-header">
          <div className="gp-profile-bar">
            <div className="gp-user-info">
              <div className="gp-avatar">MM</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Hi, Moses!</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>Welcome back 👋</div>
              </div>
            </div>
            <div className="gp-header-actions">
              <button className="gp-icon-btn"><BellIcon /></button>
              <button className="gp-icon-btn"><SupportIcon /></button>
            </div>
          </div>

          <div className="gp-location-tag">
            <LocationIcon />
            Logged in: United Kingdom
          </div>

          <div className="gp-balance-card">
            <div className="gp-card-top-row">
              <div className="gp-currency-selector">
                <button
                  className={`gp-currency-btn ${activeCurrency === 'USD' ? 'active' : ''}`}
                  onClick={() => setActiveCurrency('USD')}
                >USD</button>
                <button
                  className={`gp-currency-btn ${activeCurrency === 'KES' ? 'active' : ''}`}
                  onClick={() => setActiveCurrency('KES')}
                >KES</button>
              </div>
              <EyeIcon />
            </div>
            <div className="gp-balance-amount">
              {activeCurrency === 'USD' ? '$28.00' : 'KSh 3,640'}
            </div>
            <div className="gp-balance-sub">
              {activeCurrency === 'USD' ? 'Other: KSh 3,640.00' : 'Other: $28.00'}
            </div>
            <div className="gp-card-actions">
              <button className="gp-action-btn secondary">
                <CopyIcon /> Copy Acc No
              </button>
              <button className="gp-action-btn primary">
                <ExchangeIcon /> Exchange
              </button>
            </div>
          </div>
        </header>

        {/* Scroll Body */}
        <div className="gp-scroll-body">

          {/* Status Banners */}
          <div className="gp-list-stack">
            <div className="gp-banner-card warning">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fff7ed', border: '1px solid rgba(234,88,12,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShieldIcon />
                </div>
                <div>
                  <div className="gp-banner-title">Verify Your Identity</div>
                  <div className="gp-banner-desc">Complete KYC to unlock all features</div>
                </div>
              </div>
              <button className="gp-banner-btn orange">Verify</button>
            </div>

            <div className="gp-banner-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ecfdf5', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <VCardIcon />
                </div>
                <div>
                  <div className="gp-banner-title">Get Virtual Card</div>
                  <div className="gp-banner-desc">Start making transactions</div>
                </div>
              </div>
              <button className="gp-banner-btn green">Get Card</button>
            </div>

            <div className="gp-banner-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ecfdf5', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <PhoneIcon />
                </div>
                <div>
                  <div className="gp-banner-title">Free Airtime Bonus!</div>
                  <div className="gp-banner-desc">Claim your KES 15 bonus now!</div>
                </div>
              </div>
              <button className="gp-banner-btn green">Claim</button>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <div className="gp-section-title">Quick Actions</div>
            <div className="gp-quick-grid">
              {[
                { icon: <SendIcon />, label: 'Send Money', desc: 'Card required', bg: '#ecfdf5', color: '#059669' },
                { icon: <ReceiveIcon />, label: 'Receive', desc: 'Card required', bg: '#ecfdf5', color: '#059669' },
                { icon: <PhoneIcon />, label: 'Buy Airtime', desc: 'Instant fulfillment', bg: '#ecfdf5', color: '#059669' },
                { icon: <BillsIcon />, label: 'Pay Bills', desc: 'Utility accounts', bg: '#ecfdf5', color: '#059669' },
                { icon: <AddMoneyIcon />, label: 'Add Money', desc: 'Fund your wallet', bg: '#ecfdf5', color: '#059669' },
                { icon: <CryptoIcon />, label: 'Crypto', desc: 'Trade assets', bg: '#fff7ed', color: '#d97706' },
                { icon: <AnalyticsIcon />, label: 'Analytics', desc: 'View statements', bg: '#ecfdf5', color: '#059669' },
              ].map((item, i) => (
                <div key={i} className="gp-grid-box">
                  <div className="gp-grid-icon" style={{ background: item.bg, color: item.color }}>
                    {item.icon}
                  </div>
                  <div>
                    <div className="gp-grid-label">{item.label}</div>
                    <div className="gp-grid-desc">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Services Overview */}
          <div>
            <div className="gp-section-title">Services Overview</div>
            <div className="gp-quick-grid">
              <div className="gp-grid-box">
                <div className="gp-grid-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                  <VCardIcon />
                </div>
                <div>
                  <div className="gp-grid-label">Virtual Card</div>
                  <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>Inactive</div>
                </div>
              </div>
              <div className="gp-grid-box">
                <div className="gp-grid-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                  <ClipboardIcon />
                </div>
                <div>
                  <div className="gp-grid-label">History</div>
                  <div className="gp-grid-desc">2 records</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div>
            <div className="gp-section-title">Recent Transactions</div>
            <div className="gp-list-stack">
              <div className="gp-list-row">
                <div className="gp-row-left">
                  <div className="gp-row-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                    <DownArrowIcon />
                  </div>
                  <div>
                    <div className="gp-row-title">Deposit</div>
                    <div className="gp-row-desc">7/16/2026</div>
                  </div>
                </div>
                <div className="gp-row-right">
                  <div className="gp-amount plus">+$28.00</div>
                  <span className="gp-badge pending">pending</span>
                </div>
              </div>
              <div className="gp-list-row">
                <div className="gp-row-left">
                  <div className="gp-row-icon" style={{ background: '#d1fae5', color: '#059669' }}>
                    <DownArrowIcon />
                  </div>
                  <div>
                    <div className="gp-row-title">Receive</div>
                    <div className="gp-row-desc">7/13/2026</div>
                  </div>
                </div>
                <div className="gp-row-right">
                  <div className="gp-amount plus">+$20.00</div>
                  <span className="gp-badge success">completed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security & Recent Logins */}
          <div>
            <div className="gp-section-title">Security & Recent Logins</div>
            <div className="gp-list-stack">
              {[
                { browser: 'Chrome • Mobile', region: 'KE Region', time: '10:40 AM', status: 'Success' },
                { browser: 'Mozilla • Desktop', region: 'UK Region', time: '8:47 AM', status: 'Success' },
              ].map((item, i) => (
                <div key={i} className="gp-login-row">
                  <div>
                    <div className="gp-login-title">{item.browser}</div>
                    <div className="gp-login-desc">{item.region} • {item.time}</div>
                  </div>
                  <span className="gp-badge success">{item.status}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Navigation */}
        <nav className="gp-bottom-bar">
          <button className={`gp-nav-item ${activeNav === 'home' ? 'active' : ''}`} onClick={() => setActiveNav('home')}>
            <HomeIcon />
            <span>Home</span>
          </button>
          <button className={`gp-nav-item ${activeNav === 'card' ? 'active' : ''}`} onClick={() => setActiveNav('card')}>
            <CardIcon />
            <span>Card</span>
          </button>
          <div className="gp-nav-center">
            <div className="gp-fab" onClick={() => setActiveNav('transfer')}>
              <SwapIcon />
            </div>
            <span className="gp-fab-label">Transfer</span>
          </div>
          <button className={`gp-nav-item ${activeNav === 'history' ? 'active' : ''}`} onClick={() => setActiveNav('history')}>
            <HistoryIcon />
            <span>History</span>
          </button>
          <button className={`gp-nav-item ${activeNav === 'profile' ? 'active' : ''}`} onClick={() => setActiveNav('profile')}>
            <ProfileIcon />
            <span>Profile</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
