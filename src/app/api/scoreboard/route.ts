import { NextResponse } from 'next/server'
import { getTopPlayers } from '@/lib/scoreboard-store'

export async function GET() {
  const topPlayers = getTopPlayers(5)
  return NextResponse.json({ success: true, topPlayers })
}
