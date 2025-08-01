export interface ScoreEntry {
  name: string
  wins: number
}

declare global {
  // scoreboard map where key is player name and value is wins
  var scoreboard: Map<string, number> | undefined
}

const globalForScoreboard = globalThis as unknown as { scoreboard: Map<string, number> | undefined }

export const scoreboard: Map<string, number> = globalForScoreboard.scoreboard ?? new Map()
if (!globalForScoreboard.scoreboard) {
  globalForScoreboard.scoreboard = scoreboard
}

export function addWin(name: string) {
  const current = scoreboard.get(name) ?? 0
  scoreboard.set(name, current + 1)
}

export function getTopPlayers(limit = 5): ScoreEntry[] {
  return Array.from(scoreboard.entries())
    .map(([name, wins]) => ({ name, wins }))
    .sort((a, b) => b.wins - a.wins)
    .slice(0, limit)
}
