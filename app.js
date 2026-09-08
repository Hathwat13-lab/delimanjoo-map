'use strict';

const list = document.querySelector('#store-list');
const status = document.querySelector('#load-status');
const count = document.querySelector('#store-count');
const dialog = document.querySelector('#add-dialog');
document.querySelector('#add-place').addEventListener('click', () => dialog.showModal());

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function renderStore(store) {
  const details = element('details');
  const summary = element('summary');
  summary.append(element('span', store.name, 'store-name'), element('span', store.brand || '브랜드 미등록', 'brand'));
  const body = element('div', undefined, 'store-detail');
  const fields = element('dl');
  const verified = new Date(store.verifiedAt);
  const time = Number.isNaN(verified.getTime()) ? '미등록' : new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).format(verified) + ' (한국 시간)';
  for (const [label, value] of [['주소', store.address], ['브랜드', store.brand], ['전화번호', store.phone], ['영업시간', store.hours], ['비고', store.note], ['확인 일시', time]]) {
    const entry = element('dd', value || '-');
    if (label === '전화번호' && /^[\d+()\s-]+$/.test(value || '')) {
      const link = element('a', value);
      link.href = 'tel:' + value.replace(/[^\d+]/g, '');
      entry.replaceChildren(link);
    }
    fields.append(element('dt', label), entry);
  }
  const copy = element('button', '주소 복사', 'copy-button');
  copy.type = 'button';
  const feedback = element('p', '', 'copy-status');
  feedback.setAttribute('role', 'status');
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(store.address);
      feedback.textContent = '주소를 복사했어요. 원하는 지도 앱에 붙여넣어 주세요.';
    } catch {
      feedback.textContent = '자동 복사가 지원되지 않습니다. 위 주소를 선택해 직접 복사해 주세요.';
    }
  });
  body.append(fields, copy, feedback);
  details.append(summary, body);
  return details;
}

async function loadStores() {
  try {
    const response = await fetch('./data/stores.json');
    if (!response.ok) throw new Error('목록 요청 실패');
    const stores = await response.json();
    if (!Array.isArray(stores) || stores.some(store => !store || typeof store.name !== 'string' || typeof store.address !== 'string')) throw new Error('잘못된 데이터');
    list.replaceChildren(...stores.map(renderStore));
    count.textContent = `등록 장소 ${stores.length}곳`;
    status.textContent = stores.length ? '' : '아직 등록된 장소가 없습니다.';
    status.hidden = stores.length > 0;
  } catch {
    count.textContent = '목록 확인 필요';
    status.textContent = location.protocol === 'file:'
      ? '파일을 직접 열면 목록을 읽을 수 없습니다. 로컬 웹서버 또는 GitHub Pages에서 열어 주세요.'
      : '목록을 불러오지 못했습니다. 잠시 후 새로고침해 주세요.';
  }
}
loadStores();
