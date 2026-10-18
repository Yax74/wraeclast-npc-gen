export const NPC_SECTIONS = Object.freeze([
  "name", "profession", "appearance", "personality", "hooks", "drives"
]);

const SECTION_TOKEN_FIELDS = Object.freeze({
  name: Object.freeze(["fullName", "firstName"]),
  profession: Object.freeze(["profession", "organization", "rank"]),
  appearance: Object.freeze(["appearance", "voice"]),
  personality: Object.freeze(["demeanor", "attitude", "mannerism"]),
  hooks: Object.freeze(["ideal", "bond", "flaw"]),
  drives: Object.freeze(["goal", "problem", "secret", "knowledge", "offer", "disposition"])
});

const normalizeToken = (value) => String(value ?? "").trim().toLocaleLowerCase();

export function emptySectionPins() {
  return Object.fromEntries(NPC_SECTIONS.map((section) => [section, false]));
}

export function activePinnedSections(pins = {}) {
  return NPC_SECTIONS.filter((section) => Boolean(pins[section]));
}

export function sectionTokens(npc, section) {
  const fields = SECTION_TOKEN_FIELDS[section];
  if (!fields) throw new Error(`Unknown NPC section: ${section}`);
  const tokens = fields.flatMap((field) => Array.isArray(npc?.[field]) ? npc[field] : [npc?.[field]])
    .map(normalizeToken)
    .filter(Boolean);
  return [...new Set(tokens)];
}

export class RecentNPCMemory {
  constructor(limit = 20) {
    this.limit = Math.max(1, Number.parseInt(limit, 10) || 20);
    this.entries = Object.fromEntries(NPC_SECTIONS.map((section) => [section, []]));
  }

  clear() {
    for (const section of NPC_SECTIONS) this.entries[section] = [];
  }

  remember(npc, sections = NPC_SECTIONS) {
    for (const section of sections) {
      if (!NPC_SECTIONS.includes(section)) throw new Error(`Unknown NPC section: ${section}`);
      this.entries[section].push(sectionTokens(npc, section));
      if (this.entries[section].length > this.limit) this.entries[section].splice(0, this.entries[section].length - this.limit);
    }
  }

  score(npc, sections = NPC_SECTIONS) {
    let score = 0;
    for (const section of sections) {
      if (!NPC_SECTIONS.includes(section)) throw new Error(`Unknown NPC section: ${section}`);
      const recent = new Set(this.entries[section].flat());
      for (const token of sectionTokens(npc, section)) if (recent.has(token)) score += 1;
    }
    return score;
  }

  get count() {
    return Math.max(0, ...NPC_SECTIONS.map((section) => this.entries[section].length));
  }
}

export function leastRepeatedCandidate(factory, memory, sections = NPC_SECTIONS, attempts = 12) {
  const count = Math.max(1, Number.parseInt(attempts, 10) || 1);
  let best = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let attempt = 0; attempt < count; attempt += 1) {
    const candidate = factory();
    const score = memory.score(candidate, sections);
    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
    if (score === 0) break;
  }
  return best;
}
