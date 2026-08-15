# Riftbound Table

Table de jeu en ligne **non officielle** pour Riftbound (le TCG League of Legends), pour jouer entre amis dans le navigateur — moteur de règles intégré, deck builder, multijoueur P2P sans serveur.

> Projet fan, non affilié à Riot Games. Les cartes et visuels appartiennent à Riot Games ; données de cartes fournies par l'API communautaire [Riftcodex](https://riftcodex.com), images servies par le CDN officiel.

## Lancer

```bash
npm install
npm run dev        # http://localhost:5173
```

## Mode solo (contre l'IA)

Sur l'écran d'accueil : choisis ton deck, le deck de l'IA, puis **🤖 Jouer contre l'IA**. Le bot joue par les règles via le moteur (mulligan, gestion des runes, développement, prise de champs de bataille, combats) et répond à tous les choix d'effets (cibles, modes, assignation des dégâts…) avec des heuristiques simples et déterministes. Bon pour apprendre le flux du jeu et tester ses decks.

## Jouer avec un ami

1. Chacun ouvre le site (même build : même URL déployée, ou même version locale).
2. Onglet **Decks** : les **7 decks préconstruits officiels** sont préchargés et jouables immédiatement — Proving Grounds (Annie, Lux, Garen, Master Yi) + Champion Decks Origins (Jinx, Lee Sin, Viktor). Ou construire un deck légal (1 légende, 40+ cartes dont 1 champion ⭐, 12 runes, 3 champs de bataille).
3. Onglet **Jouer** : l'un clique **Créer une partie** et partage le code ; l'autre entre le code et clique **Rejoindre**.
4. La connexion est en pair-à-pair (WebRTC via Trystero) : aucun compte, aucun serveur à héberger.

## Ce que le moteur applique automatiquement

- Mise en place complète 1v1 : pioche de 4, mulligan (max 2), 2 champs de bataille tirés au sort (1 par joueur), le 2e joueur canalise 3 runes à son premier tour.
- Tour : redressement, **scoring de Tenue**, canalisation de 2 runes, pioche, vidage des pools.
- Économie : runes → énergie (engager) ou puissance (recycler), coûts des cartes vérifiés, Accelerate.
- Déplacements standards (+ Ganking), showdowns et **combats déclenchés automatiquement** (règles de Cleanup 323), **contrôle basé sur la présence** (quitter un champ de bataille = perdre son contrôle).
- **Combats complets** (Assault/Shield/Tank/Stun) : l'**assignation des dégâts est un choix du joueur** (règle 465.2.c — létal complet, Tank d'abord, Backline en dernier), demandée uniquement quand plusieurs répartitions sont légales ; soin général et rappel des attaquants au Combat Cleanup ; Conquête.
- Scoring : Conquête/Tenue (1x par champ de bataille par tour), **restriction du point final**, Burn Out, victoire à 8 points.
- La chaîne façon **FEPR** : priorité au lanceur d'abord (337.4), réponses en [Reaction], **résolution automatique** quand les deux joueurs passent, focus conservé après les chaînes de déclencheurs (346.1).
- Mots-clés : Action, Reaction, Accelerate, Assault, Shield, Tank, Ganking, Hidden (coût : 1 puissance de n'importe quel domaine), Legion, Temporary, Deathknell (rappel), Vision.

## Effets de cartes automatisés

La très grande majorité des cartes est **entièrement scriptée** : sorts ciblés (cibles surlignées au clic), déclencheurs (« When you play me », Deathknell, conquête/tenue, début/fin de tour, combat…), capacités activées (bouton ⚡ sur les unités, « Activer » sur la légende), auras et passifs, jetons, Équipements (attache, bonus, texte inactif si détaché), XP/Level/Hunt, Empower, Repeat, Deflect (taxe payée au ciblage), et plus. La couverture par set est vérifiée en CI (`node scripts/effects-coverage.mjs`).

Une petite liste de cartes aux mécaniques exotiques (remplacements complexes, vols de sorts, jeux gratuits depuis le deck… — marquées `manual: true` dans `src/effects/sets/`, cartes bannies incluses) reste à résolution **manuelle assistée** : le jeu affiche leur texte et vous appliquez l'effet avec les **outils 🔧**. Toutes les actions manuelles sont journalisées et visibles par l'adversaire.

## Collection riftbound.gg

Sur [riftbound.gg](https://riftbound.gg/collection/) : My Collection → Export CSV, puis importer le fichier sur l'écran d'accueil. Le deck builder affiche alors les quantités possédées et un filtre « Possédées ».

## Développement

```bash
npm test              # tests du moteur (vitest)
npm run build         # build de production (dist/)
npm run coverage      # gate : chaque carte de chaque set doit être scriptée
npm run soak          # N parties bot-vs-bot (decks aléatoires tous sets) + test de déterminisme
npm run fetch-cards   # met à jour src/data/cards.json depuis Riftcodex
```

- `docs/rules-spec.md` — spécification condensée des règles officielles (Core Rules **2026-07-16**) qui sert de référence au moteur.
- `src/engine/` — moteur pur TS (reducer déterministe, RNG seedé) ; les deux clients rejouent le même journal d'actions (protocole **v2** : chaque choix de joueur est une action `choose` répliquée).
- `src/game/legacy/` — moteur v1 gelé, utilisé uniquement pour relire les parties archivées au format v1.
- Déploiement : n'importe quel hébergeur statique (`dist/` sur Netlify, GitHub Pages, Cloudflare Pages…).

## Limites connues

- 1v1 uniquement.
- Pas de reconnexion d'état automatique : bouton **↻ Resync** en cas de doute (renvoie l'état de l'autre joueur).
- Les parties enregistrées avec l'ancien moteur (v1) restent consultables en relecture, mais ne peuvent pas être reprises.
