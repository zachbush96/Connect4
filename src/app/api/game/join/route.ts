import { NextRequest, NextResponse } from 'next/server'
import { getGame, updateGame } from '@/lib/game-store'

export async function POST(request: NextRequest) {
  try {
    const { playerName, playerColor, gameId } = await request.json()
    console.log('[POST /api/game/join] incoming', {
      playerName,
      playerColor,
      gameId,
    })

    if (!playerName || !playerColor || !gameId) {
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

    if (game.players.length >= 2) {
      return NextResponse.json(
        { success: false, error: 'Game is full' },
        { status: 400 }
      )
    }

    // Check if player already exists in game
    const existingPlayer = game.players.find((p: any) => p.name === playerName)
    if (existingPlayer) {
      return NextResponse.json(
        { success: false, error: 'Player name already taken' },
        { status: 400 }
      )
    }

    // Add new player
    const playerId = Math.random().toString(36).substr(2, 9)
    const newPlayer = {
      id: playerId,
      name: playerName,
      color: playerColor,
    }

    const updatedGame = {
      ...game,
      players: [...game.players, newPlayer],
    }

    updateGame(gameId, updatedGame)

    console.log('[POST /api/game/join] player joined', {
      gameId,
      playerId,
    })

    return NextResponse.json({
      success: true,
      game: updatedGame,
    })
  } catch (error) {
    console.error('[POST /api/game/join] error', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}