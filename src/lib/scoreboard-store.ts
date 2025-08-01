import fs from 'fs'
import path from 'path'

export interface ScoreEntry {
  name: string
  wins: number
}

declare global {
  // scoreboard map where key is player name and value is wins
  var scoreboard: Map<string, number> | undefined
}

const SCOREBOARD_FILE = path.join(process.cwd(), 'scoreboard.json')

const globalForScoreboard = globalThis as unknown as { scoreboard: Map<string, number> | undefined }

function loadScoreboardFromFile(): Map<string, number> {
  try {
    if (!fs.existsSync(SCOREBOARD_FILE)) {
      fs.writeFileSync(SCOREBOARD_FILE, '{}', 'utf8')
      return new Map()
    }
    const file = fs.readFileSync(SCOREBOARD_FILE, 'utf8')
    const data = JSON.parse(file)
    return new Map(
      Object.entries(data).map(([name, wins]) => [name, Number(wins)])
    )
  } catch (err) {
    console.error('Failed to load scoreboard', err)
    return new Map()
  }
}

function saveScoreboardToFile(sb: Map<string, number>) {
  try {
    const obj = Object.fromEntries(sb)
    fs.writeFileSync(SCOREBOARD_FILE, JSON.stringify(obj, null, 2), 'utf8')
  } catch (err) {
    console.error('Failed to save scoreboard', err)
  }
}

export const scoreboard: Map<string, number> = globalForScoreboard.scoreboard ?? loadScoreboardFromFile()
if (!globalForScoreboard.scoreboard) {
  globalForScoreboard.scoreboard = scoreboard
}

export function addWin(name: string) {
  const current = scoreboard.get(name) ?? 0
  scoreboard.set(name, current + 1)
  saveScoreboardToFile(scoreboard)
}

export function getTopPlayers(limit = 5): ScoreEntry[] {
  // reload from file to ensure the latest scores are returned
  const latest = loadScoreboardFromFile()
  scoreboard.clear()
  latest.forEach((wins, name) => scoreboard.set(name, wins))
  return Array.from(scoreboard.entries())
    .map(([name, wins]) => ({ name, wins }))
    .sort((a, b) => b.wins - a.wins)
    .slice(0, limit)
}
