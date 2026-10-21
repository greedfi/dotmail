# .mail

**.mail** is a clean, fast web view of a Grok Bot's email inbox: threads sorted into Needs reply, Waiting on them, FYI, Receipts, Newsletters and Spam, with a short brief, quick replies, search, saved settings (themes, accent colors, density, layout) and a seasonal Halloween mode.

This repo is the page generator for the **.mail Grok Bot template**: https://x.ai/bot/HdN8nshqGbNy_Le0fSi_6

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
