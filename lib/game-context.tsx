"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateGameId } from './utils';
import { sendMessage, onMessage, offMessage } from './socket';

interface GameContextType {
  gameId: string;
  playerId: string;
  players: Player[];
  currentTurn: string;
  gameState: GameState;
  joinGame: (gameId: string, playerName: string) => void;
  createGame: (playerName: string) => void;
  rollDice: () => void;
  bankPoints: (playerId: string) => void;
  endTurn: () => void;
}

interface Player {
  id: string;
  name: string;
  score: number;
  hasRolledThisRound: boolean;
  hasBankedThisRound: boolean;
}

interface GameState {
  isRolling: boolean;
  diceValues: [number, number];
  currentRound: number;
  totalRounds: number;
  bankTotal: number;
  rollCount: number;
  gameOver: boolean;
  winner: string | null;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameId, setGameId] = useState<string>('');
  const [playerId, setPlayerId] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentTurn, setCurrentTurn] = useState<string>('');
  const [gameState, setGameState] = useState<GameState>({
    isRolling: false,
    diceValues: [1, 1],
    currentRound: 1,
    totalRounds: 20,
    bankTotal: 0,
    rollCount: 0,
    gameOver: false,
    winner: null
  });

  const router = useRouter();

  useEffect(() => {
    // Set up WebSocket message handlers
    onMessage('gameState', (data) => {
      setPlayers(data.players);
      setCurrentTurn(data.currentTurn);
      setGameState(data.gameState);
    });

    onMessage('playerJoined', (player) => {
      setPlayers(prev => [...prev, player]);
    });

    // Cleanup handlers when component unmounts
    return () => {
      offMessage('gameState');
      offMessage('playerJoined');
    };
  }, []);

  const handleJoinGame = (id: string, playerName: string) => {
    setGameId(id);
    const newPlayerId = Math.random().toString(36).substr(2, 9);
    setPlayerId(newPlayerId);

    sendMessage('joinGame', {
      gameId: id,
      player: {
        id: newPlayerId,
        name: playerName,
        score: 0,
        hasRolledThisRound: false,
        hasBankedThisRound: false
      }
    });
  };

  const handleCreateGame = (playerName: string) => {
    const newGameId = generateGameId();
    router.push(`/${newGameId}`);
    handleJoinGame(newGameId, playerName);
  };

  const handleRollDice = () => {
    if (currentTurn !== playerId || gameState.isRolling || gameState.gameOver) return;
    sendMessage('rollDice', { gameId, playerId });
  };

  const handleBankPoints = (bankingPlayerId: string) => {
    const player = players.find(p => p.id === bankingPlayerId);
    if (!player || player.hasBankedThisRound || gameState.bankTotal === 0) return;
    sendMessage('bankPoints', { gameId, playerId: bankingPlayerId });
  };

  const handleEndTurn = () => {
    if (currentTurn !== playerId || gameState.gameOver) return;
    sendMessage('endTurn', { gameId, playerId });
  };

  return (
    <GameContext.Provider
      value={{
        gameId,
        playerId,
        players,
        currentTurn,
        gameState,
        joinGame: handleJoinGame,
        createGame: handleCreateGame,
        rollDice: handleRollDice,
        bankPoints: handleBankPoints,
        endTurn: handleEndTurn
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}