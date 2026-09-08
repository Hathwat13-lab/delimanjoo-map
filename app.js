'use strict';

const list = document.querySelector('#store-list');
const status = document.querySelector('#load-status');
const count = document.querySelector('#store-count');
const regionFilter = document.querySelector('#region-filter');
const dialog = document.querySelector('#add-dialog');
document.querySelector('#add-place').addEventListener('click', () => dialog.showModal());

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function regionOf(address) {
  return address.trim().split(/\s+/)[0] || '기타';
}

function renderStore(store) {
  const details = element('details');
  const summary = element('summary');
  summary.append(element('span', store.name, 'store-name'), element('span', store.brand || '브랜드 미등록', 'brand'));
  const body = element('div', undefined, 'store-detail');
  const fields = element('dl');
  const feedback = element('p', '', 'copy-status');
  feedback.setAttribute('role', 'status');
  const verified = new Date(store.verifiedAt);
  const time = Number.isNaN(verified.getTime()) ? '미등록' : new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).format(verified) + ' (한국 시간)';

  for (const [label, value] of [['주소', store.address], ['브랜드', store.brand], ['전화번호', store.phone], ['영업시간', store.hours], ['비고', store.note], ['확인 일시', time]]) {
    const entry = element('dd', value || '-');
    if (label === '주소') {
      const actions = element('span', undefined, 'address-actions');
      const copy = element('button', '복사', 'text-button');
      copy.type = 'button';
      copy.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(store.address);
          feedback.textContent = '주소를 복사했습니다.';
        } catch {
          feedback.textContent = '주소를 선택해 직접 복사해 주세요.';
        }
      });
      const query = encodeURIComponent(store.address);
      const naver = element('a', '네이버');
      naver.href = `https://map.naver.com/p/search/${query}`;
      const kakao = element('a', '카카오');
      kakao.href = `https://map.kakao.com/link/search/${query}`;
      actions.append(copy, naver, kakao);
      entry.className = 'address-line';
      entry.replaceChildren(element('span', value), actions);
    }
    if (label === '전화번호' && /^[\d+()\s-]+$/.test(value || '')) {
      const link = element('a', value);
      link.href = 'tel:' + value.replace(/[^\d+]/g, '');
      entry.replaceChildren(link);
    }
    fields.append(element('dt', label), entry);
  }
  fields.append(element('dt', ''), feedback);
  body.append(fields);
  details.append(summary, body);
  return details;
}

function renderStores(stores) {
  const region = regionFilter.value;
  const shown = region ? stores.filter(store => regionOf(store.address) === region) : stores;
  list.replaceChildren(...shown.map(renderStore));
  count.textContent = region ? `${region} ${shown.length}곳 / 전체 ${stores.length}곳` : `등록 장소 ${stores.length}곳`;
  status.textContent = shown.length ? '' : '해당 지역에 등록된 장소가 없습니다.';
  status.hidden = shown.length > 0;
}

async function loadStores() {
  try {
    const response = await fetch('./data/stores.json');
    if (!response.ok) throw new Error('목록 요청 실패');
    const stores = await response.json();
    if (!Array.isArray(stores) || stores.some(store => !store || typeof store.name !== 'string' || typeof store.address !== 'string')) throw new Error('잘못된 데이터');
    const regions = [...new Set(stores.map(store => regionOf(store.address)))].sort((a, b) => a.localeCompare(b, 'ko'));
    regionFilter.append(...regions.map(region => {
      const option = element('option', region);
      option.value = region;
      return option;
    }));
    regionFilter.disabled = false;
    regionFilter.addEventListener('change', () => renderStores(stores));
    renderStores(stores);
  } catch {
    count.textContent = '목록 확인 필요';
    status.textContent = location.protocol === 'file:'
      ? '파일을 직접 열면 목록을 읽을 수 없습니다. 로컬 웹서버 또는 GitHub Pages에서 열어 주세요.'
      : '목록을 불러오지 못했습니다. 잠시 후 새로고침해 주세요.';
  }
}
loadStores();

