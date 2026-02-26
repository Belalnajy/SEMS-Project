import * as XLSX from 'xlsx';
import path from 'path';

const data = [
  {
    م: 1,
    'رقم الطالبة': '1142564424',
    'اسم الطالبة': 'اسان علي بن يحي ازيبي',
    الفصل: '1',
  },
  {
    م: 2,
    'رقم الطالبة': '1145431781',
    'اسم الطالبة': 'الجوهره بنت علي بن حسين الخزمري الزهراني',
    الفصل: '1',
  },
  {
    م: 3,
    'رقم الطالبة': '1146100542',
    'اسم الطالبة': 'ألين بنت فهد بن مقنع بن عطيه آل الصحبه المعلوي',
    الفصل: '1',
  },
  {
    م: 4,
    'رقم الطالبة': '1149062588',
    'اسم الطالبة': 'ايثار علي محمد العيافي',
    الفصل: '1',
  },
];

const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Students');

const filePath = path.join(__dirname, '../test_students.xlsx');
XLSX.writeFile(wb, filePath);

console.log(`Test file created at: ${filePath}`);
