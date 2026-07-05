# Riftbound Core Rules — Engine Specification

Source: Riftbound Core Rules, Last Updated **2025-06-02** (65-page PDF, text extraction).
Rule numbers in parentheses refer to the source document. Card text supersedes rules (Golden Rule, 002). In card effects, "card" means "Main Deck card"; runes, legends, and battlefields are not "cards" for card-effect purposes, but are cards for these rules (052).

---

## 1. Game Setup & Deck Construction

### 1.1 Deck construction (101–103)
- Each player brings:
  - **1** Champion Legend → starts in Legend Zone. Dictates the deck's **Domain Identity** (103.1).
  - A **Main Deck of at least 40 cards** including **1 Chosen Champion Unit** (units, gear, spells) (103.2).
    > ⚠️ UNCERTAIN: extraction reads "A Main Deck of at least 40 cards 1 Chosen Champion Unit Units Gear Spells"; whether the Chosen Champion counts toward the 40 is not explicit in the extracted text.
  - A **Rune Deck of exactly 12 rune cards** (103.3, 154.2.a). Runes must match the Domain Identity. Kept shuffled and separate from Main Deck.
  - Battlefields: count dictated by Mode of Play; subject to Domain Identity (103.4). For 1v1, each player provides **3** battlefields in their deck registration (644.4.a).
- Copy limit: **up to 3 copies** of the same named card in the Main Deck (103.2.b). The Chosen Champion counts as one of those copies (a deck may run the Chosen Champion + 2 more copies of it, 103.2.b.1). Different names = different cards even for the same character (103.2.b.2).
- **Signature cards: max 3 total** (regardless of name), and all must bear the Champion tag matching the Champion Legend (103.2.d). Signature cards are not Champion units and can never occupy the Champion Zone (103.2.d.3).
- Chosen Champion must be a **champion unit** whose champion tag matches the tag on the Champion Legend (103.2.a.2). Signature units (e.g. Tibbers) are ineligible.
- Domain Identity: a card with one Domain is legal if the identity contains that Domain; a multi-Domain card requires the identity to contain **all** its Domains (103.1.b.3–4).

### 1.2 Setup process (110–118)
1. Each player places Champion Legend in Legend Zone (111).
2. Each player places Chosen Champion in Champion Zone (112).
3. Battlefields set aside; placement per Mode of Play (113).
4. Shuffle Main Deck and Rune Deck separately into their zones (114).
5. Determine Turn Order by any fair random method (115). First Player = first Turn Player; play proceeds clockwise from them unless mode says otherwise (115.1.b).
6. **Each player draws 4** (116).
7. In turn order, each player mulligans: choose **up to 2** cards from hand, set aside; draw that many; then **Recycle** the set-aside cards (bottom of Main Deck) (117).
8. First Player takes their turn (118).

### 1.3 1v1 (Duel) mode parameters (644)
- **2 players**, no teams. **Victory Score: 8 points**. First to reach it wins immediately (633).
- **Battlefield Count: 2** — each player randomly selects **1** of their **3** registered battlefields; the other two are removed from the game. Both selected battlefields go to the Battlefield Zone (644.4–644.5).
- Best of 1 (644.6).
- First-turn exception: **the player going second channels 1 extra rune** (3 total) during their first Channel Phase (644.7). No draw penalty for going first in 1v1.
- Other modes (for reference): 1v1 Match = Bo3, same values, battlefields not reused between games (645). FFA3: 3 players, Victory 8, 3 battlefields, first player skips first draw, last player channels extra (646). FFA4: 4 players, Victory 8, 3 battlefields (first player's battlefield removed) (647). 2v2: Victory **11**, 3 battlefields, teammate rules (648).
- Starting score: players start with 0 points (no rule grants starting points; score accrues only via Scoring/effects).

---

## 2. Zones

Board zones (106):
| Zone | Per | Location? | Visibility | Notes |
|---|---|---|---|---|
| Base | player | Yes | Public | Player always may play Units/Gear here; houses that player's on-board Runes; opponents' objects can never be in your Base (106.2). |
| Battlefield Zone | shared | each battlefield is a Location | Public | Holds all battlefields in play; any number of units may be at a battlefield (163.6). |
| Facedown Zone | 1 per battlefield | **No** | facedown = Private (controller only) | Max occupancy **1 card**; only usable while the card's controller controls the battlefield; card removed at next Cleanup if control lost (106.4). |
| Legend Zone | player | No | Public | Champion Legend can never be removed/moved/displaced from it (106.5). |

Non-board zones (107):
| Zone | Visibility | Ordering | Notes |
|---|---|---|---|
| Trash | Public | Unordered, may be reorganized | Per player; a card can never go to another player's trash — redirected to owner's trash (107.1). |
| Champion Zone | Public | — | Chosen Champion starts here; playable from here as a normal card play; cannot be returned here by normal means (107.2). |
| Main Deck Zone | order is Secret; facedown | Ordered | (107.3) |
| Rune Deck Zone | order is Secret; facedown | Ordered | (107.4) |
| Banishment | Public | Unordered | Per player; never into another player's banishment; effects reference banished cards only via the effect that put them there (107.5). |
| Hand | Private (contents); **count is Public** | Unordered | Cards go here when drawn; can be targeted as a zone (107.6). |
| The Chain | Public | Ordered (LIFO resolution) | Temporary non-board zone existing only while a card/ability is on it (533–534). |

- Privacy levels: **Secret** (no one may look), **Private** (only controller/owner), **Public** (anyone) (127).
- All game objects in the Play Area and their states (buffed, exhausted, …) are Public (108).
- **Rule 109 (critical):** whenever a Game Object changes zones **to or from a Non-Board Zone**, ALL temporary modifications cease: damage cleared, buffs removed, temporarily granted keywords lost. It is then a new object (see 563.2.c.4).
- Tokens exist only on the Board; a token put into any non-board zone ceases to exist immediately after arriving (177).

---

## 3. Turn Structure

Phases are rigid; actions within them may be ordered freely unless specified (503). Game actions are performed one at a time, never simultaneously; simultaneous triggers are ordered by Turn Order (503.2). Phase/step ends when the Chain is empty and the Turn Player declines further Discretionary Actions (505).

### 3.1 Start of Turn (515)
1. **Awaken Phase** — Turn Player readies all Game Objects they control that can be readied (515.1).
   > ⚠️ UNCERTAIN: 593.4.a calls this "the Ready Step of the Beginning Phase"; 515.1 names it the "Awaken Phase". Same event, inconsistent naming in source.
2. **Beginning Phase**
   - **Beginning Step**: "at the start of Beginning Phase" effects trigger (515.2.a). (Temporary permanents die here, before scoring — see keyword Temporary.)
   - **Scoring Step**: **Holding** happens now — Turn Player scores each battlefield they Control (see §6.5) (515.2.b).
3. **Channel Phase** — Turn Player **channels 2 runes** from top of Rune Deck onto the board (515.3). If fewer than 2 remain, channel as many as possible (515.3.b.1). (First-turn adjustments per mode: e.g. 1v1 second player channels 3.)
4. **Draw Phase** — Turn Player **draws 1** (515.4). If Main Deck is empty, perform Burn Out, then still draw 1 (515.4.b). **At end of Draw Phase, every player's Rune Pool empties** (515.4.d, 160).

### 3.2 Action Phase (516)
- Unstructured. Turn is in **Neutral Open State**; only the Turn Player has priority to take Discretionary Actions: play cards, standard moves, activate abilities, hide cards, etc. (516.2, 512.2.a).
- Combats and Showdowns occur here as structured sub-phases resulting from moves/plays (516.4–516.5).
- Ends when the Turn Player declares the end of their turn (516.6).

### 3.3 End of Turn Phase (517)
1. **Ending Step** — "at the end of the turn" effects trigger (517.1). Stunned units lose Stunned at the **beginning** of the Ending Step (599.1.a.2).
2. **Expiration Step** — clear **all marked damage from all Units everywhere**; all "this turn" effects expire simultaneously; **all players' Rune Pools empty** (517.2).
3. **Cleanup Step** — perform a Cleanup (517.3).
4. If effects applied new damage or created new "this turn" effects, **return to the Expiration Step** and repeat (517.4).
5. Turn Player becomes the next player in Turn Order (517.5).

### 3.4 Turn states (507–510)
- Showdown State (a Showdown in progress) vs Neutral State.
- Closed State (a Chain exists) vs Open State (no Chain).
- Four combinations. Defaults:
  - **Neutral Open**: any card/ability playable, only by the priority-holder on their turn (510.1).
  - **Showdown (any)**: only cards/abilities with **Action** or **Reaction** (508.1.a).
  - **Closed (any)**: only cards/abilities with **Reaction** (509.1.a).

### 3.5 Cleanups (518–526)
A Cleanup occurs: after a Chain item resolves; after a Move completes; after a Showdown completes; after a Combat completes (519). Cleanup steps:
1. Kill every unit with nonzero marked damage ≥ its Might → owner's trash (520).
2. Remove Attacker/Defender status from units no longer at the combat battlefield (521).
3. Recognize/begin execution of outstanding state-based effects ("While"/"As long as") (522).
4. Remove Hidden (facedown) cards from battlefields where their controller has no unit present → owner's trash; this can render the battlefield uncontrolled (523).
5. Mark Combat as **Pending** at each battlefield containing units of two opposing players (524).
6. If state is Neutral Open and one or more battlefields are Contested **with no current controller** → Turn Player chooses one; a **Showdown** begins there (525).
7. If state is Neutral Open and Combat is Pending anywhere → Turn Player chooses one; **Combat** begins there (526).

---

## 4. Costs & Resources

### 4.1 Energy and Power (130, 155–161)
- Card cost = **Energy cost** (numeral) + optional **Power cost** (domain symbols) in top-left (130).
- **Energy** is domainless/typeless; pays numeric costs (156.1). **Power** has a Domain; pays domain Power costs; some Power is **Universal** (any domain) (156.2).
- The **Rune Pool** holds a player's floating Energy/Power (159). "Add" puts resources into the pool (605).
- The Rune Pool **empties at the end of each player's Draw Phase and at the end of each player's turn** (all players' pools, both times) (160, 515.4.d, 517.2.c). Unspent resources are lost. It does NOT empty between actions within the Action Phase.

### 4.2 Runes (153–157, 606)
- Rune Deck = exactly **12** runes. Runes are **channeled**, not played; they sit on the board (in the Base) but are not Permanents (132.5.a.1, 154.1.a).
- **Channel** = take rune(s) from the **top** of the Rune Deck, put on board (default ready unless effect says "exhausted") (606).
- Basic Runes have exactly two abilities (157.2):
  - `[T]: Add [1]` — exhaust the rune → add 1 Energy.
  - `Recycle this: Add [C]` — return the rune to the **bottom of the Rune Deck** → add 1 Power of that rune's Domain.
- So runes used for Power **leave the board** (recycled); runes used for Energy stay, exhausted, and re-ready in Awaken Phase.
- **Add is immediate**: spells/abilities that Add resources resolve immediately and cannot be reacted to (605.2). Add-abilities tagged Reaction may be activated **during the Pay Costs step** of playing a spell/ability (605.3, 561.1.a).

### 4.3 Paying costs (see also §5 step 4–5)
- Exhaust/Recycle/Discard as a cost must be fully completable or the cost is not paid (592.4, 594.3, 598.3).
- Countering never refunds costs, including additional costs (601.1.c).

---

## 5. Playing Cards

### 5.1 Timing permissions
- Default: a card can only be played by the priority-holder, on their own turn, in a **Neutral Open** state (510.1, 148, 588).
- **Action** keyword: additionally playable/activatable during Showdown Open states, on any player's turn (718, 152.2.a).
- **Reaction** keyword: everything Action grants, plus playable/activatable during any **Closed State** on any player's turn (i.e. in response on the Chain) (725, 152.2.b).
- Activated Abilities: default only on controller's turn during an Open State (581); Action/Reaction on the ability extend this identically (718.1.c.2, 725.1.c.3). Unit and Gear activated abilities: any time during controller's Action Phase, Open State, not during a Showdown (141.2, 145.2).

### 5.2 The Process of Play (557–563) — exact steps
1. **Move the card from its zone onto the Chain** (558). This closes the state.
2. **Make choices** (559): spell modes/"as I am played" choices; for **Units, choose a Location the player Controls** (their Base or a battlefield they control); choose all targets. Choices are locked after this step (559.4). A player may not knowingly make choices that deterministically become illegal later in the process (559.5).
   - Targeting: "choose" = targeted; criteria-based mass effects ("kill all gear") are not targeting (559.3.a). Triggered "When I'm played" abilities of permanents choose their targets later, when the trigger goes on the Chain (559.3.b).
   - Splitting damage: targets chosen now (max = initial damage amount, each target ≥1 damage); the division is decided at resolution (559.3.d).
3. **Determine Total Cost** (560), in this order:
   a. Apply "ignore cost" effects (set relevant base cost(s) to 0) (560.1).
   b. Apply additional costs in any order — Mandatory ("as an additional cost", no "may"; includes Deflect) and Optional (with "may"; only if elected in step 2) (560.2).
   c. Apply cost increases (560.3).
   d. Apply discounts in any order (player chooses order; per-discount minimums apply only to that discount) (560.4). An optional additional cost counts as "paid" if elected, even if discounted to 0 (560.4.d.1).
   e. Costs can't go below 0 (560.5).
4. **Pay costs** (561): Energy+Power together; Reaction-Add abilities may be used now; non-standard costs (kill, discard, …) in any order. No deterministically illegal payments (561.3).
5. **Check legality** (562): verify targets legal and no illegal state results; otherwise undo everything, action cancelled.
6. **Resolve by category** (563):
   - **Permanent**: leaves the Chain and becomes a Game Object **immediately — no player receives priority before it resolves** (538, 563.1). Execute rules text top-to-bottom. **Unit enters the Board exhausted at the chosen Location** (563.1.c); **Gear enters Ready at the player's Base** (563.1.d).
   - **Spell**: lingers on the Chain; others may respond with Reactions; on resolution execute text top-to-bottom, then card → owner's Trash (563.2).

### 5.3 Spell resolution details (151, 563.2.c)
- While resolving, nothing intercedes; triggered results wait until the spell fully finishes (151.3).
- Spell resolves even if some/all targets are illegal; illegal targets are simply unaffected (563.2.c.1, .5).
- A target that temporarily failed requirements but meets them again at resolution is legal (563.2.c.3); a target that changed zones to/from a non-board zone is permanently illegal even if it returned (new object) (563.2.c.4).
- Impossible instructions are ignored; partially possible instructions are done as much as possible (563.2.c.6–7).
- Info checks on missing objects return **0/null** (563.2.c.8). Zone-moving costs/effects may "look back" at pre-move characteristics (563.2.c.9).
- If **all** of an instruction's targets are invalid, that instruction doesn't execute; the spell is still "played" (559.3.c.2, .5).
- Countered cards: no effect, → Trash, **not considered played** (no "when played" triggers), no cost refund (601, 595.4.b).

### 5.4 Movement (140, 596, 608–615)
- **Standard Move** (inherent unit ability, Discretionary Action): cost = **exhaust the unit**; effect = move it (140.2, 596.3).
  - Allowed any time during controller's Action Phase; **not** during a Closed State; **not** during a Showdown (140.1).
  - Legal destinations: Base → a battlefield; battlefield → own Base (140.4). **Ganking** additionally allows battlefield → battlefield (722).
  - Multiple units may be standard-moved simultaneously as one action: same destination required, origins may differ, exhaust costs paid simultaneously (140.3).
- No unit may move (by any means) to a battlefield that already has units from **2 other players** (140.4.a.1, 612.2). In >2-player modes, battlefields with Pending/in-progress Combat are invalid destinations for outside players; forced moves there become Recalls (610.2).
- Moves are instantaneous, don't use the Chain, can't be reacted to (609.3). Only Units can Move (610.3). Changing game zones is not a Move (609.2).
- After a Move completes → **Cleanup** (615) (which may start Showdown/Combat).
- **Recall** = location change that is not a Move: doesn't trigger move-triggers, can't be blocked by move-restrictions (616–618). Gear at a battlefield is recalled to its controller's Base at next Cleanup (144.3, 619).

### 5.5 Hiding (597, 723)
- Hide (Discretionary Action, via the **Hidden** keyword): pay **[C]** (1 Power matching your deck's Domain Identity — need not match the hidden card) to place the card facedown at a battlefield you control whose Facedown Zone is empty (723.1.b).
- Hiding does **not** open a chain (723.1.c.2). Playing from hidden **does** (723.1.c.3).
- Beginning on the **next player's turn**, the hidden card gains **Reaction** and may be played **ignoring its base cost**; all targets must be chosen at that battlefield (723.1.b). Cannot be played from hidden with no valid targets there (723.1.d.1).
- A card with Hidden may always be played normally from hand instead (723.2).
- If controller loses control of the battlefield, the facedown card goes to owner's trash during the next Cleanup (106.4.d, 523). Facedown cards put into Private/Secret zones (or at game end) are revealed (597.4).

---

## 6. Combat / Showdowns

### 6.1 Contested & control (179–181)
- **Control of a battlefield**: established by having units there outside of combat (181.4.a). A player with no units at a battlefield does not control it (181.4.d). Controller retains control while contested (181.4.b). Control changes immediately if at the end of Combat the units there belong to a different player (181.4.c).
- **Contested**: temporary status applied when a unit whose controller doesn't control the battlefield moves/becomes present there (181.3.a). Lasts until control is (re-)established. Game effects cannot reference Contested (181.3.d).

### 6.2 When combat/showdowns start
- **Combat** occurs when a Cleanup finds units of two opposing players at a battlefield, chain empty (621, 524, 526). Turn Player picks the order if multiple are pending (622.1). Pending combats that stop being pending never happen (622.2). Combat is strictly two-player (623).
- **Showdown without combat**: a move contests an **uncontrolled/empty** battlefield → standalone Showdown at the Cleanup after that move (516.5.b, 548.2, 613).

### 6.3 Showdown procedure (545–553)
- Relevant Players: for combat showdowns, the Attacker and Defender; for non-combat showdowns, all players (550). Once relevant, relevant until the Showdown ends (530). Additional players can become Relevant (triggers, invitations).
- The player who applied Contested status gains **Focus** as the Showdown begins (549). Focus ⇒ Priority (513.2); passing Priority keeps Focus (513.3).
- Initial Chain (combat showdowns): "When I attack" / "When I defend" triggers go on the chain — Focus player first, then other Relevant Players in Turn Order (551.1). If none, Showdown proceeds Open (551.1.b).
- The Focus player may (553): play a legally-timed spell (starts a Chain; only Action/Reaction cards are legal in a Showdown), activate a legally-timed ability, **Invite** another player (invitee gains Focus), or **Pass**.
- Passing: Focus passes to the next Relevant Player in Turn Order. When **all Relevant Players pass once in sequence**, the Showdown ends → Cleanup (553.4).
- When the last chain item resolves during a Showdown, Focus passes; next Relevant Player gains Focus+Priority (552).

### 6.4 Steps of Combat (624–628)
1. **Showdown Step** (625):
   - Attacker = the player who applied Contested; Defender = the other (625.1.a).
   - Modulate Might from static combat keywords now: **Assault X** for attackers, **Shield X** for defenders (625.1.b).
     > ⚠️ UNCERTAIN: extraction merges 625.1.b lines ("The Defender is the player who did not apply the Contested status … Modulate Unit Might now"); intent (Assault/Shield apply at this step) is clear from 625.1.b.1–2.
   - Build Initial Chain of attack/defend triggers (closes state if any exist); Attacking Player becomes Active Player; play proceeds as a Showdown (625.1.c–f).
2. **Combat Damage Step** (626) — occurs when the Showdown closes, and **only if both attacking and defending units remain** (626.1.a). If neither side remains, "no combat occurred" → skip to Cleanup.
   - Sum Might of all attacking units; sum Might of all defending units (Stunned units contribute 0, 599.1.b).
   - **Starting with the Attacker**, each player distributes damage equal to their summed Might among the opponent's units (626.1.d). (Damage is dealt both ways in the same step.)
   - Assignment rules: units with **Tank** must be assigned lethal damage first (626.1.d.1); each unit must receive **full lethal damage before any damage goes to the next unit** (626.1.d.2); obey all assignment requirements if able; equal-priority requirements → assigning player chooses order (626.1.d.3–4). Lethal = nonzero damage ≥ Might.
3. **Resolution Step** (627):
   1. Kill units with lethal damage marked (627.1).
   2. If both attacking and defending units still remain → **attackers are Recalled** to base (627.2) (defenders held).
   3. If **no defenders remain but attackers do** → battlefield is **Conquered**: control changes to attacker, triggering a Conquer score (627.3).
   4. Clear Contested from the battlefield (627.4).
   5. **Clear all marked damage from all units at all locations** (627.5).
4. **Perform a Cleanup** (628).

### 6.5 Scoring & victory (629–633)
- Two score methods (630):
  - **Conquer**: gaining Control of a battlefield you have not yet scored this turn.
  - **Hold**: Controlling a battlefield during your Beginning Phase (Scoring Step).
- A player may score each battlefield **only once per turn**, by either method (631).
- On scoring (632): earn **up to 1 Point** + trigger that battlefield's Conquer/Hold abilities (once per player per turn max).
- **Final Point restriction** (632.1.b): when at Victory Score − 1 (i.e. **7** in 1v1):
  - Scoring via **Hold** → gain the final point (win).
  - Scoring via **Conquer** → gain the final point only if you have scored **every battlefield** (by either method) this turn; otherwise **draw a card instead** of the point.
  - Points from sources other than Conquer/Hold (e.g. opponent's Burn Out) are NOT subject to the final-point restriction (632.1.a.1).
- **Victory: reaching the Victory Score (8 in 1v1) wins the game immediately** (633).
- **Burn Out** (607): when a player must draw/look at/reveal/mill from an empty Main Deck: shuffle trash into Main Deck → **choose an opponent to gain 1 point** → perform the original action. Repeats indefinitely if both deck and trash are empty. Burn Out is a Replacement Effect (607.5).

---

## 7. The Chain / Priority / Timing

### 7.1 Priority & Focus (511–513)
- At most one player has Priority (permission to take Discretionary Actions); at most one has Focus (512–513). Limited Actions never need priority (512.1.b.1).
- Priority is received: (a) Neutral Open during your own Action Phase; (b) in a Showdown when you gain Focus; (c) in a Closed State when you control the next item to resolve on the Chain; (d) in a Closed State when the priority-holder passes and you are the next Relevant Player in Turn Order (512.2).
- No Focus exists in Neutral States (513.4).

### 7.2 Chain mechanics (532–544)
- The Chain is created whenever a card/token is played or an ability activated (537). Only one Chain at a time; new plays stack onto the existing Chain (534).
- The chain-creating player becomes the first **Active Player** (537.1).
- **Permanents skip response windows**: if the card that initiated the Chain is a permanent, no player receives priority before it resolves (538).
- Loop (539–542): define/redefine Relevant Players, then the Active Player may:
  1. Play a legally-timed spell (in a Closed State that means a **Reaction**) → added to the Chain.
  2. Activate a legally-timed ability.
  3. **Invite** a non-Relevant player (Limited Action). Invitee may refuse (stays non-relevant); if they accept they **must** play/activate something legal now, become Relevant for the whole Chain/Showdown, and become Active Player (531.2).
  4. **Pass** → next Relevant Player in Turn Order becomes Active. When **all Relevant Players have passed once in sequence**, the Chain closes to additions (540.4.b).
- Triggered abilities that fire during a Chain are added as the **most recent** (top) item; their controller becomes Relevant if not already; Active Player order unaffected (541).
- **Resolution** (543–544): resolve the **last-added** item; spells → owner's trash; permanents → board at chosen location (not a Move); abilities cease to exist. Then "when a card is played" triggers fire (added on top of the current Chain, or start a new Chain if it emptied) (543.2). **Perform a Cleanup** (543.3). Then the controller of the new topmost item becomes Active Player, and **all Relevant Players must pass again** before the next item resolves (543.4). Repeat until Chain empty.

### 7.3 Triggered abilities (582–585)
- Format "When/At [condition], [effect]". When the condition fires, the ability goes on the Chain (works in Open or Closed states, on any player's turn) (583.3.a).
- Simultaneous triggers: single controller orders their own; multiple controllers order theirs starting with the Turn Player, in Turn Order (583.3.b).
- Permanents' triggers only evaluate while on the Board (584.2); off-board triggers self-describe their zone (585).

### 7.4 Replacement effects & layers (571–575, 634–639)
- Replacement effects ("instead") intercede in an event's execution. Multiple replacements on the same event: the **owner of the affected object** orders them (affected player if a player; Turn Player if an uncontrolled battlefield) (575).
- Layers for continuous modifications (637): 1) Trait-altering (name, type, tags, controller, cost, domain; **setting** Might; copying) → 2) Ability-altering (keywords, granted/removed text) → 3) Arithmetic (numeric +/− to Might and costs).
- Within a layer: apply in **Dependency** order (an effect that alters the other's existence/scope/outcome applies first); otherwise **Timestamp** order, oldest first (638–639).

---

## 8. Keywords (712–729)

Spell-intrinsic timing keywords (152):
- **Action** — Permissive. May be played/activated during Showdowns (Open), on any player's turn, in addition to default timings (718).
- **Reaction** — Permissive. All of Action, plus playable/activatable during any **Closed State** on any player's turn (resolves before earlier chain items, LIFO) (725). On units, timing permission only — placement rules unchanged (725.3.a).

Unit/permanent keywords:
- **Accelerate** — "As you play me, you may pay **[1][C]** (1 Energy + 1 Power of my domain) as an additional cost. If you do, I **enter ready**." Optional additional cost; only payable during the play process; the unit never passes through "exhausted" (does not trigger becomes-ready effects) (717). Multiple instances redundant.
- **Assault X** — "While I am an attacker, I have +X Might" (X omitted = **1**). Applies while the Attacker designation lasts; multiple instances **sum** (719).
- **Deathknell — [Effect]** — Triggered: "When I die (am killed and sent to the Trash), [Effect]." Does not fire if the kill was replaced (e.g. by a recall). Multiple instances trigger separately; controller orders them (720).
- **Deflect X** — "Spells and abilities an opponent controls that **choose** me cost X more **Power** (any domain) as a Mandatory Additional Cost" (X omitted = 1). Instances sum (721).
- **Ganking** — adds battlefield→battlefield as a legal Standard Move destination. No extra cost, no extra move activations. Redundant in multiples (722).
- **Hidden** — see §5.5. Prerequisite for the Hide action: pay [C] (deck's domain) to place facedown at a controlled battlefield with an empty Facedown Zone; from the next player's turn it may be played with **Reaction, ignoring base cost**, targets restricted to that battlefield (723). Redundant in multiples.
- **Legion — [Text]** — Conditional: "If you have played another Main Deck card earlier this turn, apply [Text]." One earlier card satisfies all Legion instances that player controls (724).
- **Shield X** — "While I am a defender, I have +X Might" (X omitted = 1). Instances sum (726).
- **Tank** — "I must be assigned lethal combat damage before any non-Tank unit with the same controller." Lethal-in-full ordering still applies; multiple Tanks: assigner picks order among them (727). Redundant in multiples.
- **Temporary** — Triggered: "At the start of this permanent's controller's Beginning Phase, **before scoring**, kill this." (728). Redundant in multiples.
- **Vision** — Triggered: "When this is played (enters the Board), look at the top card of your Main Deck. You may recycle it." Multiple instances trigger separately (729).

Keyword rules: grants without a stated duration last while the object stays on the Board / in its current non-board zone (713.3.a.3); same for removals (713.3.b.2).

---

## 9. Unit States & Counters

- **Ready / Exhausted** (592–593): binary orientation state. Units enter the Board **exhausted** (139.4, 563.1.c); Gear enters **Ready** (144.1). Exhausting an already-exhausted object does nothing, and as a **cost** it is unpayable (592.1.b–c, 592.4). All controlled objects ready in the Awaken Phase (515.1).
- **Damage**: marked on units; a unit with nonzero marked damage ≥ Might is killed (139.2.a, checked at Cleanup 520). Damage is cleared at exactly two times: **end of each player's turn** (Expiration Step) and **end of any Combat** (Resolution Step clears all units at all locations) (139.3.b, 517.2.a, 627.5). Damage also vanishes on any zone change to/from a non-board zone (109).
- **Might**: negative Might is treated as **0** (139.2.b). **Mighty** = current Might ≥ **5** ("becomes Mighty" only on crossing from <5 to ≥5) (706–709). Off-board units use printed Might (711).
- **Buffs** (701–705): objects on units; each buff = **+1 Might**; **max 1 buff per unit** — additional buffs are simply not placed (702.3). "Spend a buff" removes it; only on units you control; cannot spend from a unit without one (702.2.b). Buffs removed when the unit leaves play; champions don't keep buffs in the Champion Zone (705). A unit that already has a buff can be chosen by buff effects but isn't buffed ("if it was buffed this way" riders then fail) (602.1.c).
- **Stunned** (599): binary; a stunned unit cannot be stunned again (re-stun effects fizzle their "when you stun" riders); **contributes 0 Might to combat damage**; still requires full Might in damage to die; wears off at the beginning of the next **Ending Step** (any player's turn).
- **Attacker/Defender**: combat designations; removed at Cleanup once the unit leaves the combat battlefield (521).

---

## 10. Glossary (engine vocabulary)

- **Add** (605): put Energy/Power into a Rune Pool. Immediate, unreactable.
- **Banish** (603): put a card from any zone into its owner's Banishment. Not a Kill, not a Discard.
- **Buff** (602): place a buff counter (see §9).
- **Burn Out** (607): empty-deck penalty — shuffle trash into deck, chosen opponent gains 1 point, complete the action.
- **Channel** (606): move rune(s) from top of Rune Deck to board (default ready).
- **Chosen Champion** (103.2.a): the deck's designated champion unit; starts in Champion Zone; playable from there normally (107.2.c).
- **Conquer** (630.1): score by gaining Control of a battlefield not already scored by you this turn.
- **Contested** (181.3): battlefield status while a non-controller has units there.
- **Control** (179–183): battlefields — presence-based, binary, sticky through contest until combat ends; everything else — the player who played/created it.
- **Counter** (601): negate a card/ability on the chain → trash; not "played"; no refunds.
- **Discard** (598): hand → trash without effect. As a cost must be fully payable; as an effect, do as much as possible.
- **Draw** (591): top of Main Deck → hand. Over-draw ⇒ draw all, Burn Out, draw the rest.
- **Exhaust / Ready** (592–593): see §9.
- **Friendly** (648.8.d): controlled by you (or teammate in team modes).
- **Hide / Hidden** (597, 723): facedown placement at a controlled battlefield (see §5.5).
- **Hold** (630.2): score by controlling a battlefield during your Beginning Phase.
- **Invite** (531.2): active/focus player offers a non-relevant player the chance to act; acceptance obligates action.
- **Kill** (604): permanent goes board → trash (active by instruction, or passive via lethal damage). Only "Killed" if it came from the board. Not a Move.
- **Lethal Damage** (626.1.d.1.a): nonzero damage ≥ a unit's Might.
- **Location** (106): a Base or a battlefield. Legend Zone and Facedown Zones are NOT locations.
- **Move / Recall** (596, 616): location change on the board / non-Move location change (§5.4).
- **Permanent** (132.4.a): Unit or Gear (Main Deck objects that stay on board). Runes, battlefields, legends are NOT permanents.
- **Recycle** (594): put card(s) on the **bottom** of the corresponding deck (Main Deck cards → Main Deck; runes → Rune Deck). Multi-card to Main Deck: random order; to Rune Deck: owner's chosen order (594.5). As a cost, must be fully payable; as an effect, recycle as many as possible.
- **Reveal** (600): temporarily show a card from a hidden zone to all players; the card stays in its zone. Voluntarily showing your hand is not a Reveal.
- **Score** (629–632): Conquer or Hold; once per battlefield per turn; grants up to 1 point + battlefield trigger.
- **Stun** (599): apply Stunned (see §9).
- **Victory Score** (642.3): points needed to win (**8** in all 1v1/FFA sanctioned modes; **11** in 2v2).
- Note: no "drain" action exists in this document.

---

## Engine-critical edge cases

1. **Permanents don't grant a response window**: a unit/gear play never gives opponents priority before it resolves (538) — but its "when played" triggers go on a chain that *can* be responded to (543.2).
2. **After each chain item resolves, everyone must pass again** and a Cleanup runs between items (543.3–543.4) — units can die and combats become pending mid-chain-resolution.
3. **Rune Pools persist across the whole Action Phase** — they empty only at end of Draw Phase and end of turn (160), not per-action; float from earlier in the phase carries over.
4. **Accelerate never passes through "exhausted"** — enters ready directly; must not fire "becomes ready" triggers (717.6).
5. **Buffs never stack**: a second buff is simply not placed; "if it was buffed this way" riders must fail (602.1.c, 702.3).
6. **Stunned units count 0 Might for the damage they deal but full Might for the damage needed to kill them** (599.1.b–c); Stunned wears off at the beginning of the next Ending Step, not end of combat.
7. **Zone change to/from a non-board zone creates a new object**: all damage/buffs/granted keywords wiped (109); a target that bounced and returned is illegal forever (563.2.c.4), but one that merely stopped-and-resumed meeting requirements on the board is legal (563.2.c.3).
8. **Mistargeted checks return 0/null** (563.2.c.8): e.g. Last Breath readying a removed unit deals 0 damage — the rest of the spell still executes.
9. **Final point gate**: at 7 points (1v1), a Conquer only wins if the player scored *every* battlefield this turn; otherwise it converts to a card draw. Hold and non-score point sources (Burn Out) ignore the gate (632.1).
10. **Score once per battlefield per turn** applies across both methods (Hold then re-Conquer of the same battlefield that turn scores nothing) (631).
11. **Combat damage is fully simultaneous but assigned in Attacker-then-Defender order**, with mandatory full-lethal per unit and Tank-first ordering (626.1.d); no partial chip-spreading allowed.
12. **Combat Damage Step is skipped entirely if either side's units are all gone** when the Showdown closes (626.1.a) — showdown removal (kills/moves) can void combat; attackers left alone then conquer at Resolution.
13. **If both sides survive combat, the ATTACKERS are recalled** (627.2) — a recall, not a move: no move triggers, and it bypasses movement restrictions (618).
14. **All damage on all units everywhere is cleared at the end of any combat** (627.5), not just at the combat battlefield.
15. **End-of-turn loop**: if the Expiration/Cleanup steps generate new damage or new "this turn" effects, return to the Expiration Step and repeat (517.4).
16. **Hidden-card cleanup**: facedown cards are trashed at Cleanup whenever their controller has no unit at that battlefield (523) — this itself can flip the battlefield to uncontrolled.
17. **Deflect is a mandatory additional Power cost of any domain**, applied per choose-effect during cost determination — countering or fizzling never refunds it (721, 601.1.c).
18. **Add-resource abilities resolve instantly, never on the chain**, and Reaction-tagged Add abilities may be activated mid-payment inside another card's Pay Costs step (605.2–605.3).
19. **Split damage**: number of targets locked at play time (≤ initial damage, ≥1 each), division decided at resolution; too few damage points at resolution → controller drops targets, but on-choose triggers stay triggered (559.3.d).
20. **Deterministic-illegality guard**: choices (559.5) and cost payments (561.3) may not knowingly create later illegality in the same play process (e.g. killing your only unit at the battlefield you're playing to); on failed legality check (562.3), the entire play is undone.
21. **Burn Out from an empty trash loops**, giving the chosen opponent 1 point per iteration until someone wins (607.3.a) — an engine must handle this terminating loop.
22. **Invited players who accept MUST act** (play/activate something legal) and become the Active/Focus player; refusing keeps them non-relevant (531.2).
