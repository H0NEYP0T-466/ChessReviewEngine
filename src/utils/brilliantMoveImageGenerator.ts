/**
 * Utility for generating brilliant move image cards.
 * Creates a shareable image combining the chessboard and game review panel.
 */

import { Chess } from 'chess.js';

export interface BrilliantMoveImageOptions {
  fen: string;
  username: string;
  moveNotation: string;
  playerSide: 'white' | 'black';
}

interface CanvasPosition {
  top: number;
  left: number;
}

/**
 * Draw a chessboard + pieces and side panel, then return canvas.
 */
export async function createBrilliantMoveImage({
  fen,
  username,
  moveNotation,
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
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

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

  // Determine destination square from FEN
  let destSquare: string | null = null;
  try {
    // We need to figure out which square was the destination
    // Since we have the FEN after the move, we'll mark it later based on the last move
    const history = chess.history({ verbose: true });
    if (history.length > 0) {
      destSquare = history[history.length - 1].to;
    }
  } catch {
    // Ignore if we can't determine destination
  }

  // Draw board
  const light = '#EEEED2';
  const dark = '#769656';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const isDark = (r + c) % 2 === 1;
      ctx.fillStyle = isDark ? dark : light;
      ctx.fillRect(c * squareSize, r * squareSize, squareSize, squareSize);
    }
  }

  // Highlight destination square if any
  if (destSquare) {
    const pos = squareToPixels(destSquare, squareSize);
    ctx.fillStyle = 'rgba(229, 208, 96, 0.65)';
    ctx.fillRect(pos.left, pos.top, squareSize, squareSize);
  }

  // Draw pieces
  const board = chess.board();
  board.forEach((row, rankIndex) => {
    row.forEach((cell, fileIndex) => {
      if (!cell) return;
      const { type, color } = cell;
      const x = fileIndex * squareSize;
      const y = rankIndex * squareSize;
      drawPiece(ctx, color, type, x, y, squareSize);
    });
  });

  // "!!" badge on board if dest square
  if (destSquare) {
    const pos = squareToPixels(destSquare, squareSize);
    const cx = pos.left + squareSize * 0.75;
    const cy = pos.top + squareSize * 0.25;
    drawExclaimBadge(ctx, cx, cy, squareSize * 0.28);
  }

  // Side panel
  const panelX = boardW;
  ctx.fillStyle = '#242322';
  ctx.fillRect(panelX, 0, panelW, height);

  const paddingX = panelX + 28;
  let cursorY = 40;

  // Star badge
  drawStarBadge(ctx, paddingX, cursorY - 25, 28);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 26px Arial, sans-serif';
  ctx.fillText('Game Review', paddingX + 40, cursorY);

  cursorY += 50;
  ctx.fillStyle = '#D0CFCC';
  ctx.font = '600 16px Arial, sans-serif';
  ctx.fillText(username.toUpperCase() + ' played a', paddingX, cursorY);

  cursorY += 34;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 32px Arial, sans-serif';
  ctx.fillText('Brilliant Move!', paddingX, cursorY);

  // Move card
  cursorY += 48;
  const cardH = 180;
  const cardW = panelW - 56;
  const cardY = cursorY;
  ctx.fillStyle = '#1F1E1D';
  roundRect(ctx, paddingX, cardY, cardW, cardH, 18);
  
  ctx.fillStyle = '#00BFAE';
  ctx.font = '700 78px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(moveNotation, paddingX + cardW / 2, cardY + cardH / 2);
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';

  // Second badge bottom-right of card
  drawExclaimBadge(ctx, paddingX + cardW - 40, cardY + cardH - 40, 30);

  // Optional footer brand
  ctx.fillStyle = '#00BFAE';
  ctx.font = '600 26px Arial, sans-serif';
  ctx.fillText('Chess.com', paddingX, height - 42);

  return canvas;
}

/**
 * Convert square notation to pixel coordinates.
 */
function squareToPixels(square: string, squareSize: number): CanvasPosition {
  if (square.length !== 2) {
    return { top: 0, left: 0 };
  }

  const file = square.charCodeAt(0) - 'a'.charCodeAt(0); // 0-7 (a-h)
  const rank = parseInt(square[1]) - 1; // 0-7 (1-8)

  return {
    left: file * squareSize,
    top: (7 - rank) * squareSize, // Rank 8 is at top
  };
}

/**
 * Draw piece or fallback letter.
 */
function drawPiece(
  ctx: CanvasRenderingContext2D,
  color: 'w' | 'b',
  type: string,
  x: number,
  y: number,
  size: number
): void {
  ctx.save();
  
  // Unicode chess pieces
  const pieces: Record<string, string> = {
    'wP': '♙', 'wN': '♘', 'wB': '♗', 'wR': '♖', 'wQ': '♕', 'wK': '♔',
    'bP': '♟', 'bN': '♞', 'bB': '♝', 'bR': '♜', 'bQ': '♛', 'bK': '♚',
  };
  
  const key = (color === 'w' ? 'w' : 'b') + type.toUpperCase();
  const piece = pieces[key];
  
  if (piece) {
    ctx.fillStyle = color === 'w' ? '#FFFFFF' : '#000000';
    ctx.font = 'bold ' + (size * 0.75) + 'px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(piece, x + size / 2, y + size / 2);
  }
  
  ctx.restore();
}

/**
 * Draw turquoise !! badge.
 */
function drawExclaimBadge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number
): void {
  ctx.save();
  ctx.fillStyle = '#00BFAE';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 ' + r * 1.1 + 'px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('!!', cx, cy);
  ctx.restore();
}

/**
 * Draw star badge (green circle + white star).
 */
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
  ctx.font = '700 ' + diameter * 0.7 + 'px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★', x + diameter / 2, y + diameter / 2 + 1);
  ctx.restore();
}

/**
 * Rounded rectangle helper.
 */
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

/**
 * Download utility.
 */
export function downloadCanvas(canvas: HTMLCanvasElement, filename = 'brilliant_move.png'): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
