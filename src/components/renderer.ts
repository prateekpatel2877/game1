import type { GameState, Point } from '../game/types'

const NEON = '#39ff88'
const FOOD = '#ff3d7f'
const GHOST = '#8b5cf6'

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function drawGrid(ctx: CanvasRenderingContext2D, size: number, cell: number) {
  ctx.strokeStyle = 'rgba(57, 255, 136, 0.06)'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let i = 1; i < size; i++) {
    const p = i * cell + 0.5
    ctx.moveTo(p, 0)
    ctx.lineTo(p, size * cell)
    ctx.moveTo(0, p)
    ctx.lineTo(size * cell, p)
  }
  ctx.stroke()
}

function drawSnakeSegment(
  ctx: CanvasRenderingContext2D,
  cell: Point,
  px: number,
  isHead: boolean,
  glow: number,
) {
  const pad = px * 0.08
  const x = cell.x * px + pad
  const y = cell.y * px + pad
  const w = px - pad * 2

  ctx.shadowColor = NEON
  ctx.shadowBlur = isHead ? 18 + glow * 14 : 8 + glow * 6
  ctx.fillStyle = isHead ? '#c9ffe2' : NEON
  ctx.globalAlpha = isHead ? 1 : 0.92
  roundedRect(ctx, x, y, w, w, px * (isHead ? 0.32 : 0.24))
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.shadowBlur = 0
}

function drawEyes(ctx: CanvasRenderingContext2D, state: GameState, px: number) {
  const head = state.snake[0]
  if (!head) return
  const { x, y } = state.direction
  const cx = head.x * px + px / 2
  const cy = head.y * px + px / 2
  const forward = px * 0.16
  const side = px * 0.2

  ctx.fillStyle = '#04140b'
  const eyes: Point[] =
    x !== 0
      ? [
          { x: cx + x * forward, y: cy - side },
          { x: cx + x * forward, y: cy + side },
        ]
      : [
          { x: cx - side, y: cy + y * forward },
          { x: cx + side, y: cy + y * forward },
        ]
  for (const eye of eyes) {
    ctx.beginPath()
    ctx.arc(eye.x, eye.y, Math.max(1.5, px * 0.075), 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawFood(ctx: CanvasRenderingContext2D, state: GameState, px: number, pulse: number) {
  const { food } = state
  if (food.x < 0) return
  const cx = food.x * px + px / 2
  const cy = food.y * px + px / 2
  const radius = px * (0.28 + pulse * 0.05)

  ctx.shadowColor = FOOD
  ctx.shadowBlur = 20 + pulse * 18
  ctx.fillStyle = FOOD
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.beginPath()
  ctx.arc(cx - radius * 0.32, cy - radius * 0.34, radius * 0.26, 0, Math.PI * 2)
  ctx.fill()
}

function drawParticles(ctx: CanvasRenderingContext2D, state: GameState, px: number) {
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life))
    ctx.shadowColor = GHOST
    ctx.shadowBlur = 14
    ctx.fillStyle = GHOST
    const cx = p.cell.x * px + px / 2
    const cy = p.cell.y * px + px / 2
    ctx.beginPath()
    ctx.arc(cx, cy, px * 0.3 * p.life + 1, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  ctx.shadowBlur = 0
}

export function render(
  canvas: HTMLCanvasElement,
  state: GameState,
  pulse: number,
  glow: number,
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const cssSize = canvas.clientWidth
  const px = cssSize / state.gridSize

  if (canvas.width !== Math.round(cssSize * dpr)) {
    canvas.width = Math.round(cssSize * dpr)
    canvas.height = Math.round(cssSize * dpr)
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, cssSize, cssSize)

  drawGrid(ctx, state.gridSize, px)
  drawParticles(ctx, state, px)
  drawFood(ctx, state, px, pulse)
  for (let i = state.snake.length - 1; i >= 0; i--) {
    drawSnakeSegment(ctx, state.snake[i], px, i === 0, glow)
  }
  drawEyes(ctx, state, px)
}