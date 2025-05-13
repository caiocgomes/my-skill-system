Hooks.once("init", () => {
  console.log("Skill System | Inicializando módulo...");

  CONFIG.DND5E.skills = {
    // habilidades fixas
    abrirFechadura: { label: "Abrir Fechadura", ability: "dex" },
    acrobacia: { label: "Acrobacia", ability: "dex" },
    agarrar: { label: "Agarrar", ability: "str" },
    // ... [demais perícias fixas]
    ver: { label: "Ver", ability: "wis" }
    // idiomas será tratado separadamente
  };

  libWrapper.register("my-skill-system", "CONFIG.Actor.documentClass.prototype.getRollData", function (wrapped) {
    const data = wrapped.call(this);
    const skills = CONFIG.DND5E.skills;
    const flags = this.getFlag("my-skill-system", "skills") || {};
    const idiomas = this.getFlag("my-skill-system", "skillsIdiomas") || {};
    const prof = this.system.attributes.prof || 0;

    for (const [key, meta] of Object.entries(skills)) {
      const pontos = flags[key] || 0;
      const modAtributo = meta.ability ? data.abilities[meta.ability].mod : 0;
      const modFinal = pontos > 0 ? pontos + modAtributo + prof : modAtributo;

      data.skills[key] = {
        value: pontos,
        mod: modFinal,
        ability: meta.ability
      };
    }

    for (const [idioma, pontos] of Object.entries(idiomas)) {
      data.skills[`idiomas_${idioma}`] = {
        label: `Idioma (${idioma})`,
        value: pontos,
        mod: pontos,
        ability: null
      };
    }

    return data;
  }, "WRAPPER");

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

function calcularPontosPericia(actor) {
  const classe = actor.items.find(i => i.type === "class");
  const nomeClasse = classe?.name?.toLowerCase() || "";
  const intMod = actor.system.abilities.int.mod || 0;
  const nivel = actor.system.details.level || 1;

  const pontosPorClasse = {
    fighter: 2,
    wizard: 2,
    artificer: 3,
    cleric: 3,
    druid: 3,
    sorcerer: 3,
    barbarian: 4,
    monk: 4,
    ranger: 4,
    paladin: 4,
    warlock: 4,
    bard: 5,
    rogue: 5
  };

  const base = pontosPorClasse[nomeClasse] ?? 2;
  const pontosPrimeiroNivel = nivel >= 1 ? (base + intMod) * 3 : 0;
  const pontosRestantes = Math.max(nivel - 1, 0) * Math.max(base + intMod, 1);
  return pontosPrimeiroNivel + pontosRestantes;
}

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
      width: 600
    });
  }

  async getData() {
    const current = await this.actor.getFlag("my-skill-system", "skills") || {};
    const idiomas = await this.actor.getFlag("my-skill-system", "skillsIdiomas") || {};
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

    return { skills, idiomas, totalPoints };
  }

  async _updateObject(_, formData) {
    const data = expandObject(formData);

    // reconstrói estrutura de idiomas nomeados
    const idiomas = {};
    for (let i = 0; data.idiomaNome?.[i]; i++) {
      const nome = data.idiomaNome[i].trim();
      const valor = parseInt(data.idiomaValor[i]) || 0;
      if (nome) idiomas[nome] = valor;
    }

    await this.actor.setFlag("my-skill-system", "skills", data.skills);
    await this.actor.setFlag("my-skill-system", "skillsIdiomas", idiomas);
  }
}
