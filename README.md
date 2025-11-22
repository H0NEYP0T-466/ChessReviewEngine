# ChessReviewEngine

<p align="center">

  <!-- Core -->
  ![GitHub License](https://img.shields.io/github/license/H0NEYP0T-466/ChessReviewEngine?style=for-the-badge&color=brightgreen)  
  ![GitHub Stars](https://img.shields.io/github/stars/H0NEYP0T-466/ChessReviewEngine?style=for-the-badge&color=yellow)  
  ![GitHub Forks](https://img.shields.io/github/forks/H0NEYP0T-466/ChessReviewEngine?style=for-the-badge&color=blue)  
  ![GitHub Issues](https://img.shields.io/github/issues/H0NEYP0T-466/ChessReviewEngine?style=for-the-badge&color=red)  
  ![GitHub Pull Requests](https://img.shields.io/github/issues-pr/H0NEYP0T-466/ChessReviewEngine?style=for-the-badge&color=orange)  
  ![Contributions Welcome](https://img.shields.io/badge/Contributions-Welcome-brightgreen?style=for-the-badge)  

  <!-- Activity -->
  ![Last Commit](https://img.shields.io/github/last-commit/H0NEYP0T-466/ChessReviewEngine?style=for-the-badge&color=purple)  
  ![Commit Activity](https://img.shields.io/github/commit-activity/m/H0NEYP0T-466/ChessReviewEngine?style=for-the-badge&color=teal)  
  ![Repo Size](https://img.shields.io/github/repo-size/H0NEYP0T-466/ChessReviewEngine?style=for-the-badge&color=blueviolet)  
  ![Code Size](https://img.shields.io/github/languages/code-size/H0NEYP0T-466/ChessReviewEngine?style=for-the-badge&color=indigo)  

  <!-- Languages -->
  ![Top Language](https://img.shields.io/github/languages/top/H0NEYP0T-466/ChessReviewEngine?style=for-the-badge&color=critical)  
  ![Languages Count](https://img.shields.io/github/languages/count/H0NEYP0T-466/ChessReviewEngine?style=for-the-badge&color=success)  

  <!-- Community -->
  ![Documentation](https://img.shields.io/badge/Docs-Available-green?style=for-the-badge&logo=readthedocs&logoColor=white)  
  ![Open Source Love](https://img.shields.io/badge/Open%20Source-%E2%9D%A4-red?style=for-the-badge)  

</p>

<p align="center">
  <strong>A full-stack chess game review application with deep engine analysis powered by Stockfish</strong>
</p>

<p align="center">
  Analyze chess games with professional-grade move-by-move evaluation, classification, and accuracy metrics - identical in UX and analytical depth to chess.com's Game Review feature.
</p>

---

## 🔗 Quick Links

- [🐛 Report Bug](https://github.com/H0NEYP0T-466/ChessReviewEngine/issues/new?template=bug_report.yml)
- [💡 Request Feature](https://github.com/H0NEYP0T-466/ChessReviewEngine/issues/new?template=feature_request.yml)
- [📖 View Issues](https://github.com/H0NEYP0T-466/ChessReviewEngine/issues)
- [🤝 Contributing Guidelines](CONTRIBUTING.md)
- [🛡️ Security Policy](SECURITY.md)

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [🚀 Installation](#-installation)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [⚡ Usage](#-usage)
  - [Starting the Application](#starting-the-application)
  - [Analyzing a Game](#analyzing-a-game)
  - [API Examples](#api-examples)
- [📂 Folder Structure](#-folder-structure)
- [🛠 Tech Stack](#-tech-stack)
- [📦 Dependencies & Packages](#-dependencies--packages)
- [🎯 Configuration](#-configuration)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)
- [🛡 Security](#-security)
- [📏 Code of Conduct](#-code-of-conduct)

---

## ✨ Features

- **🎮 PGN Input & Validation** - Upload or paste PGN games for comprehensive analysis
- **🔍 Move-by-Move Analysis** - Deep engine evaluation for every position in the game
- **🏆 Advanced Move Classification**:
  - ✨ **Brilliant** - Spectacular sacrifices and non-obvious winning moves
  - ✓ **Best** - Engine's top recommended move
  - **Excellent/Great/Good** - High-quality moves within acceptable thresholds
  - **Mistake/Miss/Blunder** - Inaccuracies of varying severity levels
  - **Theory** - Known opening book moves
- **📊 Accuracy Metrics** - Precise player accuracy calculated from centipawn loss
- **🎯 Interactive Chess Board** - Navigate through games with visual arrows showing better alternatives
- **⚡ Real-time Progress** - WebSocket streaming for live analysis updates
- **🌙 Professional Dark Theme** - Polished UI optimized for chess analysis
- **🔄 Smart Engine Integration** - Auto-detection of Stockfish installation across platforms

---

## 🚀 Installation

### Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.12+** - [Download Python](https://www.python.org/downloads/)
- **Node.js 20+** - [Download Node.js](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Stockfish Chess Engine** - [Download Stockfish](https://stockfishchess.org/download/)

### Backend Setup

1. **Install Stockfish Engine**

   **Ubuntu/Debian:**
   ```bash
   sudo apt-get update
   sudo apt-get install stockfish
   ```

   **macOS:**
   ```bash
   brew install stockfish
   ```

   **Windows:**
   Download from [https://stockfishchess.org/download/](https://stockfishchess.org/download/) and add to PATH.

2. **Navigate to backend directory**

   ```bash
   cd backend
   ```

3. **Create and activate Python virtual environment**

   **Linux/macOS:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

   **Windows:**
   ```bash
   python -m venv venv
   venv\Scripts\activate
   ```

4. **Install Python dependencies**

   ```bash
   pip install -r requirements.txt
   ```

5. **Configure Stockfish path (optional)**

   The application automatically detects Stockfish from system PATH and platform-specific locations. To override, create a `.env` file in the `backend` directory:

   ```env
   STOCKFISH_PATH=/custom/path/to/stockfish
   ENGINE_DEPTH=18
   ENGINE_THREADS=4
   ENGINE_HASH_MB=256
   ```

6. **Start the backend server**

   ```bash
   python run.py
   ```

   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to project root**

   ```bash
   cd ..  # if you're in the backend directory
   ```

2. **Install npm dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

4. **Build for production**

   ```bash
   npm run build
   npm run preview
   ```

---

## ⚡ Usage

### Starting the Application

1. **Start the backend server** (in the `backend` directory):
   ```bash
   python run.py
   ```

2. **Start the frontend** (in the project root):
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

### Analyzing a Game

1. **Paste or upload a PGN game** in the input area
2. Click **"Analyze Game"** to start the analysis
3. **Watch real-time progress** as each move is evaluated
4. **Navigate through moves** using:
   - Previous/Next buttons
   - Move list sidebar
   - First/Last shortcuts
5. **Review classifications** for each move and accuracy metrics
6. **Examine alternative moves** shown with arrows for mistakes and blunders

### API Examples

#### Start Analysis (POST)

```bash
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "pgn": "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6",
    "engine_depth": 18,
    "time_per_move_ms": 300
  }'
```

#### Get Analysis Results (GET)

```bash
curl http://localhost:8000/api/game/{task_id}
```

#### WebSocket Connection

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/analyze/{task_id}');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Progress:', data.progress);
};
```

#### Health Check

```bash
curl http://localhost:8000/api/health
```

---

## 📂 Folder Structure

```
ChessReviewEngine/
├── backend/                      # Python FastAPI backend
│   ├── app/
│   │   ├── api/                  # API route handlers
│   │   ├── engine/               # Stockfish integration & analyzer
│   │   ├── models/               # Pydantic data models
│   │   ├── utils/                # PGN parsing and utilities
│   │   ├── ws/                   # WebSocket connection manager
│   │   ├── config.py             # Application configuration
│   │   └── main.py               # FastAPI application entry
│   ├── requirements.txt          # Python dependencies
│   ├── run.py                    # Backend startup script
│   └── test_*.py                 # Integration and unit tests
├── src/                          # React frontend source
│   ├── api/                      # API client and utilities
│   ├── assets/                   # Static assets
│   ├── components/               # React components
│   ├── types/                    # TypeScript type definitions
│   ├── utils/                    # Frontend utilities
│   ├── App.tsx                   # Main application component
│   ├── main.tsx                  # React entry point
│   └── index.css                 # Global styles
├── public/                       # Static public assets
├── sample_games/                 # Example PGN files
├── .github/                      # GitHub configuration
│   ├── ISSUE_TEMPLATE/           # Issue templates
│   └── pull_request_template.md  # PR template
├── package.json                  # npm dependencies
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite build configuration
├── eslint.config.js              # ESLint configuration
├── postcss.config.js             # PostCSS configuration
├── CONTRIBUTING.md               # Contribution guidelines
├── SECURITY.md                   # Security policy
├── CODE_OF_CONDUCT.md            # Code of conduct
├── LICENSE                       # MIT License
└── README.md                     # This file
```

---

## 🛠 Tech Stack

### Languages

![TypeScript](https://img.shields.io/badge/TypeScript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![JavaScript](https://img.shields.io/badge/JavaScript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)

### Frameworks & Libraries

![React](https://img.shields.io/badge/React-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Vite](https://img.shields.io/badge/Vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind%20CSS-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![TanStack Query](https://img.shields.io/badge/-TanStack%20Query-FF4154?style=for-the-badge&logo=react%20query&logoColor=white)

### Build Tools & DevOps

![npm](https://img.shields.io/badge/npm-%23CB3837.svg?style=for-the-badge&logo=npm&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B3263?style=for-the-badge&logo=eslint&logoColor=white)
![PostCSS](https://img.shields.io/badge/PostCSS-%23DD3A0A.svg?style=for-the-badge&logo=postcss&logoColor=white)

### Chess Engines & Libraries

![Stockfish](https://img.shields.io/badge/Stockfish-Engine-000000?style=for-the-badge)
![chess.js](https://img.shields.io/badge/chess.js-Library-yellow?style=for-the-badge)
![python-chess](https://img.shields.io/badge/python--chess-Library-blue?style=for-the-badge)

### Other Tools

![WebSocket](https://img.shields.io/badge/WebSocket-Protocol-010101?style=for-the-badge)
![Pydantic](https://img.shields.io/badge/Pydantic-Validation-E92063?style=for-the-badge)
![Uvicorn](https://img.shields.io/badge/Uvicorn-Server-2C5F2D?style=for-the-badge)

---

## 📦 Dependencies & Packages

### Frontend Dependencies

<details open>
<summary><strong>Runtime Dependencies</strong></summary>

[![react](https://img.shields.io/npm/v/react?style=for-the-badge&label=react&color=61DAFB)](https://www.npmjs.com/package/react)
[![react-dom](https://img.shields.io/npm/v/react-dom?style=for-the-badge&label=react-dom&color=61DAFB)](https://www.npmjs.com/package/react-dom)
[![chess.js](https://img.shields.io/npm/v/chess.js?style=for-the-badge&label=chess.js&color=yellow)](https://www.npmjs.com/package/chess.js)
[![react-chessboard](https://img.shields.io/npm/v/react-chessboard?style=for-the-badge&label=react-chessboard&color=blue)](https://www.npmjs.com/package/react-chessboard)
[![@tanstack/react-query](https://img.shields.io/npm/v/@tanstack/react-query?style=for-the-badge&label=@tanstack/react-query&color=FF4154)](https://www.npmjs.com/package/@tanstack/react-query)
[![react-hot-toast](https://img.shields.io/npm/v/react-hot-toast?style=for-the-badge&label=react-hot-toast&color=orange)](https://www.npmjs.com/package/react-hot-toast)
[![tailwindcss](https://img.shields.io/npm/v/tailwindcss?style=for-the-badge&label=tailwindcss&color=38B2AC)](https://www.npmjs.com/package/tailwindcss)
[![@tailwindcss/vite](https://img.shields.io/npm/v/@tailwindcss/vite?style=for-the-badge&label=@tailwindcss/vite&color=38B2AC)](https://www.npmjs.com/package/@tailwindcss/vite)
[![@tailwindcss/postcss](https://img.shields.io/npm/v/@tailwindcss/postcss?style=for-the-badge&label=@tailwindcss/postcss&color=38B2AC)](https://www.npmjs.com/package/@tailwindcss/postcss)
[![postcss](https://img.shields.io/npm/v/postcss?style=for-the-badge&label=postcss&color=DD3A0A)](https://www.npmjs.com/package/postcss)
[![autoprefixer](https://img.shields.io/npm/v/autoprefixer?style=for-the-badge&label=autoprefixer&color=DD3A0A)](https://www.npmjs.com/package/autoprefixer)
[![html-to-image](https://img.shields.io/npm/v/html-to-image?style=for-the-badge&label=html-to-image&color=green)](https://www.npmjs.com/package/html-to-image)
[![html2canvas](https://img.shields.io/npm/v/html2canvas?style=for-the-badge&label=html2canvas&color=green)](https://www.npmjs.com/package/html2canvas)

- **react** ^19.2.0 - Core React library for building user interfaces
- **react-dom** ^19.2.0 - React DOM rendering
- **chess.js** ^1.4.0 - Chess move validation and game state management
- **react-chessboard** ^5.8.4 - Interactive chess board component
- **@tanstack/react-query** ^5.90.10 - Powerful asynchronous state management
- **react-hot-toast** ^2.6.0 - Beautiful toast notifications
- **tailwindcss** ^4.1.17 - Utility-first CSS framework
- **html-to-image** ^1.11.13 - Convert DOM to images

</details>

<details>
<summary><strong>Development Dependencies</strong></summary>

[![typescript](https://img.shields.io/npm/v/typescript?style=for-the-badge&label=typescript&color=007ACC)](https://www.npmjs.com/package/typescript)
[![vite](https://img.shields.io/npm/v/vite?style=for-the-badge&label=vite&color=646CFF)](https://www.npmjs.com/package/vite)
[![@vitejs/plugin-react](https://img.shields.io/npm/v/@vitejs/plugin-react?style=for-the-badge&label=@vitejs/plugin-react&color=61DAFB)](https://www.npmjs.com/package/@vitejs/plugin-react)
[![eslint](https://img.shields.io/npm/v/eslint?style=for-the-badge&label=eslint&color=4B3263)](https://www.npmjs.com/package/eslint)
[![typescript-eslint](https://img.shields.io/npm/v/typescript-eslint?style=for-the-badge&label=typescript-eslint&color=007ACC)](https://www.npmjs.com/package/typescript-eslint)
[![@eslint/js](https://img.shields.io/npm/v/@eslint/js?style=for-the-badge&label=@eslint/js&color=4B3263)](https://www.npmjs.com/package/@eslint/js)
[![eslint-plugin-react-hooks](https://img.shields.io/npm/v/eslint-plugin-react-hooks?style=for-the-badge&label=eslint-plugin-react-hooks&color=61DAFB)](https://www.npmjs.com/package/eslint-plugin-react-hooks)
[![eslint-plugin-react-refresh](https://img.shields.io/npm/v/eslint-plugin-react-refresh?style=for-the-badge&label=eslint-plugin-react-refresh&color=61DAFB)](https://www.npmjs.com/package/eslint-plugin-react-refresh)
[![@types/react](https://img.shields.io/npm/v/@types/react?style=for-the-badge&label=@types/react&color=007ACC)](https://www.npmjs.com/package/@types/react)
[![@types/react-dom](https://img.shields.io/npm/v/@types/react-dom?style=for-the-badge&label=@types/react-dom&color=007ACC)](https://www.npmjs.com/package/@types/react-dom)
[![@types/node](https://img.shields.io/npm/v/@types/node?style=for-the-badge&label=@types/node&color=007ACC)](https://www.npmjs.com/package/@types/node)
[![globals](https://img.shields.io/npm/v/globals?style=for-the-badge&label=globals&color=blue)](https://www.npmjs.com/package/globals)

- **typescript** ~5.9.3 - TypeScript compiler
- **vite** ^7.2.2 - Next-generation frontend build tool
- **@vitejs/plugin-react** ^5.1.0 - Official React plugin for Vite
- **eslint** ^9.39.1 - Linting utility for JavaScript/TypeScript
- **typescript-eslint** ^8.46.3 - TypeScript support for ESLint

</details>

### Backend Dependencies

<details open>
<summary><strong>Python Runtime Dependencies</strong></summary>

[![fastapi](https://img.shields.io/pypi/v/fastapi?style=for-the-badge&label=fastapi&color=009688)](https://pypi.org/project/fastapi/)
[![uvicorn](https://img.shields.io/pypi/v/uvicorn?style=for-the-badge&label=uvicorn&color=2C5F2D)](https://pypi.org/project/uvicorn/)
[![python-chess](https://img.shields.io/pypi/v/python-chess?style=for-the-badge&label=python-chess&color=blue)](https://pypi.org/project/python-chess/)
[![stockfish](https://img.shields.io/pypi/v/stockfish?style=for-the-badge&label=stockfish&color=black)](https://pypi.org/project/stockfish/)
[![pydantic](https://img.shields.io/pypi/v/pydantic?style=for-the-badge&label=pydantic&color=E92063)](https://pypi.org/project/pydantic/)
[![pydantic-settings](https://img.shields.io/pypi/v/pydantic-settings?style=for-the-badge&label=pydantic-settings&color=E92063)](https://pypi.org/project/pydantic-settings/)
[![websockets](https://img.shields.io/pypi/v/websockets?style=for-the-badge&label=websockets&color=blue)](https://pypi.org/project/websockets/)
[![loguru](https://img.shields.io/pypi/v/loguru?style=for-the-badge&label=loguru&color=orange)](https://pypi.org/project/loguru/)

- **fastapi** 0.115.6 - Modern, fast web framework for building APIs
- **uvicorn[standard]** 0.34.0 - Lightning-fast ASGI server
- **python-chess** 1.999 - Chess library for move generation and validation
- **stockfish** 3.28.0 - Python wrapper for Stockfish chess engine
- **pydantic** 2.10.6 - Data validation using Python type hints
- **pydantic-settings** 2.7.1 - Settings management with Pydantic
- **websockets** 14.1 - WebSocket protocol implementation
- **loguru** 0.7.3 - Simplified logging with rich features

</details>

---

## 🎯 Configuration

### Backend Configuration

The backend can be configured via environment variables in `backend/.env`:

```env
# Engine Configuration
STOCKFISH_PATH=/path/to/stockfish    # Auto-detected if not set
ENGINE_DEPTH=18                      # Search depth (1-30)
ENGINE_THREADS=4                     # CPU threads to use
ENGINE_HASH_MB=256                   # Hash table size in MB
TIME_PER_MOVE_MS=300                 # Analysis time per move

# Classification Thresholds (centipawns)
THRESHOLD_BEST=0                     # Exact match with best move
THRESHOLD_EXCELLENT=10               # Within 10 cp
THRESHOLD_GREAT=20                   # Within 20 cp
THRESHOLD_GOOD=40                    # Within 40 cp
THRESHOLD_MISTAKE=100                # 40-100 cp loss
THRESHOLD_MISS=200                   # 100-200 cp loss
THRESHOLD_BLUNDER=300                # 200+ cp loss

# Accuracy Calculation
ACCURACY_K_FACTOR=120                # Exponential decay constant
```

### Classification System

Move classifications are based on centipawn loss:

| Classification | Criteria |
|---------------|----------|
| ✨ Brilliant | Best move involving a sacrifice |
| ✓ Best | Exact engine recommendation (0 cp loss) |
| Excellent | Within 10 cp of best |
| Great | Within 20 cp of best |
| Good | Within 40 cp of best |
| Inaccuracy | 40-100 cp loss |
| Mistake | 100-200 cp loss |
| Blunder | 200+ cp loss |
| Book | Opening theory move |

### Accuracy Formula

Player accuracy is calculated using exponential decay:

```
accuracy = 100 × exp(-CPL / K)
```

Where:
- **CPL** = Total centipawn loss for all moves
- **K** = Decay constant (default: 120)

---

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guidelines](CONTRIBUTING.md) to get started.

**Quick Start:**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the existing style and includes appropriate tests.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🛡 Security

Security is a top priority. If you discover a security vulnerability, please follow our [Security Policy](SECURITY.md) to report it responsibly.

---

## 📏 Code of Conduct

This project adheres to the Contributor Covenant [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

---

## 🙏 Acknowledgments

- **[Stockfish](https://stockfishchess.org/)** - World's strongest open-source chess engine
- **[python-chess](https://python-chess.readthedocs.io/)** - Comprehensive chess library for Python
- **[react-chessboard](https://www.npmjs.com/package/react-chessboard)** - Beautiful React chessboard component
- **[chess.js](https://github.com/jhlywa/chess.js)** - JavaScript chess library for move validation

---

<p align="center">Made with ❤️ by H0NEYP0T-466</p>
