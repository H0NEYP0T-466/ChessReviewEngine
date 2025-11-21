import { Chess } from 'chess.js';
import brilliantBadge from '../assets/brillant.png';

/**
 * Public (legacy) options – still supported.
 */
export interface BrilliantMoveImageOptions {
  fen: string;
  username: string;
  moveNotation: string;
  uci?: string;
  boardOrientation?: 'white' | 'black';
  classification?: MoveClassification;
  arrows?: ArrowSpec[];
}

/**
 * New options allowing construction from a move list – mirrors AnalysisBoard logic.
 */
export interface BrilliantMoveImageFromMovesOptions {
  moves: { uci: string; san: string; classification?: MoveClassification; side?: 'white' | 'black'; arrows?: MoveArrowSpec[] }[];
  currentMoveIndex: number;
  whitePlayer?: string;
  blackPlayer?: string;
  boardOrientation?: 'white' | 'black';
}

export type MoveClassification =
  | 'brilliant'
  | 'best'
  | 'excellent'
  | 'great'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'
  | 'book'
  | 'none';

export interface MoveArrowSpec {
  from: string;
  to: string;
}

export interface ArrowSpec {
  startSquare: string;
  endSquare: string;
  color: string;
}

interface CanvasPosition {
  top: number;
  left: number;
}

/**
 * Chess piece rendering constants.
 */
const PIECE_SIZE_RATIO = 0.9;
const PIECE_STROKE_WIDTH = 1.5;

/**
 * Piece SVG paths.
 */
const CHESS_PIECE_PATHS: Record<string, { path: string; viewBox: string }> = {
  'wP': { viewBox: '0 0 45 45', path: 'm 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 H 34 C 34,31.58 29.59,27.09 26.59,26.03 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z' },
  'wR': { viewBox: '0 0 45 45', path: 'M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z M 12.5,32 L 14,29.5 L 31,29.5 L 32.5,32 L 12.5,32 z M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z M 14,29.5 L 14,16.5 L 31,16.5 L 31,29.5 L 14,29.5 z M 14,16.5 L 11,14 L 34,14 L 31,16.5 L 14,16.5 z M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 L 11,14 z' },
  'wN': { viewBox: '0 0 45 45', path: 'M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18 C 23,18 23,13 22,10 z M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10 z' },
  'wB': { viewBox: '0 0 45 45', path: 'm 9,36 c 3.39,-0.97 10.11,0.43 13.5,-2 3.39,2.43 10.11,1.03 13.5,2 0,0 1.65,0.54 3,2 -0.68,0.97 -1.65,0.99 -3,0.5 -3.39,-0.97 -10.11,0.46 -13.5,-1 -3.39,1.46 -10.11,0.03 -13.5,1 -1.354,0.49 -2.323,0.47 -3,-0.5 1.354,-1.94 3,-2 3,-2 z m 15,-30 c 2,2.5 3,12.5 3,12.5 0,0 -2,1 -3,1 -1,0 -3,-1 -3,-1 0,0 1,-10 3,-12.5 z m -7.5,11.5 c 1.5,0 4,2 4,2 0,0 -1.5,2 -1.5,3.5 0,1.5 1.5,3.5 1.5,3.5 0,0 -2.5,2 -4,2 -1.5,0 -4,-2 -4,-2 0,0 1.5,-2 1.5,-3.5 0,-1.5 -1.5,-3.5 -1.5,-3.5 0,0 2.5,-2 4,-2 z m 15,0 c -1.5,0 -4,2 -4,2 0,0 1.5,2 1.5,3.5 0,1.5 -1.5,3.5 -1.5,3.5 0,0 2.5,2 4,2 1.5,0 4,-2 4,-2 0,0 -1.5,-2 -1.5,-3.5 0,-1.5 1.5,-3.5 1.5,-3.5 0,0 -2.5,-2 -4,-2 z' },
  'wQ': { viewBox: '0 0 45 45', path: 'M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 z M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 30,24.5 17.5,24.5 9,26 z' },
  'wK': { viewBox: '0 0 45 45', path: 'M 22.5,11.63 L 22.5,6 M 20,8 L 25,8 M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25 M 12.5,37 C 18,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 20,16 10.5,13 6.5,19.5 C 3.5,25.5 12.5,30 12.5,30 L 12.5,37 z' },
  'bP': { viewBox: '0 0 45 45', path: 'm 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 H 34 C 34,31.58 29.59,27.09 26.59,26.03 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z' },
  'bR': { viewBox: '0 0 45 45', path: 'M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z M 12.5,32 L 14,29.5 L 31,29.5 L 32.5,32 L 12.5,32 z M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z M 14,29.5 L 14,16.5 L 31,16.5 L 31,29.5 L 14,29.5 z M 14,16.5 L 11,14 L 34,14 L 31,16.5 L 14,16.5 z M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 L 11,14 z' },
  'bN': { viewBox: '0 0 45 45', path: 'M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18 C 23,18 23,13 22,10 z M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10 z' },
  'bB': { viewBox: '0 0 45 45', path: 'm 9,36 c 3.39,-0.97 10.11,0.43 13.5,-2 3.39,2.43 10.11,1.03 13.5,2 0,0 1.65,0.54 3,2 -0.68,0.97 -1.65,0.99 -3,0.5 -3.39,-0.97 -10.11,0.46 -13.5,-1 -3.39,1.46 -10.11,0.03 -13.5,1 -1.354,0.49 -2.323,0.47 -3,-0.5 1.354,-1.94 3,-2 3,-2 z m 15,-30 c 2,2.5 3,12.5 3,12.5 0,0 -2,1 -3,1 -1,0 -3,-1 -3,-1 0,0 1,-10 3,-12.5 z m -7.5,11.5 c 1.5,0 4,2 4,2 0,0 -1.5,2 -1.5,3.5 0,1.5 1.5,3.5 1.5,3.5 0,0 -2.5,2 -4,2 -1.5,0 -4,-2 -4,-2 0,0 1.5,-2 1.5,-3.5 0,-1.5 -1.5,-3.5 -1.5,-3.5 0,0 2.5,-2 4,-2 z m 15,0 c -1.5,0 -4,2 -4,2 0,0 1.5,2 1.5,3.5 0,1.5 -1.5,3.5 -1.5,3.5 0,0 2.5,2 4,2 1.5,0 4,-2 4,-2 0,0 -1.5,-2 -1.5,-3.5 0,-1.5 1.5,-3.5 1.5,-3.5 0,0 -2.5,-2 -4,-2 z' },
  'bQ': { viewBox: '0 0 45 45', path: 'M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 z M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 30,24.5 17.5,24.5 9,26 z' },
  'bK': { viewBox: '0 0 45 45', path: 'M 22.5,11.63 L 22.5,6 M 20,8 L 25,8 M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25 M 12.5,37 C 18,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 20,16 10.5,13 6.5,19.5 C 3.5,25.5 12.5,30 12.5,30 L 12.5,37 z' },
};

/**
 * Classification color map similar to in-app styling.
 */
const CLASSIFICATION_COLORS: Record<MoveClassification, string> = {
  brilliant: 'rgba(229, 208, 96, 0.65)',
  best: 'rgba(129, 182, 76, 0.45)',
  excellent: 'rgba(129, 182, 76, 0.35)',
  great: 'rgba(92, 139, 176, 0.45)',
  good: 'rgba(92, 139, 176, 0.35)',
  inaccuracy: 'rgba(229, 165, 64, 0.35)',
  mistake: 'rgba(202, 52, 49, 0.50)',
  blunder: 'rgba(202, 52, 49, 0.70)',
  book: 'rgba(180, 180, 180, 0.35)',
  none: 'rgba(0,0,0,0)',
};

/* ----------------- NEW PUBLIC API (preferred) ----------------- */

/**
 * Build an image for a brilliant (or other classified) move using the same logical flow
 * as AnalysisBoard: reconstruct game from moves up to currentMoveIndex, derive position,
 * draw arrows & classification highlight, then decorate side panel.
 */
export async function createBrilliantMoveImageFromMoves(
  options: BrilliantMoveImageFromMovesOptions
): Promise<HTMLCanvasElement> {
  const {
    moves,
    currentMoveIndex,
    whitePlayer = 'Player',
    blackPlayer = 'Player',
    boardOrientation = 'white',
  } = options;

  const game = new Chess();
  for (let i = 0; i <= currentMoveIndex && i < moves.length; i++) {
    try {
      game.move(moves[i].uci);
    } catch {
      // swallow invalid move errors to continue
    }
  }

  const currentMove = moves[currentMoveIndex];
  const fen = game.fen();
  const username = currentMove.side === 'white' ? whitePlayer : blackPlayer;
  const uci = currentMove.uci;
  const moveNotation = currentMove.san;
  const classification = currentMove.classification ?? 'none';

  // Derive arrow color using same classification grouping.
  let arrowColor =
    classification === 'best' || classification === 'excellent'
      ? 'rgba(129, 182, 76, 0.8)'
      : classification === 'great' || classification === 'good'
      ? 'rgba(92, 139, 176, 0.8)'
      : classification === 'brilliant'
      ? 'rgba(229, 208, 96, 0.9)'
      : 'rgba(202, 52, 49, 0.8)';

  const arrows: ArrowSpec[] = (currentMove.arrows || []).map(a => ({
    startSquare: a.from,
    endSquare: a.to,
    color: arrowColor,
  }));

  return createBrilliantMoveImage({
    fen,
    username,
    moveNotation,
    uci,
    boardOrientation,
    classification,
    arrows,
  });
}

/* ----------------- LEGACY / EXTENDED FUNCTION ----------------- */

export async function createBrilliantMoveImage({
  fen,
  username,
  moveNotation,
  uci,
  boardOrientation = 'white',
  classification = 'brilliant',
  arrows = [],
}: BrilliantMoveImageOptions): Promise<HTMLCanvasElement> {
  const width = 1200;
  const height = 630;
  const boardW = 760;
  const panelW = width - boardW;
  const squareSize = boardW / 8;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Background
  ctx.fillStyle = '#242322';
  ctx.fillRect(0, 0, width, height);

  // Parse board using chess.js
  let chess: Chess;
  try {
    chess = new Chess(fen);
  } catch {
    ctx.fillStyle = '#ff4d4d';
    ctx.font = '24px Arial';
    ctx.fillText('Invalid FEN', 20, 40);
    return canvas;
  }

  // Extract origin/destination from UCI
  let originSquare: string | null = null;
  let destSquare: string | null = null;
  if (uci && uci.length >= 4) {
    originSquare = uci.substring(0, 2);
    destSquare = uci.substring(2, 4);
  }

  // Board colors (react-chessboard default style).
  const light = '#F0D9B5';
  const dark = '#B58863';

  // Draw squares considering orientation
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const boardFile = boardOrientation === 'white' ? file : 7 - file;
      const boardRank = boardOrientation === 'white' ? rank : 7 - rank;
      const isDark = (boardFile + boardRank) % 2 === 1;
      ctx.fillStyle = isDark ? dark : light;
      ctx.fillRect(file * squareSize, rank * squareSize, squareSize, squareSize);
    }
  }

  // Highlight classification destination square
  if (destSquare) {
    const pos = squareToPixels(destSquare, squareSize, boardOrientation);
    ctx.fillStyle = CLASSIFICATION_COLORS[classification];
    ctx.fillRect(pos.left, pos.top, squareSize, squareSize);

    // Add subtle radial glow for brilliant move
    if (classification === 'brilliant') {
      drawGlow(ctx, pos.left, pos.top, squareSize, '#E5D060', 0.55);
    }
  }

  // Optional origin highlight for the move
  if (originSquare) {
    const pos = squareToPixels(originSquare, squareSize, boardOrientation);
    ctx.fillStyle = 'rgba(255, 255, 0, 0.30)';
    ctx.fillRect(pos.left, pos.top, squareSize, squareSize);
  }

  // Draw pieces
  const board = chess.board();
  board.forEach((row, rankIndex) => {
    row.forEach((cell, fileIndex) => {
      if (!cell) return;
      // Map internal board coordinates to orientation
      const displayRank = boardOrientation === 'white' ? rankIndex : 7 - rankIndex;
      const displayFile = boardOrientation === 'white' ? fileIndex : 7 - fileIndex;
      const x = displayFile * squareSize;
      const y = displayRank * squareSize;
      drawPiece(ctx, cell.color, cell.type, x, y, squareSize);
    });
  });

  // Draw arrows (under classification overlay badges)
  arrows.forEach(arrow => {
    drawArrowBetweenSquares(ctx, arrow.startSquare, arrow.endSquare, arrow.color, squareSize, boardOrientation);
  });

  // Side panel
  const panelX = boardW;
  ctx.fillStyle = '#242322';
  ctx.fillRect(panelX, 0, panelW, height);

  const paddingX = panelX + 28;
  let cursorY = 40;

  // Badge
  drawStarBadge(ctx, paddingX, cursorY - 25, 28);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 26px Arial, sans-serif';
  ctx.fillText('Game Review', paddingX + 40, cursorY);

  cursorY += 50;
  ctx.fillStyle = '#D0CFCC';
  ctx.font = '600 16px Arial, sans-serif';
  ctx.fillText(`${username.toUpperCase()} played a`, paddingX, cursorY);

  cursorY += 34;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 32px Arial, sans-serif';
  ctx.fillText(
    classification === 'brilliant' ? 'Brilliant Move!' : formatClassificationTitle(classification),
    paddingX,
    cursorY
  );

  // Move card
  cursorY += 48;
  const cardH = 180;
  const cardW = panelW - 56;
  const cardY = cursorY;
  ctx.fillStyle = '#1F1E1D';
  roundRect(ctx, paddingX, cardY, cardW, cardH, 18);

  // Move notation
  ctx.fillStyle = classification === 'brilliant' ? '#E5D060' : '#00BFAE';
  ctx.font = '700 78px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(moveNotation, paddingX + cardW / 2, cardY + cardH / 2);
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';

  // Footer brand
  ctx.fillStyle = '#00BFAE';
  ctx.font = '600 26px Arial, sans-serif';
  ctx.fillText('Chess.com', paddingX, height - 42);

  // Brilliant badges
  const badgePromises: Promise<void>[] = [];
  if (classification === 'brilliant' && destSquare) {
    const pos = squareToPixels(destSquare, squareSize, boardOrientation);
    const cx = pos.left + squareSize * 0.75;
    const cy = pos.top + squareSize * 0.25;
    badgePromises.push(drawBrilliantBadge(ctx, cx, cy, squareSize * 0.28));
  }
  if (classification === 'brilliant') {
    badgePromises.push(drawBrilliantBadge(ctx, paddingX + cardW - 40, cardY + cardH - 40, 30));
  }

  await Promise.all(badgePromises);
  return canvas;
}

/* ----------------- Helpers ----------------- */

function formatClassificationTitle(classification: MoveClassification): string {
  switch (classification) {
    case 'best':
    case 'excellent':
      return 'Excellent Move!';
    case 'great':
      return 'Great Move!';
    case 'good':
      return 'Good Move';
    case 'inaccuracy':
      return 'Inaccuracy';
    case 'mistake':
      return 'Mistake';
    case 'blunder':
      return 'Blunder';
    case 'book':
      return 'Book Move';
    default:
      return 'Move';
  }
}

function squareToPixels(square: string, squareSize: number, orientation: 'white' | 'black'): CanvasPosition {
  if (square.length !== 2) return { top: 0, left: 0 };
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0); // 0-7
  const rank = parseInt(square[1], 10) - 1; // 0-7
  const displayFile = orientation === 'white' ? file : 7 - file;
  const displayRank = orientation === 'white' ? 7 - rank : rank;
  return {
    left: displayFile * squareSize,
    top: displayRank * squareSize,
  };
}

function drawPiece(
  ctx: CanvasRenderingContext2D,
  color: 'w' | 'b',
  type: string,
  x: number,
  y: number,
  size: number
): void {
  ctx.save();
  const key = (color === 'w' ? 'w' : 'b') + type.toUpperCase();
  const pieceData = CHESS_PIECE_PATHS[key];
  if (pieceData) {
    const [ , , vbWidthRaw, vbHeightRaw ] = pieceData.viewBox.split(' ');
    const vbWidth = parseFloat(vbWidthRaw);
    const vbHeight = parseFloat(vbHeightRaw);
    const scale = (size * PIECE_SIZE_RATIO) / Math.max(vbWidth, vbHeight);
    const offsetX = x + (size - vbWidth * scale) / 2;
    const offsetY = y + (size - vbHeight * scale) / 2;
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    const path = new Path2D(pieceData.path);
    ctx.fillStyle = color === 'w' ? '#FFFFFF' : '#000000';
    ctx.fill(path);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = PIECE_STROKE_WIDTH / scale;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke(path);

    if (color === 'w') {
      ctx.globalAlpha = 0.15;
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 2 / scale;
      ctx.shadowOffsetX = 1 / scale;
      ctx.shadowOffsetY = 1 / scale;
      ctx.stroke(path);
      ctx.globalAlpha = 1;
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
  }
  ctx.restore();
}

async function drawBrilliantBadge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      ctx.save();
      const size = r * 2;
      ctx.drawImage(img, cx - r, cy - r, size, size);
      ctx.restore();
      resolve();
    };
    img.onerror = reject;
    img.src = brilliantBadge;
  });
}

function drawStarBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  diameter: number
): void {
  ctx.save();
  ctx.fillStyle = '#2AC15A';
  ctx.beginPath();
  ctx.arc(x + diameter / 2, y + diameter / 2, diameter / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `700 ${diameter * 0.7}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★', x + diameter / 2, y + diameter / 2 + 1);
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.fill();
}

function drawGlow(
  ctx: CanvasRenderingContext2D,
  squareLeft: number,
  squareTop: number,
  size: number,
  color: string,
  intensity: number
): void {
  ctx.save();
  const centerX = squareLeft + size / 2;
  const centerY = squareTop + size / 2;
  const gradient = ctx.createRadialGradient(centerX, centerY, size * 0.15, centerX, centerY, size * 0.7);
  gradient.addColorStop(0, hexToRgba(color, intensity));
  gradient.addColorStop(1, hexToRgba(color, 0));
  ctx.fillStyle = gradient;
  ctx.globalCompositeOperation = 'lighter';
  ctx.beginPath();
  ctx.arc(centerX, centerY, size * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace('#', '');
  const bigint = parseInt(raw, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Draw an arrow between two squares in board orientation.
 */
function drawArrowBetweenSquares(
  ctx: CanvasRenderingContext2D,
  startSquare: string,
  endSquare: string,
  color: string,
  squareSize: number,
  orientation: 'white' | 'black'
): void {
  if (!isValidSquare(startSquare) || !isValidSquare(endSquare)) return;
  const start = squareCenter(startSquare, squareSize, orientation);
  const end = squareCenter(endSquare, squareSize, orientation);

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length === 0) return;

  const headLength = Math.min(22, length * 0.25);
  const headWidth = headLength * 0.6;

  const ux = dx / length;
  const uy = dy / length;

  const arrowStartOffset = squareSize * 0.18;
  const arrowEndOffset = squareSize * 0.30;

  const sx = start.x + ux * arrowStartOffset;
  const sy = start.y + uy * arrowStartOffset;
  const ex = end.x - ux * arrowEndOffset;
  const ey = end.y - uy * arrowEndOffset;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(6, squareSize * 0.08);

  // Shaft
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.stroke();

  // Head (triangle)
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(
    ex - ux * headLength - uy * headWidth / 2,
    ey - uy * headLength + ux * headWidth / 2
  );
  ctx.lineTo(
    ex - ux * headLength + uy * headWidth / 2,
    ey - uy * headLength - ux * headWidth / 2
  );
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function squareCenter(square: string, squareSize: number, orientation: 'white' | 'black') {
  const pos = squareToPixels(square, squareSize, orientation);
  return {
    x: pos.left + squareSize / 2,
    y: pos.top + squareSize / 2,
  };
}

function isValidSquare(s: string): boolean {
  return /^[a-h][1-8]$/.test(s);
}

/* ----------------- Filename & Download Utilities ----------------- */

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[/\\:*?"<>|]/g, '_');
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename = 'brilliant_move.png'): void {
  const link = document.createElement('a');
  link.download = sanitizeFilename(filename);
  link.href = canvas.toDataURL('image/png');
  link.click();
}