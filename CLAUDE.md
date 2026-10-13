# bip300 deck

`project/` mirrors the Slides artifact https://claude.ai/artifact/HBscuph1TZvJaprSeqNRRx (deck in Spanish, rioplatense
voseo, Argentine number format). README.md covers structure, sources, brand and the slide format.

- Before editing, pull the published version (Artifact `read` with `paths` for `project/deck.json` and the slides) and
  copy it over `project/`: the deck is also edited in the browser.
- Publish only changed files: Artifact publish with `url` = the deck, `root` = this repo, `file_path` = one changed
  file, `files` = the rest. Send `project/deck.json` only when title, order, sections or faces change.
- Images are referenced as `/_blob/<id>` (mapping in README); a new image is uploaded with `asset: true` first.
- Keep slides light: a title and a few words per card; details go in the `<aside>` speaker notes.
- Numbers on slides come from `data/` (`node scripts/fetch-data.mjs`); don't invent figures.
