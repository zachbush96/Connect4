"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { cn } from '@/lib/utils'

interface ScoreEntry {
  name: string
  wins: number
}

export function Scoreboard({ className }: { className?: string }) {
  const [scores, setScores] = useState<ScoreEntry[]>([])

  const fetchScores = async () => {
    try {
      const res = await fetch('/api/scoreboard')
      const data = await res.json()
      if (data.success) {
        setScores(data.topPlayers)
      }
    } catch (err) {
      console.error('fetch scoreboard error', err)
    }
  }

  useEffect(() => {
    fetchScores()
    const interval = setInterval(fetchScores, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className={cn("w-full max-w-xs", className)}>
      <CardHeader>
        <CardTitle>Scoreboard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {scores.length === 0 && <p>No wins yet.</p>}
        {scores.map((entry, idx) => (
          <div key={entry.name} className="flex justify-between">
            <span>{idx + 1}. {entry.name}</span>
            <span>{entry.wins}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
