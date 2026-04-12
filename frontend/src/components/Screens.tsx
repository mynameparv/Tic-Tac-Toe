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

  const particles = React.useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      left: `${Math.random() * 100}%`,
      animationDuration: `${4 + Math.random() * 6}s`,
      animationDelay: `${Math.random() * 4}s`,
      fontSize: `${1.5 + Math.random()}rem`,
      emoji: ['☁️', '🌧️', '☔', '✨', '⚡'][Math.floor(Math.random() * 5)]
    }));
  }, []);

  return (
    <div className="container" style={{ position: 'relative', overflow: 'hidden', padding: '3rem 2rem' }}>
      <div className="matchmaking-bg"></div>
      
      {particles.map((p, i) => (
        <div key={i} className="weather-particle" style={{ left: p.left, animationDuration: p.animationDuration, animationDelay: p.animationDelay, fontSize: p.fontSize }}>
          {p.emoji}
        </div>
      ))}

      <h2 style={{ zIndex: 1, position: 'relative', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Search in Progress...</h2>
      <div className="spinner" style={{ margin: '2rem auto', zIndex: 1, position: 'relative', borderTopColor: 'white' }}></div>
      <p style={{ minHeight: '1.5rem', color: 'rgba(255,255,255,0.9)', fontStyle: 'italic', transition: 'opacity 0.5s', zIndex: 1, position: 'relative' }}>{funText}</p>
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
  let resultClass = "";
  let emoji = "";

  if (gameState?.winner === 3) {
    message = "It's a Draw!";
    color = "#f59e0b"; // Yellow
    resultClass = "result-draw";
    emoji = "🤝";
  } else if (gameState?.winner === myMark) {
    message = "VICTORY!";
    color = "var(--mark-o)";
    resultClass = "result-win";
    emoji = "🏆";
  } else if (gameState?.winner) {
    message = "DEFEAT";
    color = "var(--mark-x)";
    resultClass = "result-lose";
    emoji = "💀";
  }

  const opponentId = gameState ? Object.keys(gameState.marks).find(id => gameState.marks[id] !== myMark) : null;
  const opponentNameRaw = opponentId && gameState?.players ? gameState.players[opponentId] : 'Opponent';
  const opponentName = opponentNameRaw.split('_')[0];

  const myUserId = gameState ? Object.keys(gameState.marks).find(id => gameState.marks[id] === myMark) : null;
  const myScore = myUserId && gameState?.scores ? gameState.scores[myUserId] || 0 : 0;
  const opponentScore = opponentId && gameState?.scores ? gameState.scores[opponentId] || 0 : 0;
  const draws = gameState?.draws || 0;

  return (
    <div className="container" style={{ overflow: 'hidden' }}>
      
      {emoji && <div className="emoji-float">{emoji}</div>}
      
      <div 
        className={resultClass} 
        style={{ 
          color, 
          background: 'none', 
          WebkitTextFillColor: 'initial', 
          fontSize: '3rem', 
          fontWeight: 900, 
          letterSpacing: '2px', 
          margin: '0',
          textTransform: 'uppercase'
        }}
      >
        {message}
      </div>
      
      <table className="score-table">
        <thead>
          <tr>
            <th>You</th>
            <th>Draws</th>
            <th>{opponentName}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={myScore > opponentScore ? 'highlight' : ''}>{myScore}</td>
            <td style={{ color: 'var(--text-muted)' }}>{draws}</td>
            <td className={opponentScore > myScore ? 'highlight' : ''}>{opponentScore}</td>
          </tr>
        </tbody>
      </table>

      {matchDuration !== null && (
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontStyle: 'italic' }}>
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
