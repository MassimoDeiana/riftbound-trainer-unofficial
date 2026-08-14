import { joinRoom, selfId, type Room } from 'trystero'

/**
 * P2P game room over WebRTC (Trystero, Nostr strategy). No server: peers find
 * each other through public relays using appId + room code.
 */
export const APP_ID = 'riftbound-table-v2'

export { selfId }

export interface GameRoom {
  room: Room
  code: string
  /** Broadcast a game action to the other peer(s). */
  sendAction: (action: unknown) => void
  onAction: (cb: (action: unknown, peerId: string) => void) => void
  /** Full-state sync for the game start / recovery. */
  sendSync: (state: unknown, to?: string) => void
  onSync: (cb: (state: unknown, peerId: string) => void) => void
  onPeerJoin: (cb: (peerId: string) => void) => void
  onPeerLeave: (cb: (peerId: string) => void) => void
  leave: () => void
}

export function makeRoomCode(): string {
  // Unambiguous alphabet (no 0/O/1/I)
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  for (const b of bytes) code += alphabet[b % alphabet.length]
  return code
}

export function joinGameRoom(code: string): GameRoom {
  const room = joinRoom({ appId: APP_ID }, code.toUpperCase())
  const actionChannel = room.makeAction('action')
  const syncChannel = room.makeAction('sync')

  return {
    room,
    code: code.toUpperCase(),
    sendAction: (a) => {
      void actionChannel.send(a as never)
    },
    onAction: (cb) => {
      actionChannel.onMessage = (data, ctx) => cb(data, ctx.peerId)
    },
    sendSync: (s, to) => {
      void syncChannel.send(s as never, to ? { target: to } : undefined)
    },
    onSync: (cb) => {
      syncChannel.onMessage = (data, ctx) => cb(data, ctx.peerId)
    },
    onPeerJoin: (cb) => {
      room.onPeerJoin = cb
    },
    onPeerLeave: (cb) => {
      room.onPeerLeave = cb
    },
    leave: () => void room.leave(),
  }
}
