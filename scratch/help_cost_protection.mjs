import { Workbook } from '@oai/artifact-tool';
const w=Workbook.create();w.worksheets.add('Sheet1');
console.log(w.help('worksheet.protection',{include:'index,examples,notes',maxChars:5000}).ndjson);
console.log(w.help('range.format.protection',{include:'index,examples,notes',maxChars:5000}).ndjson);
console.log(w.help('lock cells protect sheet',{search:'protect|locked',include:'index,examples,notes',maxChars:7000}).ndjson);
