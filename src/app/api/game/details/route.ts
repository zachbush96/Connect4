import { NextRequest, NextResponse } from 'next/server'
import { getGame } from '@/lib/game-store'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')
    if (!gameId) {
      return NextResponse.json(
        { success: false, error: 'Missing gameId' },
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

    return NextResponse.json({ success: true, game })
  } catch (error) {
    console.error('[GET /api/game/details] error', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
