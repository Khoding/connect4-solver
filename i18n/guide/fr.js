/*
 * Copyright (C) 2026 Khodok
 *
 * This file is part of Connect4 Game Solver.
 *
 * Connect4 Game Solver is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * Connect4 Game Solver is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with Connect4 Game Solver. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * L'essai /guide, en français. Structure identique à guide-en.js : traduire le
 * guide, c'est traduire de la prose, jamais du balisage.
 *
 * Terminologie : la thèse d'Allis (1988) n'a jamais été traduite. Le vocabulaire
 * général a des équivalents français établis et on les emploie (menace impaire,
 * menace paire, zugzwang, colonne empoisonnée, demi-coup). Les huit règles de
 * VICTOR sont des néologismes propres à la thèse : on garde le nom anglais comme
 * identifiant, pour que le lecteur puisse le retrouver dans la littérature, et on
 * donne une traduction française entre parenthèses à la première occurrence.
 */

export default {
  seo: {
    title: 'Comment gagner au Puissance 4 — le guide complet',
    description:
      'Des règles de base au jeu résolu : cases paires et impaires, menaces, règles d’appariement d’Allis, et comment forcer la victoire. Chaque diagramme est une vraie position dont le plan est validé par le solveur.',
  },

  kicker: 'Le guide complet',
  title: 'Comment gagner au Puissance&nbsp;4, du premier coup au jeu résolu',
  sub: 'Le Puissance&nbsp;4 est résolu. Si les deux joueurs jouent parfaitement, le premier joueur gagne. Cette page te mène des règles nues à la lecture d’un plateau comme le fait le moteur, et chaque diagramme ci-dessous est une vraie position dont le plan sort de la même machine à preuves que l’application.',
  tocLabel: 'Sommaire',

  toc: [
    {id: 'solved', label: '1 · Le jeu est résolu'},
    {id: 'understood', label: '2 · Un score n’explique rien'},
    {id: 'parity', label: '3 · Rangées paires et impaires'},
    {id: 'threats', label: '4 · Les menaces'},
    {id: 'develop', label: '5 · Comment développer'},
    {id: 'learn', label: '6 · Lire le mode apprentissage'},
    {id: 'rules', label: '7 · Revendiquer des cases'},
    {id: 'proof', label: '8 · La preuve par appariement'},
    {id: 'winning', label: '9 · Forcer la victoire'},
    {id: 'gm', label: '10 · Jouer comme un champion'},
  ],

  sections: [
    {
      id: 'solved',
      h2: '1 · Le jeu est déjà résolu',
      blocks: [
        {h3: 'Les règles, en un paragraphe'},
        {
          p: 'Le Puissance&nbsp;4 se joue sur un <strong>plateau de 7 colonnes sur 6 rangées</strong>, soit 42 emplacements. Chacun son tour, on lâche un jeton dans une colonne et il tombe sur l’emplacement libre le plus bas. Aligne quatre de tes jetons à l’horizontale, à la verticale ou en diagonale et tu gagnes. Si les 42 emplacements se remplissent sans alignement, la partie est nulle.',
        },
        {p: 'Deux mots reviennent dans tout ce qui s’écrit sur ce jeu :'},
        {
          ul: [
            '<strong>Case</strong> est le mot de la théorie des jeux pour un emplacement. Sur un plateau réel les trous sont ronds, mais la littérature parle de cases, et cette page fait de même.',
            '<strong>Demi-coup</strong> (ou <em>ply</em>) désigne un seul jeton lâché, un seul tour d’un seul joueur. Une partie dure au plus 42 demi-coups. En jeu parfait, le premier joueur aligne quatre jetons au demi-coup&nbsp;41 et laisse un unique emplacement vide.',
          ],
        },
        {
          p: 'Un plateau 7×6 contient exactement <strong>69 alignements de quatre</strong> : 24 horizontaux, 21 verticaux et 24 diagonaux. Toutes les idées de cette page se ramènent à une bataille pour savoir lesquels de ces 69 alignements chaque joueur peut encore compléter.',
        },
        {h3: 'Et cette bataille a une réponse connue'},
        {
          p: 'En 1988, Victor Allis a démontré, et James Allen l’a confirmé avec un programme indépendant, que sur le plateau standard le <strong>premier joueur peut forcer la victoire</strong> en ouvrant dans la colonne centrale. Les 4,5&nbsp;billions de positions atteignables ont toutes une valeur exacte.',
        },
        {
          p: 'Pascal&nbsp;Pons a écrit la version moderne de ce résultat, et c’est elle qui tourne sur ce site. Donne-lui n’importe quelle position et elle répond aussitôt : gain, perte ou nulle, et en combien de coups. Le nombre affiché au-dessus de chaque colonne, c’est cette réponse, pas une estimation.',
        },
        {
          details: {
            summary: 'La version rigoureuse : comment fonctionne le solveur de Pons',
            body: [
              'Le moteur parcourt l’arbre de jeu en <strong>negamax avec élagage alpha–bêta</strong>. Il déroule des variantes et, dès qu’il trouve une réponse assez bonne pour réfuter un coup, il abandonne toute la branche. Il stocke le plateau en <strong>bitboard</strong>, deux entiers de 64 bits, un par joueur, si bien que tester un alignement de quatre ou générer les coups ne demande qu’une poignée d’opérations binaires. Une <strong>table de transposition</strong> met en cache les positions déjà évaluées, et une <strong>bibliothèque d’ouvertures</strong> contient la valeur de toute position jusqu’à une profondeur fixée : les premiers coups ne demandent donc aucune recherche.',
              'Le score encode la <em>distance à la fin</em>. Une position à +N signifie que le vainqueur aligne quatre jetons avec N cases vides d’avance : plus le nombre est grand, plus la victoire est rapide. Essayer les colonnes centrales d’abord permet à l’alpha–bêta de couper d’immenses portions de l’arbre, et c’est pourquoi ton navigateur résout en quelques millisecondes un jeu qui compte mille milliards de positions.',
            ],
          },
        },
      ],
    },

    {
      id: 'understood',
      h2: '2 · Un score dit qui gagne, jamais pourquoi',
      blocks: [
        {
          p: 'Un score de +11 t’apprend que la position est gagnée. Il ne dit rien des cases qui portent cette victoire, et il ne t’aidera pas à la trouver sur un vrai plateau un dimanche après-midi. Pour ça, il te faut un plan assez petit pour tenir dans ta tête.',
        },
        {
          p: 'Le programme <strong>VICTOR</strong> d’Allis en construit un. Au lieu de chercher, il raisonne sur les cases que chaque joueur est certain d’obtenir quoi que fasse l’adversaire, puis assemble ces garanties en un <strong>appariement</strong> : un plan fixe qui répond à chaque alignement que l’adversaire pourrait encore réaliser. Le reste de cette page construit cette théorie idée par idée, et le bouton « Révéler le plan » sous chaque plateau montre l’appariement calculé par VICTOR pour cette position précise, vérifié contre le solveur parfait.',
        },
      ],
    },

    {
      id: 'parity',
      h2: '3 · Le secret du plateau : rangées paires et impaires',
      blocks: [
        {
          p: 'Numérote les rangées de 1 à 6 en partant du bas. Le premier joueur a tendance à se poser sur les rangées impaires (1, 3, 5) et le second sur les rangées paires (2, 4, 6). Cette seule phrase gouverne l’essentiel de la stratégie au Puissance&nbsp;4, et tu peux t’en convaincre de trois façons différentes.',
        },
        {h3: 'Première façon : remplis une colonne et regarde'},
        {
          p: 'Prends une colonne vide et fais alterner les deux joueurs dedans. Le premier prend la rangée 1, le second la rangée 2, le premier la rangée 3, et ainsi de suite jusqu’en haut. Rien n’oblige les deux joueurs à se répondre toujours dans la même colonne, donc le motif se déforme en milieu de partie. Le compte reprend ses droits dès que le plateau se resserre et que les coups d’attente s’épuisent.',
        },
        {h3: 'Deuxième façon : compte qui manque de coups d’attente'},
        {
          p: 'En fin de partie, la plupart des colonnes sont empoisonnées : y jouer offre à l’adversaire une case qu’il convoite. Les deux joueurs se rabattent sur ce qui reste, en attendant que l’autre craque. Aux échecs on appelle ça le <em>zugzwang</em> : être forcé de jouer alors que tout coup nuit. Compter les cases vides des colonnes encore vivantes t’indique qui craquera le premier, et celui qui craque pose un jeton juste sous la case gagnante de son adversaire.',
        },
        {h3: 'Troisième façon : les cases paires comme territoire du second joueur'},
        {
          p: 'Le second joueur peut répondre à n’importe quel jeton en se posant juste au-dessus, dans la même colonne. Cette réponse est toujours disponible, et elle atterrit sur une rangée paire chaque fois que le jeton adverse s’est posé sur une impaire. Répète l’opération et le second joueur récolte des cases paires gratuitement, ce qui tue tous les alignements qui les traversent. Révèle le plan sur la position nulle ci-dessous : le second joueur revendique onze cases paires et n’a besoin de rien d’autre.',
        },
        {
          diagram: {
            example: 'draw-claimeven',
            caption:
              'Le second joueur tient la nulle en possédant les cases paires, et rien d’autre.',
          },
        },
      ],
    },

    {
      id: 'threats',
      h2: '4 · Les menaces : les cases qui gagnent',
      blocks: [
        {
          p: 'Une <strong>menace</strong> est une case vide qui compléterait un alignement de quatre pour toi. La parité sépare les menaces en deux familles, et elles ne pèsent pas le même poids :',
        },
        {
          ul: [
            'Les <strong>menaces impaires</strong> se trouvent sur une rangée impaire et appartiennent au répertoire du premier joueur. La colonne qui en porte une conserve un nombre impair de cases vides en dessous : le décompte de fin de partie remet donc cette case au premier joueur.',
            'Les <strong>menaces paires</strong> se trouvent sur une rangée paire et appartiennent au second joueur, qui bâtit de toute façon toute sa défense sur les cases paires.',
          ],
        },
        {h3: 'Pourquoi une menace impaire bat une menace paire'},
        {
          p: 'Imagine une menace du premier joueur sur la rangée 3 de la colonne&nbsp;b, le reste du plateau étant verrouillé. Aucun des deux ne veut toucher à la colonne&nbsp;b : celui qui joue b2 laisse l’autre prendre b3. Les deux camps brûlent donc leurs coups d’attente ailleurs, et ces coups s’épuisent au tour du second joueur. Il joue b2, le premier joueur prend b3 et gagne. Inverse la parité et le même décompte joue dans l’autre sens.',
        },
        {
          p: 'Deux menaces impaires s’annulent, deux menaces paires aussi. Une menace paire du premier joueur contre une menace impaire du second donne la nulle. Savoir compter le pair contre l’impair, c’est l’essentiel de ce qui sépare un débutant d’un bon joueur de club.',
        },
      ],
    },

    {
      id: 'develop',
      h2: '5 · Comment développer, quand aucune règle ne s’applique encore',
      blocks: [
        {
          p: 'Pendant la douzaine de demi-coups initiaux, aucune règle de VICTOR ne s’applique : il n’y a pas assez de jetons sur le plateau pour qu’une preuve par appariement existe. Le solveur connaît quand même le bon coup, mais sa raison est positionnelle plutôt que réglementaire, et l’application appelle ça <em>un coup de développement</em>. Cinq habitudes te permettent d’en choisir un toi-même.',
        },
        {h3: '1 · Commence au centre'},
        {
          p: 'La colonne&nbsp;4 appartient à plus d’alignements potentiels que n’importe quelle autre : 51 des 69 alignements du plateau la traversent, soit les 24 horizontaux, les 24 diagonaux et 3 verticaux. Viennent ensuite les colonnes 3 et 5, puis 2 et 6, puis les bords. Quand tu n’as pas de meilleure idée, un coup vers le centre ne te coûte presque jamais rien.',
        },
        {h3: '2 · Pose-toi sur ta rangée de parité'},
        {
          p: 'Avant de lâcher un jeton, détermine sur quelle rangée il va tomber. Compte les jetons déjà présents dans la colonne : un nombre pair signifie que ton jeton se pose sur une rangée impaire, un nombre impair sur une rangée paire. Premier joueur, vise les <strong>rangées impaires</strong> (1, 3, 5) ; second joueur, vise les <strong>rangées paires</strong> (2, 4, 6). Se poser sur la mauvaise rangée offre le décompte final à ton adversaire.',
        },
        {h3: '3 · Compte les alignements que tu ouvres'},
        {
          p: 'Après avoir joué, compte combien d’alignements de quatre contiennent désormais au moins un de tes jetons et aucun de ceux de l’adversaire. Plus il y en a, mieux c’est. Le mode apprentissage te le dessine avec les marqueurs d’<em>opportunité</em> (tes menaces embryonnaires) et de <em>danger</em> (celles de l’adversaire). À conditions égales, un coup de développement qui ouvre trois nouveaux alignements vaut mieux qu’un coup qui n’en ouvre qu’un.',
        },
        {h3: '4 · Surveille ce que tu offres'},
        {
          p: 'Chaque jeton que tu poses est une invitation, car le prochain jeton adverse peut se poser juste dessus. Vérifie cette case avant de t’engager. Si elle lui donne une case paire qu’il convoitait ou lui ouvre un alignement qui lui manquait, cherche une autre colonne.',
        },
        {h3: '5 · Répartis tes menaces entre les colonnes'},
        {
          p: 'Deux de tes menaces empilées dans une même colonne s’annulent : l’adversaire bloque une fois et les tue toutes les deux. Étale-les. Les positions à viser sont celles où ton adversaire devrait être dans deux colonnes à la fois.',
        },
        {
          details: {
            summary: 'Pourquoi le solveur en sait quand même plus que ces cinq habitudes',
            body: [
              'Les habitudes ci-dessus sont des conjectures éclairées. Elles décrivent à quoi ressemblent en général les bonnes positions, et ne garantissent rien. Le solveur, lui, saute tout ça : il évalue l’arbre de jeu complet à partir de la position devant toi et renvoie le score exact de chaque colonne. Quand il annonce +15 pour la colonne&nbsp;4 et +7 pour la colonne&nbsp;1, il a compté toutes les positions descendantes des deux et confirmé que la colonne&nbsp;4 gagne 8 demi-coups plus tôt. Les heuristiques sont un raccourci pour les humains ; le moteur n’en a aucun usage.',
            ],
          },
        },
      ],
    },

    {
      id: 'learn',
      h2: '6 · Lire le mode apprentissage',
      blocks: [
        {
          p: 'Le mode apprentissage te répond avec deux machines distinctes, et savoir les distinguer rend les conseils bien plus faciles à interpréter.',
        },
        {
          p: 'Le mode entraînement (<a href="/practice">les exercices</a>) te distribue une position bâtie autour d’une de ces idées et note la colonne que tu choisis : c’est le moyen le plus rapide de savoir si tu lis les marqueurs comme le fait le moteur.',
        },
        {
          ul: [
            '<strong>Le solveur choisit la colonne.</strong> Il relit le plateau entier à chaque coup : il reste donc juste après une bourde de l’un ou l’autre camp, et dans des positions qu’aucun livre de théorie ne couvre.',
            '<strong>Une couche de règles décrit ce choix avec des mots</strong> et dessine les marqueurs. Elle travaille à partir de la structure de menaces posée sur le plateau, pas à partir de la recherche.',
          ],
        },
        {
          p: 'Le solveur ne demande jamais la permission à la couche de règles. Quand un conseil semble tiède et que la barre de score annonce une position gagnante, crois le score.',
        },
        {h3: 'Comment la carte choisit son mot'},
        {
          p: 'La carte nomme <em>le coup que recommande le solveur</em>, jamais celui que tu viens de jouer. Elle applique ces tests dans l’ordre à la colonne recommandée et s’arrête au premier qui se déclenche :',
        },
        {
          ol: [
            '<strong>Un coup gagnant.</strong> Jouer là aligne quatre jetons pour toi, tout de suite.',
            '<strong>Un blocage.</strong> Jouer là aligne quatre jetons pour ton adversaire : tu prends donc la case avant lui.',
            '<strong>Une menace impaire ou paire.</strong> Après le coup, tu détiens au moins une case de menace que tu n’avais pas. La carte nomme la parité qui t’avantage, impaire pour le premier joueur et paire pour le second, et se rabat sur la menace apparue si le coup ne crée que l’autre type.',
            '<strong>Un claimeven.</strong> Aucune menace nouvelle n’est apparue, et la case se trouve sur une rangée paire juste au-dessus d’un jeton adverse. Seul le second joueur voit cette étiquette, puisque les cases paires sont son outil.',
            '<strong>Un coup de développement.</strong> Aucun des tests ci-dessus ne s’est déclenché.',
          ],
        },
        {
          p: 'Comme les tests s’exécutent dans l’ordre, un coup qui bloque un alignement <em>et</em> construit une menace impaire s’affiche comme un blocage. La carte te donne la raison la plus urgente du coup, et les marqueurs du plateau portent le reste de l’histoire.',
        },
        {
          p: 'Un coup de développement est un coup fort dont la raison n’a pas encore de nom. La plupart des dix premiers demi-coups sont des coups de développement, et le solveur sait lesquels gagnent.',
        },
        {h3: 'Les marqueurs sur le plateau'},
        {
          p: 'Appuie sur « Montre-moi sur le plateau » et les cases se couvrent de symboles. Le diagramme de régime permanent, dans la colonne latérale, emploie le même vocabulaire en plus petit.',
        },
        {
          legend: [
            {
              char: '✦',
              cls: 'g-win',
              term: 'Étoile dorée',
              desc: 'La partie se joue sur cette case : soit tu y alignes quatre jetons, soit ton adversaire l’aurait fait au tour suivant.',
            },
            {
              char: '◎',
              cls: 'g-play',
              term: 'Double anneau',
              desc: 'La case d’atterrissage recommandée. Quand plusieurs colonnes sont à égalité de score, chacune en reçoit un, et n’importe laquelle convient.',
            },
            {
              char: '○',
              cls: 'g-opp',
              term: 'Anneau fin',
              desc: 'Une de tes menaces : une case vide qui complète un alignement pour toi si tu parviens un jour à y jouer.',
            },
            {
              char: '✕',
              cls: 'g-danger',
              term: 'Croix rouge',
              desc: 'Une menace adverse à laquelle aucune de tes règles ne répond encore. Deux de ces croix dans des colonnes que tu ne peux pas couvrir toutes les deux, c’est ainsi qu’on perd une partie.',
            },
            {
              char: '◌',
              cls: 'g-ctrl',
              term: 'Anneau pointillé',
              desc: 'Une menace adverse à laquelle une règle répond déjà : elle ne réclame aucun coup de ta part aujourd’hui. Son calme est volontaire.',
            },
          ],
        },
        {
          p: 'Les alignements entiers sont eux aussi cerclés, pas seulement la case qui les complète, pour que tu voies à quel quatuor appartient un marqueur. Quand une case se trouve sur des alignements des deux camps, la couleur du danger l’emporte.',
        },
        {h3: 'D’où vient un anneau pointillé'},
        {
          p: 'Deux règles produisent ce marqueur tranquille, et toutes deux méritent d’être reconnues sur un vrai plateau :',
        },
        {
          ul: [
            '<strong>Le contrôle par claimeven.</strong> La menace adverse repose sur une case paire que le second joueur récupère en répondant au-dessus. La menace existe, et elle ne sera jamais à lui.',
            '<strong>Une fourchette baseinverse.</strong> L’adversaire a deux jetons dans un alignement dont les deux cases restantes sont jouables dès ce tour, et ces deux cases sont toujours dans des colonnes différentes. Il en prend une, tu prends l’autre : l’alignement meurt quoi qu’il fasse.',
          ],
        },
        {h3: 'Révéler le plan'},
        {
          p: 'Le bouton du plan apparaît dès que le prouveur trouve une preuve complète pour la position. Le titre annonce qui peut forcer quoi : une victoire pour le premier joueur, une victoire pour le second, ou le maintien de la nulle par le second. En dessous, une ligne nomme l’<strong>ancrage</strong>, ce qui force le résultat :',
        },
        {
          ul: [
            'Une <strong>menace impaire</strong> sur une case nommée, qui transforme le zugzwang en victoire.',
            'Un alignement <strong>immédiat</strong>, disponible tout de suite dans une colonne nommée.',
            'Un <strong>aftereven</strong>, un alignement que le second joueur complète en n’utilisant que des cases paires qui lui sont garanties.',
            'Une <strong>combinaison de menaces</strong>, où deux cases forcent ensemble une menace impaire quelle que soit la réponse adverse.',
          ],
        },
        {
          p: 'Sous l’ancrage vient la liste des règles, une ligne par règle avec le nombre de fois que le plan l’emploie. Chaque règle possède son symbole et sa couleur, et les cases qu’elle réserve portent le même symbole sur le plateau : tu peux donc relier n’importe quelle ligne de la liste à la portion de plateau qu’elle gouverne :',
        },
        {
          legend: [
            {
              char: '◆',
              cls: 'rule-claimeven',
              term: 'Claimeven (revendication paire)',
              desc: 'Prends la case paire au-dessus de la leur.',
            },
            {
              char: '■',
              cls: 'rule-baseinverse',
              term: 'Baseinverse (inverse de base)',
              desc: 'Deux cases jouables, et ils ne peuvent pas avoir les deux.',
            },
            {
              char: '▮',
              cls: 'rule-vertical',
              term: 'Vertical (verticale)',
              desc: 'Réponds au-dessus pour refuser la colonne.',
            },
            {
              char: '▲',
              cls: 'rule-aftereven',
              term: 'Aftereven (suite paire)',
              desc: 'Les cases paires tuent les menaces situées au-dessus.',
            },
            {
              char: '▽',
              cls: 'rule-lowinverse',
              term: 'Lowinverse (inverse basse)',
              desc: 'Deux cases impaires, et tu en obtiens une. La flèche pointe vers le bas pour « basse ».',
            },
            {
              char: '△',
              cls: 'rule-highinverse',
              term: 'Highinverse (inverse haute)',
              desc: 'Contrôle trois hauteurs sur deux colonnes. La flèche pointe vers le haut pour « haute ».',
            },
            {
              char: '◈',
              cls: 'rule-baseclaim',
              term: 'Baseclaim (revendication de base)',
              desc: 'Une revendication plus une inverse, ancrées sur la rangée du bas.',
            },
            {
              char: '●',
              cls: 'rule-before',
              term: 'Before (devancement)',
              desc: 'Réponds au-dessus, de façon à compléter ton alignement le premier.',
            },
          ],
        },
        {
          p: 'La dernière ligne compte ce que le plan couvre : les alignements possibles de l’adversaire, tous, sans que deux règles se disputent la même case. Retire l’une ou l’autre moitié de cette condition et la preuve s’effondre, d’où l’intérêt de lire ce décompte.',
        },
        {
          p: 'Pas de bouton de plan signifie que le prouveur n’a trouvé aucune preuve pour cette position : il se tait donc. Il ne devine jamais et ne revendique jamais un maintien que le solveur contredirait. La barre de score et le conseil en mots continuent de fonctionner dans tous les cas.',
        },
      ],
    },

    {
      id: 'rules',
      h2: '7 · Revendiquer des cases : les règles derrière le plan',
      blocks: [
        {
          p: 'Chaque règle de VICTOR répond à une seule question : <em>quelles cases suis-je certain d’obtenir, et lesquels des alignements adverses cela tue-t-il ?</em> Les apprendre par cœur est inutile. C’est en reconnaître les formes qui sert.',
        },
        {h3: 'Claimeven, la colonne vertébrale'},
        {
          p: 'Deux cases vides empilées dans une colonne, celle du haut sur une rangée paire. Si l’adversaire prend la case du bas, tu prends aussitôt la case paire du dessus. La case paire est donc à toi sur simple demande, et tout alignement qui la traverse meurt. La plupart des plans défensifs sont des claimevens auxquels on ajoute quelques exceptions.',
        },
        {
          details: {
            summary: 'La règle formelle d’Allis',
            body: [
              '<strong>Requis :</strong> deux cases vides directement l’une au-dessus de l’autre, celle du haut sur une rangée paire.<br /><strong>Résout :</strong> tous les groupes contenant la case du haut.',
            ],
          },
        },
        {h3: 'Le reste de la famille'},
        {
          ul: [
            '<strong>Baseinverse</strong> : deux cases jouables dès ce tour. Ton adversaire en prend une au plus, tu prends donc l’autre, et tout alignement qui a besoin des <em>deux</em> est mort.',
            '<strong>Vertical</strong> : la même paire empilée que le claimeven, mais avec la case du haut sur une rangée impaire. Tu finis quand même par obtenir l’une des deux.',
            '<strong>Lowinverse et highinverse</strong> : deux colonnes combinées pour que les cases impaires se répartissent à ton avantage.',
            '<strong>Aftereven</strong> : un alignement à toi que tu complètes en n’employant que des cases paires. Il efface aussi toutes les menaces situées au-dessus de ces colonnes.',
            '<strong>Baseclaim</strong> : une revendication plus une inverse, ancrées sur la rangée du bas.',
            '<strong>Before</strong> : tu réponds au-dessus d’un alignement inachevé pour compléter le tien en premier.',
          ],
        },
        {
          p: 'Regarde plusieurs d’entre elles coopérer dans une même défense : une lowinverse, une verticale, trois groupes « before » et cinq claimevens, tous compatibles entre eux :',
        },
        {
          diagram: {
            example: 'draw-inverse',
            caption: 'Une défense mixte : lowinverse + verticale + before ×3 + claimeven ×5.',
          },
        },
      ],
    },

    {
      id: 'proof',
      h2: '8 · Tout assembler : la preuve par appariement',
      blocks: [
        {
          p: 'Une règle isolée ne prouve rien. La force vient de leur <strong>combinaison</strong>. Choisis un ensemble de règles qui réfutent à elles toutes chaque alignement que l’adversaire pourrait encore bâtir, et qui ne revendiquent jamais deux fois la même case : ton adversaire ne pourra alors jamais aligner quatre jetons. Tu tiens la nulle au pire. Cet ensemble de règles, c’<em>est</em> l’appariement.',
        },
        {
          p: 'La seconde condition, la cohérence, est celle qui pose problème. Certaines règles se sabotent entre elles, et Allis a dressé une table complète des combinaisons qui survivent ensemble. Ce site implémente cette table, puis vérifie chaque preuve produite contre le solveur parfait. Sur des dizaines de milliers de positions, il n’a jamais revendiqué une nulle ou une victoire que le solveur contredirait. Un plan que tu révèles est fiable.',
        },
        {
          diagram: {
            example: 'draw-baseclaim',
            caption:
              'Baseclaim + aftereven ×3 + baseinverse couvrent toutes les menaces : un maintien démontré.',
          },
        },
        {
          diagram: {
            example: 'draw-before',
            caption: 'Parfois un seul « before » et quelques claimevens suffisent.',
          },
        },
      ],
    },

    {
      id: 'winning',
      h2: '9 · Forcer la victoire',
      blocks: [
        {
          p: 'Tenir la nulle est l’art du défenseur. Gagner demande un ingrédient de plus : une menace à laquelle ton adversaire ne pourra jamais répondre.',
        },
        {h3: 'Premier joueur : une menace impaire'},
        {
          p: 'Donne au premier joueur une <strong>menace impaire</strong> permanente et le zugzwang fait le reste. L’adversaire épuise ses coups sûrs, joue sous la menace et lui remet la case gagnante. Tout le reste du plateau est de la défense pure, avec les mêmes règles d’appariement, si bien que l’adversaire n’y arrive jamais le premier. L’étoile dorée marque la menace sur laquelle repose toute la victoire :',
        },
        {
          diagram: {
            example: 'win-odd-baseinverse',
            caption:
              'Une menace impaire en d3 force la victoire ; baseinverse et six claimevens tiennent le reste.',
          },
        },
        {h3: 'Second joueur : un aftereven'},
        {
          p: 'Le second joueur gagne en reflétant cette idée. Quand son plan défensif contient un <strong>aftereven</strong>, un alignement de quatre qu’il complète sur des cases paires garanties, il répond à tout ce que tente le premier joueur et achève son propre alignement chemin faisant. Les étoiles montrent les cases paires qui lui sont garanties :',
        },
        {
          diagram: {
            example: 'win-black-aftereven',
            caption: 'Les cases paires b2–e2 sont au second joueur ; les compléter gagne la partie.',
          },
        },
      ],
    },

    {
      id: 'gm',
      h2: '10 · Jouer comme un champion',
      blocks: [
        {p: 'Une liste de contrôle que tu peux emporter sur un vrai plateau :'},
        {
          ol: [
            '<strong>Ouvre au centre.</strong> Toute la victoire du premier joueur se construit sur la colonne centrale, celle qui touche le plus d’alignements.',
            '<strong>Compte l’impair contre le pair.</strong> Premier joueur, chasse les menaces impaires ; second joueur, les paires. Celui qui détient le bon type de menace dans une colonne libre possède la fin de partie.',
            '<strong>En défense, prends les cases paires.</strong> Répondre juste au-dessus du jeton adverse te revendique une case paire sans rien coûter.',
            '<strong>Pense en alignements plutôt qu’en coups.</strong> Demande-toi quels alignements ton adversaire peut encore réaliser et si tu as une réponse à chacun. Cette question, c’<em>est</em> l’appariement.',
            '<strong>Entraîne-toi avec le plan ouvert.</strong> Passe en mode apprentissage et utilise « Révéler le plan » jusqu’à pouvoir prédire ce qu’il va dire avant de l’ouvrir.',
            '<strong>Puis entraîne-toi sans lui.</strong> Les exercices te distribuent une position, prennent ta réponse et te disent ce que le solveur a vu que tu n’as pas vu.',
          ],
        },
        {
          cta: [
            {to: '/practice', variant: 'accent', label: 'Commencer les exercices →'},
            {to: '/', variant: 'default', label: 'Ouvrir le plateau'},
          ],
        },
      ],
    },
  ],

  footer:
    'La théorie présentée ici vient de <em>A Knowledge-based Approach of Connect-Four</em> de Victor Allis (1988), et le solveur parfait de Pascal Pons. Chaque appariement de cette page est calculé en direct et validé contre ce solveur.',
};
