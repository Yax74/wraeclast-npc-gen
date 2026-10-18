import assert from "node:assert/strict";
import test from "node:test";
import {
  RecentNPCMemory,
  activePinnedSections,
  emptySectionPins,
  leastRepeatedCandidate,
  sectionTokens
} from "../scripts/generator-qol.js";

const npc = (name, profession, extra = {}) => ({
  fullName: name,
  firstName: name.split(" ")[0],
  profession,
  organization: "",
  rank: "",
  appearance: ["Lean", "Scarred"],
  voice: "Low voice",
  demeanor: ["Patient"],
  attitude: ["Watchful"],
  mannerism: "Counts each breath",
  ideal: "Duty",
  bond: "Their akhara",
  flaw: "Proud",
  goal: "Find a guide",
  problem: "Followed by raiders",
  secret: "Owes a debt",
  knowledge: "Knows the pass",
  offer: "Safe passage",
  disposition: "Wary",
  ...extra
});

test("section pins start clear and report active sections", () => {
  const pins = emptySectionPins();
  assert.deepEqual(activePinnedSections(pins), []);
  pins.name = true;
  pins.hooks = true;
  assert.deepEqual(activePinnedSections(pins), ["name", "hooks"]);
});

test("recent memory detects repeated values by section and remains bounded", () => {
  const memory = new RecentNPCMemory(2);
  const first = npc("Nahla", "Scout");
  memory.remember(first);
  assert.equal(memory.score(first, ["name"]), 1);
  assert.equal(memory.score(first, ["profession"]), 1);
  assert.equal(memory.score(npc("Soraya", "Scout"), ["name"]), 0);
  assert.ok(sectionTokens(first, "appearance").includes("scarred"));

  memory.remember(npc("Soraya", "Guide"), ["name"]);
  memory.remember(npc("Zahra", "Smith"), ["name"]);
  assert.equal(memory.count, 2);
  assert.equal(memory.score(first, ["name"]), 0);
  memory.clear();
  assert.equal(memory.count, 0);
});

test("least-repeated selection stops at the first collision-free candidate", () => {
  const memory = new RecentNPCMemory();
  memory.remember(npc("Nahla", "Scout"));
  const candidates = [npc("Nahla", "Scout"), npc("Soraya", "Scout"), npc("Zahra", "Smith")];
  let index = 0;
  const result = leastRepeatedCandidate(() => candidates[index++], memory, ["name", "profession"], 3);
  assert.equal(result.fullName, "Zahra");
  assert.equal(index, 3);
});
