(function () {
  "use strict";

  var CFG = window.CHOG_CONFIG;
  var CASES = window.CASES;
  var STORE_KEY = "chogcourt.v1";

  /* ---------- rules ---------- */
  var ROLE_BY_TEMPERAMENT = { Stern: "Judge", Chaotic: "Prosecutor", Gentle: "Defender", Sly: "Witness" };
  var TEMPERAMENTS = ["Stern", "Chaotic", "Gentle", "Sly"];
  var SPECIALTIES = ["Memes", "DeFi", "Drama", "Predictions", "Tech"];
  var RARITIES = ["Common", "Rare", "Legendary"];
  var BODY = { Stern: "#7f958b", Chaotic: "#9078b8", Gentle: "#9fc8aa", Sly: "#cda55f" };

  // Demo Chogs stand in for real tokens. "base" is a pre-existing verdict history.
  var DEMO = [
    { id: "0417", temperament: "Stern", specialty: "DeFi", rarity: "Legendary", base: { cases: 37, correct: 34 } },
    { id: "0066", temperament: "Stern", specialty: "Tech", rarity: "Legendary", base: { cases: 21, correct: 17 } },
    { id: "1208", temperament: "Chaotic", specialty: "Memes", rarity: "Rare", base: { cases: 12, correct: 8 } },
    { id: "2750", temperament: "Sly", specialty: "Predictions", rarity: "Rare", base: { cases: 9, correct: 3 } },
    { id: "0933", temperament: "Gentle", specialty: "Drama", rarity: "Common", base: { cases: 3, correct: 1 } },
    { id: "3121", temperament: "Chaotic", specialty: "Drama", rarity: "Common", base: { cases: 0, correct: 0 } }
  ];
  // Other courtroom regulars so the leaderboard has company.
  var NPCS = [
    { id: "0888", temperament: "Stern", specialty: "Memes", rarity: "Rare", base: { cases: 44, correct: 33 } },
    { id: "1999", temperament: "Gentle", specialty: "DeFi", rarity: "Common", base: { cases: 26, correct: 23 } },
    { id: "0212", temperament: "Sly", specialty: "Tech", rarity: "Legendary", base: { cases: 18, correct: 13 } },
    { id: "2404", temperament: "Chaotic", specialty: "Predictions", rarity: "Common", base: { cases: 15, correct: 7 } },
    { id: "0731", temperament: "Gentle", specialty: "Memes", rarity: "Rare", base: { cases: 8, correct: 6 } },
    { id: "3300", temperament: "Stern", specialty: "Drama", rarity: "Common", base: { cases: 6, correct: 2 } }
  ];

  function rankOf(n, acc) {
    if (n >= 8 && acc < 0.35) return { name: "Court Clown", clown: true, tier: 0 };
    if (n >= 20 && acc >= 0.8) return { name: "Chief Justice", tier: 4 };
    if (n >= 10 && acc >= 0.65) return { name: "Justice", tier: 3 };
    if (n >= 5 && acc >= 0.5) return { name: "Magistrate", tier: 2 };
    if (n < 5) return { name: "Clerk", tier: 1 };
    return { name: "Juror", tier: 1 };
  }

  /* ---------- state + storage ---------- */
  var state = loadState();
  var session = { mode: "demo", account: null, provider: null, chainTokens: [], chainNote: "", loading: false };
  var ui = { selected: null, justRuled: null, boardTab: "docket", drafts: {}, pickWallet: false };

  // Wallet discovery (EIP-6963): with several wallet extensions installed, window.ethereum is unreliable,
  // so every wallet announces itself and the player picks one.
  var wallets = [];
  window.addEventListener("eip6963:announceProvider", function (e) {
    var d = e && e.detail;
    if (!d || !d.provider || !d.info) return;
    for (var i = 0; i < wallets.length; i++) if (wallets[i].info.uuid === d.info.uuid) return;
    wallets.push(d);
    renderWallet();
  });
  window.dispatchEvent(new Event("eip6963:requestProvider"));
  function eth() { return session.provider; }

  function loadState() {
    var fresh = { activeId: DEMO[0].id, tokens: {}, owners: {} };
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return fresh;
      var s = JSON.parse(raw);
      return { activeId: s.activeId || fresh.activeId, tokens: s.tokens || {}, owners: s.owners || {} };
    } catch (e) { return fresh; }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable: records last for this visit only */ }
  }
  // The record is keyed by token id. It never references the wallet.
  function rec(id) {
    // Demo and real tokens never share a record slot, even if their numbers match.
    var key = (session.mode === "chain" ? "chain:" : "") + id;
    if (!state.tokens[key]) state.tokens[key] = { decided: {}, days: [] };
    return state.tokens[key];
  }

  /* ---------- helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function pct(x) { return Math.round(x * 100) + "%"; }
  function shortAddr(a) { return a ? a.slice(0, 6) + "…" + a.slice(-4) : ""; }
  function dateKey(d) { d = d || new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { return function () { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; var t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function toast(msg) { var t = $("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove("show"); }, 3200); }

  /* ---------- tokens ---------- */
  function allTokens() {
    var list = session.mode === "chain" ? session.chainTokens : DEMO;
    return list;
  }
  function activeToken() {
    var list = allTokens();
    for (var i = 0; i < list.length; i++) if (list[i].id === state.activeId) return list[i];
    return list[0] || null;
  }
  function statsFor(t) {
    var r = rec(t.id), n = t.base.cases, c = t.base.correct, k;
    // Rows from the shared leaderboard already include every ruling the server holds.
    if (!t.remote) for (k in r.decided) { n++; if (r.decided[k].correct) c++; }
    var acc = n ? c / n : 0;
    return { n: n, c: c, acc: acc, rank: rankOf(n, acc) };
  }
  function streakFor(t) {
    var days = rec(t.id).days, set = {}, i, d = new Date(), s = 0;
    days.forEach(function (x) { set[x] = 1; });
    if (!set[dateKey(d)]) d.setDate(d.getDate() - 1);
    for (i = 0; i < 400; i++) { if (set[dateKey(d)]) { s++; d.setDate(d.getDate() - 1); } else break; }
    return s;
  }
  function roleOf(t) { return ROLE_BY_TEMPERAMENT[t.temperament]; }
  function ownerOf(t) {
    if (session.mode === "chain") return session.account;
    return state.owners[t.id] || "0x" + ("a1b2c3d4e5" + t.id + "f6e7d8c9b0").slice(0, 40);
  }

  /* ---------- avatar ---------- */
  function avatar(t, cls) {
    if (t.image) return '<img class="avatar ' + (cls || "") + '" src="' + esc(t.image) + '" alt="Chog #' + esc(t.id) + '">';
    var rk = rankOf(t.base ? statsFor(t).n : 0, t.base ? statsFor(t).acc : 0);
    var col = BODY[t.temperament] || "#8fa398";
    var acc = "";
    if (rk.tier >= 3) acc += '<g fill="#f7f7f2" stroke="#c8c8bd" stroke-width="1.5"><circle cx="22" cy="22" r="8"/><circle cx="34" cy="16" r="8"/><circle cx="46" cy="22" r="8"/><circle cx="14" cy="34" r="7"/><circle cx="54" cy="34" r="7"/></g>';
    if (rk.tier === 4) acc += '<rect x="22" y="58" width="24" height="5" rx="2" fill="#a8842f"/>';
    if (rk.clown) acc += '<circle cx="34" cy="43" r="5" fill="#b3261e"/><path d="M24 17 L34 1 L44 17 Z" fill="#b3261e"/>';
    return '<svg class="avatar ' + (cls || "") + '" viewBox="0 0 68 68" role="img" aria-label="Chog #' + esc(t.id) + '">' +
      '<rect width="68" height="68" fill="#dfe6e0"/>' +
      '<ellipse cx="34" cy="40" rx="22" ry="20" fill="' + col + '"/>' +
      '<circle cx="18" cy="24" r="6" fill="' + col + '"/><circle cx="50" cy="24" r="6" fill="' + col + '"/>' +
      '<circle cx="26" cy="38" r="3.4" fill="#16211d"/><circle cx="42" cy="38" r="3.4" fill="#16211d"/>' +
      (rk.clown ? "" : '<path d="M27 49 Q34 54 41 49" stroke="#16211d" stroke-width="2.2" fill="none" stroke-linecap="round"/>') +
      acc + "</svg>";
  }

  /* ---------- docket ---------- */
  function todaysIds() {
    var r = rng(hash(dateKey())), order = CASES.map(function (c) { return c.id; }), i, j, tmp;
    for (i = order.length - 1; i > 0; i--) { j = Math.floor(r() * (i + 1)); tmp = order[i]; order[i] = order[j]; order[j] = tmp; }
    return order.slice(0, 3);
  }
  function caseById(id) { for (var i = 0; i < CASES.length; i++) if (CASES[i].id === id) return CASES[i]; return null; }
  function outcomeOf(c) { return c.kind === "jury" ? (c.crowd >= 50 ? "guilty" : "not guilty") : c.outcome; }

  function caseNo(c) { return c.id.replace(/^c/, ""); }

  function renderDocket() {
    var el = $("docket");
    var head = '<div class="switch" role="tablist"><button role="tab" data-btab="docket" aria-selected="' + (ui.boardTab !== "roll") + '">Docket</button>' +
      '<button role="tab" data-btab="roll" aria-selected="' + (ui.boardTab === "roll") + '">Roll of the bench</button></div>';
    if (ui.boardTab === "roll") { el.innerHTML = head + rollHtml(); return; }
    var t = activeToken(), r = t ? rec(t.id) : { decided: {} }, today = todaysIds();
    function item(c) {
      var d = r.decided[c.id], cls = d ? (d.correct ? "ruled-ok" : "ruled-bad") : "";
      var status = d ? (d.correct ? "Sustained" : "Overruled") : "Open";
      return '<li><button class="row-case ' + cls + '" data-case="' + c.id + '"' + (ui.selected === c.id ? ' aria-current="true"' : "") + ">" +
        '<span class="no">No. ' + caseNo(c) + '</span><span><span class="t">' + esc(c.title) + '</span><span class="m">' + esc(c.category) + "</span></span>" +
        '<span class="s">' + status + "</span></button></li>";
    }
    var todayCases = today.map(caseById), rest = CASES.filter(function (c) { return today.indexOf(c.id) < 0; });
    var left = todayCases.filter(function (c) { return !r.decided[c.id]; }).length;
    el.innerHTML = head +
      '<p class="group-label">Today, ' + (left ? left + " of 3 still open" : "all 3 ruled") + '</p><ul class="case-list">' + todayCases.map(item).join("") + "</ul>" +
      '<p class="group-label">Archive</p><ul class="case-list">' + rest.map(item).join("") + "</ul>";
  }

  function rollHtml() {
    var i = 0, h = '<ol class="roll">';
    leaderboard().forEach(function (r) {
      var rk = r.eligible ? ++i : "–";
      h += '<li class="' + (r.me ? "me" : "") + '"><span class="rk">' + rk + "</span>" + avatar(r.t, "sm") +
        '<span class="nm">Chog #' + esc(r.t.id) + '<span class="sm">' + esc(r.s.rank.name) + ", " + r.s.n + " case" + (r.s.n === 1 ? "" : "s") + '</span></span><span class="ac">' + (r.s.n ? pct(r.s.acc) : "–") + "</span></li>";
    });
    return h + '</ol><p class="hint">Ranked after 5 cases. Accuracy is the share of rulings that matched the outcome.</p>';
  }

  /* ---------- case file ---------- */
  function renderCase() {
    var el = $("casefile"), t = activeToken();
    if (!t) { el.innerHTML = '<div class="empty"><h2>No Chog on the bench</h2><p>Connect a wallet or switch to the demo Chogs to hear a case.</p></div>'; return; }
    var c = ui.selected && caseById(ui.selected);
    if (!c) {
      el.innerHTML = '<div class="empty"><h2>Pick a case from the docket</h2><p>Chog #' + esc(t.id) + " is ready to rule. Today's three cases are at the top of the docket.</p></div>";
      return;
    }
    var d = rec(t.id).decided[c.id], role = roleOf(t), home = t.specialty === c.category;
    function strip(s) { s = s.replace(/^(Prosecution|Defense):\s*/, ""); return s.charAt(0).toUpperCase() + s.slice(1); }
    var h = '<article class="paper">';
    h += '<p class="sheet-head">No. ' + caseNo(c) + ". " + (c.kind === "record" ? "Record case in " : "Jury case in ") + esc(c.category) + ": " + (c.kind === "record" ? "the outcome is documented in the file." : "the outcome is the jury's majority.") + "</p>";
    h += "<h2>" + esc(c.title) + '</h2><p class="charge">' + esc(c.charge) + '</p><p class="facts">' + esc(c.facts) + "</p>";
    h += '<div class="exhibits"><section class="exhibit a"><h3>Exhibit A, for the prosecution</h3><p>' + esc(strip(c.exhibitA)) + '</p></section><section class="exhibit b"><h3>Exhibit B, for the defense</h3><p>' + esc(strip(c.exhibitB)) + "</p></section></div>";
    h += '<aside class="slip"><h3>Bench-only exhibit for a ' + role + "</h3><p>" + esc(c.bench[role]) + "</p></aside>";
    if (home) h += '<aside class="slip"><h3>Home turf: ' + esc(t.specialty) + "</h3><p>" + esc(c.instinct) + "</p></aside>";
    h += '<div class="ruling">';
    if (!d) {
      h += "<h3>Your ruling</h3>";
      h += '<div class="vote"><button class="btn guilty" data-vote="guilty">Guilty</button><button class="btn innocent" data-vote="not guilty">Not guilty</button></div>';
      h += '<label class="hint" for="note">Optional: one line of reasoning for the record</label><textarea id="note" class="note-in" maxlength="240" placeholder="Why?">' + esc(ui.drafts[c.id] || "") + "</textarea>";
      h += '<p class="hint">A ruling is final and goes on Chog #' + esc(t.id) + "'s permanent record.</p>";
    } else {
      var o = outcomeOf(c);
      h += '<div class="result"><div class="res-head"><p class="outcome">Outcome: ' + (o === "guilty" ? "Guilty" : "Not guilty") + "</p>" +
        '<div class="stamp ' + (d.correct ? "ok" : "bad") + (ui.justRuled === c.id ? " slam" : "") + '">' + (d.correct ? "Sustained" : "Overruled") + "</div></div>";
      if (c.kind === "jury") {
        h += '<div class="jury-bar" aria-hidden="true"><i style="width:' + c.crowd + '%"></i></div><div class="jury-legend"><span>' + c.crowd + "% guilty</span><span>" + (100 - c.crowd) + "% not guilty</span></div>";
      }
      h += "<p>" + esc(c.note) + "</p>";
      h += '<p class="yours"><b>Chog #' + esc(t.id) + " ruled " + (d.vote === "guilty" ? "guilty" : "not guilty") + ".</b> " + (d.correct ? "That matched the outcome." : "That did not match the outcome.") + (d.note ? "<br>On the record: “" + esc(d.note) + "”" : "") + "</p></div>";
    }
    h += "</div></article>";
    el.innerHTML = h;
  }

  /* ---------- the bench ---------- */
  function leaderboard() {
    var rows = [], t = activeToken(), pool = DEMO.concat(NPCS);
    var list = session.mode === "chain" ? session.chainTokens.concat(NPCS) : pool;
    if (session.mode === "chain" && session.remoteBoard) {
      // Shared leaderboard: everyone's real records. The player's own tokens come from their pulled record.
      var mine = {};
      session.chainTokens.forEach(function (x) { mine[x.id] = x; });
      list = session.remoteBoard.filter(function (x) { return !mine[x.id]; }).concat(session.chainTokens);
    }
    list.forEach(function (x) {
      var s = statsFor(x);
      rows.push({ t: x, s: s, me: t && x.id === t.id, eligible: s.n >= 5 });
    });
    rows.sort(function (a, b) {
      if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
      return b.s.acc - a.s.acc || b.s.n - a.s.n;
    });
    return rows;
  }

  function ladder(s) {
    // Ticks sit at the accuracy each rank needs. Case counts also matter, see the note beneath.
    var marks = [[35, "Clown line", "35"], [50, "Magistrate", "50"], [65, "Justice", "65"], [80, "Chief Justice", "80"]];
    var h = '<div class="ladder" role="img" aria-label="' + (s.n ? "Accuracy " + pct(s.acc) + ". " : "No rulings yet. ") + 'Rank thresholds sit at 35, 50, 65 and 80 percent."><div class="ladder-track">';
    if (s.n) h += '<i class="ladder-fill" style="width:' + (s.acc * 100) + '%"></i><b class="ladder-mark" style="left:' + (s.acc * 100) + '%"></b>';
    marks.forEach(function (m) { h += '<span class="tick" style="left:' + m[0] + '%"><span class="nm">' + m[1] + '</span><span class="pc">' + m[2] + "</span></span>"; });
    return h + "</div></div>";
  }

  function renderBench() {
    var t = activeToken(), el = $("bench");
    if (session.mode === "chain" && !session.chainTokens.length) {
      el.innerHTML = '<div class="bench-grid"><div class="plate plate-empty"><h2>No Chog on the bench</h2><p>' +
        (session.loading ? "Reading your wallet…" : esc(session.chainNote || "This wallet has no Chogs to load.")) + "</p>" + (session.loading ? "" : manualEntry()) + "</div></div>";
      return;
    }
    if (!t) { el.innerHTML = '<div class="bench-grid"><div class="plate plate-empty"><h2>No Chog on the bench</h2><p>Connect a wallet that holds a Chog, or use the demo Chogs.</p></div></div>'; return; }
    var s = statsFor(t), role = roleOf(t), streak = streakFor(t), owner = ownerOf(t);
    var picker = allTokens().map(function (x) {
      return '<button class="pick" data-pick="' + esc(x.id) + '" aria-pressed="' + (x.id === t.id) + '">' + avatar(x, "sm") + "#" + esc(x.id) + "</button>";
    }).join("");
    el.innerHTML =
      '<div class="bench-grid"><div class="portrait">' + avatar(t) + "</div>" +
      '<div class="plate"><div class="plate-head"><div><p class="plate-rank">' + esc(s.rank.name) + '</p><p class="plate-id"><b>Chog #' + esc(t.id) + "</b> " +
      esc(t.rarity) + " " + esc(t.temperament) + " " + role + ", " + esc(t.specialty) + " specialist</p></div>" +
      '<div class="plate-score"><b>' + (s.n ? pct(s.acc) : "–") + "</b><span>accuracy over " + s.n + " case" + (s.n === 1 ? "" : "s") + (streak ? ", " + streak + "-day streak" : "") + "</span></div></div>" +
      ladder(s) +
      '<p class="plate-note">As ' + (role === "Judge" ? "a Judge" : "a " + role) + ", this Chog sees a bench-only exhibit on every case, and a home-turf hint in " + esc(t.specialty) + " cases. " + nextRank(s) + "</p></div></div>" +
      '<div class="bench-foot"><div class="picker" role="group" aria-label="Chogs on the bench">' + picker + "</div>" +
      '<p class="prov">The record belongs to <b>token #' + esc(t.id) + "</b>, not the wallet. Owner: <b>" + esc(shortAddr(owner)) + "</b>." + (session.mode === "chain" && session.collection ? " Collection: <b>" + esc(session.collection) + "</b>." : "") +
      (session.mode === "demo" ? ' <button class="link-btn" data-sell="' + esc(t.id) + '">Simulate a sale</button>' : "") + "</p></div>";
  }
  function nextRank(s) {
    var tiers = [{ n: 5, a: 0.5, name: "Magistrate" }, { n: 10, a: 0.65, name: "Justice" }, { n: 20, a: 0.8, name: "Chief Justice" }];
    for (var i = 0; i < tiers.length; i++) {
      if (rankOf(s.n, s.acc).tier < i + 2) {
        var need = Math.max(0, tiers[i].n - s.n);
        return "Next rank: " + tiers[i].name + ", which needs " + (need ? need + " more case" + (need === 1 ? "" : "s") + " and " : "") + Math.round(tiers[i].a * 100) + "% accuracy.";
      }
    }
    return "Chief Justice is the top of the bench.";
  }
  function manualEntry() {
    return '<p style="margin-top:10px">Have a token id? Add it directly. It must be owned by the connected wallet.</p><div class="row"><input id="manual-id" inputmode="numeric" placeholder="Token id" aria-label="Token id"><button class="btn dark" data-manual>Add Chog</button></div>';
  }

  function renderWallet() {
    var w = $("wallet");
    if (session.mode === "chain") {
      w.innerHTML = '<span class="addr">' + esc(shortAddr(session.account)) + '</span><button class="btn ghost" data-act="demo">Use demo Chogs</button>';
    } else if (ui.pickWallet && wallets.length > 1) {
      w.innerHTML = '<span class="addr">Connect with</span>' + wallets.map(function (x) {
        return '<button class="btn ghost wallet-pick" data-wallet="' + esc(x.info.uuid) + '">' + (x.info.icon ? '<img src="' + esc(x.info.icon) + '" alt="" width="20" height="20"> ' : "") + esc(x.info.name) + "</button>";
      }).join("") + '<button class="link-btn" data-act="cancel-pick">Cancel</button>';
    } else {
      w.innerHTML = '<button class="btn" data-act="connect">Connect wallet</button>';
    }
  }

  function syncTabs() {
    var view = $("app").getAttribute("data-view"), active = view === "case" ? "case" : (ui.boardTab === "roll" ? "roll" : "docket");
    Array.prototype.forEach.call(document.querySelectorAll("#tabs button"), function (b) { b.classList.toggle("on", b.getAttribute("data-view") === active); });
  }

  function render() { renderWallet(); renderBench(); renderDocket(); renderCase(); syncTabs(); }

  /* ---------- actions ---------- */
  var ruling = false;
  async function rule(vote) {
    var t = activeToken(), c = caseById(ui.selected);
    if (!t || !c || ruling) return;
    var r = rec(t.id);
    if (r.decided[c.id]) return;
    var noteEl = $("note"), note = noteEl ? noteEl.value.trim().slice(0, 240) : "";
    var correct = vote === outcomeOf(c);
    if (sharedRecords()) {
      // With a backend, the server is the source of truth: the ruling only counts once it is accepted.
      ruling = true;
      try {
        var res = await pushRuling(t, c, vote, note);
        correct = res.correct;
      } catch (e) {
        ruling = false;
        toast(e && e.code === 4001 ? "Signature cancelled. The ruling was not recorded." : "The court could not record that ruling: " + (e && e.message ? e.message : "try again."));
        return;
      }
      ruling = false;
    }
    r.decided[c.id] = { vote: vote, correct: correct, note: note, ts: Date.now() };
    var dk = dateKey();
    if (r.days.indexOf(dk) < 0) r.days.push(dk);
    delete ui.drafts[c.id];
    ui.justRuled = c.id;
    save();
    render();
    ui.justRuled = null;
  }

  function selectCase(id) {
    ui.selected = id;
    render();
    setView("case");
    var el = $("casefile"); if (window.innerWidth <= 760) window.scrollTo(0, 0);
  }

  function setView(v) {
    $("app").setAttribute("data-view", v);
    syncTabs();
  }

  /* ---------- wallet / chain (raw JSON-RPC, no dependencies) ---------- */
  function pad32(hexNoPrefix) { return hexNoPrefix.padStart(64, "0"); }
  function ethCall(to, data) { return eth().request({ method: "eth_call", params: [{ to: to, data: data }, "latest"] }); }
  function decodeString(hex) {
    hex = hex.replace(/^0x/, "");
    var len = parseInt(hex.slice(64, 128), 16), data = hex.slice(128, 128 + len * 2), bytes = [];
    for (var i = 0; i < data.length; i += 2) bytes.push(parseInt(data.slice(i, i + 2), 16));
    return new TextDecoder().decode(new Uint8Array(bytes));
  }
  function gateway(u) { return u && u.indexOf("ipfs://") === 0 ? CFG.IPFS_GATEWAY + u.slice(7).replace(/^ipfs\//, "") : u; }

  function traitsFromMeta(attrs, id) {
    var mapped = CFG.mapTraits && CFG.mapTraits(attrs, id);
    if (mapped) return mapped;
    var h = hash(JSON.stringify(attrs || []) + ":" + id);
    return { temperament: TEMPERAMENTS[h % 4], specialty: SPECIALTIES[(h >> 3) % 5], rarity: RARITIES[(h >> 6) % 3] };
  }

  async function loadToken(id) {
    var tok = { id: String(id), source: "chain", base: { cases: 0, correct: 0 }, temperament: "Stern", specialty: "Memes", rarity: "Common" };
    try {
      var uri = decodeString(await ethCall(CFG.NFT_CONTRACT, "0xc87b56dd" + pad32(BigInt(id).toString(16))));
      var meta = await (await fetch(gateway(uri))).json();
      var tr = traitsFromMeta(meta.attributes, id);
      tok.temperament = tr.temperament; tok.specialty = tr.specialty; tok.rarity = tr.rarity;
      if (meta.image) tok.image = gateway(meta.image);
    } catch (e) {
      var tr2 = traitsFromMeta([], id);
      tok.temperament = tr2.temperament; tok.specialty = tr2.specialty; tok.rarity = tr2.rarity;
    }
    return tok;
  }

  async function connect(p) {
    p = p || (wallets.length === 1 ? wallets[0].provider : window.ethereum);
    if (!p) {
      toast(location.protocol === "file:"
        ? "Wallet extensions can't reach a page opened from a file. Open the hosted link, or run the folder with a local server."
        : "No wallet found. Install a Monad-compatible wallet, or keep using the demo Chogs.");
      return;
    }
    session.provider = p;
    try {
      var accts = await p.request({ method: "eth_requestAccounts" });
      session.account = accts[0];
      try {
        await p.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CFG.CHAIN.chainId }] });
      } catch (e) {
        if (e && e.code === 4902) await p.request({ method: "wallet_addEthereumChain", params: [CFG.CHAIN] });
        else throw e;
      }
      session.mode = "chain"; session.chainTokens = []; session.chainNote = ""; session.collection = ""; session.loading = true;
      ui.selected = null; ui.boardTab = "docket"; ui.pickWallet = false;
      render();
      await fetchOwned();
    } catch (e) {
      session.mode = "demo"; session.provider = null;
      toast(e && e.code === 4001 ? "Connection cancelled." : "Could not connect. Check the network settings in your wallet.");
      render();
    }
  }

  async function readName() {
    try { return decodeString(await ethCall(CFG.NFT_CONTRACT, "0x06fdde03")); } catch (e) { return ""; }
  }

  // Sets session.chainTokens, or a note that says exactly why none were found.
  async function loadOwned() {
    var acct = session.account.slice(2).toLowerCase();
    // 1. Is the wallet on the right network?
    var chainId = await eth().request({ method: "eth_chainId" });
    if (String(chainId).toLowerCase() !== CFG.CHAIN.chainId.toLowerCase()) {
      session.chainNote = "Your wallet is on network " + parseInt(chainId, 16) + ", but Chog Court reads Monad (" + parseInt(CFG.CHAIN.chainId, 16) + "). Switch networks in your wallet, then connect again.";
      return;
    }
    // 2. Is there a contract at the configured address?
    var code = await eth().request({ method: "eth_getCode", params: [CFG.NFT_CONTRACT, "latest"] });
    if (!code || code === "0x") {
      session.chainNote = "There is no contract at " + shortAddr(CFG.NFT_CONTRACT) + " on this network. Check NFT_CONTRACT in config.js.";
      return;
    }
    session.collection = await readName();
    // 3. How many tokens does this wallet hold?
    var bal = parseInt(await ethCall(CFG.NFT_CONTRACT, "0x70a08231" + pad32(acct)), 16);
    if (isNaN(bal)) {
      session.chainNote = "The contract at " + shortAddr(CFG.NFT_CONTRACT) + " didn't answer like an NFT contract. Check NFT_CONTRACT in config.js.";
      return;
    }
    if (!bal) {
      session.chainNote = (session.collection ? "Collection found: " + session.collection + ". " : "") + "This wallet holds none of its tokens. If you own one, connect the wallet that holds it. You can also use the demo Chogs.";
      return;
    }
    var toks = [], n = Math.min(bal, 24);
    for (var i = 0; i < n; i++) {
      var idHex = await ethCall(CFG.NFT_CONTRACT, "0x2f745c59" + pad32(acct) + pad32(i.toString(16)));
      toks.push(await loadToken(BigInt(idHex).toString()));
    }
    session.chainTokens = toks;
    if (toks.length) state.activeId = toks[0].id;
  }

  async function fetchOwned() {
    if (!CFG.NFT_CONTRACT) {
      session.loading = false;
      session.chainNote = "Wallet connected, but the Chog NFT contract address isn't set yet. Add it to config.js to load your Chogs.";
      render(); return;
    }
    try { await loadOwned(); }
    catch (e) { session.chainNote = "Couldn't list your tokens automatically (the collection may not support enumeration). Add a token id below."; }
    session.loading = false;
    render();
    syncShared();
  }

  async function addManual() {
    var v = ($("manual-id") || {}).value;
    if (!v || !/^\d+$/.test(v)) { toast("Enter a numeric token id."); return; }
    try {
      var owner = "0x" + (await ethCall(CFG.NFT_CONTRACT, "0x6352211e" + pad32(BigInt(v).toString(16)))).slice(-40);
      if (owner.toLowerCase() !== session.account.toLowerCase()) { toast("That token is not owned by the connected wallet."); return; }
      var tok = await loadToken(v);
      session.chainTokens.push(tok); state.activeId = tok.id; save(); render(); syncShared();
    } catch (e) { toast(CFG.NFT_CONTRACT ? "Couldn't verify that token." : "Set the NFT contract in config.js first."); }
  }

  /* ---------- shared records (optional backend) ---------- */
  var BE = CFG.BACKEND || {};
  function sharedRecords() { return session.mode === "chain" && !!(BE.url && BE.anonKey && CFG.NFT_CONTRACT); }
  function beHeaders(extra) { return Object.assign({ apikey: BE.anonKey, Authorization: "Bearer " + BE.anonKey }, extra || {}); }
  function utf8Hex(s) { return "0x" + Array.prototype.map.call(new TextEncoder().encode(s), function (b) { return b.toString(16).padStart(2, "0"); }).join(""); }
  function rulingMessage(contract, tokenId, caseId, vote, ts) {
    // The edge function rebuilds this exact string to verify the signature.
    return "Chog Court ruling\nContract: " + contract.toLowerCase() + "\nToken: " + tokenId + "\nCase: " + caseId + "\nVote: " + vote + "\nTime: " + ts;
  }

  async function pushRuling(t, c, vote, note) {
    var ts = Date.now(), msg = rulingMessage(CFG.NFT_CONTRACT, t.id, c.id, vote, ts);
    var signature = await eth().request({ method: "personal_sign", params: [utf8Hex(msg), session.account] });
    var res = await fetch(BE.url + "/functions/v1/submit-ruling", {
      method: "POST",
      headers: beHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ contract: CFG.NFT_CONTRACT, tokenId: t.id, caseId: c.id, vote: vote, note: note, ts: ts, account: session.account, signature: signature })
    });
    var body = {};
    try { body = await res.json(); } catch (e) { /* non-JSON error body */ }
    if (!res.ok) throw new Error(body.error || "server said " + res.status);
    return { correct: !!body.correct };
  }

  // Pull a token's record from the server. Whoever owns the token now sees the same record.
  async function pullRecord(t) {
    if (!sharedRecords() || !t) return;
    try {
      var url = BE.url + "/rest/v1/rulings?select=case_id,vote,correct,note,created_at&contract=eq." + encodeURIComponent(CFG.NFT_CONTRACT.toLowerCase()) + "&token_id=eq." + encodeURIComponent(t.id);
      var rows = await (await fetch(url, { headers: beHeaders() })).json();
      if (!Array.isArray(rows)) return;
      var r = rec(t.id);
      r.decided = {}; r.days = [];
      rows.forEach(function (row) {
        r.decided[row.case_id] = { vote: row.vote, correct: row.correct, note: row.note || "", ts: Date.parse(row.created_at) };
        var dk = dateKey(new Date(row.created_at));
        if (r.days.indexOf(dk) < 0) r.days.push(dk);
      });
      save();
    } catch (e) { /* offline: fall back to whatever is cached locally */ }
  }

  async function pullBoard() {
    if (!sharedRecords()) return;
    try {
      var url = BE.url + "/rest/v1/token_stats?select=token_id,cases,correct&contract=eq." + encodeURIComponent(CFG.NFT_CONTRACT.toLowerCase()) + "&order=cases.desc&limit=100";
      var rows = await (await fetch(url, { headers: beHeaders() })).json();
      if (!Array.isArray(rows)) return;
      session.remoteBoard = rows.map(function (row) {
        var tr = traitsFromMeta([], row.token_id);
        return { id: String(row.token_id), source: "chain", remote: true, temperament: tr.temperament, specialty: tr.specialty, rarity: tr.rarity, base: { cases: row.cases, correct: row.correct } };
      });
    } catch (e) { session.remoteBoard = null; }
  }

  async function syncShared() {
    if (!sharedRecords()) return;
    await Promise.all(session.chainTokens.map(pullRecord).concat([pullBoard()]));
    render();
  }

  function simulateSale(id) {
    var hex = "", seed = id + ":" + Date.now();
    while (hex.length < 40) { seed = hash(seed).toString(16).padStart(8, "0") + seed.slice(0, 6); hex += seed.slice(0, 8); }
    state.owners[id] = "0x" + hex.slice(0, 40); save(); render();
    toast("Chog #" + id + " sold. The record stayed with the token.");
  }

  /* ---------- events ---------- */
  document.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.dataset.case) return selectCase(b.dataset.case);
    if (b.dataset.vote) return rule(b.dataset.vote);
    if (b.dataset.pick) { state.activeId = b.dataset.pick; save(); return render(); }
    if (b.dataset.btab) { ui.boardTab = b.dataset.btab; renderDocket(); return syncTabs(); }
    if (b.dataset.sell) return simulateSale(b.dataset.sell);
    if (b.dataset.manual !== undefined) return addManual();
    if (b.dataset.act === "connect") {
      if (wallets.length > 1) { ui.pickWallet = true; return renderWallet(); }
      return connect();
    }
    if (b.dataset.act === "cancel-pick") { ui.pickWallet = false; return renderWallet(); }
    if (b.dataset.wallet) {
      var chosen = wallets.filter(function (x) { return x.info.uuid === b.dataset.wallet; })[0];
      return chosen && connect(chosen.provider);
    }
    if (b.dataset.act === "demo") { session.mode = "demo"; session.provider = null; state.activeId = DEMO[0].id; ui.selected = null; return render(); }
    if (b.parentNode && b.parentNode.id === "tabs") {
      var v = b.dataset.view;
      if (v === "roll") { ui.boardTab = "roll"; v = "docket"; } else if (v === "docket") { ui.boardTab = "docket"; }
      renderDocket(); return setView(v);
    }
  });
  document.addEventListener("input", function (e) {
    if (e.target.id === "note" && ui.selected) ui.drafts[ui.selected] = e.target.value;
  });

  render();
})();
