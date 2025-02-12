"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DiceDisplay } from "@/components/dice-display";
import { GameControls } from "@/components/game-controls";
import { useGame } from "@/lib/game-context";
import { useRouter } from 'next/navigation';
import { generateGameId } from '@/lib/utils';

type JoinFlowStep = 'initial' | 'create' | 'join';

interface GameBoardProps {
  initialGameId?: string;
}

export function GameBoard({ initialGameId }: GameBoardProps) {
  const {
    gameId,
    playerId,
    players,
    currentTurn,
    gameState,
    joinGame,
    createGame,
    rollDice,
    bankPoints,
    endTurn
  } = useGame();
  
  const [joinFlowStep, setJoinFlowStep] = useState<JoinFlowStep>(initialGameId ? 'join' : 'initial');
  const [joinGameId, setJoinGameId] = useState(initialGameId || "");
  const [playerName, setPlayerName] = useState("");
  const router = useRouter();

  const currentPlayer = players.find(p => p.id === playerId);
  const isPlayerTurn = currentTurn === playerId;

  if (!gameId) {
    if (joinFlowStep === 'initial') {
      return (
        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-bold">Welcome to BANK!</h2>
                <p className="text-muted-foreground">Choose how you want to play</p>
              </div>
              
              <div className="space-y-4">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    const newGameId = generateGameId();
                    router.push(`/${newGameId}`);
                    setJoinGameId(newGameId);
                    setJoinFlowStep('create');
                  }}
                >
                  Create New Game
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setJoinFlowStep('join')}
                >
                  Join Existing Game
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">How to Play</h3>
              <div className="space-y-4 text-sm">
                <p>
                  <strong>Object of the Game:</strong> Be the player who BANKs the most points by the end of 20 rounds!
                </p>
                <div>
                  <strong>Getting Started:</strong>
                  <ul className="list-disc ml-6 mt-2 space-y-2">
                    <li>Create a new game or join an existing one</li>
                    <li>Each player needs two dice for their turn</li>
                    <li>Players typically sit around a table and take turns clockwise</li>
                  </ul>
                </div>
                <div>
                  <strong>On Your Turn:</strong>
                  <ul className="list-disc ml-6 mt-2 space-y-2">
                    <li>Roll both dice and add up their values</li>
                    <li>The total is added to the BANK</li>
                    <li>You can choose to roll again or BANK your points</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Special Rules</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <strong>First Three Rolls:</strong>
                  <ul className="list-disc ml-6 mt-2 space-y-2">
                    <li>Rolling a 7 is worth 70 points</li>
                    <li>Doubles are worth face value only (e.g., two 5s = 10 points)</li>
                  </ul>
                </div>
                <div>
                  <strong>After First Three Rolls:</strong>
                  <ul className="list-disc ml-6 mt-2 space-y-2">
                    <li>Rolling a 7 ends the round</li>
                    <li>Doubles multiply the current BANK total by 2</li>
                  </ul>
                </div>
                <div>
                  <strong>Banking Points:</strong>
                  <ul className="list-disc ml-6 mt-2 space-y-2">
                    <li>Any player can BANK at any time</li>
                    <li>After banking, you sit out the rest of the round</li>
                    <li>You can only BANK once per round</li>
                    <li>If you don't BANK, you don't get any points for that round</li>
                  </ul>
                </div>
                <div>
                  <strong>Round End:</strong>
                  <ul className="list-disc ml-6 mt-2">
                    <li>Round ends when someone rolls a 7 or all players have banked</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      );
    }

    if (joinFlowStep === 'create' || joinFlowStep === 'join') {
      return (
        <Card className="max-w-md mx-auto p-6">
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold">
                {joinFlowStep === 'create' ? 'Create New Game' : 'Join Game'}
              </h2>
              <p className="text-muted-foreground">Enter your details to {joinFlowStep === 'create' ? 'start' : 'join'}</p>
            </div>
            
            <div className="space-y-4">
              <Input
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
              {joinFlowStep === 'join' && !initialGameId && (
                <Input
                  placeholder="Enter Game ID"
                  value={joinGameId}
                  onChange={(e) => setJoinGameId(e.target.value)}
                />
              )}
              
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setJoinFlowStep('initial');
                    router.push('/');
                  }}
                >
                  Back
                </Button>
                <Button
                  className="w-full"
                  onClick={() => {
                    if (joinFlowStep === 'create') {
                      createGame(playerName || 'Player');
                    } else {
                      joinGame(joinGameId, playerName || 'Player');
                    }
                  }}
                  disabled={!playerName.trim() || (joinFlowStep === 'join' && !joinGameId)}
                >
                  {joinFlowStep === 'create' ? 'Start Game' : 'Join Game'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      );
    }
  }

  if (gameState.gameOver) {
    const winner = players.find(p => p.id === gameState.winner);
    return (
      <Card className="max-w-md mx-auto p-6 text-center">
        <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
        <p className="text-xl mb-6">
          {winner?.name} wins with {winner?.score} points!
        </p>
        <Button
          size="lg"
          className="w-full"
          onClick={() => {
            router.push('/');
            setJoinFlowStep('initial');
            setPlayerName('');
            setJoinGameId('');
          }}
        >
          Start New Game
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Game ID: {gameId}</p>
          <p className="text-sm text-muted-foreground">Round {gameState.currentRound} of {gameState.totalRounds}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          {isPlayerTurn ? "Your turn!" : `${players.find(p => p.id === currentTurn)?.name}'s turn`}
        </p>
      </div>
      
      <div className="grid gap-8 md:grid-cols-2">
        <Card className="p-6">
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">Bank Total</h3>
              <p className="text-4xl font-bold">{gameState.bankTotal}</p>
              <p className="text-sm text-muted-foreground mt-2">Roll #{gameState.rollCount}</p>
            </div>
            <DiceDisplay
              values={gameState.diceValues}
              isRolling={gameState.isRolling}
            />
            <GameControls
              onRoll={rollDice}
              onBank={() => bankPoints(playerId)}
              onPass={endTurn}
              disabled={!isPlayerTurn || gameState.isRolling}
              canBank={!currentPlayer?.hasBankedThisRound}
            />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Players</h2>
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    player.id === currentTurn
                      ? "bg-primary text-primary-foreground"
                      : player.hasBankedThisRound
                      ? "bg-muted opacity-50"
                      : "bg-muted"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{player.name}</span>
                    {player.hasBankedThisRound && (
                      <span className="text-xs bg-secondary px-2 py-1 rounded">Banked</span>
                    )}
                  </div>
                  <div className="text-right">
                    <div>{player.score} points</div>
                    {!player.hasBankedThisRound && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => bankPoints(player.id)}
                        disabled={gameState.bankTotal === 0}
                      >
                        Bank Points
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}