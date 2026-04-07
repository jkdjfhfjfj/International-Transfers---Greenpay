import { Component, ReactNode } from "react";

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    const msg = `RENDER CRASH: ${error.message}\n${info.componentStack.split("\n").slice(0, 5).join("\n")}`;
    console.error("GP_ERROR:", msg);

    // Write to sessionStorage for persistence
    try {
      const prev: string[] = JSON.parse(sessionStorage.getItem("gp_errors") || "[]");
      prev.push(msg);
      sessionStorage.setItem("gp_errors", JSON.stringify(prev));
    } catch {}
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          position: "fixed", inset: 0, background: "#0a0a0a",
          color: "#ff4444", fontFamily: "monospace", padding: "20px",
          overflowY: "auto", zIndex: 99999, fontSize: "13px",
        }}>
          <div style={{ color: "#fff", fontSize: "18px", marginBottom: "12px" }}>
            GreenPay — App Error
          </div>
          <div style={{ marginBottom: "12px", color: "#ff6666" }}>
            {this.state.error.message}
          </div>
          <pre style={{
            background: "#111", padding: "12px", borderRadius: "6px",
            fontSize: "11px", overflowX: "auto", whiteSpace: "pre-wrap",
            color: "#ffaa44",
          }}>
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => { sessionStorage.clear(); window.location.reload(); }}
            style={{
              marginTop: "20px", padding: "10px 24px",
              background: "#22c55e", color: "#fff", border: "none",
              borderRadius: "8px", fontSize: "14px", cursor: "pointer",
            }}
          >
            Clear &amp; Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
