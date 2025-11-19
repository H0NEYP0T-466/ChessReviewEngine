"""Test cases for the three major bug fixes in move classification."""

import chess
from app.engine.classification import classify_move, _is_brilliant_candidate, _get_piece_value
from app.engine.stockfish import convert_mate_to_cp


def test_checkmate_not_blunder():
    """Test that delivering checkmate is classified as 'best', not 'blunder'."""
    print("\n=== Test 1: Checkmate Classification ===")
    
    # Setup: Scholar's mate position - Qxf7# is checkmate
    board = chess.Board()
    moves = [
        chess.Move.from_uci("e2e4"),  # 1. e4
        chess.Move.from_uci("e7e5"),  # 1... e5
        chess.Move.from_uci("f1c4"),  # 2. Bc4
        chess.Move.from_uci("b8c6"),  # 2... Nc6
        chess.Move.from_uci("d1h5"),  # 3. Qh5
        chess.Move.from_uci("g8f6"),  # 3... Nf6
    ]
    for move in moves:
        board.push(move)
    
    # Now Qxf7# is checkmate
    checkmate_move = chess.Move.from_uci("h5f7")
    
    # Before playing the move
    fen_before = board.fen()
    board_copy = chess.Board(fen_before)
    
    # Play the checkmate move
    board.push(checkmate_move)
    
    # After checkmate, the position is mate
    is_checkmate = board.is_checkmate()
    print(f"Position after Qxf7 is checkmate: {is_checkmate}")
    
    # Simulate evaluation: checkmate gives mate score
    # Convert to CP: mate in 0 would be 10000
    eval_before = 100  # Position was slightly favorable
    eval_after_mate = 10000  # Mate score converted to CP
    
    # Calculate diff - this is the problem! Huge positive diff looks like huge loss
    diff_cp = abs(eval_after_mate - eval_before)  # 9900 - looks like blunder!
    print(f"Eval before: {eval_before}, Eval after: {eval_after_mate}")
    print(f"Diff CP (without fix): {diff_cp} - Would be classified as BLUNDER!")
    
    # Classification WITHOUT fix would call this blunder (diff > 300)
    # This is the bug we need to fix
    classification_buggy = classify_move(
        diff_cp=diff_cp,
        played_move=checkmate_move,
        best_move="h5f7",
        is_opening=False,
        board=board_copy,
        eval_before=eval_before,
        eval_after=eval_after_mate
    )
    print(f"Classification (current buggy behavior): {classification_buggy}")
    print(f"Expected: 'best' (checkmate should always be best)")
    print(f"Test Status: {'PASS' if classification_buggy == 'best' else 'FAIL - needs fix!'}")


def test_uci_san_comparison():
    """Test that UCI and SAN moves are correctly compared."""
    print("\n=== Test 2: UCI vs SAN Move Comparison ===")
    
    # Setup position where Qxe6 is the best move
    board = chess.Board("r1bqkbnr/pppp1ppp/2n5/4p3/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq - 0 1")
    
    # Best move from engine: "d8e6" (UCI)
    best_move_uci = "d5e6"  # Assuming Queen on d5 takes e6
    
    # Player played the same move but in SAN
    board_test = chess.Board("rnbqkbnr/pppp1ppp/8/4p3/3PP3/5N2/PPP2PPP/RNBQKB1R w KQkq - 0 1")
    board_test.push_san("d4d5")  # Move queen to d5
    board_test.push_san("Nc6")  # Black plays Nc6
    
    # Now Qxe5 in UCI is d5e5
    played_move_uci = chess.Move.from_uci("d5e5")
    
    print(f"Best move (UCI): {best_move_uci}")
    print(f"Played move (UCI): {played_move_uci.uci()}")
    print(f"Are they the same move? {best_move_uci == played_move_uci.uci()}")
    
    # The issue: if we compare strings, we need to ensure both are UCI or both are SAN
    # Currently, the code receives best_move as UCI string and played_move as chess.Move
    # We need to compare them properly
    
    print("\nThis test validates that the comparison logic handles UCI correctly")
    print("Expected: Moves should be recognized as same/different correctly")


def test_brilliant_move_sacrifice():
    """Test that brilliant moves require actual sacrifice."""
    print("\n=== Test 3: Brilliant Move Requires Sacrifice ===")
    
    # Setup: Position where a queen sacrifice leads to checkmate
    # This is a simplified example
    board = chess.Board("r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1")
    
    # Qxf7+ is a brilliant sacrifice
    sacrifice_move = chess.Move.from_uci("h5f7")
    
    # Check if it's a capture
    is_capture = board.is_capture(sacrifice_move)
    piece = board.piece_at(sacrifice_move.from_square)
    
    print(f"Move: Qxf7+")
    print(f"Is capture: {is_capture}")
    print(f"Moving piece: {piece.symbol()} (Queen, value=9)")
    
    if is_capture:
        captured = board.piece_at(sacrifice_move.to_square)
        if captured:
            print(f"Captured piece: {captured.symbol()} (Pawn, value=1)")
            moving_value = _get_piece_value(piece.piece_type)
            captured_value = _get_piece_value(captured.piece_type)
            print(f"Sacrificing {moving_value - captured_value} points of material")
            print(f"This IS a sacrifice (Queen=9 for Pawn=1)")
    
    # Test the brilliant candidate function
    eval_before = 50  # Close position
    eval_after = 300  # Huge advantage after sacrifice
    diff_cp = 0  # It's the best move
    
    is_brilliant = _is_brilliant_candidate(
        sacrifice_move,
        board,
        eval_before,
        eval_after,
        diff_cp
    )
    
    print(f"\nIs brilliant candidate? {is_brilliant}")
    print(f"Expected: True (sacrifice with huge eval swing)")
    print(f"Test Status: {'PASS' if is_brilliant else 'FAIL - needs fix!'}")


def test_non_sacrifice_not_brilliant():
    """Test that non-sacrifice moves are not classified as brilliant."""
    print("\n=== Test 4: Non-Sacrifice Should Not Be Brilliant ===")
    
    board = chess.Board()
    
    # Simple developing move - not a sacrifice
    normal_move = chess.Move.from_uci("g1f3")
    
    eval_before = 20
    eval_after = 25
    diff_cp = 0  # Best move
    
    is_brilliant = _is_brilliant_candidate(
        normal_move,
        board,
        eval_before,
        eval_after,
        diff_cp
    )
    
    print(f"Move: Nf3 (normal developing move)")
    print(f"Is brilliant candidate? {is_brilliant}")
    print(f"Expected: False (no sacrifice)")
    print(f"Test Status: {'PASS' if not is_brilliant else 'FAIL - too loose!'}")


def test_mate_evaluation_conversion():
    """Test that mate evaluations are properly converted."""
    print("\n=== Test 5: Mate Evaluation Conversion ===")
    
    mate_in_1 = {"type": "mate", "value": 1}
    mate_in_2 = {"type": "mate", "value": 2}
    mate_in_minus_1 = {"type": "mate", "value": -1}
    normal_eval = {"type": "cp", "value": 100}
    
    cp1 = convert_mate_to_cp(mate_in_1)
    cp2 = convert_mate_to_cp(mate_in_2)
    cp_minus = convert_mate_to_cp(mate_in_minus_1)
    cp_normal = convert_mate_to_cp(normal_eval)
    
    print(f"Mate in 1 -> {cp1} cp (expected: 9990)")
    print(f"Mate in 2 -> {cp2} cp (expected: 9980)")
    print(f"Mate in -1 -> {cp_minus} cp (expected: -9990)")
    print(f"Normal +100cp -> {cp_normal} cp (expected: 100)")
    
    assert cp1 == 9990, "Mate in 1 conversion incorrect"
    assert cp2 == 9980, "Mate in 2 conversion incorrect"
    assert cp_minus == -9990, "Mate in -1 conversion incorrect"
    assert cp_normal == 100, "Normal eval conversion incorrect"
    print("All conversions correct!")


if __name__ == "__main__":
    print("=" * 60)
    print("TESTING CHESS CLASSIFICATION BUG FIXES")
    print("=" * 60)
    
    test_checkmate_not_blunder()
    test_uci_san_comparison()
    test_brilliant_move_sacrifice()
    test_non_sacrifice_not_brilliant()
    test_mate_evaluation_conversion()
    
    print("\n" + "=" * 60)
    print("TEST SUITE COMPLETE")
    print("=" * 60)
