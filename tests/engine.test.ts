import assert from 'node:assert/strict'
import {
  createGame,
  placeFood,
  scoreFor,
  start,
  steer,
  step,
  tickMs,
} from '../src/game/engine.ts'
import { DIRECTIONS, GRID_SIZE, type GameState, type Point } from '../src/game/types.ts'

let passed = 0
function check(name: string, fn: () => void) {
  fn()
  passed++
  console.log(`  ok  ${name}`)
}

// Deterministic food so movement assertions don't depend on random placement.
function withFood(state: GameState, food: Point): GameState {
  return { ...state, food }
}
function run(state: GameState, moves: number): GameState {
  let next = state
  for (let i = 0; i < moves; i++) next = step(next)
  return next
}

console.log('engine')

check('starts ready, snake length 3, not running', () => {
  const s = createGame()
  assert.equal(s.status, 'ready')
  assert.equal(s.snake.length, 3)
  assert.equal(s.score, 0)
})

check('does not move while not running', () => {
  const s = createGame()
  assert.equal(step(s), s)
})

check('start() moves ready -> running', () => {
  assert.equal(start(createGame()).status, 'running')
})

check('steps one cell per direction', () => {
  let s = start(createGame())
  const head = s.snake[0]
  s = step(s)
  assert.deepEqual(s.snake[0], { x: head.x + 1, y: head.y })
})

check('rejects a 180 reversal', () => {
  const s = start(createGame())
  assert.equal(steer(s, DIRECTIONS.left), s)
})

check('reversing twice within one tick is still blocked', () => {
  // Facing right: up is legal, but down after up would be a reversal.
  const up = steer(start(createGame()), DIRECTIONS.up)
  assert.notEqual(up, start(createGame()))
  assert.equal(steer(up, DIRECTIONS.down), up)
})

check('same-direction steer is a no-op', () => {
  const s = start(createGame())
  assert.equal(steer(s, DIRECTIONS.right), s)
})

check('length is stable when not eating', () => {
  const s = run(start(createGame()), 3)
  assert.equal(s.snake.length, 3)
})

check('eating grows the snake and scores', () => {
  const s = start(createGame())
  const head = s.snake[0]
  const ahead = { x: head.x + 1, y: head.y }
  const eaten = step(withFood(s, ahead))
  assert.equal(eaten.snake.length, 4)
  assert.equal(eaten.foodsEaten, 1)
  assert.equal(eaten.score, scoreFor(1))
  assert.notDeepEqual(eaten.food, ahead)
})

check('new food never lands on the snake', () => {
  const s = start(createGame())
  const occupied = new Set(s.snake.map((c) => `${c.x},${c.y}`))
  assert.equal(occupied.has(`${s.food.x},${s.food.y}`), false)
})

check('placeFood returns a free cell on a nearly full board', () => {
  const snake: Point[] = []
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE - 1; x++) snake.push({ x, y })
  }
  const food = placeFood(snake)
  const occupied = new Set(snake.map((c) => `${c.x},${c.y}`))
  assert.equal(occupied.has(`${food.x},${food.y}`), false)
})

check('hitting a wall ends the game', () => {
  let s = start(createGame())
  const center = Math.floor(GRID_SIZE / 2)
  while (s.snake[0].x < GRID_SIZE - 1) s = step(s)
  assert.equal(s.status, 'running')
  s = step(s)
  assert.equal(s.status, 'over')
  assert.equal(s.snake[0].x, GRID_SIZE - 1)
  assert.equal(center > 0, true)
})

check('running into your own body ends the game', () => {
  // A closed ring: the head turns left into a mid-body cell, not the tail.
  let s: GameState = {
    ...start(createGame()),
    snake: [
      { x: 5, y: 5 },
      { x: 6, y: 5 },
      { x: 6, y: 6 },
      { x: 6, y: 7 },
      { x: 5, y: 7 },
      { x: 4, y: 7 },
      { x: 4, y: 6 },
      { x: 4, y: 5 },
      { x: 4, y: 4 },
    ],
    direction: DIRECTIONS.left,
    pendingDirection: DIRECTIONS.left,
    food: { x: -1, y: -1 },
  }
  assert.equal(s.snake.length, 9)
  s = step(s)
  assert.equal(s.status, 'over')
})

check('moving into the vacating tail cell is legal', () => {
  // The tail leaves its cell on the same tick, so the head may take it over.
  const s: GameState = {
    ...start(createGame()),
    snake: [
      { x: 5, y: 6 },
      { x: 5, y: 7 },
      { x: 4, y: 7 },
      { x: 4, y: 6 },
    ],
    direction: DIRECTIONS.left,
    pendingDirection: DIRECTIONS.left,
    food: { x: -1, y: -1 },
  }
  const next = step(s)
  assert.equal(next.status, 'running')
  assert.deepEqual(next.snake[0], { x: 4, y: 6 })
  assert.equal(next.snake.length, 4)
})

check('best score survives death', () => {
  let s = start(createGame())
  const head = s.snake[0]
  s = step(withFood(s, { x: head.x + 1, y: head.y }))
  assert.equal(s.best, 10)
  s = run(s, GRID_SIZE)
  assert.equal(s.status, 'over')
  assert.equal(s.best, 10)
})

check('tick interval speeds up then clamps', () => {
  assert.equal(tickMs(0), 165)
  assert.ok(tickMs(8) < tickMs(4))
  assert.equal(tickMs(1000), 60)
})

check('simulating 500 ticks never corrupts state', () => {
  const s = run(start(createGame()), 500)
  assert.equal(s.snake.length >= 3, true)
  for (const c of s.snake) {
    assert.equal(c.x >= 0 && c.x < GRID_SIZE && c.y >= 0 && c.y < GRID_SIZE, true)
  }
})

console.log(`\n${passed} checks passed`)