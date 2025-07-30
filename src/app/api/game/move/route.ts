import { NextRequest, NextResponse } from 'next/server'
import { getGame, updateGame } from '@/lib/game-store'
import { BLOCKED_CELL } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const { gameId, playerId, row, col } = await request.json()
    console.log('[POST /api/game/move] incoming', { gameId, playerId, row, col })

    if (!gameId || !playerId || row === undefined || col === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const game = getGame(gameId)
    
    if (!game) {
      return NextResponse.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
      )
    }

    if (game.winner || game.isDraw) {
      return NextResponse.json(
        { success: false, error: 'Game is already finished' },
        { status: 400 }
      )
    }

    if (game.currentPlayer !== playerId) {
      return NextResponse.json(
        { success: false, error: 'Not your turn' },
        { status: 400 }
      )
    }

    // Validate move
    if (row < 0 || row >= game.boardSize || col < 0 || col >= game.boardSize) {
      return NextResponse.json(
        { success: false, error: 'Invalid move position' },
        { status: 400 }
      )
    }

    if (game.board[row][col] !== '') {
      return NextResponse.json(
        { success: false, error: 'Position already occupied' },
        { status: 400 }
      )
    }

    // Make the move
    const newBoard = game.board.map((r: string[]) => [...r])
    newBoard[row][col] = playerId

    // Check for winner
    const winner = checkWinner(newBoard, playerId, row, col, game.boardSize)
    
    // Check for draw
    const isDraw = !winner && newBoard.flat().every(cell => cell !== '' && cell !== BLOCKED_CELL)

    // Determine next player
    const nextPlayer = game.players.find((p: any) => p.id !== playerId)?.id || playerId

    const updatedGame = {
      ...game,
      board: newBoard,
      currentPlayer: winner ? game.currentPlayer : nextPlayer,
      winner,
      isDraw,
    }

    updateGame(gameId, updatedGame)

    console.log('[POST /api/game/move] move processed', { gameId, row, col, winner, isDraw })

    return NextResponse.json({
      success: true,
      game: updatedGame,
    })
  } catch (error) {
    console.error('[POST /api/game/move] error', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function checkWinner(board: string[][], playerId: string, row: number, col: number, boardSize: number): string | null {
  // Check horizontal
  if (checkDirection(board, playerId, row, col, 0, 1, boardSize)) return playerId
  
  // Check vertical
  if (checkDirection(board, playerId, row, col, 1, 0, boardSize)) return playerId
  
  // Check diagonal (top-left to bottom-right)
  if (checkDirection(board, playerId, row, col, 1, 1, boardSize)) return playerId
  
  // Check diagonal (top-right to bottom-left)
  if (checkDirection(board, playerId, row, col, 1, -1, boardSize)) return playerId
  
  return null
}

function checkDirection(board: string[][], playerId: string, row: number, col: number, deltaRow: number, deltaCol: number, boardSize: number): boolean {
  let count = 1
  
  // Check in positive direction
  let r = row + deltaRow
  let c = col + deltaCol
  while (r >= 0 && r < boardSize && c >= 0 && c < boardSize && board[r][c] === playerId) {
    count++
    r += deltaRow
    c += deltaCol
  }
  
  // Check in negative direction
  r = row - deltaRow
  c = col - deltaCol
  while (r >= 0 && r < boardSize && c >= 0 && c < boardSize && board[r][c] === playerId) {
    count++
    r -= deltaRow
    c -= deltaCol
  }
  
  return count >= 4
}