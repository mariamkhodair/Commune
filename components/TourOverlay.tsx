"use client";

import { useState, useEffect, useCallback } from "react";

type Step = {
  targetId?: string;
  text: string;
};

const STEPS: Step[] = [
  { text: "Welcome to Commune! Let's take a 30-second tour so you know your way around." },
  { targetId: "tour-my-stuff",        text: "List the items you want to swap here. Add photos, a title, and a point value." },
  { targetId: "tour-search",          text: "Browse everything your neighbours are offering. Filter by category or search by name." },
  { targetId: "tour-members",         text: "Discover who's in your community. Visit profiles and propose a swap directly." },
  { targetId: "tour-stuff-i-want",    text: "Add items to your wish list — you'll get notified when a match is listed." },
  { targetId: "tour-messages",        text: "Once a swap is accepted, chat here to coordinate the details." },
  { targetId: "tour-my-swaps",        text: "Track all your swap proposals — accept, decline, or propose meeting dates." },
  { targetId: "tour-scheduled-swaps", text: "Confirmed meetup dates appear here. Tap 'Off to Swap' when you're on your way!" },
  { targetId: "tour-notifications",   text: "All swap activity shows up here — proposals, messages, and confirmations." },
  { text: "You're all set! Start by listing your first item, or browse what your neighbours have to offer." },
];

const PAD = 10;

export default function TourOverlay({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const updateRect = useCallback(() => {
    if (!current.targetId) { setRect(null); return; }
    const el = document.getElementById(current.targetId);
    if (el) setRect(el.getBoundingClientRect());
    else setRect(null);
  }, [current.targetId]);

  useEffect(() => {
    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [updateRect]);

  function next() { isLast ? onDone() : setStep(s => s + 1); }
  function prev() { if (step > 0) setStep(s => s - 1); }

  // Bubble is always to the right of the sidebar item
  const bubbleLeft = rect ? rect.right + PAD + 18 : undefined;
  const bubbleMidY = rect ? rect.top + rect.height / 2 : undefined;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, pointerEvents: "none" }}>

      {/* Dark overlay — either full screen (no target) or spotlight box-shadow trick */}
      {rect ? (
        <div
          style={{
            position: "absolute",
            left: rect.left - PAD,
            top: rect.top - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            borderRadius: 14,
            boxShadow: "0 0 0 9999px rgba(50, 35, 22, 0.72)",
            border: "2px solid rgba(255,255,255,0.35)",
            transition: "left 0.25s ease, top 0.25s ease, width 0.25s ease, height 0.25s ease",
            pointerEvents: "none",
          }}
        />
      ) : (
        <div style={{
          position: "absolute",
          inset: 0,
          background: "rgba(50, 35, 22, 0.72)",
        }} />
      )}

      {/* Tooltip bubble */}
      <div
        style={{
          position: "fixed",
          zIndex: 1000,
          pointerEvents: "all",
          ...(rect ? {
            left: bubbleLeft,
            top: bubbleMidY,
            transform: "translateY(-50%)",
            maxWidth: 240,
            width: "auto",
          } : {
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            maxWidth: 380,
            width: "90vw",
          }),
        }}
      >
        {/* Arrow pointing left toward the sidebar item */}
        {rect && (
          <div style={{
            position: "absolute",
            left: -6,
            top: "50%",
            transform: "translateY(-50%) rotate(45deg)",
            width: 12,
            height: 12,
            background: "white",
            borderLeft: "1.5px solid #EDE8DF",
            borderBottom: "1.5px solid #EDE8DF",
          }} />
        )}

        {/* Bubble card */}
        <div style={{
          background: "white",
          border: "1.5px solid #EDE8DF",
          borderRadius: 18,
          padding: "18px 20px 14px",
          boxShadow: "0 12px 40px rgba(50,35,22,0.22)",
        }}>
          <p style={{
            fontSize: 13,
            lineHeight: 1.6,
            color: "#4A3728",
            marginBottom: 14,
          }}>
            {current.text}
          </p>

          {/* Progress dots */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 12 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                height: 5,
                width: i === step ? 16 : 5,
                borderRadius: 999,
                background: i === step ? "#4A3728" : "#D9CFC4",
                transition: "all 0.2s ease",
              }} />
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            {step > 0 && (
              <button
                onClick={prev}
                style={{
                  flex: 1,
                  padding: "7px 0",
                  borderRadius: 999,
                  border: "1.5px solid #D9CFC4",
                  background: "transparent",
                  color: "#6B5040",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Back
              </button>
            )}
            <button
              onClick={next}
              style={{
                flex: 2,
                padding: "7px 0",
                borderRadius: 999,
                border: "none",
                background: "#4A3728",
                color: "#FAF7F2",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {isLast ? "Done!" : "Next →"}
            </button>
          </div>

          {/* Step count + skip */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
            <span style={{ fontSize: 11, color: "#C4B9AA" }}>{step + 1} / {STEPS.length}</span>
            {!isLast && (
              <button
                onClick={onDone}
                style={{ fontSize: 11, color: "#A09080", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                Skip tour
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
