import { NextRequest, NextResponse } from 'next/server'
import { getGame, updateGame } from '@/lib/game-store'
import { BLOCKED_CELL } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const { gameId, playerId, row, col } = await request.json()
    console.log('[POST /api/game/block] incoming', { gameId, playerId, row, col })

    if (!gameId || !playerId || row === undefined || col === undefined) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const game = getGame(gameId)

    if (!game) {
      return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 })
    }

    if (game.winner || game.isDraw) {
      return NextResponse.json({ success: false, error: 'Game is already finished' }, { status: 400 })
    }

    if (game.blocksUsed[playerId]) {
      return NextResponse.json({ success: false, error: 'Block already used' }, { status: 400 })
    }

    if (row < 0 || row >= game.boardSize || col < 0 || col >= game.boardSize) {
      return NextResponse.json({ success: false, error: 'Invalid block position' }, { status: 400 })
    }

    if (game.board[row][col] !== '') {
      return NextResponse.json({ success: false, error: 'Position already occupied' }, { status: 400 })
    }

    const newBoard = game.board.map((r: string[]) => [...r])
    newBoard[row][col] = BLOCKED_CELL

    const isDraw = !game.winner && newBoard.flat().every(cell => cell !== '' && cell !== BLOCKED_CELL)

    const updatedGame = {
      ...game,
      board: newBoard,
      blocksUsed: { ...game.blocksUsed, [playerId]: true },
      isDraw,
    }

    updateGame(gameId, updatedGame)

    console.log('[POST /api/game/block] block placed', { gameId, row, col })

    return NextResponse.json({ success: true, game: updatedGame })
  } catch (error) {
    console.error('[POST /api/game/block] error', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

