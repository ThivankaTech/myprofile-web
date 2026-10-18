"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect } from "react";

import type { TravelDestination } from "@/lib/profile";

interface TravelModalProps {
  destination: TravelDestination | null;
  onClose: () => void;
}

export function TravelModal({ destination, onClose }: TravelModalProps) {
  useEffect(() => {
    if (!destination) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [destination, onClose]);

  return (
    <AnimatePresence>
      {destination && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${destination.location.city}, ${destination.location.country}`}
            className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-surface p-4 shadow-2xl sm:p-5"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 px-1">
              <div>
                {destination.year && (
                  <p className="text-xs font-medium uppercase tracking-wide text-travel">
                    {destination.year}
                  </p>
                )}
                <h2 className="text-lg font-semibold text-fg">
                  {destination.location.city}, {destination.location.country}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-full p-1.5 text-fg-dim transition-colors hover:bg-bg hover:text-fg"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              {destination.images.map((img) => (
                <Image
                  key={img.src}
                  src={img.src}
                  alt={img.alt}
                  width={0}
                  height={0}
                  sizes="448px"
                  className="h-auto max-h-[70dvh] w-full rounded-xl bg-bg object-contain"
                />
              ))}
            </div>

            {destination.note && <p className="mt-3 px-1 text-sm text-fg-dim">{destination.note}</p>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
