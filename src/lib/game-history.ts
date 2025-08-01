import fs from 'fs'
import path from 'path'
import { BLOCKED_CELL } from './constants'

interface GameEvent {
  type: 'game-created' | 'player-joined' | 'move' | 'block'
  gameId: string
  playerId?: string
  playerName?: string
  playerColor?: string
  row?: number
  col?: number
  boardSize?: number
  timestamp: string
}

interface PlayerInfo {
  name: string
  color: string
}

export interface GameSummary {
  gameId: string
  board: string[][]
  boardSize: number
  winner: { name: string; color: string } | null
  isDraw: boolean
  timestamp: string
}

const GAME_LOG_FILE = path.join(process.cwd(), 'game-log.json')

function checkDirection(
  board: string[][],
  playerId: string,
  row: number,
  col: number,
  deltaRow: number,
  deltaCol: number,
  boardSize: number
): boolean {
  let count = 1
  let r = row + deltaRow
  let c = col + deltaCol
  while (r >= 0 && r < boardSize && c >= 0 && c < boardSize && board[r][c] === playerId) {
    count++
    r += deltaRow
    c += deltaCol
  }
  r = row - deltaRow
  c = col - deltaCol
  while (r >= 0 && r < boardSize && c >= 0 && c < boardSize && board[r][c] === playerId) {
    count++
    r -= deltaRow
    c -= deltaCol
  }
  return count >= 4
}

function checkWinner(
  board: string[][],
  playerId: string,
  row: number,
  col: number,
  boardSize: number
): boolean {
  return (
    checkDirection(board, playerId, row, col, 0, 1, boardSize) ||
    checkDirection(board, playerId, row, col, 1, 0, boardSize) ||
    checkDirection(board, playerId, row, col, 1, 1, boardSize) ||
    checkDirection(board, playerId, row, col, 1, -1, boardSize)
  )
}

export function getGameHistory(): GameSummary[] {
  let events: GameEvent[] = []
  try {
    if (fs.existsSync(GAME_LOG_FILE)) {
      const file = fs.readFileSync(GAME_LOG_FILE, 'utf8')
      events = JSON.parse(file) as GameEvent[]
    }
  } catch (err) {
    console.error('Failed to read game log', err)
    return []
  }

  const games: Record<string, {
    boardSize: number
    board: string[][]
    players: Record<string, PlayerInfo>
    winner: string | null
    isDraw: boolean
    timestamp: string
  }> = {}

  for (const ev of events) {
    if (ev.type === 'game-created') {
      games[ev.gameId] = {
        boardSize: ev.boardSize || 7,
        board: Array(ev.boardSize || 7).fill(null).map(() => Array(ev.boardSize || 7).fill('')),
        players: ev.playerId ? { [ev.playerId]: { name: ev.playerName || '', color: ev.playerColor || '#000' } } : {},
        winner: null,
        isDraw: false,
        timestamp: ev.timestamp,
      }
    } else if (ev.type === 'player-joined') {
      const g = games[ev.gameId]
      if (g && ev.playerId) {
        g.players[ev.playerId] = { name: ev.playerName || '', color: ev.playerColor || '#000' }
      }
    } else if (ev.type === 'block') {
      const g = games[ev.gameId]
      if (!g) continue
      if (ev.row !== undefined && ev.col !== undefined) {
        g.board[ev.row][ev.col] = BLOCKED_CELL
        g.timestamp = ev.timestamp
      }
      if (!g.winner && !g.isDraw) {
        if (g.board.flat().every(c => c !== '' && c !== BLOCKED_CELL)) {
          g.isDraw = true
        }
      }
    } else if (ev.type === 'move') {
      const g = games[ev.gameId]
      if (!g || ev.row === undefined || ev.col === undefined || !ev.playerId) continue
      g.board[ev.row][ev.col] = ev.playerId
      g.timestamp = ev.timestamp
      if (!g.winner) {
        if (checkWinner(g.board, ev.playerId, ev.row, ev.col, g.boardSize)) {
          g.winner = ev.playerId
        } else if (g.board.flat().every(c => c !== '' && c !== BLOCKED_CELL)) {
          g.isDraw = true
        }
      }
    }
  }

  const summaries: GameSummary[] = []
  for (const [gameId, g] of Object.entries(games)) {
    const boardColors = g.board.map(row =>
      row.map(cell => {
        if (cell === BLOCKED_CELL || cell === '') return cell
        const p = g.players[cell]
        return p ? p.color : cell
      })
    )
    const winnerInfo = g.winner ? g.players[g.winner] : null
    summaries.push({
      gameId,
      board: boardColors,
      boardSize: g.boardSize,
      winner: winnerInfo ? { name: winnerInfo.name, color: winnerInfo.color } : null,
      isDraw: g.isDraw && !g.winner,
      timestamp: g.timestamp,
    })
  }

  summaries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  return summaries
}

