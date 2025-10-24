import React, { useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";

export default function App() {
  const apiKey = "53212b7c-2aeb-4d15-a78b-1b5eff1f8a28";
  const assistantId = "b4352104-26c5-4f90-9931-be8944ad2ab5";

  const [status, setStatus] = useState("idle");
  const [typedText, setTypedText] = useState("");
  const [fadeKey, setFadeKey] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [justConnected, setJustConnected] = useState(false);
  const [showWave, setShowWave] = useState(false);
  const vapiRef = useRef(null);
  const isEnding = useRef(false);
  const timers = useRef([]);
  const connectingRef = useRef(false);
  const [micAmps, setMicAmps] = useState([1, 1, 1]);

  // 🧠 Initialize Vapi
  useEffect(() => {
    const vapi = new Vapi(apiKey);
    vapiRef.current = vapi;

    vapi.on("call-start", () => {
      connectingRef.current = false;
      clearTypewriter();
      setJustConnected(true);
      setShowWave(true);
      playClickSound();
      !isEnding.current && setStatus("listening");
      setTimeout(() => setJustConnected(false), 800);
      setTimeout(() => setShowWave(false), 1000);
    });

    vapi.on("speech-start", () => !isEnding.current && setStatus("speaking"));
    vapi.on("speech-end", () => !isEnding.current && setStatus("listening"));

    vapi.on("call-end", () => {
      connectingRef.current = false;
      clearTypewriter();
      setTimeout(() => {
        isEnding.current = false;
        setStatus("idle");
      }, 1000);
    });

    vapi.on("error", () => {
      connectingRef.current = false;
      clearTypewriter();
      isEnding.current = false;
      setStatus("idle");
    });

    return () => {
      vapi.stop();
      clearTypewriter();
    };
  }, [apiKey]);

  // 🎧 Click sound
  const playClickSound = () => {
    const audio = new Audio("/pop.mp3");
    audio.volume = 0.5;
    audio.play().catch(() => {});
  };

  // 🎚️ Mic animation
  useEffect(() => {
    if (status === "speaking") {
      const interval = setInterval(() => {
        setMicAmps([
          1 + Math.random() * 0.8,
          1 + Math.random() * 0.8,
          1 + Math.random() * 0.8,
        ]);
      }, 250);
      return () => clearInterval(interval);
    } else setMicAmps([1, 1, 1]);
  }, [status]);

  // 🎬 Start / End Call
  const startCall = async () => {
    if (!vapiRef.current) return;
    playClickSound();
    setStatus("connecting");
    setFadeKey((prev) => prev + 1);
    connectingRef.current = true;
    try {
      await vapiRef.current.start(assistantId);
    } catch {
      connectingRef.current = false;
      clearTypewriter();
      setStatus("idle");
    }
  };

  const endCall = async () => {
    if (!vapiRef.current) return;
    playClickSound();
    isEnding.current = true;
    connectingRef.current = false;
    clearTypewriter();
    setStatus("ending");
    setFadeKey((prev) => prev + 1);
    try {
      await vapiRef.current.stop();
    } finally {
      setTimeout(() => {
        isEnding.current = false;
        setStatus("idle");
        setFadeKey((prev) => prev + 1);
      }, 1000);
    }
  };

  // 🌀 Typewriter
  useEffect(() => {
    if (status === "connecting") startForwardLoop("CONNECTING...");
    else clearTypewriter();
    setFadeKey((prev) => prev + 1);
  }, [status]);

  const startForwardLoop = (text) => {
    clearTypewriter();
    let index = 0;
    const type = () => {
      if (!connectingRef.current) return;
      setTypedText(text.slice(0, index + 1));
      index++;
      if (index === text.length) {
        timers.current.push(
          setTimeout(() => {
            setTypedText("");
            index = 0;
            timers.current.push(setTimeout(type, 400));
          }, 1000)
        );
      } else timers.current.push(setTimeout(type, 90));
    };
    connectingRef.current = true;
    type();
  };

  const clearTypewriter = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // 🧩 Label logic
  let label = "TALK TO OCTOPai";
  const isConnected = status === "listening" || status === "speaking";

  if (hovered && status === "idle") label = "GIVE IT A TRY";
  else if (hovered && isConnected) label = "DISCONNECT";
  else if (status === "connecting") label = typedText || "CONNECTING...";
  else if (status === "listening") label = "LISTENING...";
  else if (status === "speaking") label = "SPEAKING...";
  else if (status === "ending") label = "ENDING...";

  const showMic =
    status === "connecting" || status === "speaking" || status === "listening";

  // 🎨 Colors
  const isWhiteVersion = hovered && status === "idle";
  const isRedVersion = hovered && isConnected;
  const bgColor = isRedVersion
    ? "#ff3b30"
    : isWhiteVersion
    ? "#ffffff"
    : "#1a1a1a";
  const textColor = isWhiteVersion ? "#000000" : "#ffffff";
  const borderColor = "#1a1a1a";
  const logoSrc = isWhiteVersion ? "/ODL_logo_white.png" : "/ODL_logo.png";

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        backgroundColor: "#878787ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'IBM Plex Mono', monospace",
        position: "relative",
      }}
    >
      {/* 🌊 Wave */}
      {showWave && (
        <div
          style={{
            position: "absolute",
            width: "300px",
            height: "80px",
            borderRadius: "999px",
            border: "2px solid rgba(255,255,255,0.5)",
            animation: "waveExpand 1.2s ease-out forwards",
            filter: "blur(3px)",
          }}
        />
      )}

      <div style={{ position: "relative", zIndex: 2 }}>
        <div
          style={{
            position: "absolute",
            inset: "-6px",
            borderRadius: "999px",
            border: "1.5px solid rgba(0, 0, 0, 0.4)",
            zIndex: 0,
            filter: "blur(0.6px)",
          }}
        />

        <button
          onClick={isConnected ? endCall : startCall}
          onMouseEnter={() => {
            if (
              (!hovered && status === "idle") ||
              (!hovered && (status === "listening" || status === "speaking"))
            )
              setFadeKey((prev) => prev + 1);
            setHovered(true);
          }}
          onMouseLeave={() => {
            if (hovered) setFadeKey((prev) => prev + 1);
            setHovered(false);
          }}
          disabled={status === "connecting" || status === "ending"}
          style={{
            backgroundColor: bgColor,
            color: textColor,
            border: `3px solid ${borderColor}`,
            borderRadius: 999,
            width: "300px",
            height: "80px",
            fontSize: "15px",
            fontWeight: 600,
            letterSpacing: "1px",
            cursor:
              status === "connecting" || status === "ending"
                ? "wait"
                : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent:
              status === "connecting" ? "flex-start" : "center",
            padding: status === "connecting" ? "0 24px" : "0",
            transition:
              "all 0.45s ease, background-color 0.35s ease, color 0.35s ease, border 0.35s ease",
            position: "relative",
            zIndex: 3,
            boxShadow: hovered
              ? isRedVersion
                ? "0 0 25px rgba(255,59,48,0.4)"
                : "0 0 20px rgba(255,255,255,0.15)"
              : "0 0 6px rgba(255,255,255,0.05)",
          }}
        >
          {/* 🪶 Label with sharp spinning logo */}
          <div
            key={fadeKey}
            style={{
              animation: `${
                justConnected ? "fadeWhitePulse" : "fadeLabel"
              } 0.75s ease`,
              whiteSpace: "nowrap",
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent:
                status === "connecting" ? "flex-start" : "center",
              gap: "8px",
            }}
          >
            {status === "connecting" ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <img
                  src={logoSrc}
                  alt="logo"
                  style={{
                    width: "22px",
                    height: "22px",
                    transformOrigin: "center center",
                    imageRendering: "pixelated",
                    backfaceVisibility: "hidden",
                    willChange: "transform",
                    animation: "spin 1s linear infinite",
                    filter: "drop-shadow(0 0 0.4px rgba(0,0,0,0.3))",
                  }}
                />
                {typedText || "CONNECTING..."}
              </span>
            ) : label === "TALK TO OCTOPai" ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "2px",
                }}
              >
                TALK TO OCT
                <img
                  src={logoSrc}
                  alt="O"
                  style={{
                    width: "14px",
                    height: "14px",
                    transform: "translateY(-1px)",
                  }}
                />
                Pai
              </span>
            ) : (
              <span>{label}</span>
            )}
          </div>

          {/* 🎙️ Mic */}
          {showMic && (
            <div
              style={{
                position: "relative",
                display: "grid",
                gridTemplateColumns: "repeat(3, 4px)",
                gridTemplateRows: "repeat(7, 4px)",
                gap: "2px",
                marginLeft: status === "connecting" ? "auto" : "18px",
                marginRight: "22px",
                transform: "translateX(-8px)",
              }}
            >
              {[...Array(21)].map((_, i) => {
                if (i === 15 || i === 17)
                  return <span key={i} style={{ width: 4, height: 4 }} />;
                const col = i % 3;
                const row = Math.floor(i / 3);
                const isAnimated = i >= 0 && i <= 14;
                const baseScale =
                  isAnimated && status === "speaking"
                    ? micAmps[col] + row * 0.05
                    : isAnimated &&
                      (status === "listening" || status === "connecting")
                    ? 1.15
                    : 1;
                const glowColor =
                  status === "speaking"
                    ? "rgba(255,200,120,0.9)"
                    : "rgba(255,255,255,0.85)";
                const glow =
                  status === "speaking"
                    ? `0 0 ${3 + baseScale * 4}px ${glowColor}`
                    : `0 0 4px ${glowColor}`;
                return (
                  <span
                    key={i}
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: "#ffffff",
                      opacity: 0.95,
                      boxShadow: glow,
                      transform: `scale(${baseScale})`,
                      transition:
                        "transform 0.25s ease, opacity 0.25s ease, box-shadow 0.3s ease",
                    }}
                  />
                );
              })}
            </div>
          )}
        </button>
      </div>

      <style>{`
        @keyframes fadeLabel {
          0% { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeWhitePulse {
          0% { opacity: 0; text-shadow: 0 0 8px rgba(255,255,255,0.3); transform: scale(1) translateY(6px); }
          30% { opacity: 1; text-shadow: 0 0 18px rgba(255,255,255,0.9); transform: scale(1.15); }
          60% { transform: scale(0.95); }
          100% { opacity: 1; text-shadow: none; transform: scale(1) translateY(0); }
        }
        @keyframes waveExpand {
          0% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.4); }
          100% { opacity: 0; transform: scale(1.8); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
