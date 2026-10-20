import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateItineraries } from '../src/client/utils/itineraryAlgorithm.ts';

describe('Itinerary Algorithm & Recommendations', () => {
  it('returns empty array when 0 responses exist', () => {
    const proposals = generateItineraries([]);
    assert.deepEqual(proposals, []);
  });

  it('marks sample size warning when response count is less than 3', () => {
    const mockResponses: any[] = [
      {
        id: '1',
        name: 'Alice',
        intent: '一定參加',
        days: '7 天',
        style: '都市繁華',
        transport: '大眾運輸為主',
        driver: 0,
        regions: ['東京及近郊'],
        notes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const proposals = generateItineraries(mockResponses);
    assert.equal(proposals.length, 3);
    assert.equal(proposals[0].sampleSize, 1);
    assert.equal(proposals[0].isStable, false);
    assert.ok(proposals[0].warnings?.some(w => w.includes('樣本數較少')));
  });

  it('generates Proposal A based on top region and top days', () => {
    const mockResponses: any[] = [
      {
        id: '1',
        name: 'A',
        intent: '一定參加',
        days: '7 天',
        style: '都市繁華',
        transport: '大眾運輸為主',
        driver: 0,
        regions: ['京阪神'],
        notes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        name: 'B',
        intent: '一定參加',
        days: '7 天',
        style: '都市繁華',
        transport: '大眾運輸為主',
        driver: 0,
        regions: ['京阪神', '東京及近郊'],
        notes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        name: 'C',
        intent: '一定參加',
        days: '7 天',
        style: '慢生活風景',
        transport: '大眾運輸為主',
        driver: 0,
        regions: ['京阪神'],
        notes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const proposals = generateItineraries(mockResponses);
    const propA = proposals.find(p => p.id === 'A')!;
    assert.equal(propA.region, '京阪神');
    assert.equal(propA.days, '7 天');
    assert.equal(propA.style, '都市繁華');
    assert.equal(propA.badge, '最高共識推薦');
  });

  it('checks driver volunteer feasibility in Proposal B', () => {
    const mockWithSingleDriver: any[] = [
      {
        id: '1',
        name: 'A',
        intent: '一定參加',
        days: '7 天',
        style: '慢生活風景',
        transport: '租車自駕',
        driver: 1, // Only 1 driver
        regions: ['北海道'],
        notes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        name: 'B',
        intent: '一定參加',
        days: '7 天',
        style: '慢生活風景',
        transport: '租車自駕',
        driver: 0,
        regions: ['北海道'],
        notes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        name: 'C',
        intent: '一定參加',
        days: '7 天',
        style: '慢生活風景',
        transport: '租車自駕',
        driver: 0,
        regions: ['北海道'],
        notes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const proposals = generateItineraries(mockWithSingleDriver);
    const propB = proposals.find(p => p.id === 'B')!;
    assert.equal(propB.transport, '租車自駕');
  });
});
