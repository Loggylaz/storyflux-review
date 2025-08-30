export type Lang = 'fr' | 'en';

export type WsClientAction = {
  userId: string;
  action: string;
  timestamp: number;
};

export type WsServerEvents =
  | { type: 'waiting'; missing: string[] }
  | { type: 'orderRequest'; players: string[] }
  | { type: 'roundResolved'; summary: string };
