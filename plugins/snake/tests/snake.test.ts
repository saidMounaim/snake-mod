import { describe, expect, test } from 'claude-code/testing'

import { advance, COLS, newGame, onKey } from '../hooks/game'

const PANE = {
  component: 'Pane',
  requestId: 'snake',
  props: {
    title: 'Snake',
    isFocused: true,
    bodyColumns: 46,
    placement: 'inline',
    scroll: { offset: 0, bodyRows: 18 },
    view: {},
  },
} as const

describe('rules', () => {
  test('an arrow key starts the game and steers', async () => {
    const g = onKey(newGame(), { key: 'down' })
    expect(g.status).toBe('playing')
    const moved = advance(g)
    expect(moved.snake[0]).toEqual({ x: 6, y: 7 })
    expect(moved.dir).toBe('down')
  })

  test('the snake cannot reverse into itself', async () => {
    const g = onKey(newGame(), { key: 'left' })
    expect(g.turns).toEqual([])
  })

  test('eating food scores and grows', async () => {
    const g = { ...newGame(), status: 'playing' as const, food: { x: 7, y: 6 } }
    const ate = advance(g)
    expect(ate.score).toBe(1)
    expect(ate.snake).toHaveLength(4)
  })

  test('hitting a wall ends the game', async () => {
    let g = onKey(newGame(), { key: 'right' })
    g = { ...g, food: { x: 0, y: 0 } }
    for (let i = 0; i < COLS && g.status === 'playing'; i++) g = advance(g)
    expect(g.status).toBe('over')
  })

  test('running into its own body ends the game', async () => {
    const snake = [
      { x: 5, y: 5 },
      { x: 6, y: 5 },
      { x: 6, y: 6 },
      { x: 5, y: 6 },
      { x: 4, y: 6 },
    ]
    const g = { ...newGame(), snake, dir: 'up' as const, turns: ['right' as const], status: 'playing' as const, food: { x: 0, y: 0 } }
    expect(advance(g).status).toBe('over')
  })
})

test('/snake is registered to run at once, even mid-turn', async ($, on) => {
  const registered: unknown[] = []
  on('command.register', (_$, e) => {
    registered.push(e)
    return { value: { command: e.name } }
  })
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })
  expect(registered).toEqual([expect.objectContaining({ name: 'snake', immediate: true })])
})

test('/snake opens the pane with the keyboard', async ($, on) => {
  const opened: unknown[] = []
  on('ui.open', (_$, e) => {
    opened.push(e)
    return { value: { isPlaced: true as const } }
  })
  const ran = await $.command.run({
    command: 'snake',
    args: '',
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 100 },
  })
  expect(ran.text).toContain('Snake opened')
  expect(opened).toEqual([expect.objectContaining({ id: 'snake', focus: true })])
})

test('the board plays with arrow keys and ends on collision, on every surface', async $ => {
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'snake', surface, ...PANE })
    expect(await ui.find({ type: 'Client', key: 'board' })).toBeDefined()
    expect((await ui.find({ in: 'board', text: /Score 0/ }))).toBeDefined()
    await ui.key({ key: 'up', in: 'board' })
    await ui.advance(150 * 20)
    expect(await ui.find({ in: 'board', key: 'status', text: /GAME OVER/ })).toBeDefined()
    await ui.key({ key: 'r', in: 'board' })
    expect(await ui.find({ in: 'board', key: 'status', text: /GAME OVER/ })).toBeUndefined()
    await ui.unmount()
  }
})
