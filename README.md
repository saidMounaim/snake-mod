# snake-mod

A Claude Code plugin marketplace with one mod, **snake**, which adds a `/snake` command that opens a playable snake game in a pane. The game runs entirely on your machine and never calls the model.

## Install

From a local clone:

```
claude plugin marketplace add ./snake-mod
claude plugin install snake@snake-mod
```

Or, from GitHub, one line at the Claude Code prompt:

```
/plugin install snake --marketplace saidMounaim/snake-mod
```

Answer `y` to add the marketplace, then choose a scope.

## Play

Run `/snake` in Claude Code **in a terminal** (VS Code's Claude panel can't send keys to a mod). Steer with **W A S D**. Each piece of food scores a point and speeds the snake up. Hitting a wall or your own body ends the game.

| Key | Action |
| --- | --- |
| W A S D | Steer (the first press starts the game) |
| p | Pause or resume |
| r | Play again |
| q | Close the pane |

The arrow keys work too once you click the board, but only in Claude Code's fullscreen layout, which is the only place it passes clicks to mods.

If the keys type into the prompt instead, the pane doesn't have the keyboard: press `ctrl+x` then `tab` to move to it.

## Layout

```
.claude-plugin/marketplace.json   the marketplace (name: snake-mod)
plugins/snake/
  .claude-plugin/plugin.json      the mod's manifest
  hooks/hooks.json                points at the hooks module
  hooks/register.tsx              registers /snake and draws the pane
  hooks/game.ts                   the game: state, timer and keys
  types/index.d.ts                the mod's state contract
  tests/snake.test.ts             run with: claude plugin test plugins/snake
```
