import html2canvas from 'html2canvas';
import brilliantBadge from '../assets/brillant.png';

export interface BrilliantMoveImageOptions {
  boardElement: HTMLElement;
  username: string;
  moveNotation: string;
  classification?: string;
  destSquare?: string;
  boardOrientation?: 'white' | 'black';
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
  const badgeSize = squareSize * 0.45; // 45% of square size
  const badgeX = squareX + squareSize - badgeSize - (squareSize * -0.2); // Position adjustment
  const badgeY = squareY + (squareSize * -0.2); // Position adjustment

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
 * REDESIGNED: Draw the decorative side panel with modern aesthetics
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
  const centerX = panelX + panelWidth / 2;
  const contentWidth = panelWidth * 0.85; // 85% of panel width
  const paddingX = panelX + (panelWidth - contentWidth) / 2;
  
  // 1. Panel Background (Subtle Gradient for depth)
  const gradient = ctx.createLinearGradient(panelX, 0, panelX + panelWidth, height);
  gradient.addColorStop(0, '#22211F'); 
  gradient.addColorStop(1, '#1A1918');
  ctx.fillStyle = gradient;
  ctx.fillRect(panelX, 0, panelWidth, height);

  // Separator Line
  ctx.strokeStyle = '#302E2C';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(panelX, 0);
  ctx.lineTo(panelX, height);
  ctx.stroke();

  // Determine Colors based on classification
  const accentColor = getClassificationColor(classification);
  const textColor = '#FFFFFF';
  const subTextColor = '#AAAAAA';

  let cursorY = height * 0.08; // Start 8% down (increased top padding)

  // 2. Game Review Header (Small pill shape)
  ctx.save();
  ctx.font = '700 24px "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  const reviewText = "GAME REVIEW";
  const textMetrics = ctx.measureText(reviewText);
  const pillWidth = textMetrics.width + 60;
  const pillHeight = 44;
  
  ctx.fillStyle = '#302E2C';
  roundRect(ctx, centerX - pillWidth/2, cursorY, pillWidth, pillHeight, 22);
  
  // Star Icon in header
  ctx.fillStyle = '#E5D060'; // Gold star
  ctx.fillText("★", centerX - pillWidth/2 + 20, cursorY + pillHeight/2 + 9); // slight y adjust for font baseline
  
  ctx.fillStyle = '#CCCCCC';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(reviewText, centerX + 15, cursorY + pillHeight/2 + 1);
  ctx.restore();

  cursorY += 120; // INCREASED GAP (was 80)

  // 3. Player Info - CHANGED: Username first
  // Username (Large, Gold/White)
  ctx.fillStyle = '#FFFFFF';
  // Dynamic font size based on name length
  const nameFontSize = username.length > 12 ? 48 : 60;
  ctx.font = `700 ${nameFontSize}px "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(username, centerX, cursorY);
  
  cursorY += 65; // INCREASED GAP (was 50)
  
  // CHANGED: "played a" text
  ctx.fillStyle = subTextColor;
  ctx.font = '600 30px "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  ctx.fillText("played a", centerX, cursorY);

  cursorY += 120; // INCREASED GAP (was 80)

  // 4. Move Notation Box (The Highlight)
  // Draw a large card for the move
  const moveBoxHeight = 220; // INCREASED HEIGHT (was 200)
  const moveBoxY = cursorY;
  
  // Glow effect for the Brilliant move
  if (classification === 'brilliant') {
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 25;
  }
  
  // Box Background
  ctx.fillStyle = '#2A2927';
  roundRect(ctx, paddingX, moveBoxY, contentWidth, moveBoxHeight, 16);
  ctx.shadowBlur = 0; // Reset shadow

  // Border for box (colored by classification)
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 4;
  roundRect(ctx, paddingX, moveBoxY, contentWidth, moveBoxHeight, 16, false, true);

  // Move Text
  ctx.fillStyle = accentColor; // Make the move notation the accent color
  ctx.font = '800 115px "Segoe UI", Roboto, Helvetica, Arial, sans-serif'; // INCREASED FONT SIZE (was 110)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(moveNotation, centerX, moveBoxY + moveBoxHeight/2 + 5);

  // Add Brilliant Icon overlapping the box corner if brilliant
  if (classification === 'brilliant') {
    const badgeSize = 80;
    // Position at top-right of the move box, slightly floating out
    const badgeX = paddingX + contentWidth - badgeSize/2 - 10;
    const badgeY = moveBoxY - badgeSize/2 + 10;
    await drawBrilliantBadgeImage(ctx, badgeX + badgeSize/2, badgeY + badgeSize/2, badgeSize/2);
  }

  cursorY += moveBoxHeight + 85; // INCREASED GAP (was 60)

  // 5. Classification Title
  const title = classification === 'brilliant' ? 'BRILLIANT MOVE!!' : formatClassificationTitle(classification).toUpperCase();
  
  ctx.fillStyle = accentColor;
  ctx.font = '900 58px "Segoe UI", Roboto, Helvetica, Arial, sans-serif'; // INCREASED FONT SIZE (was 56)
  ctx.textAlign = 'center';
  ctx.fillText(title, centerX, cursorY);

  // 6. Footer / Watermark
  const brandingY = height - 50; // INCREASED BOTTOM PADDING (was 40)
  ctx.textAlign = 'center';
  
  // Draw a longer decorative line - INCREASED LENGTH
  ctx.strokeStyle = '#3A3937';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX - 60, brandingY - 50); // INCREASED from 40 to 100 (line is now 200px wide)
  ctx.lineTo(centerX + 60, brandingY - 50);
  ctx.stroke();

  ctx.font = '600 26px "Segoe UI", Roboto, Helvetica, Arial, sans-serif'; // INCREASED FONT SIZE (was 24)
  ctx.fillStyle = '#666666';
  ctx.fillText('~honeypot.Engine', centerX, brandingY);
}

/**
 * Helper to get color based on move quality
 */
function getClassificationColor(classification: string): string {
  switch (classification.toLowerCase()) {
    case 'brilliant': return '#1BACA6'; // Teal
    case 'great': return '#5C8BB0';     // Blue
    case 'best': 
    case 'excellent': return '#81B64C'; // Green
    case 'good': return '#96BC4B';      // Light Green
    case 'book': return '#D5A47D';      // Brown
    case 'blunder': return '#FA412D';   // Red
    case 'mistake': return '#FFA459';   // Orange
    case 'inaccuracy': return '#F7C045';// Yellow
    default: return '#FFFFFF';
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill = true,
  stroke = false
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
  
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
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