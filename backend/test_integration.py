"""Integration test for complete game analysis with bug fixes."""

import chess
import asyncio
from app.engine.analyzer import analyze_game


async def test_scholars_mate_game():
    """Test analysis of a game ending in Scholar's Mate."""
    print("\n" + "=" * 60)
    print("Integration Test: Scholar's Mate Game Analysis")
    print("=" * 60)
    
    # Scholar's Mate game
    board = chess.Board()
    moves = [
        chess.Move.from_uci("e2e4"),  # 1. e4
        chess.Move.from_uci("e7e5"),  # 1... e5
        chess.Move.from_uci("f1c4"),  # 2. Bc4
        chess.Move.from_uci("b8c6"),  # 2... Nc6
        chess.Move.from_uci("d1h5"),  # 3. Qh5
        chess.Move.from_uci("g8f6"),  # 3... Nf6
        chess.Move.from_uci("h5f7"),  # 4. Qxf7# (Checkmate!)
    ]
    
    headers = {
        "Event": "Test Game",
        "White": "Player1",
        "Black": "Player2",
        "Result": "1-0"
    }
    
    print("\nAnalyzing Scholar's Mate game...")
    print("Moves: 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6 4.Qxf7#")
    
    try:
        # Analyze with minimal depth for speed
        result = await analyze_game(
            task_id="test-scholars-mate",
            moves=moves,
            headers=headers,
            depth=10,
            time_per_move_ms=100,
            ws_manager=None
        )
        
        print(f"\nAnalysis completed successfully!")
        print(f"Total moves analyzed: {len(result.moves)}")
        
        # Check the checkmate move (last move)
        checkmate_move = result.moves[-1]
        print(f"\nCheckmate move analysis:")
        print(f"  Move: {checkmate_move.san} ({checkmate_move.uci})")
        print(f"  Classification: {checkmate_move.classification}")
        print(f"  Expected: 'best' (not blunder!)")
        
        if checkmate_move.classification == "best":
            print(f"  ✓ PASS: Checkmate correctly classified as 'best'")
        else:
            print(f"  ✗ FAIL: Checkmate incorrectly classified as '{checkmate_move.classification}'")
        
        # Check game summary
        print(f"\nGame Summary:")
        print(f"  White accuracy: {result.summary.white.accuracy:.2f}%")
        print(f"  White brilliant: {result.summary.white.brilliant}")
        print(f"  White best: {result.summary.white.best}")
        print(f"  White blunders: {result.summary.white.blunders}")
        
        print(f"\n  Black accuracy: {result.summary.black.accuracy:.2f}%")
        print(f"  Black brilliant: {result.summary.black.brilliant}")
        print(f"  Black best: {result.summary.black.best}")
        print(f"  Black blunders: {result.summary.black.blunders}")
        
        # Verify no blunders on checkmate move
        assert checkmate_move.classification == "best", \
            f"Checkmate should be 'best', got '{checkmate_move.classification}'"
        
        print("\n✓ Integration test PASSED!")
        return True
        
    except Exception as e:
        print(f"\n✗ Integration test FAILED with error: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_best_move_comparison():
    """Test that moves matching engine's best move are recognized."""
    print("\n" + "=" * 60)
    print("Integration Test: Best Move Recognition")
    print("=" * 60)
    
    # Simple opening moves
    moves = [
        chess.Move.from_uci("e2e4"),  # Common best move
        chess.Move.from_uci("e7e5"),  # Common response
        chess.Move.from_uci("g1f3"),  # Common development
    ]
    
    headers = {
        "Event": "Test Game",
        "White": "Player1",
        "Black": "Player2",
    }
    
    print("\nAnalyzing opening moves: 1.e4 e5 2.Nf3")
    
    try:
        result = await analyze_game(
            task_id="test-best-moves",
            moves=moves,
            headers=headers,
            depth=10,
            time_per_move_ms=100,
            ws_manager=None
        )
        
        print(f"\nAnalysis completed!")
        
        for i, move_analysis in enumerate(result.moves):
            is_best = move_analysis.uci == move_analysis.engine.best_move
            print(f"\nMove {i+1}: {move_analysis.san}")
            print(f"  Played: {move_analysis.uci}")
            print(f"  Best: {move_analysis.engine.best_move}")
            print(f"  Match: {is_best}")
            print(f"  Classification: {move_analysis.classification}")
            print(f"  CP Diff: {move_analysis.engine.eval_diff_cp}")
        
        print("\n✓ Best move comparison test completed!")
        return True
        
    except Exception as e:
        print(f"\n✗ Test FAILED with error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("\n" + "=" * 70)
    print(" " * 15 + "INTEGRATION TEST SUITE")
    print("=" * 70)
    
    # Run tests
    test1 = asyncio.run(test_scholars_mate_game())
    test2 = asyncio.run(test_best_move_comparison())
    
    print("\n" + "=" * 70)
    if test1 and test2:
        print(" " * 20 + "ALL TESTS PASSED ✓")
    else:
        print(" " * 20 + "SOME TESTS FAILED ✗")
    print("=" * 70 + "\n")
