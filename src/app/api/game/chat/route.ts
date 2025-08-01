import { NextRequest, NextResponse } from 'next/server'
import { getChatMessages } from '@/lib/game-log-store'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const gameId = searchParams.get('gameId')
  if (!gameId) {
    return NextResponse.json({ success: false, error: 'Missing gameId' }, { status: 400 })
  }
  const messages = getChatMessages(gameId)
  return NextResponse.json({ success: true, messages })
}
