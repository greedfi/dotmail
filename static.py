"""Script-free .mail renderer (Tesla browser / iOS safe): one HTML file, inline CSS, system fonts,
dark background, no <script>, no external resources. Threads expand with native <details>."""
import html, re
E = lambda s: html.escape(str(s or ""), quote=True)
LOGO = open(__file__.rsplit("/", 1)[0] + "/logo.svg").read().strip()
CSS = """:root{--bg:#000;--fg:#e7e9ea;--mut:#71767b;--line:#2f3336;--acc:#1d9bf0;--hov:#16181c;--red:#f4212e;--amb:#ffd400}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:#000;color:var(--fg);font:15px/1.4 -apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}
.wrap{max-width:760px;margin:0 auto;border-left:1px solid var(--line);border-right:1px solid var(--line);min-height:100vh}
.top{position:sticky;top:0;z-index:2;background:rgba(0,0,0,.92);border-bottom:1px solid var(--line);padding:10px 16px;display:flex;align-items:center;gap:12px}
.lg{height:32px;width:auto;color:var(--fg);flex:none}.hd{min-width:0;flex:1}.hd b{display:block;font-size:20px}.hd span{color:var(--mut);font-size:13px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.av{width:40px;height:40px;border-radius:50%;flex:none;object-fit:cover;background:var(--acc);color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center}
.tabs{display:flex;gap:8px;overflow-x:auto;padding:10px 16px;border-bottom:1px solid var(--line);-webkit-overflow-scrolling:touch}
.tabs a{flex:none;color:var(--fg);text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:8px 14px;font-weight:700;font-size:14px;min-height:40px;display:flex;align-items:center;gap:6px}
.tabs a i{font-style:normal;color:var(--mut);font-weight:400}
.note{margin:12px 16px;padding:12px 14px;border:1px solid var(--line);border-radius:16px;color:var(--fg)}.note b{display:block;margin-bottom:4px}.note ul{margin:4px 0 0;padding-left:18px}.note .m{color:var(--mut);font-size:13px}
h2{font-size:20px;margin:0;padding:16px 16px 8px;border-top:1px solid var(--line)}h2 i{font-style:normal;color:var(--mut);font-weight:400;font-size:15px}
details{border-bottom:1px solid var(--line)}summary{list-style:none;cursor:pointer;padding:12px 16px;display:flex;gap:12px}summary::-webkit-details-marker{display:none}
summary:hover,details[open]>summary{background:var(--hov)}summary:focus-visible{outline:2px solid var(--acc);outline-offset:-2px}
.ini{width:40px;height:40px;border-radius:50%;flex:none;background:#333639;color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center}
.r{min-width:0;flex:1}.h{display:flex;gap:6px;align-items:baseline;min-width:0}.h b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.h .a{color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:1}.h .t{color:var(--mut);white-space:nowrap;font-size:13px}
.s{font-weight:700;margin-top:1px}.p{color:var(--mut);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ai{color:var(--acc);font-size:14px;margin-top:2px}.warn{color:var(--red);font-size:14px;margin-top:2px;font-weight:700}
.chips{margin-top:4px;display:flex;flex-wrap:wrap;gap:6px}.chip{font-size:12px;font-weight:700;border-radius:999px;padding:2px 8px;border:1px solid var(--line);color:var(--mut)}
.chip.nr{border-color:var(--acc);color:var(--acc)}.chip.sp{border-color:var(--red);color:var(--red)}.chip.w3{border-color:var(--red);color:var(--red)}.chip.tg{border-style:dashed;border-color:var(--acc);color:var(--acc)}
.num{flex:none;min-width:28px;height:28px;border-radius:999px;background:var(--acc);color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:14px;padding:0 8px;margin-top:6px}
.qr{margin-top:8px;display:flex;flex-direction:column;gap:6px}.qr div{border:1px solid var(--line);border-radius:14px;padding:6px 10px;font-size:14px}.qr div b{color:var(--acc);margin-right:6px}
.qr .m{color:var(--mut);font-size:13px;border:0;padding:0 2px}
.th{padding:0 16px 12px 68px}.msg{border:1px solid var(--line);border-radius:16px;padding:12px;margin-top:10px}.msg .mh{color:var(--mut);font-size:13px;word-break:break-word}.msg .mh b{color:var(--fg);font-size:15px}
.msg pre{white-space:pre-wrap;word-break:break-word;font:inherit;margin:8px 0 0}.att{color:var(--mut);font-size:13px;margin-top:6px}
.empty{padding:40px 16px;color:var(--mut);text-align:center}.foot{padding:16px;color:var(--mut);font-size:13px;border-top:1px solid var(--line)}
@media(max-width:600px){.wrap{border:0}.h .a{display:none}.th{padding-left:16px}summary{min-height:44px}}"""

def _thread(t, spam_note, me):
    cat = t["category"]; spam = cat == "Spam"; q = t.get("quick")
    chips = []
    if cat == "Needs reply": chips.append('<span class="chip nr">Needs reply</span>')
    elif spam: chips.append('<span class="chip sp">Spam</span>')
    else: chips.append('<span class="chip">%s</span>' % E(cat))
    if t.get("waitDays") is not None: chips.append('<span class="chip%s">Waiting %d day%s</span>' % (" w3" if t["waitDays"] >= 3 else "", t["waitDays"], "" if t["waitDays"] == 1 else "s"))
    chips += ['<span class="chip tg">+%s</span>' % E(g) for g in t.get("tags") or []]
    line = ('<div class="warn">&#9940; %s</div>' % E(t.get("summary") or spam_note)) if spam else ('<div class="ai">&#10022; %s</div>' % E(t["summary"]) if t.get("summary") else "")
    qr = ""
    if q and not spam:
        qr = '<div class="qr">' + "".join('<div><b>%s%s</b>%s</div>' % (q["n"], k, E(v)) for k, v in q["replies"]) + \
             '<div class="m">Say &ldquo;reply %s%s&rdquo; or &ldquo;reply %s: your own words&rdquo; in chat. You get a draft card; nothing sends until you press Send.</div></div>' % (q["n"], q["replies"][0][0] if q["replies"] else "a", q["n"])
    num = '<div class="num" aria-label="Quick reply number %s">%s</div>' % (q["n"], q["n"]) if q and not spam else ""
    msgs = "".join('<div class="msg"><div class="mh"><b>%s</b> &lt;%s&gt;<br>to %s%s<br>%s</div><pre>%s</pre>%s</div>' % (
        E(m["fromName"]), E(m["fromAddress"]), E(m["to"]), (" &middot; cc " + E(m["cc"])) if m.get("cc") else "", E(m["time"]), E(m["body"]),
        ('<div class="att">&#128206; %s</div>' % E(", ".join(m["attachments"]))) if m.get("attachments") else "") for m in t["messages"])
    tail = '<div class="warn">%s</div>' % E("No reply on spam. Don't click links, reply, or share passwords or codes. If you think it's real, ask in your Grok Bot chat.") if spam else ""
    return ('<details id="t-%s"><summary><div class="ini">%s</div><div class="r"><div class="h"><b>%s</b><span class="a">%s</span><span class="t">%s</span></div>'
            '<div class="s">%s</div><div class="p">%s</div>%s<div class="chips">%s</div>%s</div>%s</summary><div class="th">%s%s%s</div></details>') % (
        E(t["id"]), E((t["name"] or "?")[:1].upper()), E(t["name"]), E(t["address"]), E(t["time"]), E(t["subject"]) or "(no subject)", E(t["snippet"]),
        line, "".join(chips), qr, num, line if spam else "", msgs, tail)

def render(data, cats, search=None):
    spam_note = "Likely spam or phishing — don't click links, reply, or share passwords or codes."
    th = data["threads"]; prof = data.get("profile") or {}
    uri = prof.get("avatarDataUri") or ""
    av = '<img class="av" alt="" src="%s">' % E(uri) if uri.startswith("data:image/") else '<div class="av">%s</div>' % E(data["inbox"][:1].upper())
    title = ".mail search" if search is not None else ".mail"
    sub = E(data["inbox"]) + " &middot; " + E(data["snapshot"])
    out = ['<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">',
           '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data:">',
           '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta name="color-scheme" content="dark">',
           '<title>%s</title><style>%s</style></head><body><div class="wrap">' % (title, CSS),
           '<div class="top">%s<div class="hd"><b>%s</b><span>%s</span></div>%s</div>' % (LOGO, "Search" if search is not None else "All mail", sub, av)]
    groups = [(c, [t for t in th if t["category"] == c]) for c in cats]
    if search is not None:
        out.append('<div class="note"><b>Results for &ldquo;%s&rdquo; &middot; %d thread%s</b>%s<div class="m">Say &ldquo;open .mail&rdquo; for the full page.</div></div>' % (
            E(search.get("query")), len(th), "" if len(th) == 1 else "s", ('<div class="m">%s</div>' % E(search["filters"])) if search.get("filters") else ""))
    else:
        b = data.get("brief")
        if b:
            cnt = b["counts"]
            out.append('<div class="note"><b>Today&rsquo;s brief</b><ul>%s</ul><div class="m">%d need reply &middot; %d waiting on them &middot; %d new</div></div>' % (
                "".join("<li>%s</li>" % E(x) for x in b["bullets"]), cnt["needsReply"], cnt["waiting"], cnt["new"]))
    out.append('<nav class="tabs" aria-label="Categories">' + "".join('<a href="#c-%d">%s <i>%d</i></a>' % (i, E(c), len(g)) for i, (c, g) in enumerate(groups) if g) + "</nav>")
    if not th: out.append('<div class="empty">No mail matches. Try another word, a sender, or a wider date range.</div>')
    for i, (c, g) in enumerate(groups):
        if g: out.append('<section id="c-%d"><h2>%s <i>%d</i></h2>%s</section>' % (i, E(c), len(g), "".join(_thread(t, spam_note, data["inbox"]) for t in g)))
    out.append('<div class="foot">Snapshot &middot; this page never sends anything. Tap a card to read the thread. In chat: &ldquo;reply 1a&rdquo;, &ldquo;reply 1: your text&rdquo;, &ldquo;search .mail for &hellip;&rdquo;, &ldquo;refresh .mail&rdquo;.</div></div></body></html>')
    return "\n".join(out)
