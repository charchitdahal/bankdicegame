const express = require('express');
const { WebSocketServer } = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());

// Store game states and player connections
const games = new Map();
const connections = new Map();

// Create HTTP server
const server = app.listen(process.env.PORT || 3001, () => {
  console.log(`Server running on port ${server.address().port}`);
});

// Create WebSocket server with ping/pong
const wss = new WebSocketServer({ 
  server,
  pingInterval: 30000, // Send ping every 30 seconds
  pingTimeout: 5000 // Wait 5 seconds for pong response
});

// Handle ping/pong
function heartbeat() {
  this.isAlive = true;
}

wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.isAlive = true;
  ws.on('pong', heartbeat);

  ws.on('message', (message) => {
    try {
      const { type, data } = JSON.parse(message);
      
      // Handle ping message
      if (type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
        return;
      }

      switch (type) {
        case 'joinGame': {
          const { gameId, player } = data;
          if (!games.has(gameId)) {
            games.set(gameId, {
              players: [],
              currentTurn: player.id,
              gameState: {
                isRolling: false,
                diceValues: [1, 1],
                currentRound: 1,
                totalRounds: 20,
                bankTotal: 0,
                rollCount: 0,
                gameOver: false,
                winner: null
              }
            });
          }
          
          const game = games.get(gameId);
          if (!game.players.find(p => p.id === player.id)) {
            game.players.push(player);
            connections.set(player.id, ws);
            
            // Broadcast updated game state to all players
            broadcastGameState(gameId);
          }
          break;
        }
        
        case 'rollDice': {
          const { gameId, playerId } = data;
          const game = games.get(gameId);
          if (!game) return;
          
          game.gameState.isRolling = true;
          broadcastGameState(gameId);
          
          // Simulate dice roll
          setTimeout(() => {
            const dice1 = Math.floor(Math.random() * 6) + 1;
            const dice2 = Math.floor(Math.random() * 6) + 1;
            game.gameState.diceValues = [dice1, dice2];
            game.gameState.isRolling = false;
            game.gameState.rollCount++;
            
            const total = dice1 + dice2;
            if (game.gameState.rollCount <= 3 && total === 7) {
              game.gameState.bankTotal += 70;
            } else if (game.gameState.rollCount <= 3) {
              game.gameState.bankTotal += total;
            } else if (total === 7) {
              game.gameState.bankTotal = 0;
              endRound(gameId);
            } else if (dice1 === dice2) {
              game.gameState.bankTotal *= 2;
            } else {
              game.gameState.bankTotal += total;
            }
            
            broadcastGameState(gameId);
          }, 1000);
          break;
        }
        
        case 'bankPoints': {
          const { gameId, playerId } = data;
          const game = games.get(gameId);
          if (!game) return;
          
          const player = game.players.find(p => p.id === playerId);
          if (player) {
            player.score += game.gameState.bankTotal;
            player.hasBankedThisRound = true;
            
            if (game.players.every(p => p.hasBankedThisRound)) {
              endRound(gameId);
            } else {
              broadcastGameState(gameId);
            }
          }
          break;
        }
        
        case 'endTurn': {
          const { gameId, playerId } = data;
          const game = games.get(gameId);
          if (!game) return;
          
          const currentPlayerIndex = game.players.findIndex(p => p.id === playerId);
          let nextPlayerIndex = (currentPlayerIndex + 1) % game.players.length;
          
          // Find next player who hasn't banked
          while (game.players[nextPlayerIndex].hasBankedThisRound) {
            nextPlayerIndex = (nextPlayerIndex + 1) % game.players.length;
            if (nextPlayerIndex === currentPlayerIndex) {
              endRound(gameId);
              return;
            }
          }
          
          game.currentTurn = game.players[nextPlayerIndex].id;
          broadcastGameState(gameId);
          break;
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({ type: 'error', data: { message: 'Invalid message format' } }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    // Remove connection from connections map
    for (const [playerId, conn] of connections.entries()) {
      if (conn === ws) {
        connections.delete(playerId);
        break;
      }
    }
  });
});

// Ping all clients periodically
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});

function broadcastGameState(gameId) {
  const game = games.get(gameId);
  if (!game) return;
  
  const message = JSON.stringify({
    type: 'gameState',
    data: {
      players: game.players,
      currentTurn: game.currentTurn,
      gameState: game.gameState
    }
  });
  
  game.players.forEach(player => {
    const connection = connections.get(player.id);
    if (connection && connection.readyState === 1) {
      connection.send(message);
    }
  });
}

function endRound(gameId) {
  const game = games.get(gameId);
  if (!game) return;
  
  game.gameState.currentRound++;
  if (game.gameState.currentRound > game.gameState.totalRounds) {
    const winner = game.players.reduce((prev, current) => 
      (current.score > prev.score) ? current : prev
    );
    game.gameState.gameOver = true;
    game.gameState.winner = winner.id;
  } else {
    game.gameState.bankTotal = 0;
    game.gameState.rollCount = 0;
    game.gameState.diceValues = [1, 1];
    game.players.forEach(player => {
      player.hasBankedThisRound = false;
    });
    game.currentTurn = game.players[0].id;
  }
  
  broadcastGameState(gameId);
}

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});