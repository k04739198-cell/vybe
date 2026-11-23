export type InterestTag = 'all' | 'chat' | 'flirt' | '18+' | 'music' | 'gaming' | 'desi';

export type ConnectionStatus =
  | 'idle'
  | 'requesting-permission'
  | 'permission-denied'
  | 'waiting-in-queue'
  | 'connecting'
  | 'connected'
  | 'preview'
  | 'skipped'
  | 'disconnected';

export interface ChatMessage {
  id: string;
  sender: 'me' | 'stranger';
  text: string;
  timestamp: number;
}

export interface StreamClip {
  id: string;
  title: string;
  videoUrl: string;
  durationMs: number;
}

export type ReportReason =
  | 'csam_underage'
  | 'harassment_bullying'
  | 'unwanted_nudity'
  | 'spam_bot'
  | 'violence_threats';
