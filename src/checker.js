const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

/**
 * プロバイダーごとの保存ファイルパスを取得
 * @param {string} providerName 
 * @returns {string}
 */
function getStateFilePath(providerName) {
  return path.join(DATA_DIR, `${providerName}_state.json`);
}

/**
 * 指定プロバイダーの前回状態を読み込む
 * @param {string} providerName 
 * @returns {Array<object>}
 */
function loadProviderState(providerName) {
  const filePath = getStateFilePath(providerName);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[${providerName}] 前回の状態ファイルの読み込みに失敗しました:`, err.message);
    return [];
  }
}

/**
 * 指定プロバイダーの現在状態を保存する
 * @param {string} providerName 
 * @param {Array<object>} state 
 */
function saveProviderState(providerName, state) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const filePath = getStateFilePath(providerName);
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8');
}

/**
 * 取得元ごとの情報を IPA 状態ファイルと同じ項目構成に正規化する
 * @param {object} item
 * @returns {{fiscalYear: number|null, date: string, title: string, url: string, relatedQualifications: Array<object>}}
 */
function normalizeStateItem(item) {
  return {
    fiscalYear: item.fiscalYear || null,
    date: item.date || item.lastModified || '',
    title: item.title || item.name || '',
    url: item.url || item.officialUrl || '',
    relatedQualifications: Array.isArray(item.relatedQualifications) ? item.relatedQualifications : [],
  };
}

/**
 * 複数取得元の情報をURLでまとめ、資格情報を統合する
 * @param {Array<Array<object>>} providerItems
 * @returns {Array<object>}
 */
function mergeProviderItems(providerItems) {
  const merged = new Map();
  for (const items of providerItems) {
    for (const item of items) {
      const normalized = normalizeStateItem(item);
      if (!normalized.url) continue;

      const existing = merged.get(normalized.url);
      if (!existing) {
        merged.set(normalized.url, normalized);
        continue;
      }

      const qualifications = new Map(
        existing.relatedQualifications.map(qualification => [qualification.no, qualification])
      );
      for (const qualification of normalized.relatedQualifications) {
        qualifications.set(qualification.no, qualification);
      }
      existing.relatedQualifications = Array.from(qualifications.values());
      if (!existing.date && normalized.date) existing.date = normalized.date;
      if (!existing.fiscalYear && normalized.fiscalYear) existing.fiscalYear = normalized.fiscalYear;
    }
  }
  return Array.from(merged.values());
}

/**
 * 新着・更新情報の差分を検知する
 * @param {Array<object>} currentItems 
 * @param {Array<object>} previousItems 
 * @param {string} [idKey='url'] 一意キー（url または uid）
 * @param {string} [updateKey='lastModified'] 更新比較キー（任意）
 * @returns {Array<object>} 新規・更新されたアイテム
 */
function detectDiff(currentItems, previousItems, idKey = 'url', updateKey = null) {
  const prevMap = new Map();
  for (const item of previousItems) {
    if (item[idKey]) {
      prevMap.set(item[idKey], item);
    }
  }

  const diffs = [];

  for (const current of currentItems) {
    const id = current[idKey];
    if (!id) continue;

    if (!prevMap.has(id)) {
      // 新規アイテム
      diffs.push({ ...current, _diffType: 'NEW' });
    } else if (updateKey && current[updateKey]) {
      // 既存アイテムだが更新キー（最終更新日時など）が変更された場合
      const prev = prevMap.get(id);
      if (prev[updateKey] !== current[updateKey]) {
        diffs.push({ ...current, _diffType: 'UPDATED' });
      }
    }
  }

  return diffs;
}

/**
 * AWS資格詳細情報（カテゴリ、試験期間、試験の形態、費用、受験オプション、はじめに、試験内容、試験内容の概要）の差分を検知する
 * @param {Array<object>} currentDetailsList 
 * @param {Array<object>} prevDetailsList 
 * @returns {Array<object>} 変更があった資格のリスト
 */
function detectAwsDetailsDiff(currentDetailsList, prevDetailsList) {
  const prevMap = new Map();
  for (const item of (prevDetailsList || [])) {
    if (item && item.no) {
      prevMap.set(Number(item.no), item);
    }
  }

  const detailFields = [
    'category',
    'examDuration',
    'examFormat',
    'cost',
    'testingOptions',
    'introduction',
    'examContent',
    'contentOutline',
  ];

  const diffs = [];
  for (const current of currentDetailsList) {
    const no = Number(current.no);
    if (!no) continue;

    const prev = prevMap.get(no);
    if (!prev) {
      diffs.push({
        ...current,
        _diffType: 'NEW',
        _changedFields: detailFields.filter(f => Boolean(current[f])),
      });
      continue;
    }

    const changedFields = [];
    for (const field of detailFields) {
      const currVal = String(current[field] || '').trim();
      const prevVal = String(prev[field] || '').trim();
      if (currVal !== prevVal) {
        changedFields.push(field);
      }
    }

    if (changedFields.length > 0) {
      diffs.push({
        ...current,
        _diffType: 'UPDATED',
        _changedFields: changedFields,
      });
    }
  }

  return diffs;
}

/**
 * 日本時間（JST）で現在が平日（月〜金）かどうかを判定する
 * @param {Date} [date]
 * @returns {boolean}
 */
function isWeekdayJST(date = new Date()) {
  const jstString = date.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' });
  const jstDate = new Date(jstString);
  const day = jstDate.getDay(); // 0: 日曜, 6: 土曜
  return day >= 1 && day <= 5;
}

/**
 * 日付文字列からタイムスタンプを取得
 * @param {string} value
 * @returns {number}
 */
function getUpdateTimestamp(value) {
  if (!value) return NaN;
  const normalized = String(value).trim()
    .replace(/年/g, '-')
    .replace(/月/g, '-')
    .replace(/日/g, '')
    .replace(/\//g, '-');
  const partialDate = normalized.match(/^(\d{4})-(\d{1,2})$/);
  const date = partialDate
    ? `${partialDate[1]}-${('0' + partialDate[2]).slice(-2)}-01`
    : normalized;
  return Date.parse(date);
}

/**
 * Slack通知送信（要件定義準拠: 更新日時、資格名、タイトル、URL、説明を整形して投稿）
 * @param {object} item
 * @param {string} webhookUrl
 * @returns {Promise<boolean>}
 */
async function sendSlackNotification(item, webhookUrl) {
  if (!webhookUrl) return false;

  const date = item.date || item.lastModified || '未記載';
  const qualificationName = item.qualificationName || (item.relatedQualifications && item.relatedQualifications[0] && item.relatedQualifications[0].name) || item.provider || '資格情報';
  const title = item.title || item.name || '（タイトルなし）';
  const url = item.url || '';
  const description = item.description || item.summary || item.title || '（詳細説明なし）';

  const payload = {
    text: `【資格情報更新】${qualificationName} の最新情報が検知されました`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📢 資格情報 更新通知',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*更新日時:*\n${date}` },
          { type: 'mrkdwn', text: `*資格名:*\n${qualificationName}` },
        ],
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*タイトル:*\n${title}` },
          { type: 'mrkdwn', text: `*URL:*\n${url ? `<${url}|${url}>` : '未記載'}` },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*説明:*\n${description}`,
        },
      },
      { type: 'divider' },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (error) {
    console.error('Slack通知の送信に失敗しました:', error.message);
    return false;
  }
}

/**
 * 複数更新をそれぞれ個別にSlack投稿する
 * @param {Array<object>} updates
 * @param {string} webhookUrl
 * @param {number} [intervalMs=500]
 */
async function notifySlackUpdates(updates, webhookUrl, intervalMs = 500) {
  if (!webhookUrl || !Array.isArray(updates) || updates.length === 0) return 0;
  let successCount = 0;
  for (let i = 0; i < updates.length; i++) {
    const update = updates[i];
    const ok = await sendSlackNotification(update, webhookUrl);
    if (ok) successCount++;
    if (i < updates.length - 1 && intervalMs > 0) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }
  return successCount;
}

// 既存後方互換用
function loadPreviousState() {
  return loadProviderState('ipa');
}
function saveCurrentState(state) {
  return saveProviderState('ipa', state);
}

module.exports = {
  loadProviderState,
  saveProviderState,
  normalizeStateItem,
  mergeProviderItems,
  detectDiff,
  detectAwsDetailsDiff,
  loadPreviousState,
  saveCurrentState,
  isWeekdayJST,
  getUpdateTimestamp,
  sendSlackNotification,
  notifySlackUpdates,
};
