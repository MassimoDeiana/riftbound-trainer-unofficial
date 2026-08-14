import { scriptFor } from '../effects/registry'
import type { NamedTarget, Op } from '../effects/ir'
import { evalCond, type EffectCtx } from '../effects/selectors'
import { answerVmChoice, canPayCost, payCostNow, startProgram } from '../effects/vm'
import { def, hasPlayedTrigger, keywords } from './cardinfo'
import { effectiveEnergyCost } from './queries'
import {
  afterChainResolve,
  applyAssignDamageChoice,
  fireBoardEvent,
  firePlayCardTriggers,
  arriveAt,
  availablePower,
  banishUnit,
  beginCombat,
  beginShowdown,
  canActNow,
  checkWin,
  cleanup,
  closeShowdown,
  discardCard,
  draw,
  endTurn,
  IllegalAction,
  killUnit,
  log,
  other,
  payAnyPower,
  payPower,
  pname,
  bfName,
  pushChain,
  queueTriggersFor,
  resolveChainTop,
  startTurn,
  totalPower,
} from './core'
import { shuffle } from './rng'
import type { GameAction, GameState, LocationRef, ManualOp, PlayerIx, UnitEntity } from './types'
import { MAX_MULLIGAN } from './types'

export { IllegalAction }

// ---------------------------------------------------------------- manual ops

function applyManual(s: GameState, p: PlayerIx, op: ManualOp) {
  const who = pname(s, p)
  const unit = (uid: number) => s.units.find((u) => u.uid === uid)
  switch (op.k) {
    case 'draw':
      draw(s, op.who, op.n)
      log(s, `🔧 ${who} : ${pname(s, op.who)} pioche ${op.n}.`, p)
      break
    case 'damage': {
      const u = unit(op.unitUid)
      if (u) {
        u.damage += op.n
        log(s, `🔧 ${who} : ${op.n} dégât(s) à ${def(u.cardId).name}.`, p)
      }
      break
    }
    case 'heal': {
      const u = unit(op.unitUid)
      if (u) {
        u.damage = Math.max(0, u.damage - op.n)
        log(s, `🔧 ${who} : soigne ${op.n} sur ${def(u.cardId).name}.`, p)
      }
      break
    }
    case 'buff': {
      const u = unit(op.unitUid)
      if (u && !u.buffed) {
        u.buffed = true
        log(s, `🔧 ${who} : buff sur ${def(u.cardId).name}.`, p)
      }
      break
    }
    case 'unbuff': {
      const u = unit(op.unitUid)
      if (u && u.buffed) {
        u.buffed = false
        log(s, `🔧 ${who} : buff retiré de ${def(u.cardId).name}.`, p)
      }
      break
    }
    case 'stun': {
      const u = unit(op.unitUid)
      if (u && !u.stunned) {
        u.stunned = true
        log(s, `🔧 ${who} : ${def(u.cardId).name} est étourdi.`, p)
      }
      break
    }
    case 'kill':
      killUnit(s, op.unitUid, 'effet')
      break
    case 'banish':
      banishUnit(s, op.unitUid)
      break
    case 'recallUnit': {
      const u = unit(op.unitUid)
      if (u) {
        u.location = 'base'
        u.combatRole = null
        log(s, `🔧 ${who} : ${def(u.cardId).name} est rappelé à la base.`, p)
      }
      break
    }
    case 'readyUnit': {
      const u = unit(op.unitUid)
      if (u) {
        u.ready = op.ready
        log(s, `🔧 ${who} : ${def(u.cardId).name} ${op.ready ? 'redressé' : 'engagé'}.`, p)
      }
      break
    }
    case 'tempMight': {
      const u = unit(op.unitUid)
      if (u) {
        u.tempMight += op.n
        log(s, `🔧 ${who} : ${def(u.cardId).name} ${op.n > 0 ? '+' : ''}${op.n} Might ce tour.`, p)
      }
      break
    }
    case 'points':
      s.players[op.who].points = Math.max(0, s.players[op.who].points + op.n)
      log(s, `🔧 ${who} : ${pname(s, op.who)} ${op.n > 0 ? '+' : ''}${op.n} point(s) → ${s.players[op.who].points}.`, p)
      checkWin(s)
      break
    case 'energy':
      s.players[op.who].pool.energy = Math.max(0, s.players[op.who].pool.energy + op.n)
      log(s, `🔧 ${who} : ${op.n > 0 ? '+' : ''}${op.n} énergie pour ${pname(s, op.who)}.`, p)
      break
    case 'power': {
      const pool = s.players[op.who].pool
      pool.power[op.domain] = Math.max(0, (pool.power[op.domain] ?? 0) + op.n)
      log(s, `🔧 ${who} : ${op.n > 0 ? '+' : ''}${op.n} puissance ${op.domain} pour ${pname(s, op.who)}.`, p)
      break
    }
    case 'discard': {
      if (s.players[op.who].hand.includes(op.cardId)) {
        log(s, `🔧 ${who} :`, p)
        discardCard(s, op.who, op.cardId)
      }
      break
    }
    case 'toHandFromTrash': {
      const t = s.players[op.who].trash
      const ix = t.indexOf(op.cardId)
      if (ix >= 0) {
        t.splice(ix, 1)
        s.players[op.who].hand.push(op.cardId)
        log(s, `🔧 ${who} : ${def(op.cardId).name} revient de la défausse en main.`, p)
      }
      break
    }
    case 'channel': {
      const pl = s.players[op.who]
      const runes = pl.runeDeck.splice(0, op.n)
      for (const cardId of runes) pl.runes.push({ uid: s.nextUid++, cardId, ready: true })
      log(s, `🔧 ${who} : ${pname(s, op.who)} canalise ${runes.length} rune(s).`, p)
      break
    }
    case 'note':
      log(s, `💬 ${who} : ${op.text}`, p)
      break
  }
  cleanup(s)
}

// ---------------------------------------------------------------- main reducer

export function applyAction(prev: GameState, action: GameAction): GameState {
  const s = structuredClone(prev)
  const p = action.player

  if (s.winner !== null && action.t !== 'manual') return s

  // A pending choice suspends everything except its answer (and safety valves).
  if (s.pending !== null && action.t !== 'choose' && action.t !== 'manual' && action.t !== 'concede') {
    throw new IllegalAction(`En attente du choix de ${pname(s, s.pending.player)}`)
  }

  switch (action.t) {
    case 'mulligan': {
      if (s.phase !== 'mulligan') throw new IllegalAction('Pas en phase de mulligan')
      const pl = s.players[p]
      if (pl.mulliganed) throw new IllegalAction('Mulligan déjà effectué')
      if (action.cardIds.length > MAX_MULLIGAN) throw new IllegalAction('Max 2 cartes')
      const aside: string[] = []
      for (const id of action.cardIds) {
        const ix = pl.hand.indexOf(id)
        if (ix < 0) throw new IllegalAction('Carte absente de la main')
        aside.push(...pl.hand.splice(ix, 1))
      }
      draw(s, p, aside.length)
      shuffle(s.rng, aside)
      pl.deck.push(...aside) // recycled to the bottom
      pl.mulliganed = true
      log(s, `${pname(s, p)} mulligane ${aside.length} carte(s).`, p)
      if (s.players.every((q) => q.mulliganed)) startTurn(s, s.turnPlayer)
      return s
    }

    case 'exhaustRune': {
      const rune = s.players[p].runes.find((r) => r.uid === action.runeUid)
      if (!rune || !rune.ready) throw new IllegalAction('Rune indisponible')
      rune.ready = false
      s.players[p].pool.energy += 1
      return s
    }

    case 'recycleRune': {
      const pl = s.players[p]
      const ix = pl.runes.findIndex((r) => r.uid === action.runeUid)
      if (ix < 0) throw new IllegalAction('Rune introuvable')
      const rune = pl.runes[ix]
      const domain = (def(rune.cardId).domains[0] ?? 'Universal') as keyof typeof pl.pool.power
      pl.runes.splice(ix, 1)
      pl.runeDeck.push(rune.cardId) // bottom of rune deck
      pl.pool.power[domain] = (pl.pool.power[domain] ?? 0) + 1
      return s
    }

    case 'playCard': {
      const card = def(action.cardId)
      const kw = keywords(action.cardId)
      const pl = s.players[p]
      const isHiddenPlay = action.from === 'hidden'
      const effKw = isHiddenPlay ? { action: true, reaction: true } : kw
      if (!canActNow(s, p, effKw)) throw new IllegalAction('Timing illégal pour cette carte')

      // Source zone checks
      if (action.from === 'hand') {
        if (!pl.hand.includes(action.cardId)) throw new IllegalAction('Carte absente de la main')
      } else if (action.from === 'champion') {
        if (!pl.championInZone || pl.championId !== action.cardId)
          throw new IllegalAction('Champion indisponible')
      } else if (action.from === 'trash') {
        if (!pl.trash.includes(action.cardId)) throw new IllegalAction('Carte absente de la défausse')
        if (!scriptFor(action.cardId)?.playFromTrash)
          throw new IllegalAction('Cette carte ne se joue pas depuis la défausse')
      } else {
        const bf = s.battlefields[action.battlefield ?? -1]
        if (!bf?.facedown || bf.facedown.owner !== p || bf.facedown.cardId !== action.cardId)
          throw new IllegalAction('Carte cachée introuvable')
        if (s.turn <= bf.facedown.hiddenOnTurn)
          throw new IllegalAction('Jouable à partir du tour suivant')
      }

      // The card counts as played from here on (Legion checks "another card"
      // as count > 1, consistent at cost time and trigger time). The clone is
      // discarded on any IllegalAction, so early increment is safe.
      s.cardsPlayedThisTurn[p] += 1

      // Costs (hidden plays ignore the base cost)
      if (!isHiddenPlay) {
        const energy = effectiveEnergyCost(s, p, action.cardId)
        const power = card.power ?? 0
        const extraEnergy = action.accelerate && kw.accelerate ? 1 : 0
        const extraPower = action.accelerate && kw.accelerate ? 1 : 0
        if (pl.pool.energy < energy + extraEnergy) throw new IllegalAction('Énergie insuffisante')
        if (availablePower(s, p, card.domains) < power + extraPower)
          throw new IllegalAction('Puissance insuffisante')
        pl.pool.energy -= energy + extraEnergy
        payPower(s, p, power + extraPower, card.domains)
      }

      // Remove from source zone
      if (action.from === 'hand') pl.hand.splice(pl.hand.indexOf(action.cardId), 1)
      else if (action.from === 'champion') pl.championInZone = false
      else if (action.from === 'trash') pl.trash.splice(pl.trash.indexOf(action.cardId), 1)
      else s.battlefields[action.battlefield!].facedown = null

      if (isHiddenPlay) fireBoardEvent(s, p, 'youPlayFromHidden')
      if (kw.legion && s.cardsPlayedThisTurn[p] > 1) {
        log(s, `Légion de ${card.name} est active (une autre carte a été jouée ce tour).`, p)
      }
      if (kw.unknown.length > 0) {
        log(s, `⚠️ Mots-clés non gérés sur ${card.name} : ${kw.unknown.join(', ')} — appliquer manuellement.`, p)
      }

      const script = scriptFor(action.cardId)

      if (card.type === 'Unit' || card.type === 'Gear') {
        let loc: LocationRef = card.type === 'Gear' ? 'base' : (action.location ?? 'base')
        if (card.type === 'Unit' && typeof loc === 'number' && s.battlefields[loc].controller !== p) {
          // Alternate play permissions: open battlefield (no units) / occupied
          // enemy battlefield (Sneaky Deckhand, Deadbloom Predator…).
          const perm = script?.playTo
          const unitsThere = s.units.filter((u) => u.location === loc && u.kind === 'unit')
          const openOk = perm === 'openBattlefield' && unitsThere.length === 0
          const enemyOk =
            perm === 'enemyBattlefield' &&
            s.battlefields[loc].controller !== null &&
            unitsThere.some((u) => u.controller !== p)
          const ambushOk = perm === 'whereYouControlUnits' && unitsThere.some((u) => u.controller === p)
          if (!openOk && !enemyOk && !ambushOk) {
            throw new IllegalAction('Une unité arrive à la base ou sur un champ de bataille contrôlé')
          }
        }
        // Hidden permanents are played to the battlefield they were hidden at
        // (811.1.d.1), gear included.
        if (isHiddenPlay) loc = action.battlefield!
        // "Enters ready": Accelerate, the card's own script, a turn-wide grant
        // (Confront / Sun Disc charge), or a board aura (Magma Wurm).
        let entersReady = Boolean(action.accelerate && kw.accelerate)
        if (!entersReady && card.type === 'Unit' && script?.entersReady !== undefined) {
          if (script.entersReady === true) entersReady = true
          else {
            const ctx: EffectCtx = { cardId: action.cardId, sourceUid: null, sourceBattlefield: null, controller: p, eventUid: null, vars: {} }
            entersReady = evalCond(s, ctx, script.entersReady)
          }
        }
        if (!entersReady && card.type === 'Unit' && s.entryReady) {
          if (s.entryReady[p] === -1) entersReady = true
          else if (s.entryReady[p] > 0) {
            s.entryReady[p] -= 1
            entersReady = true
          }
        }
        if (!entersReady && card.type === 'Unit') {
          entersReady = s.units.some((src) => {
            if (src.controller !== p) return false
            const sc = scriptFor(src.cardId)
            return (sc?.abilities ?? []).some((ab) => ab.kind === 'passive' && ab.effect.kind === 'entryReady')
          })
        }
        const u: UnitEntity = {
          uid: s.nextUid++,
          cardId: action.cardId,
          controller: p,
          kind: card.type === 'Gear' ? 'gear' : 'unit',
          location: 'base',
          ready: card.type === 'Gear' ? !script?.entersExhausted : entersReady,
          damage: 0,
          buffed: false,
          stunned: false,
          combatRole: null,
          tempMight: 0,
          isChampion: action.from === 'champion',
          grants: [],
        }
        s.units.push(u)
        arriveAt(s, u, loc)
        log(
          s,
          `${pname(s, p)} joue ${card.type === 'Gear' ? "l'équipement " : ''}${card.name}${typeof loc === 'number' ? ` à ${bfName(s, loc)}` : ''}${u.ready && card.type === 'Unit' ? ' (arrive redressée)' : ''}.`,
          p
        )
        firePlayCardTriggers(s, p, action.cardId, u.uid)
        // Units/Gear resolve immediately (337.2); their play trigger chains.
        const queued = queueTriggersFor(s, action.cardId, p, 'play', { sourceUid: u.uid })
        if (queued) {
          // scripted play trigger on the chain
        } else if ((!script || script.manual) && hasPlayedTrigger(card)) {
          pushChain(
            s,
            {
              cardId: action.cardId,
              label: `Déclencheur : ${card.name}`,
              controller: p,
              kind: 'trigger',
              scripted: kw.vision,
              script: kw.vision ? 'vision' : undefined,
            },
            'trigger'
          )
          log(s, `Déclencheur de ${card.name} sur la chaîne : « ${card.text} »`, p)
        } else {
          cleanup(s)
        }
      } else if (card.type === 'Spell') {
        const scriptedSpell = script?.spell !== undefined
        const item = {
          cardId: action.cardId,
          label: card.name,
          controller: p,
          kind: 'spell' as const,
          targets: action.targets,
          scripted: scriptedSpell,
        }
        pushChain(s, item, 'play')
        log(s, `${pname(s, p)} joue le sort ${card.name} : « ${card.text} »`, p)
        firePlayCardTriggers(s, p, action.cardId, null)
        // Scripted spells choose their targets while finalizing (349).
        const targetSpecs = script?.spell?.targets ?? []
        if (scriptedSpell && targetSpecs.length > 0) {
          const itemUid = s.chain[s.chain.length - 1].uid
          const ctx: EffectCtx = {
            cardId: action.cardId,
            sourceUid: null,
            sourceBattlefield: null,
            controller: p,
            eventUid: null,
            vars: {},
          }
          const chooseOps: Op[] = (targetSpecs as NamedTarget[]).map((t) => ({
            op: 'choose',
            bind: t.bind,
            spec: t.spec,
            optional: t.optional,
          }))
          startProgram(s, ctx, chooseOps, 'finalizeItem', itemUid)
        }
      } else {
        throw new IllegalAction(`Type injouable : ${card.type}`)
      }
      return s
    }

    case 'activateAbility': {
      const src = action.source
      let cardId: string
      let sourceUid: number | null = null
      let sourceBattlefield: number | null = null
      if (src.kind === 'unit') {
        const u = s.units.find((x) => x.uid === src.uid)
        if (!u || u.controller !== p) throw new IllegalAction('Source invalide')
        cardId = u.cardId
        sourceUid = u.uid
      } else if (src.kind === 'legend') {
        cardId = s.players[p].legendId
      } else {
        const bf = s.battlefields[src.ix]
        if (!bf) throw new IllegalAction('Champ de bataille invalide')
        cardId = bf.cardId
        sourceBattlefield = src.ix
      }
      const script = scriptFor(cardId)
      // abilityIx -2 = the Empower ability (827): pay once, gain Empowered.
      if (action.abilityIx === -2) {
        if (!script?.empower || src.kind !== 'unit') throw new IllegalAction('Empower introuvable')
        const unit2 = s.units.find((x) => x.uid === (src as { kind: 'unit'; uid: number }).uid)
        if (!unit2 || unit2.empowered) throw new IllegalAction('Déjà Empowered')
        if (!canActNow(s, p, { action: false, reaction: false })) throw new IllegalAction('Timing illégal')
        if (!canPayCost(s, p, unit2.uid, script.empower.cost)) throw new IllegalAction('Coût impayable')
        payCostNow(s, p, unit2.uid, script.empower.cost)
        unit2.empowered = true
        log(s, `${def(cardId).name} devient Empowered.`, p)
        cleanup(s)
        return s
      }
      // abilityIx -1 = the Equip ability of an Equipment gear (818).
      if (action.abilityIx === -1) {
        if (!script?.equip || src.kind !== 'unit') throw new IllegalAction('Équipement introuvable')
        const gearUnit = s.units.find((x) => x.uid === (src as { kind: 'unit'; uid: number }).uid)
        if (!gearUnit || gearUnit.kind !== 'gear') throw new IllegalAction('Équipement introuvable')
        const timing = { action: false, reaction: keywords(cardId).reaction }
        if (!canActNow(s, p, timing)) throw new IllegalAction('Timing illégal')
        if (!canPayCost(s, p, gearUnit.uid, script.equip.cost)) throw new IllegalAction('Coût impayable')
        payCostNow(s, p, gearUnit.uid, script.equip.cost)
        log(s, `${pname(s, p)} équipe ${def(cardId).name}.`, p)
        pushChain(
          s,
          {
            cardId,
            label: `Équiper : ${def(cardId).name}`,
            controller: p,
            kind: 'ability',
            scripted: true,
            abilityIx: -1,
            sourceUid: gearUnit.uid,
          },
          'play'
        )
        return s
      }
      const ability = script?.abilities?.[action.abilityIx]
      if (!ability || ability.kind !== 'activated') throw new IllegalAction('Capacité introuvable')
      // Unattached Equipment: only the Equip ability is active (720).
      if (script?.equip && sourceUid !== null) {
        const g = s.units.find((x) => x.uid === sourceUid)
        if (g?.kind === 'gear' && (g.attachedTo === undefined || g.attachedTo === null))
          throw new IllegalAction('Équipement non attaché : texte inactif')
      }
      // Timing: default = your turn, Neutral Open; Action/Reaction extend it.
      const timing = { action: ability.timing === 'action', reaction: ability.timing === 'reaction' }
      if (!canActNow(s, p, timing)) throw new IllegalAction('Timing illégal pour cette capacité')
      if (ability.restriction) {
        const rctx: EffectCtx = { cardId, sourceUid, sourceBattlefield, controller: p, eventUid: null, vars: {} }
        if (!evalCond(s, rctx, ability.restriction)) throw new IllegalAction('Condition non remplie')
      }
      if (ability.oncePerTurn) {
        const key = `${sourceUid ?? cardId}:${action.abilityIx}`
        if ((s.onceUsed[key] ?? 0) >= 1) throw new IllegalAction('Déjà utilisée ce tour')
        s.onceUsed[key] = 1
      }
      // Legend exhaust cost uses the legend's own orientation.
      if (src.kind === 'legend' && ability.cost.exhaustSelf) {
        if (!s.players[p].legendReady) throw new IllegalAction('Légende déjà engagée')
      } else if (!canPayCost(s, p, sourceUid, ability.cost)) {
        throw new IllegalAction('Coût impayable')
      }
      if (src.kind === 'legend' && ability.cost.exhaustSelf) {
        const costRest = { ...ability.cost, exhaustSelf: undefined }
        if (!canPayCost(s, p, null, costRest)) throw new IllegalAction('Coût impayable')
        s.players[p].legendReady = false
        payCostNow(s, p, null, costRest)
      } else {
        payCostNow(s, p, sourceUid, ability.cost)
      }
      log(s, `${pname(s, p)} active « ${def(cardId).name} ».`, p)
      // Choice-based costs (discard/recycleTrash) become a program prefix.
      const prefix: Op[] = []
      if (ability.cost.discard) {
        prefix.push({ op: 'discard', n: ability.cost.discard, who: 'you' })
      }
      if (ability.cost.recycleTrash) {
        prefix.push(
          {
            op: 'choose',
            bind: '__cost',
            spec: { kind: 'card', zone: 'trash', who: 'you', min: ability.cost.recycleTrash, max: ability.cost.recycleTrash },
          },
          { op: 'recycleFromTrash', bind: '__cost' }
        )
      }
      // Pure Add-resource abilities resolve immediately, unreactable (337.2).
      const pureAdd = ability.ops.every((o) => o.op === 'addEnergy' || o.op === 'addPower')
      if (pureAdd && prefix.length === 0 && (ability.targets ?? []).length === 0) {
        const ctx: EffectCtx = { cardId, sourceUid, sourceBattlefield, controller: p, eventUid: null, vars: {} }
        startProgram(s, ctx, ability.ops, 'none')
        return s
      }
      pushChain(
        s,
        {
          cardId,
          label: `Capacité : ${def(cardId).name}`,
          controller: p,
          kind: 'ability',
          scripted: true,
          abilityIx: action.abilityIx,
          sourceUid,
          targetVars: sourceBattlefield !== null ? { __bf: sourceBattlefield } : undefined,
        },
        'play'
      )
      if (prefix.length > 0) {
        // The cost choices run right away (they are part of paying).
        const ctx: EffectCtx = { cardId, sourceUid, sourceBattlefield, controller: p, eventUid: null, vars: {} }
        startProgram(s, ctx, prefix, 'none')
      }
      return s
    }

    case 'move': {
      if (s.winner !== null) throw new IllegalAction('Partie terminée')
      if (s.turnPlayer !== p || s.phase !== 'action') throw new IllegalAction('Pas votre tour')
      if (s.chain.length > 0 || s.showdown) throw new IllegalAction('Déplacement impossible pendant une chaîne ou un showdown')
      const movers = action.unitUids.map((uid) => s.units.find((u) => u.uid === uid))
      if (movers.some((u) => !u || u.controller !== p || u.kind !== 'unit' || !u.ready))
        throw new IllegalAction('Unités invalides (contrôlées et redressées uniquement)')
      for (const u of movers as UnitEntity[]) {
        const from = u.location
        const to = action.to
        const legal =
          (from === 'base' && typeof to === 'number') ||
          (typeof from === 'number' && to === 'base') ||
          (typeof from === 'number' && typeof to === 'number' && keywords(u.cardId).ganking)
        if (!legal || from === to) throw new IllegalAction('Destination illégale')
      }
      const origins: [number, LocationRef][] = (movers as UnitEntity[]).map((u) => [u.uid, u.location])
      for (const u of movers as UnitEntity[]) {
        u.ready = false
        arriveAt(s, u, action.to)
      }
      const names = (movers as UnitEntity[]).map((u) => def(u.cardId).name).join(', ')
      log(
        s,
        `${pname(s, p)} déplace ${names} vers ${action.to === 'base' ? 'la base' : bfName(s, action.to as number)}.`,
        p
      )
      // "When I move" triggers + origin-battlefield "moved from here" triggers
      for (const u of movers as UnitEntity[]) {
        queueTriggersFor(s, u.cardId, u.controller, 'move', { sourceUid: u.uid })
      }
      for (const [uid, from] of origins) {
        if (typeof from === 'number') {
          queueTriggersFor(s, s.battlefields[from].cardId, p, 'moveFromHere', {
            sourceUid: null,
            sourceBattlefield: from,
            eventUid: uid,
          })
        }
      }
      cleanup(s)
      return s
    }

    case 'hide': {
      if (s.turnPlayer !== p || s.phase !== 'action') throw new IllegalAction('Pas votre tour')
      if (s.chain.length > 0 || s.showdown) throw new IllegalAction('Impossible maintenant')
      const pl = s.players[p]
      if (!pl.hand.includes(action.cardId)) throw new IllegalAction('Carte absente de la main')
      if (!keywords(action.cardId).hidden) throw new IllegalAction('Cette carte n’a pas Hidden')
      const bf = s.battlefields[action.battlefield]
      if (!bf || bf.controller !== p || bf.facedown) throw new IllegalAction('Champ de bataille invalide')
      // Hide costs 1 power of any domain (811.1.b).
      if (totalPower(s, p) < 1) throw new IllegalAction('1 puissance requise')
      payAnyPower(s, p, 1)
      pl.hand.splice(pl.hand.indexOf(action.cardId), 1)
      bf.facedown = { cardId: action.cardId, owner: p, hiddenOnTurn: s.turn }
      log(s, `${pname(s, p)} cache une carte à ${bfName(s, action.battlefield)}.`, p)
      return s
    }

    case 'pass': {
      if (s.chain.length > 0) {
        if (s.chainActive !== p) throw new IllegalAction('Pas la priorité')
        s.chainPasses += 1
        if (s.chainPasses >= 2) {
          // All players passed in sequence: the top of the chain resolves (339-340).
          resolveChainTop(s)
        } else {
          s.chainActive = other(p)
        }
        return s
      }
      if (s.showdown) {
        if (s.showdown.focus !== p) throw new IllegalAction('Pas le focus')
        s.showdown.passes += 1
        if (s.showdown.passes >= 2) {
          closeShowdown(s)
        } else {
          s.showdown.focus = other(p)
        }
        return s
      }
      throw new IllegalAction('Rien à passer')
    }

    case 'choose': {
      const pending = s.pending
      if (!pending) throw new IllegalAction('Aucun choix en attente')
      if (pending.player !== p) throw new IllegalAction('Ce choix ne vous revient pas')
      const choice = action.choice
      if (choice.kind !== pending.spec.kind) throw new IllegalAction('Réponse inattendue')
      // Choices addressed to the effect VM resume its execution.
      if (pending.vm) {
        answerVmChoice(s, choice)
        return s
      }
      switch (choice.kind) {
        case 'assignDamage':
          applyAssignDamageChoice(s, choice.assignments)
          return s
        case 'battlefield': {
          if (pending.spec.kind !== 'battlefield' || !pending.spec.options.includes(choice.battlefield))
            throw new IllegalAction('Champ de bataille invalide')
          const reason = pending.spec.reason
          s.pending = null
          if (reason === 'showdown') beginShowdown(s, choice.battlefield)
          else beginCombat(s, choice.battlefield)
          return s
        }
        case 'vision': {
          const pl = s.players[p]
          s.pending = null
          if (choice.recycle && pl.deck.length > 0) {
            pl.deck.push(pl.deck.shift()!)
            log(s, `Vision : ${pname(s, p)} recycle la carte du dessus de son deck.`, p)
          } else {
            log(s, `Vision : ${pname(s, p)} garde la carte du dessus.`, p)
          }
          afterChainResolve(s)
          return s
        }
        default:
          throw new IllegalAction('Réponse inattendue')
      }
    }

    case 'endTurn': {
      if (s.turnPlayer !== p || s.phase !== 'action') throw new IllegalAction('Pas votre tour')
      if (s.chain.length > 0 || s.showdown) throw new IllegalAction('Résolvez la chaîne / le combat d’abord')
      log(s, `${pname(s, p)} termine son tour.`, p)
      endTurn(s)
      return s
    }

    case 'concede': {
      s.winner = other(p)
      s.phase = 'over'
      s.pending = null
      log(s, `${pname(s, p)} abandonne. 🏆 ${pname(s, other(p))} gagne !`)
      return s
    }

    case 'manual': {
      applyManual(s, p, action.op)
      return s
    }
  }
}
