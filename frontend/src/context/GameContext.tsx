import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Match } from '@heroiclabs/nakama-js';
import { authenticate, findOrCreateMatch, session, socket } from '../services/nakamaClient';

type GameState = {
  board: number[];
  marks: { [userId: string]: number };
  activeMark: number;
  winner: number | null;
  playersJoined: number;
};

interface GameContextProps {
  nickname: string;
  setNickname: (name: string) => void;
  status: 'login' | 'matchmaking' | 'playing' | 'result';
  startMatchmaking: () => void;
  gameState: GameState | null;
  makeMove: (index: number) => void;
  myMark: number | null;
  leaveMatch: () => void;
  error: string | null;
}

const GameContext = createContext<GameContextProps | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [nickname, setNickname] = useState('');
  const [status, setStatus] = useState<'login' | 'matchmaking' | 'playing' | 'result'>('login');
  const [match, setMatch] = useState<Match | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myMark, setMyMark] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startMatchmaking = async () => {
    try {
      setStatus('matchmaking');
      await authenticate(nickname || 'Guest_' + Math.floor(Math.random() * 1000));
      const newMatch = await findOrCreateMatch();
      setMatch(newMatch);

      if (socket) {
        socket.onmatchdata = (matchData) => {
          const state: GameState = JSON.parse(new TextDecoder().decode(matchData.data));
          
          if (matchData.op_code === 2 || matchData.op_code === 3) {
            setGameState(state);
            if (session && session.user_id && state.marks[session.user_id]) {
              setMyMark(state.marks[session.user_id]);
            }
            if (state.playersJoined === 2) {
              setStatus('playing');
            }
            if (state.winner !== null) {
              setStatus('result');
            }
          }

          if (matchData.op_code === 4) {
            console.warn("Move rejected");
          }
        };
      }
    } catch (err) {
      console.error(err);
      setError('Failed to connect to matchmaking server.');
      setStatus('login');
    }
  };

  const makeMove = async (index: number) => {
    if (!socket || !match || gameState?.winner !== null) return;
    
    // Optimistically could update UI, but for simple authoritative logic just send
    await socket.sendMatchState(match.match_id, 1, JSON.stringify({ index }));
  };

  const leaveMatch = () => {
    if (socket && match) {
      socket.leaveMatch(match.match_id);
    }
    setMatch(null);
    setGameState(null);
    setMyMark(null);
    setStatus('login');
  };

  return (
    <GameContext.Provider value={{
      nickname, setNickname, status, startMatchmaking, gameState, makeMove, myMark, leaveMatch, error
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within GameProvider");
  return context;
};
