const {
  fetchOfficialPage,
  createPageSnapshot,
  extractLinkedItems,
} = require('./official_web');

const CNCF_BLOG_URL = 'https://www.cncf.io/blog/';
const LINUX_FOUNDATION_BLOG_URL = 'https://training.linuxfoundation.org/blog/';
const CNCF_QUALIFICATIONS = [
  { no: 84, name: 'Certified Kubernetes Administrator (CKA)', aliases: ['CKA', 'Kubernetes Administrator'] },
  { no: 85, name: 'Certified Kubernetes Application Developer (CKAD)', aliases: ['CKAD', 'Kubernetes Application Developer'] },
  { no: 86, name: 'Certified Kubernetes Security Specialist (CKS)', aliases: ['CKS', 'Kubernetes Security Specialist'] },
  { no: 87, name: 'Kubernetes and Cloud Native Associate (KCNA)', aliases: ['KCNA', 'Cloud Native Associate'] },
];

function matchCNCFQualifications(text) {
  return CNCF_QUALIFICATIONS
    .filter(qualification => qualification.aliases.some(alias => {
      if (/^[A-Z]+$/.test(alias)) {
        return new RegExp(`(^|[^A-Z0-9])${alias}($|[^A-Z0-9])`, 'i').test(text);
      }
      return text.toLowerCase().includes(alias.toLowerCase());
    }))
    .map(({ no, name }) => ({ no, name }));
}

async function fetchCNCFNews(customPages = null) {
  const pages = [];
  for (const [provider, url] of [
    ['CNCF', CNCF_BLOG_URL],
    ['Linux Foundation', LINUX_FOUNDATION_BLOG_URL],
  ]) {
    const html = customPages ? customPages[url] : await fetchOfficialPage(url);
    if (typeof html !== 'string') {
      throw new Error(`CNCF / Linux Foundation公式ページのテストデータがありません: ${url}`);
    }

    const articles = extractLinkedItems(
      html,
      url,
      provider,
      matchCNCFQualifications,
      /cka|ckad|cks|kcna|certification|certified|credential|exam|kubernetes.{0,40}(administrator|developer|security|associate)/i
    );
    pages.push(createPageSnapshot(
      provider,
      `${provider} certification updates`,
      url,
      html,
      CNCF_QUALIFICATIONS
    ), ...articles);

    if (!customPages && url === CNCF_BLOG_URL) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  return pages;
}

module.exports = {
  CNCF_QUALIFICATIONS,
  matchCNCFQualifications,
  fetchCNCFNews,
};
