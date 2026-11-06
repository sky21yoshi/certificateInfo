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
  loadPreviousState,
  saveCurrentState,
};
