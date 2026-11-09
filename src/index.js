const { fetchIpaNews } = require('./fetcher/ipa');
const { fetchAwsNews } = require('./fetcher/aws');
const { fetchMicrosoftCertifications } = require('./fetcher/microsoft');
const { fetchLpiNews, fetchLinucNews } = require('./fetcher/lpi');
const { fetchCiscoNews } = require('./fetcher/cisco');
const { fetchGoogleCloudNews } = require('./fetcher/google_cloud');
const { fetchOracleNews } = require('./fetcher/oracle');
const { fetchBroadcomUpdates } = require('./fetcher/broadcom');
const { fetchCompTIANews } = require('./fetcher/comptia');
const { fetchCNCFNews } = require('./fetcher/cncf');
const { fetchAnthropicUpdates } = require('./fetcher/anthropic');
const { fetchUiPathUpdates } = require('./fetcher/uipath');
const { fetchCertifyUpdates } = require('./fetcher/certify');
const { fetchPythonAssociationUpdates } = require('./fetcher/python_association');
const { fetchPmajUpdates } = require('./fetcher/pmaj');
const { fetchPmiUpdates } = require('./fetcher/pmi');
const { fetchIsacaUpdates } = require('./fetcher/isaca');
const { fetchPeopleCertUpdates } = require('./fetcher/peoplecert');
const { fetchFortinetUpdates } = require('./fetcher/fortinet');
const { fetchPaloAltoUpdates } = require('./fetcher/palo_alto');
const { fetchNttAtUpdates } = require('./fetcher/ntt_at');
const {
  loadProviderState,
  saveProviderState,
  mergeProviderItems,
  detectDiff,
  isWeekdayJST,
  sendSlackNotification,
  notifySlackUpdates,
} = require('./checker');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * プロバイダー定義
 */
const PROVIDERS = {
  ipa: {
    name: 'IPA（情報処理推進機構）',
    fetch: fetchIpaNews,
    idKey: 'url',
    updateKey: null,
  },
  aws: {
    name: 'Amazon Web Services (AWS)',
    fetch: fetchAwsNews,
    idKey: 'url',
    updateKey: null,
  },
  microsoft: {
    name: 'Microsoft（マイクロソフト）',
    fetch: fetchMicrosoftCertifications,
    idKey: 'uid',
    updateKey: 'lastModified',
  },
  lpi: {
    name: 'LPI & LPI-Japan (Linux / OSS)',
    fetch: async () => {
      const lpiItems = await fetchLpiNews();
      await sleep(1000);
      const linucItems = await fetchLinucNews();
      return [...lpiItems, ...linucItems];
    },
    idKey: 'url',
    updateKey: null,
  },
  cisco: {
    name: 'Cisco Systems',
    fetch: fetchCiscoNews,
    idKey: 'url',
    updateKey: null,
  },
  google_cloud: {
    name: 'Google Cloud',
    fetch: fetchGoogleCloudNews,
    idKey: 'url',
    updateKey: null,
  },
  oracle: {
    name: 'Oracle',
    fetch: fetchOracleNews,
    idKey: 'url',
    updateKey: null,
  },
  broadcom: {
    name: 'Broadcom (VMware)',
    fetch: fetchBroadcomUpdates,
    idKey: 'url',
    updateKey: 'contentHash',
  },
  comptia: {
    name: 'CompTIA',
    fetch: fetchCompTIANews,
    idKey: 'url',
    updateKey: 'contentHash',
  },
  cncf: {
    name: 'CNCF & Linux Foundation',
    fetch: fetchCNCFNews,
    idKey: 'url',
    updateKey: 'contentHash',
  },
  anthropic: {
    name: 'Anthropic',
    fetch: fetchAnthropicUpdates,
    idKey: 'url',
    updateKey: 'contentHash',
  },
  uipath: {
    name: 'UiPath',
    fetch: fetchUiPathUpdates,
    idKey: 'url',
    updateKey: 'contentHash',
  },
  certify: {
    name: 'サーティファイ',
    fetch: fetchCertifyUpdates,
    idKey: 'url',
    updateKey: 'contentHash',
  },
  python_association: {
    name: 'Pythonエンジニア育成推進協会',
    fetch: fetchPythonAssociationUpdates,
    idKey: 'url',
    updateKey: 'contentHash',
  },
  pmaj: {
    name: '日本プロジェクトマネジメント協会 (PMAJ)',
    fetch: fetchPmajUpdates,
    idKey: 'url',
    updateKey: 'contentHash',
  },
  pmi: {
    name: 'Project Management Institute (PMI)',
    fetch: fetchPmiUpdates,
    idKey: 'url',
    updateKey: 'contentHash',
  },
  isaca: {
    name: 'ISACA',
    fetch: fetchIsacaUpdates,
    idKey: 'url',
    updateKey: 'contentHash',
  },
  peoplecert: {
    name: 'PeopleCert',
    fetch: fetchPeopleCertUpdates,
    idKey: 'url',
    updateKey: 'contentHash',
  },
  fortinet: {
    name: 'Fortinet',
    fetch: fetchFortinetUpdates,
    idKey: 'url',
    updateKey: 'contentHash',
  },
  palo_alto: {
    name: 'Palo Alto Networks',
    fetch: fetchPaloAltoUpdates,
    idKey: 'url',
    updateKey: 'contentHash',
  },
  ntt_at: {
    name: 'NTTアドバンステクノロジ (NTT-AT)',
    fetch: fetchNttAtUpdates,
    idKey: 'url',
    updateKey: 'contentHash',
  },
};

/**
 * 単一プロバイダーの監視を実行
 */
async function runProviderMonitor(key, provider) {
  console.log(`\n========================================`);
  console.log(`▶ [${provider.name}] 情報取得中...`);
  console.log(`========================================`);

  try {
    const currentItems = await provider.fetch();
    console.log(`取得完了: ${currentItems.length} 件`);

    const prevState = loadProviderState(key);
    const isInitialRun = prevState.length === 0;

    if (isInitialRun) {
      console.log(`初回実行のため、現在のデータをベースラインとして保存します。`);
      saveProviderState(key, currentItems);

      // 上位3件をサンプル表示
      console.log(`\n--- 最新アイテム（抜粋） ---`);
      currentItems.slice(0, 3).forEach((item, idx) => {
        const title = item.title || item.name;
        const date = item.date || item.lastModified || '日付なし';
        const quals = (item.relatedQualifications || []).map(q => q.name).join(', ') || '全体/その他';
        console.log(`[${idx + 1}] ${date} | 【${quals}】`);
        console.log(`     ${title}`);
        console.log(`     ${item.url}\n`);
      });
      return { key, count: currentItems.length, diffCount: 0, items: currentItems };
    }

    // 差分検知
    const diffs = detectDiff(currentItems, prevState, provider.idKey, provider.updateKey);

    if (diffs.length === 0) {
      console.log('✓ 新着・更新情報はありませんでした。（変更なし）');
    } else {
      console.log(`\n🔔 【更新検知】 ${diffs.length} 件の新しい資格情報が確認されました！`);
      diffs.forEach((item, idx) => {
        const title = item.title || item.name;
        const date = item.date || item.lastModified || '日付なし';
        const quals = (item.relatedQualifications || []).map(q => q.name).join(', ') || '全体/その他';
        const typeStr = item._diffType === 'UPDATED' ? '【更新】' : '【新着】';
        console.log(`\n${typeStr} [${idx + 1}]`);
        console.log(`日付: ${date}`);
        console.log(`対象資格: ${quals}`);
        console.log(`タイトル: ${title}`);
        console.log(`URL: ${item.url}`);
      });

      // 状態ファイルを更新
      saveProviderState(key, currentItems);
      console.log('状態ファイルを最新に更新しました。');

      // Slack通知（環境変数 SLACK_WEBHOOK_URL が設定されている場合）
      const webhookUrl = process.env.SLACK_WEBHOOK_URL;
      if (webhookUrl) {
        const qualificationUpdates = [];
        diffs.forEach(item => {
          const qualifications = item.relatedQualifications || [];
          if (qualifications.length > 0) {
            qualifications.forEach(q => {
              qualificationUpdates.push({
                qualificationName: q.name,
                no: q.no,
                date: item.date || item.lastModified || '',
                title: item.title || item.name || '',
                url: item.url || '',
                description: item.description || item.summary || item.title || '',
                provider: provider.name,
              });
            });
          } else {
            qualificationUpdates.push({
              qualificationName: provider.name,
              date: item.date || item.lastModified || '',
              title: item.title || item.name || '',
              url: item.url || '',
              description: item.description || item.summary || item.title || '',
              provider: provider.name,
            });
          }
        });
        if (qualificationUpdates.length > 0) {
          console.log(`Slackへ ${qualificationUpdates.length} 件の更新情報を個別に投稿中...`);
          await notifySlackUpdates(qualificationUpdates, webhookUrl, 1000);
          console.log('Slackへの投稿が完了しました。');
        }
      }
    }

    return { key, count: currentItems.length, diffCount: diffs.length, items: currentItems };

  } catch (error) {
    console.error(`❌ [${provider.name}] の処理中にエラーが発生しました:`, error.message);
    return { key, error: error.message };
  }
}

/**
 * メインエントリポイント
 */
async function main() {
  console.log('########################################');
  console.log('# 資格情報 更新監視バッチ 実行開始');
  console.log(`# 実行日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`);
  console.log('########################################');

  const isWeekdayOnly = process.argv.includes('--weekday-only');
  if (isWeekdayOnly && !isWeekdayJST()) {
    console.log('本日は土日（休日）のため、平日定期収集をスキップします。');
    return;
  }

  // コマンドライン引数で対象プロバイダーを指定可能（例: --provider=aws）
  const targetArg = process.argv.find(arg => arg.startsWith('--provider='));
  const targetProvider = targetArg ? targetArg.split('=')[1].toLowerCase() : null;
  const runAllProviders = !targetProvider || !PROVIDERS[targetProvider];

  const entries = !runAllProviders
    ? [[targetProvider, PROVIDERS[targetProvider]]]
    : Object.entries(PROVIDERS);
  const results = [];
  const failures = [];

  for (let i = 0; i < entries.length; i++) {
    const [key, provider] = entries[i];
    const result = await runProviderMonitor(key, provider);
    if (result.items) {
      results.push(result);
    } else {
      failures.push(result);
    }

    // プロバイダー間にインターバルを設ける（負荷軽減）
    if (i < entries.length - 1) {
      console.log('...アクセス間隔を空けています (1.5秒)...');
      await sleep(1500);
    }
  }

  if (runAllProviders) {
    if (failures.length > 0) {
      console.error(`全ベンダー統合ファイルは更新しませんでした。取得失敗: ${failures.map(result => result.key).join(', ')}`);
      process.exitCode = 1;
    } else {
      const allItems = mergeProviderItems(results.map(result => result.items));
      saveProviderState('all', allItems);
      console.log(`全ベンダー統合ファイルを保存しました: data/all_state.json (${allItems.length} 件)`);
    }
  }

  console.log('\n########################################');
  console.log('# 全プロバイダーの監視処理が完了しました');
  console.log('########################################');
}

if (require.main === module) {
  main();
}

module.exports = { main, PROVIDERS };
