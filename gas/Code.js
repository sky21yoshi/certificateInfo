/**
 * =========================================================================
 * certificateInfo - 主要認定機関 資格情報更新監視 & Slack通知スクリプト (GAS版)
 * =========================================================================
 * 
 * 【対応認定機関】
 * 1. IPA（情報処理推進機構）
 * 2. Amazon Web Services (AWS)
 * 3. Microsoft（Learn Catalog API）
 * 4. LPI & LPI-Japan (Linux / OSS)
 * 5. Cisco Systems (Learn with Cisco)
 * 6. Google Cloud (Training and Certifications)
 * 7. Oracle Certification
 * 8. Project Management Institute (PMI)
 * 9. ISACA
 * 10. PeopleCert
 * 11. Fortinet
 * 12. Palo Alto Networks
 * 13. NTTアドバンステクノロジ (NTT-AT)
 * 
 * 【設定手順】
 * 1. スプレッドシートのメニュー「拡張機能」>「Apps Script」を開きます。
 * 2. このコードをエディタに貼り付けて保存します。
 * 3. プロジェクト設定（歯車アイコン）>「スクリプト プロパティ」に以下を設定します：
 *    - キー: SLACK_WEBHOOK_URL
 *    - 値: CW-Consulting の Slack Incoming Webhook URL
 *    - キー: QUALIFICATIONS_SPREADSHEET_URL（任意。未設定時は下記の既定URLを使用）
 *    - キー: QUALIFICATIONS_SHEET_NAME（任意。未設定時は先頭のシートを使用）
 * 4. setupDailyTrigger を一度実行し、毎日10時（日本時間）のトリガーを設定します。
 */

const ENDPOINTS = {
  IPA: 'https://www.ipa.go.jp/shiken/index.html',
  AWS: 'https://aws.amazon.com/jp/blogs/training-and-certification/feed/',
  AWS_EN: 'https://aws.amazon.com/blogs/training-and-certification/feed/',
  MICROSOFT: 'https://learn.microsoft.com/api/catalog/',
  LPI: 'https://www.lpi.org/feed/',
  LINUC: 'https://linuc.org/news/',
  CISCO: 'https://blogs.cisco.com/learning/feed',
  GOOGLE_CLOUD: 'https://cloud.google.com/blog/products/training-certifications',
  ORACLE: 'https://blogs.oracle.com/oracleuniversity/feed',
  BROADCOM: 'https://www.broadcom.com/support/education/vmware/certification',
  COMPTIA: 'https://www.comptia.org/ja-jp/blog/',
  CNCF: 'https://www.cncf.io/blog/',
  LINUX_FOUNDATION: 'https://training.linuxfoundation.org/blog/',
  ANTHROPIC: 'https://academy.claude.com/courses',
  UIPATH: 'https://www.uipath.com/ja/learning/certification',
  CERTIFY: 'https://www.sikaku.gr.jp/js/cp/',
  PYTHON_BASIC: 'https://www.pythonic-exam.com/exam/basic',
  PYTHON_DATA_ANALYST: 'https://www.pythonic-exam.com/exam/data-analyst',
  PYTHON_FEED: 'https://pythonic-exam.com/feed/',
  PMAJ_PMC: 'https://www.pmaj.or.jp/p2m/exam/pmc/top.html',
  PMAJ_PMS: 'https://www.pmaj.or.jp/p2m/exam/pms/top.html',
  PMAJ_PMR: 'https://www.pmaj.or.jp/p2m/exam/pmr/top.html',
  PMI_PMP: 'https://www.pmi-japan.org/pmp_license/',
  ISACA_TOPICS: 'https://engage.isaca.org/tokyochapter',
  PEOPLECERT_ITIL: 'https://www.peoplecert.org/jp/browse-certifications/it-governance-and-service-management/ITIL-1',
  FORTINET_CERTIFICATION: 'https://www.fortinet.com/jp/training-certification',
  FORTINET_UPDATE: 'https://www.fortinet.com/nse-training-update',
  PALO_ALTO_CERTIFICATION: 'https://www.paloaltonetworks.com/services/education/certification',
  WINACTOR_CERTIFICATION: 'https://winactor.biz/use/winactor_certification.html'
};

const DEFAULT_SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1QcS6NJRvvmveI2H31xNifauDQ1A7nmMyuiGFT3xRgO8/edit';

/**
 * 日本時間（JST）で現在が平日（月〜金）かどうかを判定する
 * @param {Date} [date]
 * @returns {boolean}
 */
function isWeekdayJST(date) {
  const targetDate = date || new Date();
  const jstString = targetDate.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' });
  const jstDate = new Date(jstString);
  const day = jstDate.getDay(); // 0: 日曜, 6: 土曜
  return day >= 1 && day <= 5;
}

/**
 * 手動実行用関数（平日判定に関わらず即座に更新チェックを実行）
 */
function runManualCheck() {
  console.log('▶ 手動実行を開始します（平日ガード無視）');
  checkAllCertificateUpdates({ forceRun: true });
}

/**
 * 過去の保存状態（キャッシュ）をクリアする関数
 * 前回の状態をリセットして最初から差分判定や全件取り込みを行いたい場合に実行します
 */
function clearSavedState() {
  const properties = PropertiesService.getScriptProperties();
  const keys = properties.getKeys();
  let count = 0;
  keys.forEach(function (key) {
    if (key.indexOf('SAVED_STATE_') === 0) {
      properties.deleteProperty(key);
      count++;
    }
  });
  console.log(`保存状態 ${count} 件をクリアしました。次回の実行は初回ベースラインとして処理されます。`);
}

/**
 * 定期実行メイン関数（平日のみ一日一回実行）
 * @param {object} [options]
 */
function checkAllCertificateUpdates(options) {
  const forceRun = options && options.forceRun;
  if (!forceRun && !isWeekdayJST()) {
    console.log('本日は土日（休日）のため、平日定期収集をスキップします。');
    return;
  }
  console.log('=== 資格情報更新チェック開始 ===');
  const properties = PropertiesService.getScriptProperties();
  const webhookUrl = properties.getProperty('SLACK_WEBHOOK_URL');

  // 1. IPA
  try {
    checkIpa(properties, webhookUrl);
  } catch (e) {
    console.error('IPA チェック失敗:', e.message);
  }

  Utilities.sleep(1500);

  // 2. AWS
  try {
    checkAws(properties, webhookUrl);
  } catch (e) {
    console.error('AWS チェック失敗:', e.message);
  }

  Utilities.sleep(1500);

  // 3. Microsoft
  try {
    checkMicrosoft(properties, webhookUrl);
  } catch (e) {
    console.error('Microsoft チェック失敗:', e.message);
  }

  Utilities.sleep(1500);

  // 4. LPI & LinuC
  try {
    checkLpi(properties, webhookUrl);
  } catch (e) {
    console.error('LPI チェック失敗:', e.message);
  }

  Utilities.sleep(1500);

  try {
    checkCisco(properties, webhookUrl);
  } catch (e) {
    console.error('Cisco チェック失敗:', e.message);
  }

  Utilities.sleep(1500);

  try {
    checkGoogleCloud(properties, webhookUrl);
  } catch (e) {
    console.error('Google Cloud チェック失敗:', e.message);
  }

  Utilities.sleep(1500);

  try {
    checkOracle(properties, webhookUrl);
  } catch (e) {
    console.error('Oracle チェック失敗:', e.message);
  }

  Utilities.sleep(1500);
  try {
    checkBroadcom(properties, webhookUrl);
  } catch (e) {
    console.error('Broadcom チェック失敗:', e.message);
  }

  Utilities.sleep(1500);
  try {
    checkCompTIA(properties, webhookUrl);
  } catch (e) {
    console.error('CompTIA チェック失敗:', e.message);
  }

  Utilities.sleep(1500);
  try {
    checkCNCF(properties, webhookUrl);
  } catch (e) {
    console.error('CNCF / Linux Foundation チェック失敗:', e.message);
  }

  Utilities.sleep(1500);
  try {
    checkAnthropic(properties, webhookUrl);
  } catch (e) {
    console.error('Anthropic チェック失敗:', e.message);
  }

  Utilities.sleep(1500);
  try {
    checkUiPath(properties, webhookUrl);
  } catch (e) {
    console.error('UiPath チェック失敗:', e.message);
  }

  Utilities.sleep(1500);
  try {
    checkCertify(properties, webhookUrl);
  } catch (e) {
    console.error('サーティファイ チェック失敗:', e.message);
  }

  Utilities.sleep(1500);
  try {
    checkPythonAssociation(properties, webhookUrl);
  } catch (e) {
    console.error('Pythonエンジニア育成推進協会 チェック失敗:', e.message);
  }

  Utilities.sleep(1500);
  try {
    checkPmaj(properties, webhookUrl);
  } catch (e) {
    console.error('PMAJ チェック失敗:', e.message);
  }

  Utilities.sleep(1500);
  try {
    checkPmi(properties, webhookUrl);
  } catch (e) {
    console.error('PMI チェック失敗:', e.message);
  }

  Utilities.sleep(1500);
  try {
    checkIsaca(properties, webhookUrl);
  } catch (e) {
    console.error('ISACA チェック失敗:', e.message);
  }

  Utilities.sleep(1500);
  try {
    checkPeopleCert(properties, webhookUrl);
  } catch (e) {
    console.error('PeopleCert チェック失敗:', e.message);
  }

  Utilities.sleep(1500);
  try {
    checkFortinet(properties, webhookUrl);
  } catch (e) {
    console.error('Fortinet チェック失敗:', e.message);
  }

  Utilities.sleep(1500);
  try {
    checkPaloAlto(properties, webhookUrl);
  } catch (e) {
    console.error('Palo Alto Networks チェック失敗:', e.message);
  }

  Utilities.sleep(1500);
  try {
    checkNttAt(properties, webhookUrl);
  } catch (e) {
    console.error('NTT-AT チェック失敗:', e.message);
  }

  console.log('=== 全プロバイダーのチェック完了 ===');
}

/**
 * 資格情報の定期チェックを毎平日（月〜金）の10時（日本時間）に実行するトリガーを設定
 */
function setupDailyTrigger() {
  const handler = 'checkAllCertificateUpdates';
  const triggers = ScriptApp.getProjectTriggers();

  triggers.forEach(function (trigger) {
    if (trigger.getHandlerFunction() === handler) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  const weekdays = [
    ScriptApp.WeekDay.MONDAY,
    ScriptApp.WeekDay.TUESDAY,
    ScriptApp.WeekDay.WEDNESDAY,
    ScriptApp.WeekDay.THURSDAY,
    ScriptApp.WeekDay.FRIDAY,
  ];

  weekdays.forEach(function (weekday) {
    ScriptApp.newTrigger(handler)
      .timeBased()
      .onWeekDay(weekday)
      .atHour(10)
      .inTimezone('Asia/Tokyo')
      .create();
  });
}

function fetchOfficialHtml(url) {
  const res = UrlFetchApp.fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
    },
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) {
    throw new Error(`公式ページの取得に失敗しました (${url}): HTTP ${res.getResponseCode()}`);
  }
  return res.getContentText('UTF-8');
}

function hashVisibleText(value) {
  const text = stripHtmlText(value
    .replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, ' '));
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

function createOfficialSnapshot(provider, title, url, html, relatedQualifications) {
  return {
    provider: provider,
    title: title,
    url: url,
    date: '',
    contentHash: hashVisibleText(html),
    relatedQualifications: relatedQualifications
  };
}

function extractOfficialLinks(html, baseUrl, provider, matchQualifications, titlePattern) {
  const items = [];
  const anchorRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorRegex.exec(html)) !== null) {
    const hrefMatch = match[1].match(/\bhref\s*=\s*["']([^"']+)["']/i);
    if (!hrefMatch) continue;
    const title = stripHtmlText(match[2]) ||
      stripHtmlText((match[1].match(/\btitle\s*=\s*["']([^"']+)["']/i) || [])[1] || '');
    if (!title || !titlePattern.test(title)) continue;
    const url = resolveOfficialUrl(hrefMatch[1], baseUrl);
    const relatedQualifications = matchQualifications(title);
    items.push({
      provider: provider,
      title: title,
      url: url,
      date: '',
      contentHash: hashVisibleText(title),
      relatedQualifications: relatedQualifications
    });
  }
  return uniqueItemsByUrl(items);
}

function checkBroadcom(properties, webhookUrl) {
  const html = fetchOfficialHtml(ENDPOINTS.BROADCOM);
  const qualifications = [
    { no: 67, name: 'VCP (VMware Certified Professional)' },
    { no: 68, name: 'VCAP (VMware Certified Advanced Professional)' },
    { no: 69, name: 'VCDX (VMware Certified Design Expert)' },
    { no: 70, name: 'VCTA (VMware Certified Technical Associate)' }
  ];
  const items = [createOfficialSnapshot('Broadcom', 'VMware Certification program updates', ENDPOINTS.BROADCOM, html, qualifications)];
  handleDiff('BROADCOM', items, properties, webhookUrl, 'url', 'contentHash');
}

function matchCompTIAQualifications(text) {
  const qualifications = [
    { no: 71, name: 'IT Fundamentals', aliases: ['IT Fundamentals', 'ITF+'] },
    { no: 72, name: 'A+', aliases: ['CompTIA A+', 'A+'] },
    { no: 73, name: 'Network+', aliases: ['Network+'] },
    { no: 74, name: 'Security+', aliases: ['Security+'] },
    { no: 75, name: 'Cloud+', aliases: ['Cloud+'] },
    { no: 76, name: 'Linux+', aliases: ['Linux+'] },
    { no: 77, name: 'Server+', aliases: ['Server+'] },
    { no: 78, name: 'CASP+', aliases: ['CASP+', 'SecurityX'] },
    { no: 79, name: 'F+', aliases: ['CompTIA F+', 'F+'] },
    { no: 80, name: 'PenTest+', aliases: ['PenTest+'] },
    { no: 81, name: 'Project+', aliases: ['Project+'] },
    { no: 82, name: 'CTT+', aliases: ['CTT+'] },
    { no: 83, name: 'Cloud Essentials', aliases: ['Cloud Essentials'] }
  ];
  return qualifications.filter(q => q.aliases.some(alias =>
    new RegExp(`(^|[^A-Z0-9])${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^A-Z0-9])`, 'i').test(text)))
    .map(q => ({ no: q.no, name: q.name }));
}

function checkCompTIA(properties, webhookUrl) {
  const html = fetchOfficialHtml(ENDPOINTS.COMPTIA);
  const items = [
    createOfficialSnapshot('CompTIA', 'CompTIA official blog updates', ENDPOINTS.COMPTIA, html, [
      { no: 71, name: 'IT Fundamentals' }, { no: 72, name: 'A+' },
      { no: 73, name: 'Network+' }, { no: 74, name: 'Security+' },
      { no: 75, name: 'Cloud+' }, { no: 76, name: 'Linux+' },
      { no: 77, name: 'Server+' }, { no: 78, name: 'CASP+' },
      { no: 79, name: 'F+' }, { no: 80, name: 'PenTest+' },
      { no: 81, name: 'Project+' }, { no: 82, name: 'CTT+' },
      { no: 83, name: 'Cloud Essentials' }
    ]),
    ...extractOfficialLinks(html, ENDPOINTS.COMPTIA, 'CompTIA', matchCompTIAQualifications,
      /comptia|資格|試験|certification|security\+|network\+|cloud\+|linux\+|project\+/i)
  ];
  handleDiff('COMPTIA', items, properties, webhookUrl, 'url', 'contentHash');
}

function matchCNCFQualifications(text) {
  const qualifications = [
    { no: 84, name: 'Certified Kubernetes Administrator (CKA)', aliases: ['CKA', 'Kubernetes Administrator'] },
    { no: 85, name: 'Certified Kubernetes Application Developer (CKAD)', aliases: ['CKAD', 'Kubernetes Application Developer'] },
    { no: 86, name: 'Certified Kubernetes Security Specialist (CKS)', aliases: ['CKS', 'Kubernetes Security Specialist'] },
    { no: 87, name: 'Kubernetes and Cloud Native Associate (KCNA)', aliases: ['KCNA', 'Cloud Native Associate'] }
  ];
  return qualifications.filter(q => q.aliases.some(alias =>
    /^[A-Z]+$/.test(alias)
      ? new RegExp(`(^|[^A-Z0-9])${alias}($|[^A-Z0-9])`, 'i').test(text)
      : text.toLowerCase().includes(alias.toLowerCase())))
    .map(q => ({ no: q.no, name: q.name }));
}

function checkCNCF(properties, webhookUrl) {
  const sources = [
    { name: 'CNCF', url: ENDPOINTS.CNCF },
    { name: 'Linux Foundation', url: ENDPOINTS.LINUX_FOUNDATION }
  ];
  const qualifications = [
    { no: 84, name: 'Certified Kubernetes Administrator (CKA)' },
    { no: 85, name: 'Certified Kubernetes Application Developer (CKAD)' },
    { no: 86, name: 'Certified Kubernetes Security Specialist (CKS)' },
    { no: 87, name: 'Kubernetes and Cloud Native Associate (KCNA)' }
  ];
  const items = [];
  sources.forEach((source, index) => {
    if (index > 0) Utilities.sleep(1500);
    const html = fetchOfficialHtml(source.url);
    items.push(createOfficialSnapshot(source.name, `${source.name} certification updates`, source.url, html, qualifications));
    items.push(...extractOfficialLinks(html, source.url, source.name, matchCNCFQualifications,
      /cka|ckad|cks|kcna|certification|certified|credential|exam|kubernetes.{0,40}(administrator|developer|security|associate)/i));
  });
  handleDiff('CNCF', uniqueItemsByUrl(items), properties, webhookUrl, 'url', 'contentHash');
}

function matchAnthropicQualifications(text) {
  const qualifications = [
    { no: 88, name: 'Claude Certified Associate – Foundations (CCAO-F)', aliases: ['CCAO-F', 'Claude Certified Associate'] },
    { no: 89, name: 'Claude Certified Architect – Foundations (CCAR-F)', aliases: ['CCAR-F', 'Claude Certified Architect'] },
    { no: 90, name: 'Claude Certified Developer – Foundations (CCDV-F)', aliases: ['CCDV-F', 'Claude Certified Developer'] },
    { no: 91, name: 'Claude Certified Architect – Professional (CCAR-P)', aliases: ['CCAR-P', 'Claude Certified Architect'] }
  ];
  return qualifications.filter(q => q.aliases.some(alias => text.toLowerCase().includes(alias.toLowerCase())))
    .map(q => ({ no: q.no, name: q.name }));
}

function checkAnthropic(properties, webhookUrl) {
  const html = fetchOfficialHtml(ENDPOINTS.ANTHROPIC);
  const qualifications = [
    { no: 88, name: 'Claude Certified Associate – Foundations (CCAO-F)' },
    { no: 89, name: 'Claude Certified Architect – Foundations (CCAR-F)' },
    { no: 90, name: 'Claude Certified Developer – Foundations (CCDV-F)' },
    { no: 91, name: 'Claude Certified Architect – Professional (CCAR-P)' }
  ];
  const items = [
    createOfficialSnapshot('Anthropic', 'Claude Academy course and certification catalog', ENDPOINTS.ANTHROPIC, html, qualifications),
    ...extractOfficialLinks(html, ENDPOINTS.ANTHROPIC, 'Anthropic', matchAnthropicQualifications,
      /claude certified|certification|credential/i)
  ];
  handleDiff('ANTHROPIC', uniqueItemsByUrl(items), properties, webhookUrl, 'url', 'contentHash');
}

function matchUiPathQualifications(text) {
  const qualifications = [
    { no: 92, name: 'UiPath Automation Developer Associate', aliases: ['Automation Developer Associate', 'オートメーション デベロッパー アソシエイト'] },
    { no: 93, name: 'UiPath Automation Developer Professional', aliases: ['Automation Developer Professional', 'オートメーション デベロッパー プロフェッショナル'] },
    { no: 94, name: 'UiPath Agentic Automation Associate', aliases: ['Agentic Automation Associate', 'エージェンティック オートメーション アソシエイト'] },
    { no: 95, name: 'UiPath Agentic Automation Professional', aliases: ['Agentic Automation Professional', 'エージェンティック オートメーション プロフェッショナル'] }
  ];
  return qualifications.filter(q => q.aliases.some(alias => text.toLowerCase().includes(alias.toLowerCase())))
    .map(q => ({ no: q.no, name: q.name }));
}

function checkUiPath(properties, webhookUrl) {
  const html = fetchOfficialHtml(ENDPOINTS.UIPATH);
  const qualifications = [
    { no: 92, name: 'UiPath Automation Developer Associate' },
    { no: 93, name: 'UiPath Automation Developer Professional' },
    { no: 94, name: 'UiPath Agentic Automation Associate' },
    { no: 95, name: 'UiPath Agentic Automation Professional' }
  ];
  const items = [
    createOfficialSnapshot('UiPath', 'UiPath certification program updates', ENDPOINTS.UIPATH, html, qualifications),
    ...extractOfficialLinks(html, ENDPOINTS.UIPATH, 'UiPath', matchUiPathQualifications,
      /certification|認定|資格|automation developer|agentic automation|エージェンティック|オートメーション/i)
  ];
  handleDiff('UIPATH', uniqueItemsByUrl(items), properties, webhookUrl, 'url', 'contentHash');
}

function checkCertify(properties, webhookUrl) {
  const html = fetchOfficialHtml(ENDPOINTS.CERTIFY);
  const qualifications = [
    { no: 96, name: 'C言語プログラミング能力認定試験3級' },
    { no: 97, name: 'C言語プログラミング能力認定試験2級' },
    { no: 98, name: 'C言語プログラミング能力認定試験1級' }
  ];
  const items = [
    createOfficialSnapshot('サーティファイ', 'C言語プログラミング能力認定試験の更新', ENDPOINTS.CERTIFY, html, qualifications),
  ];
  handleDiff('CERTIFY', uniqueItemsByUrl(items), properties, webhookUrl, 'url', 'contentHash');
}

function checkPythonAssociation(properties, webhookUrl) {
  const exams = [
    { url: ENDPOINTS.PYTHON_BASIC, no: 99, name: 'Python3 エンジニア認定基礎試験' },
    { url: ENDPOINTS.PYTHON_DATA_ANALYST, no: 100, name: 'Python3 エンジニア認定データ分析試験' }
  ];
  const items = [];
  exams.forEach((exam, index) => {
    if (index > 0) Utilities.sleep(1500);
    const html = fetchOfficialHtml(exam.url);
    items.push(createOfficialSnapshot('Pythonエンジニア育成推進協会', `${exam.name}の更新`,
      exam.url, html, [{ no: exam.no, name: exam.name }]));
  });
  Utilities.sleep(1500);
  const feedResponse = UrlFetchApp.fetch(ENDPOINTS.PYTHON_FEED, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) certificateInfo-GAS-bot/1.0',
      'Accept': 'application/rss+xml,application/xml,text/xml'
    },
    muteHttpExceptions: true
  });
  if (feedResponse.getResponseCode() !== 200) {
    throw new Error(`Python協会RSSの取得に失敗しました: HTTP ${feedResponse.getResponseCode()}`);
  }
  const feed = feedResponse.getContentText('UTF-8');
  const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(feed)) !== null) {
    const titleMatch = match[1].match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch = match[1].match(/<link>([\s\S]*?)<\/link>/i);
    const dateMatch = match[1].match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const descriptionMatch = match[1].match(/<description>([\s\S]*?)<\/description>/i);
    const title = titleMatch ? decodeFeedText(titleMatch[1]).trim() : '';
    const url = linkMatch ? decodeFeedText(linkMatch[1]).trim() : '';
    const description = descriptionMatch ? stripHtmlText(decodeFeedText(descriptionMatch[1])) : '';
    const text = `${title} ${description}`;
    if (!title || !url || !/(python.{0,30}(認定|試験)|(?:認定|試験).{0,30}python)/i.test(text)) continue;
    const relatedQualifications = [];
    if (/基礎試験/.test(text)) relatedQualifications.push({ no: 99, name: 'Python3 エンジニア認定基礎試験' });
    if (/データ分析試験/.test(text)) relatedQualifications.push({ no: 100, name: 'Python3 エンジニア認定データ分析試験' });
    items.push({
      provider: 'Pythonエンジニア育成推進協会',
      title: title,
      url: url,
      date: dateMatch ? decodeFeedText(dateMatch[1]).trim() : '',
      description: description,
      contentHash: hashVisibleText(`${title} ${description}`),
      relatedQualifications: relatedQualifications
    });
  }
  handleDiff('PYTHON_ASSOCIATION', items, properties, webhookUrl, 'url', 'contentHash');
}

function matchPmajQualifications(text) {
  const qualifications = [
    { no: 101, name: 'プロジェクトマネジメント・コーディネーター (PMC)', aliases: ['PMC', 'コーディネーター'] },
    { no: 102, name: 'プロジェクトマネジメント・スペシャリスト (PMS)', aliases: ['PMS', 'スペシャリスト'] },
    { no: 103, name: 'プログラムマネジャー・レジスタード (PMR)', aliases: ['PMR', 'プログラムマネジャー'] }
  ];
  return qualifications.filter(q => q.aliases.some(alias =>
    /^[A-Z]+$/.test(alias)
      ? new RegExp(`(^|[^A-Z0-9])${alias}($|[^A-Z0-9])`, 'i').test(text)
      : text.includes(alias)))
    .map(q => ({ no: q.no, name: q.name }));
}

function checkPmaj(properties, webhookUrl) {
  const sources = [
    { url: ENDPOINTS.PMAJ_PMC, no: 101, name: 'プロジェクトマネジメント・コーディネーター (PMC)' },
    { url: ENDPOINTS.PMAJ_PMS, no: 102, name: 'プロジェクトマネジメント・スペシャリスト (PMS)' },
    { url: ENDPOINTS.PMAJ_PMR, no: 103, name: 'プログラムマネジャー・レジスタード (PMR)' }
  ];
  const items = [];
  sources.forEach((source, index) => {
    if (index > 0) Utilities.sleep(1500);
    const html = fetchOfficialHtml(source.url);
    items.push(createOfficialSnapshot('日本プロジェクトマネジメント協会 (PMAJ)',
      `${source.name}の更新`, source.url, html, [{ no: source.no, name: source.name }]));
    items.push(...extractOfficialLinks(html, source.url, '日本プロジェクトマネジメント協会 (PMAJ)',
      matchPmajQualifications, /PMC|PMS|PMR|プロジェクトマネジメント|プロジェクトマネジャー/i));
  });
  handleDiff('PMAJ', uniqueItemsByUrl(items), properties, webhookUrl, 'url', 'contentHash');
}

function checkPmi(properties, webhookUrl) {
  const url = ENDPOINTS.PMI_PMP;
  const html = fetchOfficialHtml(url);
  const items = [createOfficialSnapshot('Project Management Institute (PMI)',
    'PMP試験・資格情報の更新', url, html, [{ no: 104, name: 'Project Management Professional (PMP)' }])];
  handleDiff('PMI', items, properties, webhookUrl, 'url', 'contentHash');
}

function checkIsaca(properties, webhookUrl) {
  const url = ENDPOINTS.ISACA_TOPICS;
  const html = fetchOfficialHtml(url);
  const topics = extractIsacaTopics(html);
  const items = [createOfficialSnapshot('ISACA', 'ISACAトピックスの更新', url, topics, [
    { no: 105, name: 'CISA (Certified Information Systems Auditor)' }
  ])].concat(parseIsacaTopicItems(topics));
  handleDiff('ISACA', items, properties, webhookUrl, 'url', 'contentHash');
}

function extractIsacaTopics(html) {
  const match = html.match(/<!--\s*トピックス\s*-->[\s\S]*?<!--\s*\/\/トピックス\s*-->/i);
  return match ? match[0] : html;
}

function parseIsacaTopicItems(topics) {
  const items = [];
  const rowRegex = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  while ((rowMatch = rowRegex.exec(topics)) !== null) {
    const row = rowMatch[1];
    const dateMatch = row.match(/<p\b[^>]*class=["']topics["'][^>]*>\s*(\d{4})\/(\d{1,2})/i);
    const anchorMatch = row.match(/<a\b([^>]*)>([\s\S]*?)<\/a>/i);
    if (!dateMatch || !anchorMatch) continue;

    const title = stripHtmlText(anchorMatch[2]);
    if (!/CISA|公認情報システム監査人|ISACA認定資格試験/i.test(title)) continue;
    const hrefMatch = anchorMatch[1].match(/\bhref\s*=\s*["']([^"']+)["']/i);
    if (!hrefMatch) continue;

    const url = resolveOfficialUrl(hrefMatch[1], ENDPOINTS.ISACA_TOPICS);
    items.push({
      provider: 'ISACA',
      title: title,
      url: url,
      date: `${dateMatch[1]}-${('0' + dateMatch[2]).slice(-2)}`,
      contentHash: hashVisibleText(row),
      relatedQualifications: [{ no: 105, name: 'CISA (Certified Information Systems Auditor)' }]
    });
  }
  return uniqueItemsByUrl(items);
}

function checkPeopleCert(properties, webhookUrl) {
  const url = ENDPOINTS.PEOPLECERT_ITIL;
  const html = fetchOfficialHtml(url);
  const items = [createOfficialSnapshot('PeopleCert', 'ITIL資格情報の更新', url, html, [
    { no: 106, name: 'ITIL Foundation' }
  ])];
  handleDiff('PEOPLECERT', items, properties, webhookUrl, 'url', 'contentHash');
}

function checkFortinet(properties, webhookUrl) {
  const sources = [
    { url: ENDPOINTS.FORTINET_CERTIFICATION, title: 'Fortinet認定資格プログラムの更新' },
    { url: ENDPOINTS.FORTINET_UPDATE, title: 'Fortinet NSE認定プログラム改訂情報' }
  ];
  const items = [];
  sources.forEach((source, index) => {
    if (index > 0) Utilities.sleep(1500);
    const html = fetchOfficialHtml(source.url);
    items.push(createOfficialSnapshot('Fortinet', source.title, source.url, html, [
      { no: 107, name: 'Fortinet Certified Professional (FCP)' }
    ]));
  });
  handleDiff('FORTINET', items, properties, webhookUrl, 'url', 'contentHash');
}

function checkPaloAlto(properties, webhookUrl) {
  const url = ENDPOINTS.PALO_ALTO_CERTIFICATION;
  const html = fetchOfficialHtml(url);
  const items = [createOfficialSnapshot('Palo Alto Networks',
    'Network Security Professional認定プログラムの更新', url, html, [
      { no: 108, name: 'Palo Alto Networks Network Security Professional' }
    ])];
  handleDiff('PALO_ALTO', items, properties, webhookUrl, 'url', 'contentHash');
}

function checkNttAt(properties, webhookUrl) {
  const url = ENDPOINTS.WINACTOR_CERTIFICATION;
  const html = fetchOfficialHtml(url);
  const items = [createOfficialSnapshot('NTTアドバンステクノロジ (NTT-AT)',
    'WinActor認定情報の更新', url, html, [
      { no: 109, name: 'WinActor RPA技術者検定アソシエイト' },
      { no: 110, name: 'WinActor RPA技術者検定エキスパート' }
    ])];
  handleDiff('NTT_AT', items, properties, webhookUrl, 'url', 'contentHash');
}

/**
 * Cisco Learn with Cisco RSS チェック処理
 */
function checkCisco(properties, webhookUrl) {
  const res = UrlFetchApp.fetch(ENDPOINTS.CISCO, {
    headers: {
      'User-Agent': 'Mozilla/5.0 certificateInfo-GAS-bot/1.0',
      'Accept': 'application/rss+xml,application/xml,text/xml'
    },
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) throw new Error(`HTTP ${res.getResponseCode()}`);

  const xml = res.getContentText('UTF-8');
  const items = [];
  const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const titleMatch = match[1].match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch = match[1].match(/<link>([\s\S]*?)<\/link>/i);
    const dateMatch = match[1].match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const descriptionMatch = match[1].match(/<description>([\s\S]*?)<\/description>/i);
    if (!titleMatch || !linkMatch) continue;

    const title = decodeFeedText(titleMatch[1]);
    const description = decodeFeedText(descriptionMatch ? descriptionMatch[1] : '').replace(/<[^>]+>/g, '');
    if (!/\b(certification|certified|credential|exam)\b/i.test(`${title} ${description}`)) continue;
    items.push({
      provider: 'Cisco Systems',
      title: title,
      url: decodeFeedText(linkMatch[1]),
      date: dateMatch ? decodeFeedText(dateMatch[1]) : '',
      description: description,
      relatedQualifications: matchCiscoQualifications(`${title} ${description}`)
    });
  }

  handleDiff('CISCO', items, properties, webhookUrl, 'url');
}

/**
 * Google Cloud公式資格情報記事一覧のチェック処理
 */
function checkGoogleCloud(properties, webhookUrl) {
  const res = UrlFetchApp.fetch(ENDPOINTS.GOOGLE_CLOUD, {
    headers: {
      'User-Agent': 'Mozilla/5.0 certificateInfo-GAS-bot/1.0',
      'Accept': 'text/html,application/xhtml+xml'
    },
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) throw new Error(`HTTP ${res.getResponseCode()}`);

  const html = res.getContentText('UTF-8');
  const items = [];
  const anchorRegex = /<a\b[^>]*href=["']([^"']*\/blog\/topics\/training-certifications\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorRegex.exec(html)) !== null) {
    const headingMatch = match[2].match(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/i);
    const title = stripHtmlText(headingMatch ? headingMatch[1] : match[2]);
    if (!title || !/\b(certifications?|certified|exams?|credentials?|renewal)\b/i.test(title)) continue;
    items.push({
      provider: 'Google Cloud',
      title: title,
      url: resolveOfficialUrl(match[1], ENDPOINTS.GOOGLE_CLOUD),
      date: '',
      relatedQualifications: matchGoogleCloudQualifications(title)
    });
  }

  handleDiff('GOOGLE_CLOUD', uniqueItemsByUrl(items), properties, webhookUrl, 'url');
}

/**
 * Oracle University ブログフィードのチェック処理 (RSS)
 */
function checkOracle(properties, webhookUrl) {
  const res = UrlFetchApp.fetch(ENDPOINTS.ORACLE, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8'
    },
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) {
    console.warn(`Oracle フィードの取得に失敗しました (HTTP ${res.getResponseCode()})。スキップします。`);
    return;
  }

  const content = res.getContentText('UTF-8');
  let items = [];
  if (content.indexOf('<rss') >= 0 || content.indexOf('<channel') >= 0 || content.indexOf('<item') >= 0) {
    items = parseOracleRss(content);
  } else {
    items = parseOracleAnnouncements(content);
  }

  handleDiff('ORACLE', uniqueItemsByUrl(items), properties, webhookUrl, 'url');
}

function parseOracleRss(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/i);
    const pubDateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const descMatch = block.match(/<description>([\s\S]*?)<\/description>/i);

    const title = titleMatch ? decodeFeedText(titleMatch[1]).trim() : '';
    const link = linkMatch ? decodeFeedText(linkMatch[1]).trim() : '';
    const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';
    const desc = descMatch ? stripHtmlText(decodeFeedText(descMatch[1])).trim() : title;

    if (title && link) {
      const fullText = `${title} ${desc}`;
      const relatedQualifications = matchOracleQualifications(fullText);
      items.push({
        provider: 'Oracle',
        title: title,
        url: link,
        date: pubDate,
        description: desc,
        relatedQualifications: relatedQualifications
      });
    }
  }

  return items;
}

function parseOracleAnnouncements(html) {
  const items = [];
  const headingRegex = /<h3\b([^>]*)>([\s\S]*?)<\/h3>/gi;
  let headingMatch;
  while ((headingMatch = headingRegex.exec(html)) !== null) {
    const title = stripHtmlText(headingMatch[2]);
    const idMatch = headingMatch[1].match(/\bid=["']([^"']+)["']/i);
    const dateMatch = title.match(/\((\d{4})\/(\d{1,2})\/(\d{1,2})\)\s*$/);
    if (!idMatch || !dateMatch || !/(認定|資格|試験|certification|certified|exam)/i.test(title)) continue;

    const nextHeading = html.slice(headingRegex.lastIndex).search(/<h3\b/i);
    const card = html.slice(headingRegex.lastIndex, nextHeading < 0
      ? html.length
      : headingRegex.lastIndex + nextHeading);
    items.push({
      provider: 'Oracle',
      title: title,
      url: `https://www.oracle.com/jp/education/news/#${idMatch[1]}`,
      date: `${dateMatch[1]}-${('0' + dateMatch[2]).slice(-2)}-${('0' + dateMatch[3]).slice(-2)}`,
      relatedQualifications: matchOracleQualifications(`${title} ${stripHtmlText(card)}`)
    });
  }

  return items;
}

function decodeFeedText(value) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&rsquo;|&lsquo;/g, "'")
    .replace(/&rdquo;|&ldquo;/g, '"')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&copy;/g, '©')
    .replace(/&reg;/g, '®')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (entity, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (entity, code) => String.fromCodePoint(parseInt(code, 16)));
}

function stripHtmlText(value) {
  return decodeFeedText(value.replace(/<[^>]*>/g, ''))
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveOfficialUrl(url, baseUrl) {
  if (/^https?:\/\//i.test(url)) return url;
  const originMatch = baseUrl.match(/^(https?:\/\/[^/]+)/i);
  if (url.startsWith('/') && originMatch) return originMatch[1] + url;
  return baseUrl.replace(/\/[^/]*$/, '/') + url;
}

function uniqueItemsByUrl(items) {
  const seen = new Set();
  return items.filter(item => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

function matchCiscoQualifications(text) {
  const qualifications = [
    { no: 43, name: 'CCNA', aliases: ['CCNA', '200-301'] },
    { no: 44, name: 'ENCOR', aliases: ['ENCOR', '350-401'] },
    { no: 45, name: 'ENARSI', aliases: ['ENARSI', '300-410'] },
    { no: 46, name: 'ENSDWI', aliases: ['ENSDWI', '300-415'] },
    { no: 47, name: 'ENSLD', aliases: ['ENSLD', '300-420'] },
    { no: 48, name: 'ENWLSI', aliases: ['ENWLSI', '300-425'] },
    { no: 49, name: 'ENAUTO', aliases: ['ENAUTO', '300-435'] },
    { no: 50, name: 'ENWLSD', aliases: ['ENWLSD', '300-430'] },
    { no: 51, name: 'CCNP Enterprise', aliases: ['CCNP Enterprise'] },
    { no: 52, name: 'CCIE Enterprise Infrastructure', aliases: ['CCIE Enterprise Infrastructure'] }
  ];
  return qualifications.filter(q => q.aliases.some(alias =>
    new RegExp(`(^|[^A-Z0-9])${alias}($|[^A-Z0-9])`, 'i').test(text)))
    .map(q => ({ no: q.no, name: q.name }));
}

function matchGoogleCloudQualifications(text) {
  const qualifications = [
    { no: 40, name: 'GCP Leader系', aliases: ['Cloud Digital Leader', 'Digital Leader'] },
    { no: 41, name: 'GCP認定 Associate系', aliases: ['Associate Cloud Engineer', 'Associate certification'] },
    { no: 42, name: 'GCP認定 Professional系', aliases: ['Professional Cloud', 'Professional certification'] }
  ];
  const matched = qualifications.filter(q => q.aliases.some(alias => text.toLowerCase().includes(alias.toLowerCase())));
  if (/\b(google cloud )?certification(s)?\b|\bexam\b|\bcredential(s)?\b/i.test(text) && matched.length === 0) {
    return qualifications.map(q => ({ no: q.no, name: q.name }));
  }
  return matched.map(q => ({ no: q.no, name: q.name }));
}

function matchOracleQualifications(text) {
  const qualifications = [
    { no: 60, name: 'Oracle Certified Java Programmer, Bronze SE', aliases: ['Java Programmer, Bronze', 'Java SE Bronze'] },
    { no: 61, name: 'ORACLE MASTER Bronze DBA', aliases: ['ORACLE MASTER Bronze', 'Bronze DBA'] },
    { no: 62, name: 'ORACLE MASTER Silver Oracle Database', aliases: ['ORACLE MASTER Silver', 'Silver Oracle Database'] },
    { no: 63, name: 'Oracle Certified Java Programmer, Silver SE 11', aliases: ['Java Programmer, Silver', 'Java SE 11'] },
    { no: 64, name: 'ORACLE MASTER Gold Oracle Database', aliases: ['ORACLE MASTER Gold', 'Gold Oracle Database'] },
    { no: 65, name: 'Oracle Certified Java Programmer, Gold SE', aliases: ['Java Programmer, Gold', 'Java SE Gold'] },
    { no: 66, name: 'ORACLE MASTER Platinum', aliases: ['ORACLE MASTER Platinum', 'Platinum Oracle Database'] }
  ];
  return qualifications.filter(q => q.aliases.some(alias => text.toLowerCase().includes(alias.toLowerCase())))
    .map(q => ({ no: q.no, name: q.name }));
}

const IPA_QUALIFICATIONS = [
  { no: 1, name: '基本情報技術者試験', aliases: ['基本情報', 'FE'] },
  { no: 2, name: '応用情報技術者試験(旧:ソフトウェア開発技術者試験)', aliases: ['応用情報', 'AP'] },
  { no: 3, name: 'ネットワークスペシャリスト試験', aliases: ['ネットワークスペシャリスト', 'NW'] },
  { no: 4, name: 'データベーススペシャリスト試験', aliases: ['データベーススペシャリスト', 'DB'] },
  { no: 5, name: 'エンベデッドシステムスペシャリスト試験', aliases: ['エンベデッドシステムスペシャリスト', 'エンべデッド', 'ES'] },
  { no: 6, name: 'ITサービスマネージャ試験', aliases: ['ITサービスマネージャ', 'SM'] },
  { no: 7, name: '情報処理安全確保支援士試験', aliases: ['情報処理安全確保支援士', '登録情報セキュリティスペシャリスト', '登録セキスペ', '支援士', 'RISS'] },
  { no: 8, name: 'システムアーキテクト試験', aliases: ['システムアーキテクト', 'SA'] },
  { no: 9, name: 'ITストラテジスト試験', aliases: ['ITストラテジスト', 'ST'] },
  { no: 10, name: 'プロジェクトマネージャ試験', aliases: ['プロジェクトマネージャ', 'PM'] },
  { no: 11, name: 'システム監査技術者試験', aliases: ['システム監査技術者', 'AU'] },
  { no: 12, name: 'ITパスポート試験', aliases: ['ITパスポート', 'iパス', 'IP'] },
  { no: 13, name: '情報セキュリティマネジメント試験', aliases: ['情報セキュリティマネジメント', 'セキュマネ', 'SG'] },
];

function matchIpaQualifications(text) {
  const matched = [];
  for (const q of IPA_QUALIFICATIONS) {
    if (text.includes(q.name) || q.aliases.some(alias => text.includes(alias))) {
      matched.push({ no: q.no, name: q.name });
    }
  }
  return matched;
}

const AWS_QUALIFICATIONS = [
  { no: 14, name: 'AWS認定 Practitioner系', aliases: ['Cloud Practitioner', 'クラウドプラクティショナー', 'CLF'] },
  { no: 15, name: 'AWS認定 Associate系', aliases: ['Solutions Architect - Associate', 'Developer - Associate', 'SysOps Administrator - Associate', 'Data Engineer - Associate', 'SAA', 'DVA', 'SOA', 'DEA'] },
  { no: 16, name: 'AWS認定 Professional系', aliases: ['Solutions Architect - Professional', 'DevOps Engineer - Professional', 'SAP', 'DOP'] },
  { no: 17, name: 'AWS認定 Specialty系', aliases: ['Specialty', 'Advanced Networking', 'Security', 'Machine Learning', 'ANS', 'SCS', 'MLS'] },
  { no: 18, name: 'AWS Certified AI Business Strategist', aliases: ['AI Business Strategist', 'AI Practitioner', 'AIF'] },
];

function matchAwsQualifications(text) {
  const matched = [];
  for (const q of AWS_QUALIFICATIONS) {
    if (text.includes(q.name) || q.aliases.some(alias => new RegExp(`\\b${alias}\\b`, 'i').test(text))) {
      matched.push({ no: q.no, name: q.name });
    }
  }
  return matched;
}

const MS_TARGET_PATTERNS = [
  { no: 19, name: 'Azure認定 fundamentals系', match: c => (c.uid || '').includes('azure-fundamentals') || (c.title || '').includes('Azure Fundamentals') },
  { no: 20, name: 'Azure認定 Associate系', match: c => (c.uid || '').includes('azure-administrator') || (c.uid || '').includes('azure-developer') },
  { no: 21, name: 'Azure認定 Expert系', match: c => (c.uid || '').includes('azure-solutions-architect') || (c.uid || '').includes('devops-engineer') },
  { no: 22, name: 'Azure認定 Specialty系', match: c => c.certification_type === 'specialty' || (c.uid || '').includes('specialty') },
  { no: 27, name: 'Security Operations Analyst Associate', match: c => (c.uid || '').includes('security-operations-analyst') || (c.title || '').includes('Security Operations Analyst') },
  { no: 28, name: 'Collaboration Communications Systems Engineer Associate', match: c => (c.uid || '').includes('collaboration-communications') || (c.title || '').includes('Collaboration Communications') },
  { no: 29, name: 'Endpoint Administrator Associate', match: c => (c.uid || '').includes('endpoint-administrator') || (c.title || '').includes('Endpoint Administrator') },
  { no: 30, name: 'Teams Administrator Associate', match: c => (c.uid || '').includes('teams-administrator') || (c.title || '').includes('Teams Administrator') },
  { no: 31, name: 'Identity and Access Administrator Associate', match: c => (c.uid || '').includes('identity-and-access-administrator') || (c.title || '').includes('Identity and Access Administrator') },
  { no: 32, name: 'Power Platform Solution Architect Expert', match: c => (c.uid || '').includes('power-platform-solution-architect') || (c.title || '').includes('Power Platform Solution Architect') },
  { no: 33, name: 'Information Protection and Compliance Administrator Associate', match: c => (c.uid || '').includes('information-protection') || (c.title || '').includes('Information Protection') },
  { no: 34, name: 'Cybersecurity Architect Expert', match: c => (c.uid || '').includes('cybersecurity-architect') || (c.title || '').includes('Cybersecurity Architect') },
  { no: 35, name: 'Windows Server Hybrid Administrator Associate', match: c => (c.uid || '').includes('windows-server-hybrid') || (c.title || '').includes('Windows Server Hybrid') },
  { no: 36, name: 'Power Platform Fundamentals', match: c => (c.uid || '').includes('power-platform-fundamentals') || (c.title || '').includes('Power Platform Fundamentals') },
  { no: 37, name: 'Power Automate RPA Developer Associate', match: c => (c.uid || '').includes('power-automate-rpa-developer') || (c.title || '').includes('Power Automate RPA Developer') },
  { no: 38, name: 'Power BI Data Analyst Associate', match: c => (c.uid || '').includes('power-bi-data-analyst') || (c.title || '').includes('Power BI Data Analyst') },
  { no: 39, name: 'Power Platform Developer Associate', match: c => (c.uid || '').includes('power-platform-developer') || (c.title || '').includes('Power Platform Developer') },
];

function matchMicrosoftQualifications(cert) {
  const matched = [];
  for (const pattern of MS_TARGET_PATTERNS) {
    if (pattern.match(cert)) {
      matched.push({ no: pattern.no, name: pattern.name });
    }
  }
  return matched;
}

const LPI_QUALIFICATIONS = [
  { no: 53, name: 'LPIC-1', aliases: ['LPIC-1', 'Linux Administrator'] },
  { no: 54, name: 'LPIC-2', aliases: ['LPIC-2', 'Linux Engineer'] },
  { no: 55, name: 'LPIC-3', aliases: ['LPIC-3', 'Enterprise Professional'] },
  { no: 56, name: 'LinuC-1', aliases: ['LinuC-1', 'LinuC レベル1'] },
  { no: 57, name: 'LinuC-2', aliases: ['LinuC-2', 'LinuC レベル2'] },
  { no: 58, name: 'LinuC-3', aliases: ['LinuC-3', 'LinuC レベル3'] },
  { no: 59, name: 'HTML5プロフェッショナル認定試験', aliases: ['HTML5プロフェッショナル', 'HTML5'] },
];

function matchLpiQualifications(text) {
  const matched = [];
  for (const q of LPI_QUALIFICATIONS) {
    if (text.includes(q.name) || q.aliases.some(alias => text.includes(alias))) {
      matched.push({ no: q.no, name: q.name });
    }
  }
  return matched;
}

/**
 * 日本の年度（4月始まり）を取得
 */
function getFiscalYear(date) {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  return month >= 4 ? year : year - 1;
}

/**
 * IPA チェック処理 (本年度、前年度、前々年度)
 */
function checkIpa(properties, webhookUrl) {
  const currentFY = getFiscalYear();
  const years = [currentFY, currentFY - 1, currentFY - 2];
  const allItems = [];
  const seenUrls = new Set();

  for (let i = 0; i < years.length; i++) {
    const y = years[i];
    const url = `https://www.ipa.go.jp/news/${y}/index.html?=exam`;
    try {
      const res = UrlFetchApp.fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) certificateInfo-GAS-bot/1.0',
          'Accept-Language': 'ja'
        },
        muteHttpExceptions: true
      });

      if (res.getResponseCode() === 200) {
        const html = res.getContentText('UTF-8');
        const parts = html.split(/<li\s+[^>]*class="[^"]*news-list__item[^"]*"/i);

        for (let j = 1; j < parts.length; j++) {
          const block = parts[j];
          const searchMatch = block.match(/^([^>]*)data-search="([^"]*)"/i);
          const dataSearch = searchMatch ? searchMatch[2] : '';
          const isExam = dataSearch.includes('exam');

          const aMatch = block.match(/<a\s+[^>]*href="([^"]+)"/i);
          let linkUrl = aMatch ? aMatch[1].trim() : '';
          if (linkUrl && !linkUrl.startsWith('http')) {
            linkUrl = 'https://www.ipa.go.jp' + (linkUrl.startsWith('/') ? '' : '/') + linkUrl;
          }

          const dMatch = block.match(/<li[^>]*class="[^"]*news-list__date[^"]*"[^>]*>([\s\S]*?)<\/li>/i);
          const tMatch = block.match(/<p[^>]*class="[^"]*news-list__ttl[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
          const title = tMatch ? tMatch[1].replace(/<[^>]+>/g, '').trim() : '';

          if (title && linkUrl && (isExam || title.includes('試験'))) {
            if (!seenUrls.has(linkUrl)) {
              seenUrls.add(linkUrl);
              allItems.push({
                provider: 'IPA（情報処理推進機構）',
                date: dMatch ? dMatch[1].replace(/<[^>]+>/g, '').trim() : '',
                title: title,
                url: linkUrl,
                description: title,
                relatedQualifications: matchIpaQualifications(title)
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn(`IPA ${y}年度の取得エラー:`, e.message);
    }

    if (i < years.length - 1) {
      Utilities.sleep(1000);
    }
  }

  handleDiff('IPA', allItems, properties, webhookUrl, 'url');
}

/**
 * AWS チェック処理
 */
function checkAws(properties, webhookUrl) {
  let res = UrlFetchApp.fetch(ENDPOINTS.AWS, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) {
    res = UrlFetchApp.fetch(ENDPOINTS.AWS_EN, { muteHttpExceptions: true });
  }
  if (res.getResponseCode() !== 200) return;
  const xml = res.getContentText('UTF-8');

  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = itemRegex.exec(xml)) !== null) {
    const tMatch = m[1].match(/<title>([\s\S]*?)<\/title>/i);
    const lMatch = m[1].match(/<link>([\s\S]*?)<\/link>/i);
    const dMatch = m[1].match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const descMatch = m[1].match(/<description>([\s\S]*?)<\/description>/i);
    if (tMatch && lMatch) {
      const title = tMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
      const link = lMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
      const date = dMatch ? dMatch[1].trim() : '';
      const desc = descMatch ? descMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').trim() : title;
      items.push({
        provider: 'Amazon Web Services (AWS)',
        title: title,
        url: link,
        date: date,
        description: desc,
        relatedQualifications: matchAwsQualifications(`${title} ${desc}`)
      });
    }
  }

  handleDiff('AWS', items, properties, webhookUrl, 'url');
}

/**
 * Microsoft チェック処理
 */
function checkMicrosoft(properties, webhookUrl) {
  const res = UrlFetchApp.fetch(ENDPOINTS.MICROSOFT, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) return;
  const json = JSON.parse(res.getContentText('UTF-8'));
  const certs = json.certifications || [];

  const items = certs.map(c => ({
    provider: 'Microsoft',
    uid: c.uid,
    title: c.title,
    url: c.url,
    date: c.last_modified,
    description: c.summary || c.title || '',
    relatedQualifications: matchMicrosoftQualifications(c)
  }));

  handleDiff('MICROSOFT', items, properties, webhookUrl, 'uid', 'date');
}

/**
 * LPI & LinuC チェック処理
 */
function checkLpi(properties, webhookUrl) {
  const items = [];

  // LPI RSS
  try {
    const resLpi = UrlFetchApp.fetch(ENDPOINTS.LPI, { muteHttpExceptions: true });
    if (resLpi.getResponseCode() === 200) {
      const xml = resLpi.getContentText('UTF-8');
      const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
      let m;
      while ((m = itemRegex.exec(xml)) !== null) {
        const tMatch = m[1].match(/<title>([\s\S]*?)<\/title>/i);
        const lMatch = m[1].match(/<link>([\s\S]*?)<\/link>/i);
        const dMatch = m[1].match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
        if (tMatch && lMatch) {
          const title = tMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
          const link = lMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
          const date = dMatch ? dMatch[1].trim() : '';
          items.push({
            provider: 'LPI (Linux Professional Institute)',
            title: title,
            url: link,
            date: date,
            description: title,
            relatedQualifications: matchLpiQualifications(title)
          });
        }
      }
    }
  } catch (e) {
    console.error('LPI取得エラー:', e.message);
  }

  // LinuC News
  try {
    const resLinuc = UrlFetchApp.fetch(ENDPOINTS.LINUC, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      muteHttpExceptions: true
    });
    if (resLinuc.getResponseCode() === 200) {
      const html = resLinuc.getContentText('UTF-8');
      const regex = /<li class="app-news-item">([\s\S]*?)<\/li>/gi;
      let m;
      while ((m = regex.exec(html)) !== null) {
        const dMatch = m[1].match(/<span class="app-news-date">([\s\S]*?)<\/span>/i);
        const lMatch = m[1].match(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
        if (lMatch) {
          let url = lMatch[1].trim();
          if (!url.startsWith('http')) url = 'https://linuc.org' + (url.startsWith('/') ? '' : '/') + url;
          const title = lMatch[2].replace(/<[^>]+>/g, '').trim();
          items.push({
            provider: 'LPI-Japan (LinuC)',
            title: title,
            url: url,
            date: dMatch ? dMatch[1].trim() : '',
            description: title,
            relatedQualifications: matchLpiQualifications(title)
          });
        }
      }
    }
  } catch (e) {
    console.error('LinuC取得エラー:', e.message);
  }

  handleDiff('LPI', items, properties, webhookUrl, 'url');
}

/**
 * 差分検知とSlack通知
 */
function handleDiff(key, items, properties, webhookUrl, idKey = 'url', updateKey = null) {
  const propKey = `SAVED_STATE_${key}`;
  const savedRaw = properties.getProperty(propKey);
  const savedList = savedRaw ? JSON.parse(savedRaw) : [];

  if (savedList.length === 0) {
    updateQualificationSheet(items.filter(item => item.date || item.lastModified));
    properties.setProperty(propKey, JSON.stringify(items.slice(0, 50)));
    console.log(`[${key}] 初回ベースライン保存完了 (${items.length}件)`);
    return;
  }

  const prevMap = new Map();
  for (const s of savedList) {
    if (s[idKey]) prevMap.set(s[idKey], s);
  }

  const diffs = [];
  for (const curr of items) {
    const id = curr[idKey];
    if (!id) continue;
    if (!prevMap.has(id)) {
      diffs.push({ ...curr, type: '新着' });
    } else if (updateKey && curr[updateKey] && prevMap.get(id)[updateKey] !== curr[updateKey]) {
      diffs.push({ ...curr, type: '更新' });
    }
  }

  if (diffs.length > 0) {
    console.log(`[${key}] 差分検知: ${diffs.length} 件`);
    // 資格単位でスプレッドシートを更新し、更新された資格一覧を取得
    const appliedUpdates = updateQualificationSheet(diffs);
    if (appliedUpdates && appliedUpdates.length > 0) {
      for (const update of appliedUpdates) {
        sendSlackNotification(update, webhookUrl);
      }
    } else {
      // 資格紐付けのない全体更新通知のフォールバック
      for (const diff of diffs) {
        sendSlackNotification(diff, webhookUrl);
      }
    }
    properties.setProperty(propKey, JSON.stringify(items.slice(0, 50)));
  } else {
    console.log(`[${key}] 変更なし`);
  }
}

/**
 * 更新情報を資格番号に対応するスプレッドシート行へ反映する
 * 前回実行時より新しい情報がある資格のみ更新し、更新された資格リストを返す
 * @param {Array<object>} items
 * @returns {Array<object>} 更新された資格情報のリスト
 */
function updateQualificationSheet(items) {
  const updatesByQualification = new Map();
  for (const item of items) {
    const qualifications = item.relatedQualifications || [];
    for (const qualification of qualifications) {
      const no = Number(qualification.no);
      if (!Number.isInteger(no) || no <= 0) continue;

      const candidate = {
        no: no,
        qualificationName: qualification.name || '',
        provider: item.provider || '',
        date: item.date || item.lastModified || '',
        title: item.title || item.name || '',
        url: item.url || item.officialUrl || '',
        description: item.description || item.summary || item.title || item.name || ''
      };
      if (!candidate.title) continue;

      const previous = updatesByQualification.get(no);
      if (!previous || isNewerSheetUpdate(candidate, previous)) {
        updatesByQualification.set(no, candidate);
      }
    }
  }
  if (updatesByQualification.size === 0) return [];

  const properties = PropertiesService.getScriptProperties();
  const spreadsheetUrl = properties.getProperty('QUALIFICATIONS_SPREADSHEET_URL') || DEFAULT_SPREADSHEET_URL;
  const sheetName = properties.getProperty('QUALIFICATIONS_SHEET_NAME');
  const spreadsheet = SpreadsheetApp.openByUrl(spreadsheetUrl);
  const sheet = sheetName
    ? spreadsheet.getSheetByName(sheetName)
    : spreadsheet.getSheets()[0];
  if (!sheet) {
    throw new Error(sheetName
      ? `資格一覧シートが見つかりません: ${sheetName}`
      : 'スプレッドシートにシートがありません');
  }

  const values = sheet.getDataRange().getValues();
  if (values.length === 0) throw new Error('資格一覧シートにヘッダー行がありません');

  const headers = values[0].map(value => String(value).trim());
  const numberColumn = headers.indexOf('No');
  const nameColumn = headers.indexOf('資格名');
  const dateColumn = headers.indexOf('最終更新日時');
  const titleColumn = headers.indexOf('タイトル');
  const descriptionColumn = headers.indexOf('説明');
  let urlColumn = headers.indexOf('URL');
  if (urlColumn < 0) {
    urlColumn = headers.indexOf('更新情報URL');
  }
  if ([numberColumn, dateColumn, titleColumn, descriptionColumn].some(column => column < 0)) {
    throw new Error('資格一覧シートに必要な列（No、最終更新日時、タイトル、説明）がありません');
  }
  if (urlColumn < 0) {
    urlColumn = headers.length;
    sheet.getRange(1, urlColumn + 1).setValue('URL');
  }

  const rowsByQualification = new Map();
  for (let index = 1; index < values.length; index++) {
    const no = Number(values[index][numberColumn]);
    if (!Number.isInteger(no) || !updatesByQualification.has(no)) continue;
    if (rowsByQualification.has(no)) {
      throw new Error(`資格番号 ${no} の行が重複しています`);
    }
    rowsByQualification.set(no, index + 1);
  }

  const appliedUpdates = [];
  for (const [no, update] of updatesByQualification) {
    const row = rowsByQualification.get(no);
    if (!row) {
      console.warn(`資格番号 ${no} の行が資格一覧シートにありません`);
      continue;
    }

    const rowValues = values[row - 1];
    const existingDate = dateColumn >= 0 ? String(rowValues[dateColumn] || '').trim() : '';
    const existingTitle = titleColumn >= 0 ? String(rowValues[titleColumn] || '').trim() : '';
    const existingUrl = urlColumn >= 0 ? String(rowValues[urlColumn] || '').trim() : '';
    const existingQualificationName = nameColumn >= 0 ? String(rowValues[nameColumn] || '').trim() : '';
    const qualificationName = existingQualificationName || update.qualificationName || `資格No.${no}`;

    // 各資格ごとに収集した更新情報が前回実行時（シート上の情報）より新しい情報があるか確認する
    const hasExistingDate = Boolean(existingDate && !Number.isNaN(getSheetUpdateTimestamp(existingDate)));
    const hasCandidateDate = Boolean(update.date && !Number.isNaN(getSheetUpdateTimestamp(update.date)));

    let isChanged = false;
    if (hasCandidateDate && hasExistingDate) {
      // 両方に日付がある場合、候補の日付が厳密に新しい場合のみ更新
      isChanged = isNewerSheetUpdate(update, { date: existingDate });
    } else if (hasCandidateDate && !hasExistingDate) {
      // シートに日付がなく、候補に日付がある場合は更新
      isChanged = true;
    } else {
      // 日付がない取得元の場合はタイトルまたはURLの変更で判定
      isChanged = !existingTitle || (update.title && update.title !== existingTitle) || (update.url && update.url !== existingUrl);
    }

    if (isChanged) {
      if (update.date) sheet.getRange(row, dateColumn + 1).setValue(update.date);
      sheet.getRange(row, titleColumn + 1).setValue(update.title);
      if (update.url) sheet.getRange(row, urlColumn + 1).setValue(update.url);
      sheet.getRange(row, descriptionColumn + 1).setValue(update.description);

      appliedUpdates.push({
        no: no,
        qualificationName: qualificationName,
        date: update.date,
        title: update.title,
        url: update.url,
        description: update.description,
        provider: update.provider
      });
    }
  }

  return appliedUpdates;
}

function isNewerSheetUpdate(candidate, previous) {
  const candidateTime = getSheetUpdateTimestamp(candidate.date);
  const previousTime = getSheetUpdateTimestamp(previous.date);
  if (Number.isFinite(candidateTime) && Number.isFinite(previousTime)) {
    return candidateTime > previousTime;
  }
  if (Number.isFinite(candidateTime)) return true;
  return false;
}

function getSheetUpdateTimestamp(value) {
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
 * Slack通知送信（更新日時、資格名、タイトル、URL、説明を整形して投稿）
 */
function sendSlackNotification(item, webhookUrl) {
  if (!webhookUrl) return;

  const date = item.date || '未記載';
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
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*更新日時:*\n${date}` },
          { type: 'mrkdwn', text: `*資格名:*\n${qualificationName}` }
        ]
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*タイトル:*\n${title}` },
          { type: 'mrkdwn', text: `*URL:*\n${url ? `<${url}|${url}>` : '未記載'}` }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*説明:*\n${description}`
        }
      },
      { type: 'divider' }
    ]
  };

  UrlFetchApp.fetch(webhookUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}
