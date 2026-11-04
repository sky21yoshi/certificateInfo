const { fetchIpaNews } = require('./fetcher/ipa');
const { loadPreviousState, saveCurrentState, detectDiff } = require('./checker');

async function main() {
  console.log('=== IPA 資格情報 更新監視バッチ開始 ===');
  console.log(`実行日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`);

  try {
    // 1. IPAの最新新着情報を取得
    console.log('IPA試験情報トップから新着情報を取得中...');
    const currentNews = await fetchIpaNews();
    console.log(`取得成功: ${currentNews.length} 件の新着情報`);

    // 2. 前回の状態と比較
    const previousState = loadPreviousState();
    const isInitialRun = previousState.length === 0;

    if (isInitialRun) {
      console.log('初回実行のため、現在の新着情報をベースラインとして保存します。');
      saveCurrentState(currentNews);
      console.log('\n--- 現在公開中のIPA最新お知らせ一覧 ---');
      currentNews.forEach((item, index) => {
        const quals = item.relatedQualifications.map(q => q.name).join(', ') || '全体/その他';
        console.log(`[${index + 1}] ${item.date} | 【${quals}】`);
        console.log(`     タイトル: ${item.title}`);
        console.log(`     URL: ${item.url}\n`);
      });
      return;
    }

    // 3. 差分検知
    const diffs = detectDiff(currentNews, previousState);

    if (diffs.length === 0) {
      console.log('新着・更新情報はありませんでした。（変更なし）');
    } else {
      console.log(`\n🔔 【更新検知】 ${diffs.length} 件の新しい資格情報が確認されました！`);
      diffs.forEach((item, index) => {
        const quals = item.relatedQualifications.map(q => q.name).join(', ') || '全体/その他';
        console.log(`\n[新着 ${index + 1}]`);
        console.log(`日付: ${item.date}`);
        console.log(`対象資格: ${quals}`);
        console.log(`タイトル: ${item.title}`);
        console.log(`URL: ${item.url}`);
      });

      // 状態を最新に更新
      saveCurrentState(currentNews);
      console.log('\n状態ファイルを最新に更新しました。');
    }

  } catch (error) {
    console.error('実行中にエラーが発生しました:', error.message);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
