import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createGame,
  decayParticles,
  start,
  step,
  steer,
  tickMs,
  togglePause,
} from '../game/engine'
import { DIRECTIONS, type Direction, type GameState } from '../game/types'
import { render } from './renderer'
import TouchControls from './TouchControls'

const BEST_KEY = 'snake:best'

function loadBest(): number {
  try {
    const raw = localStorage.getItem(BEST_KEY)
    const parsed = raw ? Number.parseInt(raw, 10) : 0
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
  } catch {
    return 0
  }
}

function saveBest(value: number): void {
  try {
    localStorage.setItem(BEST_KEY, String(value))
  } catch {
    /* storage unavailable (private mode); best score just won't persist */
  }
}

const KEY_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: DIRECTIONS.up,
  ArrowDown: DIRECTIONS.down,
  ArrowLeft: DIRECTIONS.left,
  ArrowRight: DIRECTIONS.right,
  w: DIRECTIONS.up,
  s: DIRECTIONS.down,
  a: DIRECTIONS.left,
  d: DIRECTIONS.right,
}

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // `state` drives rendering; `stateRef` mirrors it so the animation loop can
  // read the latest value without being torn down and rebuilt every tick.
  const [state, setState] = useState<GameState>(() => createGame(loadBest()))
  const stateRef = useRef(state)
  const accumulatorRef = useRef(0)
  const lastTimeRef = useRef(0)

  const publish = useCallback((next: GameState) => {
    stateRef.current = next
    setState(next)
  }, [])

  const handleDirection = useCallback(
    (next: Direction) => {
      const current = stateRef.current
      const steered = steer(current, next)
      if (steered === current) return
      // The first input on the title screen also starts the run.
      publish(current.status === 'ready' ? { ...steered, status: 'running' } : steered)
    },
    [publish],
  )

  const handleAction = useCallback(() => {
    const current = stateRef.current
    if (current.status === 'running' || current.status === 'paused') {
      publish(togglePause(current))
      return
    }
    publish(start(current))
  }, [publish])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const direction = KEY_DIRECTIONS[event.key]
      if (direction) {
        event.preventDefault()
        handleDirection(direction)
        return
      }
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        handleAction()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleAction, handleDirection])

  // Auto-pause when the tab or window loses focus so the snake never
  // keeps running unattended behind another tab.
  useEffect(() => {
    const onBlur = () => {
      const current = stateRef.current
      if (current.status === 'running') publish({ ...current, status: 'paused' })
    }
    window.addEventListener('blur', onBlur)
    document.addEventListener('visibilitychange', onBlur)
    return () => {
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('visibilitychange', onBlur)
    }
  }, [publish])

  useEffect(() => {
    if (state.best > 0) saveBest(state.best)
  }, [state.best])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let frame = 0

    const loop = (time: number) => {
      const current = stateRef.current
      const delta = lastTimeRef.current === 0 ? 0 : Math.min(time - lastTimeRef.current, 250)
      lastTimeRef.current = time

      let next = current
      if (current.status === 'running') {
        accumulatorRef.current += delta
        const interval = tickMs(current.foodsEaten)
        while (accumulatorRef.current >= interval) {
          accumulatorRef.current -= interval
          next = step(next)
          if (next.status !== 'running') break
        }
      } else {
        accumulatorRef.current = 0
      }

      next = decayParticles(next)
      if (next !== current) publish(next)

      const pulse = (Math.sin(time / 220) + 1) / 2
      const glow = next.status === 'over' ? 1 - pulse : Math.max(0, pulse - 0.6) * 2.5
      render(canvas, next, pulse, glow)
      frame = requestAnimationFrame(loop)
    }

    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [publish])

  const { status, score, best, foodsEaten } = state

  return (
    <div className="game">
      <header className="hud">
        <div className="stat">
          <span className="stat__label">Score</span>
          <span className="stat__value">{score}</span>
        </div>
        <div className="stat stat--center">
          <span className="stat__label">Best</span>
          <span className="stat__value">{best}</span>
        </div>
        <div className="stat stat--right">
          <span className="stat__label">Food</span>
          <span className="stat__value">{foodsEaten}</span>
        </div>
      </header>

      <div className="stage">
        <canvas ref={canvasRef} className="board" width={420} height={420} role="img" aria-label="Snake game board" />

        {status === 'ready' && (
          <div className="overlay">
            <h2 className="overlay__title">SNAKE</h2>
            <p className="overlay__text">Arrow keys or WASD to move</p>
            <button type="button" className="btn" onClick={handleAction} autoFocus>
              Play
            </button>
          </div>
        )}

        {status === 'paused' && (
          <div className="overlay">
            <h2 className="overlay__title">Paused</h2>
            <p className="overlay__text">Press space to resume</p>
            <button type="button" className="btn" onClick={handleAction} autoFocus>
              Resume
            </button>
          </div>
        )}

        {status === 'over' && (
          <div className="overlay">
            <h2 className="overlay__title">Game Over</h2>
            <p className="overlay__text">
              Score {score} · {foodsEaten} food
              {score === best && score > 0 ? ' · New best!' : ''}
            </p>
            <button type="button" className="btn" onClick={handleAction} autoFocus>
              Play again
            </button>
          </div>
        )}
      </div>

      <TouchControls onDirection={handleDirection} onAction={handleAction} />

      <p className="hint">
        <kbd>↑</kbd>
        <kbd>↓</kbd>
        <kbd>←</kbd>
        <kbd>→</kbd> move · <kbd>space</kbd> pause
      </p>
    </div>
  )
}