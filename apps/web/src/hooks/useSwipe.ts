import { useRef, useCallback } from 'react'

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
}

/**
 * Detects a right-swipe (horizontal, 80px+ travel, not a scroll) and calls
 * onSwipeBack. Used on InTheMoment and SkillDetail for native-feeling back nav.
 */
export function useSwipeBack(onSwipeBack: () => void): SwipeHandlers {
  const startX = useRef(0)
  const startY = useRef(0)
  const cancelled = useRef(false)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    cancelled.current = false
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    // If vertical movement exceeds horizontal, treat as a scroll — cancel swipe
    const dx = e.touches[0].clientX - startX.current
    const dy = Math.abs(e.touches[0].clientY - startY.current)
    if (dy > Math.abs(dx) && dy > 10) {
      cancelled.current = true
    }
  }, [])

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (cancelled.current) return
      const dx = e.changedTouches[0].clientX - startX.current
      const dy = Math.abs(e.changedTouches[0].clientY - startY.current)
      // Right swipe: at least 80px horizontal, less than 60px vertical drift
      if (dx > 80 && dy < 60) {
        onSwipeBack()
      }
    },
    [onSwipeBack]
  )

  return { onTouchStart, onTouchMove, onTouchEnd }
}
