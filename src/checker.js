const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const STATE_FILE = path.join(DATA_DIR, 'ipa_state.json');

/**
 * 前回の状態を読み込む
 * @returns {Array<object>}
 */
function loadPreviousState() {
  if (!fs.existsSync(STATE_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('前回の状態ファイルの読み込みに失敗しました:', err.message);
    return [];
  }
}

/**
 * 現在の状態を保存する
 * @param {Array<object>} state 
 */
function saveCurrentState(state) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

/**
 * 新着情報の差分を検知する
 * @param {Array<object>} currentItems 
 * @param {Array<object>} previousItems 
 * @returns {Array<object>} 新規・更新されたアイテム
 */
function detectDiff(currentItems, previousItems) {
  const previousUrls = new Set(previousItems.map(item => item.url));
  const diffs = [];

  for (const item of currentItems) {
    if (!previousUrls.has(item.url)) {
      diffs.push(item);
    }
  }

  return diffs;
}

module.exports = {
  loadPreviousState,
  saveCurrentState,
  detectDiff,
};
