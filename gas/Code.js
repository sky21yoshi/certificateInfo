/**
 * =========================================================================
 * certificateInfo - 主要認定機関 資格情報更新監視 & Slack通知スクリプト (GAS版)
 * =========================================================================
 * 
 * 【対応認定機関】
 * 1. IPA（情報処理推進機構）
 * 2. Amazon Web Services (AWS)
 * 3. Microsoft（Learn Catalog API）
 * 4. LPI & LPI-Japan (Linux / OSS)
 * 
 * 【設定手順】
 * 1. スプレッドシートのメニュー「拡張機能」>「Apps Script」を開きます。
 * 2. このコードをエディタに貼り付けて保存します。
 * 3. プロジェクト設定（歯車アイコン）>「スクリプト プロパティ」に以下を設定します：
 *    - キー: SLACK_WEBHOOK_URL
 *    - 値: CW-Consulting の Slack Incoming Webhook URL
 * 4. 左メニュー「トリガー（時計アイコン）」から、checkAllCertificateUpdates を時間主導型で定期実行（例: 毎日午前9時）設定します。
 */

const ENDPOINTS = {
  IPA: 'https://www.ipa.go.jp/shiken/index.html',
  AWS: 'https://aws.amazon.com/jp/blogs/training-and-certification/feed/',
  AWS_EN: 'https://aws.amazon.com/blogs/training-and-certification/feed/',
  MICROSOFT: 'https://learn.microsoft.com/api/catalog/',
  LPI: 'https://www.lpi.org/feed/',
  LINUC: 'https://linuc.org/news/'
};

/**
 * 定期実行メイン関数
 */
function checkAllCertificateUpdates() {
  console.log('=== 資格情報更新チェック開始 ===');
  const properties = PropertiesService.getScriptProperties();
  const webhookUrl = properties.getProperty('SLACK_WEBHOOK_URL');

  // 1. IPA
  try {
    checkIpa(properties, webhookUrl);
  } catch (e) {
    console.error('IPA チェック失敗:', e.message);
  }

  Utilities.sleep(1500);

  // 2. AWS
  try {
    checkAws(properties, webhookUrl);
  } catch (e) {
    console.error('AWS チェック失敗:', e.message);
  }

  Utilities.sleep(1500);

  // 3. Microsoft
  try {
    checkMicrosoft(properties, webhookUrl);
  } catch (e) {
    console.error('Microsoft チェック失敗:', e.message);
  }

  Utilities.sleep(1500);

  // 4. LPI & LinuC
  try {
    checkLpi(properties, webhookUrl);
  } catch (e) {
    console.error('LPI チェック失敗:', e.message);
  }

  console.log('=== 全プロバイダーのチェック完了 ===');
}

/**
 * IPA チェック処理
 */
function checkIpa(properties, webhookUrl) {
  const res = UrlFetchApp.fetch(ENDPOINTS.IPA, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) return;
  const html = res.getContentText('UTF-8');

  const items = [];
  const regex = /<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    if (!m[0].includes('news-list__inner')) continue;
    let url = m[1].trim();
    if (!url.startsWith('http')) url = 'https://www.ipa.go.jp' + (url.startsWith('/') ? '' : '/') + url;
    const dMatch = m[2].match(/<li[^>]*class="[^"]*news-list__date[^"]*"[^>]*>([\s\S]*?)<\/li>/i);
    const tMatch = m[2].match(/<p[^>]*class="[^"]*news-list__ttl[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
    if (tMatch) {
      items.push({
        provider: 'IPA（情報処理推進機構）',
        date: dMatch ? dMatch[1].replace(/<[^>]+>/g, '').trim() : '',
        title: tMatch[1].replace(/<[^>]+>/g, '').trim(),
        url: url
      });
    }
  }

  handleDiff('IPA', items, properties, webhookUrl, 'url');
}

/**
 * AWS チェック処理
 */
function checkAws(properties, webhookUrl) {
  let res = UrlFetchApp.fetch(ENDPOINTS.AWS, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) {
    res = UrlFetchApp.fetch(ENDPOINTS.AWS_EN, { muteHttpExceptions: true });
  }
  if (res.getResponseCode() !== 200) return;
  const xml = res.getContentText('UTF-8');

  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = itemRegex.exec(xml)) !== null) {
    const tMatch = m[1].match(/<title>([\s\S]*?)<\/title>/i);
    const lMatch = m[1].match(/<link>([\s\S]*?)<\/link>/i);
    const dMatch = m[1].match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    if (tMatch && lMatch) {
      items.push({
        provider: 'Amazon Web Services (AWS)',
        title: tMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim(),
        url: lMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim(),
        date: dMatch ? dMatch[1].trim() : ''
      });
    }
  }

  handleDiff('AWS', items, properties, webhookUrl, 'url');
}

/**
 * Microsoft チェック処理
 */
function checkMicrosoft(properties, webhookUrl) {
  const res = UrlFetchApp.fetch(ENDPOINTS.MICROSOFT, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) return;
  const json = JSON.parse(res.getContentText('UTF-8'));
  const certs = json.certifications || [];

  const items = certs.map(c => ({
    provider: 'Microsoft',
    uid: c.uid,
    title: c.title,
    url: c.url,
    date: c.last_modified
  }));

  handleDiff('MICROSOFT', items, properties, webhookUrl, 'uid', 'date');
}

/**
 * LPI & LinuC チェック処理
 */
function checkLpi(properties, webhookUrl) {
  const items = [];

  // LPI RSS
  try {
    const resLpi = UrlFetchApp.fetch(ENDPOINTS.LPI, { muteHttpExceptions: true });
    if (resLpi.getResponseCode() === 200) {
      const xml = resLpi.getContentText('UTF-8');
      const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
      let m;
      while ((m = itemRegex.exec(xml)) !== null) {
        const tMatch = m[1].match(/<title>([\s\S]*?)<\/title>/i);
        const lMatch = m[1].match(/<link>([\s\S]*?)<\/link>/i);
        const dMatch = m[1].match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
        if (tMatch && lMatch) {
          items.push({
            provider: 'LPI (Linux Professional Institute)',
            title: tMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim(),
            url: lMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim(),
            date: dMatch ? dMatch[1].trim() : ''
          });
        }
      }
    }
  } catch (e) {
    console.error('LPI取得エラー:', e.message);
  }

  // LinuC News
  try {
    const resLinuc = UrlFetchApp.fetch(ENDPOINTS.LINUC, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      muteHttpExceptions: true
    });
    if (resLinuc.getResponseCode() === 200) {
      const html = resLinuc.getContentText('UTF-8');
      const regex = /<li class="app-news-item">([\s\S]*?)<\/li>/gi;
      let m;
      while ((m = regex.exec(html)) !== null) {
        const dMatch = m[1].match(/<span class="app-news-date">([\s\S]*?)<\/span>/i);
        const lMatch = m[1].match(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
        if (lMatch) {
          let url = lMatch[1].trim();
          if (!url.startsWith('http')) url = 'https://linuc.org' + (url.startsWith('/') ? '' : '/') + url;
          items.push({
            provider: 'LPI-Japan (LinuC)',
            title: lMatch[2].replace(/<[^>]+>/g, '').trim(),
            url: url,
            date: dMatch ? dMatch[1].trim() : ''
          });
        }
      }
    }
  } catch (e) {
    console.error('LinuC取得エラー:', e.message);
  }

  handleDiff('LPI', items, properties, webhookUrl, 'url');
}

/**
 * 差分検知とSlack通知
 */
function handleDiff(key, items, properties, webhookUrl, idKey = 'url', updateKey = null) {
  const propKey = `SAVED_STATE_${key}`;
  const savedRaw = properties.getProperty(propKey);
  const savedList = savedRaw ? JSON.parse(savedRaw) : [];

  if (savedList.length === 0) {
    properties.setProperty(propKey, JSON.stringify(items.slice(0, 50)));
    console.log(`[${key}] 初回ベースライン保存完了 (${items.length}件)`);
    return;
  }

  const prevMap = new Map();
  for (const s of savedList) {
    if (s[idKey]) prevMap.set(s[idKey], s);
  }

  const diffs = [];
  for (const curr of items) {
    const id = curr[idKey];
    if (!id) continue;
    if (!prevMap.has(id)) {
      diffs.push({ ...curr, type: '新着' });
    } else if (updateKey && curr[updateKey] && prevMap.get(id)[updateKey] !== curr[updateKey]) {
      diffs.push({ ...curr, type: '更新' });
    }
  }

  if (diffs.length > 0) {
    console.log(`[${key}] 差分検知: ${diffs.length} 件`);
    for (const diff of diffs) {
      sendSlackNotification(diff, webhookUrl);
    }
    properties.setProperty(propKey, JSON.stringify(items.slice(0, 50)));
  } else {
    console.log(`[${key}] 変更なし`);
  }
}

/**
 * Slack通知送信
 */
function sendSlackNotification(item, webhookUrl) {
  if (!webhookUrl) return;

  const payload = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `📢 【${item.provider}】資格情報 ${item.type || '新着'}通知`,
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*公開・更新日:*\n${item.date || '未記載'}` },
          { type: 'mrkdwn', text: `*認定機関:*\n${item.provider}` }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*タイトル:*\n<${item.url}|${item.title}>`
        }
      },
      { type: 'divider' }
    ]
  };

  UrlFetchApp.fetch(webhookUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}
