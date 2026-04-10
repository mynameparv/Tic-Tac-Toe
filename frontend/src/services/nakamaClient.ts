import { Client, Session } from '@heroiclabs/nakama-js';
import type { Socket, Match } from '@heroiclabs/nakama-js';

const USE_SSL = false;
export const client = new Client("defaultkey", "127.0.0.1", "7350", USE_SSL);

export let session: Session | null = null;
export let socket: Socket | null = null;

export const authenticate = async (deviceId: string) => {
  session = await client.authenticateDevice(deviceId, true);
  
  socket = client.createSocket(USE_SSL);
  await socket.connect(session, true);

  return session;
};

export const findOrCreateMatch = async (): Promise<Match> => {
  if (!socket || !session) throw new Error("Socket or session not initialized");
  
  const rpcResult = await client.rpc(session, "rpcFindMatch", {});
  const data = typeof rpcResult.payload === 'string' ? JSON.parse(rpcResult.payload) : (rpcResult.payload || {});
  const matchId = data.matchId;

  const match = await socket.joinMatch(matchId);
  return match;
};
