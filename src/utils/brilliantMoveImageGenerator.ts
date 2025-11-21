import html2canvas from 'html2canvas';
import brilliantBadge from '../assets/brillant.png';

export interface BrilliantMoveImageOptions {
  boardElement: HTMLElement;
  username: string;
  moveNotation: string;
  classification?: string;
  destSquare?: string; // NEW: Destination square for badge placement
  boardOrientation?: 'white' | 'black'; // NEW: Board orientation
}

/**
 * Creates a downloadable image combining the chessboard screenshot with a side panel
 */
export async function createBrilliantMoveImage({
  boardElement,
  username,
  moveNotation,
  classification = 'brilliant',
  destSquare,
  boardOrientation = 'white',
}: BrilliantMoveImageOptions): Promise<HTMLCanvasElement> {
  // Capture the board element as canvas
  const boardCanvas = await html2canvas(boardElement, {
    backgroundColor: '#242322',
    scale: 2, // Higher quality
    logging: false,
  });

  // Create final canvas with board + side panel
  const boardWidth = boardCanvas.width;
  const boardHeight = boardCanvas.height;
  const panelWidth = Math.floor(boardWidth * 0.58); // Side panel width
  const totalWidth = boardWidth + panelWidth;
  const totalHeight = boardHeight;

  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = totalWidth;
  finalCanvas.height = totalHeight;
  const ctx = finalCanvas.getContext('2d');

  if (!ctx) throw new Error('Failed to get canvas context');

  // Background
  ctx.fillStyle = '#242322';
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // Draw the captured board
  ctx.drawImage(boardCanvas, 0, 0);

  // Draw brilliant badge on the board at destination square
  if (classification === 'brilliant' && destSquare) {
    await drawBadgeOnBoard(ctx, destSquare, boardWidth, boardHeight, boardOrientation);
  }

  // Draw side panel
  await drawSidePanel(ctx, boardWidth, panelWidth, totalHeight, username, moveNotation, classification);

  return finalCanvas;
}

/**
 * Draw badge on the chessboard at the correct square position
 */
async function drawBadgeOnBoard(
  ctx: CanvasRenderingContext2D,
  square: string,
  boardWidth: number,
  boardHeight: number,
  orientation: 'white' | 'black'
): Promise<void> {
  if (square.length !== 2) return;

  const file = square.charCodeAt(0) - 'a'.charCodeAt(0); // 0-7
  const rank = parseInt(square[1], 10) - 1; // 0-7

  // Calculate square position based on orientation
  const squareSize = boardWidth / 8;
  let displayFile: number;
  let displayRank: number;

  if (orientation === 'white') {
    displayFile = file;
    displayRank = 7 - rank;
  } else {
    displayFile = 7 - file;
    displayRank = rank;
  }

  const squareX = displayFile * squareSize;
  const squareY = displayRank * squareSize;

  // Position badge in top-right corner of the square
  const badgeSize = squareSize * 0.45; // 35% of square size - adjust this to your preference
  const badgeX = squareX + squareSize - badgeSize - (squareSize * -0.2); // 5% padding from right
  const badgeY = squareY + (squareSize * -0.2); // 5% padding from top

  await drawBrilliantBadgeImage(ctx, badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize / 2);
}

/**
 * Draw the brilliant badge icon
 */
async function drawBrilliantBadgeImage(
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
      // Draw with explicit width and height to maintain aspect ratio
      ctx.drawImage(img, cx - r, cy - r, size, size);
      ctx.restore();
      resolve();
    };
    img.onerror = (error) => {
      console.error('Failed to load brilliant badge:', error);
      resolve();
    };
    img.src = brilliantBadge;
  });
}

/**
 * Draw the decorative side panel with move information
 */
async function drawSidePanel(
  ctx: CanvasRenderingContext2D,
  panelX: number,
  panelWidth: number,
  height: number,
  username: string,
  moveNotation: string,
  classification: string
): Promise<void> {
  const paddingX = panelX + 40;
  let cursorY = 60;

  // Star badge
  drawStarBadge(ctx, paddingX, cursorY - 30, 40);

  // Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 36px Arial, sans-serif';
  ctx.fillText('Game Review', paddingX + 55, cursorY);

  // Username text
  cursorY += 70;
  ctx.fillStyle = '#D0CFCC';
  ctx.font = '600 22px Arial, sans-serif';
  ctx.fillText(`${username.toUpperCase()} played a`, paddingX, cursorY);

  // Classification text
  cursorY += 50;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 44px Arial, sans-serif';
  const classificationText = classification === 'brilliant' ? 'Brilliant Move!' : formatClassificationTitle(classification);
  ctx.fillText(classificationText, paddingX, cursorY);

  // Move card
  cursorY += 70;
  const cardWidth = panelWidth - 80;
  const cardHeight = 240;
  const cardY = cursorY;
  ctx.fillStyle = '#1F1E1D';
  roundRect(ctx, paddingX, cardY, cardWidth, cardHeight, 24);

  // Move notation in card
  ctx.fillStyle = classification === 'brilliant' ? '#00BFAE' : '#E5D060';
  ctx.font = '700 100px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(moveNotation, paddingX + cardWidth / 2, cardY + cardHeight / 2);
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';

  // Add brilliant badge to the bottom-right corner of the card
  if (classification === 'brilliant') {
    const badgeSize = 80;
    const badgeX = paddingX + cardWidth - badgeSize - 1;
    const badgeY = cardY + cardHeight - badgeSize - 170;
    await drawBrilliantBadgeImage(ctx, badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize / 2);
  }

  // Footer branding
  ctx.fillStyle = '#E5D060';
  ctx.font = '600 32px Arial, sans-serif';
  ctx.fillText('Honeypot.Engine', paddingX, height - 60);
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

function formatClassificationTitle(classification: string): string {
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

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[/\\:*?"<>|]/g, '_');
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename = 'brilliant_move.png'): void {
  const link = document.createElement('a');
  link.download = sanitizeFilename(filename);
  link.href = canvas.toDataURL('image/png');
  link.click();
}