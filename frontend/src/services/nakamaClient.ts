import { Client, Session } from '@heroiclabs/nakama-js';
import type { Socket, Match } from '@heroiclabs/nakama-js';

export const SERVER_KEY = import.meta.env.VITE_NAKAMA_SERVER_KEY || "defaultkey";
const HOST = import.meta.env.VITE_NAKAMA_HOST || "127.0.0.1";
const PORT = import.meta.env.VITE_NAKAMA_PORT || "7350";
const USE_SSL = import.meta.env.VITE_NAKAMA_USE_SSL === "true";

export const client = new Client(SERVER_KEY, HOST, PORT, USE_SSL);

export let session: Session | null = null;
export let socket: Socket | null = null;

export const authenticate = async (deviceId: string, username?: string) => {
  session = await client.authenticateDevice(deviceId, true, username);
  localStorage.setItem('nakama_session', session.token);
  
  socket = client.createSocket(USE_SSL, false);
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
