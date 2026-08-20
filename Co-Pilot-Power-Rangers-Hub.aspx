<%@ Page Language="C#" ContentType="text/html" ResponseEncoding="utf-8" %>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Co-Pilot Power Rangers Hub · Store Operations</title>
<style>
:root{--ink:#101828;--muted:#667085;--brand:#6236ff;--brand2:#00a7a0;--hot:#ff4d86;--gold:#ffbd2e;--paper:#f7f8fc;--card:#fff;--line:#e7e9f1;--shadow:0 18px 45px rgba(35,28,78,.10)}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;color:var(--ink);font:15px/1.55 "Segoe UI",Arial,sans-serif;background:radial-gradient(circle at 10% -20%,#ddd2ff 0,transparent 32%),radial-gradient(circle at 95% 5%,#c8fff4 0,transparent 28%),var(--paper)}
a{color:inherit}.wrap{width:min(1180px,calc(100% - 32px));margin:auto}
.top{position:sticky;top:0;z-index:20;background:rgba(255,255,255,.92);backdrop-filter:blur(16px);border-bottom:1px solid rgba(231,233,241,.8)}
.nav{height:68px;display:flex;align-items:center;gap:20px}.brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:18px;text-decoration:none;color:var(--ink)}
.bolt{display:grid;place-items:center;width:40px;height:40px;border-radius:13px;color:#fff;background:linear-gradient(135deg,var(--brand),var(--hot));box-shadow:0 8px 18px #6236ff42;font-size:18px}
.links{display:flex;gap:20px;margin-left:auto}.links a{text-decoration:none;color:#475467;font-weight:600;font-size:14px}
.nav-btn{border:0;border-radius:12px;padding:10px 18px;font-weight:750;cursor:pointer;color:#fff;background:linear-gradient(135deg,var(--brand),#865cff);box-shadow:0 6px 16px #6236ff42;font-size:14px}

/* HERO */
.hero{padding:72px 0 48px}
.heroGrid{display:grid;grid-template-columns:1.1fr .9fr;gap:48px;align-items:center}
.eyebrow{display:inline-flex;gap:8px;align-items:center;padding:7px 12px;border:1px solid #d9d0ff;border-radius:99px;background:#f0ecff;color:#4b2acb;font-weight:750;font-size:13px}
.hero h1{font-size:clamp(40px,6vw,72px);line-height:.96;letter-spacing:-3px;margin:18px 0;font-weight:900}
.gradient{background:linear-gradient(90deg,var(--brand),var(--hot),#f08b22);-webkit-background-clip:text;background-clip:text;color:transparent}
.lead{font-size:18px;color:#475467;max-width:620px;line-height:1.6}
.actions{display:flex;gap:12px;flex-wrap:wrap;margin:24px 0}
.btn-primary{border:0;border-radius:12px;padding:12px 22px;font-weight:750;cursor:pointer;color:#fff;background:linear-gradient(135deg,var(--brand),#865cff);box-shadow:0 6px 16px #6236ff42;font-size:14px;text-decoration:none;display:inline-block}
.btn-secondary{border:1px solid var(--line);border-radius:12px;padding:12px 22px;font-weight:700;cursor:pointer;background:#fff;color:var(--ink);font-size:14px;text-decoration:none;display:inline-block}
.btn-set{background:linear-gradient(135deg,#5b21b6,#7c3aed);color:#fff;border-radius:12px;padding:12px 22px;font-weight:750;font-size:14px;text-decoration:none;display:inline-block;box-shadow:0 6px 16px rgba(91,33,182,.35)}
.stats{display:flex;gap:28px;margin-top:28px;flex-wrap:wrap}
.stats b{display:block;font-size:22px;font-weight:900}.stats span{color:var(--muted);font-size:13px}

/* HERO CARD */
.heroCard{position:relative;background:#17112f;color:#fff;border-radius:28px;padding:28px;min-height:400px;overflow:hidden;box-shadow:0 30px 70px #32216a3d}
.heroCard:before,.heroCard:after{content:"";position:absolute;border-radius:50%;filter:blur(2px)}
.heroCard:before{width:220px;height:220px;right:-80px;top:-60px;background:#7047ff}
.heroCard:after{width:160px;height:160px;left:-80px;bottom:-60px;background:#00b6ad}
.screen{position:relative;z-index:2;margin-top:28px;background:rgba(255,255,255,.11);border:1px solid rgba(255,255,255,.18);border-radius:18px;padding:16px;backdrop-filter:blur(12px)}
.prompt{background:#fff;color:#20202b;border-radius:12px;padding:13px;margin:8px 0;box-shadow:0 6px 16px #0002}
.prompt small{color:#667085;font-size:12px}
.spark{color:#ffd25a}

/* SECTIONS */
.section{padding:44px 0}
.head{display:flex;align-items:end;justify-content:space-between;gap:16px;margin-bottom:20px}
.head h2{font-size:32px;letter-spacing:-1px;margin:0;font-weight:900}
.head p{color:var(--muted);margin:5px 0 0;font-size:15px}

/* SET SPOTLIGHT BAND */
.set-band{background:linear-gradient(135deg,#1e0a3c,#5b21b6 50%,#0d9488);color:#fff;border-radius:24px;padding:40px;margin-bottom:24px;position:relative;overflow:hidden}
.set-band::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 80% 50%,rgba(139,92,246,.3) 0,transparent 60%)}
.set-band h2{font-size:28px;font-weight:900;letter-spacing:-.5px;position:relative;z-index:2;margin-bottom:10px}
.set-band p{font-size:15px;color:rgba(255,255,255,.8);max-width:560px;position:relative;z-index:2;margin-bottom:20px}
.set-band-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;position:relative;z-index:2}
.set-band-item{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);border-radius:14px;padding:16px}
.set-band-item h4{font-size:14px;font-weight:800;margin-bottom:5px}
.set-band-item p{font-size:12px;opacity:.8;margin:0;line-height:1.4}

/* CARDS */
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:20px;box-shadow:0 6px 20px rgba(30,35,60,.05);transition:.2s;text-decoration:none;color:var(--ink);display:block}
.card:hover{transform:translateY(-3px);box-shadow:var(--shadow)}
.icon{width:44px;height:44px;display:grid;place-items:center;border-radius:13px;background:#eee9ff;font-size:21px;margin-bottom:14px}
.card h3{margin:0 0 5px;font-size:15px;font-weight:800}
.card p{margin:0;color:var(--muted);font-size:13px;line-height:1.5}
.tag{display:inline-block;margin-top:12px;padding:4px 9px;background:#eefbf8;color:#087a72;border-radius:99px;font-size:11px;font-weight:750}

/* QUICK LINKS */
.quick{grid-template-columns:repeat(4,1fr)}
.quick .card{min-height:140px}

/* IDEA BAND */
.ideaBand{display:grid;grid-template-columns:1fr auto;align-items:center;gap:20px;background:linear-gradient(135deg,#5327dd,#7657ff 55%,#00a7a0);color:#fff;border-radius:24px;padding:36px;box-shadow:var(--shadow)}
.ideaBand h2{font-size:30px;margin:0;font-weight:900}.ideaBand p{margin:6px 0 0;color:#eee9ff;font-size:15px}

/* MODAL */
.modal{position:fixed;inset:0;display:none;place-items:center;padding:20px;background:#12101dcc;z-index:50}
.modal.open{display:grid}
.dialog{width:min(680px,100%);max-height:94vh;overflow:auto;background:#fff;border-radius:22px;padding:24px;box-shadow:0 40px 100px #0005}
.dialogHead{display:flex;justify-content:space-between;align-items:start}
.dialog h2{margin:0;font-size:26px;font-weight:900}
.x{border:0;background:#f2f3f7;border-radius:9px;width:36px;height:36px;font-size:20px;cursor:pointer}
.formGrid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:18px}
.field{display:grid;gap:5px}.field.full{grid-column:1/-1}
.field label{font-weight:700;font-size:13px}
.field input,.field select,.field textarea{width:100%;padding:11px 12px;border:1px solid #d7dae3;border-radius:10px;font:inherit;font-size:14px}
.field textarea{min-height:120px;resize:vertical}
.notice{background:#f6f3ff;color:#4c3298;padding:10px 12px;border-radius:9px;margin-top:12px;font-size:12px}
.status{display:none;margin-top:12px;padding:10px;border-radius:9px}
.status.show{display:block}.ok{background:#e9fbf5;color:#08705e}.bad{background:#fff0f2;color:#a51b3c}

/* FOOTER */
.footer{padding:36px 0 52px;color:#667085}
.footerFlex{display:flex;justify-content:space-between;gap:16px;border-top:1px solid var(--line);padding-top:22px;flex-wrap:wrap}

@media(max-width:850px){.links{display:none}.heroGrid{grid-template-columns:1fr}.grid,.quick,.set-band-grid{grid-template-columns:1fr 1fr}.ideaBand{grid-template-columns:1fr}}
@media(max-width:560px){.grid,.quick,.formGrid,.set-band-grid{grid-template-columns:1fr}.stats{gap:16px}.heroCard{min-height:auto}}
</style>
</head>
<body>

<header class="top">
  <div class="wrap nav">
    <a class="brand" href="#top">
      <span class="bolt">⚡</span> Co-Pilot Power Rangers
    </a>
    <nav class="links">
      <a href="#set">SET + SET Loop</a>
      <a href="#discover">Discover</a>
      <a href="#prompts">Prompt Lab</a>
      <a href="#links">Quick Links</a>
    </nav>
    <button class="nav-btn" data-open>Submit an idea</button>
  </div>
</header>

<main>
  <!-- HERO -->
  <section class="hero">
    <div class="wrap heroGrid">
      <div>
        <span class="eyebrow">✨ Built by associates, powered by possibility</span>
        <h1>Make work <span class="gradient">simpler.</span><br>Share what works.</h1>
        <p class="lead">A Store Operations community for discovering Copilot prompts, sharing smart automations, and turning everyday friction into enterprise-wide solutions.</p>
        <div class="actions">
          <a class="btn-set" href="https://kcmooreghcp.github.io/Power-Rangers-Hub-Website/vp-presentation.html" target="_blank">⚡ See SET + SET Loop →</a>
          <button class="btn-primary" data-open>Can you help me automate this?</button>
          <a class="btn-secondary" href="#prompts">Explore prompt ideas</a>
        </div>
        <div class="stats">
          <div><b id="ideaCount">0</b><span>Ideas captured</span></div>
          <div><b>1 team</b><span>Learning together</span></div>
          <div><b>∞</b><span>Possibilities</span></div>
        </div>
      </div>
      <div class="heroCard">
        <div style="position:relative;z-index:2">
          <b class="spark">✦ PROMPT OF THE WEEK</b>
          <h2 style="font-size:28px;line-height:1.1;margin:12px 0">Turn a messy update into a leadership-ready recap.</h2>
          <div class="screen">
            <div class="prompt"><small>START WITH</small><br><b>"Act as a Store Operations leader..."</b></div>
            <div class="prompt"><small>ADD CONTEXT</small><br><b>Audience, deadline, risks, owner, desired format</b></div>
            <div class="prompt"><small>FINISH WITH</small><br><b>"Ask me three questions before drafting."</b></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- SET + SET LOOP SPOTLIGHT -->
  <section class="section" id="set">
    <div class="wrap">
      <div class="set-band">
        <h2>⚡ SET + SET Loop — Store Operations Intelligence Platform</h2>
        <p>A role-based, governed platform built entirely on Microsoft 365. Every store, district, region, and home office leader gets exactly what they need — when they need it. 798 stores. 4 brands. $0 new licenses.</p>
        <div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap">
          <a class="btn-primary" href="https://kcmooreghcp.github.io/Power-Rangers-Hub-Website/vp-presentation.html" target="_blank">Open the full presentation →</a>
          <a class="btn-secondary" style="color:#fff;border-color:rgba(255,255,255,.3);background:rgba(255,255,255,.12)" href="https://kcmooreghcp.github.io/Power-Rangers-Hub-Website/vp-presentation.html#roles" target="_blank">See role views →</a>
        </div>
        <div class="set-band-grid">
          <div class="set-band-item">
            <h4>🏪 Store View</h4>
            <p>Store-specific floorset, open-to-close checklist, promotions, announcements, and MSI assortment access. Your store. Your map. Your plan.</p>
          </div>
          <div class="set-band-item">
            <h4>📋 District + Region View</h4>
            <p>Real-time store readiness, pattern detection, open field questions, and escalation routing — without waiting for weekly calls.</p>
          </div>
          <div class="set-band-item">
            <h4>🏢 Home Office View</h4>
            <p>Publishing queue, cross-functional partner intake, approval workflow, and field intelligence in one governed hub.</p>
          </div>
          <div class="set-band-item">
            <h4>⚙️ Production Flow</h4>
            <p>Partner Intake → Asset Prep → Cycle Intake → Floorset Factory → Live Mapping → Publish → SET Loop. Every step connected.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- DISCOVER -->
  <section class="section" id="discover">
    <div class="wrap">
      <div class="head">
        <div><h2>What can we unlock together?</h2><p>Start with the challenge. The community can help shape the solution.</p></div>
      </div>
      <div class="grid">
        <article class="card">
          <div class="icon">⚙️</div>
          <h3>Automate repetitive work</h3>
          <p>Surface manual steps, handoffs, trackers, and recurring updates that deserve a smarter workflow.</p>
          <span class="tag">Automation idea</span>
        </article>
        <article class="card">
          <div class="icon">💬</div>
          <h3>Build a better prompt</h3>
          <p>Share prompts that create clear recaps, plans, communications, analyses, and first drafts.</p>
          <span class="tag">Prompt exchange</span>
        </article>
        <article class="card">
          <div class="icon">🚀</div>
          <h3>Scale what works</h3>
          <p>Turn a local win into a reusable playbook that can help teams across the enterprise.</p>
          <span class="tag">Enterprise impact</span>
        </article>
      </div>
    </div>
  </section>

  <!-- PROMPT LAB -->
  <section class="section" id="prompts">
    <div class="wrap">
      <div class="head">
        <div><h2>Prompt launchpad</h2><p>Copy a starting point, then make it yours.</p></div>
      </div>
      <div class="grid" id="promptGrid">
        <article class="card">
          <div class="icon">📝</div>
          <h3>Leadership recap</h3>
          <p>Summarize these updates into decisions, wins, risks, owner actions, and deadlines. Make the tone concise and leadership-ready.</p>
          <button class="btn-secondary copy" style="margin-top:14px;width:100%" data-copy="Summarize these updates into decisions, wins, risks, owner actions, and deadlines. Make the tone concise and leadership-ready.">Copy prompt</button>
        </article>
        <article class="card">
          <div class="icon">🔎</div>
          <h3>Find the friction</h3>
          <p>Review this process. Identify repetitive steps, duplicate entry, unclear ownership, and the three best automation opportunities.</p>
          <button class="btn-secondary copy" style="margin-top:14px;width:100%" data-copy="Review this process. Identify repetitive steps, duplicate entry, unclear ownership, and the three best automation opportunities.">Copy prompt</button>
        </article>
        <article class="card">
          <div class="icon">🧭</div>
          <h3>Create a field action plan</h3>
          <p>Convert this direction into a simple action plan with what, why, owner, timing, dependencies, and a store-ready checklist.</p>
          <button class="btn-secondary copy" style="margin-top:14px;width:100%" data-copy="Convert this direction into a simple action plan with what, why, owner, timing, dependencies, and a store-ready checklist.">Copy prompt</button>
        </article>
        <article class="card">
          <div class="icon">📊</div>
          <h3>Build a business case</h3>
          <p>Help me quantify the cost of this current process. Use time, volume, rate, and frequency to estimate annual impact.</p>
          <button class="btn-secondary copy" style="margin-top:14px;width:100%" data-copy="Help me quantify the cost of this current process. Use time, volume, rate, and frequency to estimate annual impact in dollars.">Copy prompt</button>
        </article>
        <article class="card">
          <div class="icon">📣</div>
          <h3>Write a field communication</h3>
          <p>Write a clear, action-oriented communication for store leaders. Include the what, why, when, who, and expected proof.</p>
          <button class="btn-secondary copy" style="margin-top:14px;width:100%" data-copy="Write a clear, action-oriented communication for store leaders. Include the what, why, when, who, and expected proof of completion.">Copy prompt</button>
        </article>
        <article class="card">
          <div class="icon">🔄</div>
          <h3>Process improvement pitch</h3>
          <p>Turn this friction point into a one-page improvement pitch: problem, solution, time saved, who benefits, and next step.</p>
          <button class="btn-secondary copy" style="margin-top:14px;width:100%" data-copy="Turn this friction point into a one-page improvement pitch: problem statement, proposed solution, estimated time saved, who benefits, and recommended next step.">Copy prompt</button>
        </article>
      </div>
    </div>
  </section>

  <!-- QUICK LINKS -->
  <section class="section" id="links">
    <div class="wrap">
      <div class="head">
        <div><h2>Quick links</h2><p>Your most-used destinations — update the CONFIG to customize for your team.</p></div>
      </div>
      <div class="grid quick" id="quickLinks"></div>
    </div>
  </section>

  <!-- IDEA BAND -->
  <section class="section">
    <div class="wrap">
      <div class="ideaBand">
        <div>
          <h2>There has to be a better way.</h2>
          <p>Tell the Co-Pilot Power Rangers what feels slow, repetitive, or harder than it should be.</p>
        </div>
        <button class="btn-primary" data-open>Drop your idea →</button>
      </div>
    </div>
  </section>
</main>

<footer class="footer">
  <div class="wrap footerFlex">
    <div><b>Co-Pilot Power Rangers</b><br>Store Operations Innovation Hub</div>
    <div><a href="https://kcmooreghcp.github.io/Power-Rangers-Hub-Website/vp-presentation.html" target="_blank" style="color:var(--brand);font-weight:700;text-decoration:none">⚡ SET + SET Loop Presentation →</a></div>
    <div>Learn · Build · Share · Scale</div>
  </div>
</footer>

<!-- IDEA SUBMISSION MODAL -->
<div class="modal" id="modal" role="dialog" aria-modal="true" aria-labelledby="formTitle">
  <div class="dialog">
    <div class="dialogHead">
      <div>
        <h2 id="formTitle">Share a challenge or idea</h2>
        <p style="color:#667085;margin:5px 0;font-size:14px">Give us enough detail to understand the opportunity.</p>
      </div>
      <button class="x" data-close aria-label="Close">×</button>
    </div>
    <form id="ideaForm">
      <div class="formGrid">
        <div class="field"><label for="name">Name *</label><input id="name" name="name" required autocomplete="name"></div>
        <div class="field"><label for="email">Email *</label><input id="email" name="email" type="email" required autocomplete="email"></div>
        <div class="field"><label for="team">Team / function</label><input id="team" name="team"></div>
        <div class="field"><label for="type">Request type *</label>
          <select id="type" name="type" required>
            <option value="">Choose one</option>
            <option>Help me automate this</option>
            <option>Build or improve a prompt</option>
            <option>Share a success</option>
            <option>I want to join the SET + SET Loop pilot</option>
            <option>I know there is a better way</option>
            <option>Other</option>
          </select>
        </div>
        <div class="field full"><label for="title">Short title *</label><input id="title" name="title" maxlength="120" required></div>
        <div class="field full"><label for="details">What are you trying to improve? *</label><textarea id="details" name="details" required placeholder="Describe the current process, pain point, frequency, people involved, and what a great outcome would look like."></textarea></div>
        <div class="field full"><label for="impact">Who would this help?</label><input id="impact" name="impact" placeholder="Example: store leaders, field teams, home office partners"></div>
      </div>
      <div class="notice">Your name and email are collected so the team can follow up if more context is needed.</div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
        <button type="button" class="btn-secondary" data-close>Cancel</button>
        <button class="btn-primary" type="submit">Send to the Rangers</button>
      </div>
      <div class="status" id="status"></div>
    </form>
  </div>
</div>

<script>
/* EDIT ONLY THIS CONFIG BLOCK WHEN CONNECTING TO SHAREPOINT */
const CONFIG = {
  powerAutomateUrl: "",
  quickLinks: [
    { title:"SET + SET Loop", description:"Full VP presentation — role views, production flow, business case.", icon:"⚡", url:"https://kcmooreghcp.github.io/Power-Rangers-Hub-Website/vp-presentation.html" },
    { title:"Copilot home", description:"Start a conversation or build a prompt.", icon:"✨", url:"https://m365.cloud.microsoft/chat" },
    { title:"Power Automate", description:"Explore and manage automated workflows.", icon:"🔄", url:"https://make.powerautomate.com/" },
    { title:"MSI Library", description:"MicroStrategy dossier — inventory, assortment, tiering.", icon:"📊", url:"https://vsedwmsi.cloud.microstrategy.com/MicroStrategyLibrary/app/1E1519614F2E617176CC408B65E2FCA7/44DC93621D43083ACE487DB2DBDCD0D9/share" },
    { title:"SharePoint Hub", description:"Co-Pilot Power Rangers Hub home.", icon:"🏠", url:"https://vscocorp.sharepoint.com/sites/Co-PilotPowerRangersHub" },
    { title:"Prompt library", description:"Replace with your enterprise prompt resource.", icon:"📚", url:"#" },
    { title:"Team resources", description:"Replace with your Store Operations destination.", icon:"👥", url:"#" },
    { title:"Submit an idea", description:"Tell us what's broken, slow, or could be better.", icon:"💡", url:"javascript:document.querySelector('[data-open]').click()" }
  ]
};

const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
const modal = $('#modal'), form = $('#ideaForm'), status = $('#status');

CONFIG.quickLinks.forEach(x => {
  $('#quickLinks').insertAdjacentHTML('beforeend',
    `<a href="${x.url}" ${x.url.startsWith('http') ? 'target="_blank" rel="noopener"' : ''} class="card">
      <div class="icon">${x.icon}</div><h3>${x.title}</h3><p>${x.description}</p>
    </a>`);
});

function openModal() { modal.classList.add('open'); setTimeout(() => $('#name').focus(), 50); }
function closeModal() { modal.classList.remove('open'); }

$$('[data-open]').forEach(b => b.onclick = openModal);
$$('[data-close]').forEach(b => b.onclick = closeModal);
modal.onclick = e => { if (e.target === modal) closeModal(); };
document.onkeydown = e => { if (e.key === 'Escape') closeModal(); };

function count() {
  const ideas = JSON.parse(localStorage.getItem('cprIdeas') || '[]');
  $('#ideaCount').textContent = ideas.length;
}
count();

$$('.copy').forEach(b => b.onclick = async () => {
  await navigator.clipboard.writeText(b.dataset.copy);
  const old = b.textContent; b.textContent = 'Copied ✓';
  setTimeout(() => b.textContent = old, 1500);
});

form.onsubmit = async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  data.submittedAt = new Date().toISOString();
  status.className = 'status show'; status.textContent = 'Sending...';
  try {
    if (CONFIG.powerAutomateUrl) {
      const r = await fetch(CONFIG.powerAutomateUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error('Failed');
    } else {
      const ideas = JSON.parse(localStorage.getItem('cprIdeas') || '[]');
      ideas.push(data); localStorage.setItem('cprIdeas', JSON.stringify(ideas));
    }
    status.className = 'status show ok';
    status.textContent = CONFIG.powerAutomateUrl ? 'Idea submitted. Thank you!' : 'Demo saved in this browser. Add the Power Automate URL to go live.';
    form.reset(); count(); setTimeout(closeModal, 2400);
  } catch (err) {
    status.className = 'status show bad';
    status.textContent = 'Could not submit. Please try again or contact the site owner.';
  }
};
</script>
</body>
</html>
