export interface SurveyResponse {
  id: string;
  name: string;
  intent: '一定參加' | '高機率參加' | '觀望中';
  days: '5 天' | '7 天' | '9 天';
  style: '都市繁華' | '慢生活風景' | '城鄉各半';
  transport: '大眾運輸為主' | '租車自駕';
  driver: number;
  regions: string[];
  notes: string;
  created_at: string;
  updated_at: string;
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

export interface BudgetBreakdown {
  flight: string;
  lodging: string;
  transport: string;
  food: string;
  activities: string;
  totalRange: string;
  assumptions: string;
}

export interface ItineraryProposal {
  id: 'A' | 'B' | 'C';
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: 'emerald' | 'amber' | 'blue';
  region: string;
  days: string;
  style: string;
  transport: string;
  budget: BudgetBreakdown;
  routeHighlights: string[];
  reason: string;
  sampleSize: number;
  isStable: boolean;
  isAlternative: boolean;
  warnings?: string[];
}

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected' | 'connecting';
