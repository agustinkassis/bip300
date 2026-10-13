// Refresca data/: las sidechains activas en eCash Beta con su tesorería (CTIP), desde el enforcer, y el depósito
// real que usa la diapositiva 4, desde el explorer. Sin dependencias (Node 18+). Uso: node scripts/fetch-data.mjs
import { mkdirSync, writeFileSync } from "node:fs"

const ENFORCER = process.env.ENFORCER ?? "https://enforcer.beta.ecash.ninja"
const EXPLORER = process.env.EXPLORER ?? "https://explorer.beta.ecash.ninja"
const DEPOSIT_TX = "4dc77e74b3719a132e0a3bf4220fbf39c944b35b178af2f1a8da2fb78da847e1"
const data = new URL("../data/", import.meta.url)

// bip300301_enforcer habla Connect: JSON por POST, sin cliente gRPC
async function validator(method, body) {
  const res = await fetch(`${ENFORCER}/cusf.mainchain.v1.ValidatorService/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${method}: HTTP ${res.status}`)
  return res.json()
}

const { sidechains = [] } = await validator("GetSidechains", {})
const list = await Promise.all(
  sidechains.map(async (s) => {
    const { ctip } = await validator("GetCtip", { sidechainNumber: s.sidechainNumber })
    return {
      slot: s.sidechainNumber,
      title: s.declaration?.v0?.title ?? null,
      description: s.declaration?.v0?.description ?? null,
      proposalHeight: s.proposalHeight,
      activationHeight: s.activationHeight,
      // proto3 JSON omite los ceros: sin vout = 0
      treasury: ctip ? { txid: ctip.txid.hex, vout: ctip.vout ?? 0, sats: Number(ctip.value) } : null,
    }
  }),
)
list.sort((a, b) => a.slot - b.slot)
const totalSats = list.reduce((sum, s) => sum + (s.treasury?.sats ?? 0), 0)

mkdirSync(data, { recursive: true })
const write = (name, value) => writeFileSync(new URL(name, data), JSON.stringify(value, null, 2) + "\n")
write("sidechains.json", { fetchedAt: new Date().toISOString(), enforcer: ENFORCER, totalSats, sidechains: list })

const tx = await (await fetch(`${EXPLORER}/api/tx/${DEPOSIT_TX}`)).json()
const hex = (await (await fetch(`${EXPLORER}/api/tx/${DEPOSIT_TX}/hex`)).text()).trim()
write("deposit-tx.json", { explorer: `${EXPLORER}/tx/${DEPOSIT_TX}`, hex, ...tx })

console.log(`${list.length} sidechains, ${(totalSats / 1e8).toFixed(2)} pECX en tesorerías → data/`)
