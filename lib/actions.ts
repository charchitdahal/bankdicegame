"use client";

import { nanoid } from "nanoid";

// In-memory game state (in production, use Redis or a database)
const games = new Map<string, GameState>();

interface Player {
  id: string;
  name: string;
  score: number;
  hasRolledThisRound: boolean;
  hasBankedThisRound: boolean;
}

interface GameState {
  players: Player[];
  currentTurn: string;
  isRolling: boolean;
  diceValues: [number, number];
  currentRound: number;
  totalRounds: number;
  bankTotal: number;
  rollCount: number;
  gameOver: boolean;
  winner: string | null;
}

export function getGameState(gameId: string): GameState | null {
  return games.get(gameId) || null;
}

export function joinGame(gameId: string, playerName: string) {
  const playerId = nanoid(8);

  if (!games.has(gameId)) {
    games.set(gameId, {
      players: [],
      currentTurn: playerId,
      isRolling: false,
      diceValues: [1, 1],
      currentRound: 1,
      totalRounds: 20,
      bankTotal: 0,
      rollCount: 0,
      gameOver: false,
      winner: null
    });
  }

  const game = games.get(gameId)!;
  if (!game.players.find((p: Player) => p.id === playerId)) {
    game.players.push({
      id: playerId,
      name: playerName,
      score: 0,
      hasRolledThisRound: false,
      hasBankedThisRound: false
    });
  }

  return { gameState: game, playerId };
}

export function rollDice(gameId: string, playerId: string) {
  const game = games.get(gameId);
  if (!game || game.currentTurn !== playerId || game.isRolling || game.gameOver) {
    return game;
  }

  game.isRolling = true;
  
  // Simulate dice roll
  const dice1 = Math.floor(Math.random() * 6) + 1;
  const dice2 = Math.floor(Math.random() * 6) + 1;
  game.diceValues = [dice1, dice2];
  game.isRolling = false;
  game.rollCount++;
  
  const total = dice1 + dice2;
  if (game.rollCount <= 3 && total === 7) {
    game.bankTotal += 70;
  } else if (game.rollCount <= 3) {
    game.bankTotal += total;
  } else if (total === 7) {
    game.bankTotal = 0;
    endRound(gameId);
  } else if (dice1 === dice2) {
    game.bankTotal *= 2;
  } else {
    game.bankTotal += total;
  }

  return game;
}

export function bankPoints(gameId: string, playerId: string) {
  const game = games.get(gameId);
  if (!game) return game;

  const player = game.players.find((p: Player) => p.id === playerId);
  if (player && !player.hasBankedThisRound) {
    player.score += game.bankTotal;
    player.hasBankedThisRound = true;

    if (game.players.every((p: Player) => p.hasBankedThisRound)) {
      endRound(gameId);
    }
  }

  return game;
}

export function endTurn(gameId: string, playerId: string) {
  const game = games.get(gameId);
  if (!game || game.currentTurn !== playerId || game.gameOver) return game;

  const currentPlayerIndex = game.players.findIndex((p: Player) => p.id === playerId);
  let nextPlayerIndex = (currentPlayerIndex + 1) % game.players.length;

  while (game.players[nextPlayerIndex].hasBankedThisRound) {
    nextPlayerIndex = (nextPlayerIndex + 1) % game.players.length;
    if (nextPlayerIndex === currentPlayerIndex) {
      endRound(gameId);
      return game;
    }
  }

  game.currentTurn = game.players[nextPlayerIndex].id;
  return game;
}

function endRound(gameId: string) {
  const game = games.get(gameId);
  if (!game) return;

  game.currentRound++;
  if (game.currentRound > game.totalRounds) {
    const winner = game.players.reduce((prev: Player, current: Player) => 
      (current.score > prev.score) ? current : prev
    );
    game.gameOver = true;
    game.winner = winner.id;
  } else {
    game.bankTotal = 0;
    game.rollCount = 0;
    game.diceValues = [1, 1];
    game.players.forEach((player: Player) => {
      player.hasBankedThisRound = false;
    });
    game.currentTurn = game.players[0].id;
  }
}