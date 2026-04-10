import React from 'react';
import { useGame } from '../context/GameContext';

export const LoginScreen = () => {
  const { nickname, setNickname, startMatchmaking, error } = useGame();

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim()) {
      startMatchmaking();
    }
  };

  return (
    <div className="container">
      <h1>Tic-Tac-Toe</h1>
      <p>Multiplayer Server-Authoritative Game</p>
      
      <form onSubmit={handleStart} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input 
          type="text" 
          className="input-field" 
          placeholder="Enter your nickname" 
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          maxLength={15}
          required
        />
        <button type="submit" className="btn" disabled={!nickname.trim()}>
          Find Match
        </button>
      </form>

      {error && <p style={{color: 'var(--mark-x)'}}>{error}</p>}
    </div>
  );
};

export const MatchmakingScreen = () => {
  return (
    <div className="container">
      <h2>Finding Opponent...</h2>
      <div className="spinner" style={{ margin: '2rem auto' }}></div>
      <p>Waiting for another player to join.</p>
    </div>
  );
};

export const BoardScreen = () => {
  const { gameState, makeMove, myMark } = useGame();

  if (!gameState) return null;

  const isMyTurn = gameState.activeMark === myMark;

  const renderCell = (index: number) => {
    const value = gameState.board[index];
    const isX = value === 1;
    const isO = value === 2;
    const markClass = isX ? 'mark-x' : isO ? 'mark-o' : '';
    const content = isX ? 'X' : isO ? 'O' : '';

    return (
      <div 
        key={index}
        className={`cell ${markClass} ${value !== 0 || !isMyTurn ? 'disabled' : ''}`}
        onClick={() => {
          if (value === 0 && isMyTurn) makeMove(index);
        }}
      >
        {content}
      </div>
    );
  };

  return (
    <div className="container" style={{ padding: '1rem' }}>
      <div className="status-bar">
        <div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>You are: </span>
          <strong className={myMark === 1 ? 'mark-x' : 'mark-o'}>
            {myMark === 1 ? 'X' : 'O'}
          </strong>
        </div>
        <div style={{ fontWeight: 600, color: isMyTurn ? 'var(--primary-color)' : 'var(--text-muted)' }}>
          {isMyTurn ? "Your Turn" : "Opponent's Turn"}
        </div>
      </div>

      <div className="board">
        {gameState.board.map((_, i) => renderCell(i))}
      </div>
    </div>
  );
};

export const ResultScreen = () => {
  const { gameState, myMark, leaveMatch } = useGame();

  let message = "Match Ended";
  let color = "var(--text-main)";

  if (gameState?.winner === 3) {
    message = "It's a Draw!";
    color = "#f59e0b"; // Yellow
  } else if (gameState?.winner === myMark) {
    message = "You Won! 🎉";
    color = "var(--mark-o)";
  } else if (gameState?.winner) {
    message = "You Lost 😢";
    color = "var(--mark-x)";
  }

  return (
    <div className="container">
      <h1 style={{ color, background: 'none', WebkitTextFillColor: 'initial' }}>{message}</h1>
      
      <button className="btn" onClick={leaveMatch} style={{ marginTop: '1rem' }}>
        Play Again
      </button>
    </div>
  );
};
