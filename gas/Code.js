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
 * 5. Cisco Systems (Learn with Cisco)
 * 6. Google Cloud (Training and Certifications)
 * 7. Oracle Certification
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
  LINUC: 'https://linuc.org/news/',
  CISCO: 'https://blogs.cisco.com/learning/feed',
  GOOGLE_CLOUD: 'https://cloud.google.com/blog/products/training-certifications',
  ORACLE: 'https://www.oracle.com/education/certification/'
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

  Utilities.sleep(1500);

  try {
    checkCisco(properties, webhookUrl);
  } catch (e) {
    console.error('Cisco チェック失敗:', e.message);
  }

  Utilities.sleep(1500);

  try {
    checkGoogleCloud(properties, webhookUrl);
  } catch (e) {
    console.error('Google Cloud チェック失敗:', e.message);
  }

  Utilities.sleep(1500);

  try {
    checkOracle(properties, webhookUrl);
  } catch (e) {
    console.error('Oracle チェック失敗:', e.message);
  }

  console.log('=== 全プロバイダーのチェック完了 ===');
}

/**
 * Cisco Learn with Cisco RSS チェック処理
 */
function checkCisco(properties, webhookUrl) {
  const res = UrlFetchApp.fetch(ENDPOINTS.CISCO, {
    headers: {
      'User-Agent': 'Mozilla/5.0 certificateInfo-GAS-bot/1.0',
      'Accept': 'application/rss+xml,application/xml,text/xml'
    },
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) throw new Error(`HTTP ${res.getResponseCode()}`);

  const xml = res.getContentText('UTF-8');
  const items = [];
  const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const titleMatch = match[1].match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch = match[1].match(/<link>([\s\S]*?)<\/link>/i);
    const dateMatch = match[1].match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const descriptionMatch = match[1].match(/<description>([\s\S]*?)<\/description>/i);
    if (!titleMatch || !linkMatch) continue;

    const title = decodeFeedText(titleMatch[1]);
    const description = decodeFeedText(descriptionMatch ? descriptionMatch[1] : '').replace(/<[^>]+>/g, '');
    if (!/\b(certification|certified|credential|exam)\b/i.test(`${title} ${description}`)) continue;
    items.push({
      provider: 'Cisco Systems',
      title: title,
      url: decodeFeedText(linkMatch[1]),
      date: dateMatch ? decodeFeedText(dateMatch[1]) : '',
      description: description,
      relatedQualifications: matchCiscoQualifications(`${title} ${description}`)
    });
  }

  handleDiff('CISCO', items, properties, webhookUrl, 'url');
}

/**
 * Google Cloud公式資格情報記事一覧のチェック処理
 */
function checkGoogleCloud(properties, webhookUrl) {
  const res = UrlFetchApp.fetch(ENDPOINTS.GOOGLE_CLOUD, {
    headers: {
      'User-Agent': 'Mozilla/5.0 certificateInfo-GAS-bot/1.0',
      'Accept': 'text/html,application/xhtml+xml'
    },
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) throw new Error(`HTTP ${res.getResponseCode()}`);

  const html = res.getContentText('UTF-8');
  const items = [];
  const anchorRegex = /<a\b[^>]*href=["']([^"']*\/blog\/topics\/training-certifications\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorRegex.exec(html)) !== null) {
    const headingMatch = match[2].match(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i);
    const title = stripHtmlText(headingMatch ? headingMatch[1] : match[2]);
    if (!title || !/\b(certifications?|certified|exams?|credentials?|renewal)\b/i.test(title)) continue;
    items.push({
      provider: 'Google Cloud',
      title: title,
      url: resolveOfficialUrl(match[1], ENDPOINTS.GOOGLE_CLOUD),
      date: '',
      relatedQualifications: matchGoogleCloudQualifications(title)
    });
  }

  handleDiff('GOOGLE_CLOUD', uniqueItemsByUrl(items), properties, webhookUrl, 'url');
}

/**
 * Oracle Certificationページの告知チェック処理
 */
function checkOracle(properties, webhookUrl) {
  const res = UrlFetchApp.fetch(ENDPOINTS.ORACLE, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
    },
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) throw new Error(`HTTP ${res.getResponseCode()}`);

  const html = res.getContentText('UTF-8');
  const announcementIndex = html.search(/>\s*Announcements\s*</i);
  if (announcementIndex < 0) throw new Error('Announcementsセクションが見つかりません');
  const remaining = html.slice(announcementIndex);
  const nextSectionIndex = remaining.search(/<h2\b/i);
  const section = nextSectionIndex > 0 ? remaining.slice(0, nextSectionIndex) : remaining;
  const items = [];
  const headingRegex = /<h[3-5]\b[^>]*>([\s\S]*?)<\/h[3-5]>/gi;
  let headingMatch;
  while ((headingMatch = headingRegex.exec(section)) !== null) {
    const title = stripHtmlText(headingMatch[1]);
    const nextHeading = section.slice(headingRegex.lastIndex).search(/<h[3-5]\b/i);
    const card = section.slice(headingRegex.lastIndex, nextHeading < 0
      ? section.length
      : headingRegex.lastIndex + nextHeading);
    const linkMatch = card.match(/<a\b[^>]*href=["']([^"']+)["']/i);
    if (!title || !linkMatch) continue;
    items.push({
      provider: 'Oracle',
      title: title,
      url: resolveOfficialUrl(linkMatch[1], ENDPOINTS.ORACLE),
      date: '',
      relatedQualifications: matchOracleQualifications(title)
    });
  }

  handleDiff('ORACLE', uniqueItemsByUrl(items), properties, webhookUrl, 'url');
}

function decodeFeedText(value) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function stripHtmlText(value) {
  return decodeFeedText(value.replace(/<[^>]*>/g, ''))
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveOfficialUrl(url, baseUrl) {
  if (/^https?:\/\//i.test(url)) return url;
  const originMatch = baseUrl.match(/^(https?:\/\/[^/]+)/i);
  if (url.startsWith('/') && originMatch) return originMatch[1] + url;
  return baseUrl.replace(/\/[^/]*$/, '/') + url;
}

function uniqueItemsByUrl(items) {
  const seen = new Set();
  return items.filter(item => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

function matchCiscoQualifications(text) {
  const qualifications = [
    { no: 43, name: 'CCNA', aliases: ['CCNA', '200-301'] },
    { no: 44, name: 'ENCOR', aliases: ['ENCOR', '350-401'] },
    { no: 45, name: 'ENARSI', aliases: ['ENARSI', '300-410'] },
    { no: 46, name: 'ENSDWI', aliases: ['ENSDWI', '300-415'] },
    { no: 47, name: 'ENSLD', aliases: ['ENSLD', '300-420'] },
    { no: 48, name: 'ENWLSI', aliases: ['ENWLSI', '300-425'] },
    { no: 49, name: 'ENAUTO', aliases: ['ENAUTO', '300-435'] },
    { no: 50, name: 'ENWLSD', aliases: ['ENWLSD', '300-430'] },
    { no: 51, name: 'CCNP Enterprise', aliases: ['CCNP Enterprise'] },
    { no: 52, name: 'CCIE Enterprise Infrastructure', aliases: ['CCIE Enterprise Infrastructure'] }
  ];
  return qualifications.filter(q => q.aliases.some(alias =>
    new RegExp(`(^|[^A-Z0-9])${alias}($|[^A-Z0-9])`, 'i').test(text)))
    .map(q => ({ no: q.no, name: q.name }));
}

function matchGoogleCloudQualifications(text) {
  const qualifications = [
    { no: 40, name: 'GCP Leader系', aliases: ['Cloud Digital Leader', 'Digital Leader'] },
    { no: 41, name: 'GCP認定 Associate系', aliases: ['Associate Cloud Engineer', 'Associate certification'] },
    { no: 42, name: 'GCP認定 Professional系', aliases: ['Professional Cloud', 'Professional certification'] }
  ];
  const matched = qualifications.filter(q => q.aliases.some(alias => text.toLowerCase().includes(alias.toLowerCase())));
  if (/\b(google cloud )?certification(s)?\b|\bexam\b|\bcredential(s)?\b/i.test(text) && matched.length === 0) {
    return qualifications.map(q => ({ no: q.no, name: q.name }));
  }
  return matched.map(q => ({ no: q.no, name: q.name }));
}

function matchOracleQualifications(text) {
  const qualifications = [
    { no: 60, name: 'Oracle Certified Java Programmer, Bronze SE', aliases: ['Java Programmer, Bronze', 'Java SE Bronze'] },
    { no: 61, name: 'ORACLE MASTER Bronze DBA', aliases: ['ORACLE MASTER Bronze', 'Bronze DBA'] },
    { no: 62, name: 'ORACLE MASTER Silver Oracle Database', aliases: ['ORACLE MASTER Silver', 'Silver Oracle Database'] },
    { no: 63, name: 'Oracle Certified Java Programmer, Silver SE 11', aliases: ['Java Programmer, Silver', 'Java SE 11'] },
    { no: 64, name: 'ORACLE MASTER Gold Oracle Database', aliases: ['ORACLE MASTER Gold', 'Gold Oracle Database'] },
    { no: 65, name: 'Oracle Certified Java Programmer, Gold SE', aliases: ['Java Programmer, Gold', 'Java SE Gold'] },
    { no: 66, name: 'ORACLE MASTER Platinum', aliases: ['ORACLE MASTER Platinum', 'Platinum Oracle Database'] }
  ];
  return qualifications.filter(q => q.aliases.some(alias => text.toLowerCase().includes(alias.toLowerCase())))
    .map(q => ({ no: q.no, name: q.name }));
}

/**
 * 日本の年度（4月始まり）を取得
 */
function getFiscalYear(date) {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  return month >= 4 ? year : year - 1;
}

/**
 * IPA チェック処理 (本年度、前年度、前々年度)
 */
function checkIpa(properties, webhookUrl) {
  const currentFY = getFiscalYear();
  const years = [currentFY, currentFY - 1, currentFY - 2];
  const allItems = [];
  const seenUrls = new Set();

  for (let i = 0; i < years.length; i++) {
    const y = years[i];
    const url = `https://www.ipa.go.jp/news/${y}/index.html?=exam`;
    try {
      const res = UrlFetchApp.fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) certificateInfo-GAS-bot/1.0',
          'Accept-Language': 'ja'
        },
        muteHttpExceptions: true
      });

      if (res.getResponseCode() === 200) {
        const html = res.getContentText('UTF-8');
        const parts = html.split(/<li\s+[^>]*class="[^"]*news-list__item[^"]*"/i);

        for (let j = 1; j < parts.length; j++) {
          const block = parts[j];
          const searchMatch = block.match(/^([^>]*)data-search="([^"]*)"/i);
          const dataSearch = searchMatch ? searchMatch[2] : '';
          const isExam = dataSearch.includes('exam');

          const aMatch = block.match(/<a\s+[^>]*href="([^"]+)"/i);
          let linkUrl = aMatch ? aMatch[1].trim() : '';
          if (linkUrl && !linkUrl.startsWith('http')) {
            linkUrl = 'https://www.ipa.go.jp' + (linkUrl.startsWith('/') ? '' : '/') + linkUrl;
          }

          const dMatch = block.match(/<li[^>]*class="[^"]*news-list__date[^"]*"[^>]*>([\s\S]*?)<\/li>/i);
          const tMatch = block.match(/<p[^>]*class="[^"]*news-list__ttl[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
          const title = tMatch ? tMatch[1].replace(/<[^>]+>/g, '').trim() : '';

          if (title && linkUrl && (isExam || title.includes('試験'))) {
            if (!seenUrls.has(linkUrl)) {
              seenUrls.add(linkUrl);
              allItems.push({
                provider: 'IPA（情報処理推進機構）',
                date: dMatch ? dMatch[1].replace(/<[^>]+>/g, '').trim() : '',
                title: title,
                url: linkUrl
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn(`IPA ${y}年度の取得エラー:`, e.message);
    }

    if (i < years.length - 1) {
      Utilities.sleep(1000);
    }
  }

  handleDiff('IPA', allItems, properties, webhookUrl, 'url');
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
