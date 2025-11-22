# Contributing to ChessReviewEngine

Thank you for your interest in contributing to ChessReviewEngine! We welcome contributions from the community and are grateful for your support.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Pull Requests](#pull-requests)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Community](#community)

---

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

---

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

**Use the Bug Report Template:**
- Navigate to [Issues](https://github.com/H0NEYP0T-466/ChessReviewEngine/issues/new?template=bug_report.yml)
- Fill in all required fields
- Provide clear steps to reproduce
- Include system information (OS, Python/Node version, etc.)
- Add relevant logs and screenshots

**Good Bug Reports Include:**
- A clear, descriptive title
- Exact steps to reproduce the problem
- Expected vs. actual behavior
- Screenshots or animated GIFs (if applicable)
- Error messages and stack traces
- Environment details

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

**Use the Feature Request Template:**
- Navigate to [Issues](https://github.com/H0NEYP0T-466/ChessReviewEngine/issues/new?template=feature_request.yml)
- Provide a clear description of the feature
- Explain why this enhancement would be useful
- Include mockups or examples if possible

**Good Enhancement Suggestions Include:**
- Clear use case and problem statement
- Proposed solution with implementation details
- Alternative approaches considered
- Potential risks or concerns

### Pull Requests

We actively welcome your pull requests! Here's how to submit one:

1. **Fork the Repository**
   ```bash
   git clone https://github.com/YOUR-USERNAME/ChessReviewEngine.git
   cd ChessReviewEngine
   ```

2. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

   Use prefixes:
   - `feature/` - New features
   - `fix/` - Bug fixes
   - `docs/` - Documentation updates
   - `refactor/` - Code refactoring
   - `test/` - Test additions/updates
   - `chore/` - Maintenance tasks

3. **Make Your Changes**
   - Write clear, readable code
   - Follow existing code style
   - Add tests for new features
   - Update documentation as needed

4. **Test Your Changes**
   
   **Frontend:**
   ```bash
   npm run lint
   npm run build
   npm run dev  # Manual testing
   ```

   **Backend:**
   ```bash
   cd backend
   python -m pytest  # If tests exist
   python run.py     # Manual testing
   ```

5. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

   Use [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting, etc.)
   - `refactor:` - Code refactoring
   - `test:` - Test additions or updates
   - `chore:` - Maintenance tasks

6. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Open a Pull Request**
   - Go to the [repository](https://github.com/H0NEYP0T-466/ChessReviewEngine)
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill in the PR template
   - Link related issues

**PR Checklist:**
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated as needed
- [ ] All tests pass
- [ ] Changes are backward compatible (or breaking changes noted)

---

## Development Setup

### Prerequisites

- **Python 3.12+**
- **Node.js 20+**
- **Stockfish Engine**
- **Git**

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/H0NEYP0T-466/ChessReviewEngine.git
   cd ChessReviewEngine
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd ..  # Back to root
   npm install
   ```

4. **Install Stockfish**
   - Ubuntu/Debian: `sudo apt-get install stockfish`
   - macOS: `brew install stockfish`
   - Windows: Download from [stockfishchess.org](https://stockfishchess.org/download/)

### Running Locally

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
python run.py
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Access the app at `http://localhost:5173`

---

## Coding Standards

### Python (Backend)

- **Style:** Follow [PEP 8](https://pep8.org/)
- **Formatting:** Use `black` or `autopep8`
- **Type Hints:** Use type hints where applicable
- **Docstrings:** Use Google-style docstrings

**Example:**
```python
def analyze_move(
    board: chess.Board,
    move: chess.Move,
    engine_evaluation: dict
) -> MoveClassification:
    """
    Analyze a chess move and classify its quality.

    Args:
        board: Current board state
        move: The move to analyze
        engine_evaluation: Engine evaluation data

    Returns:
        Classification of the move (brilliant, best, good, etc.)
    """
    # Implementation
```

### TypeScript/JavaScript (Frontend)

- **Style:** Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- **Formatting:** Use ESLint (already configured)
- **Components:** Use functional components with hooks
- **Types:** Define clear TypeScript interfaces/types

**Example:**
```typescript
interface MoveAnalysis {
  moveNumber: number;
  move: string;
  classification: string;
  evaluation: number;
}

const AnalysisBoard: React.FC<AnalysisBoardProps> = ({ gameData }) => {
  // Component implementation
};
```

### General Guidelines

- **Naming:**
  - Use descriptive, meaningful names
  - Classes/Components: PascalCase
  - Functions/variables: camelCase (JS/TS) or snake_case (Python)
  - Constants: UPPER_SNAKE_CASE

- **Comments:**
  - Write self-documenting code when possible
  - Add comments for complex logic
  - Keep comments up-to-date

- **File Organization:**
  - One component per file (frontend)
  - Group related functionality
  - Keep files focused and reasonably sized

---

## Testing Guidelines

### Backend Testing

Create tests in the `backend/` directory:

```python
# test_analyzer.py
import pytest
from app.engine.analyzer import ChessAnalyzer

def test_move_classification():
    """Test move classification logic."""
    # Test implementation
    assert classification == "best"
```

Run tests:
```bash
cd backend
pytest
```

### Frontend Testing

While not currently implemented, future tests should:
- Test component rendering
- Test user interactions
- Test API integration
- Use React Testing Library

### Manual Testing

Always perform manual testing:
- Test the full user flow
- Try edge cases
- Test on different browsers (if frontend changes)
- Verify error handling

---

## Documentation

### When to Update Documentation

Update documentation when you:
- Add new features
- Change existing functionality
- Add configuration options
- Modify API endpoints
- Update dependencies

### What to Document

- **README.md:** User-facing features and setup
- **Code comments:** Complex logic and algorithms
- **API docs:** Endpoint changes (in code docstrings)
- **CHANGELOG.md:** Keep track of notable changes (if exists)

### Documentation Style

- Use clear, concise language
- Include code examples
- Add screenshots for UI changes
- Keep formatting consistent

---

## Community

### Getting Help

- **GitHub Discussions:** Ask questions and share ideas (if enabled)
- **Issues:** Report bugs or request features
- **Pull Requests:** Review and discuss code changes

### Recognition

Contributors are recognized in:
- GitHub contributors page
- Release notes
- Project acknowledgments

Thank you for contributing to ChessReviewEngine! 🎉♟️
