"use client";

import { useEffect, useReducer, useRef, useState, type CSSProperties } from "react";
import { videoIdle, videoReducer } from "@/lib/machines/video";

function fmt(t: number) {
  if (!Number.isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type Props = { src: string; poster?: string; label: string; autoPlayInView?: boolean };

/**
 * Custom video player. Playback machine: lib/machines/video.ts, exposed as
 * `data-status` (idle | playing | paused | ended). Autoplays muted when it
 * scrolls into view and pauses when it leaves, until the visitor takes over.
 */
export default function VideoPlayer({ src, poster, label, autoPlayInView = true }: Props) {
  const wrap = useRef<HTMLDivElement | null>(null);
  const video = useRef<HTMLVideoElement | null>(null);
  const [playback, dispatch] = useReducer(videoReducer, videoIdle);
  const [muted, setMuted] = useState(true);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasPip, setHasPip] = useState(false);
  const playing = playback.status === "playing";
  const started = playback.status !== "idle";
  const userControlled = playback.origin === "user";

  useEffect(() => {
    setHasPip(typeof document !== "undefined" && "pictureInPictureEnabled" in document && !!document.pictureInPictureEnabled);
  }, []);

  // Autoplay (muted) while in view; pause when scrolled away. Stops once the visitor
  // uses a control, and never runs for people who prefer reduced motion.
  useEffect(() => {
    const el = wrap.current;
    const v = video.current;
    if (!el || !v || !autoPlayInView || userControlled || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting && (v.paused || v.ended)) {
          v.muted = true;
          if (!v.ended) v.play().catch(() => undefined);
        } else if (!entry.isIntersecting && !v.paused) {
          v.pause();
        }
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [autoPlayInView, userControlled]);

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    dispatch({ type: "USER" });
    if (v.paused || v.ended) {
      if (v.ended) v.currentTime = 0;
      v.play().catch(() => undefined);
    } else v.pause();
  };

  const toggleMute = () => {
    const v = video.current;
    if (!v) return;
    dispatch({ type: "USER" });
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const seek = (value: number) => {
    const v = video.current;
    if (!v || !duration) return;
    dispatch({ type: "USER" });
    v.currentTime = (value / 1000) * duration;
    setTime(v.currentTime);
  };

  const fullscreen = () => {
    const el = wrap.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    else el.requestFullscreen?.().catch(() => undefined);
  };

  const pip = async () => {
    const v = video.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await v.requestPictureInPicture();
    } catch {
      /* not supported */
    }
  };

  const pct = duration ? (time / duration) * 100 : 0;

  return (
    <div
      ref={wrap}
      className={`vplayer${playing ? " is-playing" : ""}${started ? " is-started" : ""}`}
      data-status={playback.status}
    >
      <video
        ref={video}
        className="vplayer__video"
        src={src}
        poster={poster}
        muted={muted}
        playsInline
        preload="metadata"
        aria-label={label}
        onClick={toggle}
        onPlay={() => dispatch({ type: "PLAY" })}
        onPause={() => dispatch({ type: "PAUSE" })}
        onEnded={() => dispatch({ type: "ENDED" })}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
      />

      <button type="button" className="vplayer__big" onClick={toggle} aria-label={playing ? "Pause video" : "Play video"}>
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <path d="M24 17v30l25-15z" fill="currentColor" />
        </svg>
      </button>

      <div className="vplayer__bar">
        <div className="vplayer__progress" style={{ "--pct": `${pct}%` } as CSSProperties}>
          <input
            type="range"
            min={0}
            max={1000}
            step={1}
            value={Math.round(pct * 10)}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="Seek"
          />
        </div>
        <div className="vplayer__row">
          <button type="button" className="vplayer__btn" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
            {playing ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5v14l11-7z" fill="currentColor" />
              </svg>
            )}
          </button>
          <span className="vplayer__time">
            {fmt(time)} / {fmt(duration)}
          </span>
          <span className="vplayer__spacer" />
          <button type="button" className="vplayer__btn" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}>
            {muted ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
                <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
                <path
                  d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
          {hasPip && (
            <button type="button" className="vplayer__btn" onClick={pip} aria-label="Picture in picture">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                <rect x="12" y="11" width="7" height="6" rx="1" fill="currentColor" />
              </svg>
            </button>
          )}
          <button type="button" className="vplayer__btn" onClick={fullscreen} aria-label="Full screen">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"
                stroke="currentColor"
                strokeWidth="2.2"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
