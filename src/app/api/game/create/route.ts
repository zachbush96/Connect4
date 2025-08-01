import { NextRequest, NextResponse } from 'next/server'
import { games } from '@/lib/game-store'
import { addGameEvent } from '@/lib/game-log-store'

export async function POST(request: NextRequest) {
  try {
    const { playerName, playerColor, boardSize } = await request.json()
    console.log('[POST /api/game/create] incoming', {
      playerName,
      playerColor,
      boardSize,
    })

    if (!playerName || !playerColor || !boardSize) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate unique game ID
    const gameId = Math.random().toString(36).substr(2, 9)
    const playerId = Math.random().toString(36).substr(2, 9)

    // Initialize game board
    const board = Array(boardSize).fill(null).map(() => Array(boardSize).fill(''))

    const game = {
      id: gameId,
      board,
      currentPlayer: playerId,
      players: [
        {
          id: playerId,
          name: playerName,
          color: playerColor,
        }
      ],
      winner: null,
      isDraw: false,
      blocksUsed: { [playerId]: false },
      boardSize,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    games.set(gameId, game)

    addGameEvent({
      type: 'game-created',
      gameId,
      playerId,
      playerName,
      playerColor,
      boardSize,
      timestamp: new Date().toISOString(),
    })

    console.log('[POST /api/game/create] game created', { gameId })

    return NextResponse.json({
      success: true,
      game,
    })
  } catch (error) {
    console.error('[POST /api/game/create] error', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Game utility functions are provided by '@/lib/game-store'
