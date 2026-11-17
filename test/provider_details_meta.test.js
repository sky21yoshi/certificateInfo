/**
 * 全プロバイダー詳細メタデータ（I列〜P列）のテスト
 * provider_details_meta.js の resolveProviderDetailsMeta 関数と
 * qualification_details.js の parseCredentialDetails への統合を検証
 */
const assert = require('assert');
const { resolveProviderDetailsMeta, PROVIDER_DETAILS_META } = require('../src/fetcher/provider_details_meta');
const { parseCredentialDetails, DETAIL_FIELDS } = require('../src/fetcher/qualification_details');

// --- resolveProviderDetailsMeta のテスト ---

// LPI / LPI-Japan
{
  const lpic1 = resolveProviderDetailsMeta('Linux Professional Institute (LPI)', 'LPIC-1');
  assert.ok(lpic1, 'LPIC-1 のメタデータが見つかること');
  assert.ok(lpic1.category.includes('Level 1'), 'LPIC-1 のカテゴリに Level 1 が含まれること');
  assert.ok(lpic1.cost.includes('16,500'), 'LPIC-1 の費用情報が含まれること');
  assert.ok(lpic1.examDuration.includes('90分'), 'LPIC-1 の試験時間が含まれること');

  const linuc2 = resolveProviderDetailsMeta('LPI-Japan', 'LinuC-2');
  assert.ok(linuc2, 'LinuC-2 のメタデータが見つかること');
  assert.ok(linuc2.introduction.includes('クラウド'), 'LinuC-2 のはじめにが含まれること');

  const html5 = resolveProviderDetailsMeta('LPI-Japan', 'HTML5プロフェッショナル認定試験');
  assert.ok(html5, 'HTML5 のメタデータが見つかること');
  assert.ok(html5.introduction.includes('HTML5'), 'HTML5 のはじめにが含まれること');
}

// Oracle
{
  const javaBronze = resolveProviderDetailsMeta('Oracle（オラクル）', 'Oracle Certified Java Programmer, Bronze SE');
  assert.ok(javaBronze, 'Java Bronze のメタデータが見つかること');
  assert.ok(javaBronze.cost.includes('13,200'), 'Java Bronze の費用情報');

  const platinum = resolveProviderDetailsMeta('Oracle（オラクル）', 'ORACLE MASTER Platinum');
  assert.ok(platinum, 'Platinum のメタデータが見つかること');
  assert.ok(platinum.examFormat.includes('実技'), 'Platinum は実技試験');
}

// Broadcom / VMware
{
  const vcp = resolveProviderDetailsMeta('Broadcom（旧 VMware）', 'VCP(VMware Certied Professional)');
  assert.ok(vcp, 'VCP のメタデータが見つかること');
  assert.ok(vcp.cost.includes('250 USD'), 'VCP の費用情報');

  const vcdx = resolveProviderDetailsMeta('Broadcom（旧 VMware）', 'VCDX(VMware Certified Design Expert)');
  assert.ok(vcdx, 'VCDX のメタデータが見つかること');
  assert.ok(vcdx.category.includes('Expert'), 'VCDX はExpert');
}

// CompTIA
{
  const security = resolveProviderDetailsMeta('CompTIA（コンプティア）', 'Security+');
  assert.ok(security, 'Security+ のメタデータが見つかること');
  assert.ok(security.cost.includes('55,440'), 'Security+ の費用情報');

  const casp = resolveProviderDetailsMeta('CompTIA（コンプティア）', 'CASP');
  assert.ok(casp, 'CASP のメタデータが見つかること');
  assert.ok(casp.examDuration.includes('165'), 'CASP の試験時間');

  const cloudEssentials = resolveProviderDetailsMeta('CompTIA（コンプティア）', 'Cloud Essentials');
  assert.ok(cloudEssentials, 'Cloud Essentials のメタデータが見つかること');
}

// CNCF
{
  const cka = resolveProviderDetailsMeta('Cloud Native Computing Foundation (CNCF) / Linux Foundation', '認定Kubernetes管理者（CKA-JP）');
  assert.ok(cka, 'CKA のメタデータが見つかること');
  assert.ok(cka.examFormat.includes('実技'), 'CKA は実技試験');
  assert.ok(cka.cost.includes('395 USD'), 'CKA の費用情報');
}

// Anthropic
{
  const ccaoF = resolveProviderDetailsMeta('Anthropic（アンスロピック）', 'Claude Certified Associate – Foundations（CCAO-F）');
  assert.ok(ccaoF, 'CCAO-F のメタデータが見つかること');
  assert.ok(ccaoF.introduction.includes('Claude'), 'CCAO-F のはじめに');

  const ccarP = resolveProviderDetailsMeta('Anthropic（アンスロピック）', 'Claude Certified Architect – Professional（CCAR-P）');
  assert.ok(ccarP, 'CCAR-P のメタデータが見つかること');
  assert.ok(ccarP.category.includes('Professional'), 'CCAR-P はProfessional');
}

// UiPath
{
  const devAssoc = resolveProviderDetailsMeta('UiPath（ユーアイパス）', 'UiPath Automation Developer Associate');
  assert.ok(devAssoc, 'UiPath Automation Developer Associate のメタデータが見つかること');
  assert.ok(devAssoc.cost.includes('150 USD'), 'UiPath Associate の費用情報');
}

// サーティファイ
{
  const c3 = resolveProviderDetailsMeta('サーティファイ（Certify）', 'C言語プログラミング能力検定試験3級');
  assert.ok(c3, 'C言語3級 のメタデータが見つかること');
  assert.ok(c3.cost.includes('5,400'), 'C言語3級 の費用情報');

  const c1 = resolveProviderDetailsMeta('サーティファイ（Certify）', 'C言語プログラミング能力検定試験1級');
  assert.ok(c1, 'C言語1級 のメタデータが見つかること');
  assert.ok(c1.examFormat.includes('実技'), 'C言語1級 は実技試験');
}

// Python
{
  const basic = resolveProviderDetailsMeta('一般社団法人Pythonエンジニア育成推進協会', 'Python3 エンジニア認定基礎試験');
  assert.ok(basic, 'Python基礎試験 のメタデータが見つかること');
  assert.ok(basic.cost.includes('11,000'), 'Python基礎試験 の費用情報');
}

// PMAJ
{
  const pmc = resolveProviderDetailsMeta('一般社団法人日本プロジェクトマネジメント協会（PMAJ）', 'プロジェクトマネジメント・コーディネーター(PMC)');
  assert.ok(pmc, 'PMC のメタデータが見つかること');
  assert.ok(pmc.cost.includes('11,000'), 'PMC の費用情報');
}

// PMI
{
  const pmp = resolveProviderDetailsMeta('Project Management Institute (PMI)', 'PMP試験');
  assert.ok(pmp, 'PMP のメタデータが見つかること');
  assert.ok(pmp.examDuration.includes('230'), 'PMP の試験時間');
}

// ISACA
{
  const cisa = resolveProviderDetailsMeta('ISACA（情報システムコントロール協会）', 'CISA（Certified Information Systems Auditor）');
  assert.ok(cisa, 'CISA のメタデータが見つかること');
  assert.ok(cisa.examDuration.includes('240'), 'CISA の試験時間');
}

// PeopleCert
{
  const itil = resolveProviderDetailsMeta('PeopleCert（AXELOS）', 'ITIL Foundation');
  assert.ok(itil, 'ITIL Foundation のメタデータが見つかること');
  assert.ok(itil.examFormat.includes('40問'), 'ITIL Foundation の問題数');
}

// Fortinet
{
  const fcp = resolveProviderDetailsMeta('Fortinet（フォーティネット）', 'Fortinet / FCP Certified Professional');
  assert.ok(fcp, 'FCP のメタデータが見つかること');
  assert.ok(fcp.contentOutline.includes('ファイアウォール'), 'FCP の出題内容');
}

// Palo Alto
{
  const pa = resolveProviderDetailsMeta('Palo Alto Networks（パロアルトネットワークス）', 'Paloalto / Network Security Professional');
  assert.ok(pa, 'Palo Alto のメタデータが見つかること');
  assert.ok(pa.examContent.includes('App-ID'), 'Palo Alto の試験内容');
}

// NTT-AT / WinActor
{
  const assoc = resolveProviderDetailsMeta('NTTアドバンステクノロジ（NTT-AT）', 'WinActor RPA技術者検定アソシエイト');
  assert.ok(assoc, 'WinActor アソシエイト のメタデータが見つかること');
  assert.ok(assoc.cost.includes('7,700'), 'WinActor アソシエイト の費用情報');

  const expert = resolveProviderDetailsMeta('NTTアドバンステクノロジ（NTT-AT）', 'WinActor RPA技術者検定エキスパート');
  assert.ok(expert, 'WinActor エキスパート のメタデータが見つかること');
  assert.ok(expert.examFormat.includes('実技'), 'WinActor エキスパート は実技試験');
}

// --- parseCredentialDetails への統合テスト ---

// HTMLからは何も取れないがMETAデータでI〜P列が補完されることを確認
{
  const minimalHtml = '<html><head><title>Test</title></head><body><p>Test page</p></body></html>';
  const details = parseCredentialDetails(
    minimalHtml,
    'CompTIA（コンプティア）',
    'https://www.comptia.jp/certif/core/comptia_security/',
    'Security+'
  );
  assert.ok(details.category, 'parseCredentialDetails でカテゴリが取得できること');
  assert.ok(details.cost, 'parseCredentialDetails で費用が取得できること');
  assert.ok(details.examDuration, 'parseCredentialDetails で試験時間が取得できること');
  assert.ok(details.examFormat, 'parseCredentialDetails で試験形態が取得できること');
  assert.ok(details.testingOptions, 'parseCredentialDetails で受験オプションが取得できること');
  assert.ok(details.introduction, 'parseCredentialDetails ではじめにが取得できること');
  assert.ok(details.examContent, 'parseCredentialDetails で試験内容が取得できること');
  assert.ok(details.contentOutline, 'parseCredentialDetails で試験内容の概要が取得できること');

  // CNCF でも同様に動作すること
  const cncfDetails = parseCredentialDetails(
    minimalHtml,
    'Cloud Native Computing Foundation (CNCF) / Linux Foundation',
    'https://training.linuxfoundation.org/ja/certification/certified-kubernetes-administrator-cka/',
    '認定Kubernetes管理者（CKA-JP）'
  );
  assert.ok(cncfDetails.examFormat.includes('実技'), 'CKA の試験形態に実技が含まれること');
  assert.ok(cncfDetails.cost.includes('395'), 'CKA の費用情報が含まれること');
}

// 全メタデータキーが DETAIL_FIELDS の8項目をすべて持つことを確認
{
  const metaKeys = Object.keys(PROVIDER_DETAILS_META);
  for (const key of metaKeys) {
    const meta = PROVIDER_DETAILS_META[key];
    for (const field of DETAIL_FIELDS) {
      assert.ok(typeof meta[field] === 'string' && meta[field].length > 0,
        `PROVIDER_DETAILS_META['${key}'] の ${field} が空でないこと`);
    }
  }
}

console.log('✓ 全プロバイダー詳細メタデータ（I列〜P列）: resolveProviderDetailsMeta / parseCredentialDetails 統合テスト OK');
