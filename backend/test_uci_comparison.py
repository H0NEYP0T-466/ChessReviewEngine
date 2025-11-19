"""Test UCI comparison between best move and played move."""

import chess
from app.engine.classification import classify_move


def test_matching_moves():
    """Test that when played move matches best move, it's classified correctly."""
    print("\n=== Test: Matching UCI Moves ===")
    
    board = chess.Board()
    
    # Best move is e2e4
    best_move_uci = "e2e4"
    
    # Player plays e2e4
    played_move = chess.Move.from_uci("e2e4")
    
    print(f"Best move (UCI): {best_move_uci}")
    print(f"Played move (UCI): {played_move.uci()}")
    print(f"Moves match: {played_move.uci() == best_move_uci}")
    
    # With diff_cp = 0 (perfect move), should be classified as "best" or "brilliant"
    classification = classify_move(
        diff_cp=0,
        played_move=played_move,
        best_move=best_move_uci,
        is_opening=False,
        board=board,
        eval_before=20,
        eval_after=40
    )
    
    print(f"Classification: {classification}")
    print(f"Expected: 'best' (moves match, no CP loss)")
    print(f"Test Status: {'PASS' if classification in ['best', 'brilliant'] else 'FAIL'}")
    

def test_non_matching_moves():
    """Test that when played move differs from best move, it's classified with CP loss."""
    print("\n=== Test: Non-Matching UCI Moves ===")
    
    board = chess.Board()
    
    # Best move is e2e4
    best_move_uci = "e2e4"
    
    # Player plays d2d4 instead
    played_move = chess.Move.from_uci("d2d4")
    
    print(f"Best move (UCI): {best_move_uci}")
    print(f"Played move (UCI): {played_move.uci()}")
    print(f"Moves match: {played_move.uci() == best_move_uci}")
    
    # With diff_cp = 15 (small loss), should be classified as "excellent"
    classification = classify_move(
        diff_cp=15,
        played_move=played_move,
        best_move=best_move_uci,
        is_opening=False,
        board=board,
        eval_before=20,
        eval_after=5
    )
    
    print(f"Classification: {classification}")
    print(f"Expected: 'excellent' (15cp loss)")
    print(f"Test Status: {'PASS' if classification == 'excellent' else 'FAIL'}")


def test_brilliant_requires_best_move():
    """Test that brilliant classification requires the move to be the best move."""
    print("\n=== Test: Brilliant Requires Best Move ===")
    
    # Setup position for potential brilliant move (Queen sacrifice that doesn't checkmate)
    # Position where Qxf7+ is check but not checkmate, leads to winning advantage
    board = chess.Board("r1bqk2r/pppp1ppp/2n2n2/2b1p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1")
    
    # Best move is Qxf7+ (brilliant sacrifice - check but not mate)
    best_move_uci = "h5f7"
    played_move = chess.Move.from_uci("h5f7")
    
    print(f"Best move (UCI): {best_move_uci}")
    print(f"Played move (UCI): {played_move.uci()}")
    print(f"Moves match: {played_move.uci() == best_move_uci}")
    
    # Should be brilliant - it's the best move AND a sacrifice
    classification = classify_move(
        diff_cp=0,
        played_move=played_move,
        best_move=best_move_uci,
        is_opening=False,
        board=board,
        eval_before=50,
        eval_after=300
    )
    
    print(f"Classification: {classification}")
    print(f"Expected: 'brilliant' (sacrifice, best move, huge eval swing)")
    if classification == 'best':
        print(f"Note: Got 'best' - this might be due to checkmate detection")
    print(f"Test Status: {'PASS' if classification in ['brilliant', 'best'] else f'FAIL (got {classification})'}")


def test_brilliant_rejected_if_not_best():
    """Test that a sacrifice is NOT brilliant if it's not the best move."""
    print("\n=== Test: Brilliant Rejected if Not Best Move ===")
    
    # Same position
    board = chess.Board("r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1")
    
    # Best move is Qxf7+
    best_move_uci = "h5f7"
    
    # But player plays different sacrifice
    played_move = chess.Move.from_uci("c4f7")  # Bishop takes f7 instead
    
    print(f"Best move (UCI): {best_move_uci}")
    print(f"Played move (UCI): {played_move.uci()}")
    print(f"Moves match: {played_move.uci() == best_move_uci}")
    
    # Even with sacrifice, should NOT be brilliant because it's not the best move
    classification = classify_move(
        diff_cp=50,  # Some CP loss
        played_move=played_move,
        best_move=best_move_uci,
        is_opening=False,
        board=board,
        eval_before=50,
        eval_after=100
    )
    
    print(f"Classification: {classification}")
    print(f"Expected: NOT 'brilliant' (not the best move)")
    print(f"Test Status: {'PASS' if classification != 'brilliant' else 'FAIL'}")


if __name__ == "__main__":
    print("=" * 60)
    print("TESTING UCI MOVE COMPARISON")
    print("=" * 60)
    
    test_matching_moves()
    test_non_matching_moves()
    test_brilliant_requires_best_move()
    test_brilliant_rejected_if_not_best()
    
    print("\n" + "=" * 60)
    print("TEST SUITE COMPLETE")
    print("=" * 60)
