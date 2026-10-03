export type Point = {
  x: number
  y: number
}

export type Direction = Point

export type GameStatus = 'ready' | 'running' | 'paused' | 'over'

export type GameState = {
  gridSize: number
  snake: Point[]
  direction: Direction
  pendingDirection: Direction
  food: Point
  score: number
  best: number
  foodsEaten: number
  status: GameStatus
  /** Cell flashes set by the engine, consumed by the renderer. */
  particles: Particle[]
}

export type Particle = {
  id: number
  cell: Point
  life: number
}

export const GRID_SIZE = 21

export const BASE_TICK_MS = 165
export const MIN_TICK_MS = 60
export const MS_PER_LEVEL = 4

export const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
} as const satisfies Record<string, Direction>