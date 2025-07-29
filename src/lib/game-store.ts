export interface Player {
  id: string
  name: string
  color: string
}

export interface Game {
  id: string
  board: string[][]
  currentPlayer: string
  players: Player[]
  winner: string | null
  isDraw: boolean
  boardSize: number
  createdAt: string
  updatedAt: string
}

declare global {
  var games: Map<string, Game> | undefined
}

const globalForGames = globalThis as unknown as { games: Map<string, Game> | undefined }

export const games: Map<string, Game> = globalForGames.games ?? new Map()
if (!globalForGames.games) {
  globalForGames.games = games
}

export function getGame(gameId: string): Game | undefined {
  return games.get(gameId)
}

export function updateGame(gameId: string, gameData: Game) {
  games.set(gameId, { ...gameData, updatedAt: new Date().toISOString() })
}
