export interface SurveyResponse {
  id: string;
  name: string;
  intent: '一定參加' | '高機率參加' | '觀望中';
  days: '5 天' | '7 天' | '9 天';
  style: '都市繁華' | '慢生活風景' | '城鄉各半';
  transport: '大眾運輸為主' | '租車自駕';
  driver: number; // 0 or 1
  regions: string[]; // Parsed from JSON string in DB
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface SurveySubmission {
  name: string;
  intent: '一定參加' | '高機率參加' | '觀望中';
  days: '5 天' | '7 天' | '9 天';
  style: '都市繁華' | '慢生活風景' | '城鄉各半';
  transport: '大眾運輸為主' | '租車自駕';
  driver: boolean;
  regions: string[];
  notes?: string;
}

export interface SurveyStats {
  totalCount: number;
  totalRegionVotes: number;
  regionVotes: Record<string, number>;
  daysVotes: Record<string, number>;
  styleVotes: Record<string, number>;
  transportVotes: {
    publicTransport: number;
    rentalCar: number;
    willingDrivers: number;
  };
  intentVotes: Record<string, number>;
}

export interface WebSocketMessage {
  type: 'INIT' | 'NEW_RESPONSE' | 'UPDATE_RESPONSE' | 'DELETE_RESPONSE' | 'STATS_UPDATE' | 'PING' | 'PONG';
  payload?: any;
}

export interface Env {
  DB: D1Database;
  SURVEY_ROOM: DurableObjectNamespace;
  ASSETS?: Fetcher;
  ENVIRONMENT?: string;
  ADMIN_PASSWORD_HASH?: string;
}
