const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Regex for emoji or unusual symbols
const nonAsciiSymbols = [];
for (let i = 0; i < html.length; i++) {
  const code = html.charCodeAt(i);
  // Vietnamese characters are roughly:
  // Latin-1 Supplement (0x00C0-0x00FF), Latin Extended-A (0x0100-0x017F),
  // Latin Extended Additional (0x1EA0-0x1EF9)
  // General Punctuation (0x2000-0x206F, like quotes, dashes)
  // Currency (0x20AB = ₫)
  if (code > 127) {
    const char = html[i];
    // check if it's standard Vietnamese or punctuation
    const isVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ₫–—…“”‘’•]/.test(char);
    if (!isVietnamese) {
      nonAsciiSymbols.push({ index: i, char, code: code.toString(16) });
    }
  }
}

console.log('Non-standard / symbol count:', nonAsciiSymbols.length);
const uniqueSymbols = [...new Set(nonAsciiSymbols.map(s => s.char))];
console.log('Unique non-standard chars:', uniqueSymbols);
uniqueSymbols.forEach(char => {
  const sample = nonAsciiSymbols.find(s => s.char === char);
  const context = html.slice(Math.max(0, sample.index - 30), Math.min(html.length, sample.index + 30));
  console.log(`Char: ${char} (U+${sample.code}): ${context.replace(/\n/g, ' ')}`);
});
