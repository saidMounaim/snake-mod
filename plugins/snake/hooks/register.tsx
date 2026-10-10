import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { SnakeCommand } from '../types'

const PANE = 'snake'
const command = atom({ plugin: 'snake', key: 'command' } as const, { key: '', n: 0 } as SnakeCommand)

// The pane's buttons steer by hotkey, which works whenever the pane holds the
// keyboard. The board's own arrow keys need a click, which only the
// fullscreen terminal reports.
const CONTROLS = [
  { key: 'up', hotkey: 'w', label: '↑' },
  { key: 'left', hotkey: 'a', label: '←' },
  { key: 'down', hotkey: 's', label: '↓' },
  { key: 'right', hotkey: 'd', label: '→' },
  { key: 'pause', hotkey: 'p', label: 'pause' },
  { key: 'restart', hotkey: 'r', label: 'restart' },
] as const

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'snake',
      description: 'Play snake in a pane (runs locally)',
      // Opening a pane touches nothing the turn depends on, so /snake runs at
      // once even while Claude is working, instead of waiting for the turn.
      immediate: true,
    })

    return next(e)
  })

  on('command.run', { command: 'snake' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Snake', focus: true, rows: 19, columns: 46 })

    return { text: 'Snake opened. Steer with W A S D.' }
  })

  // The arrows would walk the pane's focus ring onto a button (and Enter
  // would press it); keep the ring still so a stray arrow changes nothing.
  on('ui.focus', { requestId: PANE, origin: { kind: 'person' } }, () => ({}))

  // The board posts { close: true } when q is pressed while it has the keys.
  on('ui.message', { requestId: PANE }, async ($, e) => {
    if ((e.data as { close?: boolean } | null)?.close) await $.ui.close({ id: PANE })
    return {}
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e)
    if (e.surface !== 'terminal' && e.surface !== 'desktop') {
      const { Text } = ui
      return <Text dimColor>Snake needs the terminal or the desktop app.</Text>
    }
    const { Box, Button, Client } = $.ui.resolve(e)
    const cmd = await read($, command)
    const send = (key: string) => () => update($, command, c => ({ key, n: c.n + 1 }))

    return (
      <Box flexDirection="column">
        <Client key="board" module="./game.ts" props={{ command: cmd }} width={42} height={16} />
        <Box gap={1}>
          {CONTROLS.map(c => (
            <Button key={c.key} plain hotkey={c.hotkey} onPress={send(c.key)}>
              {c.label}
            </Button>
          ))}
          <Button key="close" plain dimColor hotkey="q" onPress={() => $.ui.close({ id: PANE })}>
            close
          </Button>
        </Box>
      </Box>
    )
  })
}
