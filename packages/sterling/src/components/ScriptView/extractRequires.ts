export function extractRequires(text: string): [string[], string] {
  const lines = text.split('\n');
  const requires: string[] = [];
  let firstIndex = 0;
  for (let i = 0; i < lines.length; ++i) {
    const line = lines[i];
    const found = line.match(/require\(['|"](.*)['|"]\)/);
    if (found) {
      requires.push(found[1]);
      firstIndex += 1;
    } else {
      break;
    }
  }
  return [requires, lines.slice(firstIndex).join('\n')];
}
