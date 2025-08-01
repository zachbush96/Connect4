import { NextRequest, NextResponse } from 'next/server'
import { games, getGame } from '@/lib/game-store'
import { addGameEvent } from '@/lib/game-log-store'

export async function POST(request: NextRequest) {
  try {
    const { gameId } = await request.json()
    console.log('[POST /api/game/rematch] incoming', { gameId })

    if (!gameId) {
      return NextResponse.json(
        { success: false, error: 'Missing gameId' },
        { status: 400 }
      )
    }

    const oldGame = getGame(gameId)
    if (!oldGame) {
      return NextResponse.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
      )
    }

    const newGameId = Math.random().toString(36).substr(2, 9)
    const board = Array(oldGame.boardSize).fill(null).map(() => Array(oldGame.boardSize).fill(''))
    const blocksUsed: Record<string, boolean> = {}
    oldGame.players.forEach(p => { blocksUsed[p.id] = false })

    const newGame = {
      id: newGameId,
      board,
      currentPlayer: oldGame.players[0].id,
      players: oldGame.players,
      winner: null,
      isDraw: false,
      blocksUsed,
      boardSize: oldGame.boardSize,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    games.set(newGameId, newGame)

    addGameEvent({
      type: 'game-created',
      gameId: newGameId,
      playerId: newGame.currentPlayer,
      playerName: oldGame.players[0].name,
      playerColor: oldGame.players[0].color,
      boardSize: newGame.boardSize,
      timestamp: new Date().toISOString(),
    })

    console.log('[POST /api/game/rematch] game created', { newGameId })

    return NextResponse.json({ success: true, game: newGame })
  } catch (error) {
    console.error('[POST /api/game/rematch] error', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
