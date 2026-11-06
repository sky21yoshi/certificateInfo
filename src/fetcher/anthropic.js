const {
  fetchOfficialPage,
  createPageSnapshot,
  extractLinkedItems,
} = require('./official_web');

const ANTHROPIC_ACADEMY_URL = 'https://academy.claude.com/courses';
const ANTHROPIC_QUALIFICATIONS = [
  { no: 88, name: 'Claude Certified Associate – Foundations (CCAO-F)' },
  { no: 89, name: 'Claude Certified Architect – Foundations (CCAR-F)' },
  { no: 90, name: 'Claude Certified Developer – Foundations (CCDV-F)' },
  { no: 91, name: 'Claude Certified Architect – Professional (CCAR-P)' },
];

function matchAnthropicQualifications(text) {
  const normalized = text.toLowerCase();
  return ANTHROPIC_QUALIFICATIONS
    .filter(({ name }) => {
      const code = name.match(/\(([^)]+)\)$/)[1].toLowerCase();
      return normalized.includes(code) || normalized.includes(name.split(' (')[0].toLowerCase());
    })
    .map(({ no, name }) => ({ no, name }));
}

async function fetchAnthropicUpdates(customHtml = null) {
  const html = customHtml === null ? await fetchOfficialPage(ANTHROPIC_ACADEMY_URL) : customHtml;
  const snapshot = createPageSnapshot(
    'Anthropic',
    'Claude Academy course and certification catalog',
    ANTHROPIC_ACADEMY_URL,
    html,
    ANTHROPIC_QUALIFICATIONS
  );
  const courses = extractLinkedItems(
    html,
    ANTHROPIC_ACADEMY_URL,
    'Anthropic',
    matchAnthropicQualifications,
    /claude certified|certification|credential/i
  );
  return [snapshot, ...courses];
}

module.exports = {
  ANTHROPIC_QUALIFICATIONS,
  matchAnthropicQualifications,
  fetchAnthropicUpdates,
};
