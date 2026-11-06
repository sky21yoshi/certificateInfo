const assert = require('assert');
const { parseCiscoRss, matchCiscoQualifications } = require('../src/fetcher/cisco');
const { parseGoogleCloudNews, matchGoogleCloudQualifications } = require('../src/fetcher/google_cloud');
const { parseOracleAnnouncements, matchOracleQualifications } = require('../src/fetcher/oracle');
const { PROVIDERS } = require('../src/index');

{
  const rss = `
    <rss><channel>
      <item>
        <title>New CCNA certification exam updates</title>
        <link>https://blogs.cisco.com/learning/ccna-update</link>
        <pubDate>Thu, 05 Nov 2026 15:00:00 +0000</pubDate>
        <description>Details for the 200-301 exam.</description>
      </item>
      <item>
        <title>Networking skills event</title>
        <link>https://blogs.cisco.com/learning/event</link>
        <description>Join our live event.</description>
      </item>
    </channel></rss>
  `;
  const items = parseCiscoRss(rss);
  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].url, 'https://blogs.cisco.com/learning/ccna-update');
  assert(items[0].relatedQualifications.some(item => item.name === 'CCNA'));
  assert(matchCiscoQualifications('CCNATraining').length === 0);
}

{
  const html = `
    <a href="https://cloud.google.com/blog/topics/training-certifications/new-ways-keep-certifications-current">
      <div><h3>New ways to keep Google Cloud certifications current</h3></div>
    </a>
    <a href="https://cloud.google.com/blog/topics/training-certifications/free-training">
      <h3>Free training for cloud engineers</h3>
    </a>
  `;
  const items = parseGoogleCloudNews(html);
  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].title, 'New ways to keep Google Cloud certifications current');
  assert.strictEqual(items[0].relatedQualifications.length, 3);
  assert.strictEqual(matchGoogleCloudQualifications('Associate Cloud Engineer').length, 1);
}

{
  const html = `
    <h2>Announcements</h2>
    <div>
      <h3>New Oracle Java certification</h3>
      <a href="https://mylearn.oracle.com/ou/story/java-cert">Learn more</a>
      <h3>ORACLE MASTER Silver update</h3>
      <a href="/education/certification/database">Details</a>
    </div>
    <h2>Explore certifications</h2>
    <div><h3>Not an announcement</h3><a href="/education/other">More</a></div>
  `;
  const items = parseOracleAnnouncements(html);
  assert.strictEqual(items.length, 2);
  assert.strictEqual(items[1].url, 'https://www.oracle.com/education/certification/database');
  assert.strictEqual(items[1].relatedQualifications[0].name, 'ORACLE MASTER Silver Oracle Database');
  assert.strictEqual(matchOracleQualifications('ORACLE MASTER Platinum').length, 1);
}

assert.strictEqual(typeof PROVIDERS.cisco.fetch, 'function');
assert.strictEqual(typeof PROVIDERS.google_cloud.fetch, 'function');
assert.strictEqual(typeof PROVIDERS.oracle.fetch, 'function');

console.log('✓ Cisco / Google Cloud / Oracle: 公式情報パース・資格マッチング・監視登録 OK');
