// A key pressed on the pane's own buttons, handed to the board; `n` counts
// presses so the board applies each one once.
export type SnakeCommand = { key: string; n: number }

declare module 'claude-code' {
  interface PluginState {
    snake: { command: SnakeCommand }
  }
}
