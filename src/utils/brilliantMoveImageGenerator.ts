/**
 * Utility for generating brilliant move image cards.
 * Creates a shareable image combining the chessboard and game review panel.
 */

import { Chess } from 'chess.js';
import brilliantBadge from '../assets/brillant.png';

export interface BrilliantMoveImageOptions {
  fen: string;
  username: string;
  moveNotation: string;
  uci?: string;
}

interface CanvasPosition {
  top: number;
  left: number;
}

/**
 * Chess piece rendering constants.
 */
const PIECE_SIZE_RATIO = 0.9; // Pieces are rendered at 90% of square size
const PIECE_STROKE_WIDTH = 1.5; // SVG stroke width for piece outlines

/**
 * SVG chess piece paths for rendering on canvas.
 * These are standard Wikimedia Commons chess piece SVG paths.
 */
const CHESS_PIECE_PATHS: Record<string, { path: string; viewBox: string }> = {
  'wP': {
    viewBox: '0 0 45 45',
    path: 'm 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 H 34 C 34,31.58 29.59,27.09 26.59,26.03 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z'
  },
  'wR': {
    viewBox: '0 0 45 45',
    path: 'M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z M 12.5,32 L 14,29.5 L 31,29.5 L 32.5,32 L 12.5,32 z M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z M 14,29.5 L 14,16.5 L 31,16.5 L 31,29.5 L 14,29.5 z M 14,16.5 L 11,14 L 34,14 L 31,16.5 L 14,16.5 z M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 L 11,14 z'
  },
  'wN': {
    viewBox: '0 0 45 45',
    path: 'M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18 C 23,18 23,13 22,10 z M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10 z'
  },
  'wB': {
    viewBox: '0 0 45 45',
    path: 'm 9,36 c 3.39,-0.97 10.11,0.43 13.5,-2 3.39,2.43 10.11,1.03 13.5,2 0,0 1.65,0.54 3,2 -0.68,0.97 -1.65,0.99 -3,0.5 -3.39,-0.97 -10.11,0.46 -13.5,-1 -3.39,1.46 -10.11,0.03 -13.5,1 -1.354,0.49 -2.323,0.47 -3,-0.5 1.354,-1.94 3,-2 3,-2 z m 15,-30 c 2,2.5 3,12.5 3,12.5 0,0 -2,1 -3,1 -1,0 -3,-1 -3,-1 0,0 1,-10 3,-12.5 z m -7.5,11.5 c 1.5,0 4,2 4,2 0,0 -1.5,2 -1.5,3.5 0,1.5 1.5,3.5 1.5,3.5 0,0 -2.5,2 -4,2 -1.5,0 -4,-2 -4,-2 0,0 1.5,-2 1.5,-3.5 0,-1.5 -1.5,-3.5 -1.5,-3.5 0,0 2.5,-2 4,-2 z m 15,0 c -1.5,0 -4,2 -4,2 0,0 1.5,2 1.5,3.5 0,1.5 -1.5,3.5 -1.5,3.5 0,0 2.5,2 4,2 1.5,0 4,-2 4,-2 0,0 -1.5,-2 -1.5,-3.5 0,-1.5 1.5,-3.5 1.5,-3.5 0,0 -2.5,-2 -4,-2 z'
  },
  'wQ': {
    viewBox: '0 0 45 45',
    path: 'M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 z M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 30,24.5 17.5,24.5 9,26 z'
  },
  'wK': {
    viewBox: '0 0 45 45',
    path: 'M 22.5,11.63 L 22.5,6 M 20,8 L 25,8 M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25 M 12.5,37 C 18,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 20,16 10.5,13 6.5,19.5 C 3.5,25.5 12.5,30 12.5,30 L 12.5,37 z'
  },
  'bP': {
    viewBox: '0 0 45 45',
    path: 'm 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 H 34 C 34,31.58 29.59,27.09 26.59,26.03 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z'
  },
  'bR': {
    viewBox: '0 0 45 45',
    path: 'M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z M 12.5,32 L 14,29.5 L 31,29.5 L 32.5,32 L 12.5,32 z M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z M 14,29.5 L 14,16.5 L 31,16.5 L 31,29.5 L 14,29.5 z M 14,16.5 L 11,14 L 34,14 L 31,16.5 L 14,16.5 z M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 L 11,14 z'
  },
  'bN': {
    viewBox: '0 0 45 45',
    path: 'M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18 C 23,18 23,13 22,10 z M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10 z'
  },
  'bB': {
    viewBox: '0 0 45 45',
    path: 'm 9,36 c 3.39,-0.97 10.11,0.43 13.5,-2 3.39,2.43 10.11,1.03 13.5,2 0,0 1.65,0.54 3,2 -0.68,0.97 -1.65,0.99 -3,0.5 -3.39,-0.97 -10.11,0.46 -13.5,-1 -3.39,1.46 -10.11,0.03 -13.5,1 -1.354,0.49 -2.323,0.47 -3,-0.5 1.354,-1.94 3,-2 3,-2 z m 15,-30 c 2,2.5 3,12.5 3,12.5 0,0 -2,1 -3,1 -1,0 -3,-1 -3,-1 0,0 1,-10 3,-12.5 z m -7.5,11.5 c 1.5,0 4,2 4,2 0,0 -1.5,2 -1.5,3.5 0,1.5 1.5,3.5 1.5,3.5 0,0 -2.5,2 -4,2 -1.5,0 -4,-2 -4,-2 0,0 1.5,-2 1.5,-3.5 0,-1.5 -1.5,-3.5 -1.5,-3.5 0,0 2.5,-2 4,-2 z m 15,0 c -1.5,0 -4,2 -4,2 0,0 1.5,2 1.5,3.5 0,1.5 -1.5,3.5 -1.5,3.5 0,0 2.5,2 4,2 1.5,0 4,-2 4,-2 0,0 -1.5,-2 -1.5,-3.5 0,-1.5 1.5,-3.5 1.5,-3.5 0,0 -2.5,-2 -4,-2 z'
  },
  'bQ': {
    viewBox: '0 0 45 45',
    path: 'M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 z M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 30,24.5 17.5,24.5 9,26 z'
  },
  'bK': {
    viewBox: '0 0 45 45',
    path: 'M 22.5,11.63 L 22.5,6 M 20,8 L 25,8 M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25 M 12.5,37 C 18,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 20,16 10.5,13 6.5,19.5 C 3.5,25.5 12.5,30 12.5,30 L 12.5,37 z'
  },
};

/**
 * Draw a chessboard + pieces and side panel, then return canvas.
 */
export async function createBrilliantMoveImage({
  fen,
  username,
  moveNotation,
  uci,
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

  // Determine origin and destination squares from UCI notation
  let originSquare: string | null = null;
  let destSquare: string | null = null;
  if (uci && uci.length >= 4) {
    // Extract origin and destination squares from UCI (e.g., "e2e4" -> "e2", "e4")
    originSquare = uci.substring(0, 2);
    destSquare = uci.substring(2, 4);
  }

  // Draw board - using wooden theme matching react-chessboard defaults
  const light = '#F0D9B5'; // Light wooden/beige
  const dark = '#B58863';  // Dark wooden/brown
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const isDark = (r + c) % 2 === 1;
      ctx.fillStyle = isDark ? dark : light;
      ctx.fillRect(c * squareSize, r * squareSize, squareSize, squareSize);
    }
  }

  // Highlight origin and destination squares with vibrant yellow-gold overlay
  const highlightColor = 'rgba(229, 208, 96, 0.65)';
  if (originSquare) {
    const pos = squareToPixels(originSquare, squareSize);
    ctx.fillStyle = highlightColor;
    ctx.fillRect(pos.left, pos.top, squareSize, squareSize);
  }
  if (destSquare) {
    const pos = squareToPixels(destSquare, squareSize);
    ctx.fillStyle = highlightColor;
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
  ctx.fillText(`${username.toUpperCase()} played a`, paddingX, cursorY);

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

  // Optional footer brand
  ctx.fillStyle = '#00BFAE';
  ctx.font = '600 26px Arial, sans-serif';
  ctx.fillText('Chess.com', paddingX, height - 42);

  // Draw brilliant badges using the actual image from assets (await these to complete)
  const badgePromises: Promise<void>[] = [];
  
  // Badge on board if dest square
  if (destSquare) {
    const pos = squareToPixels(destSquare, squareSize);
    const cx = pos.left + squareSize * 0.75;
    const cy = pos.top + squareSize * 0.25;
    badgePromises.push(drawBrilliantBadge(ctx, cx, cy, squareSize * 0.28));
  }

  // Second badge bottom-right of card
  badgePromises.push(drawBrilliantBadge(ctx, paddingX + cardW - 40, cardY + cardH - 40, 30));

  // Wait for all badges to be drawn
  await Promise.all(badgePromises);

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
 * Draw chess piece using SVG path on canvas with glossy styling.
 * Matches the react-chessboard piece appearance.
 * White pieces receive subtle shadow effects for additional depth.
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
  
  const key = (color === 'w' ? 'w' : 'b') + type.toUpperCase();
  const pieceData = CHESS_PIECE_PATHS[key];
  
  if (pieceData) {
    // Parse viewBox to get original dimensions
    const viewBoxParts = pieceData.viewBox.split(' ');
    const vbWidth = parseFloat(viewBoxParts[2]);
    const vbHeight = parseFloat(viewBoxParts[3]);
    
    // Calculate scale and position to center piece in square
    const scale = (size * PIECE_SIZE_RATIO) / Math.max(vbWidth, vbHeight);
    const offsetX = x + (size - vbWidth * scale) / 2;
    const offsetY = y + (size - vbHeight * scale) / 2;
    
    // Apply transformation
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    
    // Create path and draw
    const path = new Path2D(pieceData.path);
    
    // Fill with piece color - white pieces are white, black pieces are black
    ctx.fillStyle = color === 'w' ? '#FFFFFF' : '#000000';
    ctx.fill(path);
    
    // Stroke outline for definition
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = PIECE_STROKE_WIDTH / scale;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke(path);
    
    // Add subtle shadow/depth for glossy effect on white pieces only
    if (color === 'w') {
      // Save current context state before applying shadow
      ctx.globalAlpha = 0.15;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 2 / scale;
      ctx.shadowOffsetX = 1 / scale;
      ctx.shadowOffsetY = 1 / scale;
      ctx.stroke(path);
      
      // Reset context properties to prevent affecting subsequent draws
      ctx.globalAlpha = 1.0;
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
  }
  
  ctx.restore();
}

/**
 * Draw brilliant badge using the actual brilliant.png image from assets.
 */
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
      // Draw image centered at (cx, cy) with diameter of 2*r
      const size = r * 2;
      ctx.drawImage(img, cx - r, cy - r, size, size);
      ctx.restore();
      resolve();
    };
    img.onerror = reject;
    img.src = brilliantBadge;
  });
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
  ctx.font = `700 ${diameter * 0.7}px Arial, sans-serif`;
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
 * Sanitize filename by removing invalid characters.
 */
export function sanitizeFilename(filename: string): string {
  // Replace invalid filename characters with underscores
  return filename.replace(/[/\\:*?"<>|]/g, '_');
}

/**
 * Download utility.
 */
export function downloadCanvas(canvas: HTMLCanvasElement, filename = 'brilliant_move.png'): void {
  const link = document.createElement('a');
  link.download = sanitizeFilename(filename);
  link.href = canvas.toDataURL('image/png');
  link.click();
}
