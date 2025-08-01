import { NextResponse } from 'next/server'
import { getGameHistory } from '@/lib/game-history'

export async function GET() {
  const games = getGameHistory()
  return NextResponse.json({ success: true, games })
}
