const fs = require('fs');

const CISCO_EXAM_PAGES = {
  'ccna': 'https://www.cisco.com/c/ja_jp/training-events/training-certifications/exams/current-list/ccna-200-301.html',
  '200-301': 'https://www.cisco.com/c/ja_jp/training-events/training-certifications/exams/current-list/ccna-200-301.html',
  'encor': 'https://www.cisco.com/c/ja_jp/training-events/training-certifications/exams/current-list/encor-350-401.html',
  '350-401': 'https://www.cisco.com/c/ja_jp/training-events/training-certifications/exams/current-list/encor-350-401.html',
  'enarsi': 'https://www.cisco.com/c/ja_jp/training-events/training-certifications/exams/current-list/enarsi-300-410.html',
  '300-410': 'https://www.cisco.com/c/ja_jp/training-events/training-certifications/exams/current-list/enarsi-300-410.html',
  'ensdwi': 'https://www.cisco.com/c/ja_jp/training-events/training-certifications/exams/current-list/ensdwi-300-415.html',
  '300-415': 'https://www.cisco.com/c/ja_jp/training-events/training-certifications/exams/current-list/ensdwi-300-415.html',
  'ensld': 'https://www.cisco.com/c/ja_jp/training-events/training-certifications/exams/current-list/ensld-300-420.html',
  '300-420': 'https://www.cisco.com/c/ja_jp/training-events/training-certifications/exams/current-list/ensld-300-420.html',
  'enwlsd': 'https://www.cisco.com/c/ja_jp/training-events/training-certifications/exams/current-list/enwlsd-300-425.html',
  '300-425': 'https://www.cisco.com/c/ja_jp/training-events/training-certifications/exams/current-list/enwlsd-300-425.html',
  'enwlsi': 'https://www.cisco.com/c/ja_jp/training-events/training-certifications/exams/current-list/enwlsi-300-430.html',
  '300-430': 'https://www.cisco.com/c/ja_jp/training-events/training-certifications/exams/current-list/enwlsi-300-430.html',
  'enauto': 'https://www.cisco.com/c/ja_jp/training-events/training-certifications/exams/current-list/enauto-300-435.html',
  '300-435': 'https://www.cisco.com/c/ja_jp/training-events/training-certifications/exams/current-list/enauto-300-435.html',
  'ccnp-enterprise': 'https://www.cisco.com/c/ja_jp/training-events/training-certifications/certifications/professional/ccnp-enterprise.html',
  'ccie-enterprise': 'https://www.cisco.com/c/ja_jp/training-events/training-certifications/certifications/expert/ccie-enterprise-infrastructure.html',
};

// 各試験ごとの固有メタデータ（費用、詳細出題比率など）
const CISCO_META = {
  '200-301': {
    category: 'Associate',
    cost: '300 USD（約45,000円）',
    examDuration: '120分',
    examFormat: '多肢選択式（単一・複数選択）、ドラッグ＆ドロップ、シミュレーション',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン監督付き試験（OnVUE）',
    contentOutline: '【出題分野】1.0 ネットワークの基礎 (20%)、2.0 ネットワークアクセス (20%)、3.0 IPコネクティビティ (25%)、4.0 IPサービス (10%)、5.0 セキュリティの基礎 (15%)、6.0 自動化とプログラマビリティ (10%)',
  },
  '350-401': {
    category: 'Professional / Expert（コア試験）',
    cost: '400 USD（約60,000円）',
    examDuration: '120分',
    examFormat: '多肢選択式（単一・複数選択）、ドラッグ＆ドロップ、シミュレーション',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン監督付き試験（OnVUE）',
    contentOutline: '【出題分野】1.0 アーキテクチャ (15%)、2.0 仮想化 (10%)、3.0 インフラストラクチャ (30%)、4.0 ネットワークアシュアランス (10%)、5.0 セキュリティ (20%)、6.0 自動化 (15%)。CCNP Enterprise および CCIE Enterprise のコア要件。',
  },
  '300-410': {
    category: 'Professional（コンセントレーション試験）',
    cost: '300 USD（約45,000円）',
    examDuration: '90分',
    examFormat: '多肢選択式（単一・複数選択）、ドラッグ＆ドロップ、シミュレーション',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン監督付き試験（OnVUE）',
    contentOutline: '【出題分野】1.0 レイヤ3技術 (35%)、2.0 VPNサービス (20%)、3.0 インフラストラクチャセキュリティ (20%)、4.0 インフラストラクチャサービス (25%)',
  },
  '300-415': {
    category: 'Professional（コンセントレーション試験）',
    cost: '300 USD（約45,000円）',
    examDuration: '90分',
    examFormat: '多肢選択式（単一・複数選択）、ドラッグ＆ドロップ、シミュレーション',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン監督付き試験（OnVUE）',
    contentOutline: '【出題分野】1.0 Cisco SD-WANアーキテクチャ (20%)、2.0 コントローラ導入 (15%)、3.0 WANエッジルータ導入 (20%)、4.0 ポリシー (20%)、5.0 セキュリティとQoS (15%)、6.0 管理と運用 (10%)',
  },
  '300-420': {
    category: 'Professional（コンセントレーション試験）',
    cost: '300 USD（約45,000円）',
    examDuration: '90分',
    examFormat: '多肢選択式（単一・複数選択）、ドラッグ＆ドロップ、シミュレーション',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン監督付き試験（OnVUE）',
    contentOutline: '【出題分野】1.0 高度なアドレス指定およびルーティングソリューション (25%)、2.0 高度なエンタープライズキャンパスネットワーク (25%)、3.0 WAN (20%)、4.0 ネットワークサービス (20%)、5.0 自動化 (10%)',
  },
  '300-425': {
    category: 'Professional（コンセントレーション試験）',
    cost: '300 USD（約45,000円）',
    examDuration: '90分',
    examFormat: '多肢選択式（単一・複数選択）、ドラッグ＆ドロップ、シミュレーション',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン監督付き試験（OnVUE）',
    contentOutline: '【出題分野】1.0 ワイヤレスサイト調査 (25%)、2.0 有線およびワイヤレスインフラストラクチャ設計 (30%)、3.0 モビリティ設計 (25%)、4.0 WLANの高可用性 (20%)',
  },
  '300-430': {
    category: 'Professional（コンセントレーション試験）',
    cost: '300 USD（約45,000円）',
    examDuration: '90分',
    examFormat: '多肢選択式（単一・複数選択）、ドラッグ＆ドロップ、シミュレーション',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン監督付き試験（OnVUE）',
    contentOutline: '【出題分野】1.0 FlexConnect (15%)、2.0 QoS (10%)、3.0 マルチキャスト (10%)、4.0 高度なロケーションサービス (10%)、5.0 クライアント接続のセキュリティ (20%)、6.0 デバイスとインフラの監視 (15%)、7.0 デバイスの保守とトラブルシューティング (20%)',
  },
  '300-435': {
    category: 'Professional（コンセントレーション試験）',
    cost: '300 USD（約45,000円）',
    examDuration: '90分',
    examFormat: '多肢選択式（単一・複数選択）、ドラッグ＆ドロップ、シミュレーション',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン監督付き試験（OnVUE）',
    contentOutline: '【出題分野】1.0 ネットワークプログラマビリティの基礎 (15%)、2.0 Cisco DNA Center (20%)、3.0 Cisco SD-WAN (15%)、4.0 Cisco ISE (15%)、5.0 Cisco Meraki (15%)、6.0 ネットワークデバイスプログラマビリティ (20%)',
  },
  'ccnp-enterprise': {
    category: 'Professional',
    cost: '700 USD（コア試験 400 USD + コンセントレーション試験 300 USD）',
    examDuration: 'コア試験: 120分、コンセントレーション試験: 90分',
    examFormat: '多肢選択式（単一・複数選択）、ドラッグ＆ドロップ、シミュレーション',
    testingOptions: 'ピアソンVUE テストセンターまたはオンライン監督付き試験（OnVUE）',
    contentOutline: '【認定要件】コア試験（350-401 ENCOR）合格、および以下のコンセントレーション試験のうちいずれか1つに合格: 300-410 ENARSI、300-415 ENSDWI、300-420 ENSLD、300-425 ENWLSD、300-430 ENWLSI、300-435 ENAUTO。',
  },
  'ccie-enterprise': {
    category: 'Expert',
    cost: '2,000 USD（コア試験 400 USD + ラボ試験 1,600 USD）',
    examDuration: 'クオリファイ試験: 120分、実技ラボ試験: 8時間',
    examFormat: '筆記試験（多肢選択式等）および実技ラボ試験（ハンズオン実機環境）',
    testingOptions: 'ピアソンVUE テストセンター（クオリファイ試験）/ シスコ ラボ試験会場（実技試験）',
    contentOutline: '【認定要件】ステップ1: クオリファイ試験（350-401 ENCOR）合格、ステップ2: CCIE Enterprise Infrastructure v1.1 実技ラボ試験（8時間）合格。ネットワークの設計・導入・運用・最適化のライフサイクル全体を検証。',
  }
};

function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseCiscoExamPage(html, url = '', qualificationName = '') {
  // コード判定
  let code = '';
  const m = qualificationName.match(/\b(200-301|350-401|300-410|300-415|300-420|300-425|300-430|300-435)\b/i)
    || url.match(/\b(200-301|350-401|300-410|300-415|300-420|300-425|300-430|300-435)\b/i)
    || qualificationName.match(/\b(CCNA|ENCOR|ENARSI|ENSDWI|ENSLD|ENWLSI|ENAUTO|ENWLSD|CCNP|CCIE)\b/i)
    || url.match(/\b(ccna|encor|enarsi|ensdwi|ensld|enwlsi|enauto|enwlsd|ccnp|ccie)\b/i);

  if (m) {
    const raw = m[1].toLowerCase();
    if (raw.includes('200-301') || raw === 'ccna') code = '200-301';
    else if (raw.includes('350-401') || raw === 'encor') code = '350-401';
    else if (raw.includes('300-410') || raw === 'enarsi') code = '300-410';
    else if (raw.includes('300-415') || raw === 'ensdwi') code = '300-415';
    else if (raw.includes('300-420') || raw === 'ensld') code = '300-420';
    else if (raw.includes('300-425') || raw === 'enwlsd') code = '300-425';
    else if (raw.includes('300-430') || raw === 'enwlsi') code = '300-430';
    else if (raw.includes('300-435') || raw === 'enauto') code = '300-435';
    else if (raw.includes('ccnp')) code = 'ccnp-enterprise';
    else if (raw.includes('ccie')) code = 'ccie-enterprise';
  }

  const meta = CISCO_META[code] || {};

  // 1. はじめに（タイトル、meta description、リード文）
  let intro = '';
  const metaDesc = html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  if (metaDesc) {
    intro = cleanText(metaDesc[1]);
  }
  if (!intro) {
    const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
    intro = h1 ? `${cleanText(h1[1])} の公式試験・認定プログラムです。` : `${qualificationName} の公式認定資格です。`;
  }

  // 2. 試験内容
  let examContent = '';
  // 「試験の概要」セクション
  const overviewMatch = html.match(/<h2\b[^>]*>[^<]*試験の概要[^<]*<\/h2>([\s\S]*?)(?=<h2\b|<div\b[^>]*class=["'][^"']*footer|$)/i);
  if (overviewMatch) {
    examContent = cleanText(overviewMatch[1]);
  }
  if (!examContent) {
    const pMatch = html.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>\s*<p\b[^>]*>([\s\S]*?)<\/p>/i);
    if (pMatch) examContent = cleanText(pMatch[2]);
  }

  // 3. 試験時間
  let duration = meta.examDuration || '';
  const durMatch = html.match(/試験時間[：:]\s*([^<]+)/i);
  if (durMatch) {
    duration = cleanText(durMatch[1]);
  }

  return {
    category: meta.category || 'Professional',
    examDuration: duration,
    examFormat: meta.examFormat || '多肢選択式（単一・複数選択）、ドラッグ＆ドロップ、シミュレーション',
    cost: meta.cost || '300 USD',
    testingOptions: meta.testingOptions || 'ピアソンVUE テストセンターまたはオンライン監督付き試験（OnVUE）',
    introduction: intro,
    examContent: examContent || intro,
    contentOutline: meta.contentOutline || '',
  };
}

async function testAll() {
  const targets = [
    { no: 92, name: 'CCNA (200-301)', key: '200-301' },
    { no: 93, name: 'ENCOR (350-401)', key: '350-401' },
    { no: 94, name: 'ENARSI (300-410)', key: '300-410' },
    { no: 95, name: 'ENSDWI (300-415)', key: '300-415' },
    { no: 96, name: 'ENSLD (300-420)', key: '300-420' },
    { no: 97, name: 'ENWLSI (300-425)', key: '300-425' },
    { no: 98, name: 'ENAUTO (300-435)', key: '300-435' },
    { no: 99, name: 'ENWLSD (300-430)', key: '300-430' },
    { no: 100, name: 'CCNP Enterprise', key: 'ccnp-enterprise' },
    { no: 101, name: 'CCIE Enterprise Infrastructure', key: 'ccie-enterprise' },
  ];

  for (const t of targets) {
    const url = CISCO_EXAM_PAGES[t.key];
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 certificateInfo-bot/1.0' } });
    const html = await res.text();
    const details = parseCiscoExamPage(html, url, t.name);
    console.log(`\n---------------- [No.${t.no}] ${t.name} ----------------`);
    console.log('カテゴリ:', details.category);
    console.log('試験期間:', details.examDuration);
    console.log('試験の形態:', details.examFormat);
    console.log('費用:', details.cost);
    console.log('受験オプション:', details.testingOptions);
    console.log('はじめに:', details.introduction.slice(0, 100) + '...');
    console.log('試験内容:', details.examContent.slice(0, 100) + '...');
    console.log('試験内容の概要:', details.contentOutline.slice(0, 100) + '...');
  }
}

testAll().catch(console.error);
