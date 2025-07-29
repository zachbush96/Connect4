import type { NextApiRequest, NextApiResponse } from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { setupSocket } from '@/lib/socket'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(res.socket as any).server.io) {
    console.log('Initializing Socket.io server...')
    const io = new SocketIOServer((res.socket as any).server, {
      path: '/api/socketio',
    })
    setupSocket(io)
    ;(res.socket as any).server.io = io
  }
  res.end()
}
