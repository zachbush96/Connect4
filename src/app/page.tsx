"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Copy, Share2, Users, Settings } from 'lucide-react'

interface Player {
  id: string
  name: string
  color: string
}

interface GameState {
  board: string[][]
  currentPlayer: string
  players: Player[]
  winner: string | null
  isDraw: boolean
  boardSize: number
  gameId: string | null
}

const COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
]

export default function Connect4() {
  const [gameState, setGameState] = useState<GameState>({
    board: [],
    currentPlayer: '',
    players: [],
    winner: null,
    isDraw: false,
    boardSize: 7,
    gameId: null,
  })
  
  const [playerName, setPlayerName] = useState('')
  const [playerColor, setPlayerColor] = useState(COLORS[0])
  const [isConfiguring, setIsConfiguring] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [gameIdInput, setGameIdInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [socket, setSocket] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)
  
  const { toast } = useToast()

  useEffect(() => {
    // Check if there's a game ID in the URL
    const urlParams = new URLSearchParams(window.location.search)
    const gameId = urlParams.get('game')
    if (gameId) {
      setGameIdInput(gameId)
      setIsJoining(true)
    }
  }, [])

  useEffect(() => {
    // Initialize WebSocket connection
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
      const wsUrl = `${protocol}://${window.location.host}/api/socketio`
      console.log('connecting to websocket', wsUrl)
      const ws = new WebSocket(wsUrl)
      
      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        setSocket(ws)
      }
      
      ws.onmessage = (event) => {
        console.log('WebSocket message', event.data)
        const data = JSON.parse(event.data)
        
        if (data.type === 'game-state' || data.type === 'game-updated') {
          setGameState(prev => ({
            ...prev,
            board: data.board,
            currentPlayer: data.currentPlayer,
            players: data.players,
            winner: data.winner,
            isDraw: data.isDraw,
            boardSize: data.boardSize,
          }))
        }
        
        if (data.type === 'error') {
          toast({
            title: "Error",
            description: data.message,
            variant: "destructive",
          })
        }
      }
      
      ws.onclose = (event) => {
        console.log('WebSocket disconnected', event)
        setIsConnected(false)
        setSocket(null)
      }
      
      ws.onerror = (error) => {
        console.error('WebSocket error', error)
        setIsConnected(false)
      }
      
      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          console.log('closing WebSocket connection')
          ws.close()
        }
      }
    }
  }, [toast])

  useEffect(() => {
    // Join game room when game starts
    if (socket && socket.readyState === WebSocket.OPEN && gameState.gameId && !isConfiguring) {
      console.log('joining game room', gameState.gameId)
      socket.send(JSON.stringify({
        type: 'join-game',
        gameId: gameState.gameId
      }))
    }
  }, [socket, gameState.gameId, isConfiguring])

  const initializeBoard = (size: number) => {
    return Array(size).fill(null).map(() => Array(size).fill(''))
  }

  const createGame = async () => {
    if (!playerName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      console.log('creating game', {
        playerName,
        playerColor,
        boardSize: gameState.boardSize,
      })
      const response = await fetch('/api/game/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName,
          playerColor,
          boardSize: gameState.boardSize,
        }),
      })

      const data = await response.json()
      console.log('joinGame response', data)
      console.log('createGame response', data)
      
      if (data.success) {
        setGameState({
          board: initializeBoard(gameState.boardSize),
          currentPlayer: data.game.currentPlayer,
          players: data.game.players,
          winner: null,
          isDraw: false,
          boardSize: gameState.boardSize,
          gameId: data.game.id,
        })
        setIsConfiguring(false)
        
        // Update URL with game ID
        const url = new URL(window.location.href)
        url.searchParams.set('game', data.game.id)
        window.history.pushState({}, '', url)
        
        toast({
          title: "Game Created!",
          description: "Share the link with your friend to play together",
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create game",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('createGame error', error)
      toast({
        title: "Error",
        description: "Failed to create game",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const joinGame = async () => {
    if (!playerName.trim() || !gameIdInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name and game ID",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      console.log('joining game', {
        playerName,
        playerColor,
        gameId: gameIdInput,
      })
      const response = await fetch('/api/game/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName,
          playerColor,
          gameId: gameIdInput,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setGameState({
          board: data.game.board,
          currentPlayer: data.game.currentPlayer,
          players: data.game.players,
          winner: data.game.winner,
          isDraw: data.game.isDraw,
          boardSize: data.game.boardSize,
          gameId: data.game.id,
        })
        setIsConfiguring(false)
        setIsJoining(false)
        
        toast({
          title: "Game Joined!",
          description: "You're now playing against " + data.game.players[0].name,
        })
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to join game",
          variant: "destructive",
        })
      }
  } catch (error) {
    console.error('joinGame error', error)
    toast({
      title: "Error",
      description: "Failed to join game",
      variant: "destructive",
    })
    } finally {
      setIsLoading(false)
    }
  }

  const makeMove = async (col: number) => {
    if (gameState.winner || gameState.isDraw || !gameState.gameId || !socket) return

    const currentPlayerObj = gameState.players.find(p => p.id === gameState.currentPlayer)
    if (!currentPlayerObj) return

    // Find the first empty row in the column
    const newBoard = [...gameState.board]
    let row = -1
    for (let r = gameState.boardSize - 1; r >= 0; r--) {
      if (newBoard[r][col] === '') {
        row = r
        break
      }
    }

    if (row === -1) return // Column is full

    // Send move via WebSocket
    console.log('sending move', { row, col })
    socket.send(JSON.stringify({
      type: 'make-move',
      gameId: gameState.gameId,
      playerId: currentPlayerObj.id,
      row,
      col,
    }))
  }

  const shareGame = () => {
    if (!gameState.gameId) return

    const url = `${window.location.origin}?game=${gameState.gameId}`
    console.log('share link copied', url)
    navigator.clipboard.writeText(url)
    toast({
      title: "Link Copied!",
      description: "Share this link with your friend",
    })
  }

  const resetGame = () => {
    console.log('resetting game')
    setIsConfiguring(true)
    setIsJoining(false)
    setGameState({
      board: [],
      currentPlayer: '',
      players: [],
      winner: null,
      isDraw: false,
      boardSize: 7,
      gameId: null,
    })
    
    // Remove game ID from URL
    const url = new URL(window.location.href)
    url.searchParams.delete('game')
    window.history.pushState({}, '', url)
  }

  const getPlayerColor = (playerId: string) => {
    const player = gameState.players.find(p => p.id === playerId)
    return player ? player.color : '#gray'
  }

  const getPlayerName = (playerId: string) => {
    const player = gameState.players.find(p => p.id === playerId)
    return player ? player.name : 'Unknown'
  }

  if (isConfiguring) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Connect 4
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="playerName">Your Name</Label>
              <Input
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="playerColor">Your Color</Label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 ${
                      playerColor === color ? 'border-black' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setPlayerColor(color)}
                  />
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="boardSize">Board Size</Label>
              <Select
                value={gameState.boardSize.toString()}
                onValueChange={(value) => setGameState(prev => ({ ...prev, boardSize: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 6, 7, 8, 9, 10].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}x{size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={createGame}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Creating...' : 'Create Game'}
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1">
                    Join Game
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Join Existing Game</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="gameId">Game ID</Label>
                      <Input
                        id="gameId"
                        value={gameIdInput}
                        onChange={(e) => setGameIdInput(e.target.value)}
                        placeholder="Enter game ID"
                      />
                    </div>
                    <Button
                      onClick={joinGame}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? 'Joining...' : 'Join Game'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Connect 4
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-500">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={shareGame}
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetGame}
              >
                New Game
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Game Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {gameState.players.map((player) => (
                  <Badge
                    key={player.id}
                    variant={gameState.currentPlayer === player.id ? "default" : "secondary"}
                    className="flex items-center gap-2"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: player.color }}
                    />
                    {player.name}
                  </Badge>
                ))}
              </div>
              
              {gameState.winner && (
                <Badge variant="destructive" className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getPlayerColor(gameState.winner) }}
                  />
                  {getPlayerName(gameState.winner)} Wins!
                </Badge>
              )}
              
              {gameState.isDraw && (
                <Badge variant="secondary">It's a Draw!</Badge>
              )}
            </div>

            {/* Game Board */}
            <div className="flex justify-center">
              <div className="inline-block bg-blue-500 p-4 rounded-lg">
                {gameState.board.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex">
                    {row.map((cell, colIndex) => (
                      <button
                        key={colIndex}
                        className="w-12 h-12 bg-white border-2 border-gray-300 rounded-full m-1 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => makeMove(colIndex)}
                        disabled={!!gameState.winner || gameState.isDraw}
                      >
                        {cell && (
                          <div
                            className="w-10 h-10 rounded-full"
                            style={{ backgroundColor: getPlayerColor(cell) }}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Game Status */}
            <div className="text-center">
              {gameState.winner || gameState.isDraw ? (
                <div className="space-y-2">
                  <p className="text-lg font-semibold">
                    {gameState.winner
                      ? `${getPlayerName(gameState.winner)} wins!`
                      : "It's a draw!"}
                  </p>
                  <Button onClick={resetGame}>Play Again</Button>
                </div>
              ) : (
                <p className="text-lg">
                  Current turn: <span className="font-semibold">{getPlayerName(gameState.currentPlayer)}</span>
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}