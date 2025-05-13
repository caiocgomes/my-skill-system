Hooks.once("init", () => {
    console.log("Skill System | Inicializando módulo...");
  
    // 1. Substitui a árvore de perícias do dnd5e
    CONFIG.DND5E.skills = {
      acro: { label: "Acrobatics", ability: "dex" },
      stealth: { label: "Stealth", ability: "dex" },
      perception: { label: "Perception", ability: "wis" },
      arcana: { label: "Arcana", ability: "int" },
      history: { label: "History", ability: "int" },
      intimidate: { label: "Intimidate", ability: "cha" },
      diplomacy: { label: "Diplomacy", ability: "cha" },
      thievery: { label: "Thievery", ability: "dex" }
    };
  
    // 2. Intercepta o cálculo das skills
    libWrapper.register("my-skill-system", "CONFIG.Actor.documentClass.prototype.getRollData", function (wrapped) {
      const data = wrapped.call(this);
      const skills = CONFIG.DND5E.skills;
      const flags = this.getFlag("my-skill-system", "skills") || {};
  
      for (const [key, meta] of Object.entries(skills)) {
        const base = flags[key] || 0;
        const mod = data.abilities[meta.ability].mod;
        data.skills[key] = {
          value: base,
          mod: base + mod,
          ability: meta.ability
        };
      }
  
      return data;
    }, "WRAPPER");
  
    // 3. Adiciona botão na ficha para abrir o alocador
    Hooks.on("getActorSheetHeaderButtons", (sheet, buttons) => {
      if (!sheet.actor.isOwner) return;
      buttons.unshift({
        label: "Perícias",
        class: "skill-allocator",
        icon: "fas fa-sliders-h",
        onclick: () => new SkillPointAllocator(sheet.actor).render(true)
      });
    });
  });
  
  // 4. Interface de alocação
  class SkillPointAllocator extends FormApplication {
    constructor(actor, options = {}) {
      super(actor, options);
      this.actor = actor;
    }
  
    static get defaultOptions() {
      return mergeObject(super.defaultOptions, {
        id: "skill-point-allocator",
        title: "Distribuir Pontos de Perícia",
        template: "modules/my-skill-system/templates/allocator.html",
        width: 450
      });
    }
  
    get pontosPorClasse() {
      return {
        barbarian: 2,
        bard: 6,
        cleric: 2,
        druid: 4,
        fighter: 2,
        monk: 4,
        paladin: 2,
        ranger: 6,
        rogue: 8,
        sorcerer: 2,
        warlock: 2,
        wizard: 2
      };
    }
  
    async getData() {
      const current = await this.actor.getFlag("my-skill-system", "skills") || {};
      const level = this.actor.system.details.level || 1;
      const classe = this.actor.items.find(i => i.type === "class");
      const nomeClasse = classe?.name?.toLowerCase() || "";
      const intMod = this.actor.system.abilities.int.mod || 0;
      const base = this.pontosPorClasse[nomeClasse] ?? 2;
      const totalPoints = level * Math.max(base + intMod, 1);
  
      const habilidades = this.actor.system.abilities;
      const skills = Object.entries(CONFIG.DND5E.skills).reduce((acc, [key, meta]) => {
        acc[key] = {
          label: meta.label,
          ability: meta.ability.toUpperCase(),
          mod: habilidades[meta.ability].mod,
          value: current[key] || 0
        };
        return acc;
      }, {});
  
      return { skills, totalPoints };
    }
  
    async _updateObject(_, formData) {
      const data = expandObject(formData);
      await this.actor.setFlag("my-skill-system", "skills", data.skills);
    }
  }
  