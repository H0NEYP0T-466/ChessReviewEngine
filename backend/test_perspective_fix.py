"""Test cases for perspective error fix - the "Winning Blunder" bug."""

import chess
from app.engine.classification import classify_move_by_winrate, compute_win_probability


def test_black_improving_advantage():
    """
    Test that when Black increases their advantage (eval goes more negative),
    it's correctly recognized as a good move, not a blunder.
    
    Scenario from problem statement:
    - Black's position: -90cp (Black winning)
    - After move: -98cp (Black winning more)
    - This should be classified as "best" or "excellent", NOT a blunder
    """
    print("\n=== Test: Black Improving Advantage (Perspective Fix) ===")
    
    # Setup: Simple position where Black is already winning
    board = chess.Board("4k3/8/8/8/8/8/4Q3/4K3 b - - 0 1")
    
    # Black plays a good move
    move = chess.Move.from_uci("e8d7")
    
    # From WHITE's perspective (standard stockfish output):
    # Best eval: -90cp (Black winning)
    # After move: -98cp (Black winning more)
    
    # CRITICAL: We need to flip for Black's perspective
    # For Black's turn: 
    # - best_eval_cp should be +90 (positive = good for Black)
    # - played_eval_cp should be +98 (positive = good for Black)
    
    best_eval_white = -90  # From White's perspective
    played_eval_white = -98  # From White's perspective
    
    # Convert to Black's perspective (flip sign)
    best_eval_black = -best_eval_white  # +90
    played_eval_black = -played_eval_white  # +98
    
    print(f"From White's perspective: {best_eval_white} -> {played_eval_white}")
    print(f"From Black's perspective: {best_eval_black} -> {played_eval_black}")
    print(f"Black improved position by: {played_eval_black - best_eval_black}cp")
    
    # Calculate win probabilities
    best_win = compute_win_probability(best_eval_black) * 100
    played_win = compute_win_probability(played_eval_black) * 100
    win_loss = best_win - played_win
    
    print(f"Win% best: {best_win:.1f}%, Win% played: {played_win:.1f}%")
    print(f"Win% loss: {win_loss:.1f}%")
    
    # Classify
    classification = classify_move_by_winrate(
        best_eval_cp=best_eval_black,
        played_eval_cp=played_eval_black,
        played_move=move,
        best_move="e8d7",
        is_opening=False,
        board=board,
        player_turn_white=False
    )
    
    print(f"\nClassification: {classification}")
    print(f"Expected: 'best' or 'excellent' (move IMPROVED position)")
    
    is_good = classification in ["best", "excellent", "great", "good"]
    print(f"Result: {'✓ PASS' if is_good else '✗ FAIL - Still broken!'}")
    
    return is_good


def test_white_improving_advantage():
    """
    Test that when White increases their advantage (eval goes more positive),
    it's correctly recognized as a good move.
    """
    print("\n=== Test: White Improving Advantage ===")
    
    # Setup: Simple position where White is already winning
    board = chess.Board("4k3/8/8/8/8/8/4Q3/4K3 w - - 0 1")
    
    # White plays a good move
    move = chess.Move.from_uci("e2e7")
    
    # From WHITE's perspective:
    # Best eval: +300cp (White winning)
    # After move: +350cp (White winning more)
    
    best_eval_white = 300
    played_eval_white = 350
    
    print(f"From White's perspective: {best_eval_white} -> {played_eval_white}")
    print(f"White improved position by: {played_eval_white - best_eval_white}cp")
    
    # Calculate win probabilities
    best_win = compute_win_probability(best_eval_white) * 100
    played_win = compute_win_probability(played_eval_white) * 100
    win_loss = best_win - played_win
    
    print(f"Win% best: {best_win:.1f}%, Win% played: {played_win:.1f}%")
    print(f"Win% loss: {win_loss:.1f}%")
    
    # Classify
    classification = classify_move_by_winrate(
        best_eval_cp=best_eval_white,
        played_eval_cp=played_eval_white,
        played_move=move,
        best_move="e2e7",
        is_opening=False,
        board=board,
        player_turn_white=True
    )
    
    print(f"\nClassification: {classification}")
    print(f"Expected: 'best' or 'excellent' (move IMPROVED position)")
    
    is_good = classification in ["best", "excellent", "great", "good"]
    print(f"Result: {'✓ PASS' if is_good else '✗ FAIL'}")
    
    return is_good


def test_black_blunder():
    """
    Test that actual blunders by Black are still detected correctly.
    """
    print("\n=== Test: Black Actually Blundering ===")
    
    # Setup: Black has a winning position
    board = chess.Board("4k3/8/8/8/8/8/4Q3/4K3 b - - 0 1")
    
    # Black makes a terrible move
    move = chess.Move.from_uci("e8f7")
    
    # From WHITE's perspective:
    # Best eval: -300cp (Black winning)
    # After bad move: +200cp (White winning now!)
    
    best_eval_white = -300
    played_eval_white = 200
    
    # Convert to Black's perspective
    best_eval_black = -best_eval_white  # +300 (Black advantage)
    played_eval_black = -played_eval_white  # -200 (White advantage!)
    
    print(f"From White's perspective: {best_eval_white} -> {played_eval_white}")
    print(f"From Black's perspective: {best_eval_black} -> {played_eval_black}")
    print(f"Black LOST: {best_eval_black - played_eval_black}cp")
    
    # Calculate win probabilities
    best_win = compute_win_probability(best_eval_black) * 100
    played_win = compute_win_probability(played_eval_black) * 100
    win_loss = best_win - played_win
    
    print(f"Win% best: {best_win:.1f}%, Win% played: {played_win:.1f}%")
    print(f"Win% loss: {win_loss:.1f}% (massive loss!)")
    
    # Classify
    classification = classify_move_by_winrate(
        best_eval_cp=best_eval_black,
        played_eval_cp=played_eval_black,
        played_move=move,
        best_move="e8d7",
        is_opening=False,
        board=board,
        player_turn_white=False
    )
    
    print(f"\nClassification: {classification}")
    print(f"Expected: 'blunder' (move lost the game)")
    
    is_blunder = classification in ["blunder", "mistake"]
    print(f"Result: {'✓ PASS' if is_blunder else '✗ FAIL'}")
    
    return is_blunder


def test_garbage_time_no_great_spam():
    """
    Test that in completely winning endgames, we don't spam "great" moves.
    """
    print("\n=== Test: Garbage Time - No 'Great' Spam ===")
    
    # Setup: White has overwhelming advantage (King + Queen vs King)
    board = chess.Board("4k3/8/8/8/8/8/4Q3/4K3 w - - 0 1")
    
    # Any safe queen move keeps the huge advantage
    move = chess.Move.from_uci("e2e3")
    
    # From WHITE's perspective:
    # Best eval: +950cp (overwhelming)
    # After move: +940cp (still overwhelming)
    
    best_eval = 950
    played_eval = 940
    
    print(f"Position eval: +{best_eval}cp (garbage time - already completely winning)")
    print(f"After move: +{played_eval}cp (still completely winning)")
    
    # Classify
    classification = classify_move_by_winrate(
        best_eval_cp=best_eval,
        played_eval_cp=played_eval,
        played_move=move,
        best_move="e2a6",  # Different best move
        is_opening=False,
        board=board,
        player_turn_white=True
    )
    
    print(f"\nClassification: {classification}")
    print(f"Expected: 'best' or 'excellent' only (no 'great' in garbage time)")
    
    is_correct = classification in ["best", "excellent"]
    print(f"Result: {'✓ PASS' if is_correct else '✗ FAIL - Garbage time spam!'}")
    
    return is_correct


def test_win_probability_formula():
    """Test the win probability calculation formula."""
    print("\n=== Test: Win Probability Formula ===")
    
    test_cases = [
        (0, 50.0, "Equal position"),
        (100, 64.0, "White +1.00"),
        (-100, 36.0, "Black +1.00"),
        (300, 85.0, "White +3.00"),
        (-300, 15.0, "Black +3.00"),
        (700, 97.5, "White +7.00"),
        (1000, 99.0, "White +10.00"),
    ]
    
    all_pass = True
    for cp, expected_pct, desc in test_cases:
        actual = compute_win_probability(cp) * 100
        diff = abs(actual - expected_pct)
        passed = diff < 5.0  # Allow 5% margin
        status = "✓" if passed else "✗"
        print(f"{status} {desc}: {cp}cp -> {actual:.1f}% (expected ~{expected_pct}%)")
        if not passed:
            all_pass = False
    
    print(f"\nResult: {'✓ PASS' if all_pass else '✗ FAIL'}")
    return all_pass


if __name__ == "__main__":
    print("=" * 70)
    print("TESTING PERSPECTIVE ERROR FIX - 'Winning Blunder' Bug")
    print("=" * 70)
    
    results = []
    results.append(("Black improving advantage", test_black_improving_advantage()))
    results.append(("White improving advantage", test_white_improving_advantage()))
    results.append(("Black actual blunder", test_black_blunder()))
    results.append(("Garbage time no spam", test_garbage_time_no_great_spam()))
    results.append(("Win probability formula", test_win_probability_formula()))
    
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    
    for name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{status}: {name}")
    
    all_pass = all(r[1] for r in results)
    print("\n" + "=" * 70)
    if all_pass:
        print("ALL TESTS PASSED ✓")
    else:
        print("SOME TESTS FAILED ✗")
    print("=" * 70)
