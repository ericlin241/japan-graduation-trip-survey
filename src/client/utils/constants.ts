export const REGIONS = [
  '東京及近郊',
  '京阪神',
  '北海道',
  '福岡九州',
  '青森東北',
  '四國瀨戶內'
] as const;

export const INTENTS = [
  { label: '一定參加', desc: '時間預算都 OK，衝就對了！' },
  { label: '高機率參加', desc: '等具體日期與預算確認' },
  { label: '觀望中', desc: '先看大家討論與行程安排' }
] as const;

export const DAYS_OPTIONS = ['5 天', '7 天', '9 天'] as const;

export const STYLES = [
  { label: '都市繁華', desc: '逛街、購物、米其林美食、潮流熱點' },
  { label: '慢生活風景', desc: '自然風景、溫泉放鬆、在地漫步、古蹟神社' },
  { label: '城鄉各半', desc: '兼顧市區採購與郊外自然秘境' }
] as const;

export const TRANSPORTS = [
  { label: '大眾運輸為主', desc: '新幹線、地鐵、JR PASS，輕鬆準時' },
  { label: '租車自駕', desc: '行程自由、深入鄉間景點、行李直載' }
] as const;

export const PALETTE = {
  primary: '#68745D',
  secondary: '#B87956',
  accent: '#4A6B82',
  yellow: '#D99B38',
  purple: '#7E6B8F',
  teal: '#4C8C80',
  ink: '#292824',
  muted: '#77746C',
  border: '#E7E2D8',
  bg: '#F6F4EF',
  card: '#FFFEFA'
};
