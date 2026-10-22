import { readFileSync, writeFileSync } from "node:fs";
const tokens = JSON.parse(readFileSync(new URL("../tokens.json", import.meta.url), "utf8"));
const blocks = Object.entries(tokens.semantic).filter(([k]) => !k.startsWith("$")).map(([mode, values]) => {
  const vars = Object.entries(values).map(([key, token]) => `  --oro-${key.replace(/[A-Z]/g, c => "-" + c.toLowerCase())}: ${token.$value};`).join("\n");
  return `${mode === "light" ? ":root" : ".dark"} {\n${vars}\n}`;
});
writeFileSync(new URL("../src/generated/oro.css", import.meta.url), `/* Generated from tokens.json semantic tokens. Do not edit. */\n${blocks.join("\n")}\n`);
