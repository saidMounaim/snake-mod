import type { Register } from 'claude-code'

const PANE = 'snake'

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'snake',
      description: 'Play snake in a pane (arrow keys, runs locally)',
      // Opening a pane touches nothing the turn depends on, so /snake runs at
      // once even while Claude is working, instead of waiting for the turn.
      immediate: true,
    })

    return next(e)
  })

  on('command.run', { command: 'snake' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Snake', focus: true, rows: 18, columns: 46 })

    return { text: 'Snake opened. Click the board, then steer with the arrow keys.' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, ($, e) => {
    const ui = $.ui.resolve(e)
    if (e.surface !== 'terminal' && e.surface !== 'desktop') {
      const { Text } = ui
      return <Text dimColor>Snake needs a terminal or the desktop app to take arrow keys.</Text>
    }
    const { Box, Button, Client } = $.ui.resolve(e)

    return (
      <Box flexDirection="column">
        <Client key="board" module="./game.ts" width={42} height={16} />
        <Button key="close" plain dimColor hotkey="q" role="dismiss" onPress={() => $.ui.close({ id: PANE })}>
          Close
        </Button>
      </Box>
    )
  })
}
