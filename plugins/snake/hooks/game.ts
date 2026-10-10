import type { ClientKeyEvent, ClientModule, RenderElement } from 'claude-code'

// The game runs here, on the drawing thread: a surface module with its own
// state, clock and keys. Nothing in it calls the model or reaches `$`.

export const COLS = 20
export const ROWS = 12

type Cell = { x: number; y: number }
type Dir = 'up' | 'down' | 'left' | 'right'
type Status = 'ready' | 'playing' | 'paused' | 'over'

export type Game = {
  snake: Cell[]
  dir: Dir
  turns: Dir[]
  food: Cell
  score: number
  best: number
  status: Status
}

const STEP: Record<Dir, Cell> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}
const OPPOSITE: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' }

const same = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y

export function stepMs(score: number): number {
  return Math.max(60, 150 - score * 4)
}

function placeFood(snake: Cell[]): Cell {
  const free: Cell[] = []
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++) if (!snake.some(s => s.x === x && s.y === y)) free.push({ x, y })
  return free[Math.floor(Math.random() * free.length)] ?? { x: 0, y: 0 }
}

export function newGame(best = 0): Game {
  const y = Math.floor(ROWS / 2)
  const snake = [
    { x: 6, y },
    { x: 5, y },
    { x: 4, y },
  ]
  return { snake, dir: 'right', turns: [], food: placeFood(snake), score: 0, best, status: 'ready' }
}

export function advance(g: Game): Game {
  const [turn, ...turns] = g.turns
  const dir = turn ?? g.dir
  const head = g.snake[0]!
  const next = { x: head.x + STEP[dir].x, y: head.y + STEP[dir].y }
  const eats = same(next, g.food)
  // The tail moves away this step unless the snake grows, so its cell is free.
  const body = eats ? g.snake : g.snake.slice(0, -1)
  const hitsWall = next.x < 0 || next.y < 0 || next.x >= COLS || next.y >= ROWS
  if (hitsWall || body.some(s => same(s, next))) {
    return { ...g, dir, turns: [], status: 'over', best: Math.max(g.best, g.score) }
  }
  const snake = [next, ...body]
  const score = eats ? g.score + 1 : g.score
  return { ...g, snake, dir, turns, score, best: Math.max(g.best, score), food: eats ? placeFood(snake) : g.food }
}

export function onKey(g: Game, e: ClientKeyEvent): Game {
  const key = e.key.toLowerCase()
  if (g.status === 'over') return key === 'r' || key === 'return' || key === ' ' ? { ...newGame(g.best), status: 'playing' } : g
  if (key === 'p' || key === ' ') {
    if (g.status === 'playing') return { ...g, status: 'paused' }
    if (g.status === 'paused') return { ...g, status: 'playing' }
  }
  const wasd: Record<string, Dir> = { w: 'up', a: 'left', s: 'down', d: 'right' }
  const dir = key in STEP ? (key as Dir) : wasd[key]
  if (!dir) return g
  // Queue up to two turns so quick presses between steps are not lost, and
  // never let a turn reverse the snake into itself.
  const last = g.turns[g.turns.length - 1] ?? g.dir
  const turns = dir === last || dir === OPPOSITE[last] || g.turns.length >= 2 ? g.turns : [...g.turns, dir]
  return { ...g, turns, status: 'playing' }
}

const Snake: ClientModule<null, Game> = (_props, surface) => {
  const { Box, Text } = surface.elements
  let g = surface.state
  if (g === undefined) {
    g = newGame()
    surface.setState(g)
    // One timer at the current speed, restarted whenever the score speeds it up.
    let period = stepMs(0)
    const tick = () => {
      const cur = surface.state
      if (!cur || cur.status !== 'playing') return
      const next = advance(cur)
      surface.setState(next)
      const wanted = next.status === 'over' ? stepMs(0) : stepMs(next.score)
      if (wanted !== period) {
        stop()
        period = wanted
        stop = surface.every(period, tick)
      }
    }
    let stop = surface.every(period, tick)
    surface.onKey(e => {
      const cur = surface.state
      if (cur) surface.setState(onKey(cur, e))
    })
  }

  const rows: RenderElement[] = []
  for (let y = 0; y < ROWS; y++) {
    const runs: RenderElement[] = []
    let kind = ''
    let text = ''
    const flush = () => {
      if (!text) return
      const color = kind === 'head' ? 'green' : kind === 'body' ? 'greenBright' : kind === 'food' ? 'red' : undefined
      runs.push(Text({ color, bold: kind === 'head', dimColor: kind === 'empty', children: text }))
      text = ''
    }
    for (let x = 0; x < COLS; x++) {
      const at = { x, y }
      const k = same(g.snake[0]!, at) ? 'head' : g.snake.some(s => same(s, at)) ? 'body' : same(g.food, at) ? 'food' : 'empty'
      if (k !== kind) flush()
      kind = k
      text += k === 'head' || k === 'body' ? '██' : k === 'food' ? '● ' : '· '
    }
    flush()
    rows.push(Text({ children: runs }))
  }

  const hint =
    g.status === 'ready'
      ? 'Click the board, then press an arrow key to start'
      : g.status === 'paused'
        ? 'Paused · space or p to resume'
        : g.status === 'over'
          ? 'Game over · r or Enter to play again'
          : 'Arrows or WASD to steer · space to pause'

  return Box({
    flexDirection: 'column',
    children: [
      Box({
        width: COLS * 2 + 2,
        justifyContent: 'space-between',
        children: [
          Text({ bold: true, children: `Score ${g.score}` }),
          Text({ dimColor: true, children: `Best ${g.best}` }),
        ],
      }),
      Box({ borderStyle: 'round', borderColor: g.status === 'over' ? 'red' : undefined, flexDirection: 'column', width: COLS * 2 + 2, children: rows }),
      Box({
        key: 'status',
        children: Text({ color: 'red', bold: true, children: g.status === 'over' ? `GAME OVER · score ${g.score}` : ' ' }),
      }),
      Text({ dimColor: true, children: hint }),
    ],
  })
}

export default Snake
