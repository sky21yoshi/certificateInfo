/**
 * =========================================================================
 * certificateInfo - IPA 資格情報 更新監視 & Slack通知スクリプト (GAS版)
 * =========================================================================
 * 
 * 【設定手順】
 * 1. スプレッドシートのメニュー「拡張機能」>「Apps Script」を開きます。
 * 2. このコードをそのままエディタ（Code.gs）に貼り付けます。
 * 3. プロジェクトの設定（歯車アイコン）>「スクリプト プロパティ」に以下を追加します：
 *    - キー: SLACK_WEBHOOK_URL
 *    - 値: CW-Consulting の Slack Incoming Webhook URL
 * 4. 左メニューの「トリガー（時計アイコン）」を開き、checkIpaUpdates を「時間主導型」で毎日（例: 9時〜10時）定期実行するように設定します。
 */

const IPA_NEWS_URL = 'https://www.ipa.go.jp/shiken/index.html';
const BASE_URL = 'https://www.ipa.go.jp';

// 監視対象資格一覧
const IPA_QUALIFICATIONS = [
  { no: 1, name: '基本情報技術者試験', aliases: ['基本情報', 'FE'] },
  { no: 2, name: '応用情報技術者試験(旧:ソフトウェア開発技術者試験)', aliases: ['応用情報', 'AP'] },
  { no: 3, name: 'ネットワークスペシャリスト試験', aliases: ['ネットワークスペシャリスト', 'NW'] },
  { no: 4, name: 'データベーススペシャリスト試験', aliases: ['データベーススペシャリスト', 'DB'] },
  { no: 5, name: 'エンベデッドシステムスペシャリスト試験', aliases: ['エンベデッドシステムスペシャリスト', 'エンべデッド', 'ES'] },
  { no: 6, name: 'ITサービスマネージャ試験', aliases: ['ITサービスマネージャ', 'SM'] },
  { no: 7, name: '情報処理安全確保支援士試験', aliases: ['情報処理安全確保支援士', '登録情報セキュリティスペシャリスト', '支援士', 'RISS'] },
  { no: 8, name: 'システムアーキテクト試験', aliases: ['システムアーキテクト', 'SA'] },
  { no: 9, name: 'ITストラテジスト試験', aliases: ['ITストラテジスト', 'ST'] },
  { no: 10, name: 'プロジェクトマネージャ試験', aliases: ['プロジェクトマネージャ', 'PM'] },
  { no: 11, name: 'システム監査技術者試験', aliases: ['システム監査技術者', 'AU'] },
  { no: 12, name: 'ITパスポート試験', aliases: ['ITパスポート', 'iパス', 'IP'] },
  { no: 13, name: '情報セキュリティマネジメント試験', aliases: ['情報セキュリティマネジメント', 'セキュマネ', 'SG'] },
];

/**
 * 定期実行エントリポイント
 */
function checkIpaUpdates() {
  console.log('IPA試験情報の更新チェックを開始します...');

  // 1. IPA試験情報トップページを取得
  const response = UrlFetchApp.fetch(IPA_NEWS_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; certificateInfo-GAS-bot/1.0)',
      'Accept-Language': 'ja'
    },
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    console.error(`IPAサイトへのアクセスに失敗しました: HTTP ${response.getResponseCode()}`);
    return;
  }

  const html = response.getContentText('UTF-8');
  const currentItems = parseIpaNews(html);
  console.log(`取得成功: ${currentItems.length} 件`);

  // 2. 前回の保存済みURLリストを取得
  const properties = PropertiesService.getScriptProperties();
  const savedUrlsRaw = properties.getProperty('IPA_SAVED_URLS');
  const savedUrls = savedUrlsRaw ? JSON.parse(savedUrlsRaw) : [];

  if (savedUrls.length === 0) {
    // 初回実行時は現在のURLを保存して終了
    console.log('初回実行のため、現在のURLをベースラインとして保存します。');
    const urlsToSave = currentItems.map(i => i.url);
    properties.setProperty('IPA_SAVED_URLS', JSON.stringify(urlsToSave));
    return;
  }

  // 3. 差分検知
  const savedSet = new Set(savedUrls);
  const diffs = currentItems.filter(item => !savedSet.has(item.url));

  if (diffs.length === 0) {
    console.log('新着・更新情報はありませんでした。');
    return;
  }

  console.log(`【更新検知】 ${diffs.length} 件の新着情報を検出しました！`);

  // 4. Slackへ通知
  const webhookUrl = properties.getProperty('SLACK_WEBHOOK_URL');
  for (const diff of diffs) {
    postToSlack(diff, webhookUrl);
  }

  // 5. 状態を更新
  const updatedUrls = currentItems.map(i => i.url);
  properties.setProperty('IPA_SAVED_URLS', JSON.stringify(updatedUrls));
  properties.setProperty('IPA_LAST_UPDATED', new Date().toISOString());
  console.log('状態を更新しました。');
}

/**
 * HTMLから新着情報をパースする
 */
function parseIpaNews(html) {
  const items = [];
  const aRegex = /<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let aMatch;

  while ((aMatch = aRegex.exec(html)) !== null) {
    const fullTag = aMatch[0];
    const rawHref = aMatch[1];
    const innerHtml = aMatch[2];

    if (!fullTag.includes('news-list__inner')) continue;

    let url = rawHref.trim();
    if (url && !url.startsWith('http')) {
      url = BASE_URL + (url.startsWith('/') ? '' : '/') + url;
    }

    const dateMatch = innerHtml.match(/<li[^>]*class="[^"]*news-list__date[^"]*"[^>]*>([\s\S]*?)<\/li>/i);
    const dateStr = dateMatch ? dateMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    const ttlMatch = innerHtml.match(/<p[^>]*class="[^"]*news-list__ttl[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
    const title = ttlMatch ? ttlMatch[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ') : '';

    if (title && url) {
      const matchedQuals = matchQualifications(title);
      items.push({
        date: dateStr,
        title: title,
        url: url,
        relatedQualifications: matchedQuals
      });
    }
  }

  return items;
}

/**
 * 資格名マッチング
 */
function matchQualifications(text) {
  const matched = [];
  for (const q of IPA_QUALIFICATIONS) {
    if (text.includes(q.name) || q.aliases.some(alias => text.includes(alias))) {
      matched.push(q.name);
    }
  }
  if (text.includes('高度試験') && matched.length === 0) {
    matched.push('高度試験（複数区分対象）');
  }
  return matched;
}

/**
 * Slackへのメッセージ投稿
 */
function postToSlack(item, webhookUrl) {
  if (!webhookUrl) {
    console.warn('SLACK_WEBHOOK_URL が設定されていないため、Slack通知をスキップしました。');
    return;
  }

  const qualsText = item.relatedQualifications.length > 0
    ? item.relatedQualifications.join(', ')
    : 'IPA試験全般 / その他';

  const payload = {
    text: `📢 *【IPA資格情報 新着通知】*`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📢 IPA資格情報 更新のお知らせ',
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*対象資格:*\n${qualsText}`
          },
          {
            type: 'mrkdwn',
            text: `*公開日:*\n${item.date}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*タイトル:*\n<${item.url}|${item.title}>`
        }
      },
      {
        type: 'divider'
      }
    ]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const res = UrlFetchApp.fetch(webhookUrl, options);
  console.log(`Slack投稿完了: HTTP ${res.getResponseCode()}`);
}
