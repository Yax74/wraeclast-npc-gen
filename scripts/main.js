import { NPCEngine } from "./npc-engine.js";

const MODULE_ID = "wraeclast-npc-gen";
const DATA_PATH = `modules/${MODULE_ID}/data`;
const FILTER_FIELDS = ["culture", "affiliation", "species", "socialOrigin", "age", "alignment", "professionCategory"];

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class WraeclastNPCGenerator extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "wraeclast-npc-generator",
    classes: ["wraeclast-npc-generator"],
    tag: "form",
    position: { width: 860, height: 780 },
    window: {
      title: "Wraeclast NPC Generator",
      icon: "fa-solid fa-skull",
      resizable: true
    },
    form: {
      closeOnSubmit: false,
      submitOnChange: false,
      handler: this._onSubmit
    },
    actions: {
      generate: this._onGenerate,
      toggleLock: this._onToggleLock,
      reroll: this._onReroll,
      sendChat: this._onSendChat,
      saveJournal: this._onSaveJournal,
      createActor: this._onCreateActor,
      copyNpc: this._onCopyNpc,
      outputAll: this._onOutputAll
    }
  };

  static PARTS = {
    main: {
      template: `modules/${MODULE_ID}/templates/generator-ui.hbs`,
      scrollable: [".wraeclast-results"]
    }
  };

  constructor(options = {}) {
    super(options);
    this.tables = null;
    this.results = [];
    this.error = "";
    this.filters = Object.fromEntries(FILTER_FIELDS.map((field) => [field, ""]));
    this.filters.preset = game.settings.get(MODULE_ID, "defaultPreset") || "general";
    this.batchCount = 1;
    this.chatMode = game.settings.get(MODULE_ID, "chatRollMode") || "gmroll";
    this.locks = Object.fromEntries(FILTER_FIELDS.map((field) => [field, false]));
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    try {
      this.tables ??= await NPCEngine.loadTables(DATA_PATH);
      this.#repairInvalidFilters();
      const available = NPCEngine.getOptions(this.tables, this.filters);
      const activePreset = NPCEngine.getPreset(this.tables, this.filters.preset);
      return foundry.utils.mergeObject(context, {
        ready: true,
        error: this.error,
        filters: this.filters,
        locks: this.locks,
        batchCount: this.batchCount,
        chatMode: this.chatMode,
        presetDescription: activePreset?.description ?? "",
        chatModes: this.#options([
          { value: "gmroll", label: "Whisper to GMs" },
          { value: "selfroll", label: "Only me" },
          { value: "publicroll", label: "Public" }
        ], this.chatMode, false),
        canCreateActor: game.system.id === "dnd5e",
        presets: this.#options(available.presets.map((preset) => ({ value: preset.id, label: preset.label, description: preset.description })), this.filters.preset, false),
        cultures: this.#options(available.cultures, this.filters.culture),
        affiliations: this.#options(available.affiliations, this.filters.affiliation),
        species: this.#options(available.species, this.filters.species),
        socialOrigins: this.#options(available.socialOrigins, this.filters.socialOrigin),
        ages: this.#options(available.ages, this.filters.age),
        alignments: this.#options(available.alignments, this.filters.alignment),
        professionCategories: this.#options(available.professionCategories, this.filters.professionCategory),
        results: this.results.map((npc, index) => ({
          ...npc,
          index,
          showAffiliation: npc.affiliation && npc.affiliation !== "Unaffiliated"
        }))
      }, { inplace: false });
    } catch (error) {
      console.error(`${MODULE_ID} | Failed to prepare generator`, error);
      this.error = error.message;
      return foundry.utils.mergeObject(context, { ready: false, error: error.message, results: [] }, { inplace: false });
    }
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    for (const element of this.element.querySelectorAll("[data-filter]")) {
      element.addEventListener("change", async (event) => {
        const field = event.currentTarget.dataset.filter;
        const value = event.currentTarget.value;
        this.filters[field] = value;
        this.locks[field] = Boolean(value);
        this.#clearDependents(field);
        this.results = [];
        await this.render({ force: true });
      });
    }
    this.element.querySelector('[name="preset"]')?.addEventListener("change", async (event) => {
      this.filters.preset = event.currentTarget.value;
      for (const field of FILTER_FIELDS) {
        if (!this.locks[field]) this.filters[field] = "";
      }
      this.results = [];
      await this.render({ force: true });
    });
    this.element.querySelector('[name="batchCount"]')?.addEventListener("change", (event) => {
      this.batchCount = Math.max(1, Math.min(10, Number.parseInt(event.currentTarget.value, 10) || 1));
    });
    this.element.querySelector('[name="chatMode"]')?.addEventListener("change", (event) => {
      this.chatMode = event.currentTarget.value;
    });
  }

  static async _onSubmit(event) {
    event.preventDefault();
  }

  static async _onGenerate() {
    await this.#run(async () => {
      this.#syncTransientFormState();
      this.results = NPCEngine.generateBatch(this.batchCount, this.filters, this.tables);
      this.error = "";
      await this.render({ force: true });
    });
  }

  static async _onToggleLock(_event, target) {
    await this.#run(async () => {
      const field = target.dataset.field;
      if (!FILTER_FIELDS.includes(field)) return;
      if (this.locks[field]) {
        this.locks[field] = false;
        this.filters[field] = "";
        this.#clearDependents(field);
      } else {
        const value = this.filters[field] || this.results[0]?.[field] || this.#inferredValue(field);
        if (!value) {
          ui.notifications.warn("Generate an NPC or choose a value before locking this field.");
          return;
        }
        this.filters[field] = value;
        this.locks[field] = true;
      }
      await this.render({ force: true });
    });
  }

  static async _onReroll(_event, target) {
    await this.#run(async () => {
      const index = Number.parseInt(target.dataset.index, 10);
      const section = target.dataset.section;
      const npc = this.results[index];
      if (!npc) return;
      const identity = {
        ...this.filters,
        culture: npc.culture,
        affiliation: npc.affiliation,
        species: npc.species,
        socialOrigin: npc.socialOrigin,
        age: npc.age,
        alignment: npc.alignment
      };
      this.results[index] = NPCEngine.rerollSection(npc, section, identity, this.tables);
      await this.render({ force: true });
    });
  }

  static async _onSendChat(_event, target) {
    await this.#run(async () => this.#sendToChat(this.#result(target)));
  }

  static async _onSaveJournal(_event, target) {
    await this.#run(async () => {
      const entry = await this.#createJournal(this.#result(target));
      ui.notifications.info(`Saved ${entry.name} to the journal.`);
    });
  }

  static async _onCreateActor(_event, target) {
    await this.#run(async () => {
      const actor = await this.#createActorDocument(this.#result(target));
      ui.notifications.info(`Created actor ${actor.name}.`);
    });
  }

  static async _onCopyNpc(_event, target) {
    await this.#run(async () => {
      const text = this.#plainText(this.#result(target));
      if (game.clipboard?.copyPlainText) await game.clipboard.copyPlainText(text);
      else await navigator.clipboard.writeText(text);
      ui.notifications.info("NPC copied to the clipboard.");
    });
  }

  static async _onOutputAll(_event, target) {
    await this.#run(async () => {
      if (!this.results.length) throw new Error("Generate at least one NPC first.");
      const output = target.dataset.output;
      if (output === "chat") {
        for (const npc of this.results) await this.#sendToChat(npc);
        ui.notifications.info(`Sent ${this.results.length} NPC${this.results.length === 1 ? "" : "s"} to chat.`);
      } else if (output === "journal") {
        for (const npc of this.results) await this.#createJournal(npc);
        ui.notifications.info(`Saved ${this.results.length} NPC${this.results.length === 1 ? "" : "s"} to the journal.`);
      } else if (output === "copy") {
        const text = this.results.map((npc) => this.#plainText(npc)).join("\n\n---\n\n");
        if (game.clipboard?.copyPlainText) await game.clipboard.copyPlainText(text);
        else await navigator.clipboard.writeText(text);
        ui.notifications.info("NPC batch copied to the clipboard.");
      }
    });
  }

  #result(target) {
    const npc = this.results[Number.parseInt(target.dataset.index, 10)];
    if (!npc) throw new Error("That NPC preview is no longer available.");
    return npc;
  }

  async #run(operation) {
    try {
      await operation();
    } catch (error) {
      console.error(`${MODULE_ID} | Generator action failed`, error);
      ui.notifications.error(`Wraeclast NPC Generator: ${error.message}`);
    }
  }

  #syncTransientFormState() {
    const count = this.element.querySelector('[name="batchCount"]')?.value;
    const mode = this.element.querySelector('[name="chatMode"]')?.value;
    this.batchCount = Math.max(1, Math.min(10, Number.parseInt(count, 10) || this.batchCount));
    this.chatMode = mode || this.chatMode;
  }

  #inferredValue(field) {
    const key = {
      culture: "cultures", affiliation: "affiliations", species: "species",
      socialOrigin: "socialOrigins", age: "ages", alignment: "alignments",
      professionCategory: "professionCategories"
    }[field];
    const options = key ? NPCEngine.getOptions(this.tables, this.filters)[key] : [];
    return options.length === 1 ? options[0].value : "";
  }

  #clearDependents(field) {
    const clear = (...fields) => fields.forEach((key) => {
      this.filters[key] = "";
      this.locks[key] = false;
    });
    if (field === "culture") clear("affiliation", "species", "professionCategory");
    else if (field === "affiliation") clear("professionCategory");
    else if (field === "species" && this.filters.age === "Ancient") clear("age");
    else if (field === "age") clear("professionCategory");
  }

  #repairInvalidFilters() {
    const options = NPCEngine.getOptions(this.tables, this.filters);
    const valid = (rows, value) => !value || rows.some((row) => row.value === value);
    if (!valid(options.cultures, this.filters.culture)) {
      this.filters.culture = "";
      this.locks.culture = false;
    }
    const refreshed = NPCEngine.getOptions(this.tables, this.filters);
    for (const [field, rows] of [
      ["affiliation", refreshed.affiliations], ["species", refreshed.species],
      ["socialOrigin", refreshed.socialOrigins], ["age", refreshed.ages],
      ["alignment", refreshed.alignments], ["professionCategory", refreshed.professionCategories]
    ]) {
      if (!valid(rows, this.filters[field])) {
        this.filters[field] = "";
        this.locks[field] = false;
      }
    }
  }

  #options(rows, selected, includeRandom = true) {
    const options = rows.map((row) => ({
      value: row.value ?? row.id,
      label: row.label ?? row.value,
      description: row.description ?? "",
      selected: (row.value ?? row.id) === selected
    }));
    if (includeRandom) options.unshift({ value: "", label: "Random (weighted)", selected: !selected });
    return options;
  }

  async #sendToChat(npc) {
    const data = {
      user: game.user.id,
      speaker: { alias: "Wraeclast NPC Generator" },
      content: this.#html(npc, true)
    };
    ChatMessage.applyRollMode(data, this.chatMode);
    return ChatMessage.create(data);
  }

  async #createJournal(npc) {
    const folder = await this.#folder("JournalEntry", game.settings.get(MODULE_ID, "journalFolder"));
    return JournalEntry.create({
      name: npc.fullName,
      folder: folder.id,
      pages: [{
        name: "Identity Dossier",
        type: "text",
        text: { content: this.#html(npc, false), format: 1 }
      }],
      flags: { [MODULE_ID]: { generated: true, npc } }
    });
  }

  async #createActorDocument(npc) {
    if (game.system.id !== "dnd5e") throw new Error("Actor creation is available only in a D&D 5e world.");
    const folder = await this.#folder("Actor", game.settings.get(MODULE_ID, "actorFolder"));
    return Actor.create({
      name: npc.fullName,
      type: "npc",
      folder: folder.id,
      system: { details: { biography: { value: this.#html(npc, false) } } },
      flags: { [MODULE_ID]: { generated: true, npc } }
    });
  }

  async #folder(type, name) {
    const existing = game.folders.find((folder) => folder.type === type && folder.name === name);
    return existing ?? Folder.create({ name, type, color: "#6f2025" });
  }

  #plainText(npc) {
    const affiliation = npc.affiliation && npc.affiliation !== "Unaffiliated" ? ` — ${npc.affiliation}` : "";
    return [
      npc.fullName,
      `${npc.culture}${affiliation} | ${npc.species} | ${npc.age} | ${npc.alignment}`,
      `Origin: ${npc.socialOrigin}`,
      `Profession: ${npc.profession}${npc.organization ? ` (${npc.organization})` : ""}`,
      `Appearance: ${npc.appearance.join(", ")}`,
      `Voice: ${npc.voice}`,
      `Demeanor: ${npc.demeanor.join(", ")}`,
      `Attitude: ${npc.attitude.join(", ")}`,
      `Mannerism: ${npc.mannerism}`,
      `Ideal: ${npc.ideal}`,
      `Bond: ${npc.bond}`,
      `Flaw: ${npc.flaw}`
    ].join("\n");
  }

  #html(npc, compact) {
    const e = (value) => foundry.utils.escapeHTML(String(value ?? ""));
    const affiliation = npc.affiliation && npc.affiliation !== "Unaffiliated" ? ` · ${e(npc.affiliation)}` : "";
    const organization = npc.organization ? `<p><strong>Organisation:</strong> ${e(npc.organization)}</p>` : "";
    return `<article class="wraeclast-dossier${compact ? " compact" : ""}">
      <h2>${e(npc.fullName)}</h2>
      <p class="identity"><strong>${e(npc.culture)}</strong>${affiliation} · ${e(npc.species)} · ${e(npc.age)} · ${e(npc.alignment)}</p>
      <p><strong>Origin:</strong> ${e(npc.socialOrigin)}</p>
      <p><strong>Profession:</strong> ${e(npc.profession)} <em>(${e(npc.professionCategory)})</em></p>
      ${organization}
      <h3>Appearance &amp; voice</h3>
      <p>${npc.appearance.map(e).join(", ")}. ${e(npc.voice)}.</p>
      <h3>Personality</h3>
      <p><strong>Demeanor:</strong> ${npc.demeanor.map(e).join(", ")}<br>
      <strong>Attitude:</strong> ${npc.attitude.map(e).join(", ")}<br>
      <strong>Mannerism:</strong> ${e(npc.mannerism)}</p>
      <h3>Hooks</h3>
      <p><strong>Ideal:</strong> ${e(npc.ideal)}<br>
      <strong>Bond:</strong> ${e(npc.bond)}<br>
      <strong>Flaw:</strong> ${e(npc.flaw)}</p>
    </article>`;
  }
}

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "journalFolder", {
    name: "Journal folder",
    hint: "Folder used by Save Journal.",
    scope: "world", config: true, type: String, default: "Generated NPCs"
  });
  game.settings.register(MODULE_ID, "actorFolder", {
    name: "Actor folder",
    hint: "Folder used by Create Actor.",
    scope: "world", config: true, type: String, default: "Generated NPCs"
  });
  game.settings.register(MODULE_ID, "showJournalButton", {
    name: "Show Journal launcher",
    hint: "Add an NPC Generator button to the Journal sidebar.",
    scope: "client", config: true, type: Boolean, default: true
  });
  game.settings.register(MODULE_ID, "defaultPreset", {
    name: "Default generator preset",
    scope: "client", config: true, type: String, default: "general",
    choices: {
      general: "All Wraeclast", sarn_survivor: "Sarn survivor", oriathan_occupier: "Oriathan occupier",
      forest_encampment: "Forest Encampment", karui_tribe: "Karui tribes",
      kalguur_expedition: "Kalguur expedition", stygian_mines: "Stygian mines", vaal_historical: "Ancient Vaal"
    }
  });
  game.settings.register(MODULE_ID, "chatRollMode", {
    name: "Default chat visibility",
    scope: "client", config: true, type: String, default: "gmroll",
    choices: { gmroll: "Whisper to GMs", selfroll: "Only me", publicroll: "Public" }
  });
});

let generatorApp;
const openGenerator = () => {
  generatorApp ??= new WraeclastNPCGenerator();
  return generatorApp.render({ force: true });
};

Hooks.once("ready", () => {
  game.wraeclastGen = {
    open: openGenerator,
    generate: (constraints) => constraints === undefined
      ? openGenerator()
      : NPCEngine.loadTables(DATA_PATH).then((tables) => NPCEngine.generateNPC(constraints, tables)),
    generateNPC: async (constraints = {}) => NPCEngine.generateNPC(constraints, await NPCEngine.loadTables(DATA_PATH)),
    generateBatch: async (count, constraints = {}) => NPCEngine.generateBatch(count, constraints, await NPCEngine.loadTables(DATA_PATH)),
    validate: async () => NPCEngine.validateTables(await NPCEngine.loadTables(DATA_PATH, { refresh: true }))
  };
});

Hooks.on("renderJournalDirectory", (_application, html) => {
  if (!game.settings.get(MODULE_ID, "showJournalButton")) return;
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root || root.querySelector(".wraeclast-launcher")) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "wraeclast-launcher";
  button.innerHTML = '<i class="fa-solid fa-skull" aria-hidden="true"></i> NPC Generator';
  button.addEventListener("click", openGenerator);
  const footer = root.querySelector(".directory-footer");
  if (footer) footer.append(button);
  else root.querySelector(".directory-header")?.append(button);
});
