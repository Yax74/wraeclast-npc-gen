import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
const script=readFileSync(new URL("../scripts/main.js",import.meta.url),"utf8");
const template=readFileSync(new URL("../templates/generator-ui.hbs",import.meta.url),"utf8");
const css=readFileSync(new URL("../styles/module.css",import.meta.url),"utf8");
test("preview-first workspace has a persistent generation toolbar",()=>{
  assert.match(template,/class="wraeclast-command-bar"/);
  assert.match(template,/class="wraeclast-workspace"/);
  assert.match(template,/data-action="toggleControls"/);
  assert.equal((template.match(/data-action="generate"/g)||[]).length,1);
  assert.equal((template.match(/data-action="clearRecent"/g)||[]).length,1);
});
test("controls can collapse while results retain their own scroll area",()=>{
  assert.match(script,/showControls = true/);
  assert.match(script,/toggleControls: this\._onToggleControls/);
  assert.match(css,/\.wraeclast-controls-hidden \.wraeclast-workspace/);
  assert.match(css,/\.wraeclast-workspace \.wraeclast-controls \{/);
  assert.match(css,/\.wraeclast-workspace \.wraeclast-results \{/);
  assert.match(css,/overflow-y: auto/);
  assert.match(template,/wraeclast-help/);
});
test("NPC preview scroll resets on new generation",()=>{
  assert.match(script,/this\._previewToTop = true/);
  assert.match(script,/this\._panelScroll = null/);
  assert.match(css,/grid-template-columns: repeat\(auto-fit/);
});
