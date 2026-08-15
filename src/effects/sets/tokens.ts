// Token card scripts.
import type { CardScript } from '../ir'

export const TOKEN_SCRIPTS: Record<string, CardScript> = {
  'ogn-271-298': { vanilla: true }, // Recruit
  'ogn-272-298': { vanilla: true }, // Recruit
  'ogn-273-298': { vanilla: true }, // Recruit
  'ogn-274-298': { vanilla: true }, // Sprite ([Temporary] is engine-native)
  // "Kill this, exhaust: [Reaction] — [Add] 1 power of any domain." (Gold)
  'sfd-t03': {
    abilities: [
      {
        kind: 'activated',
        cost: { exhaustSelf: true, killSelf: true },
        timing: 'reaction',
        ops: [{ op: 'addPower', n: 1, domain: 'any' }],
      },
    ],
  },
  'tok-mech': { vanilla: true }, // Mech (SFD)
  'tok-bird': { vanilla: true }, // Bird ([Deflect] is engine-native)
  'tok-sandsoldier': { vanilla: true }, // Sand Soldier (SFD)
}
