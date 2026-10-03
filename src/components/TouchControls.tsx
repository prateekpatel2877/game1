import { useRef } from 'react'
import { DIRECTIONS, type Direction } from '../game/types'

const SWIPE_THRESHOLD = 24

type Props = {
  onDirection: (direction: Direction) => void
  onAction: () => void
}

export default function TouchControls({ onDirection, onAction }: Props) {
  const originRef = useRef<{ x: number; y: number } | null>(null)

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    originRef.current = { x: event.clientX, y: event.clientY }
  }

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const origin = originRef.current
    originRef.current = null
    if (!origin) return

    const dx = event.clientX - origin.x
    const dy = event.clientY - origin.y
    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return

    if (Math.abs(dx) > Math.abs(dy)) {
      onDirection(dx > 0 ? DIRECTIONS.right : DIRECTIONS.left)
    } else {
      onDirection(dy > 0 ? DIRECTIONS.down : DIRECTIONS.up)
    }
  }

  return (
    <div className="touch">
      <div
        className="touch__pad"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        role="group"
        aria-label="Swipe area"
      >
        <span className="touch__up" aria-hidden="true">
          ↑
        </span>
        <span className="touch__left" aria-hidden="true">
          ←
        </span>
        <span className="touch__right" aria-hidden="true">
          →
        </span>
        <span className="touch__down" aria-hidden="true">
          ↓
        </span>
        <span className="touch__center" aria-hidden="true" />
      </div>

      <button type="button" className="btn btn--ghost" onClick={onAction}>
        Pause
      </button>
    </div>
  )
}