# Drivechains BIP300 y Gorilla Wallet

Presentación de 10 diapositivas: cómo funciona BIP300, peg-in, peg-out, protección contra replay, las drivechains
activas en eCash Beta y cómo usarlas desde [Gorilla Wallet](https://github.com/agustinkassis/gorilla-wallet).

**Deck publicado:** https://claude.ai/artifact/HBscuph1TZvJaprSeqNRRx (privado: se comparte desde su menú Share).

## Estructura

```
project/deck.json         índice: título, orden de las diapositivas, secciones, tipografías
project/slides/<id>.html  una diapositiva por archivo (texto, diseño y notas del orador en <aside>)
assets/                   imágenes que usan las diapositivas
data/                     datos en vivo que respaldan los números (scripts/fetch-data.mjs)
scripts/                  regenerar datos y la captura de Gorilla Wallet
```

`project/` es una copia exacta de los archivos del deck: se edita acá o en el editor del deck, y se publica (ver
[Publicar cambios](#publicar-cambios)).

## Diapositivas

| # | id | Título |
|---|---|---|
| 1 | `cover` | Drivechains en eCash |
| 2 | `bip300` | Una tesorería por sidechain |
| 3 | `pegin` | Depositar: la tesorería crece |
| 4 | `anatomy` | Por dentro de un depósito |
| 5 | `pegout` | Retirar: los mineros votan |
| 6 | `replay` | Mismas monedas, dos cadenas |
| 7 | `official` | Siete cadenas, siete usos |
| 8 | `community` | Dónde están las monedas |
| 9 | `wallet` | Depositá desde Gorilla Wallet |
| 10 | `guardrails` | Verificado antes de firmar |

Las diapositivas llevan poco texto; el detalle técnico está en las notas del orador (`<aside>` de cada archivo).

## Imágenes

Las diapositivas las referencian por su id en el deck (`/_blob/<id>`):

| Archivo | `src` en las diapositivas | Uso |
|---|---|---|
| `assets/icon.png` | `/_blob/6f598240dd90228cb9d410d9bb2df399` | logo (portada, pie de página) |
| `assets/splash.webp` | `/_blob/13f3616123deab95b785524b826fb185` | póster de la portada |
| `assets/deposit-card.png` | `/_blob/d12aa7331c0bcece30f88047b39f049c` | captura real del depósito en Gorilla Wallet (diap. 9) |

Una imagen nueva o cambiada se sube al deck y su nuevo `/_blob/<id>` reemplaza al viejo en los HTML.

## Datos y fuentes

Instantánea del 13 de octubre de 2026 (eCash Beta, altura ~973.743):

- **Sidechains y tesorerías** (`data/sidechains.json`): `GetSidechains` y `GetCtip` del enforcer público,
  `https://enforcer.beta.ecash.ninja` (Connect: `POST /cusf.mainchain.v1.ValidatorService/<Método>` con JSON). Los
  usos de cada cadena salen de su propuesta M1. Total: **1.715,40 pECX** en 7 tesorerías; Elements, zSide y Photon sin
  depósitos.
- **Depósito real** (`data/deposit-tx.json`, diap. 4): Thunder, slot 9, txid
  [`4dc77e74…a847e1`](https://explorer.beta.ecash.ninja/tx/4dc77e74b3719a132e0a3bf4220fbf39c944b35b178af2f1a8da2fb78da847e1):
  tesorería 1.010,93785589 → 1.012,06085589 pECX (+1,123), 202 vB, 447 sats de comisión, nLockTime 499.999.999.
- **OP_DRIVECHAIN = 0xb7 (OP_NOP8)** en la betanet, no el OP_NOP5 (0xb4) de BIP300:
  [bip300301_enforcer](https://github.com/LayerTwo-Labs/bip300301_enforcer) `lib/types.rs`, `NetworkParams::betanet`.
  Las 7 tesorerías en vivo son `b7 01 <slot> 51`.
- **Umbrales de retiro**: 13.150 votos a favor dentro de 26.300 bloques (~3 meses); la betanet usa los de mainnet
  (`Thresholds::BETANET` solo baja la activación de slots nuevos, 1.008 de 2.016).
- **Formato M5**: tesorería vieja como entrada (scriptSig vacío), nueva tesorería seguida del OP_RETURN con la dirección
  (`create_deposit_psbt` en `lib/wallet/mod.rs`, `handle_m5_m6` en `lib/validator/task/mod.rs`).
- **Dirección de depósito** `s<slot>_<dirección>_<checksum>`: checksum = primeros 3 bytes de
  sha256(`s<slot>_<dirección>_`) en hex; el OP_RETURN lleva solo la dirección (thunder-rust `types/address.rs`).
- **Replay**: nLockTime 499.999.999 (`LOCKTIME_THRESHOLD - 1`) con una entrada RBF; la guardia de Bitcoin gasta una
  moneda que eCash no tiene. Implementado en Gorilla Wallet.
- **Depósito desde Gorilla Wallet** (diap. 9 y 10): PR
  [agustinkassis/gorilla-wallet#18](https://github.com/agustinkassis/gorilla-wallet/pull/18), todavía sin mergear.
- **Mainnet de eCash**: fork en el bloque ~973.728, ~31 de octubre de 2026.

## Actualizar

- **Datos**: `node scripts/fetch-data.mjs` (Node 18+) reescribe `data/`. Si cambian, actualizá las cifras de las
  diapositivas 4, 7 y 8 y sus notas.
- **Captura de Gorilla Wallet**: con Gorilla corriendo en eCash Beta, `node scripts/shot.mjs http://localhost:3000`
  (Node 22+, Google Chrome) reescribe `assets/deposit-card.png`. Después subila al deck y cambiá su `/_blob/<id>` en
  `wallet.html`.

## Publicar cambios

El deck es un Artifact de Claude de tipo Slides; se publica desde Claude Code con la herramienta Artifact:

1. Traé la versión publicada antes de editar (alguien pudo editar en el navegador): `read` de `project/deck.json` y
   de las diapositivas, y copialas a `project/`.
2. Editá los archivos.
3. Publicá solo los que cambiaron: `url` = el deck, `root` = este repo, `file_path` = uno de los archivos, `files` =
   los demás (`{"project/slides/pegin.html": "project/slides/pegin.html"}`). `project/deck.json` solo si cambia el
   título, el orden, las secciones o las tipografías.
4. Commit y push acá.

### Formato de las diapositivas

Lienzo fijo de 1920×1080, un `<section id="<id>">` por archivo, todos los estilos inline (px y colores hex/rgba; sin
clases, `<style>`, `margin` ni `var()`), texto de 24px o más, márgenes de 128px y el pie de página a `bottom:64px`.
Íconos con `<x-icon name="Lock">` (Activity, Book, Chart, Check, CheckCircle, Clock, Code, Database, Globe, Key,
Lightning, Link, Lock, PaperPlane, Star, Users, Verified, Warning…), flechas con `<x-connector>`, animaciones con
`data-transition` en la sección y `data-build-in` en los elementos con `position:absolute`.

### Marca

| Token | Valor |
|---|---|
| Rojo Gorilla | `#cc0404` (logo `#b20e18`) |
| Tinta (fondo oscuro) | `#120607` |
| Papel (texto claro / fondo claro) | `#f6f1ea` |
| Ámbar (acentos) | `#f38c09` |
| Texto atenuado | `#b9aea6` sobre oscuro, `#5a4a46` sobre claro |
| Títulos | Bricolage Grotesque 800, mayúsculas |
| Texto | Geist |
| Código y etiquetas | Geist Mono |

Escala tipográfica: 120 / 72 / 44 / 32 / 24 px. Números en formato argentino (13.150, 1.012,06).
