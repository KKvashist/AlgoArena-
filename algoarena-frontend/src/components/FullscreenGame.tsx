import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";

type Props = { title: string; onExit: () => void; children: ReactNode };

export default function FullscreenGame({ title, onExit, children }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    let entered = false;
    const onFs = () => {
      if (document.fullscreenElement) entered = true;
      else if (entered) onExit(); // Esc pressed while in fullscreen
    };
    document.addEventListener("fullscreenchange", onFs);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit();
    };
    window.addEventListener("keydown", onKey);

    rootRef.current?.requestFullscreen?.().catch(() => {
      /* overlay still fills the viewport */
    });

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("fullscreenchange", onFs);
      window.removeEventListener("keydown", onKey);
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <div
      ref={rootRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483000,
        width: "100vw",
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        color: "#c7d2e0",
        background:
          "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,.25), transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(45,226,230,.18), transparent 55%), #0a0e17",
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "10px 16px",
          borderBottom: "1px solid rgba(45,226,230,.25)",
          background: "linear-gradient(90deg,#131a2a,#0a0e17)",
        }}
      >
        <div>
          <div style={{ fontSize: 10, letterSpacing: ".25em", color: "#2de2e6" }}>MISSION</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>{title}</div>
        </div>
        <button
          type="button"
          onClick={onExit}
          style={{
            padding: "8px 16px",
            borderRadius: 10,
            border: "1px solid rgba(45,226,230,.5)",
            background: "rgba(19,26,42,.9)",
            color: "#2de2e6",
            fontWeight: 700,
            letterSpacing: ".15em",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          ✕ EXIT GAME
        </button>
      </header>

      <main style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 16 }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>{children}</div>
      </main>
    </div>,
    document.body,
  );
}