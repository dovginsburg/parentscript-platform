import { useRef, useCallback } from 'react'
import type React from 'react'

interface LongPressHandlers {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchEnd: () => void
  onTouchMove: () => void
  onMouseDown: () => void
  onMouseUp: () => void
  onMouseLeave: () => void
  // Suppresses the click that fires after a completed long-press
  onClick: (e: React.MouseEvent) => void
}

/**
 * Returns event handlers that fire onLongPress after the pointer is held still
 * for `delay` ms (default 500ms). Cancels if the pointer moves (scroll intent).
 * Also suppresses the trailing click that would fire on touch release.
 */
export function useLongPress(onLongPress: () => void, delay = 500): LongPressHandlers {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggered = useRef(false)

  const start = useCallback(() => {
    triggered.current = false
    timerRef.current = setTimeout(() => {
      triggered.current = true
      onLongPress()
    }, delay)
  }, [onLongPress, delay])

  const cancel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const onClick = useCallback((e: React.MouseEvent) => {
    if (triggered.current) {
      e.preventDefault()
      e.stopPropagation()
      triggered.current = false
    }
  }, [])

  return {
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchMove: cancel,
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onClick,
  }
}
