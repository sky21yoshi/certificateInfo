/**
 * Microsoft Learn 認定情報フェッチャー (Catalog API ベース)
 */

const MS_CATALOG_URL = 'https://learn.microsoft.com/api/catalog/';

// 監視対象のMicrosoft資格キーワード定義
const MS_TARGET_PATTERNS = [
  { no: 19, name: 'Azure認定 fundamentals系', match: c => c.uid.includes('azure-fundamentals') || c.title.includes('Azure Fundamentals') },
  { no: 20, name: 'Azure認定 Associate系', match: c => c.uid.includes('azure-administrator') || c.uid.includes('azure-developer') },
  { no: 21, name: 'Azure認定 Expert系', match: c => c.uid.includes('azure-solutions-architect') || c.uid.includes('devops-engineer') },
  { no: 22, name: 'Azure認定 Specialty系', match: c => c.certification_type === 'specialty' || c.uid.includes('specialty') },
  { no: 27, name: 'Security Operations Analyst Associate', match: c => c.uid.includes('security-operations-analyst') || c.title.includes('Security Operations Analyst') },
  { no: 28, name: 'Collaboration Communications Systems Engineer Associate', match: c => c.uid.includes('collaboration-communications') || c.title.includes('Collaboration Communications') },
  { no: 29, name: 'Endpoint Administrator Associate', match: c => c.uid.includes('endpoint-administrator') || c.title.includes('Endpoint Administrator') },
  { no: 30, name: 'Teams Administrator Associate', match: c => c.uid.includes('teams-administrator') || c.title.includes('Teams Administrator') },
  { no: 31, name: 'Identity and Access Administrator Associate', match: c => c.uid.includes('identity-and-access-administrator') || c.title.includes('Identity and Access Administrator') },
  { no: 32, name: 'Power Platform Solution Architect Expert', match: c => c.uid.includes('power-platform-solution-architect') || c.title.includes('Power Platform Solution Architect') },
  { no: 33, name: 'Information Protection and Compliance Administrator Associate', match: c => c.uid.includes('information-protection') || c.title.includes('Information Protection') },
  { no: 34, name: 'Cybersecurity Architect Expert', match: c => c.uid.includes('cybersecurity-architect') || c.title.includes('Cybersecurity Architect') },
  { no: 35, name: 'Windows Server Hybrid Administrator Associate', match: c => c.uid.includes('windows-server-hybrid') || c.title.includes('Windows Server Hybrid') },
  { no: 36, name: 'Power Platform Fundamentals', match: c => c.uid.includes('power-platform-fundamentals') || c.title.includes('Power Platform Fundamentals') },
  { no: 37, name: 'Power Automate RPA Developer Associate', match: c => c.uid.includes('power-automate-rpa-developer') || c.title.includes('Power Automate RPA Developer') },
  { no: 38, name: 'Power BI Data Analyst Associate', match: c => c.uid.includes('power-bi-data-analyst') || c.title.includes('Power BI Data Analyst') },
  { no: 39, name: 'Power Platform Developer Associate', match: c => c.uid.includes('power-platform-developer') || c.title.includes('Power Platform Developer') },
];

/**
 * Microsoft Learn Catalog API から認定資格情報を取得する
 * @param {object} [customData] テスト用JSONデータ
 * @returns {Promise<Array<object>>}
 */
async function fetchMicrosoftCertifications(customData = null) {
  let data = customData;
  if (!data) {
    const res = await fetch(MS_CATALOG_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) certificateInfo-bot/1.0',
        'Accept': 'application/json'
      }
    });
    if (!res.ok) {
      throw new Error(`Microsoft Learn Catalog API の取得に失敗しました: HTTP ${res.status}`);
    }
    data = await res.json();
  }

  const certs = data.certifications || [];
  const results = [];

  for (const cert of certs) {
    const matched = [];
    for (const pattern of MS_TARGET_PATTERNS) {
      if (pattern.match(cert)) {
        matched.push({ no: pattern.no, name: pattern.name });
      }
    }

    // 対象リストにマッチするもの、または更新監視対象として抽出
    if (matched.length > 0) {
      results.push({
        uid: cert.uid,
        title: cert.title,
        url: cert.url,
        lastModified: cert.last_modified,
        type: cert.certification_type || cert.type,
        relatedQualifications: matched,
      });
    }
  }

  return results;
}

module.exports = {
  MS_TARGET_PATTERNS,
  fetchMicrosoftCertifications,
};
