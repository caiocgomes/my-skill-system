Hooks.once("init", () => {
  console.log("Skill System | Inicializando módulo...");

  CONFIG.DND5E.skills = {
    abrirFechadura: { label: "Abrir Fechadura", ability: "dex" },
    acrobacia: { label: "Acrobacia", ability: "dex" },
    agarrar: { label: "Agarrar", ability: "str" },
    avaliacao: { label: "Avaliação", ability: "int" },
    // atuacao: { label: "Atuação", ability: "cha" },
    coletarInformacao: { label: "Coletar Informação", ability: "cha" },
    concentracao: { label: "Concentração", ability: "con" },
    //conhecimento: { label: "Conhecimento", ability: "int" },
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
    intimidacao: { label: "Intimidação", ability: "cha" },
    investigacao: { label: "Investigação", ability: "int" },
    lidarAnimais: { label: "Lidar com Animais", ability: "wis" },
    magificio: { label: "Magifício", ability: "int" },
    montaria: { label: "Montaria", ability: "dex" },
    moverSilencio: { label: "Mover-se em Silênçio", ability: "dex" },
    natacao: { label: "Natação", ability: "str" },
    //oficio: { label: "Ofício", ability: "int" },
    ouvir: { label: "Ouvir", ability: "wis" },
    persuasao: { label: "Persuasão", ability: "cha" },
    prestidigitacao: { label: "Prestidigitação", ability: "dex" },
    //profissao: { label: "Profissão", ability: "wis" },
    salto: { label: "Salto", ability: "str" },
    sentirMotivacao: { label: "Sentir Motivação", ability: "wis" },
    sobrevivencia: { label: "Sobrevivência", ability: "wis" },
    usarCorda: { label: "Usar Corda", ability: "dex" },
    usarDispositivoMagico: { label: "Usar Dispositivo Mágico", ability: "cha" },
    ver: { label: "Ver", ability: "wis" },
  };

  libWrapper.register(
    "my-skill-system",
    "CONFIG.Actor.documentClass.prototype.getRollData",
    function (wrapped) {
      const data = wrapped.call(this);
      const skills = CONFIG.DND5E.skills;
      const flags = this.getFlag("my-skill-system", "skills") || {};
      const idiomas = this.getFlag("my-skill-system", "skillsIdiomas") || {};
      const oficios = this.getFlag("my-skill-system", "skillsOficios") || {};
      const conhecimentos =
        this.getFlag("my-skill-system", "skillsConhecimentos") || {};
      const profissoes =
        this.getFlag("my-skill-system", "skillsProfissoes") || {};
      const atuacoes = this.getFlag("my-skill-system", "skillsAtuacoes") || {};
      const prof = this.system.attributes.prof || 0;

      for (const [key, meta] of Object.entries(skills)) {
        const pontos = flags[key] || 0;
        const modAtributo = meta.ability ? data.abilities[meta.ability].mod : 0;
        const modFinal = pontos > 0 ? pontos + modAtributo + prof : modAtributo;

        data.skills[key] = {
          label: meta.label,
          value: pontos,
          mod: modFinal,
          ability: meta.ability,
        };
      }

      for (const [idioma, pontos] of Object.entries(idiomas)) {
        data.skills[`idiomas_${idioma}`] = {
          label: `Idioma (${idioma})`,
          value: pontos,
          mod: pontos,
          ability: null,
        };
      }

      for (const [nome, pontos] of Object.entries(oficios)) {
        const mod = data.abilities.int.mod;
        const modFinal = pontos > 0 ? pontos + mod + prof : mod;
        data.skills[`oficios_${nome}`] = {
          label: `Ofício (${nome})`,
          value: pontos,
          mod: modFinal,
          ability: "int",
        };
      }

      for (const [nome, pontos] of Object.entries(conhecimentos)) {
        const mod = data.abilities.int.mod;
        const modFinal = pontos > 0 ? pontos + mod + prof : mod;
        data.skills[`conhecimentos_${nome}`] = {
          label: `Conhecimento (${nome})`,
          value: pontos,
          mod: modFinal,
          ability: "int",
        };
      }

      for (const [nome, pontos] of Object.entries(profissoes)) {
        const mod = data.abilities.wis.mod;
        const modFinal = pontos > 0 ? pontos + mod + prof : mod;
        data.skills[`profissoes_${nome}`] = {
          label: `Profissão (${nome})`,
          value: pontos,
          mod: modFinal,
          ability: "wis",
        };
      }

      for (const [nome, pontos] of Object.entries(atuacoes)) {
        const mod = data.abilities.cha.mod;
        const modFinal = pontos > 0 ? pontos + mod + prof : mod;
        data.skills[`atuacoes_${nome}`] = {
          label: `Atuação (${nome})`,
          value: pontos,
          mod: modFinal,
          ability: "cha",
        };
      }

      return data;
    },
    "WRAPPER"
  );

  Hooks.on("getActorSheetHeaderButtons", (sheet, buttons) => {
    if (!sheet.actor.isOwner) return;
    buttons.unshift({
      label: "Perícias",
      class: "skill-allocator",
      icon: "fas fa-sliders-h",
      onclick: () => new SkillPointAllocator(sheet.actor).render(true),
    });
  });
});

function calcularPontosPericia(actor) {
  const classe = actor.items.find((i) => i.type === "class");
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
    rogue: 5,
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
      width: 600,
    });
  }

  async getData() {
    const [
      current,
      extras,
      rawIdiomas,
      rawOficios,
      rawConhecimentos,
      rawProfissoes,
      rawAtuacoes,
    ] = await Promise.all([
      this.actor.getFlag("my-skill-system", "skills"),
      this.actor.getFlag("my-skill-system", "skillMods"),
      this.actor.getFlag("my-skill-system", "skillsIdiomas"),
      this.actor.getFlag("my-skill-system", "skillsOficios"),
      this.actor.getFlag("my-skill-system", "skillsConhecimentos"),
      this.actor.getFlag("my-skill-system", "skillsProfissoes"),
      this.actor.getFlag("my-skill-system", "skillsAtuacoes"),
    ]);

    // Garante fallback para objetos vazios
    const safeCurrent = current || {};
    const safeExtras = extras || {};
    const safeIdiomas = rawIdiomas || {};
    const safeOficios = rawOficios || {};
    const safeConhecimentos = rawConhecimentos || {};
    const safeProfissoes = rawProfissoes || {};
    const safeAtuacoes = rawAtuacoes || {};

    const totalPoints = calcularPontosPericia(this.actor);

    const habilidades = this.actor.system.abilities;
    const prof = this.actor.system.attributes.prof || 0;

    const skills = Object.entries(CONFIG.DND5E.skills).reduce(
      (acc, [key, meta]) => {
        const pontos = current[key] || 0;
        const modAttr = meta.ability ? habilidades[meta.ability].mod : 0;
        const modExtra = extras[key] || 0;
        const modProf = pontos > 0 ? prof : 0;
        const total = modAttr + pontos + modExtra + modProf;

        acc[key] = {
          label: meta.label,
          ability: meta.ability?.toUpperCase() || "-",
          modAttr,
          modExtra,
          prof: modProf,
          pontos,
          total,
        };
        return acc;
      },
      {}
    );

    // Transforma objetos em arrays
    const idiomas = Object.entries(rawIdiomas).map(([nome, valor]) => ({
      nome,
      valor,
    }));
    const oficios = Object.entries(rawOficios).map(([nome, valor]) => ({
      nome,
      valor,
    }));
    const conhecimentos = Object.entries(rawConhecimentos).map(
      ([nome, valor]) => ({ nome, valor })
    );
    const profissoes = Object.entries(rawProfissoes).map(([nome, valor]) => ({
      nome,
      valor,
    }));
    const atuacoes = Object.entries(rawAtuacoes).map(([nome, valor]) => ({
      nome,
      valor,
    }));

    return {
      skills,
      idiomas,
      oficios,
      conhecimentos,
      profissoes,
      atuacoes,
      totalPoints,
    };
  }

  async _updateObject(_, formData) {
    const data = expandObject(formData);
    const actor = this.actor;

    const keysParaLimpar = [
      "skills",
      "skillMods",
      "skillsIdiomas",
      "skillsOficios",
      "skillsConhecimentos",
      "skillsProfissoes",
      "skillsAtuacoes",
    ];

    // Apaga todas as flags em paralelo
    await Promise.all(
      keysParaLimpar.map((key) => this.actor.unsetFlag("my-skill-system", key))
    );

    // Reconstrói os grupos (mantém serial por depender do DOM e ordem de parsing)
    const [idiomas, oficios, conhecimentos, profissoes, atuacoes] =
      await Promise.all([
        reconstruirGrupo(data, "idioma", actor),
        reconstruirGrupo(data, "oficio", actor),
        reconstruirGrupo(data, "conhecimento", actor),
        reconstruirGrupo(data, "profissao", actor),
        reconstruirGrupo(data, "atuacao", actor),
      ]);

    // Salva todas as flags em paralelo
    await Promise.all([
      actor.setFlag("my-skill-system", "skills", data.skills),
      actor.setFlag("my-skill-system", "skillsIdiomas", idiomas),
      actor.setFlag("my-skill-system", "skillsOficios", oficios),
      actor.setFlag("my-skill-system", "skillsConhecimentos", conhecimentos),
      actor.setFlag("my-skill-system", "skillsProfissoes", profissoes),
      actor.setFlag("my-skill-system", "skillsAtuacoes", atuacoes),
    ]);
  }
}
async function reconstruirGrupo(data, campo, actor) {
  const nomes = data[`${campo}Nome`] || {};
  const valores = data[`${campo}Valor`] || {};
  const novos = {};

  for (const i of Object.keys(nomes)) {
    const nome = nomes[i]?.trim();
    const valor = parseInt(valores[i]) || 0;
    if (nome) novos[nome] = valor;
  }

  const flagKey = `skills${capitalize(campo)}`;

  const antigos = (await actor.getFlag("my-skill-system", flagKey)) || {};

  // Detecta chaves removidas
  const removidos = Object.keys(antigos).filter((nome) => !(nome in novos));

  if (removidos.length > 0) {
    await actor.unsetFlag("my-skill-system", flagKey); // limpa tudo se teve alguma remoção
  }

  return novos;
}

function capitalize(str) {
  if (typeof str !== "string") {
    console.warn("capitalize: valor não é string", str);
    return "";
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

Hooks.on("renderActorSheet5eCharacter", (app, html, data) => {
  const actor = app.actor;
  const rollData = actor.getRollData();
  const allSkills = rollData.skills || {};

  const originalSkillSection = html.find(".skills-list");
  if (!originalSkillSection.length) return;

  const novaLista = $(`<ul class="custom-skill-list"></ul>`);

  for (const [key, skill] of Object.entries(allSkills)) {
    let label;

    if (key.startsWith("idiomas_")) {
      const nome = key.replace("idiomas_", "");
      label = `Idioma (${nome})`;
    } else if (key.startsWith("oficios_")) {
      const nome = key.replace("oficios_", "");
      label = `Ofício (${nome})`;
    } else if (key.startsWith("conhecimentos_")) {
      const nome = key.replace("conhecimentos_", "");
      label = `Conhecimento (${nome})`;
    } else if (key.startsWith("profissoes_")) {
      const nome = key.replace("profissoes_", "");
      label = `Profissão (${nome})`;
    } else if (key.startsWith("atuacoes_")) {
      const nome = key.replace("atuacoes_", "");
      label = `Atuação (${nome})`;
    } else {
      label = skill.label || CONFIG.DND5E.skills?.[key]?.label || key;
    }

    const mod = skill.mod >= 0 ? `+${skill.mod}` : `${skill.mod}`;
    const li = $(`
      <li class="skill flexrow custom-skill" data-skill="${key}" style="cursor:pointer;">
        <div class="skill-name">${label}</div>
        <div class="skill-mod">${mod}</div>
      </li>
    `);

    li.on("click", async () => {
      await dnd5e.dice.d20Roll({
        actor: actor,
        data: rollData,
        parts: [String(skill.mod || 0)],
        title: `Perícia: ${label}`,
        flavor: `Perícia: ${label}`,
        fastForward: false,
        rollMode: game.settings.get("core", "rollMode"),
      });
    });

    novaLista.append(li);
  }
  console.log(novaLista);
  const container = $(
    `<div class="custom-skill-container" style="max-height: 65vh; overflow-y: auto;"></div>`
  );
  container.append(novaLista);
  originalSkillSection.empty().append(container);
});
