import {
  BASE_TICK_MS,
  DIRECTIONS,
  GRID_SIZE,
  MIN_TICK_MS,
  MS_PER_LEVEL,
  type Direction,
  type GameState,
  type Point,
} from './types.ts'

const cellKey = ({ x, y }: Point) => `${x},${y}`

/**
 * A queued turn is kept separately from the live direction so that two fast
 * inputs inside a single tick (e.g. right then up) cannot reverse the snake
 * into itself. `nextDirection` is the last legal heading we accepted, and the
 * reversal guard compares against it rather than the direction we move with.
 */
export function createGame(best = 0): GameState {
  const center = Math.floor(GRID_SIZE / 2)
  const snake: Point[] = [
    { x: center, y: center },
    { x: center - 1, y: center },
    { x: center - 2, y: center },
  ]
  return {
    gridSize: GRID_SIZE,
    snake,
    direction: DIRECTIONS.right,
    pendingDirection: DIRECTIONS.right,
    food: placeFood(snake),
    score: 0,
    best,
    foodsEaten: 0,
    status: 'ready',
    particles: [],
  }
}

export function placeFood(snake: Point[], gridSize = GRID_SIZE): Point {
  const taken = new Set(snake.map(cellKey))
  const free: Point[] = []
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const cell = { x, y }
      if (!taken.has(cellKey(cell))) free.push(cell)
    }
  }
  if (free.length === 0) return { x: -1, y: -1 }
  return free[Math.floor(Math.random() * free.length)]
}

function isOpposite(a: Direction, b: Direction): boolean {
  return a.x === -b.x && a.y === -b.y
}

/** Applies a turn, rejecting 180° reversals. Returns the same object if illegal. */
export function steer(state: GameState, next: Direction): GameState {
  if (state.status !== 'running' && state.status !== 'ready') return state
  if (next.x === 0 && next.y === 0) return state
  if (isOpposite(next, state.pendingDirection)) return state
  if (next.x === state.pendingDirection.x && next.y === state.pendingDirection.y) return state
  return { ...state, pendingDirection: next }
}

export function tickMs(foodsEaten: number): number {
  return Math.max(MIN_TICK_MS, BASE_TICK_MS - Math.floor(foodsEaten / MS_PER_LEVEL) * 15)
}

export function scoreFor(foodsEaten: number): number {
  return foodsEaten * 10
}

/** Advances the game one cell. Pure: returns a new state, never mutates. */
export function step(state: GameState): GameState {
  if (state.status !== 'running') return state

  const direction = state.pendingDirection
  const head = state.snake[0]
  const nextHead = { x: head.x + direction.x, y: head.y + direction.y }

  const hitWall =
    nextHead.x < 0 ||
    nextHead.y < 0 ||
    nextHead.x >= state.gridSize ||
    nextHead.y >= state.gridSize

  // The tail cell is vacated this tick, so moving into it is legal.
  const body = state.snake.slice(0, -1)
  const hitSelf = body.some((c) => c.x === nextHead.x && c.y === nextHead.y)

  if (hitWall || hitSelf) {
    return {
      ...state,
      direction,
      status: 'over',
      best: Math.max(state.best, state.score),
      particles: [
        ...state.particles,
        ...state.snake.map((cell, i) => ({
          id: state.foodsEaten * 1000 + i,
          cell,
          life: 1,
        })),
      ],
    }
  }

  const ate = nextHead.x === state.food.x && nextHead.y === state.food.y
  const snake = ate
    ? [nextHead, ...state.snake]
    : [nextHead, ...state.snake.slice(0, -1)]

  const foodsEaten = state.foodsEaten + (ate ? 1 : 0)
  const score = scoreFor(foodsEaten)

  return {
    ...state,
    snake,
    direction,
    food: ate ? placeFood(snake, state.gridSize) : state.food,
    foodsEaten,
    score,
    best: Math.max(state.best, score),
    particles: ate ? [...state.particles, { id: state.foodsEaten * 1000, cell: state.food, life: 1 }] : state.particles,
  }
}

export function togglePause(state: GameState): GameState {
  if (state.status === 'running') return { ...state, status: 'paused' }
  if (state.status === 'paused') return { ...state, status: 'running' }
  return state
}

export function start(state: GameState): GameState {
  if (state.status === 'over') return { ...createGame(state.best), status: 'running' }
  if (state.status === 'ready') return { ...state, status: 'running' }
  return state
}

/** Ages particle effects; they are purely cosmetic and expire on their own. */
export function decayParticles(state: GameState): GameState {
  if (state.particles.length === 0) return state
  const particles = state.particles
    .map((p) => ({ ...p, life: p.life - 0.08 }))
    .filter((p) => p.life > 0)
  if (particles.length === state.particles.length) return state
  return { ...state, particles }
}