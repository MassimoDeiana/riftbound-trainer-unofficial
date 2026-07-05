# Riftbound Table

Table de jeu en ligne **non officielle** pour Riftbound (le TCG League of Legends), pour jouer entre amis dans le navigateur — moteur de règles intégré, deck builder, multijoueur P2P sans serveur.

> Projet fan, non affilié à Riot Games. Les cartes et visuels appartiennent à Riot Games ; données de cartes fournies par l'API communautaire [Riftcodex](https://riftcodex.com), images servies par le CDN officiel.

## Lancer

```bash
npm install
npm run dev        # http://localhost:5173
```

## Mode solo (contre l'IA)

Sur l'écran d'accueil : choisis ton deck, le deck de l'IA, puis **🤖 Jouer contre l'IA**. Le bot joue par les règles via le moteur (mulligan, gestion des runes, développement, prise de champs de bataille, combats) mais n'applique pas les textes d'effets : ses déclencheurs se résolvent sans effet. Bon pour apprendre le flux du jeu et tester ses decks.

## Jouer avec un ami

1. Chacun ouvre le site (même build : même URL déployée, ou même version locale).
2. Onglet **Decks** : les **7 decks préconstruits officiels** sont préchargés et jouables immédiatement — Proving Grounds (Annie, Lux, Garen, Master Yi) + Champion Decks Origins (Jinx, Lee Sin, Viktor). Ou construire un deck légal (1 légende, 40+ cartes dont 1 champion ⭐, 12 runes, 3 champs de bataille).
3. Onglet **Jouer** : l'un clique **Créer une partie** et partage le code ; l'autre entre le code et clique **Rejoindre**.
4. La connexion est en pair-à-pair (WebRTC via Trystero) : aucun compte, aucun serveur à héberger.

## Ce que le moteur applique automatiquement

- Mise en place complète 1v1 : pioche de 4, mulligan (max 2), 2 champs de bataille tirés au sort (1 par joueur), le 2e joueur canalise 3 runes à son premier tour.
- Tour : redressement, **scoring de Tenue**, canalisation de 2 runes, pioche, vidage des pools.
- Économie : runes → énergie (engager) ou puissance (recycler), coûts des cartes vérifiés, Accelerate.
- Déplacements standards (+ Ganking), showdowns, **combats complets** (Assault/Shield/Tank/Stun, assignation létale, rappel des attaquants, Conquête).
- Scoring : Conquête/Tenue (1x par champ de bataille par tour), **restriction du point final**, Burn Out, victoire à 8 points.
- La chaîne : sorts et déclencheurs « When you play me », réponses en [Reaction], résolution LIFO.
- Mots-clés : Action, Reaction, Accelerate, Assault, Shield, Tank, Ganking, Hidden (cartes cachées), Legion, Temporary, Deathknell (rappel), Vision.

## Ce qui reste manuel (assisté)

Les textes d'effets des cartes ne sont pas encore scriptés individuellement : quand un sort ou un déclencheur se résout, le jeu affiche son texte et vous appliquez l'effet avec les **outils manuels 🔧** (dégâts, buffs, pioche, points, étourdissement, etc.). Toutes les actions manuelles sont journalisées et visibles par l'adversaire — comme sur une vraie table. Les effets scriptés par carte peuvent être ajoutés progressivement dans `src/engine/`.

## Collection riftbound.gg

Sur [riftbound.gg](https://riftbound.gg/collection/) : My Collection → Export CSV, puis importer le fichier sur l'écran d'accueil. Le deck builder affiche alors les quantités possédées et un filtre « Possédées ».

## Développement

```bash
npm test              # tests du moteur (vitest)
npm run build         # build de production (dist/)
npm run fetch-cards   # met à jour src/data/cards.json depuis Riftcodex
```

- `docs/rules-spec.md` — spécification condensée des règles officielles (Core Rules 2025-06-02) qui sert de référence au moteur.
- `src/engine/` — moteur pur TS (reducer déterministe, RNG seedé) ; les deux clients rejouent le même journal d'actions.
- Déploiement : n'importe quel hébergeur statique (`dist/` sur Netlify, GitHub Pages, Cloudflare Pages…).

## Limites connues (v1)

- 1v1 uniquement.
- L'assignation des dégâts de combat est automatique (Tanks d'abord, puis Might décroissant) — corrigez avec les outils manuels si un choix différent est voulu.
- Deflect, les couches d'effets continus et l'action « Invite » ne sont pas simulés.
- Pas de reconnexion d'état automatique : bouton **↻ Resync** en cas de doute (renvoie l'état de l'autre joueur).
