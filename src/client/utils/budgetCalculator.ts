import { BudgetBreakdown } from '../types';

interface BudgetParams {
  region: string;
  days: string;
  style: string;
  transport: string;
}

export function calculateBudget(params: BudgetParams): BudgetBreakdown {
  const { region, days, style, transport } = params;
  const numDays = days.includes('9') ? 9 : days.includes('7') ? 7 : 5;
  const numNights = numDays - 1;

  // Base airfare (TPE/TSA -> Japan roundtrip economy estimate)
  let flightMin = 12000;
  let flightMax = 18000;
  if (region === '北海道' || region === '青森東北') {
    flightMin += 3000;
    flightMax += 4500;
  } else if (region === '福岡九州' || region === '四國瀨戶內') {
    flightMin -= 1000;
    flightMax -= 1000;
  }

  // Lodging per night per person (assuming 2-person twin sharing clean business/city hotel or ryokan)
  let hotelPerNightMin = 1800;
  let hotelPerNightMax = 3200;
  if (style === '慢生活風景') {
    // includes 1-2 nights onsen ryokan with kaiseki dinner
    hotelPerNightMin += 600;
    hotelPerNightMax += 1200;
  }

  const lodgingMin = hotelPerNightMin * numNights;
  const lodgingMax = hotelPerNightMax * numNights;

  // Transport per person
  let transportMin = 2500;
  let transportMax = 5000;
  if (transport === '租車自駕') {
    // 4-5 persons per car, rental + full insurance + ETC highway tolls + petrol
    transportMin = Math.round((2800 * numDays) / 4);
    transportMax = Math.round((4200 * numDays) / 4);
  } else {
    // JR pass / Subway / Shinkansen tickets
    if (numDays === 9) {
      transportMin = 5000;
      transportMax = 8500;
    } else if (numDays === 7) {
      transportMin = 4000;
      transportMax = 6500;
    }
  }

  // Daily food & dining per person
  let foodDailyMin = 1200;
  let foodDailyMax = 2200;
  if (style === '都市繁華') {
    foodDailyMin += 300;
    foodDailyMax += 600;
  }

  const foodMin = foodDailyMin * numDays;
  const foodMax = foodDailyMax * numDays;

  // Activities & Admission fees
  let actMin = 1500;
  let actMax = 3500;
  if (numDays === 9) {
    actMin += 1000;
    actMax += 2000;
  }

  const grandTotalMin = flightMin + lodgingMin + transportMin + foodMin + actMin;
  const grandTotalMax = flightMax + lodgingMax + transportMax + foodMax + actMax;

  return {
    flight: `NT$ ${flightMin.toLocaleString()} ~ ${flightMax.toLocaleString()}`,
    lodging: `NT$ ${lodgingMin.toLocaleString()} ~ ${lodgingMax.toLocaleString()} (${numNights} 晚雙人房均分)`,
    transport: `NT$ ${transportMin.toLocaleString()} ~ ${transportMax.toLocaleString()} (${transport})`,
    food: `NT$ ${foodMin.toLocaleString()} ~ ${foodMax.toLocaleString()} (含每日正餐及咖啡點心)`,
    activities: `NT$ ${actMin.toLocaleString()} ~ ${actMax.toLocaleString()} (景點門票／保險／Wi-Fi)`,
    totalRange: `NT$ ${grandTotalMin.toLocaleString()} ~ ${grandTotalMax.toLocaleString()}`,
    assumptions: `估算基準：${numDays} 天 ${numNights} 夜、台北直飛來回機票、一般平假日經濟艙及舒適連鎖商務飯店／溫泉旅宿雙人房。未含個人自由血拼購物，實際費用依出發日期訂購為準。`
  };
}
