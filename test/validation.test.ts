import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateSubmission, computeSurveyStats } from '../src/worker/db/queries.ts';

describe('Submission Validation', () => {
  const validPayload = {
    name: '林小明',
    intent: '一定參加',
    days: '7 天',
    style: '城鄉各半',
    transport: '大眾運輸為主',
    driver: false,
    regions: ['東京及近郊', '京阪神'],
    notes: '希望可以去河口湖'
  };

  it('accepts valid submission', () => {
    const result = validateSubmission(validPayload);
    assert.equal(result.valid, true);
    assert.equal(result.cleanData?.name, '林小明');
    assert.equal(result.cleanData?.driver, false);
    assert.deepEqual(result.cleanData?.regions, ['東京及近郊', '京阪神']);
  });

  it('trims whitespace and rejects blank names', () => {
    const res1 = validateSubmission({ ...validPayload, name: '   ' });
    assert.equal(res1.valid, false);
    assert.match(res1.error || '', /姓名不能為空白/);

    const res2 = validateSubmission({ ...validPayload, name: '  張三  ' });
    assert.equal(res2.valid, true);
    assert.equal(res2.cleanData?.name, '張三');
  });

  it('rejects name exceeding 40 characters', () => {
    const longName = 'a'.repeat(41);
    const res = validateSubmission({ ...validPayload, name: longName });
    assert.equal(res.valid, false);
    assert.match(res.error || '', /姓名長度最多 40 字/);
  });

  it('rejects invalid intent, days, style, or transport', () => {
    assert.equal(validateSubmission({ ...validPayload, intent: '隨便啦' }).valid, false);
    assert.equal(validateSubmission({ ...validPayload, days: '3 天' }).valid, false);
    assert.equal(validateSubmission({ ...validPayload, style: '極限運動' }).valid, false);
    assert.equal(validateSubmission({ ...validPayload, transport: '搭直升機' }).valid, false);
  });

  it('strictly enforces max 3 regions and valid region options', () => {
    // 0 regions
    assert.equal(validateSubmission({ ...validPayload, regions: [] }).valid, false);

    // 4 regions
    const res4 = validateSubmission({
      ...validPayload,
      regions: ['東京及近郊', '京阪神', '北海道', '福岡九州']
    });
    assert.equal(res4.valid, false);
    assert.match(res4.error || '', /最多只能選擇三個/);

    // Invalid region name
    const resInvalid = validateSubmission({
      ...validPayload,
      regions: ['沖繩美國村']
    });
    assert.equal(resInvalid.valid, false);
    assert.match(resInvalid.error || '', /無效的日本地區選項/);
  });

  it('enforces notes max 500 characters', () => {
    const longNotes = 'あ'.repeat(501);
    const res = validateSubmission({ ...validPayload, notes: longNotes });
    assert.equal(res.valid, false);
    assert.match(res.error || '', /最多 500 字/);
  });
});

describe('Survey Stats Computation', () => {
  it('computes empty stats when responses array is empty', () => {
    const stats = computeSurveyStats([]);
    assert.equal(stats.totalCount, 0);
    assert.equal(stats.totalRegionVotes, 0);
    assert.equal(stats.transportVotes.willingDrivers, 0);
  });

  it('accurately tallies regions, days, styles, and driver volunteers', () => {
    const mockResponses: any[] = [
      {
        id: '1',
        name: 'Alice',
        intent: '一定參加',
        days: '7 天',
        style: '都市繁華',
        transport: '大眾運輸為主',
        driver: 0,
        regions: ['東京及近郊', '北海道'],
        notes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Bob',
        intent: '一定參加',
        days: '7 天',
        style: '慢生活風景',
        transport: '租車自駕',
        driver: 1, // Willing driver
        regions: ['北海道'],
        notes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Charlie',
        intent: '觀望中',
        days: '5 天',
        style: '城鄉各半',
        transport: '租車自駕',
        driver: 0, // Wants rental car, but not a driver volunteer
        regions: ['北海道', '福岡九州'],
        notes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const stats = computeSurveyStats(mockResponses);
    assert.equal(stats.totalCount, 3);
    assert.equal(stats.totalRegionVotes, 5); // 2 + 1 + 2
    assert.equal(stats.regionVotes['北海道'], 3);
    assert.equal(stats.regionVotes['東京及近郊'], 1);
    assert.equal(stats.daysVotes['7 天'], 2);
    assert.equal(stats.daysVotes['5 天'], 1);
    assert.equal(stats.transportVotes.publicTransport, 1);
    assert.equal(stats.transportVotes.rentalCar, 2);
    assert.equal(stats.transportVotes.willingDrivers, 1); // Strictly separate from rentalCar
  });
});
