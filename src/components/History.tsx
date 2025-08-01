"use client"

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { cn } from '@/lib/utils'
import { BLOCKED_CELL } from '@/lib/constants'

interface GameSummary {
  gameId: string
  board: string[][]
  boardSize: number
  winner: { name: string; color: string } | null
  isDraw: boolean
  timestamp: string
}

export function History({ className }: { className?: string }) {
  const [games, setGames] = useState<GameSummary[]>([])

  // fetch function defined outside useEffect so we can call it on mount AND on an interval
  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history')
      const data = await res.json()
      if (data.success) {
        setGames(data.games as GameSummary[])
      }
    } catch (err) {
      console.error('fetch history error', err)
    }
  }

  useEffect(() => {
    // initial load
    fetchHistory()
    // refresh every 60 seconds to match the scoreboard
    const interval = setInterval(fetchHistory, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className={cn('w-full max-w-xs', className)}>
      <CardHeader>
        <CardTitle>Game History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 overflow-y-auto">
        {games.length === 0 && <p>No games yet.</p>}
        {games.map((game) => (
          <div key={game.gameId} className="space-y-1">
            <div className="text-xs">
              {new Date(game.timestamp).toLocaleString()}
            </div>
            <div className="text-xs">
              {game.winner ? (
                <>Winner: <span style={{ color: game.winner.color }}>{game.winner.name}</span></>
              ) : game.isDraw ? (
                <>Draw</>
              ) : (
                <>In Progress</>
              )}
            </div>
            <div className="inline-block bg-blue-500 p-1 rounded">
              {game.board.map((row, rIdx) => (
                <div key={rIdx} className="flex">
                  {row.map((cell, cIdx) => (
                    <div
                      key={cIdx}
                      className="w-4 h-4 bg-white border border-gray-300 rounded-full m-px flex items-center justify-center"
                    >
                      {cell === BLOCKED_CELL ? (
                        <span className="text-[8px] font-bold">X</span>
                      ) : cell ? (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cell }}
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
