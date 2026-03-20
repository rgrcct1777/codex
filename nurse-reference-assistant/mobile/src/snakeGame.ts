export type GridPosition = {
  x: number;
  y: number;
};

export type Direction = "up" | "down" | "left" | "right";

export type SnakeGameConfig = {
  width: number;
  height: number;
};

export type SnakeGameState = {
  snake: GridPosition[];
  direction: Direction;
  pendingDirection: Direction;
  food: GridPosition;
  score: number;
  isGameOver: boolean;
  isPaused: boolean;
  didWin: boolean;
};

const DIRECTION_VECTORS: Record<Direction, GridPosition> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export function createInitialSnakeGameState(
  config: SnakeGameConfig,
  rng: () => number = Math.random,
): SnakeGameState {
  const startY = Math.min(Math.max(Math.floor(config.height / 2), 0), config.height - 1);
  const maxX = Math.max(config.width - 1, 0);
  const startX = Math.min(Math.max(Math.floor(config.width / 2), 0), maxX);
  const middleX = Math.max(startX - 1, 0);
  const tailX = Math.max(startX - 2, 0);
  const snake = [
    { x: startX, y: startY },
    { x: middleX, y: startY },
    { x: tailX, y: startY },
  ].filter(
    (segment, index, values) =>
      segment.x < config.width &&
      segment.y < config.height &&
      values.findIndex((item) => item.x === segment.x && item.y === segment.y) === index,
  );

  return {
    snake,
    direction: "right",
    pendingDirection: "right",
    food: spawnFood(config, snake, rng),
    score: 0,
    isGameOver: false,
    isPaused: false,
    didWin: false,
  };
}

export function setSnakeDirection(state: SnakeGameState, nextDirection: Direction): SnakeGameState {
  if (state.isGameOver) {
    return state;
  }

  if (nextDirection === OPPOSITE_DIRECTION[state.direction]) {
    return state;
  }

  return {
    ...state,
    pendingDirection: nextDirection,
  };
}

export function togglePaused(state: SnakeGameState): SnakeGameState {
  if (state.isGameOver) {
    return state;
  }

  return {
    ...state,
    isPaused: !state.isPaused,
  };
}

export function stepSnakeGame(
  state: SnakeGameState,
  config: SnakeGameConfig,
  rng: () => number = Math.random,
): SnakeGameState {
  if (state.isGameOver || state.isPaused) {
    return state;
  }

  const direction =
    state.pendingDirection === OPPOSITE_DIRECTION[state.direction]
      ? state.direction
      : state.pendingDirection;

  const currentHead = state.snake[0];
  if (!currentHead) {
    return {
      ...state,
      isGameOver: true,
      didWin: false,
    };
  }

  const nextHead = moveHead(currentHead, direction);
  const didEatFood = nextHead.x === state.food.x && nextHead.y === state.food.y;
  const collisionBody = didEatFood ? state.snake : state.snake.slice(0, state.snake.length - 1);

  if (isOutOfBounds(nextHead, config) || isSnakeCollision(nextHead, collisionBody)) {
    return {
      ...state,
      direction,
      isGameOver: true,
      didWin: false,
    };
  }

  const nextSnake = didEatFood
    ? [nextHead, ...state.snake]
    : [nextHead, ...state.snake.slice(0, state.snake.length - 1)];

  const nextFood = didEatFood ? spawnFood(config, nextSnake, rng) : state.food;
  const didWin = nextSnake.length >= config.width * config.height;

  return {
    ...state,
    snake: nextSnake,
    direction,
    pendingDirection: direction,
    food: nextFood,
    score: didEatFood ? state.score + 1 : state.score,
    didWin,
    isGameOver: didWin,
  };
}

export function spawnFood(
  config: SnakeGameConfig,
  snake: GridPosition[],
  rng: () => number = Math.random,
): GridPosition {
  const availableCells: GridPosition[] = [];
  for (let y = 0; y < config.height; y += 1) {
    for (let x = 0; x < config.width; x += 1) {
      if (!snake.some((segment) => segment.x === x && segment.y === y)) {
        availableCells.push({ x, y });
      }
    }
  }

  if (availableCells.length === 0) {
    return snake[0] ?? { x: 0, y: 0 };
  }

  const index = Math.floor(rng() * availableCells.length);
  return availableCells[Math.min(index, availableCells.length - 1)];
}

function moveHead(head: GridPosition, direction: Direction): GridPosition {
  const vector = DIRECTION_VECTORS[direction];
  return {
    x: head.x + vector.x,
    y: head.y + vector.y,
  };
}

function isOutOfBounds(position: GridPosition, config: SnakeGameConfig): boolean {
  return position.x < 0 || position.x >= config.width || position.y < 0 || position.y >= config.height;
}

function isSnakeCollision(head: GridPosition, snake: GridPosition[]): boolean {
  return snake.some((segment) => segment.x === head.x && segment.y === head.y);
}
