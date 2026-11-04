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
  detectDiff,
  loadPreviousState,
  saveCurrentState,
};
