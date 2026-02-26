import * as XLSX from 'xlsx';
import * as fs from 'fs';

const file = '/home/belal/Documents/SEMS/questions/أحياء/أحياء  نموذج 1.xlsx';
const workbook = XLSX.read(fs.readFileSync(file), { type: 'buffer' });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);
console.log('Keys found in row 0:', Object.keys(data[0] || {}));
console.log('Row 0 data:', data[0]);
