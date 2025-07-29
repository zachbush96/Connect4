import { Server } from 'socket.io';
import { getGame, updateGame } from '@/lib/game-store';

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Handle joining a game room
    socket.on('join-game', (gameId: string) => {
      socket.join(`game-${gameId}`);
      console.log(`Client ${socket.id} joined game ${gameId}`);

      // Send current game state to the client
      const game = getGame(gameId);
      if (game) {
        socket.emit('game-state', game);
        // notify other players in the room that a player joined
        socket.to(`game-${gameId}`).emit('game-updated', game);
      }
    });

    // Handle making a move
    socket.on('make-move', (data: { gameId: string; playerId: string; row: number; col: number }) => {
      const { gameId, playerId, row, col } = data;
      console.log('make-move received', { gameId, playerId, row, col });
      
      // Get the current game state
      const game = getGame(gameId);
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      if (game.winner || game.isDraw) {
        socket.emit('error', { message: 'Game is already finished' });
        return;
      }

      if (game.currentPlayer !== playerId) {
        socket.emit('error', { message: 'Not your turn' });
        return;
      }

      // Validate move
      if (row < 0 || row >= game.boardSize || col < 0 || col >= game.boardSize) {
        socket.emit('error', { message: 'Invalid move position' });
        return;
      }

      if (game.board[row][col] !== '') {
        socket.emit('error', { message: 'Position already occupied' });
        return;
      }

      // Make the move
      const newBoard = game.board.map((r: string[]) => [...r]);
      newBoard[row][col] = playerId;

      // Check for winner
      const winner = checkWinner(newBoard, playerId, row, col, game.boardSize);
      
      // Check for draw
      const isDraw = !winner && newBoard.flat().every(cell => cell !== '');

      // Determine next player
      const nextPlayer = game.players.find((p: any) => p.id !== playerId)?.id || playerId;

      const updatedGame = {
        ...game,
        board: newBoard,
        currentPlayer: winner ? game.currentPlayer : nextPlayer,
        winner,
        isDraw,
      };

      updateGame(gameId, updatedGame);

      // Broadcast the updated game state to all players in the game
      io.to(`game-${gameId}`).emit('game-updated', updatedGame);
      console.log('game state updated', { gameId, winner, isDraw });
    });

    // Handle leaving a game room
    socket.on('leave-game', (gameId: string) => {
      socket.leave(`game-${gameId}`);
      console.log(`Client ${socket.id} left game ${gameId}`);
    });

    // Handle direct WebSocket messages (for native WebSocket compatibility)
    socket.on('message', (data) => {
      try {
        const message = typeof data === 'string' ? JSON.parse(data) : data;
        console.log('raw message received', message);
        
        if (message.type === 'join-game') {
          // Handle join-game message
          socket.join(`game-${message.gameId}`);
          console.log(`Client ${socket.id} joined game ${message.gameId}`);
          
          // Send current game state to the client
          const game = getGame(message.gameId);
          if (game) {
            socket.emit('game-state', game);
          }
        } else if (message.type === 'make-move') {
          // Handle make-move message
          const { gameId, playerId, row, col } = message;
          
          // Get the current game state
          const game = getGame(gameId);
          if (!game) {
            socket.emit('error', { message: 'Game not found' });
            return;
          }

          if (game.winner || game.isDraw) {
            socket.emit('error', { message: 'Game is already finished' });
            return;
          }

          if (game.currentPlayer !== playerId) {
            socket.emit('error', { message: 'Not your turn' });
            return;
          }

          // Validate move
          if (row < 0 || row >= game.boardSize || col < 0 || col >= game.boardSize) {
            socket.emit('error', { message: 'Invalid move position' });
            return;
          }

          if (game.board[row][col] !== '') {
            socket.emit('error', { message: 'Position already occupied' });
            return;
          }

          // Make the move
          const newBoard = game.board.map((r: string[]) => [...r]);
          newBoard[row][col] = playerId;

          // Check for winner
          const winner = checkWinner(newBoard, playerId, row, col, game.boardSize);
          
          // Check for draw
          const isDraw = !winner && newBoard.flat().every(cell => cell !== '');

          // Determine next player
          const nextPlayer = game.players.find((p: any) => p.id !== playerId)?.id || playerId;

          const updatedGame = {
            ...game,
            board: newBoard,
            currentPlayer: winner ? game.currentPlayer : nextPlayer,
            winner,
            isDraw,
          };

          updateGame(gameId, updatedGame);

          // Broadcast the updated game state to all players in the game
          io.to(`game-${gameId}`).emit('game-updated', updatedGame);
          console.log('game state updated', { gameId, winner, isDraw });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Send welcome message
    socket.emit('message', {
      text: 'Welcome to Connect 4 Game Server!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
};

function checkWinner(board: string[][], playerId: string, row: number, col: number, boardSize: number): string | null {
  // Check horizontal
  if (checkDirection(board, playerId, row, col, 0, 1, boardSize)) return playerId;
  
  // Check vertical
  if (checkDirection(board, playerId, row, col, 1, 0, boardSize)) return playerId;
  
  // Check diagonal (top-left to bottom-right)
  if (checkDirection(board, playerId, row, col, 1, 1, boardSize)) return playerId;
  
  // Check diagonal (top-right to bottom-left)
  if (checkDirection(board, playerId, row, col, 1, -1, boardSize)) return playerId;
  
  return null;
}

function checkDirection(board: string[][], playerId: string, row: number, col: number, deltaRow: number, deltaCol: number, boardSize: number): boolean {
  let count = 1;
  
  // Check in positive direction
  let r = row + deltaRow;
  let c = col + deltaCol;
  while (r >= 0 && r < boardSize && c >= 0 && c < boardSize && board[r][c] === playerId) {
    count++;
    r += deltaRow;
    c += deltaCol;
  }
  
  // Check in negative direction
  r = row - deltaRow;
  c = col - deltaCol;
  while (r >= 0 && r < boardSize && c >= 0 && c < boardSize && board[r][c] === playerId) {
    count++;
    r -= deltaRow;
    c -= deltaCol;
  }
  
  return count >= 4;
}