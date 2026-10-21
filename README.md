# .mail

**.mail** is a clean, fast web view of a Grok Bot's email inbox: threads sorted into Needs reply, Waiting on them, FYI, Receipts, Newsletters and Spam, with a short brief, quick replies, search, saved settings (themes, accent colors, density, layout) and a seasonal Halloween mode.

This repo is the page generator for the **.mail Grok Bot template**: https://x.ai/bot/HdN8nshqGbNy_Le0fSi_6

## Open in your browser

**https://greedfi.github.io/dotmail/** opens the .mail page (or its JSON data) your bot sent you, right in your browser. It is a static page with no server, no accounts and no tracking: the file is read locally and shown in a locked-down sandbox, and your mail is never uploaded. Hit **Try the demo** (or go straight to https://greedfi.github.io/dotmail/demo) to see fictional example mail. On phones a one-time tip shows how to add it to the Home Screen; each page shows when it was updated, with a **Get newest** button that copies `refresh .mail` for your bot. The site lives in [`docs/`](docs/).

**One-tap links.** Instead of a file, a bot can send a link: `python3 gen.py --data in.json --out page.html --link` also prints `https://greedfi.github.io/dotmail/#m=<payload>` (compressed page data in the URL fragment, which browsers never send to a server; the payload length goes to stderr). If it is longer than `--link-max` (default 30000 chars) nothing is printed and the exit code is 3: send the file instead. The viewer decodes the link locally, removes it from the address bar and remembers that inbox on the device until you tap **Forget this inbox**. The site can be installed to the home screen (web app manifest; the service worker caches only the site's own files).

**Optional passcode lock (off by default).** `echo 'your passcode' | python3 gen.py --set-passcode` (or `DOTMAIL_PASSCODE=... python3 gen.py --set-passcode`) stores it in `passcode.json` next to `gen.py` (mode 600, never printed). While it is set, `--link` makes `#e=` links: the compressed page data encrypted with AES-256-GCM, key from PBKDF2-HMAC-SHA256 (310,000 iterations, fresh 16-byte salt and 12-byte IV per link). The viewer asks for the passcode and decrypts on the device; it only ever remembers the encrypted link. If encryption is unavailable gen.py exits 4 instead of printing an unencrypted link. Note: the .mail **file** itself is not encrypted (gen.py warns). `--passcode-status` prints on/off; `--clear-passcode` removes it.

**Keeping `docs/` in sync:** after changing `template.html` or the demo data, run `./sync-docs.sh` (copies the template and rebuilds `docs/demo.html`).

## Files

| File | Purpose |
|---|---|
| `gen.py` | Builds the .mail page from inbox JSON (or built-in fictional demo data). Handles the incremental cache, search pages, quick replies and saved settings. |
| `template.html` | The interactive phone/desktop page design. |
| `static.py` | Optional script-free renderer (`--static`, e.g. for car browsers). |
| `logo.svg` | Logo used by `static.py`. |

## Install (for a Grok Bot)

Download the files into `/workspace/inbox-summary/`:

```bash
mkdir -p /workspace/inbox-summary && cd /workspace/inbox-summary
for f in gen.py template.html static.py logo.svg; do
  curl -fsSLO https://raw.githubusercontent.com/greedfi/dotmail/main/$f
done
python3 gen.py --help
```

Only `gen.py` and `template.html` are required for the normal page; `static.py` and `logo.svg` are only for `--static`.

## Try it

```bash
python3 gen.py --out demo.html   # no --data: renders the fictional demo inbox
```

Real pages use `--data in.json` (see `python3 gen.py --help` and the docstring at the top of `gen.py` for the JSON format). Demo data is entirely fictional; `you@mail.grokbot.com` is a placeholder.

Requires Python 3.9+ (standard library only).

## License

MIT, see [LICENSE](LICENSE).
