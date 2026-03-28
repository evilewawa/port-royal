import { SocketProvider, useSocket } from './context/SocketContext';
import Lobby from './pages/Lobby';
import GameBoard from './pages/GameBoard';

function AppInner() {
  const { gameState } = useSocket();
  return gameState ? <GameBoard /> : <Lobby />;
}

export default function App() {
  return (
    <SocketProvider>
      <AppInner />
    </SocketProvider>
  );
}
