const regex =
  /(?<!var\([^)]*)\b([1-9][0-9]*(\.[0-9]+)?|0\.[0-9]+)(px|rem|em)\b|#([0-9A-Fa-f]{3}){1,2}\b/;

const lines = [
  "    filter: drop-shadow(0 1px 2px rgb(from var(--color-black) r g b / 80%));",
  "    width: clamp(20rem, 100%, var(--breakpoint-mobile));",
  "    outline: var(--spacing-2px) solid rgb(from var(--color-white) r g b / 70%);",
];

lines.forEach((line) => {
  console.log(`Line: ${line}`);
  console.log(`Match: ${regex.test(line)}`);
  const match = line.match(regex);
  if (match) {
    console.log(`  Matched: ${match[0]}`);
  }
});
