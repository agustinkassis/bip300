// Captura la tarjeta "Sidechain deposit" de Gorilla Wallet (assets/deposit-card.png, diapositiva 9) con Chrome headless
// por CDP. Necesita Gorilla Wallet corriendo con una billetera en eCash Beta. Sin dependencias (Node 22+, WebSocket global).
// Uso: node scripts/shot.mjs [url de Gorilla, por defecto http://localhost:3000]
import { spawn } from "node:child_process"
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const base = process.argv[2] ?? "http://localhost:3000"
const out = new URL("../assets/deposit-card.png", import.meta.url)
const chromePath = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const chrome = spawn(
  chromePath,
  ["--headless=new", "--remote-debugging-port=9333", `--user-data-dir=${mkdtempSync(join(tmpdir(), "bip300-shot-"))}`, "--hide-scrollbars", "about:blank"],
  { stdio: "ignore" },
)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

try {
  let pages
  for (let i = 0; i < 50 && !pages; i++) {
    await sleep(200)
    pages = await fetch("http://127.0.0.1:9333/json/list").then((r) => r.json()).catch(() => null)
  }
  const ws = new WebSocket(pages.find((p) => p.type === "page").webSocketDebuggerUrl)
  await new Promise((r) => ws.addEventListener("open", r))
  let id = 0
  const pending = new Map()
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data)
    if (m.id && pending.has(m.id)) pending.get(m.id)(m), pending.delete(m.id)
  })
  const cdp = (method, params = {}) => new Promise((r) => { const n = ++id; pending.set(n, r); ws.send(JSON.stringify({ id: n, method, params })) })
  const evaluate = async (expression) => (await cdp("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.result?.value

  await cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 2, mobile: false })
  await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "dark" }] })
  await cdp("Page.navigate", { url: `${base}/send?deposit=1` })
  for (let i = 0; i < 60; i++) {
    await sleep(500)
    if (await evaluate(`!!document.querySelector('[aria-label="Sidechain deposit address"]') && document.body.innerText.includes('Thunder · 9')`)) break
  }
  // dirección de Thunder del depósito real (diapositiva 4) y 1,5 pECX
  await evaluate(`(() => {
    const set = (el, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })) }
    const amount = document.querySelector('[aria-label="Recipient 1 amount"]')
    set(document.querySelector('[aria-label="Sidechain deposit address"]'), 's9_XDkeumzBpQ6maGeadmnho4JE4UF_7ab137')
    set(amount, amount.placeholder.includes('.') ? '1.50000000' : '150000000')
    document.activeElement?.blur()
  })()`)
  await sleep(1200)
  const clip = await evaluate(`(() => {
    const card = [...document.querySelectorAll('[data-slot=card]')].find((c) => c.textContent.startsWith('Sidechain deposit'))
    const r = card.getBoundingClientRect()
    return { x: r.x - 12, y: r.y - 12, width: r.width + 24, height: r.height + 24, scale: 1 }
  })()`)
  const shot = await cdp("Page.captureScreenshot", { format: "png", clip })
  writeFileSync(out, Buffer.from(shot.result.data, "base64"))
  ws.close()
  console.log("assets/deposit-card.png")
} finally {
  chrome.kill()
}
