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
  const [funText, setFunText] = React.useState('Finding a worthy opponent...');
  const texts = [
    'Finding a worthy opponent...',
    'Consulting the Matchmaking Gods...',
    'Sharpening pencils...',
    'Polishing the digital board...',
    'Matching skills...',
    'Generating tic-tacs...',
  ];

  React.useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % texts.length;
      setFunText(texts[index]);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container">
      <h2>Search in Progress...</h2>
      <div className="spinner" style={{ margin: '2rem auto' }}></div>
      <p style={{ minHeight: '1.5rem', color: 'var(--primary-color)', fontStyle: 'italic', transition: 'opacity 0.5s' }}>{funText}</p>
    </div>
  );
};

export const MatchFoundScreen = () => {
  const { gameState, myMark } = useGame();
  
  const opponentId = gameState ? Object.keys(gameState.marks).find(id => gameState.marks[id] !== myMark) : null;
  const opponentNameRaw = opponentId && gameState?.players ? gameState.players[opponentId] : 'Opponent';
  const opponentName = opponentNameRaw.split('_')[0];

  return (
    <div className="container">
      <h1 style={{ color: 'var(--mark-o)', animation: 'pulse 1s infinite' }}>Match Found!</h1>
      <p style={{ fontSize: '1.2rem', marginTop: '1rem', color: 'var(--text-main)' }}>
        Preparing table against <strong>{opponentName}</strong>...
      </p>
      <div style={{ marginTop: '2rem', fontSize: '3rem' }}>⚔️</div>
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

  const opponentId = Object.keys(gameState.marks).find(id => gameState.marks[id] !== myMark);
  const opponentNameRaw = opponentId && gameState.players ? gameState.players[opponentId] : 'Opponent';
  const opponentName = opponentNameRaw.split('_')[0];

  return (
    <div className="container" style={{ padding: '1rem' }}>
      <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
        Playing against <strong>{opponentName}</strong>
      </h2>

      <div className="status-bar">
        <div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>You are: </span>
          <strong className={myMark === 1 ? 'mark-x' : 'mark-o'}>
            {myMark === 1 ? 'X' : 'O'}
          </strong>
        </div>
        <div style={{ fontWeight: 600, color: isMyTurn ? 'var(--primary-color)' : 'var(--text-muted)' }}>
          {isMyTurn ? "Your Turn" : `${opponentName}'s Turn`}
        </div>
      </div>

      <div className="board">
        {gameState.board.map((_, i) => renderCell(i))}
      </div>
    </div>
  );
};

export const ResultScreen = () => {
  const { gameState, myMark, leaveMatch, requestRematch, rematchState, matchDuration } = useGame();

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

  const opponentId = gameState ? Object.keys(gameState.marks).find(id => gameState.marks[id] !== myMark) : null;
  const opponentNameRaw = opponentId && gameState?.players ? gameState.players[opponentId] : 'Opponent';
  const opponentName = opponentNameRaw.split('_')[0];

  return (
    <div className="container">
      <h1 style={{ color, background: 'none', WebkitTextFillColor: 'initial' }}>{message}</h1>
      
      {matchDuration !== null && (
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Match Duration: {matchDuration} seconds
        </p>
      )}

      {rematchState === 'rejected' ? (
        <div style={{ margin: '1rem', color: 'var(--mark-x)' }}>
          {opponentName} has left the match.
        </div>
      ) : rematchState === 'requested' ? (
        <div style={{ margin: '1rem', color: 'var(--text-muted)' }}>
          Waiting for {opponentName} to accept rematch...
        </div>
      ) : (
        <button className="btn" onClick={requestRematch} style={{ marginTop: '1rem', backgroundColor: 'var(--primary-color)' }}>
          Play Again with {opponentName}
        </button>
      )}

      <button className="btn" onClick={leaveMatch} style={{ marginTop: '1rem', backgroundColor: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)' }}>
        Find New Opponent
      </button>
    </div>
  );
};
