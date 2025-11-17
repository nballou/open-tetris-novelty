// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Board, Tetromino, TetrominoType } from "@/types";
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  TETROMINO_SHAPES,
  INITIAL_SPEED,
  LEVEL_SPEED_MULTIPLIER,
} from "@/lib/constants";

// Styling utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Game board creation
export function createEmptyBoard(): Board {
  return Array(BOARD_HEIGHT)
    .fill(null)
    .map(() => Array(BOARD_WIDTH).fill(null));
}

// Matrix rotation
export function rotateMatrix(
  matrix: readonly (readonly number[])[]
): number[][] {
  const N = matrix.length;
  const rotated = Array(N)
    .fill(0)
    .map(() => Array(N).fill(0));

  // Rotate clockwise
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      rotated[j][N - 1 - i] = matrix[i][j];
    }
  }

  return rotated;
}

// Get rotated shape for a piece
export function getRotatedShape(piece: Tetromino): number[][] {
  let shape = piece.shape.map((row) => [...row]);
  for (let i = 0; i < piece.rotation; i++) {
    shape = rotateMatrix(shape);
  }
  return shape;
}

// Generate new tetromino piece
export function generateNewPiece(type?: TetrominoType): Tetromino {
  const types: TetrominoType[] = ["I", "O", "T", "S", "Z", "J", "L"];
  const randomType = type || types[Math.floor(Math.random() * types.length)];

  // Create a deep copy of the shape
  const shape = TETROMINO_SHAPES[randomType].map((row) => [...row]);

  return {
    type: randomType,
    shape,
    position: {
      x: Math.floor((BOARD_WIDTH - shape[0].length) / 2),
      y: 0,
    },
    rotation: 0,
  };
}

// 7-bag generator for fair piece distribution
export const TETROMINO_TYPES: TetrominoType[] = [
  "I",
  "O",
  "T",
  "S",
  "Z",
  "J",
  "L",
];

export function generateBag(): TetrominoType[] {
  const bag = [...TETROMINO_TYPES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

// Check if move is valid
export function isValidMove(piece: Tetromino, board: Board): boolean {
  const shape = getRotatedShape(piece);

  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        const boardX = piece.position.x + x;
        const boardY = piece.position.y + y;

        if (
          boardX < 0 ||
          boardX >= BOARD_WIDTH ||
          boardY >= BOARD_HEIGHT ||
          (boardY >= 0 && board[boardY][boardX])
        ) {
          return false;
        }
      }
    }
  }
  return true;
}

// Add piece to board
export function addPieceToBoard(board: Board, piece: Tetromino): Board {
  const newBoard = board.map((row) => [...row]);
  const shape = getRotatedShape(piece);

  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        const boardY = piece.position.y + y;
        const boardX = piece.position.x + x;

        if (boardY >= 0 && boardY < BOARD_HEIGHT) {
          newBoard[boardY][boardX] = piece.type;
        }
      }
    }
  }

  return newBoard;
}

// Clear completed lines and return new board and number of lines cleared
export function clearLines(board: Board): {
  newBoard: Board;
  linesCleared: number;
} {
  let linesCleared = 0;
  const newBoard = board.reduce((acc, row) => {
    if (row.every((cell) => cell !== null)) {
      linesCleared++;
      acc.unshift(Array(BOARD_WIDTH).fill(null));
    } else {
      acc.push([...row]);
    }
    return acc;
  }, [] as Board);

  return { newBoard, linesCleared };
}

// Get ghost piece position
export function getGhostPiecePosition(
  piece: Tetromino,
  board: Board
): Tetromino {
  const ghost = {
    ...piece,
    position: { ...piece.position },
  };

  while (
    isValidMove(
      {
        ...ghost,
        position: { ...ghost.position, y: ghost.position.y + 1 },
      },
      board
    )
  ) {
    ghost.position.y++;
  }

  return ghost;
}

// Get wall kicks based on current rotation state
export function getWallKicks(
  piece: Tetromino,
  currentRotation: number
): { x: number; y: number }[] {
  // SRS (Super Rotation System) wall kicks
  const standardKicks = {
    "01": [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: -1, y: -1 },
      { x: 0, y: 2 },
      { x: -1, y: 2 },
    ],
    "12": [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: -2 },
      { x: 1, y: -2 },
    ],
    "23": [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: -1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ],
    "30": [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: -1, y: 1 },
      { x: 0, y: -2 },
      { x: -1, y: -2 },
    ],
  };

  const iKicks = {
    "01": [
      { x: 0, y: 0 },
      { x: -2, y: 0 },
      { x: 1, y: 0 },
      { x: -2, y: 1 },
      { x: 1, y: -2 },
    ],
    "12": [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: 2, y: 0 },
      { x: -1, y: -2 },
      { x: 2, y: 1 },
    ],
    "23": [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: -1, y: 0 },
      { x: 2, y: -1 },
      { x: -1, y: 2 },
    ],
    "30": [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: -2, y: 0 },
      { x: 1, y: 2 },
      { x: -2, y: -1 },
    ],
  };

  const nextRotation = (currentRotation + 1) % 4;
  const kickKey =
    `${currentRotation}${nextRotation}` as keyof typeof standardKicks;

  if (piece.type === "I") {
    return iKicks[kickKey] || iKicks["01"];
  }

  // O piece doesn't need wall kicks
  if (piece.type === "O") {
    return [{ x: 0, y: 0 }];
  }

  return standardKicks[kickKey] || standardKicks["01"];
}

// Score calculation
export function calculateScore(lines: number, level: number): number {
  const basePoints = {
    1: 100,
    2: 300,
    3: 500,
    4: 800,
  };

  return (basePoints[lines as keyof typeof basePoints] || 0) * level;
}

// Level calculation
export function calculateLevel(lines: number): number {
  return Math.floor(lines / 10) + 1;
}

// Speed calculation
export function calculateSpeed(level: number): number {
  const minSpeed = 100; // Maximum speed (minimum delay)
  const calculatedSpeed = INITIAL_SPEED - (level - 1) * LEVEL_SPEED_MULTIPLIER;
  return Math.max(calculatedSpeed, minSpeed);
}

// Check for game over
export function isGameOver(piece: Tetromino, board: Board): boolean {
  return !isValidMove(piece, board);
}

// ==================== PERFECT PIECE AI ====================

// Count holes in the board (empty cells with filled cells above them)
export function countHoles(board: Board): number {
  let holes = 0;

  for (let x = 0; x < BOARD_WIDTH; x++) {
    let foundBlock = false;
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      if (board[y][x] !== null) {
        foundBlock = true;
      } else if (foundBlock) {
        holes++;
      }
    }
  }

  return holes;
}

// Calculate additional metrics for board evaluation
export function calculateBoardMetrics(board: Board): {
  holes: number;
  height: number;
  bumpiness: number;
} {
  const holes = countHoles(board);

  // Calculate height (highest occupied cell)
  let height = 0;
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    if (board[y].some((cell) => cell !== null)) {
      height = BOARD_HEIGHT - y;
      break;
    }
  }

  // Calculate bumpiness (sum of height differences between adjacent columns)
  const columnHeights: number[] = [];
  for (let x = 0; x < BOARD_WIDTH; x++) {
    let colHeight = 0;
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      if (board[y][x] !== null) {
        colHeight = BOARD_HEIGHT - y;
        break;
      }
    }
    columnHeights.push(colHeight);
  }

  let bumpiness = 0;
  for (let i = 0; i < columnHeights.length - 1; i++) {
    bumpiness += Math.abs(columnHeights[i] - columnHeights[i + 1]);
  }

  return { holes, height, bumpiness };
}

// Simulate placing a piece at a specific position and rotation, return the resulting board
export function simulatePlacement(
  pieceType: TetrominoType,
  board: Board,
  x: number,
  rotation: number
): Board | null {
  // Create piece at top
  const piece = generateNewPiece(pieceType);
  piece.rotation = rotation;
  piece.position.x = x;
  piece.position.y = 0;

  // Drop piece to lowest valid position
  while (
    isValidMove(
      { ...piece, position: { ...piece.position, y: piece.position.y + 1 } },
      board
    )
  ) {
    piece.position.y++;
  }

  // Check if placement is valid
  if (!isValidMove(piece, board)) {
    return null;
  }

  // Add piece to board
  const newBoard = addPieceToBoard(board, piece);

  // Clear any completed lines
  const { newBoard: clearedBoard } = clearLines(newBoard);

  return clearedBoard;
}

// Find the best placement for a given piece type (considering all rotations and positions)
export function findBestPlacement(
  pieceType: TetrominoType,
  board: Board
): {
  holes: number;
  x: number;
  rotation: number;
} | null {
  let bestPlacement: { holes: number; x: number; rotation: number } | null =
    null;

  // Try all rotations (0-3)
  for (let rotation = 0; rotation < 4; rotation++) {
    // Try all horizontal positions
    for (let x = -3; x < BOARD_WIDTH + 3; x++) {
      const resultBoard = simulatePlacement(pieceType, board, x, rotation);

      if (resultBoard) {
        const metrics = calculateBoardMetrics(resultBoard);

        if (
          !bestPlacement ||
          metrics.holes < bestPlacement.holes ||
          (metrics.holes === bestPlacement.holes &&
            Math.random() < 0.5) // Random tiebreaker
        ) {
          bestPlacement = { holes: metrics.holes, x, rotation };
        }
      }
    }
  }

  return bestPlacement;
}

// Select the optimal piece type that minimizes holes
export function selectOptimalPiece(board: Board): TetrominoType {
  const pieceTypes: TetrominoType[] = ["I", "O", "T", "S", "Z", "J", "L"];
  let bestPiece: TetrominoType = "I";
  let bestHoles = Infinity;

  for (const pieceType of pieceTypes) {
    const placement = findBestPlacement(pieceType, board);

    if (placement) {
      if (placement.holes < bestHoles) {
        bestHoles = placement.holes;
        bestPiece = pieceType;
      }
    }
  }

  return bestPiece;
}
