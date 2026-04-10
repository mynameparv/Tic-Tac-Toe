import { MatchState, TIC_TAC_TOE_OPCODES } from './types';
import { checkWinner } from './utils';

const TICK_RATE = 5; // Ticks per second
const MAX_EMPTY_TICKS = 300; // Timeouts if empty for 60 seconds

export const matchInit: nkruntime.MatchInitFunction = function (ctx, logger, nk, params) {
  const state: MatchState = {
    board: Array(9).fill(0),
    marks: {},
    presences: {},
    emptyTicks: 0,
    activeMark: 1,
    winner: null,
    winningLine: null,
    playersJoined: 0,
  };

  return {
    state,
    tickRate: TICK_RATE,
    label: 'tic-tac-toe',
  };
};

export const matchJoinAttempt: nkruntime.MatchJoinAttemptFunction = function (
  ctx, logger, nk, dispatcher, tick, state: MatchState, presence, metadata
) {
  if (state.playersJoined >= 2) {
    return { state, accept: false, rejectReason: 'Match is full' };
  }
  return { state, accept: true };
};

export const matchJoin: nkruntime.MatchJoinFunction = function (
  ctx, logger, nk, dispatcher, tick, state: MatchState, presences
) {
  for (const presence of presences) {
    state.presences[presence.userId] = presence;
    if (state.playersJoined === 0) {
      state.marks[presence.userId] = 1; // First player is X
    } else if (state.playersJoined === 1) {
      state.marks[presence.userId] = 2; // Second player is O
    }
    state.playersJoined++;
  }

  dispatcher.broadcastMessage(TIC_TAC_TOE_OPCODES.UPDATE, JSON.stringify(state));
  return { state };
};

export const matchLeave: nkruntime.MatchLeaveFunction = function (
  ctx, logger, nk, dispatcher, tick, state: MatchState, presences
) {
  for (const presence of presences) {
    delete state.presences[presence.userId];
    state.playersJoined--;
  }

  // If someone leaves, the match ends
  if (state.winner === null) {
    state.winner = 3; // Let's simplify and call it a draw or technical stop
    dispatcher.broadcastMessage(TIC_TAC_TOE_OPCODES.GAME_OVER, JSON.stringify(state));
  }

  return { state };
};

export const matchLoop: nkruntime.MatchLoopFunction = function (
  ctx, logger, nk, dispatcher, tick, state: MatchState, messages
) {
  if (state.playersJoined === 0) {
    state.emptyTicks++;
    if (state.emptyTicks >= MAX_EMPTY_TICKS) {
      return null; // Terminate match
    }
  } else {
    state.emptyTicks = 0;
  }

  let stateUpdated = false;

  for (const message of messages) {
    if (message.opCode === TIC_TAC_TOE_OPCODES.MOVE && state.playersJoined === 2 && state.winner === null) {
      const data = JSON.parse(nk.binaryToString(message.data));
      const { index } = data;
      const playerMark = state.marks[message.sender.userId];

      if (playerMark !== state.activeMark) {
        dispatcher.broadcastMessage(TIC_TAC_TOE_OPCODES.REJECTED, JSON.stringify({ error: 'Not your turn' }), [message.sender]);
        continue;
      }

      if (state.board[index] !== 0 || index < 0 || index > 8) {
        dispatcher.broadcastMessage(TIC_TAC_TOE_OPCODES.REJECTED, JSON.stringify({ error: 'Invalid move' }), [message.sender]);
        continue;
      }

      state.board[index] = playerMark;
      state.activeMark = playerMark === 1 ? 2 : 1;
      stateUpdated = true;

      const { winner, winningLine } = checkWinner(state.board);
      if (winner !== null) {
        state.winner = winner;
        state.winningLine = winningLine;
      }
    }
  }

  if (stateUpdated) {
    dispatcher.broadcastMessage(TIC_TAC_TOE_OPCODES.UPDATE, JSON.stringify(state));
    if (state.winner !== null) {
      dispatcher.broadcastMessage(TIC_TAC_TOE_OPCODES.GAME_OVER, JSON.stringify(state));
      // End a bit later? We can just keep sending state and front-end handles it
    }
  }

  return { state };
};

export const matchTerminate: nkruntime.MatchTerminateFunction = function (
  ctx, logger, nk, dispatcher, tick, state, graceSeconds
) {
  return { state };
};

export const matchSignal: nkruntime.MatchSignalFunction = function (
  ctx, logger, nk, dispatcher, tick, state, data
) {
  return { state, data };
};
