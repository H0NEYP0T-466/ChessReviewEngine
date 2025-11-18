# 🍯 HoneyPotEngine - Chess Game Review System

A full-stack chess game review application identical in UX and analytical depth to chess.com's Game Review feature. Built with React (TypeScript) frontend and FastAPI (Python) backend, powered by Stockfish engine.

## Features

- **PGN Input & Validation**: Upload or paste PGN games for analysis
- **Move-by-Move Analysis**: Deep engine evaluation for every move
- **Move Classification**:
  - ✨ **Brilliant** - Spectacular sacrifices and non-obvious moves
  - ✓ **Best** - Engine's top choice
  - **Excellent/Great/Good** - High-quality moves within threshold
  - **Mistake/Miss/Blunder** - Inaccuracies of varying severity
  - **Theory** - Opening book moves
- **Accuracy Metrics**: Player accuracy calculated from centipawn loss
- **Interactive Board**: Navigate through the game with visual arrows for better moves
- **Real-time Progress**: WebSocket streaming of analysis updates
- **Dark Theme**: Professional, polished UI optimized for chess analysis

## Architecture

### Backend (FastAPI + Python)
- **FastAPI** REST API with WebSocket support
- **Stockfish** chess engine integration
- **python-chess** for PGN parsing and move validation
- **Pydantic** for data validation
- **Loguru** for comprehensive logging

### Frontend (React + TypeScript)
- **React 19** with TypeScript
- **react-chessboard** for interactive board display
- **chess.js** for client-side move validation
- **TailwindCSS** for styling
- **@tanstack/react-query** for API state management
- **react-hot-toast** for notifications

## Setup Instructions

### Prerequisites

- **Python 3.12+**
- **Node.js 20+**
- **Stockfish Engine** (install separately)

### Backend Setup

1. **Install Stockfish**:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install stockfish
   
   # macOS
   brew install stockfish
   
   # Or download from https://stockfishchess.org/download/
   ```

2. **Create Python virtual environment**:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Stockfish path** (if not in default location):
   Create `backend/.env` file:
   ```env
   STOCKFISH_PATH=/path/to/stockfish
   ENGINE_DEPTH=18
   ENGINE_THREADS=4
   ```

5. **Run the backend**:
   ```bash
   python run.py
   ```
   
   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5173`

3. **Build for production**:
   ```bash
   npm run build
   npm run preview
   ```

## API Endpoints

### `POST /api/analyze`
Start game analysis
```json
{
  "pgn": "1. e4 e5 2. Nf3 ...",
  "engine_depth": 18,
  "time_per_move_ms": 300
}
```

### `GET /api/game/{task_id}`
Retrieve complete analysis result

### `WebSocket /ws/analyze/{task_id}`
Stream real-time analysis updates

### `GET /api/health`
Check engine availability

## Configuration

### Backend Settings (`backend/app/config.py`)

- **ENGINE_DEPTH**: Stockfish search depth (default: 18)
- **ENGINE_THREADS**: CPU threads for analysis (default: 4)
- **ENGINE_HASH_MB**: Hash table size (default: 256)
- **TIME_PER_MOVE_MS**: Analysis time per move (default: 300)

### Classification Thresholds (centipawns)

- **THRESHOLD_BEST**: 0 (exact match)
- **THRESHOLD_EXCELLENT**: 10 cp
- **THRESHOLD_GREAT**: 20 cp
- **THRESHOLD_GOOD**: 40 cp
- **THRESHOLD_MISTAKE**: 100 cp
- **THRESHOLD_MISS**: 200 cp
- **THRESHOLD_BLUNDER**: 300 cp

### Accuracy Calculation

Uses exponential decay formula:
```
accuracy = 100 * exp(-CPL / K)
```
where K = 120 (configurable via `ACCURACY_K_FACTOR`)

## Usage

1. **Paste or upload a PGN game**
2. Click **"Analyze Game"**
3. Watch real-time analysis progress
4. Navigate through moves using:
   - Previous/Next buttons
   - Move list sidebar
   - First/Last shortcuts
5. Review move classifications and accuracy metrics
6. Examine best move arrows for mistakes

## Sample PGN

The app includes a sample game (Fischer vs Spassky). Click "Load Sample" to try it out.

## Development

### Backend Structure
```
backend/
├── app/
│   ├── api/           # API routes
│   ├── engine/        # Stockfish wrapper & analyzer
│   ├── models/        # Pydantic schemas
│   ├── utils/         # PGN parsing, logging
│   ├── ws/            # WebSocket manager
│   ├── config.py      # Settings
│   └── main.py        # FastAPI app
├── requirements.txt
└── run.py
```

### Frontend Structure
```
src/
├── components/        # React components
├── api/               # API client
├── types/             # TypeScript types
├── App.tsx            # Main app component
└── index.css          # Global styles
```

## Logging

All backend operations are logged with `logger.info`:
- PGN parsing and validation
- Engine initialization
- Per-move evaluation details
- Accuracy computations
- WebSocket events
- Error contexts

## Performance

- Analysis speed depends on:
  - Engine depth (higher = slower but more accurate)
  - Number of moves in the game
  - CPU performance
- Typical analysis: ~0.3-0.5 seconds per move at depth 18
- WebSocket streaming provides immediate feedback

## Troubleshooting

**Backend won't start**:
- Check Stockfish is installed: `stockfish` or `which stockfish`
- Verify Python dependencies: `pip list`
- Check logs for specific errors

**Frontend can't connect to backend**:
- Ensure backend is running on port 8000
- Check CORS settings in `backend/app/config.py`
- Verify WebSocket connection in browser console

**Analysis fails**:
- Validate PGN format (use chess.com or lichess export)
- Check engine depth isn't too high (>25 may be slow)
- Review backend logs for detailed error messages

## Future Enhancements

- [ ] Opening theory database integration (ECO)
- [ ] Multiple engine support (Lc0, Komodo)
- [ ] Game database and history
- [ ] Export annotated PGN
- [ ] Comparative analysis (multiple games)
- [ ] Cloud deployment configuration

## License

MIT

## Credits

- **Stockfish** - World's strongest chess engine
- **python-chess** - Chess library for Python
- **react-chessboard** - React chessboard component
- **chess.js** - JavaScript chess library

---

Built with ❤️ for chess enthusiasts
