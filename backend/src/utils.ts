export function checkWinner(board: number[]): { winner: number | null; winningLine: number[] | null } {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6]             // diagonals
  ];

  for (let line of lines) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], winningLine: line };
    }
  }

  if (!board.includes(0)) {
    return { winner: 3, winningLine: null }; // 3 signifies a Draw
  }

  return { winner: null, winningLine: null };
}
