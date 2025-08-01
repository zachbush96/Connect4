"use client"

import { useEffect, useState } from 'react'
import type { Socket } from 'socket.io-client'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'

interface ChatProps {
  socket: Socket | null
  gameId: string | null
  playerId: string | null
  className?: string
}

interface ChatMessage {
  senderName: string
  text: string
  timestamp: string
}

const PREDEFINED_MESSAGES = [
  'Good luck!',
  'Nice move!',
  'Well played!',
  'Oops!',
  'Good game!',
]

export function Chat({ socket, gameId, playerId, className }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])

  useEffect(() => {
    if (!gameId) return
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/game/chat?gameId=${gameId}`)
        const data = await res.json()
        if (data.success) {
          setMessages(data.messages as ChatMessage[])
        }
      } catch (err) {
        console.error('fetch chat messages error', err)
      }
    }
    fetchMessages()
  }, [gameId])

  useEffect(() => {
    if (!socket) return
    const handler = (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg])
    }
    socket.on('chat-message', handler)
    return () => {
      socket.off('chat-message', handler)
    }
  }, [socket])

  const sendMessage = (text: string) => {
    if (!socket || !gameId || !playerId) return
    socket.emit('chat-message', { gameId, playerId, text })
  }

  return (
    <Card className={cn('w-full max-w-xs flex flex-col', className)}>
      <CardHeader>
        <CardTitle>Chat</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-1">
          {messages.map((msg, idx) => (
            <div key={idx} className="text-xs">
              {new Date(msg.timestamp).toLocaleTimeString()} - {msg.senderName} : {msg.text}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {PREDEFINED_MESSAGES.map((m, idx) => (
            <Button key={idx} variant="outline" size="sm" onClick={() => sendMessage(m)}>
              {m}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
