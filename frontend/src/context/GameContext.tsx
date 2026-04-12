import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Match } from '@heroiclabs/nakama-js';
import { authenticate, findOrCreateMatch, session, socket } from '../services/nakamaClient';

type GameState = {
  board: number[];
  marks: { [userId: string]: number };
  activeMark: number;
  winner: number | null;
  playersJoined: number;
  players: { [userId: string]: string };
  rematchRequests: { [userId: string]: boolean };
  scores: { [userId: string]: number };
  draws: number;
};

interface GameContextProps {
  nickname: string;
  setNickname: (name: string) => void;
  status: 'login' | 'matchmaking' | 'match_found' | 'playing' | 'result';
  startMatchmaking: () => void;
  gameState: GameState | null;
  makeMove: (index: number) => void;
  myMark: number | null;
  leaveMatch: () => void;
  requestRematch: () => void;
  rematchState: 'idle' | 'requested' | 'rejected';
  matchStartTime: number | null;
  matchDuration: number | null;
  error: string | null;
}

const GameContext = createContext<GameContextProps | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [nickname, setNickname] = useState('');
  const [status, setStatus] = useState<'login' | 'matchmaking' | 'match_found' | 'playing' | 'result'>('login');
  const [match, setMatch] = useState<Match | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myMark, setMyMark] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rematchState, setRematchState] = useState<'idle' | 'requested' | 'rejected'>('idle');
  const [matchStartTime, setMatchStartTime] = useState<number | null>(null);
  const [matchDuration, setMatchDuration] = useState<number | null>(null);

  useEffect(() => {
    if (!gameState) return;

    if (gameState.playersJoined === 2 && gameState.winner === null) {
      if (status === 'matchmaking' || status === 'result') {
        setStatus('match_found');
      }
    } else if (gameState.winner !== null && status === 'playing') {
      setStatus('result');
      if (matchStartTime) {
        setMatchDuration(Math.max(0, Math.floor((Date.now() - matchStartTime) / 1000)));
      }
    }
  }, [gameState, status, matchStartTime]);

  useEffect(() => {
    if (status === 'match_found') {
      const timer = setTimeout(() => {
        setStatus('playing');
        setMatchStartTime(Date.now());
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const startMatchmaking = async () => {
    try {
      setStatus('matchmaking');
      const cacheKey = `nakama_device_id_${nickname || 'Guest'}`;
      let safeDeviceId = sessionStorage.getItem(cacheKey);
      if (!safeDeviceId) {
        safeDeviceId = (nickname || 'Guest').padEnd(10, '_') + '_' + Math.random().toString(36).substring(2, 9);
        sessionStorage.setItem(cacheKey, safeDeviceId);
      }
      
      const uniqueUsername = (nickname || 'Guest') + '_' + Math.floor(Math.random() * 100000);
      await authenticate(safeDeviceId, uniqueUsername);
      let localSocket = socket;
      if (!localSocket) {
        throw new Error('Socket not initialized');
      }

      localSocket.onmatchdata = (matchData) => {
        const state: GameState = JSON.parse(new TextDecoder().decode(matchData.data));
        
        if (matchData.op_code === 7) {
          setRematchState('rejected');
        }

        if (matchData.op_code === 2 || matchData.op_code === 3) {
          setGameState(state);
          
          if (session && session.user_id && state.marks[session.user_id]) {
            setMyMark(state.marks[session.user_id]);
          }
        }

        if (matchData.op_code === 4) {
          console.warn("Move rejected");
        }
      };

      const newMatch = await findOrCreateMatch();
      setMatch(newMatch);

      // Now explicitly ask the server for the latest match state
      // This is crucial for Player 2, so they don't miss the initial game-start broadcast
      if (localSocket) {
        await localSocket.sendMatchState(newMatch.match_id, 5, "");
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

  const requestRematch = async () => {
    if (!socket || !match) return;
    setRematchState('requested');
    await socket.sendMatchState(match.match_id, 6, "");
  };

  const leaveMatch = () => {
    if (socket && match) {
      if (status === 'result') {
        socket.sendMatchState(match.match_id, 7, "");
      }
      socket.leaveMatch(match.match_id);
    }
    setMatch(null);
    setGameState(null);
    setMyMark(null);
    setRematchState('idle');
    setStatus('login');
  };

  return (
    <GameContext.Provider value={{
      nickname, setNickname, status, startMatchmaking, gameState, makeMove, myMark, leaveMatch, requestRematch, rematchState, matchStartTime, matchDuration, error
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
