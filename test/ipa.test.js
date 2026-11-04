const assert = require('assert');
const { parseNewsItems, matchQualifications, getFiscalYear, getIpaNewsTargetUrls } = require('../src/fetcher/ipa');
const { detectDiff } = require('../src/checker');

console.log('=== IPA スクレイパー 単体テスト開始 ===');

// 1. 年度計算テスト
{
  // 2026年11月の場合 -> 2026年度
  const dNov = new Date(2026, 10, 4); // 月は0-indexed (10 = 11月)
  assert.strictEqual(getFiscalYear(dNov), 2026);

  // 2027年3月の場合 -> 2026年度
  const dMar = new Date(2027, 2, 15); // 2 = 3月
  assert.strictEqual(getFiscalYear(dMar), 2026);

  // 2026年4月の場合 -> 2026年度
  const dApr = new Date(2026, 3, 1); // 3 = 4月
  assert.strictEqual(getFiscalYear(dApr), 2026);

  console.log('✓ getFiscalYear (年度計算): OK');

  // URL生成テスト
  const urls = getIpaNewsTargetUrls(dNov);
  assert.strictEqual(urls.length, 3);
  assert.strictEqual(urls[0].year, 2026);
  assert.strictEqual(urls[0].label, '本年度');
  assert.strictEqual(urls[0].url, 'https://www.ipa.go.jp/news/2026/index.html?=exam');
  assert.strictEqual(urls[1].year, 2025);
  assert.strictEqual(urls[1].label, '前年度');
  assert.strictEqual(urls[1].url, 'https://www.ipa.go.jp/news/2025/index.html?=exam');
  assert.strictEqual(urls[2].year, 2024);
  assert.strictEqual(urls[2].label, '前々年度');
  assert.strictEqual(urls[2].url, 'https://www.ipa.go.jp/news/2024/index.html?=exam');

  console.log('✓ getIpaNewsTargetUrls (対象URL生成): OK');
}

// 2. matchQualifications のテスト
{
  const r1 = matchQualifications('令和8年度前期試験 高度試験及び情報処理安全確保支援士試験の申込受付を終了しました');
  assert(r1.some(q => q.name.includes('情報処理安全確保支援士')), '支援士がマッチすること');
  console.log('✓ matchQualifications (支援士): OK');

  const r2 = matchQualifications('ITパスポート試験合格者の学習実態等に関するアンケート結果を公表しました');
  assert(r2.some(q => q.name === 'ITパスポート試験'), 'ITパスポートがマッチすること');
  console.log('✓ matchQualifications (ITパスポート): OK');

  const r3 = matchQualifications('応用情報技術者試験の実施日程について');
  assert(r3.some(q => q.name.includes('応用情報')), '応用情報がマッチすること');
  console.log('✓ matchQualifications (応用情報): OK');

  const r4 = matchQualifications('基本情報技術者試験 科目Bのサンプル問題');
  assert(r4.some(q => q.name === '基本情報技術者試験'), '基本情報がマッチすること');
  console.log('✓ matchQualifications (基本情報): OK');
}

// 3. parseNewsItems のテスト
{
  const mockHtml = `
    <ul class="news-list">
      <li class="news-list__item" data-search="exam">
        <a href="/news/2026/shiken_sample.html" class="news-list__inner ">
          <ul class="news-list__data-box">
            <li class="news-list__date">2026年11月1日</li>
          </ul>
          <p class="news-list__ttl">応用情報技術者試験の令和8年度秋期合格発表</p>
        </a>
      </li>
      <li class="news-list__item" data-search="security">
        <a href="/news/2026/security_sample.html" class="news-list__inner ">
          <ul class="news-list__data-box">
            <li class="news-list__date">2026年11月1日</li>
          </ul>
          <p class="news-list__ttl">一般的なセキュリティ注意喚起</p>
        </a>
      </li>
    </ul>
  `;

  const items = parseNewsItems(mockHtml, 2026);
  assert.strictEqual(items.length, 1, 'examカテゴリのみ1件抽出されること');
  assert.strictEqual(items[0].date, '2026年11月1日');
  assert.strictEqual(items[0].title, '応用情報技術者試験の令和8年度秋期合格発表');
  assert.strictEqual(items[0].url, 'https://www.ipa.go.jp/news/2026/shiken_sample.html');
  assert.strictEqual(items[0].fiscalYear, 2026);
  assert(items[0].relatedQualifications.some(q => q.name.includes('応用情報')));
  console.log('✓ parseNewsItems: OK');
}

// 4. detectDiff のテスト
{
  const oldItems = [
    { url: 'https://www.ipa.go.jp/news/1.html', title: '古いお知らせ' }
  ];
  const newItems = [
    { url: 'https://www.ipa.go.jp/news/1.html', title: '古いお知らせ' },
    { url: 'https://www.ipa.go.jp/news/2.html', title: '新しいお知らせ' }
  ];

  const diffs = detectDiff(newItems, oldItems);
  assert.strictEqual(diffs.length, 1);
  assert.strictEqual(diffs[0].url, 'https://www.ipa.go.jp/news/2.html');
  console.log('✓ detectDiff: OK');
}

console.log('=== すべてのテストが正常にパスしました！ ===');
