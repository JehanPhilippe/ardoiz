/* CapDevoirs — Référentiel Officiel Éducation nationale (Éduscol Cycles 2, 3, 4 + API Open Data data.education.gouv.fr) */
(function (global) {
  'use strict';

  const API_BASE = 'https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/';
  const CACHE_KEY = 'capdevoirs_edunat_api_cache_v1';

  const CYCLE_META = {
    CP:  { cycle: 'Cycle 2', apiCycle: 'cycle 2', dataset: 'fr-en-programmes-enseignement-premier-degre', label: 'Cycle 2 — Apprentissages fondamentaux', eduscolUrl: 'https://eduscol.education.gouv.fr/84/j-enseigne-au-cycle-2' },
    CE1: { cycle: 'Cycle 2', apiCycle: 'cycle 2', dataset: 'fr-en-programmes-enseignement-premier-degre', label: 'Cycle 2 — Apprentissages fondamentaux', eduscolUrl: 'https://eduscol.education.gouv.fr/84/j-enseigne-au-cycle-2' },
    CE2: { cycle: 'Cycle 2', apiCycle: 'cycle 2', dataset: 'fr-en-programmes-enseignement-premier-degre', label: 'Cycle 2 — Apprentissages fondamentaux', eduscolUrl: 'https://eduscol.education.gouv.fr/84/j-enseigne-au-cycle-2' },
    CM1: { cycle: 'Cycle 3', apiCycle: 'cycle 3', dataset: 'fr-en-programmes-enseignement-premier-degre', label: 'Cycle 3 — Consolidation', eduscolUrl: 'https://eduscol.education.gouv.fr/87/j-enseigne-au-cycle-3' },
    CM2: { cycle: 'Cycle 3', apiCycle: 'cycle 3', dataset: 'fr-en-programmes-enseignement-premier-degre', label: 'Cycle 3 — Consolidation', eduscolUrl: 'https://eduscol.education.gouv.fr/87/j-enseigne-au-cycle-3' },
    '6e': { cycle: 'Cycle 3', apiCycle: 'Cycle 3', dataset: 'fr-en-programmes-enseignement-2nd-degre', label: 'Cycle 3 — Consolidation (Collège)', eduscolUrl: 'https://eduscol.education.gouv.fr/87/j-enseigne-au-cycle-3' },
    '5e': { cycle: 'Cycle 4', apiCycle: 'Cycle 4', dataset: 'fr-en-programmes-enseignement-2nd-degre', label: 'Cycle 4 — Approfondissements', eduscolUrl: 'https://eduscol.education.gouv.fr/90/j-enseigne-au-cycle-4' },
    '4e': { cycle: 'Cycle 4', apiCycle: 'Cycle 4', dataset: 'fr-en-programmes-enseignement-2nd-degre', label: 'Cycle 4 — Approfondissements', eduscolUrl: 'https://eduscol.education.gouv.fr/90/j-enseigne-au-cycle-4' },
    '3e': { cycle: 'Cycle 4', apiCycle: 'Cycle 4', dataset: 'fr-en-programmes-enseignement-2nd-degre', label: 'Cycle 4 — Approfondissements & Brevet (DNB)', eduscolUrl: 'https://eduscol.education.gouv.fr/90/j-enseigne-au-cycle-4' }
  };

  /**
   * Attendus de fin d'année & repères annuels de progression (Éduscol — Programme École Publique française CP → 3e).
   */
  const ATTENDUS = {
    CP: {
      francais: [
        { code: 'CP-FR-01', title: 'Décodage et lecture fluide', detail: 'Lire à voix haute de courtes phrases et des textes adaptés en identifiant les correspondances graphèmes-phonèmes.' },
        { code: 'CP-FR-02', title: 'Écriture et phrase simple', detail: 'Copier sans erreur, commencer une phrase par une majuscule et la terminer par un point.' },
        { code: 'CP-FR-03', title: 'Premiers accords dans le GN', detail: 'Repérer les marques simples du pluriel (-s) et du féminin (-e).' }
      ],
      maths: [
        { code: 'CP-MA-01', title: 'Nombres entiers jusqu’à 100', detail: 'Lire, écrire, décomposer en dizaines et unités et comparer les nombres jusqu’à 100.' },
        { code: 'CP-MA-02', title: 'Calcul mental et addition posée', detail: 'Connaître les compléments à 10, les doubles et additionner deux nombres en passant par la dizaine.' },
        { code: 'CP-MA-03', title: 'Géométrie et repérage', detail: 'Reconnaître carré, rectangle, triangle, cercle et tracer à la règle.' }
      ],
      sciences: [
        { code: 'CP-SC-01', title: 'Questionner le monde du vivant', detail: 'Distinguer vivant et non-vivant ; identifier les besoins d’une plante et d’un animal.' },
        { code: 'CP-SC-02', title: 'Repères dans le temps et l’espace', detail: 'Connaître les jours, les mois, les saisons et se repérer sur un plan simple.' }
      ],
      anglais: [
        { code: 'CP-AN-01', title: 'Salutations, couleurs et nombres', detail: 'Comprendre et utiliser des formules simples de politesse, les couleurs et compter jusqu’à 10.' }
      ]
    },
    CE1: {
      francais: [
        { code: 'CE1-FR-01', title: 'Conjugaison : présent, futur, imparfait', detail: 'Conjuguer être, avoir et les verbes en -er aux temps de base.' },
        { code: 'CE1-FR-02', title: 'Classes de mots', detail: 'Identifier le verbe, le nom, le déterminant et l’adjectif dans une phrase simple.' },
        { code: 'CE1-FR-03', title: 'Compréhension de récits', detail: 'Lire silencieusement un texte court et répondre à des questions explicites.' }
      ],
      maths: [
        { code: 'CE1-MA-01', title: 'Nombres jusqu’à 1 000', detail: 'Comparer, ranger et encadrer les nombres jusqu’à 1 000 (centaines, dizaines, unités).' },
        { code: 'CE1-MA-02', title: 'Sens de la multiplication et tables', detail: 'Comprendre la multiplication comme addition répétée et mémoriser les tables de 2, 3, 4 et 5.' },
        { code: 'CE1-MA-03', title: 'Grandeurs et mesures', detail: 'Lire l’heure, mesurer en cm/m et manipuler euros et centimes.' }
      ],
      sciences: [
        { code: 'CE1-SC-01', title: 'Les états de l’eau', detail: 'Identifier solide (glace) et liquide, et observer la fusion et la solidification à 0 °C.' },
        { code: 'CE1-SC-02', title: 'Hygiène et croissance', detail: 'Connaître les règles d’hygiène, de sommeil et d’alimentation.' }
      ],
      anglais: [
        { code: 'CE1-AN-01', title: 'Se présenter à l’oral', detail: 'Dire son prénom, son âge (I am … years old) et nommer les objets de la classe.' }
      ]
    },
    CE2: {
      francais: [
        { code: 'CE2-FR-01', title: 'Chaîne d’accord dans le GN', detail: 'Accorder en genre et en nombre déterminant, nom et adjectif.' },
        { code: 'CE2-FR-02', title: 'Passé composé et verbes fréquents', detail: 'Conjuguer les verbes courants (faire, aller, dire, venir, pouvoir, voir) au présent, futur, imparfait et passé composé.' }
      ],
      maths: [
        { code: 'CE2-MA-01', title: 'Nombres jusqu’à 10 000', detail: 'Maîtriser la numération jusqu’à 10 000 et la multiplication posée.' },
        { code: 'CE2-MA-02', title: 'Tables de multiplication (2 à 9)', detail: 'Restituer rapidement les tables et résoudre des problèmes à étapes.' },
        { code: 'CE2-MA-03', title: 'Angles droits et symétrie', detail: 'Vérifier un angle droit à l’équerre et tracer un symétrique sur quadrillage.' }
      ],
      sciences: [
        { code: 'CE2-SC-01', title: 'Alimentation et familles d’aliments', detail: 'Classer les aliments et composer un repas équilibré.' },
        { code: 'CE2-SC-02', title: 'Objets techniques et circuits simples', detail: 'Réaliser un circuit électrique simple (pile, ampoule, interrupteur).' }
      ],
      histgeo: [
        { code: 'CE2-HG-01', title: 'Repères chronologiques et siècles', detail: 'Lire une frise, situer les grandes périodes historiques et convertir une date en siècle.' },
        { code: 'CE2-HG-02', title: 'Paysages et territoires', detail: 'Observer son quartier, sa commune et situer la France sur un planisphère.' }
      ],
      anglais: [
        { code: 'CE2-AN-01', title: 'Jours, météo et famille', detail: 'Nommer les jours de la semaine, décrire le temps et présenter sa famille.' }
      ]
    },
    CM1: {
      francais: [
        { code: 'CM1-FR-01', title: 'Imparfait, passé simple et temps composés', detail: 'Maîtriser les terminaisons régulières de l’imparfait (dont les verbes du 2e groupe en -iss-) et le passé composé.' },
        { code: 'CM1-FR-02', title: 'Fonctions dans la phrase', detail: 'Identifier sujet, verbe, compléments du verbe et compléments circonstanciels.' }
      ],
      maths: [
        { code: 'CM1-MA-01', title: 'Fractions simples et nombres décimaux', detail: 'Lire, représenter et comparer des fractions simples puis introduire les dixièmes et centièmes.' },
        { code: 'CM1-MA-02', title: 'Division euclidienne', detail: 'Poser une division par un entier à un chiffre et interpréter quotient et reste.' },
        { code: 'CM1-MA-03', title: 'Périmètres et aires', detail: 'Calculer le périmètre d’un polygone et comparer des surfaces par pavage.' }
      ],
      sciences: [
        { code: 'CM1-SC-01', title: 'La planète Terre et le système solaire', detail: 'Situer la Terre parmi les 8 planètes et expliquer l’alternance jour/nuit et les saisons.' },
        { code: 'CM1-SC-02', title: 'Matière et mélanges', detail: 'Distinguer matières naturelles/fabriquées et séparer un mélange par filtration.' }
      ],
      histgeo: [
        { code: 'CM1-HG-01', title: 'Des Gaulois au Moyen Âge', detail: 'Situer Clovis (496), Charlemagne (800), Hugues Capet (987) et Saint Louis.' },
        { code: 'CM1-HG-02', title: 'Découvrir les lieux où j’habite', detail: 'Étudier la commune, le département, la région et les grands fleuves français.' }
      ],
      anglais: [
        { code: 'CM1-AN-01', title: 'Heure, routines et goûts (niveau A1)', detail: 'Dire l’heure simple, parler de sa journée et exprimer ce qu’on aime.' }
      ]
    },
    CM2: {
      francais: [
        { code: 'CM2-FR-01', title: 'Homophones grammaticaux & accord du participe passé', detail: 'Distinguer a/à, on/ont, son/sont, ces/ses et accorder le participe passé avec être.' },
        { code: 'CM2-FR-02', title: 'COD, COI et attribut du sujet', detail: 'Reconnaître les compléments essentiels du verbe et distinguer phrase simple / phrase complexe.' },
        { code: 'CM2-FR-03', title: 'Rédaction structurée', detail: 'Écrire un récit ou un texte explicatif cohérent et réviser son orthographe.' }
      ],
      maths: [
        { code: 'CM2-MA-01', title: 'Opérations sur les nombres décimaux', detail: 'Additionner, soustraire et multiplier des nombres décimaux ; diviser par 10, 100, 1 000.' },
        { code: 'CM2-MA-02', title: 'Proportionnalité et pourcentages simples', detail: 'Résoudre des problèmes par passage à l’unité, linéarité ou tableau de proportionnalité.' },
        { code: 'CM2-MA-03', title: 'Aires du carré, rectangle et triangle', detail: 'Calculer des aires en cm² / m² et construire des figures avec compas et équerre.' }
      ],
      sciences: [
        { code: 'CM2-SC-01', title: 'Sources et conversions d’énergie', detail: 'Distinguer énergies renouvelables et fossiles ; identifier des gestes d’économie d’énergie.' },
        { code: 'CM2-SC-02', title: 'Fonctions du corps humain et biodiversité', detail: 'Expliquer digestion, respiration et chaînes alimentaires.' }
      ],
      histgeo: [
        { code: 'CM2-HG-01', title: 'De la Révolution de 1789 au XXe siècle', detail: 'Maîtriser les repères de 1789 (Bastille, DDHC), l’âge industriel et les guerres mondiales.' },
        { code: 'CM2-HG-02', title: 'La France dans l’Union européenne', detail: 'Localiser les pays et capitales européennes et comprendre les mobilités.' }
      ],
      anglais: [
        { code: 'CM2-AN-01', title: 'Présent simple et échanges quotidiens (A1)', detail: 'Utiliser la 3e personne (-s), poser des questions simples et comprendre un court dialogue.' }
      ]
    },
    '6e': {
      francais: [
        { code: '6E-FR-01', title: 'Nature et fonction des mots', detail: 'Distinguer systématiquement la classe grammaticale (nature) et le rôle syntaxique (fonction).' },
        { code: '6E-FR-02', title: 'Textes fondateurs, contes et récits d’aventure', detail: 'Analyser l’Odyssée, les métamorphoses et maîtriser le couple imparfait / passé simple.' }
      ],
      maths: [
        { code: '6E-MA-01', title: 'Fractions quotients et nombres décimaux', detail: 'Placer des fractions sur une demi-droite graduée et calculer une fraction d’une quantité.' },
        { code: '6E-MA-02', title: 'Aires, volumes et angles au rapporteur', detail: 'Mesurer et tracer un angle au rapporteur, calculer aire du rectangle, triangle et disque.' }
      ],
      histgeo: [
        { code: '6E-HG-01', title: 'L’Antiquité : Orient, Grèce et Rome', detail: 'Comprendre la naissance de l’écriture, la démocratie athénienne et l’Empire romain.' },
        { code: '6E-HG-02', title: 'Habiter le monde', detail: 'Étudier métropoles, littoraux et espaces à fortes contraintes.' }
      ],
      svt: [
        { code: '6E-SVT-01', title: 'Unité du vivant : la cellule', detail: 'Observer au microscope et identifier membrane, cytoplasme et noyau.' }
      ],
      physique: [
        { code: '6E-PC-01', title: 'Matière, mélanges et mouvements', detail: 'Distinguer mélanges homogènes/hétérogènes et décrire une trajectoire et une vitesse.' }
      ],
      anglais: [
        { code: '6E-AN-01', title: 'Auxiliaires BE / HAVE GOT et présent BE + V-ing', detail: 'Consolider le niveau A1 vers A2 : décrire une personne, une action en cours et ses habitudes.' }
      ],
      techno: [
        { code: '6E-TE-01', title: 'Fonctions d’usage, d’estime et matériaux', detail: 'Analyser un objet technique, son besoin et ses familles de matériaux.' }
      ]
    },
    '5e': {
      francais: [
        { code: '5E-FR-01', title: 'Le récit d’aventure et le héros médiéval', detail: 'Employer le passé simple (dont -cer/-ger), analyser le point de vue et enrichir le vocabulaire.' },
        { code: '5E-FR-02', title: 'Phrase complexe : juxtaposition, coordination, subordination', detail: 'Identifier les propositions et les connecteurs logiques.' }
      ],
      maths: [
        { code: '5E-MA-01', title: 'Priorités opératoires et nombres relatifs', detail: 'Enchaîner des calculs avec parenthèses et additionner/soustraire des nombres positifs et négatifs.' },
        { code: '5E-MA-02', title: 'Symétrie centrale et angles dans le triangle', detail: 'Utiliser la somme des angles d’un triangle (180°) et les propriétés du parallélogramme.' }
      ],
      histgeo: [
        { code: '5E-HG-01', title: 'Moyen Âge, Humanisme et Renaissance', detail: 'Analyser l’essor urbain, l’imprimerie de Gutenberg et les grandes découvertes.' },
        { code: '5E-HG-02', title: 'Développement durable et ressources', detail: 'Étudier l’eau, l’énergie et le changement climatique.' }
      ],
      svt: [
        { code: '5E-SVT-01', title: 'Respiration, digestion et circulation sanguine', detail: 'Expliquer l’approvisionnement des organes en dioxygène (O₂) et nutriments.' }
      ],
      physique: [
        { code: '5E-PC-01', title: 'Circuits électriques en série et en dérivation', detail: 'Schématiser un circuit normalisé et prévoir le comportement des dipôles.' }
      ],
      anglais: [
        { code: '5E-AN-01', title: 'Prétérit simple (réguliers & irréguliers)', detail: 'Raconter un événement passé daté et poser des questions avec DID.' }
      ],
      techno: [
        { code: '5E-TE-01', title: 'Algorithmique et systèmes automatisés', detail: 'Écrire des instructions conditionnelles (Si… Alors… Sinon) à partir de capteurs.' }
      ]
    },
    '4e': {
      francais: [
        { code: '4E-FR-01', title: 'Figures de style et récit fantastique / réaliste', detail: 'Identifier métaphore, comparaison, personnification et hyperbole et commenter leurs effets.' },
        { code: '4E-FR-02', title: 'Voix passive et discours rapporté', detail: 'Transformer une phrase active en passive et passer du discours direct au discours indirect.' }
      ],
      maths: [
        { code: '4E-MA-01', title: 'Théorème de Pythagore et réciproque', detail: 'Calculer une longueur dans un triangle rectangle et prouver qu’un triangle est rectangle.' },
        { code: '4E-MA-02', title: 'Calcul littéral, puissances et équations', detail: 'Développer avec la distributivité et résoudre des équations du 1er degré.' }
      ],
      histgeo: [
        { code: '4E-HG-01', title: 'Siècle des Lumières, Révolution et XIXe siècle', detail: 'Étudier l’Encyclopédie (Diderot & d’Alembert), 1789 et la révolution industrielle.' },
        { code: '4E-HG-02', title: 'Urbanisation et mondialisation', detail: 'Comprendre les flux maritimes, le tourisme et les métropoles mondiales.' }
      ],
      svt: [
        { code: '4E-SVT-01', title: 'Tectonique des plaques, séismes et volcans', detail: 'Distinguer foyer et épicentre et relier les risques géologiques aux mouvements des plaques.' }
      ],
      physique: [
        { code: '4E-PC-01', title: 'Loi d’Ohm, intensité et tension', detail: 'Appliquer U = R × I avec conversions d’unités et lois d’additivité/unicité.' }
      ],
      anglais: [
        { code: '4E-AN-01', title: 'Comparatifs, superlatifs et modaux (A2+)', detail: 'Comparer des situations et exprimer obligation, conseil ou capacité (must, should, can).' }
      ],
      techno: [
        { code: '4E-TE-01', title: 'Réseaux informatiques, IP et routage', detail: 'Comprendre adressage IP, DNS et architecture client-serveur.' }
      ]
    },
    '3e': {
      francais: [
        { code: '3E-FR-01', title: 'Propositions subordonnées (Brevet)', detail: 'Distinguer subordonnée relative, complétive et circonstancielle ; réussir la réécriture et la dictée du DNB.' },
        { code: '3E-FR-02', title: 'Autobiographie, poésie engagée et argumentation', detail: 'Rédiger un sujet de réflexion structuré avec exemples littéraires.' }
      ],
      maths: [
        { code: '3E-MA-01', title: 'Fonctions linéaires et affines (Brevet)', detail: 'Calculer image et antécédent, lire une représentation graphique et modéliser une situation.' },
        { code: '3E-MA-02', title: 'Théorème de Thalès, trigonométrie et probabilités', detail: 'Appliquer Thalès, cos/sin/tan dans le triangle rectangle et calculer des probabilités.' }
      ],
      histgeo: [
        { code: '3E-HG-01', title: 'Guerres mondiales, Résistance et Ve République', detail: 'Maîtriser 1914-1918, 1939-1945 (Appel du 18 juin 1940, CNR) et la Guerre froide pour le DNB.' },
        { code: '3E-HG-02', title: 'Dynamiques territoriales de la France', detail: 'Rédiger un développement construit et réaliser un croquis de géographie.' }
      ],
      svt: [
        { code: '3E-SVT-01', title: 'Génétique, ADN et système immunitaire', detail: 'Analyser un caryotype (23 paires de chromosomes), comprendre gènes, allèles et vaccination.' }
      ],
      physique: [
        { code: '3E-PC-01', title: 'Poids et masse, atomes, ions et pH (Brevet)', detail: 'Appliquer P = m × g, identifier un atome/ion et interpréter une échelle de pH.' }
      ],
      anglais: [
        { code: '3E-AN-01', title: 'Present Perfect vs Prétérit (niveau B1)', detail: 'Faire un bilan d’expérience (since, for, never, already) et argumenter à l’oral et à l’écrit.' }
      ],
      techno: [
        { code: '3E-TE-01', title: 'Chaîne d’information et chaîne d’énergie (Brevet)', detail: 'Compléter un schéma fonctionnel complet et programmer un objet connecté.' }
      ]
    }
  };

  function getCycleMeta(levelId) {
    return CYCLE_META[levelId] || CYCLE_META.CM2;
  }

  function getAttendusForLevel(levelId, subjectId) {
    const lv = ATTENDUS[levelId] || ATTENDUS.CM2;
    if (subjectId && subjectId !== 'all') {
      return (lv[subjectId] || []).map(function (item) {
        return Object.assign({ subjectId: subjectId, levelId: levelId }, item);
      });
    }
    const all = [];
    Object.keys(lv).forEach(function (subjId) {
      lv[subjId].forEach(function (item) {
        all.push(Object.assign({ subjectId: subjId, levelId: levelId }, item));
      });
    });
    return all;
  }

  function loadCachedTexts(levelId) {
    try {
      const raw = global.localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed[levelId] || null;
    } catch (e) {
      return null;
    }
  }

  function saveCachedTexts(levelId, payload) {
    try {
      const raw = global.localStorage.getItem(CACHE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      parsed[levelId] = payload;
      global.localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
    } catch (e) {
      // ignore quota errors
    }
  }

  /**
   * Fetches official French Ministry of Education curriculum decrees (BOEN / PDF)
   * directly from data.education.gouv.fr Explore API v2.1 (public JSON, no key required).
   */
  async function fetchOfficialMinistryTexts(levelId) {
    const meta = getCycleMeta(levelId);
    const whereClause = encodeURIComponent('niveau_d_enseignement="' + meta.apiCycle + '"');
    const url = API_BASE + meta.dataset + '/records?where=' + whereClause + '&limit=12';

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      const rows = (json.results || []).map(function (r) {
        return {
          descriptif: r.descriptif || 'Programme officiel',
          niveau: r.niveau_d_enseignement || meta.cycle,
          discipline: r.discipline && r.discipline !== '-' ? r.discipline : 'Toutes disciplines',
          texteOfficiel: r.texte_officiel || '',
          entreeVigueur: r.entre_en_vigueur_a_la_rentree || '',
          abroge: r.abroge_a_la_rentree && r.abroge_a_la_rentree !== '-' ? r.abroge_a_la_rentree : null,
          pdfUrl: r.contenu_sur_le_site || r.lien_vers_le_texte_officiel || meta.eduscolUrl,
          legifranceUrl: r.lien_vers_le_texte_officiel || null
        };
      });

      // Sort newest / active first
      rows.sort(function (a, b) {
        const activeA = a.abroge ? 0 : 1;
        const activeB = b.abroge ? 0 : 1;
        if (activeA !== activeB) return activeB - activeA;
        return Number(b.entreeVigueur || 0) - Number(a.entreeVigueur || 0);
      });

      const payload = {
        fetchedAt: new Date().toISOString(),
        source: 'live-api',
        dataset: meta.dataset,
        records: rows
      };
      saveCachedTexts(levelId, payload);
      return payload;
    } catch (err) {
      const cached = loadCachedTexts(levelId);
      if (cached) {
        return Object.assign({}, cached, { source: 'cache' });
      }
      return {
        fetchedAt: null,
        source: 'offline-fallback',
        dataset: meta.dataset,
        error: err.message,
        records: [
          {
            descriptif: 'Programmes d’enseignement du ' + meta.label + ' (référentiel Éduscol)',
            niveau: meta.cycle,
            discipline: 'Toutes disciplines',
            texteOfficiel: 'Bulletin officiel de l’Éducation nationale',
            entreeVigueur: 'En vigueur',
            abroge: null,
            pdfUrl: meta.eduscolUrl,
            legifranceUrl: null
          }
        ]
      };
    }
  }

  global.CapOfficialProgram = {
    getCycleMeta: getCycleMeta,
    getAttendusForLevel: getAttendusForLevel,
    loadCachedTexts: loadCachedTexts,
    fetchOfficialMinistryTexts: fetchOfficialMinistryTexts
  };
})(window);
