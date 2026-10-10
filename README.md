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

Run `/snake`, click the board, and steer with the arrow keys (WASD works too). Each piece of food scores a point and speeds the snake up. Hitting a wall or your own body ends the game.

| Key | Action |
| --- | --- |
| Arrows / WASD | Steer (the first press starts the game) |
| Space / p | Pause or resume |
| r / Enter | Play again after game over |
| q | Close the pane |

## Layout

```
.claude-plugin/marketplace.json   the marketplace (name: snake-mod)
plugins/snake/
  .claude-plugin/plugin.json      the mod's manifest
  hooks/hooks.json                points at the hooks module
  hooks/register.tsx              registers /snake and draws the pane
  hooks/game.ts                   the game: state, timer and keys
  tests/snake.test.ts             run with: claude plugin test plugins/snake
```
