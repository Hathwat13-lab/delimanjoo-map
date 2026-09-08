import fs from 'node:fs';
import path from 'node:path';

const issue = JSON.parse(process.env.ISSUE_JSON || '{}');
const dataPath = new URL('../data/stores.json', import.meta.url);
const stores = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

function fieldsFrom(body = '') {
  const fields = {};
  for (const line of body.split(/\r?\n/)) {
    const match = line.match(/^- (ID|점포명|주소|브랜드|전화번호|영업시간|비고|확인 일시):\s*(.*)$/);
    if (match) fields[match[1]] = match[2].trim();
  }
  return fields;
}

function required(value, label) {
  if (!value || value === '-') throw new Error(`${label} 값이 없습니다.`);
  return value;
}

const fields = fieldsFrom(issue.body);
const mode = issue.title?.startsWith('[장소 수정]') ? 'edit' : issue.title?.startsWith('[장소 추가]') ? 'add' : '';
if (!mode) throw new Error('지원하지 않는 이슈 제목입니다.');

const record = {
  id: mode === 'edit' ? required(fields.ID, 'ID') : `store-${issue.number}`,
  name: required(fields.점포명, '점포명'),
  address: required(fields.주소, '주소'),
  brand: fields.브랜드 === '-' ? '' : (fields.브랜드 || ''),
  phone: fields.전화번호 || '-',
  hours: fields.영업시간 || '-',
  note: fields.비고 === '-' ? '' : (fields.비고 || ''),
  verifiedAt: new Date(issue.updated_at || issue.created_at || Date.now()).toISOString(),
  sourceIssue: issue.number
};

if (mode === 'add') {
  const duplicate = stores.some(store => store.id === record.id || (store.name === record.name && store.address === record.address));
  if (!duplicate) stores.push(record);
} else {
  const index = stores.findIndex(store => store.id === record.id);
  if (index < 0) throw new Error(`ID ${record.id}에 해당하는 장소가 없습니다.`);
  stores[index] = { ...stores[index], ...record };
}

fs.writeFileSync(dataPath, JSON.stringify(stores, null, 2) + '\n');
