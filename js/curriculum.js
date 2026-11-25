/* CapDevoirs — French Curriculum CP -> 3e (Subjects, Guided Exercises, Method Sheets, Quizzes) */
(function (global) {
  'use strict';

  const SUBJECT_DEFS = {
    francais: {
      id: 'francais',
      name: 'Français',
      short: 'Français',
      icon: 'pen',
      colorVar: '--subj-fr',
      softVar: '--subj-fr-soft',
      hex: '#B45309'
    },
    maths: {
      id: 'maths',
      name: 'Mathématiques',
      short: 'Maths',
      icon: 'calculator',
      colorVar: '--subj-math',
      softVar: '--subj-math-soft',
      hex: '#0F766E'
    },
    sciences: {
      id: 'sciences',
      name: 'Sciences & Découverte',
      short: 'Sciences',
      icon: 'leaf',
      colorVar: '--subj-sci',
      softVar: '--subj-sci-soft',
      hex: '#15803D'
    },
    histgeo: {
      id: 'histgeo',
      name: 'Histoire-Géo & EMC',
      short: 'Hist-Géo',
      icon: 'globe',
      colorVar: '--subj-hist',
      softVar: '--subj-hist-soft',
      hex: '#9A3412'
    },
    anglais: {
      id: 'anglais',
      name: 'Anglais',
      short: 'Anglais',
      icon: 'message',
      colorVar: '--subj-en',
      softVar: '--subj-en-soft',
      hex: '#1D4ED8'
    },
    svt: {
      id: 'svt',
      name: 'SVT',
      short: 'SVT',
      icon: 'leaf',
      colorVar: '--subj-sci',
      softVar: '--subj-sci-soft',
      hex: '#15803D'
    },
    physique: {
      id: 'physique',
      name: 'Physique-Chimie',
      short: 'Physique',
      icon: 'flask',
      colorVar: '--subj-pc',
      softVar: '--subj-pc-soft',
      hex: '#6D28D9'
    },
    techno: {
      id: 'techno',
      name: 'Technologie',
      short: 'Techno',
      icon: 'cpu',
      colorVar: '--subj-tech',
      softVar: '--subj-tech-soft',
      hex: '#334155'
    }
  };

  const LEVEL_SUBJECTS = {
    CP: ['francais', 'maths', 'sciences', 'anglais'],
    CE1: ['francais', 'maths', 'sciences', 'anglais'],
    CE2: ['francais', 'maths', 'sciences', 'histgeo', 'anglais'],
    CM1: ['francais', 'maths', 'sciences', 'histgeo', 'anglais'],
    CM2: ['francais', 'maths', 'sciences', 'histgeo', 'anglais'],
    '6e': ['francais', 'maths', 'histgeo', 'svt', 'physique', 'anglais', 'techno'],
    '5e': ['francais', 'maths', 'histgeo', 'svt', 'physique', 'anglais', 'techno'],
    '4e': ['francais', 'maths', 'histgeo', 'svt', 'physique', 'anglais', 'techno'],
    '3e': ['francais', 'maths', 'histgeo', 'svt', 'physique', 'anglais', 'techno']
  };

  /**
   * Built-in curriculum content grouped by level tier so EVERY level CP -> 3e
   * has authentic, age-appropriate exercises, method sheets, and validation quizzes.
   */
  const CONTENT_BANK = {
    CP: {
      francais: [
        {
          id: 'cp-fr-1',
          chapter: 'Sons et syllabes',
          title: 'Compter les syllabes d’un mot',
          difficulty: 'Facile',
          prompt: 'Combien de syllabes orales entend-on dans le mot « crocodile » ?',
          type: 'choice',
          options: ['2 syllabes', '3 syllabes', '4 syllabes'],
          answer: '3 syllabes',
          hints: [
            'Frappe dans tes mains en disant le mot doucement : cro - co - dile.',
            'Compte le nombre de coups dans tes mains : 1 (cro), 2 (co), 3 (dile).'
          ],
          explanation: 'À l’oral, « crocodile » se découpe en 3 syllabes : cro - co - dile.',
          methodSheet: {
            id: 'ms-cp-fr-1',
            title: 'Découper un mot en syllabes',
            essential: 'Une syllabe correspond à un son prononcé en une seule émission de voix.',
            steps: [
              'Prononce le mot lentement à voix haute.',
              'Frappe une fois dans tes mains à chaque morceau du mot.',
              'Compte combien de fois tu as frappé pour connaître le nombre de syllabes.'
            ],
            pitfall: 'En français, le « e » muet à la fin d’un mot (comme dans « lune » ou « crocodile ») ne forme pas une syllabe à l’oral.',
            example: 'pa - pi - llon = 3 syllabes ; ba - teau = 2 syllabes.'
          }
        },
        {
          id: 'cp-fr-2',
          chapter: 'Construire une phrase',
          title: 'Majuscule et point',
          difficulty: 'Facile',
          prompt: 'Quelle phrase est correctement écrite ?',
          type: 'choice',
          options: ['le chat dort sur le tapis', 'Le chat dort sur le tapis.', 'Le chat dort sur le tapis'],
          answer: 'Le chat dort sur le tapis.',
          hints: [
            'Regarde bien le début de la phrase : que faut-il mettre ?',
            'Regarde aussi la toute fin de la phrase.'
          ],
          explanation: 'Une phrase commence toujours par une majuscule (L) et se termine par un point (.).',
          methodSheet: {
            id: 'ms-cp-fr-2',
            title: 'Vérifier une phrase au CP',
            essential: 'Une phrase a du sens, commence par une majuscule et finit par un point.',
            steps: [
              'Vérifie la première lettre : est-ce une majuscule ?',
              'Relis la phrase pour vérifier qu’elle veut dire quelque chose.',
              'Ajoute un point (.), un point d’interrogation (?) ou d’exclamation (!) à la fin.'
            ],
            pitfall: 'Oublier le point final quand on change de ligne.',
            example: 'Mina lit un livre.'
          }
        }
      ],
      maths: [
        {
          id: 'cp-ma-1',
          chapter: 'Addition jusqu’à 20',
          title: 'Passer par la dizaine',
          difficulty: 'Facile',
          prompt: 'Calcule : 8 + 5 = ?',
          type: 'input',
          answer: '13',
          hints: [
            'Combien manque-t-il à 8 pour arriver à 10 ? Il manque 2.',
            'Partage 5 en 2 + 3. Puis fais 8 + 2 = 10, et ajoute 3.'
          ],
          explanation: '8 + 5 = (8 + 2) + 3 = 10 + 3 = 13.',
          methodSheet: {
            id: 'ms-cp-ma-1',
            title: 'Additionner en passant par 10',
            essential: 'Faire 10 d’abord rend le calcul mental beaucoup plus rapide.',
            steps: [
              'Pars du plus grand nombre (ici 8).',
              'Cherche son complément à 10 (8 + 2 = 10).',
              'Ajoute ce qui reste du deuxième nombre (10 + 3 = 13).'
            ],
            pitfall: 'Oublier d’enlever au deuxième nombre ce qu’on a utilisé pour faire 10.',
            example: '9 + 6 = 9 + 1 + 5 = 10 + 5 = 15.'
          }
        }
      ],
      sciences: [
        {
          id: 'cp-sc-1',
          chapter: 'Le vivant',
          title: 'De quoi une plante a-t-elle besoin ?',
          difficulty: 'Facile',
          prompt: 'Quel élément est indispensable pour qu’une plante verte grandisse bien ?',
          type: 'choice',
          options: ['De l’eau et de la lumière', 'Du plastique', 'De la musique'],
          answer: 'De l’eau et de la lumière',
          hints: ['Pense à ce que l’on donne aux fleurs dans un jardin ou près d’une fenêtre.'],
          explanation: 'Les plantes ont besoin d’eau, de lumière et de terre (sels minéraux) pour pousser.',
          methodSheet: {
            id: 'ms-cp-sc-1',
            title: 'Reconnaître les besoins d’un végétal',
            essential: 'Un végétal est un être vivant : il naît, grandit, se reproduit et meurt.',
            steps: [
              'Observe où la plante pousse (lumière du soleil).',
              'Vérifie l’humidité de la terre (besoin en eau).',
              'Compare deux graines : une arrosée et une sans eau.'
            ],
            pitfall: 'Croire qu’une plante n’est pas vivante parce qu’elle ne se déplace pas.',
            example: 'Une graine de haricot germe avec de l’eau et de la chaleur.'
          }
        }
      ],
      anglais: [
        {
          id: 'cp-en-1',
          chapter: 'Les couleurs',
          title: 'Dire les couleurs en anglais',
          difficulty: 'Facile',
          prompt: 'Comment dit-on « rouge » en anglais ?',
          type: 'choice',
          options: ['Blue', 'Red', 'Green'],
          answer: 'Red',
          hints: ['« Blue » veut dire bleu et « Green » veut dire vert.'],
          explanation: 'En anglais, rouge se dit « Red ».',
          methodSheet: {
            id: 'ms-cp-en-1',
            title: 'Mémoriser les couleurs de base',
            essential: 'Associer chaque mot anglais à un objet de la maison aide à le retenir.',
            steps: [
              'Répète le mot à voix haute en montrant un objet de cette couleur.',
              'Red (rouge), Blue (bleu), Yellow (jaune), Green (vert).'
            ],
            pitfall: 'Confondre « Green » (vert) et « Grey » (gris).',
            example: 'The apple is red.'
          }
        }
      ]
    },

    CE1: {
      francais: [
        {
          id: 'ce1-fr-1',
          chapter: 'Conjugaison : le présent',
          title: 'Verbes en -er au présent',
          difficulty: 'Facile',
          prompt: 'Complète au présent : « Nous (chanter) ______ une chanson. »',
          type: 'input',
          answer: 'chantons',
          hints: [
            'Enlève -er à « chanter » pour garder le radical « chant- ».',
            'Avec « nous », la terminaison au présent est -ons.'
          ],
          explanation: 'Au présent, avec « nous », le verbe chanter s’écrit « nous chantons ».',
          methodSheet: {
            id: 'ms-ce1-fr-1',
            title: 'Conjuguer un verbe en -er au présent',
            essential: 'Les terminaisons des verbes en -er au présent sont toujours : -e, -es, -e, -ons, -ez, -ent.',
            steps: [
              'Trouve l’infinitif du verbe (ex. chanter).',
              'Retire -er pour obtenir le radical (chant-).',
              'Ajoute la terminaison qui correspond au sujet (nous → -ons).'
            ],
            pitfall: 'Avec « tu », n’oublie jamais le « s » : tu chantes.',
            example: 'Je joue, tu joues, il joue, nous jouons, vous jouez, ils jouent.'
          }
        }
      ],
      maths: [
        {
          id: 'ce1-ma-1',
          chapter: 'Multiplication',
          title: 'Sens de la multiplication',
          difficulty: 'Moyen',
          prompt: 'Léo a 4 paquets de 5 billes. Combien a-t-il de billes en tout ?',
          type: 'input',
          answer: '20',
          hints: [
            '4 paquets de 5 billes, c’est 5 + 5 + 5 + 5, ou 4 × 5.',
            'Compte de 5 en 5 quatre fois : 5, 10, 15, ...'
          ],
          explanation: '4 × 5 = 20 billes.',
          methodSheet: {
            id: 'ms-ce1-ma-1',
            title: 'Passer de l’addition répétée à la multiplication',
            essential: 'Quand on ajoute plusieurs fois le même nombre, on utilise la multiplication.',
            steps: [
              'Repère le nombre de groupes (4 paquets).',
              'Repère combien il y a dans chaque groupe (5 billes).',
              'Écris 4 × 5 et calcule le résultat.'
            ],
            pitfall: 'Ne pas confondre 4 + 5 (= 9) et 4 × 5 (= 20).',
            example: '3 rangées de 6 chaises = 3 × 6 = 18 chaises.'
          }
        }
      ],
      sciences: [
        {
          id: 'ce1-sc-1',
          chapter: 'États de l’eau',
          title: 'Solide ou liquide ?',
          difficulty: 'Facile',
          prompt: 'À quelle température l’eau liquide gèle-t-elle pour devenir de la glace ?',
          type: 'choice',
          options: ['0 °C', '20 °C', '100 °C'],
          answer: '0 °C',
          hints: ['Pense à l’hiver quand il gèle dehors : le thermomètre descend en dessous de zéro.'],
          explanation: 'L’eau passe de l’état liquide à l’état solide (glace) à 0 °C.',
          methodSheet: {
            id: 'ms-ce1-sc-1',
            title: 'Les changements d’état de l’eau',
            essential: 'L’eau existe à l’état liquide (rivière), solide (glace, neige) et gazeux (vapeur).',
            steps: [
              'En dessous de 0 °C : solidification (glace).',
              'Au-dessus de 0 °C : fusion (la glace fond).',
              'À 100 °C : l’eau bout et se transforme en vapeur.'
            ],
            pitfall: 'La glace et la neige sont bien de l’eau, simplement à l’état solide.',
            example: 'Un glaçon laissé dans un verre fond à température ambiante.'
          }
        }
      ],
      anglais: [
        {
          id: 'ce1-en-1',
          chapter: 'Se présenter',
          title: 'Dire son âge',
          difficulty: 'Facile',
          prompt: 'Comment traduire « J’ai sept ans » en anglais ?',
          type: 'choice',
          options: ['I have seven years', 'I am seven years old', 'My name is seven'],
          answer: 'I am seven years old',
          hints: ['En anglais, on utilise le verbe « être » (I am) pour dire son âge.'],
          explanation: 'En anglais, on dit « I am seven years old » (et non « I have »).',
          methodSheet: {
            id: 'ms-ce1-en-1',
            title: 'Se présenter en 3 phrases',
            essential: 'Pour l’âge, l’anglais utilise « I am » (je suis).',
            steps: [
              'Dire bonjour : Hello!',
              'Dire son prénom : My name is ...',
              'Dire son âge : I am ... years old.'
            ],
            pitfall: 'Traduire mot à mot « J’ai » par « I have » pour l’âge.',
            example: 'Hello! My name is Tom. I am eight years old.'
          }
        }
      ]
    },

    CE2: {
      francais: [
        {
          id: 'ce2-fr-1',
          chapter: 'Grammaire : le groupe nominal',
          title: 'Accorder l’adjectif au pluriel',
          difficulty: 'Moyen',
          prompt: 'Mets au pluriel : « un petit chat noir » → « des ______ »',
          type: 'input',
          answer: 'petits chats noirs',
          hints: [
            'Dans un groupe nominal au pluriel, le nom et tous ses adjectifs prennent la marque du pluriel.',
            'Ajoute un « s » à petit, à chat et à noir.'
          ],
          explanation: 'Au pluriel, tous les mots du groupe nominal s’accordent : des petits chats noirs.',
          methodSheet: {
            id: 'ms-ce2-fr-1',
            title: 'La chaîne d’accord dans le groupe nominal',
            essential: 'Le déterminant, le nom et les adjectifs s’accordent ensemble en genre et en nombre.',
            steps: [
              'Repère le déterminant (des, les, mes → pluriel).',
              'Trouve le nom noyau (chats).',
              'Accorde chaque adjectif qui précise ce nom (petits, noirs).'
            ],
            pitfall: 'Oublier d’accorder l’adjectif placé avant le nom.',
            example: 'une grande maison bleue → des grandes maisons bleues.'
          }
        }
      ],
      maths: [
        {
          id: 'ce2-ma-1',
          chapter: 'Tables & problèmes',
          title: 'Problème multiplicatif',
          difficulty: 'Moyen',
          prompt: 'Une boîte contient 7 crayons. La maîtresse achète 6 boîtes. Combien a-t-elle de crayons ?',
          type: 'input',
          answer: '42',
          hints: [
            'C’est 6 fois 7 crayons.',
            'Tu peux faire (6 × 5) + (6 × 2) = 30 + 12.'
          ],
          explanation: '6 × 7 = 42 crayons.',
          methodSheet: {
            id: 'ms-ce2-ma-1',
            title: 'Résoudre un problème en 4 étapes',
            essential: 'Un schéma rapide aide à choisir la bonne opération.',
            steps: [
              'Lis l’énoncé et surligne la question.',
              'Repère les données utiles (7 crayons par boîte, 6 boîtes).',
              'Choisis l’opération (ici 6 × 7) et calcule.',
              'Rédige une phrase réponse avec l’unité (42 crayons).'
            ],
            pitfall: 'Additionner 7 + 6 alors que chaque boîte contient 7 crayons.',
            example: '8 bouquets de 4 fleurs → 8 × 4 = 32 fleurs.'
          }
        }
      ],
      sciences: [
        {
          id: 'ce2-sc-1',
          chapter: 'Alimentation',
          title: 'Les familles d’aliments',
          difficulty: 'Facile',
          prompt: 'À quelle famille appartiennent les pâtes, le pain et le riz ?',
          type: 'choice',
          options: ['Les féculents', 'Les produits laitiers', 'Les matières grasses'],
          answer: 'Les féculents',
          hints: ['Ce sont les aliments qui donnent de l’énergie sur la durée.'],
          explanation: 'Le pain, les pâtes, le riz et les pommes de terre sont des féculents.',
          methodSheet: {
            id: 'ms-ce2-sc-1',
            title: 'Composer un repas équilibré',
            essential: 'Chaque famille d’aliments joue un rôle précis (énergie, bâtisseurs, protecteurs).',
            steps: [
              'Associe féculents (énergie) + légumes/fruits (vitamines).',
              'Ajoute des protéines et un produit laitier.',
              'Bois de l’eau à volonté.'
            ],
            pitfall: 'Confondre les pommes de terre (féculents) avec les légumes verts.',
            example: 'Carottes râpées, poisson, riz, yaourt, pomme et eau.'
          }
        }
      ],
      histgeo: [
        {
          id: 'ce2-hg-1',
          chapter: 'Se repérer dans le temps',
          title: 'Les siècles',
          difficulty: 'Moyen',
          prompt: 'En quel siècle sommes-nous en 2026 ?',
          type: 'choice',
          options: ['XXe siècle (20e)', 'XXIe siècle (21e)', 'XIXe siècle (19e)'],
          answer: 'XXIe siècle (21e)',
          hints: ['L’an 1 à 100 est le 1er siècle, donc 2001 à 2100 est le...'],
          explanation: 'De 2001 à 2100, nous sommes au XXIe siècle (21e siècle).',
          methodSheet: {
            id: 'ms-ce2-hg-1',
            title: 'Trouver le siècle d’une date',
            essential: 'Pour une année qui ne finit pas par 00, prends le nombre de centaines et ajoute 1.',
            steps: [
              'Repère le nombre de centaines (dans 2026, il y a 20 centaines).',
              'Ajoute 1 : 20 + 1 = 21 → XXIe siècle.',
              'Vérifie avec les chiffres romains : X = 10, XX = 20, XXI = 21.'
            ],
            pitfall: 'Croire que 1950 est au 19e siècle (19 + 1 = 20e siècle !).',
            example: '1789 → 17 + 1 = 18e siècle (XVIIIe).'
          }
        }
      ],
      anglais: [
        {
          id: 'ce2-en-1',
          chapter: 'Les jours de la semaine',
          title: 'Ordonner la semaine',
          difficulty: 'Facile',
          prompt: 'Quel jour vient juste après « Tuesday » ?',
          type: 'choice',
          options: ['Monday', 'Wednesday', 'Thursday'],
          answer: 'Wednesday',
          hints: ['Monday (lundi), Tuesday (mardi), ... (mercredi).'],
          explanation: 'Après Tuesday (mardi) vient Wednesday (mercredi).',
          methodSheet: {
            id: 'ms-ce2-en-1',
            title: 'Retenir les 7 jours en anglais',
            essential: 'En anglais, les jours de la semaine prennent toujours une majuscule.',
            steps: [
              'Récite dans l’ordre : Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday.',
              'Repère l’orthographe silencieuse de Wed-nes-day.'
            ],
            pitfall: 'Confondre Tuesday (mardi) et Thursday (jeudi).',
            example: 'Today is Wednesday.'
          }
        }
      ]
    },

    CM1: {
      francais: [
        {
          id: 'cm1-fr-1',
          chapter: 'Conjugaison : l’imparfait',
          title: 'Terminaisons de l’imparfait',
          difficulty: 'Moyen',
          prompt: 'Conjugue à l’imparfait : « Autrefois, nous (finir) ______ tôt. »',
          type: 'input',
          answer: 'finissions',
          hints: [
            '« Finir » est un verbe du 2e groupe : au présent avec nous, on dit « nous finissons ».',
            'À l’imparfait, remplace -ons par -ions sur le radical finiss-.'
          ],
          explanation: 'Les verbes du 2e groupe gardent -iss- à l’imparfait : nous finissions.',
          methodSheet: {
            id: 'ms-cm1-fr-1',
            title: 'Former l’imparfait sans erreur',
            essential: 'Tous les verbes (sauf être) forment leur imparfait sur le radical de « nous » au présent.',
            steps: [
              'Conjugue le verbe avec « nous » au présent (nous finissons).',
              'Enlève -ons → radical finiss-.',
              'Ajoute -ais, -ais, -ait, -ions, -iez, -aient.'
            ],
            pitfall: 'Oublier le double « s » aux verbes en -ir du 2e groupe (finissions, choisissais).',
            example: 'nous prenons → je prenais ; nous choisissons → vous choisissiez.'
          }
        }
      ],
      maths: [
        {
          id: 'cm1-ma-1',
          chapter: 'Fractions simples',
          title: 'Comprendre une fraction',
          difficulty: 'Moyen',
          prompt: 'Un gâteau est coupé en 8 parts égales. Léa en mange 3 parts. Quelle fraction du gâteau reste-t-il ?',
          type: 'choice',
          options: ['3/8', '5/8', '5/3'],
          answer: '5/8',
          hints: [
            'Il y a 8 parts en tout (c’est le dénominateur, en bas).',
            'On enlève 3 parts aux 8 parts : 8 - 3 = 5 parts restantes.'
          ],
          explanation: '8/8 - 3/8 = 5/8 du gâteau.',
          methodSheet: {
            id: 'ms-cm1-ma-1',
            title: 'Lire et représenter une fraction',
            essential: 'Le dénominateur (en bas) indique en combien de parts égales on partage l’unité ; le numérateur (en haut) indique combien de parts on prend.',
            steps: [
              'Compte le nombre total de parts égales → dénominateur.',
              'Lis bien si la question demande ce qui est pris OU ce qui reste.',
              'Vérifie que numérateur + reste = dénominateur.'
            ],
            pitfall: 'Répondre la fraction mangée (3/8) au lieu de la fraction restante (5/8).',
            example: '1 unité = 4/4 = 8/8.'
          }
        }
      ],
      sciences: [
        {
          id: 'cm1-sc-1',
          chapter: 'Système solaire',
          title: 'Les planètes proches du Soleil',
          difficulty: 'Moyen',
          prompt: 'Quelle est la 3e planète en partant du Soleil ?',
          type: 'choice',
          options: ['Vénus', 'La Terre', 'Mars'],
          answer: 'La Terre',
          hints: ['Utilise la phrase : « Me Voici Tout Mouillé... » (Mercure, Vénus, Terre, Mars).'],
          explanation: 'Dans l’ordre depuis le Soleil : 1. Mercure, 2. Vénus, 3. La Terre, 4. Mars.',
          methodSheet: {
            id: 'ms-cm1-sc-1',
            title: 'Retenir l’ordre des 8 planètes',
            essential: 'Phrase mnémotechnique : « Mon Vieux Théâtre Me Joue Souvent Une Nouvelle (Pièce) ».',
            steps: [
              '4 planètes rocheuses : Mercure, Vénus, Terre, Mars.',
              '4 géantes gazeuses/de glace : Jupiter, Saturne, Uranus, Neptune.'
            ],
            pitfall: 'Le Soleil est une étoile, pas une planète ; la Lune est un satellite.',
            example: 'La Terre tourne autour du Soleil en 365 jours et quart.'
          }
        }
      ],
      histgeo: [
        {
          id: 'cm1-hg-1',
          chapter: 'Le Moyen Âge',
          title: 'Couronnement de Charlemagne',
          difficulty: 'Moyen',
          prompt: 'En quelle année Charlemagne a-t-il été sacré empereur ?',
          type: 'choice',
          options: ['496', '800', '1515'],
          answer: '800',
          hints: ['C’est un nombre tout rond au début du IXe siècle, le jour de Noël.'],
          explanation: 'Charlemagne est sacré empereur à Rome le 25 décembre 800.',
          methodSheet: {
            id: 'ms-cm1-hg-1',
            title: 'Mémoriser les grands repères du Moyen Âge',
            essential: 'Placer chaque personnage sur une frise chronologique évite les confusions.',
            steps: [
              '476 : fin de l’Antiquité / début du Moyen Âge.',
              '496 : baptême de Clovis.',
              '800 : sacre de Charlemagne.',
              '987 : Hugues Capet devient roi.'
            ],
            pitfall: 'Confondre Charlemagne (800) et François Ier (1515, Renaissance).',
            example: 'Charlemagne encourage l’école pour former les futurs fonctionnaires de l’Empire.'
          }
        }
      ],
      anglais: [
        {
          id: 'cm1-en-1',
          chapter: 'L’heure en anglais',
          title: 'Lire l’heure pile',
          difficulty: 'Facile',
          prompt: 'Comment dit-on « Il est 9 heures » en anglais ?',
          type: 'choice',
          options: ['It is nine o’clock', 'It is nine hours', 'It has nine o’clock'],
          answer: 'It is nine o’clock',
          hints: ['Pour une heure pile, on ajoute « o’clock » après le chiffre.'],
          explanation: '« Il est 9 heures » se traduit par « It is nine o’clock ».',
          methodSheet: {
            id: 'ms-cm1-en-1',
            title: 'Dire l’heure simple en anglais',
            essential: 'On commence toujours par « It is... » (ou « It’s... »).',
            steps: [
              'Heure pile : It’s + chiffre + o’clock.',
              'Demi-heure : It’s half past + chiffre.'
            ],
            pitfall: 'Ne jamais dire « hours » pour donner l’heure en anglais.',
            example: 'It’s half past seven (7h30).'
          }
        }
      ]
    },

    CM2: {
      francais: [
        {
          id: 'cm2-fr-1',
          chapter: 'Orthographe : homophones grammaticaux',
          title: 'Choisir entre « a » et « à » / « son » et « sont »',
          difficulty: 'Moyen',
          prompt: 'Complète : « Les élèves ______ rangé leurs cahiers avant de partir ______ la récréation. »',
          type: 'choice',
          options: ['ont / à', 'on / a', 'ont / a'],
          answer: 'ont / à',
          hints: [
            'Remplace le premier mot par « avaient » : « Les élèves avaient rangé » fonctionne → c’est le verbe avoir (ont).',
            'Remplace le second par « avait » : « partir avait la récréation » ne fonctionne pas → c’est la préposition « à ».'
          ],
          explanation: '« ont » est le verbe avoir au présent (remplaçable par avaient) ; « à » est une préposition invariable.',
          methodSheet: {
            id: 'ms-cm2-fr-1',
            title: 'Ne plus confondre les homophones grammaticaux',
            essential: 'Le test de remplacement à l’imparfait fonctionne à tous les coups.',
            steps: [
              'a / à : remplace par « avait ». Si ça marche → « a » (verbe), sinon → « à ».',
              'ont / on : remplace par « avaient ». Si ça marche → « ont », sinon → « on » (remplaçable par « il »).',
              'sont / son : remplace par « étaient ». Si ça marche → « sont », sinon → « son » (remplaçable par « mon »).'
            ],
            pitfall: 'Se fier uniquement au son à l’oral sans tester le remplacement.',
            example: 'On (il) a (avait) pensé à son (mon) cahier.'
          }
        },
        {
          id: 'cm2-fr-2',
          chapter: 'Grammaire : les fonctions',
          title: 'Repérer le COD',
          difficulty: 'Moyen',
          prompt: 'Dans la phrase « Léa prépare son sac d’école », quel est le COD ?',
          type: 'choice',
          options: ['Léa', 'son sac d’école', 'prépare'],
          answer: 'son sac d’école',
          hints: [
            'Repère d’abord le sujet (Léa) et le verbe (prépare).',
            'Pose la question : « Léa prépare quoi ? »'
          ],
          explanation: 'Léa prépare QUOI ? → « son sac d’école » est le Complément d’Objet Direct (COD).',
          methodSheet: {
            id: 'ms-cm2-fr-2',
            title: 'Identifier le COD dans une phrase',
            essential: 'Le COD complète directement le verbe sans préposition (à, de...).',
            steps: [
              'Trouve le verbe conjugué et son sujet.',
              'Pose la question « Sujet + verbe + qui ? ou quoi ? ».',
              'Vérifie que le COD ne peut ni être supprimé ni déplacé librement.'
            ],
            pitfall: 'Ne pas confondre le COD avec un complément circonstanciel (où, quand, comment).',
            example: 'Il lit [un roman policier] (COD) [chaque soir] (CC de temps).'
          }
        }
      ],
      maths: [
        {
          id: 'cm2-ma-1',
          chapter: 'Nombres décimaux',
          title: 'Additionner des nombres décimaux',
          difficulty: 'Moyen',
          prompt: 'Calcule : 14,7 + 3,45 = ?',
          type: 'input',
          answer: '18,15',
          hints: [
            'Aligne bien les virgules ! Tu peux écrire 14,70 + 3,45.',
            'Centièmes : 0 + 5 = 5. Dixièmes : 7 + 4 = 11 (je pose 1 et je retiens 1). Unités : 14 + 3 + 1 = 18.'
          ],
          explanation: '14,70 + 3,45 = 18,15.',
          methodSheet: {
            id: 'ms-cm2-ma-1',
            title: 'Poser une addition ou soustraction de décimaux',
            essential: 'La virgule sert toujours de repère d’alignement vertical.',
            steps: [
              'Aligne les virgules exactement les unes sous les autres.',
              'Complète la partie décimale avec des zéros inutiles (14,7 → 14,70) pour équilibrer les colonnes.',
              'Effectue le calcul de droite à gauche sans oublier les retenues, puis abaisse la virgule.'
            ],
            pitfall: 'Aligner les chiffres par la droite comme pour des nombres entiers.',
            example: '25,4 - 6,28 = 25,40 - 6,28 = 19,12.'
          }
        },
        {
          id: 'cm2-ma-2',
          chapter: 'Proportionnalité',
          title: 'Passage par l’unité',
          difficulty: 'Difficile',
          prompt: '4 cahiers identiques coûtent 10 €. Combien coûtent 6 cahiers ?',
          type: 'input',
          answer: '15',
          hints: [
            'Cherche d’abord le prix de 2 cahiers (la moitié de 4 cahiers → la moitié de 10 € = 5 €).',
            '6 cahiers, c’est 4 cahiers + 2 cahiers = 10 € + 5 €.'
          ],
          explanation: '1 cahier coûte 2,50 €, donc 6 cahiers coûtent 6 × 2,50 € = 15 € (ou 10 € + 5 € = 15 €).',
          methodSheet: {
            id: 'ms-cm2-ma-2',
            title: 'Résoudre un problème de proportionnalité',
            essential: 'Dans une situation proportionnelle, si on double la quantité, on double le prix.',
            steps: [
              'Trace un petit tableau à deux lignes (quantité / prix).',
              'Cherche une astuce (moitié, double) OU calcule la valeur pour 1 unité (prix ÷ quantité).',
              'Multiplie le prix d’une unité par la quantité demandée.'
            ],
            pitfall: 'Ajouter +2 € parce qu’on ajoute +2 cahiers (c’est une erreur d’addition au lieu de multiplication).',
            example: '3 kg de pommes = 6 € → 1 kg = 2 € → 5 kg = 10 €.'
          }
        }
      ],
      sciences: [
        {
          id: 'cm2-sc-1',
          chapter: 'Énergie',
          title: 'Sources d’énergie renouvelables',
          difficulty: 'Facile',
          prompt: 'Laquelle de ces sources d’énergie est renouvelable ?',
          type: 'choice',
          options: ['Le charbon', 'Le vent (éolien)', 'Le pétrole'],
          answer: 'Le vent (éolien)',
          hints: ['Une énergie renouvelable se régénère naturellement à l’échelle humaine.'],
          explanation: 'Le vent, le soleil et l’eau sont des énergies renouvelables, contrairement au pétrole et au charbon (énergies fossiles).',
          methodSheet: {
            id: 'ms-cm2-sc-1',
            title: 'Distinguer énergie renouvelable et fossile',
            essential: 'Une énergie renouvelable ne s’épuise pas quand on l’utilise.',
            steps: [
              'Renouvelables : soleil (solaire), vent (éolien), eau (hydraulique), biomasse, géothermie.',
              'Fossiles (stock limité) : pétrole, charbon, gaz naturel.'
            ],
            pitfall: 'Confondre source d’énergie (le vent) et forme d’énergie produite (électricité).',
            example: 'Une éolienne transforme l’énergie du vent en énergie électrique.'
          }
        }
      ],
      histgeo: [
        {
          id: 'cm2-hg-1',
          chapter: 'La Révolution française',
          title: 'Dates clés de 1789',
          difficulty: 'Moyen',
          prompt: 'Quel texte fondamental est adopté le 26 août 1789 ?',
          type: 'choice',
          options: [
            'La Déclaration des droits de l’homme et du citoyen',
            'L’Édit de Nantes',
            'Le Traité de Rome'
          ],
          answer: 'La Déclaration des droits de l’homme et du citoyen',
          hints: ['Ce texte commence par : « Les hommes naissent et demeurent libres et égaux en droits. »'],
          explanation: 'La DDHC est votée le 26 août 1789, quelques semaines après la prise de la Bastille (14 juillet 1789).',
          methodSheet: {
            id: 'ms-cm2-hg-1',
            title: 'Retenir l’enchaînement de 1789',
            essential: 'Trois dates résument l’été 1789.',
            steps: [
              '14 juillet 1789 : prise de la Bastille.',
              '4 août 1789 : abolition des privilèges.',
              '26 août 1789 : Déclaration des droits de l’homme et du citoyen.'
            ],
            pitfall: 'Ne pas confondre la prise de la Bastille (1789) et la proclamation de la Ire République (1792).',
            example: 'La DDHC garantit la liberté d’opinion et l’égalité devant la loi.'
          }
        }
      ],
      anglais: [
        {
          id: 'cm2-en-1',
          chapter: 'Vie quotidienne',
          title: 'Parler de ses goûts',
          difficulty: 'Facile',
          prompt: 'Choisis la phrase correcte pour dire « Elle aime la musique » :',
          type: 'choice',
          options: ['She like music.', 'She likes music.', 'She liking music.'],
          answer: 'She likes music.',
          hints: ['Au présent simple en anglais, avec He / She / It, le verbe prend une lettre finale.'],
          explanation: 'À la 3e personne du singulier (he/she/it), on ajoute un -s au verbe : She likes music.',
          methodSheet: {
            id: 'ms-cm2-en-1',
            title: 'Le -s de la 3e personne au présent simple',
            essential: 'Avec He, She ou It, pense toujours au « s » à la fin du verbe !',
            steps: [
              'Repère le sujet : I/You/We/They → base verbale (like).',
              'He/She/It (ou un prénom seul : Léa) → base verbale + s (likes).'
            ],
            pitfall: 'Oublier le -s quand le sujet est un prénom (« Tom plays football »).',
            example: 'I play tennis, but she plays basketball.'
          }
        }
      ]
    },

    '6e': {
      francais: [
        {
          id: '6e-fr-1',
          chapter: 'Classes grammaticales',
          title: 'Distinguer nature et fonction',
          difficulty: 'Moyen',
          prompt: 'Dans « Le courageux Ulysse rentre à Ithaque », quelle est la NATURE (classe grammaticale) de « courageux » ?',
          type: 'choice',
          options: ['Épithète', 'Adjectif qualificatif', 'Nom commun'],
          answer: 'Adjectif qualificatif',
          hints: [
            'La NATURE est la carte d’identité du mot (dans le dictionnaire).',
            '« Épithète » est sa fonction dans la phrase, pas sa nature.'
          ],
          explanation: '« courageux » a pour nature « adjectif qualificatif » (et pour fonction « épithète du nom Ulysse »).',
          methodSheet: {
            id: 'ms-6e-fr-1',
            title: 'Ne jamais confondre Nature et Fonction',
            essential: 'Nature = ce que le mot EST (nom, verbe, adjectif...). Fonction = le rôle qu’il JOUE dans la phrase (sujet, COD, épithète...).',
            steps: [
              'Demande-toi d’abord : que dit le dictionnaire ? → Nature (classe grammaticale).',
              'Demande-toi ensuite : quel est son travail dans cette phrase précise ? → Fonction.'
            ],
            pitfall: 'Répondre « sujet » quand on demande la nature d’un mot.',
            example: '« Ulysse » : nature = nom propre ; fonction = sujet du verbe rentre.'
          }
        }
      ],
      maths: [
        {
          id: '6e-ma-1',
          chapter: 'Géométrie : périmètre et aire',
          title: 'Aire d’un rectangle',
          difficulty: 'Moyen',
          prompt: 'Un terrain rectangulaire mesure 12 m de longueur et 5 m de largeur. Quelle est son aire (en m²) ?',
          type: 'input',
          answer: '60',
          hints: [
            'Ne confonds pas périmètre (le tour) et aire (la surface intérieure).',
            'Formule de l’aire du rectangle : Longueur × largeur.'
          ],
          explanation: 'Aire = 12 m × 5 m = 60 m².',
          methodSheet: {
            id: 'ms-6e-ma-1',
            title: 'Distinguer Périmètre et Aire',
            essential: 'Périmètre = longueur du contour (en m). Aire = surface intérieure (en m²).',
            steps: [
              'Vérifie que les deux dimensions sont dans la même unité.',
              'Périmètre du rectangle = 2 × (L + l).',
              'Aire du rectangle = L × l (résultat en unités carrées : cm², m²).'
            ],
            pitfall: 'Oublier le ² dans l’unité d’aire ou additionner au lieu de multiplier.',
            example: 'Rectangle 8 cm × 3 cm → P = 22 cm ; A = 24 cm².'
          }
        }
      ],
      histgeo: [
        {
          id: '6e-hg-1',
          chapter: 'L’Antiquité : la Grèce antique',
          title: 'La démocratie à Athènes',
          difficulty: 'Moyen',
          prompt: 'Au Ve siècle av. J.-C., qui avait le droit de voter à l’Ecclésia d’Athènes ?',
          type: 'choice',
          options: [
            'Tous les habitants d’Athènes',
            'Uniquement les citoyens athéniens (hommes libres nés de parents athéniens)',
            'Uniquement les généraux'
          ],
          answer: 'Uniquement les citoyens athéniens (hommes libres nés de parents athéniens)',
          hints: ['Les femmes, les métèques (étrangers) et les esclaves étaient exclus du vote.'],
          explanation: 'La démocratie athénienne était limitée aux citoyens hommes libres majeurs (environ 10 % de la population).',
          methodSheet: {
            id: 'ms-6e-hg-1',
            title: 'Analyser une question d’histoire au collège',
            essential: 'Toujours replacer le fait dans son contexte (lieu, date, acteurs).',
            steps: [
              'Identifie le mot-clé du cours (citoyenneté, Ecclésia).',
              'Distingue les groupes sociaux (citoyens / femmes / métèques / esclaves).',
              'Nuance toujours : démocratie directe mais réservée à une minorité.'
            ],
            pitfall: 'Croire que la démocratie antique fonctionnait avec le suffrage universel actuel.',
            example: 'Les citoyens votent les lois à main levée sur la colline de la Pnyx.'
          }
        }
      ],
      svt: [
        {
          id: '6e-svt-1',
          chapter: 'La cellule',
          title: 'Point commun des êtres vivants',
          difficulty: 'Facile',
          prompt: 'De quoi sont constitués tous les êtres vivants (animaux, végétaux, bactéries) ?',
          type: 'choice',
          options: ['De cellules', 'De roches', 'De sang'],
          answer: 'De cellules',
          hints: ['C’est la brique microscopique universelle du vivant observée au microscope.'],
          explanation: 'Tous les êtres vivants sont formés d’une ou plusieurs cellules (membrane, cytoplasme, matériel génétique).',
          methodSheet: {
            id: 'ms-6e-svt-1',
            title: 'Légender une cellule au microscope',
            essential: 'Une cellule comporte toujours une membrane plasmique et un cytoplasme (et un noyau chez les animaux/végétaux).',
            steps: [
              'Trace les traits de légende à la règle, horizontaux et sans qu’ils se croisent.',
              'Indique un titre précis et le grossissement du microscope.'
            ],
            pitfall: 'Oublier que les plantes aussi sont faites de cellules.',
            example: 'L’épiderme d’oignon montre des cellules rectangulaires avec paroi.'
          }
        }
      ],
      physique: [
        {
          id: '6e-pc-1',
          chapter: 'Mélanges',
          title: 'Mélange homogène ou hétérogène',
          difficulty: 'Facile',
          prompt: 'Quand on mélange de l’eau et de l’huile, on distingue deux couches. Ce mélange est :',
          type: 'choice',
          options: ['Homogène', 'Hétérogène', 'Pur'],
          answer: 'Hétérogène',
          hints: ['« Hétéro » signifie « différent » : on voit plusieurs constituants à l’œil nu.'],
          explanation: 'Comme on distingue l’eau et l’huile à l’œil nu (liquides non miscibles), le mélange est hétérogène.',
          methodSheet: {
            id: 'ms-6e-pc-1',
            title: 'Reconnaître un mélange',
            essential: 'Homogène = on ne distingue qu’une seule phase à l’œil nu. Hétérogène = on en distingue au moins deux.',
            steps: [
              'Observe attentivement après agitation et repos.',
              'Eau + sirop → homogène (miscibles).',
              'Eau + sable ou eau + huile → hétérogène.'
            ],
            pitfall: 'Penser qu’un liquide coloré mais limpide (eau + sirop) est hétérogène.',
            example: 'On sépare un mélange hétérogène eau/sable par filtration.'
          }
        }
      ],
      anglais: [
        {
          id: '6e-en-1',
          chapter: 'Be & Have got',
          title: 'Choisir le bon auxiliaire',
          difficulty: 'Facile',
          prompt: 'Complète : « He ______ a green backpack. »',
          type: 'choice',
          options: ['have got', 'has got', 'is got'],
          answer: 'has got',
          hints: ['Avec He / She / It, « have » devient « has ».'],
          explanation: 'À la 3e personne du singulier, on utilise « has got » pour la possession.',
          methodSheet: {
            id: 'ms-6e-en-1',
            title: 'Maîtriser BE et HAVE GOT',
            essential: 'BE décrit (âge, taille, humeur) ; HAVE GOT exprime la possession.',
            steps: [
              'I/You/We/They have got ; He/She/It has got.',
              'Forme négative : hasn’t got / haven’t got.'
            ],
            pitfall: 'Utiliser « have got » pour l’âge (toujours « I am 11 »).',
            example: 'She is tall and she has got brown eyes.'
          }
        }
      ],
      techno: [
        {
          id: '6e-te-1',
          chapter: 'Objet technique',
          title: 'Fonction d’usage',
          difficulty: 'Facile',
          prompt: 'Quelle est la fonction d’usage d’un vélo ?',
          type: 'choice',
          options: ['Être de couleur bleue', 'Permettre de se déplacer à la force des jambes', 'Coûter moins de 300 €'],
          answer: 'Permettre de se déplacer à la force des jambes',
          hints: ['La fonction d’usage répond toujours à la question : « À quoi sert cet objet ? »'],
          explanation: 'La fonction d’usage indique le service rendu par l’objet technique à son utilisateur.',
          methodSheet: {
            id: 'ms-6e-te-1',
            title: 'Fonction d’usage vs Fonction d’estime',
            essential: 'Fonction d’usage = à quoi ça sert (verbe à l’infinitif). Fonction d’estime = pourquoi il plaît (design, couleur, marque).',
            steps: [
              'Commence toujours la fonction d’usage par « Permettre de... ».',
              'Ne mélange pas l’esthétique (estime) avec l’utilité (usage).'
            ],
            pitfall: 'Citer un matériau ou une couleur comme fonction d’usage.',
            example: 'Une gourde permet de transporter et conserver une boisson.'
          }
        }
      ]
    },

    '5e': {
      francais: [
        {
          id: '5e-fr-1',
          chapter: 'Conjugaison : le passé simple',
          title: 'Passé simple des verbes du 1er groupe',
          difficulty: 'Moyen',
          prompt: 'Conjugue au passé simple : « Le chevalier (avancer) ______ dans la forêt. »',
          type: 'input',
          answer: 'avança',
          hints: [
            'Pour un verbe en -er à la 3e personne du singulier, la terminaison est -a.',
            'Attention au « c » devant un « a » : il faut une cédille pour garder le son [s] !'
          ],
          explanation: 'Au passé simple, « avancer » donne « il avança » (avec une cédille sous le c devant a).',
          methodSheet: {
            id: 'ms-5e-fr-1',
            title: 'Le passé simple dans le récit',
            essential: 'Il exprime les actions principales, brèves et achevées du récit au passé.',
            steps: [
              '1er groupe (-er) : -ai, -as, -a, -âmes, -âtes, -èrent.',
              'Attention aux verbes en -cer (ç devant a) et -ger (ge devant a : il mangea).'
            ],
            pitfall: 'Écrire « il avancait » (imparfait) ou oublier la cédille dans « avança ».',
            example: 'Il lança son épée et plongea dans la rivière.'
          }
        }
      ],
      maths: [
        {
          id: '5e-ma-1',
          chapter: 'Priorités opératoires',
          title: 'Calculer une expression numérique',
          difficulty: 'Moyen',
          prompt: 'Calcule : 4 + 3 × (8 - 2) = ?',
          type: 'input',
          answer: '22',
          hints: [
            'Commence toujours par les parenthèses : 8 - 2 = 6.',
            'Ensuite la multiplication est prioritaire sur l’addition : 3 × 6 = 18, puis 4 + 18.'
          ],
          explanation: '4 + 3 × (8 - 2) = 4 + 3 × 6 = 4 + 18 = 22.',
          methodSheet: {
            id: 'ms-5e-ma-1',
            title: 'Ordre des priorités opératoires',
            essential: '1. Parenthèses → 2. Multiplications et divisions → 3. Additions et soustractions (de gauche à droite).',
            steps: [
              'Souligne l’opération prioritaire à chaque ligne.',
              'Recopie le reste de l’expression exactement au même endroit.',
              'Ne saute pas d’étapes pour éviter les erreurs de signe.'
            ],
            pitfall: 'Faire 4 + 3 = 7 avant de multiplier par 6 !',
            example: '20 - 2 × 5 = 20 - 10 = 10.'
          }
        }
      ],
      histgeo: [
        {
          id: '5e-hg-1',
          chapter: 'Humanisme & Renaissance',
          title: 'L’invention de l’imprimerie',
          difficulty: 'Facile',
          prompt: 'Qui met au point l’imprimerie à caractères mobiles en Europe vers 1450 ?',
          type: 'choice',
          options: ['Johannes Gutenberg', 'Léonard de Vinci', 'Christophe Colomb'],
          answer: 'Johannes Gutenberg',
          hints: ['Il travaillait à Mayence, en Allemagne.'],
          explanation: 'Gutenberg met au point l’imprimerie vers 1450, ce qui accélère la diffusion des idées humanistes.',
          methodSheet: {
            id: 'ms-5e-hg-1',
            title: 'Relier une invention à ses conséquences historiques',
            essential: 'En histoire, chaque événement a des causes et des conséquences durables.',
            steps: [
              'Nomme l’invention et la date (imprimerie, vers 1450).',
              'Explique l’effet direct : les livres sont plus rapides à produire et moins chers.',
              'Explique l’effet culturel : diffusion de l’humanisme dans toute l’Europe.'
            ],
            pitfall: 'Citer un nom sans expliquer pourquoi l’événement transforme l’époque.',
            example: 'L’imprimerie permet de diffuser les textes d’Érasme en milliers d’exemplaires.'
          }
        }
      ],
      svt: [
        {
          id: '5e-svt-1',
          chapter: 'Nutrition et respiration',
          title: 'Rôle des poumons',
          difficulty: 'Facile',
          prompt: 'Quel gaz passe de l’air des alvéoles pulmonaires vers le sang lors de l’inspiration ?',
          type: 'choice',
          options: ['Le dioxygène (O₂)', 'Le dioxyde de carbone (CO₂)', 'Le méthane'],
          answer: 'Le dioxygène (O₂)',
          hints: ['Nos muscles ont besoin de ce gaz pour produire de l’énergie.'],
          explanation: 'Le dioxygène (O₂) passe de l’air dans le sang, tandis que le CO₂ (déchet) fait le chemin inverse.',
          methodSheet: {
            id: 'ms-5e-svt-1',
            title: 'Expliquer les échanges gazeux',
            essential: 'Les alvéoles pulmonaires offrent une immense surface très vascularisée.',
            steps: [
              'Air inspiré riche en O₂ → passage dans le sang.',
              'Sang riche en CO₂ → passage vers l’air expiré.'
            ],
            pitfall: 'Inverser le sens de circulation de l’O₂ et du CO₂.',
            example: 'Pendant un effort physique, la fréquence respiratoire augmente pour apporter plus d’O₂.'
          }
        }
      ],
      physique: [
        {
          id: '5e-pc-1',
          chapter: 'Électricité',
          title: 'Circuit en série ou en dérivation',
          difficulty: 'Moyen',
          prompt: 'Dans un circuit en série contenant 2 lampes, si l’une grille, que fait l’autre lampe ?',
          type: 'choice',
          options: ['Elle s’éteint aussi', 'Elle brille plus fort', 'Elle continue de briller normalement'],
          answer: 'Elle s’éteint aussi',
          hints: ['Dans un circuit en série, il n’y a qu’une seule boucle : si elle est ouverte, le courant ne circule plus.'],
          explanation: 'Une lampe grillée ouvre la boucle unique : le courant est interrompu partout et la seconde lampe s’éteint.',
          methodSheet: {
            id: 'ms-5e-pc-1',
            title: 'Comparer série et dérivation',
            essential: 'Série = 1 seule boucle (dépendants). Dérivation = plusieurs boucles (indépendants, comme à la maison).',
            steps: [
              'Compte le nombre de boucles passant par le générateur.',
              'En série : une panne coupe tout.',
              'En dérivation : chaque branche fonctionne indépendamment.'
            ],
            pitfall: 'Croire que les appareils d’une maison sont branchés en série.',
            example: 'Si une ampoule du salon grille, la télévision reste allumée (dérivation).'
          }
        }
      ],
      anglais: [
        {
          id: '5e-en-1',
          chapter: 'Prétérit simple',
          title: 'Verbes irréguliers au passé',
          difficulty: 'Moyen',
          prompt: 'Complète au prétérit : « Yesterday, we (go) ______ to London. »',
          type: 'input',
          answer: 'went',
          hints: ['« Go » est un verbe irrégulier très courant. Il commence par un « w ».'],
          explanation: 'Le prétérit de « go » est « went » : Yesterday, we went to London.',
          methodSheet: {
            id: 'ms-5e-en-1',
            title: 'Employer le prétérit simple',
            essential: 'On l’utilise pour une action passée datée et terminée (yesterday, last week, in 2020).',
            steps: [
              'Verbe régulier : base verbale + -ed (played, visited).',
              'Verbe irrégulier : 2e colonne du tableau (go → went, see → saw).',
              'Question / négation : auxiliaire DID + base verbale (Did you go? / I didn’t go).'
            ],
            pitfall: 'Écrire « Did you went? » (après did, le verbe reste à la base verbale !).',
            example: 'I saw a great film, but I didn’t buy popcorn.'
          }
        }
      ],
      techno: [
        {
          id: '5e-te-1',
          chapter: 'Algorithmique',
          title: 'Condition SI ... ALORS',
          difficulty: 'Facile',
          prompt: 'Un lampadaire automatique doit s’allumer uniquement quand la luminosité est inférieure à 30 %. Quelle instruction utilise-t-on ?',
          type: 'choice',
          options: ['Une instruction conditionnelle (Si ... Alors ... Sinon)', 'Une variable texte', 'Une impression'],
          answer: 'Une instruction conditionnelle (Si ... Alors ... Sinon)',
          hints: ['Le système prend une décision selon la valeur mesurée par le capteur.'],
          explanation: 'On teste la condition « Si luminosité < 30 Alors allumer lampe Sinon éteindre lampe ».',
          methodSheet: {
            id: 'ms-5e-te-1',
            title: 'Écrire un algorithme décisionnel',
            essential: 'Un capteur mesure une grandeur ; le programme compare à un seuil et commande l’actionneur.',
            steps: [
              'Identifie le capteur (capteur de lumière).',
              'Définis le seuil (< 30 %).',
              'Décris l’action dans le cas Vrai (Alors) et dans le cas Faux (Sinon).'
            ],
            pitfall: 'Oublier la branche « Sinon » : le lampadaire ne s’éteindrait jamais au lever du jour.',
            example: 'Si température < 19 °C Alors activer chauffage Sinon arrêter.'
          }
        }
      ]
    },

    '4e': {
      francais: [
        {
          id: '4e-fr-1',
          chapter: 'Figures de style',
          title: 'Métaphore ou comparaison ?',
          difficulty: 'Moyen',
          prompt: 'Quelle figure de style reconnaît-on dans : « Cette ville est une fourmilière » ?',
          type: 'choice',
          options: ['Une comparaison', 'Une métaphore', 'Une anaphore'],
          answer: 'Une métaphore',
          hints: ['Y a-t-il un outil de comparaison (comme, tel que, semblable à) ?'],
          explanation: 'C’est une métaphore : on rapproche deux réalités SANS outil de comparaison.',
          methodSheet: {
            id: 'ms-4e-fr-1',
            title: 'Identifier et commenter une figure de style',
            essential: 'Comparaison = présence d’un outil (comme, tel, ressembler à). Métaphore = rapprochement direct sans outil.',
            steps: [
              'Repère le comparé (la ville) et le comparant (une fourmilière).',
              'Vérifie s’il y a un outil de comparaison.',
              'Explique l’effet produit (suggérer une agitation incessante et dense).'
            ],
            pitfall: 'Se contenter de nommer la figure sans expliquer son sens dans le texte.',
            example: 'Comparaison : « Il court comme le vent » ; Métaphore : « C’est une flèche ».'
          }
        }
      ],
      maths: [
        {
          id: '4e-ma-1',
          chapter: 'Théorème de Pythagore',
          title: 'Calculer l’hypoténuse',
          difficulty: 'Moyen',
          prompt: 'Dans un triangle ABC rectangle en A, AB = 6 cm et AC = 8 cm. Combien mesure l’hypoténuse BC (en cm) ?',
          type: 'input',
          answer: '10',
          hints: [
            'Applique Pythagore : BC² = AB² + AC².',
            'BC² = 6² + 8² = 36 + 64 = 100. Quelle est la racine carrée de 100 ?'
          ],
          explanation: 'BC² = 6² + 8² = 36 + 64 = 100, donc BC = √100 = 10 cm.',
          methodSheet: {
            id: 'ms-4e-ma-1',
            title: 'Rédiger le théorème de Pythagore',
            essential: 'Dans un triangle rectangle, le carré de l’hypoténuse est égal à la somme des carrés des deux autres côtés.',
            steps: [
              'Précise l’hypothèse : « Le triangle ABC est rectangle en A, son hypoténuse est [BC]. »',
              'Cite le théorème : « D’après le théorème de Pythagore : BC² = AB² + AC². »',
              'Remplace par les valeurs, calcule la somme, puis prends la racine carrée (√).'
            ],
            pitfall: 'Oublier de prendre la racine carrée à la fin (répondre 100 cm au lieu de 10 cm !).',
            example: 'Triangle 3 cm / 4 cm → hypoténuse = √(9 + 16) = √25 = 5 cm.'
          }
        }
      ],
      histgeo: [
        {
          id: '4e-hg-1',
          chapter: 'Le XVIIIe siècle : les Lumières',
          title: 'L’Encyclopédie',
          difficulty: 'Moyen',
          prompt: 'Quels deux philosophes dirigent la publication de l’Encyclopédie au XVIIIe siècle ?',
          type: 'choice',
          options: ['Diderot et d’Alembert', 'Rousseau et Hugo', 'Zola et Pasteur'],
          answer: 'Diderot et d’Alembert',
          hints: ['L’un est écrivain et philosophe, l’autre est mathématicien.'],
          explanation: 'Denis Diderot et Jean le Rond d’Alembert dirigent l’Encyclopédie (1751–1772) pour diffuser tous les savoirs.',
          methodSheet: {
            id: 'ms-4e-hg-1',
            title: 'Résumer les idées des Lumières',
            essential: 'Les Lumières défendent la raison, les sciences, la tolérance et la séparation des pouvoirs.',
            steps: [
              'Associe chaque penseur à son idée clé : Montesquieu (séparation des pouvoirs), Voltaire (tolérance), Rousseau (souveraineté du peuple), Diderot (Encyclopédie).'
            ],
            pitfall: 'Oublier que la censure royale surveillait et interdisait parfois ces ouvrages.',
            example: 'L’Encyclopédie comprend 17 volumes de textes et 11 volumes de planches illustrées.'
          }
        }
      ],
      svt: [
        {
          id: '4e-svt-1',
          chapter: 'Tectonique des plaques',
          title: 'Origine des séismes',
          difficulty: 'Moyen',
          prompt: 'Comment appelle-t-on le point en profondeur où se produit la rupture des roches lors d’un séisme ?',
          type: 'choice',
          options: ['Le foyer (hypocentre)', 'L’épicentre', 'Le cratère'],
          answer: 'Le foyer (hypocentre)',
          hints: ['L’épicentre est situé à la surface, juste à la verticale du point de rupture.'],
          explanation: 'La rupture a lieu en profondeur au foyer ; l’épicentre est le point à la surface situé juste au-dessus.',
          methodSheet: {
            id: 'ms-4e-svt-1',
            title: 'Distinguer foyer et épicentre',
            essential: 'Foyer = en profondeur (origine des ondes). Épicentre = en surface (dégâts maximaux).',
            steps: [
              'Visualise une coupe verticale de la Terre.',
              'Les ondes sismiques partent du foyer dans toutes les directions.',
              'Le sismographe enregistre ces ondes.'
            ],
            pitfall: 'Confondre l’épicentre (surface) avec le foyer (profondeur).',
            example: 'Plus le foyer est peu profond, plus les secousses ressenties à l’épicentre sont fortes.'
          }
        }
      ],
      physique: [
        {
          id: '4e-pc-1',
          chapter: 'Loi d’Ohm & tensions',
          title: 'Calculer une résistance ou une tension',
          difficulty: 'Moyen',
          prompt: 'Une résistance de 50 Ω est parcourue par un courant de 0,2 A. Quelle est la tension U à ses bornes (en V) ?',
          type: 'input',
          answer: '10',
          hints: [
            'Applique la loi d’Ohm : U = R × I.',
            'U = 50 × 0,2 = ?'
          ],
          explanation: 'U = R × I = 50 × 0,2 = 10 V.',
          methodSheet: {
            id: 'ms-4e-pc-1',
            title: 'Appliquer la loi d’Ohm (U = R × I)',
            essential: 'U en volts (V), R en ohms (Ω), I en ampères (A).',
            steps: [
              'Convertis les grandeurs dans les unités légales (ex. mA → A en divisant par 1000).',
              'Écris la formule littérale (U = R × I, ou I = U / R, ou R = U / I).',
              'Effectue le calcul et indique l’unité finale.'
            ],
            pitfall: 'Utiliser des milliampères (mA) sans les convertir en ampères (A).',
            example: 'R = 100 Ω, I = 50 mA = 0,05 A → U = 100 × 0,05 = 5 V.'
          }
        }
      ],
      anglais: [
        {
          id: '4e-en-1',
          chapter: 'Comparatif de supériorité',
          title: 'Adjectifs courts vs longs',
          difficulty: 'Moyen',
          prompt: 'Complète : « This exercise is ______ (easy) than the previous one. »',
          type: 'input',
          answer: 'easier',
          hints: [
            '« Easy » est un adjectif court qui se termine par -y.',
            'Le -y se transforme en -ier.'
          ],
          explanation: 'Les adjectifs courts en -y forment leur comparatif en -ier : easy → easier than.',
          methodSheet: {
            id: 'ms-4e-en-1',
            title: 'Former le comparatif de supériorité',
            essential: 'Adjectif court → adj + -er + than. Adjectif long (2+ syllabes hors -y) → more + adj + than.',
            steps: [
              'Compte les syllabes de l’adjectif.',
              'Court : tall → taller ; big → bigger ; easy → easier.',
              'Long : interesting → more interesting than.'
            ],
            pitfall: 'Écrire « more easier » (ne jamais cumuler more et -er !).',
            example: 'Maths is faster to revise with flashcards, and history is more detailed.'
          }
        }
      ],
      techno: [
        {
          id: '4e-te-1',
          chapter: 'Réseaux informatiques',
          title: 'Rôle d’une adresse IP',
          difficulty: 'Facile',
          prompt: 'À quoi sert une adresse IP sur un réseau informatique ?',
          type: 'choice',
          options: [
            'Identifier de façon unique un appareil sur le réseau pour acheminer les données',
            'Augmenter la luminosité de l’écran',
            'Compresser les images'
          ],
          answer: 'Identifier de façon unique un appareil sur le réseau pour acheminer les données',
          hints: ['C’est l’équivalent de l’adresse postale d’un ordinateur ou d’un serveur.'],
          explanation: 'L’adresse IP identifie chaque équipement afin que les paquets de données arrivent au bon destinataire.',
          methodSheet: {
            id: 'ms-4e-te-1',
            title: 'Comprendre le routage sur Internet',
            essential: 'IP = adresse de l’appareil ; DNS = annuaire qui traduit un nom de domaine en adresse IP.',
            steps: [
              'Le navigateur demande au DNS l’IP du site.',
              'Les données sont découpées en paquets.',
              'Les routeurs acheminent chaque paquet jusqu’à l’adresse IP cible.'
            ],
            pitfall: 'Confondre adresse IP (réseau) et adresse URL (page web).',
            example: '192.168.1.10 est une adresse IP locale de réseau domestique.'
          }
        }
      ]
    },

    '3e': {
      francais: [
        {
          id: '3e-fr-1',
          chapter: 'Brevet : propositions subordonnées',
          title: 'Identifier une subordonnée relative',
          difficulty: 'Difficile',
          prompt: 'Dans « Le roman que j’ai terminé hier m’a passionné », quelle est la nature de « que j’ai terminé hier » ?',
          type: 'choice',
          options: [
            'Proposition subordonnée relative',
            'Proposition subordonnée conjonctive complétive',
            'Proposition indépendante'
          ],
          answer: 'Proposition subordonnée relative',
          hints: [
            'Regarde le mot qui précède « que » : c’est un nom (« Le roman »), appelé antécédent.',
            'Une subordonnée qui complète un nom est une subordonnée relative.'
          ],
          explanation: '« que j’ai terminé hier » complète l’antécédent nominal « roman » : c’est une proposition subordonnée relative.',
          methodSheet: {
            id: 'ms-3e-fr-1',
            title: 'Distinguer subordonnée relative et complétive (Brevet)',
            essential: 'Regarde toujours le mot juste avant « que » !',
            steps: [
              'Si « que » suit un NOM (antécédent) → proposition subordonnée relative (fonction : complément de l’antécédent).',
              'Si « que » suit un VERBE (« Je pense que... ») → proposition subordonnée conjonctive complétive (fonction : COD du verbe).'
            ],
            pitfall: 'Croire que « que » introduit toujours le même type de subordonnée.',
            example: 'Relative : « Le livre que tu lis » / Complétive : « Je sais que tu lis ».'
          }
        }
      ],
      maths: [
        {
          id: '3e-ma-1',
          chapter: 'Brevet : fonctions linéaires et affines',
          title: 'Calculer une image par une fonction affine',
          difficulty: 'Moyen',
          prompt: 'Soit f(x) = 3x - 5. Quelle est l’image de 4 par la fonction f ?',
          type: 'input',
          answer: '7',
          hints: [
            'Pour calculer l’image de 4, remplace x par 4 dans l’expression 3x - 5.',
            'f(4) = 3 × 4 - 5 = 12 - 5.'
          ],
          explanation: 'f(4) = 3 × 4 - 5 = 12 - 5 = 7. L’image de 4 par f est 7.',
          methodSheet: {
            id: 'ms-3e-ma-1',
            title: 'Image vs Antécédent (Brevet)',
            essential: 'Calculer une IMAGE = remplacer x et calculer. Chercher un ANTÉCÉDENT = résoudre une équation f(x) = y.',
            steps: [
              'Image de a : calcule f(a) en remplaçant x par a.',
              'Antécédent de b : résous l’équation 3x - 5 = b pour isoler x.',
              'Vérifie ton antécédent en le remplaçant dans f(x).'
            ],
            pitfall: 'Confondre les deux questions au Brevet : retiens « Image = calcul direct, Antécédent = équation ».',
            example: 'Antécédent de 7 par f(x)=3x-5 : 3x-5=7 → 3x=12 → x=4.'
          }
        }
      ],
      histgeo: [
        {
          id: '3e-hg-1',
          chapter: 'Brevet : Seconde Guerre mondiale',
          title: 'L’Appel du 18 juin 1940',
          difficulty: 'Facile',
          prompt: 'Depuis quelle ville le général de Gaulle lance-t-il l’appel à la Résistance le 18 juin 1940 ?',
          type: 'choice',
          options: ['Londres (à la BBC)', 'Vichy', 'Alger'],
          answer: 'Londres (à la BBC)',
          hints: ['Il refuse l’armistice signé par Pétain et rejoint le Royaume-Uni.'],
          explanation: 'Le 18 juin 1940, Charles de Gaulle appelle les Français à poursuivre le combat depuis les studios de la BBC à Londres.',
          methodSheet: {
            id: 'ms-3e-hg-1',
            title: 'Structurer un développement construit (Brevet)',
            essential: 'Introduction (définition + problématique) → 2 ou 3 paragraphes argumentés avec dates/exemples → Conclusion.',
            steps: [
              'Rédige une phrase d’accroche situant le sujet dans le temps et l’espace.',
              'Une idée par paragraphe, illustrée par un exemple précis et daté.',
              'Relis pour vérifier l’orthographe des noms propres (de Gaulle, Jean Moulin, CNR).'
            ],
            pitfall: 'Faire une liste à puces : le développement construit doit être entièrement rédigé.',
            example: '1943 : Jean Moulin unifie les mouvements au sein du Conseil National de la Résistance (CNR).'
          }
        }
      ],
      svt: [
        {
          id: '3e-svt-1',
          chapter: 'Génétique',
          title: 'Chromosomes chez l’être humain',
          difficulty: 'Facile',
          prompt: 'Combien de paires de chromosomes possède une cellule humaine normale (hors cellules reproductrices) ?',
          type: 'input',
          answer: '23',
          hints: ['Il y a 46 chromosomes en tout, regroupés par deux.'],
          explanation: 'Chaque cellule humaine (hors gamètes) contient 23 paires de chromosomes, soit 46 chromosomes au total.',
          methodSheet: {
            id: 'ms-3e-svt-1',
            title: 'Analyser un caryotype',
            essential: '22 paires d’autosomes + 1 paire de chromosomes sexuels (XX chez la femme, XY chez l’homme).',
            steps: [
              'Compte le nombre total de chromosomes (46 normal).',
              'Observe la 23e paire pour déterminer le sexe biologique (XX ou XY).',
              'Vérifie s’il existe un chromosome supplémentaire (ex. trisomie 21).'
            ],
            pitfall: 'Confondre le nombre de paires (23) et le nombre total de chromosomes (46).',
            example: 'Un gamète (ovule ou spermatozoïde) ne contient que 23 chromosomes simples.'
          }
        }
      ],
      physique: [
        {
          id: '3e-pc-1',
          chapter: 'Brevet : Poids et masse',
          title: 'Calculer le poids d’un objet sur Terre',
          difficulty: 'Moyen',
          prompt: 'Un cartable a une masse m = 4 kg. Sur Terre (g = 9,8 N/kg), quel est son poids P (en N) ?',
          type: 'input',
          answer: '39,2',
          hints: [
            'Formule : P = m × g.',
            'Calcule 4 × 9,8 (soit 4 × 10 - 4 × 0,2 = 40 - 0,8).'
          ],
          explanation: 'P = m × g = 4 × 9,8 = 39,2 N (Newtons).',
          methodSheet: {
            id: 'ms-3e-pc-1',
            title: 'Distinguer Masse (kg) et Poids (N)',
            essential: 'La masse (en kg) ne change jamais ; le poids (force en Newtons) dépend de l’astre (g).',
            steps: [
              'Vérifie que m est bien en kilogrammes (kg).',
              'Écris P = m × g.',
              'Calcule et exprime le résultat en Newtons (N).'
            ],
            pitfall: 'Dire dans un devoir de physique « je pèse 50 kg » (en sciences, la masse vaut 50 kg et le poids vaut ~490 N).',
            example: 'Sur la Lune (g ≈ 1,6 N/kg), la masse reste 4 kg mais le poids vaut 6,4 N.'
          }
        }
      ],
      anglais: [
        {
          id: '3e-en-1',
          chapter: 'Present Perfect',
          title: 'Bilan d’une expérience',
          difficulty: 'Moyen',
          prompt: 'Complète au Present Perfect : « She ______ (never / visit) Scotland. »',
          type: 'input',
          answer: 'has never visited',
          hints: [
            'Present Perfect = have/has + participe passé.',
            'L’adverbe « never » se place entre l’auxiliaire « has » et le participe passé « visited ».'
          ],
          explanation: 'She has never visited Scotland.',
          methodSheet: {
            id: 'ms-3e-en-1',
            title: 'Present Perfect vs Prétérit',
            essential: 'Present Perfect = lien avec le présent (bilan, expérience de vie, since/for). Prétérit = événement daté et coupé du présent.',
            steps: [
              'Repère un marqueur daté (in 2019, last year) → Prétérit.',
              'Repère un bilan (ever, never, already, yet, since, for) → Present Perfect (have/has + V-ed ou 3e colonne).'
            ],
            pitfall: 'Utiliser le Present Perfect avec « yesterday » ou une date précise du passé.',
            example: 'I have lived here for 5 years. / I moved here in 2021.'
          }
        }
      ],
      techno: [
        {
          id: '3e-te-1',
          chapter: 'Chaîne d’énergie et d’information',
          title: 'Les blocs de la chaîne d’énergie',
          difficulty: 'Moyen',
          prompt: 'Dans quel ordre fonctionnent les 4 blocs d’une chaîne d’énergie ?',
          type: 'choice',
          options: [
            'Alimenter → Distribuer → Convertir → Transmettre',
            'Convertir → Alimenter → Transmettre → Distribuer',
            'Acquérir → Traiter → Communiquer → Stocker'
          ],
          answer: 'Alimenter → Distribuer → Convertir → Transmettre',
          hints: ['On part de la source d’énergie (batterie/prise) jusqu’au mouvement final (roues/engrenages).'],
          explanation: 'Chaîne d’énergie : Alimenter, Distribuer, Convertir, Transmettre (Acquérir/Traiter/Communiquer est la chaîne d’information).',
          methodSheet: {
            id: 'ms-3e-te-1',
            title: 'Compléter une chaîne fonctionnelle au Brevet',
            essential: 'Chaîne d’information (en haut) : Acquérir → Traiter → Communiquer. Chaîne d’énergie (en bas) : Alimenter → Distribuer → Convertir → Transmettre.',
            steps: [
              'Identifie la source (batterie = Alimenter).',
              'Identifie le composant qui laisse passer ou coupe (relais/variateur = Distribuer).',
              'Identifie l’actionneur (moteur = Convertir) puis le mécanisme (engrenage = Transmettre).'
            ],
            pitfall: 'Inverser la chaîne d’information et la chaîne d’énergie.',
            example: 'Volet roulant : Réseau 230 V → Interrupteur → Moteur électrique → Axe d’enroulement.'
          }
        }
      ]
    }
  };

  /**
   * Validation Quizzes per level & subject (3-4 crisp questions each for mastery validation)
   */
  function buildDefaultQuizFor(levelId, subjectId) {
    const levelPack = CONTENT_BANK[levelId] || CONTENT_BANK.CM2;
    const exercises = levelPack[subjectId] || [];
    const subj = SUBJECT_DEFS[subjectId] || SUBJECT_DEFS.maths;

    // Build authentic multi-question validation quizzes grounded in the level's chapters
    const extraQuestions = getQuizQuestionBank(levelId, subjectId);
    const questions = extraQuestions.length > 0 ? extraQuestions : exercises.map(function (ex) {
      return {
        prompt: ex.prompt,
        options: ex.options || [ex.answer, 'Autre réponse A', 'Autre réponse B'],
        answer: ex.answer,
        explanation: ex.explanation
      };
    });

    return {
      id: 'quiz-' + levelId + '-' + subjectId,
      levelId: levelId,
      subjectId: subjectId,
      title: 'Quiz de validation — ' + subj.name + ' (' + levelId + ')',
      chapter: exercises[0] ? exercises[0].chapter : 'Programme ' + levelId,
      source: 'programme',
      questions: questions
    };
  }

  function getQuizQuestionBank(levelId, subjectId) {
    const banks = {
      'CM2:francais': [
        {
          prompt: 'Complète : « Ils ______ terminé leurs exercices avant le dîner. »',
          options: ['on', 'ont', 'sont'],
          answer: 'ont',
          explanation: 'On peut remplacer par « avaient » : c’est l’auxiliaire avoir (ont).'
        },
        {
          prompt: 'Dans « Le vent soulève les feuilles sèches », quel est le COD ?',
          options: ['Le vent', 'les feuilles sèches', 'soulève'],
          answer: 'les feuilles sèches',
          explanation: 'Le vent soulève QUOI ? Les feuilles sèches (COD).'
        },
        {
          prompt: 'Choisis la bonne orthographe : « Elle pense ______ ses vacances. »',
          options: ['a', 'à', 'as'],
          answer: 'à',
          explanation: 'On ne peut pas dire « Elle pense avait ses vacances » → préposition « à ».'
        },
        {
          prompt: 'Quelle phrase contient un adjectif correctement accordé ?',
          options: ['Des histoires passionnant', 'Des histoires passionnantes', 'Des histoires passionnants'],
          answer: 'Des histoires passionnantes',
          explanation: '« histoires » est féminin pluriel → « passionnantes ».'
        }
      ],
      'CM2:maths': [
        {
          prompt: 'Combien vaut 12,4 + 5,35 ?',
          options: ['17,75', '17,39', '65,9'],
          answer: '17,75',
          explanation: '12,40 + 5,35 = 17,75 (virgules alignées).'
        },
        {
          prompt: '3 stylos identiques coûtent 6 €. Combien coûtent 5 stylos ?',
          options: ['8 €', '10 €', '12 €'],
          answer: '10 €',
          explanation: '1 stylo coûte 2 €, donc 5 stylos coûtent 5 × 2 = 10 €.'
        },
        {
          prompt: 'Quelle fraction est égale à 1/2 ?',
          options: ['3/6', '2/5', '4/6'],
          answer: '3/6',
          explanation: '3 est la moitié de 6, donc 3/6 = 1/2.'
        },
        {
          prompt: 'Combien vaut 4,8 × 10 ?',
          options: ['4,80', '48', '480'],
          answer: '48',
          explanation: 'Multiplier par 10 décale chaque chiffre d’un rang vers la gauche : 48.'
        }
      ],
      'CM2:sciences': [
        {
          prompt: 'Laquelle de ces sources d’énergie est fossile (non renouvelable) ?',
          options: ['Le soleil', 'Le pétrole', 'Le vent'],
          answer: 'Le pétrole',
          explanation: 'Le pétrole a mis des millions d’années à se former et ses réserves sont limitées.'
        },
        {
          prompt: 'Une éolienne transforme l’énergie du vent en :',
          options: ['Énergie électrique', 'Énergie nucléaire', 'Pétrole'],
          answer: 'Énergie électrique',
          explanation: 'Les pales entraînent un alternateur qui produit de l’électricité.'
        },
        {
          prompt: 'Quel geste permet d’économiser l’énergie à la maison ?',
          options: ['Laisser les appareils en veille', 'Éteindre la lumière en quittant une pièce', 'Ouvrir les fenêtres avec le chauffage au maximum'],
          answer: 'Éteindre la lumière en quittant une pièce',
          explanation: 'Éteindre les lumières inutiles réduit la consommation électrique.'
        }
      ],
      'CM2:histgeo': [
        {
          prompt: 'Quel événement a lieu le 14 juillet 1789 ?',
          options: ['La prise de la Bastille', 'Le sacre de Napoléon', 'La fin de la guerre 14-18'],
          answer: 'La prise de la Bastille',
          explanation: 'Les Parisiens prennent la forteresse de la Bastille le 14 juillet 1789.'
        },
        {
          prompt: 'Que proclame la Déclaration du 26 août 1789 ?',
          options: ['Le retour des privilèges', 'La liberté et l’égalité en droits', 'La création de l’euro'],
          answer: 'La liberté et l’égalité en droits',
          explanation: 'Article 1er : « Les hommes naissent et demeurent libres et égaux en droits. »'
        },
        {
          prompt: 'Quelle est la capitale de l’Union européenne où siège la Commission ?',
          options: ['Bruxelles', 'Madrid', 'Rome'],
          answer: 'Bruxelles',
          explanation: 'La Commission européenne siège à Bruxelles (Belgique).'
        }
      ],
      'CM2:anglais': [
        {
          prompt: 'Choisis la phrase juste : « Tom aime le football. »',
          options: ['Tom like football.', 'Tom likes football.', 'Tom is like football.'],
          answer: 'Tom likes football.',
          explanation: 'À la 3e personne du singulier, le verbe prend un -s : likes.'
        },
        {
          prompt: 'Comment demande-t-on « Quelle heure est-il ? »',
          options: ['What time is it?', 'How old are you?', 'Where is the clock?'],
          answer: 'What time is it?',
          explanation: '« What time is it? » sert à demander l’heure.'
        },
        {
          prompt: 'Que signifie « My favourite subject is maths » ?',
          options: ['Je n’aime pas les maths', 'Ma matière préférée est les maths', 'J’ai un livre de maths'],
          answer: 'Ma matière préférée est les maths',
          explanation: '« subject » = matière scolaire, « favourite » = préférée.'
        }
      ]
    };

    const key = levelId + ':' + subjectId;
    if (banks[key]) return banks[key];

    // Generate rich 3-question quiz for any other level/subject using its exercise + conceptual checks
    const levelPack = CONTENT_BANK[levelId];
    const exList = (levelPack && levelPack[subjectId]) || [];
    const qs = [];
    exList.forEach(function (ex) {
      let opts = ex.options;
      if (!opts) {
        const num = parseFloat(String(ex.answer).replace(',', '.'));
        if (!isNaN(num)) {
          opts = [
            String(ex.answer),
            String(Math.round((num + 2) * 10) / 10).replace('.', ','),
            String(Math.max(1, Math.round((num - 1) * 10) / 10)).replace('.', ',')
          ];
        } else {
          opts = [ex.answer, ex.answer + 's', 'Aucune de ces réponses'];
        }
      }
      qs.push({
        prompt: ex.prompt,
        options: opts,
        answer: ex.answer,
        explanation: ex.explanation
      });
      if (ex.methodSheet) {
        qs.push({
          prompt: 'Méthode (« ' + ex.methodSheet.title + ' ») : quelle règle est vraie ?',
          options: [
            ex.methodSheet.essential,
            'Il faut deviner la réponse sans relire l’énoncé.',
            'L’ordre des étapes n’a jamais d’importance.'
          ],
          answer: ex.methodSheet.essential,
          explanation: 'À retenir : ' + ex.methodSheet.essential
        });
        qs.push({
          prompt: 'Point de vigilance en ' + (SUBJECT_DEFS[subjectId] ? SUBJECT_DEFS[subjectId].name : subjectId) + ' : quel piège faut-il éviter ?',
          options: [
            ex.methodSheet.pitfall,
            'Vérifier son travail avant de valider.',
            'Utiliser un exemple du cours pour se repérer.'
          ],
          answer: ex.methodSheet.pitfall,
          explanation: 'Piège classique à éviter : ' + ex.methodSheet.pitfall
        });
      }
    });
    return qs;
  }

  function getSubjectsForLevel(levelId) {
    const ids = LEVEL_SUBJECTS[levelId] || LEVEL_SUBJECTS.CM2;
    return ids.map(function (id) { return SUBJECT_DEFS[id]; }).filter(Boolean);
  }

  function getSubjectDef(subjectId) {
    return SUBJECT_DEFS[subjectId] || {
      id: subjectId,
      name: subjectId,
      short: subjectId,
      icon: 'bookOpen',
      colorVar: '--color-primary',
      softVar: '--color-primary-soft',
      hex: '#0F766E'
    };
  }

  function getBuiltInExercises(levelId, subjectId) {
    const pack = CONTENT_BANK[levelId] || CONTENT_BANK.CM2;
    if (subjectId) {
      return (pack[subjectId] || []).map(function (ex) {
        return Object.assign({ levelId: levelId, subjectId: subjectId, source: 'programme' }, ex);
      });
    }
    const all = [];
    getSubjectsForLevel(levelId).forEach(function (subj) {
      (pack[subj.id] || []).forEach(function (ex) {
        all.push(Object.assign({ levelId: levelId, subjectId: subj.id, source: 'programme' }, ex));
      });
    });
    return all;
  }

  function getBuiltInMethodSheets(levelId, subjectId) {
    return getBuiltInExercises(levelId, subjectId)
      .filter(function (ex) { return Boolean(ex.methodSheet); })
      .map(function (ex) {
        return Object.assign(
          {
            levelId: ex.levelId,
            subjectId: ex.subjectId,
            chapter: ex.chapter,
            source: 'programme'
          },
          ex.methodSheet
        );
      });
  }

  function getBuiltInQuizzes(levelId, subjectId) {
    if (subjectId) {
      return [buildDefaultQuizFor(levelId, subjectId)];
    }
    return getSubjectsForLevel(levelId).map(function (subj) {
      return buildDefaultQuizFor(levelId, subj.id);
    });
  }

  global.CapCurriculum = {
    SUBJECT_DEFS: SUBJECT_DEFS,
    LEVEL_SUBJECTS: LEVEL_SUBJECTS,
    getSubjectsForLevel: getSubjectsForLevel,
    getSubjectDef: getSubjectDef,
    getBuiltInExercises: getBuiltInExercises,
    getBuiltInMethodSheets: getBuiltInMethodSheets,
    getBuiltInQuizzes: getBuiltInQuizzes
  };
})(window);
