import { GameProvider, useGame } from './context/GameContext';
import { LoginScreen, MatchmakingScreen, BoardScreen, ResultScreen, MatchFoundScreen } from './components/Screens';

const GameRouter = () => {
  const { status } = useGame();

  switch (status) {
    case 'login':
      return <LoginScreen />;
    case 'matchmaking':
      return <MatchmakingScreen />;
    case 'match_found':
      return <MatchFoundScreen />;
    case 'playing':
      return <BoardScreen />;
    case 'result':
      return <ResultScreen />;
    default:
      return <LoginScreen />;
  }
};

function App() {
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  );
}

export default App;
