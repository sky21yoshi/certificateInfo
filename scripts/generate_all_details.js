/**
 * 全プロバイダーの状態ファイル（data/*_state.json）に詳細メタデータ（I列〜P列）を追加し、
 * qualifications.tsv のI列〜P列を更新するスクリプト
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { resolveProviderDetailsMeta } = require('../src/fetcher/provider_details_meta');
const { loadQualificationRows, DETAIL_FIELDS } = require('../src/fetcher/qualification_details');

const DATA_DIR = path.join(__dirname, '..', 'data');
const TSV_PATH = path.join(__dirname, '..', 'qualifications.tsv');

// qualifications.tsv から全行を読み込む
const rows = loadQualificationRows(TSV_PATH);

// プロバイダーキーとstateファイル名のマッピング
const PROVIDER_STATE_MAP = {
  'lpi': 'lpi_state.json',
  'oracle': 'oracle_state.json',
  'broadcom': 'broadcom_state.json',
  'comptia': 'comptia_state.json',
  'cncf': 'cncf_state.json',
  'anthropic': 'anthropic_state.json',
  'uipath': 'uipath_state.json',
  'certify': 'certify_state.json',
  'python_association': 'python_association_state.json',
  'pmaj': 'pmaj_state.json',
  'pmi': 'pmi_state.json',
  'isaca': 'isaca_state.json',
  'peoplecert': 'peoplecert_state.json',
  'fortinet': 'fortinet_state.json',
  'palo_alto': 'palo_alto_state.json',
  'ntt_at': 'ntt_at_state.json',
};

const PROVIDER_MATCH = {
  'lpi': /Linux Professional Institute|LPI-Japan|エルピーアイ|^LPI/i,
  'oracle': /Oracle|オラクル/i,
  'broadcom': /Broadcom|VMware/i,
  'comptia': /CompTIA|コンプティア/i,
  'cncf': /CNCF|Linux Foundation/i,
  'anthropic': /Anthropic|アンスロピック/i,
  'uipath': /UiPath|ユーアイパス/i,
  'certify': /サーティファイ|Certify/i,
  'python_association': /Pythonエンジニア育成推進協会|pythonic-exam/i,
  'pmaj': /PMAJ|プロジェクトマネジメント協会/i,
  'pmi': /Project Management Institute|PMI/i,
  'isaca': /ISACA|情報システムコントロール協会/i,
  'peoplecert': /PeopleCert|AXELOS/i,
  'fortinet': /Fortinet|フォーティネット/i,
  'palo_alto': /Palo Alto|パロアルト/i,
  'ntt_at': /NTT.?AT|アドバンステクノロジ/i,
};

function hashContent(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

let totalUpdated = 0;
let totalSkipped = 0;

for (const [providerKey, stateFile] of Object.entries(PROVIDER_STATE_MAP)) {
  const statePath = path.join(DATA_DIR, stateFile);
  let state = [];

  // 既存状態ファイルを読み込む
  if (fs.existsSync(statePath)) {
    try {
      state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    } catch (e) {
      console.warn(`[${providerKey}] 状態ファイルの読み込みに失敗: ${e.message}`);
      state = [];
    }
  }

  const matchPattern = PROVIDER_MATCH[providerKey];
  const providerRows = rows.filter(row => matchPattern.test(row.providerName));

  if (providerRows.length === 0) {
    console.log(`[${providerKey}] qualifications.tsv に該当行なし → スキップ`);
    totalSkipped++;
    continue;
  }

  let updated = false;
  for (const row of providerRows) {
    // Oracle は 403 エラーのためスキップ（AGENTS.md規定）
    if (providerKey === 'oracle') {
      console.log(`  [skip] Oracle No.${row.no} ${row.name} (403エラーのためスキップ)`);
      continue;
    }

    const meta = resolveProviderDetailsMeta(row.providerName, row.name, row.url);
    if (!meta) {
      console.warn(`  [warn] No.${row.no} ${row.name}: METAデータが見つかりません`);
      continue;
    }

    // 既存の状態エントリを探す（URLまたはqualifications[].noで照合）
    let existingIdx = state.findIndex(item => {
      if (item.url === row.url) return true;
      if (item.relatedQualifications && item.relatedQualifications.some(q => q.no === row.no)) return true;
      return false;
    });

    const details = {};
    for (const field of DETAIL_FIELDS) {
      details[field] = meta[field] || '';
    }

    const detailsHash = hashContent(JSON.stringify(details));

    if (existingIdx >= 0) {
      // 既存エントリに詳細情報を追加・更新
      const existing = state[existingIdx];
      let changed = false;
      for (const field of DETAIL_FIELDS) {
        if (!existing[field] && details[field]) {
          existing[field] = details[field];
          changed = true;
        }
      }
      if (!existing.contentHash) {
        existing.contentHash = detailsHash;
        changed = true;
      }
      if (changed) {
        updated = true;
        console.log(`  [update] No.${row.no} ${row.name}`);
      }
    } else {
      // 新しいエントリを追加
      state.push({
        provider: row.providerName,
        title: `${row.name} 資格詳細情報`,
        url: row.url,
        date: '',
        description: meta.introduction || `${row.name} の公式資格詳細情報`,
        ...details,
        contentHash: detailsHash,
        detailsOnly: true,
        relatedQualifications: [{ no: row.no, name: row.name }],
      });
      updated = true;
      console.log(`  [new] No.${row.no} ${row.name}`);
    }
  }

  if (updated) {
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n', 'utf8');
    console.log(`[${providerKey}] ${stateFile} を更新しました (${state.length}件)`);
    totalUpdated++;
  } else {
    console.log(`[${providerKey}] 変更なし`);
  }
}

console.log(`\n=== 状態ファイル更新完了: 更新 ${totalUpdated}件、スキップ ${totalSkipped}件 ===`);
console.log('\n--- qualifications.tsv の I列〜P列を更新 ---');

// qualifications.tsv を更新
const tsvContent = fs.readFileSync(TSV_PATH, 'utf8');
const tsvLines = tsvContent.split(/\r?\n/);
const header = tsvLines[0];
const headerCols = header.split('\t');

// ヘッダーの列数を確認（16列: A〜P）
console.log(`ヘッダー列数: ${headerCols.length}`);

let tsvUpdated = 0;

for (let i = 1; i < tsvLines.length; i++) {
  if (!tsvLines[i].trim()) continue;
  const cols = tsvLines[i].split('\t');
  const no = Number(cols[0]);
  const providerName = cols[1] || '';
  const qualName = cols[2] || '';
  const url = cols[3] || '';

  const meta = resolveProviderDetailsMeta(providerName, qualName, url);
  if (!meta) continue;

  // Oracle はスキップ
  if (/Oracle|オラクル/i.test(providerName)) continue;

  // I列(8) 〜 P列(15) に値を設定
  // 既に値がある場合はスキップ（上書きしない）
  while (cols.length < 16) cols.push('');

  const fields = [
    { idx: 8, key: 'category' },
    { idx: 9, key: 'examDuration' },
    { idx: 10, key: 'examFormat' },
    { idx: 11, key: 'cost' },
    { idx: 12, key: 'testingOptions' },
    { idx: 13, key: 'introduction' },
    { idx: 14, key: 'examContent' },
    { idx: 15, key: 'contentOutline' },
  ];

  let rowUpdated = false;
  for (const { idx, key } of fields) {
    if (!cols[idx] && meta[key]) {
      cols[idx] = meta[key].replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
      rowUpdated = true;
    }
  }

  if (rowUpdated) {
    tsvLines[i] = cols.join('\t');
    tsvUpdated++;
  }
}

fs.writeFileSync(TSV_PATH, tsvLines.join('\n'), 'utf8');
console.log(`qualifications.tsv: ${tsvUpdated} 行の I列〜P列を更新しました`);
