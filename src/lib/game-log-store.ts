import fs from 'fs'
import path from 'path'

export interface GameEvent {
  type: 'game-created' | 'player-joined' | 'move' | 'block' | 'chat'
  gameId: string
  playerId?: string
  playerName?: string
  playerColor?: string
  message?: string
  row?: number
  col?: number
  boardSize?: number
  timestamp: string
}

const GAME_LOG_FILE = path.join(process.cwd(), 'game-log.json')

function loadLogFromFile(): GameEvent[] {
  try {
    if (!fs.existsSync(GAME_LOG_FILE)) {
      fs.writeFileSync(GAME_LOG_FILE, '[]', 'utf8')
      return []
    }
    const file = fs.readFileSync(GAME_LOG_FILE, 'utf8')
    return JSON.parse(file) as GameEvent[]
  } catch (err) {
    console.error('Failed to load game log', err)
    return []
  }
}

function saveLogToFile(log: GameEvent[]) {
  try {
    fs.writeFileSync(GAME_LOG_FILE, JSON.stringify(log, null, 2), 'utf8')
  } catch (err) {
    console.error('Failed to save game log', err)
  }
}

declare global {
  var gameLog: GameEvent[] | undefined
}

const globalForLog = globalThis as unknown as { gameLog: GameEvent[] | undefined }

export const gameLog: GameEvent[] = globalForLog.gameLog ?? loadLogFromFile()
if (!globalForLog.gameLog) {
  globalForLog.gameLog = gameLog
}

export function addGameEvent(event: GameEvent) {
  gameLog.push(event)
  saveLogToFile(gameLog)
}

export interface ChatMessage {
  senderName: string
  text: string
  timestamp: string
}

export function getChatMessages(gameId: string): ChatMessage[] {
  const events = loadLogFromFile()
  return events
    .filter(ev => ev.type === 'chat' && ev.gameId === gameId && ev.message)
    .map(ev => ({
      senderName: ev.playerName || 'Unknown',
      text: ev.message as string,
      timestamp: ev.timestamp,
    }))
}
