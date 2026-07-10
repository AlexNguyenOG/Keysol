"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { getKeyboardShowcase, getShowcaseVideoSrc, keyboardHasShowcase } from "@/lib/keyboards/showcase";

export type KeyboardMediaInset = "sm" | "md" | "lg";

const INSET_CLASS: Record<KeyboardMediaInset, string> = {
  sm: "p-[8%]",
  md: "p-[12%]",
  lg: "p-[18%]",
};

interface KeyboardShowcaseMediaProps {
  keyboardId: string;
  imageSrc: string;
  alt: string;
  className?: string;
  /** Breathing room inside the frame — larger values zoom out tight product crops. */
  mediaInset?: KeyboardMediaInset;
  sizes?: string;
}

export function KeyboardShowcaseMedia({
  keyboardId,
  imageSrc,
  alt,
  className = "",
  mediaInset = "md",
  sizes = "(max-width: 768px) 100vw, 50vw",
}: KeyboardShowcaseMediaProps) {
  const showcase = getKeyboardShowcase(keyboardId);
  const hasShowcase = keyboardHasShowcase(keyboardId) && showcase !== undefined;
  const insetClass = INSET_CLASS[mediaInset];

  const videoRef = useRef<HTMLVideoElement>(null);
  const canPlayListenerRef = useRef<(() => void) | null>(null);
  const [hovering, setHovering] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const markVideoReady = useCallback(() => {
    const video = videoRef.current;
    if (video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      setVideoReady(true);
    }
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const playClip = useCallback(() => {
    const video = videoRef.current;
    if (!video || !showcase) {
      return;
    }

    if (canPlayListenerRef.current) {
      video.removeEventListener("canplay", canPlayListenerRef.current);
      canPlayListenerRef.current = null;
    }

    const startPlayback = () => {
      markVideoReady();
      video.currentTime = showcase.clipStartSec;
      void video.play().catch(() => {
        setVideoFailed(true);
      });
    };

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      startPlayback();
      return;
    }

    const onCanPlay = () => {
      video.removeEventListener("canplay", onCanPlay);
      canPlayListenerRef.current = null;
      startPlayback();
    };

    canPlayListenerRef.current = onCanPlay;
    video.addEventListener("canplay", onCanPlay);
  }, [showcase, markVideoReady]);

  useEffect(() => {
    if (!hovering || !videoSrc || reducedMotion || videoFailed) {
      return;
    }

    playClip();
  }, [hovering, videoSrc, reducedMotion, videoFailed, playClip]);

  useEffect(() => {
    return () => {
      const video = videoRef.current;
      const listener = canPlayListenerRef.current;
      if (video && listener) {
        video.removeEventListener("canplay", listener);
      }
    };
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !showcase) {
      return;
    }

    if (video.currentTime >= showcase.clipEndSec) {
      video.currentTime = showcase.clipStartSec;
    }
  }, [showcase]);

  const handleMouseEnter = useCallback(() => {
    if (!hasShowcase || reducedMotion || videoFailed) {
      return;
    }

    if (!videoSrc) {
      setVideoSrc(getShowcaseVideoSrc(keyboardId));
    }

    setHovering(true);
  }, [hasShowcase, reducedMotion, videoFailed, videoSrc, keyboardId]);

  const handleMouseLeave = useCallback(() => {
    setHovering(false);
    videoRef.current?.pause();
  }, []);

  const showVideo =
    hasShowcase && !reducedMotion && !videoFailed && hovering && videoReady;

  return (
    <div
      className={`relative overflow-hidden bg-[#0a0b0f] ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Image
        src={imageSrc}
        alt={alt}
        fill
        className={`object-contain transition-opacity duration-300 ${insetClass} ${
          showVideo ? "opacity-0" : "opacity-100"
        }`}
        sizes={sizes}
      />

      {hasShowcase && !reducedMotion && !videoFailed && videoSrc && (
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${insetClass} ${
            showVideo ? "opacity-100" : "opacity-0"
          }`}
          muted
          playsInline
          preload="auto"
          src={videoSrc}
          onLoadedData={markVideoReady}
          onCanPlay={markVideoReady}
          onPlaying={markVideoReady}
          onTimeUpdate={handleTimeUpdate}
          onError={() => setVideoFailed(true)}
          aria-hidden
        />
      )}
    </div>
  );
}
