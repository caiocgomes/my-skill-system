<<<<<<< HEAD
Hooks.once("init", () => {
  console.log("Skill System | Inicializando módulo...");

  // 1. Substitui a árvore de perícias do dnd5e
// Substituir a árvore de skills personalizada com nomes em português e atributos corretos
Hooks.once("init", () => {
  console.log("Skill System | Inicializando módulo...");

  CONFIG.DND5E.skills = {
    abrirFechadura: { label: "Abrir Fechadura", ability: "dex" },
    acrobacia: { label: "Acrobacia", ability: "dex" },
    agarrar: { label: "Agarrar", ability: "str" },
    avaliacao: { label: "Avaliação", ability: "int" },
    atuacao: { label: "Atuação", ability: "cha" },
    coletarInformacao: { label: "Coletar Informação", ability: "cha" },
    concentracao: { label: "Concentração", ability: "con" },
    conhecimento: { label: "Conhecimento", ability: "int" },
    correr: { label: "Correr", ability: "con" },
    cura: { label: "Cura", ability: "wis" },
    decifrarEscrita: { label: "Decifrar Escrita", ability: "int" },
    desativarDispositivo: { label: "Desativar Dispositivo", ability: "int" },
    disfarce: { label: "Disfarce", ability: "cha" },
    enganacao: { label: "Enganação", ability: "cha" },
    equilibrio: { label: "Equilíbrio", ability: "dex" },
    escalar: { label: "Escalar", ability: "str" },
    escapar: { label: "Escapar", ability: "dex" },
    esconder: { label: "Esconder-se", ability: "dex" },
    falsificacao: { label: "Falsificação", ability: "int" },
    idiomas: { label: "Idiomas", ability: null },
    intimidacao: { label: "Intimidação", ability: "cha" },
    investigacao: { label: "Investigação", ability: "int" },
    lidarAnimais: { label: "Lidar com Animais", ability: "wis" },
    magificio: { label: "Magifício", ability: "int" },
    montaria: { label: "Montaria", ability: "dex" },
    moverSilencio: { label: "Mover-se em Silênçio", ability: "dex" },
    natacao: { label: "Natação", ability: "con" },
    oficio: { label: "Ofício", ability: "int" },
    ouvir: { label: "Ouvir", ability: "wis" },
    persuasao: { label: "Persuasão", ability: "cha" },
    prestidigitacao: { label: "Prestidigitação", ability: "dex" },
    profissao: { label: "Profissão", ability: "wis" },
    salto: { label: "Salto", ability: "str" },
    sentirMotivacao: { label: "Sentir Motivação", ability: "wis" },
    sobrevivencia: { label: "Sobrevivência", ability: "wis" },
    usarCorda: { label: "Usar Corda", ability: "dex" },
    usarDispositivoMagico: { label: "Usar Dispositivo Mágico", ability: "cha" },
    ver: { label: "Ver", ability: "wis" }
  };

  // 2. Intercepta o cálculo das skills
  libWrapper.register("my-skill-system", "CONFIG.Actor.documentClass.prototype.getRollData", function (wrapped) {
  const data = wrapped.call(this);
  const skills = CONFIG.DND5E.skills;
  const flags = this.getFlag("my-skill-system", "skills") || {};

  for (const [key, meta] of Object.entries(skills)) {
    const pontos = flags[key] || 0;
    const modAtributo = meta.ability ? data.abilities[meta.ability].mod : 0;
    const prof = this.system.attributes.prof || 0;

    let modFinal;
    if (pontos > 0) {
      modFinal = pontos + modAtributo + prof;
    } else {
      modFinal = modAtributo;
    }

    data.skills[key] = {
      value: pontos,
      mod: modFinal,
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

// Função para calcular pontos de perícia
function calcularPontosPericia(actor) {
  const classe = actor.items.find(i => i.type === "class");
  const nomeClasse = classe?.name?.toLowerCase() || "";
  const intMod = actor.system.abilities.int.mod || 0;
  const nivel = actor.system.details.level || 1;

  const pontosPorClasse = {
    guerreiro: 2,
    mago: 2,
    clerigo: 3,
    druida: 3,
    feiticeiro: 3,
    artifice: 3,
    barbaro: 4,
    monge: 4,
    ranger: 4,
    paladino: 4,
    bruxo: 4,
    bardo: 5,
    ladino: 5
  };

  const base = pontosPorClasse[nomeClasse] ?? 2;
  const pontosPrimeiroNivel = nivel >= 1 ? (base + intMod) * 3 : 0;
  const pontosRestantes = Math.max(nivel - 1, 0) * Math.max(base + intMod, 1);
  return pontosPrimeiroNivel + pontosRestantes;
}

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

  async getData() {
    const current = await this.actor.getFlag("my-skill-system", "skills") || {};
    const totalPoints = calcularPontosPericia(this.actor);

    const habilidades = this.actor.system.abilities;
    const skills = Object.entries(CONFIG.DND5E.skills).reduce((acc, [key, meta]) => {
      acc[key] = {
        label: meta.label,
        ability: meta.ability?.toUpperCase() || "-",
        mod: meta.ability ? habilidades[meta.ability].mod : 0,
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
;

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
=======
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
>>>>>>> parent of 03ea233 (adding skill tree, modifier computation and new character sheet.)
  }

  async _updateObject(_, formData) {
    const data = expandObject(formData);
    await this.actor.setFlag("my-skill-system", "skills", data.skills);
  }
}
