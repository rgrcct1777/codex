import test from "node:test";
import assert from "node:assert/strict";
import {
  createInitialSnakeGameState,
  setSnakeDirection,
  spawnFood,
  stepSnakeGame,
  togglePaused,
  type SnakeGameConfig,
  type SnakeGameState,
} from "./snakeGame.ts";

const CONFIG: SnakeGameConfig = { width: 8, height: 8 };

function fromState(state: Partial<SnakeGameState>): SnakeGameState {
  return {
    snake: [
      { x: 3, y: 3 },
      { x: 2, y: 3 },
      { x: 1, y: 3 },
    ],
    direction: "right",
    pendingDirection: "right",
    food: { x: 6, y: 6 },
    score: 0,
    isGameOver: false,
    isPaused: false,
    didWin: false,
    ...state,
  };
}

test("createInitialSnakeGameState keeps all segments in bounds", () => {
  const state = createInitialSnakeGameState({ width: 2, height: 2 }, () => 0);

  assert.ok(state.snake.length > 0);
  for (const segment of state.snake) {
    assert.ok(segment.x >= 0 && segment.x < 2);
    assert.ok(segment.y >= 0 && segment.y < 2);
  }
});

test("stepSnakeGame moves one tile in current direction", () => {
  const state = fromState({});
  const next = stepSnakeGame(state, CONFIG, () => 0);

  assert.deepEqual(next.snake[0], { x: 4, y: 3 });
  assert.equal(next.score, 0);
  assert.equal(next.isGameOver, false);
});

test("snake grows and increments score after eating food", () => {
  const state = fromState({ food: { x: 4, y: 3 } });
  const next = stepSnakeGame(state, CONFIG, () => 0);

  assert.equal(next.snake.length, state.snake.length + 1);
  assert.equal(next.score, 1);
  assert.notDeepEqual(next.food, { x: 4, y: 3 });
});

test("colliding with boundary ends the game", () => {
  const state = fromState({
    snake: [{ x: 7, y: 3 }],
    direction: "right",
    pendingDirection: "right",
  });

  const next = stepSnakeGame(state, CONFIG, () => 0);

  assert.equal(next.isGameOver, true);
  assert.equal(next.didWin, false);
});

test("setSnakeDirection ignores opposite turns", () => {
  const state = fromState({ direction: "right", pendingDirection: "right" });
  const next = setSnakeDirection(state, "left");

  assert.deepEqual(next, state);
});

test("togglePaused flips pause state while game is active", () => {
  const state = fromState({ isPaused: false });
  assert.equal(togglePaused(state).isPaused, true);
});

test("spawnFood never returns a snake segment", () => {
  const snake = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
  ];

  const food = spawnFood({ width: 3, height: 3 }, snake, () => 0);
  assert.equal(snake.some((segment) => segment.x === food.x && segment.y === food.y), false);
});

test("filling the board marks game as won", () => {
  const state = fromState({
    snake: [
      { x: 1, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 1 },
    ],
    direction: "right",
    pendingDirection: "right",
    food: { x: 2, y: 0 },
  });

  const next = stepSnakeGame(state, { width: 3, height: 1 }, () => 0);

  assert.equal(next.didWin, true);
  assert.equal(next.isGameOver, true);
});
