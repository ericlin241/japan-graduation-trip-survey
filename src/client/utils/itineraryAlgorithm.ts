import { SurveyResponse, ItineraryProposal } from '../types';
import { REGIONS, DAYS_OPTIONS } from './constants';

export function generateItineraries(responses: SurveyResponse[]): ItineraryProposal[] {
  if (!responses || responses.length === 0) {
    return [];
  }

  const sampleSize = responses.length;

  // 1. Tally votes with deterministic tie-breaking
  const regionCounts = new Map<string, number>();
  for (const reg of REGIONS) {
    regionCounts.set(reg, 0);
  }

  const daysCounts = new Map<string, number>();
  for (const d of DAYS_OPTIONS) {
    daysCounts.set(d, 0);
  }

  const styleCounts = {
    '都市繁華': 0,
    '慢生活風景': 0,
    '城鄉各半': 0
  };

  const intentCounts = {
    '一定參加': 0,
    '高機率參加': 0,
    '觀望中': 0
  };

  let publicTransportCount = 0;
  let rentalCarCount = 0;
  let driverVolunteersCount = 0;

  for (const r of responses) {
    // Regions
    if (Array.isArray(r.regions)) {
      for (const reg of r.regions) {
        if (regionCounts.has(reg)) {
          regionCounts.set(reg, (regionCounts.get(reg) || 0) + 1);
        }
      }
    }
    // Days
    if (daysCounts.has(r.days)) {
      daysCounts.set(r.days, (daysCounts.get(r.days) || 0) + 1);
    }
    // Style
    if (r.style in styleCounts) {
      styleCounts[r.style as keyof typeof styleCounts]++;
    }
    // Intent
    if (r.intent in intentCounts) {
      intentCounts[r.intent as keyof typeof intentCounts]++;
    }
    // Transport
    if (r.transport === '大眾運輸為主') {
      publicTransportCount++;
    } else if (r.transport === '租車自駕') {
      rentalCarCount++;
    }
    // Driver
    if (r.driver === 1) {
      driverVolunteersCount++;
    }
  }

  // Rank regions (sort descending, tie-break by REGIONS index order)
  const sortedRegions = [...REGIONS].sort((a, b) => {
    const diff = (regionCounts.get(b) || 0) - (regionCounts.get(a) || 0);
    if (diff !== 0) return diff;
    return REGIONS.indexOf(a) - REGIONS.indexOf(b);
  });

  // Rank days (sort descending, tie-break: 7 天 -> 5 天 -> 9 天)
  const daysPriorityOrder = ['7 天', '5 天', '9 天'];
  const sortedDays = [...DAYS_OPTIONS].sort((a, b) => {
    const diff = (daysCounts.get(b) || 0) - (daysCounts.get(a) || 0);
    if (diff !== 0) return diff;
    return daysPriorityOrder.indexOf(a) - daysPriorityOrder.indexOf(b);
  });

  const topRegion = sortedRegions[0];
  const secondRegion = sortedRegions[1] || sortedRegions[0];
  const topDays = sortedDays[0];

  // Stability checks
  const isSampleSmall = sampleSize < 3;
  const isHighWatchRatio = (intentCounts['觀望中'] / sampleSize) >= 0.5;
  const isStable = !isSampleSmall && !isHighWatchRatio;

  const baseWarnings: string[] = [];
  if (isSampleSmall) {
    baseWarnings.push(`目前填答樣本數較少（僅 ${sampleSize} 筆），建議待更多成員填答後再行定案。`);
  }
  if (isHighWatchRatio) {
    baseWarnings.push(`目前「觀望中」比例偏高（${Math.round((intentCounts['觀望中'] / sampleSize) * 100)}%），成團人數尚不穩定。`);
  }

  // --- Proposal A: 呼聲最高經典案 ---
  // Style: highest between 都市繁華, 慢生活風景, 城鄉各半
  const availableStyles: ('都市繁華' | '慢生活風景' | '城鄉各半')[] = ['都市繁華', '慢生活風景', '城鄉各半'];
  const topStyle = [...availableStyles].sort((a, b) => {
    return styleCounts[b] - styleCounts[a];
  })[0];

  const proposalATransport = rentalCarCount > publicTransportCount && driverVolunteersCount >= 2
    ? '租車自駕'
    : '大眾運輸為主';

  const proposalA: ItineraryProposal = {
    id: 'A',
    title: '呼聲最高經典案',
    subtitle: `全團共識之選・${topRegion} ${topDays}`,
    badge: '最高共識推薦',
    badgeColor: 'emerald',
    region: topRegion,
    days: topDays,
    style: topStyle,
    transport: proposalATransport,
    routeHighlights: getRouteHighlights(topRegion, topStyle, topDays),
    reason: `依據目前統計，${topRegion} 獲得全體最高票（${regionCounts.get(topRegion) || 0} 票），多數同學偏好 ${topDays} 行程。交通以「${proposalATransport}」銜接最為平順。`,
    sampleSize,
    isStable,
    isAlternative: false,
    warnings: [...baseWarnings]
  };

  // --- Proposal B: 自然慢活探索案 ---
  // Focus on nature & scenic spots.
  // Pick region suitable for nature (e.g. Hokkaido, Kyushu, Tohoku, Shikoku, or Tokyo/Kansai suburbs)
  const naturePreferredRegion = sortedRegions.find(r => r === '北海道' || r === '福岡九州' || r === '青森東北' || r === '四國瀨戶內') || topRegion;
  const hasStrongNatureVote = styleCounts['慢生活風景'] >= styleCounts['都市繁華'];

  // Check self-driving safety feasibility
  let proposalBTransport = '大眾運輸為主';
  const proposalBWarnings = [...baseWarnings];
  if (rentalCarCount > 0) {
    if (driverVolunteersCount >= 2) {
      proposalBTransport = '租車自駕';
      proposalBWarnings.push(`自駕提醒：目前共有 ${driverVolunteersCount} 位同學志願換手開車。`);
    } else if (driverVolunteersCount === 1) {
      proposalBTransport = '租車自駕';
    } else {
      proposalBTransport = '大眾運輸為主';
    }
  }

  const proposalBDays = topDays === '5 天' ? '7 天' : topDays; // Nature needs enough pacing

  const proposalB: ItineraryProposal = {
    id: 'B',
    title: '自然慢活探索案',
    subtitle: `溫泉秘境與風土漫步・${naturePreferredRegion} ${proposalBDays}`,
    badge: hasStrongNatureVote ? '自然偏好精選' : '替代探索方案',
    badgeColor: hasStrongNatureVote ? 'emerald' : 'amber',
    region: naturePreferredRegion,
    days: proposalBDays,
    style: '慢生活風景',
    transport: proposalBTransport,
    routeHighlights: getRouteHighlights(naturePreferredRegion, '慢生活風景', proposalBDays),
    reason: hasStrongNatureVote
      ? `回應同學對自然風景與溫泉放鬆的渴望（共 ${styleCounts['慢生活風景']} 票），特別規劃低步調、深度體驗的風土路線。`
      : `為兼顧喜歡遠離都會塵囂的同學所擬定的探索型備案，前往 ${naturePreferredRegion} 享受開闊大景與在地泉湯。`,
    sampleSize,
    isStable,
    isAlternative: !hasStrongNatureVote,
    warnings: proposalBWarnings
  };

  // --- Proposal C: 城鄉折衷案 ---
  // Balancing shopping/city with nature/suburbs
  const proposalCRegion = (topRegion !== secondRegion && (regionCounts.get(secondRegion) || 0) > 0)
    ? secondRegion
    : (topRegion === '東京及近郊' ? '京阪神' : '東京及近郊');

  const proposalC: ItineraryProposal = {
    id: 'C',
    title: '城鄉折衷案',
    subtitle: `都會繁華兼得近郊大景・${proposalCRegion} 7 天`,
    badge: '雙重體驗平衡案',
    badgeColor: 'blue',
    region: proposalCRegion,
    days: '7 天',
    style: '城鄉各半',
    transport: '大眾運輸為主',
    routeHighlights: getRouteHighlights(proposalCRegion, '城鄉各半', '7 天'),
    reason: `融合「都市購物美食」與「近郊自然歷史」，前半段打卡流行商圈、後半段漫遊湖光山色，滿足全體團員多元願望的最佳平衡解。`,
    sampleSize,
    isStable,
    isAlternative: false,
    warnings: [...baseWarnings]
  };

  return [proposalA, proposalB, proposalC];
}

function getRouteHighlights(region: string, style: string, days: string): string[] {
  const isLong = days === '9 天';

  if (region === '東京及近郊') {
    if (style === '慢生活風景') {
      return [
        'Day 1-2：抵達東京市郊，鎌倉小町通與江之島湘南海景散策',
        'Day 3-4：箱根蘆之湖海賊船巡禮、露天溫泉旅館會席料理',
        'Day 5-6：河口湖富士山倒影全景、大石公園與新倉山淺間神社',
        isLong ? 'Day 7-9：輕井澤雲場池單車漫遊、舊輕井澤銀座通文青手作' : '最終日：東京伴手禮採購、成田羽田搭機返台'
      ];
    }
    if (style === '都市繁華') {
      return [
        'Day 1-2：澀谷 SHIBUYA SKY 全景俯瞰、原宿表參道潮流名店',
        'Day 3-4：新宿都會夜景、銀座米其林美饌、秋葉原動漫電器巡禮',
        'Day 5-6：台場鋼彈海濱公園、下北澤古著咖啡店探訪',
        isLong ? 'Day 7-9：東京迪士尼樂園全日遊或橫濱紅磚倉庫漫步' : '最終日：晴空塔觀景採購、品嚐道地居酒屋後返台'
      ];
    }
    // 城鄉各半
    return [
      'Day 1-2：東京精華商圈（澀谷、新宿、淺草寺雷門）巡禮',
      'Day 3-4：鎌倉江之電海邊列車＋江之島夕陽慢步',
      'Day 5-6：河口湖眺望富士山、富士急樂園或溫泉旅館一宿',
      isLong ? 'Day 7-9：六本木之丘藝術特展、築地場外市場海鮮饗宴' : '最終日：成田機場最後伴手禮採購、平安返國'
    ];
  }

  if (region === '京阪神') {
    if (style === '慢生活風景') {
      return [
        'Day 1-2：京都嵐山竹林之道、天龍寺庭園、嵯峨野觀光小火車',
        'Day 3-4：清水寺三年坂二年坂、祇園花見小路與宇治正統抹茶散策',
        'Day 5-6：奈良公園與若草山小鹿互動、東大寺大佛殿',
        isLong ? 'Day 7-9：貴船神社水床料理或琵琶湖白鬚神社湖中鳥居' : '最終日：京都錦市場尋味、關西機場搭機返台'
      ];
    }
    if (style === '都市繁華') {
      return [
        'Day 1-2：大阪心齋橋、道頓堀道地章魚燒與大阪燒美食馬拉松',
        'Day 3-4：日本環球影城（USJ）任天堂超級世界全日暢遊',
        'Day 5-6：神戶港摩天輪夜景、品嚐正宗頂級神戶牛排',
        isLong ? 'Day 7-9：梅田商圈阪急百貨採購、通天閣新世界老街風情' : '最終日：臨空城 Outlets 購物、直奔關西機場'
      ];
    }
    // 城鄉各半
    return [
      'Day 1-2：大阪繁華商圈購物與美食探店（梅田、難波）',
      'Day 3-4：前進千年古都京都（伏見稻荷千本鳥居、嵐山渡月橋）',
      'Day 5-6：奈良小鹿互動＋神戶海景咖啡廳賞日落',
      isLong ? 'Day 7-9：京都金閣寺古剎巡訪、大阪環球影城刺激玩耍' : '最終日：關西最後巡禮、採買特產滿載返台'
    ];
  }

  if (region === '北海道') {
    return [
      'Day 1-2：抵達新千歲機場，札幌狸小路與薄野拉麵橫丁熱鬧品嚐',
      'Day 3-4：小樽浪漫運河散策、手作玻璃工房與六花亭甜點',
      'Day 5-6：富良野花田、美瑛青池夢幻白樺林、旭山動物園企鵝散步',
      isLong ? 'Day 7-9：洞爺湖或登別地獄谷三大名湯溫泉放鬆之旅' : '最終日：新千歲機場甜點名產一網打盡返台'
    ];
  }

  if (region === '福岡九州') {
    return [
      'Day 1-2：抵達福岡，天神地下街潮流購物、中洲屋台體驗在地夜市',
      'Day 3-4：由布院金鱗湖童話小鎮、別府海地獄足湯溫泉巡禮',
      'Day 5-6：熊本城天守閣登頂巡禮、阿蘇火山草千里草原騎馬',
      isLong ? 'Day 7-9：太宰府天滿宮求學業御守、長崎稻佐山世界三大夜景' : '最終日：博多拉麵一碗入魂、福岡機場輕鬆登機'
    ];
  }

  if (region === '青森東北') {
    return [
      'Day 1-2：抵達仙台市區，品嚐炭烤厚切牛舌定食、青葉通散策',
      'Day 3-4：前往松島海岸搭船遊覽日本三景、銀山溫泉大正浪漫街景',
      'Day 5-6：奧入瀨溪流森林步道健行、十和田湖畔露天溫泉旅館',
      isLong ? 'Day 7-9：弘前城公園、青森睡魔之家傳統文化震撼體驗' : '最終日：仙台車站採買毛豆麻糬等特產、搭機返台'
    ];
  }

  // 四國瀨戶內
  return [
    'Day 1-2：抵達高松市區，栗林公園名勝庭園、品嚐烏龍麵發源地風味',
    'Day 3-4：前進瀨戶內小豆島橄欖公園、直島草間彌生紅黃南瓜藝術朝聖',
    'Day 5-6：岡山倉敷美觀地區白壁老街划船、琴平金刀比羅宮祈願步道',
    isLong ? 'Day 7-9：父母之濱天空之鏡拍攝絕美夕陽、道後溫泉本館湯治體驗' : '最終日：高松商店街最後採買、充實返台'
  ];
}
