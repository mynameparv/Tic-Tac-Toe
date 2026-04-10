export interface MatchState {
  board: number[]; // 0 for empty, 1 for X, 2 for O
  marks: { [userId: string]: number }; // Maps user ID to their mark (1 or 2)
  presences: { [userId: string]: nkruntime.Presence };
  emptyTicks: number;
  activeMark: number; // 1 or 2
  winner: number | null; // 1, 2, or 3 for draw, null for ongoing
  winningLine: number[] | null;
  playersJoined: number;
}

export const TIC_TAC_TOE_OPCODES = {
  MOVE: 1,
  UPDATE: 2,
  GAME_OVER: 3,
  REJECTED: 4,
};
