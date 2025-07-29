import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Game storage in memory (in production, you'd use a database)
const games = new Map<string, any>()

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
      boardSize,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    games.set(gameId, game)

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

// Helper function to get game (exported for use in other routes)
export function getGame(gameId: string) {
  return games.get(gameId)
}

// Helper function to update game (exported for use in other routes)
export function updateGame(gameId: string, gameData: any) {
  games.set(gameId, { ...gameData, updatedAt: new Date().toISOString() })
}