const {
  fetchOfficialPage,
  createPageSnapshot,
} = require('./official_web');

const BROADCOM_CERTIFICATION_URL = 'https://www.broadcom.com/support/education/vmware/certification';
const BROADCOM_QUALIFICATIONS = [
  { no: 67, name: 'VCP (VMware Certified Professional)' },
  { no: 68, name: 'VCAP (VMware Certified Advanced Professional)' },
  { no: 69, name: 'VCDX (VMware Certified Design Expert)' },
  { no: 70, name: 'VCTA (VMware Certified Technical Associate)' },
];

async function fetchBroadcomUpdates(customHtml = null) {
  const html = customHtml === null ? await fetchOfficialPage(BROADCOM_CERTIFICATION_URL) : customHtml;
  return [createPageSnapshot(
    'Broadcom',
    'VMware Certification program updates',
    BROADCOM_CERTIFICATION_URL,
    html,
    BROADCOM_QUALIFICATIONS
  )];
}

module.exports = { BROADCOM_QUALIFICATIONS, fetchBroadcomUpdates };
