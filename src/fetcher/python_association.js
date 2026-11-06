const {
  fetchOfficialPage,
  createPageSnapshot,
  decodeHtml,
  textFromHtml,
  hashContent,
} = require('./official_web');

const PYTHON_NEWS_FEED_URL = 'https://pythonic-exam.com/feed/';
const PYTHON_EXAMS = [
  {
    no: 99,
    name: 'Python3 エンジニア認定基礎試験',
    url: 'https://www.pythonic-exam.com/exam/basic',
  },
  {
    no: 100,
    name: 'Python3 エンジニア認定データ分析試験',
    url: 'https://www.pythonic-exam.com/exam/data-analyst',
  },
];

function parsePythonNewsFeed(xml) {
  const items = [];
  const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/i);
    const dateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const descriptionMatch = block.match(/<description>([\s\S]*?)<\/description>/i);
    const title = titleMatch ? decodeHtml(titleMatch[1]).trim() : '';
    const url = linkMatch ? decodeHtml(linkMatch[1]).trim() : '';
    const description = descriptionMatch
      ? textFromHtml(descriptionMatch[1])
      : '';
    const sourceText = `${title} ${description}`;
    if (!title || !url || !/(python.{0,30}(認定|試験)|(?:認定|試験).{0,30}python)/i.test(sourceText)) continue;

    const relatedQualifications = PYTHON_EXAMS
      .filter(exam => sourceText.toLowerCase().includes(exam.name.replace('Python3 ', '').toLowerCase()) ||
        (exam.no === 99 && /基礎試験/.test(sourceText)) ||
        (exam.no === 100 && /データ分析試験/.test(sourceText)))
      .map(({ no, name }) => ({ no, name }));
    items.push({
      provider: 'Pythonエンジニア育成推進協会',
      title,
      url,
      date: dateMatch ? decodeHtml(dateMatch[1]).trim() : '',
      description,
      contentHash: hashContent(`${title} ${description}`),
      relatedQualifications,
    });
  }
  return items;
}

async function fetchPythonAssociationUpdates(customPages = null) {
  const items = [];
  for (const exam of PYTHON_EXAMS) {
    const html = customPages ? customPages[exam.url] : await fetchOfficialPage(exam.url);
    if (typeof html !== 'string') {
      throw new Error(`Pythonエンジニア育成推進協会のテストデータがありません: ${exam.url}`);
    }
    items.push(createPageSnapshot(
      'Pythonエンジニア育成推進協会',
      `${exam.name}の更新`,
      exam.url,
      html,
      [{ no: exam.no, name: exam.name }]
    ));
    if (!customPages && exam.no === PYTHON_EXAMS[0].no) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  const feed = customPages
    ? customPages[PYTHON_NEWS_FEED_URL]
    : await fetchOfficialPage(PYTHON_NEWS_FEED_URL, 'application/rss+xml,application/xml,text/xml');
  if (typeof feed !== 'string') {
    throw new Error(`Pythonエンジニア育成推進協会のRSSテストデータがありません: ${PYTHON_NEWS_FEED_URL}`);
  }
  items.push(...parsePythonNewsFeed(feed));
  return items;
}

module.exports = {
  PYTHON_NEWS_FEED_URL,
  PYTHON_EXAMS,
  parsePythonNewsFeed,
  fetchPythonAssociationUpdates,
};
