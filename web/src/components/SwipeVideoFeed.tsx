'use client';

import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';

interface SwipeVideoFeedProps {
  /** Called when the user completes a swipe-up to advance to the next card */
  onSwipeNext: () => void;
  /** The card content to render (fullscreen) */
  children: ReactNode;
  /** Unique key for the current card — changing this triggers the entry animation */
  cardKey: string;
  /** Whether swiping is enabled */
  enabled?: boolean;
}

/**
 * Instagram Reels / TikTok style vertical swipe container.
 *
 * - Touch swipe-up on mobile → next card
 * - Mouse wheel scroll down on desktop → next card
 * - Momentum / velocity-aware: a fast flick triggers even with short distance
 * - Spring-back animation if threshold not met
 * - New card slides in from the bottom with scale entrance
 */
export default function SwipeVideoFeed({
  onSwipeNext,
  children,
  cardKey,
  enabled = true,
}: SwipeVideoFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Touch state ──
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const currentTranslateY = useRef(0);
  const isDragging = useRef(false);
  const isAnimating = useRef(false);

  // For rendering the drag offset live
  const [dragOffset, setDragOffset] = useState(0);
  // Exit animation state
  const [exitAnim, setExitAnim] = useState(false);
  // Entry animation state (new card entering)
  const [enterAnim, setEnterAnim] = useState(true);

  // ── Thresholds ──
  const SWIPE_DISTANCE_THRESHOLD = 80; // px to commit
  const SWIPE_VELOCITY_THRESHOLD = 0.4; // px/ms — fast flick shortcut
  const WHEEL_COOLDOWN_MS = 600;

  const lastWheelTime = useRef(0);

  // Reset entry animation when cardKey changes
  useEffect(() => {
    setEnterAnim(true);
    setDragOffset(0);
    const raf = requestAnimationFrame(() => {
      // Trigger the CSS transition by removing the enter state after a frame
      requestAnimationFrame(() => setEnterAnim(false));
    });
    return () => cancelAnimationFrame(raf);
  }, [cardKey]);

  // ── Commit swipe → animate out, then callback ──
  const commitSwipe = useCallback(() => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    setExitAnim(true);

    // Let the CSS exit animation play, then fire callback
    setTimeout(() => {
      setExitAnim(false);
      setDragOffset(0);
      isAnimating.current = false;
      onSwipeNext();
    }, 320);
  }, [onSwipeNext]);

  // ── Spring back ──
  const springBack = useCallback(() => {
    setDragOffset(0);
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TOUCH HANDLERS (Mobile swipe)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || isAnimating.current) return;

      // Don't capture if the touch started inside an interactive element
      const target = e.target as HTMLElement;
      if (
        target.closest('button') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('a') ||
        target.closest('[data-no-swipe]')
      ) {
        return;
      }

      isDragging.current = true;
      touchStartY.current = e.touches[0].clientY;
      touchStartTime.current = Date.now();
      currentTranslateY.current = 0;
    },
    [enabled]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging.current || isAnimating.current) return;

      const deltaY = touchStartY.current - e.touches[0].clientY;

      // Only allow upward drag (positive deltaY = swiping up)
      if (deltaY < 0) {
        // Slight downward resistance
        setDragOffset(deltaY * 0.15);
        currentTranslateY.current = deltaY * 0.15;
        return;
      }

      // Apply rubber-band resistance as the drag extends
      const dampened = deltaY * 0.6;
      currentTranslateY.current = dampened;
      setDragOffset(dampened);
    },
    []
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current || isAnimating.current) return;
    isDragging.current = false;

    const distance = currentTranslateY.current;
    const elapsed = Date.now() - touchStartTime.current;
    const velocity = distance / Math.max(elapsed, 1);

    if (
      distance > SWIPE_DISTANCE_THRESHOLD ||
      velocity > SWIPE_VELOCITY_THRESHOLD
    ) {
      commitSwipe();
    } else {
      springBack();
    }
  }, [commitSwipe, springBack]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // WHEEL HANDLER (Desktop scroll)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!enabled || isAnimating.current) return;

      // Don't intercept if inside a scrollable child
      const target = e.target as HTMLElement;
      if (target.closest('[data-no-swipe]')) return;

      const now = Date.now();
      if (now - lastWheelTime.current < WHEEL_COOLDOWN_MS) return;

      // Scroll down → next (deltaY > 0)
      if (e.deltaY > 30) {
        lastWheelTime.current = now;
        commitSwipe();
      }
    },
    [enabled, commitSwipe]
  );

  // ── Compute transform styles ──
  const getCardStyle = (): React.CSSProperties => {
    if (exitAnim) {
      return {
        transform: 'translateY(-105%) scale(0.92)',
        opacity: 0,
        transition: 'transform 0.32s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.28s ease-out',
      };
    }

    if (enterAnim) {
      return {
        transform: 'translateY(40%) scale(0.96)',
        opacity: 0,
        transition: 'none',
      };
    }

    if (dragOffset !== 0) {
      return {
        transform: `translateY(-${Math.max(dragOffset, 0)}px) scale(${1 - Math.abs(dragOffset) * 0.0003})`,
        transition: isDragging.current ? 'none' : 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
      };
    }

    return {
      transform: 'translateY(0) scale(1)',
      opacity: 1,
      transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.35s ease-out',
    };
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-black touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* Current card */}
      <div
        className="absolute inset-0 w-full h-full will-change-transform"
        style={getCardStyle()}
      >
        {children}
      </div>

      {/* Swipe-up peek indicator — visible during drag */}
      {dragOffset > 20 && !exitAnim && (
        <div
          className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-2 pointer-events-none z-30"
          style={{
            opacity: Math.min(dragOffset / SWIPE_DISTANCE_THRESHOLD, 1),
            transform: `translateY(${Math.max(0, 30 - dragOffset * 0.3)}px)`,
          }}
        >
          <div className="flex items-center space-x-2 px-5 py-2 rounded-full bg-violet-600/80 backdrop-blur-md border border-white/20 shadow-xl">
            <svg
              className="h-4 w-4 text-white animate-bounce"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
            <span className="text-xs font-bold text-white tracking-wide">
              {dragOffset > SWIPE_DISTANCE_THRESHOLD ? 'Release for Next' : 'Swipe up for Next'}
            </span>
          </div>
        </div>
      )}

      {/* Persistent bottom swipe hint — only when idle */}
      {dragOffset === 0 && !exitAnim && !enterAnim && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none z-20 animate-pulse">
          <div className="w-10 h-1 rounded-full bg-white/25" />
        </div>
      )}
    </div>
  );
}
