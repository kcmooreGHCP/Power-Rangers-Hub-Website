(function () {
  'use strict';

  const LEDGER_KEY = 'setloop_pilot_ledger_v1';
  const PROFILE_KEY = 'setloop_pilot_profile_v1';
  const SESSION_KEY = 'setloop_pilot_session_v1';
  const OWNER_KEY = 'setloop_pilot_owner_email_v1';
  const REFERRAL_KEY = 'setloop_pilot_referral_v1';
  const PAGE_NAME = document.title || location.pathname.split('/').pop() || 'SET Loop';
  let pendingReactionId = '';

  function id(prefix) {
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function read(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch (error) {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function sessionId() {
    let value = sessionStorage.getItem(SESSION_KEY);
    if (!value) {
      value = id('session');
      sessionStorage.setItem(SESSION_KEY, value);
    }
    return value;
  }

  function profile() {
    return read(PROFILE_KEY, { name: '', department: '', level: '', email: '' });
  }

  function saveProfile(values) {
    const next = {
      name: values.name || '',
      department: values.department || '',
      level: values.level || '',
      email: values.email || ''
    };
    write(PROFILE_KEY, next);
    return next;
  }

  function referral() {
    const params = new URLSearchParams(location.search);
    const incoming = {
      referralId: params.get('setref') || '',
      recipientDepartment: params.get('dept') || '',
      recipientLevel: params.get('level') || ''
    };
    if (incoming.referralId) {
      sessionStorage.setItem(REFERRAL_KEY, JSON.stringify(incoming));
      return incoming;
    }
    try {
      return JSON.parse(sessionStorage.getItem(REFERRAL_KEY)) || incoming;
    } catch (error) {
      return incoming;
    }
  }

  function ownerEmail() {
    const routed = decodeOwnerRoute(new URLSearchParams(location.hash.slice(1)).get('route'));
    return routed || localStorage.getItem(OWNER_KEY) || '';
  }

  function saveOwnerEmail(value) {
    const email = (value || '').trim();
    if (email) localStorage.setItem(OWNER_KEY, email);
    return email;
  }

  function encodeOwnerRoute(email) {
    if (!email) return '';
    return btoa(unescape(encodeURIComponent(email))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function decodeOwnerRoute(value) {
    if (!value) return '';
    try {
      const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
      const email = decodeURIComponent(escape(atob(padded)));
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
    } catch (error) {
      return '';
    }
  }

  function record(type, details) {
    const ledger = read(LEDGER_KEY, []);
    const entry = Object.assign({
      id: id(type),
      type: type,
      timestamp: new Date().toISOString(),
      page: PAGE_NAME,
      path: location.pathname,
      sessionId: sessionId(),
      profile: profile()
    }, referral(), details || {});
    ledger.push(entry);
    write(LEDGER_KEY, ledger);
    window.dispatchEvent(new CustomEvent('setloop:ledger', { detail: entry }));
    return entry;
  }

  function updateRecord(recordId, details) {
    const ledger = read(LEDGER_KEY, []);
    const index = ledger.findIndex(function (entry) { return entry.id === recordId; });
    if (index >= 0) {
      ledger[index] = Object.assign({}, ledger[index], details);
      write(LEDGER_KEY, ledger);
    }
  }

  function cleanPageUrl() {
    const url = new URL(location.href);
    ['setref', 'dept', 'level'].forEach(function (key) { url.searchParams.delete(key); });
    return url.toString();
  }

  function mailto(to, subject, body, bcc) {
    const query = new URLSearchParams();
    query.set('subject', subject);
    query.set('body', body);
    if (bcc) query.set('bcc', bcc);
    location.href = 'mailto:' + (to || '') + '?' + query.toString();
  }

  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      const field = document.createElement('textarea');
      field.value = text;
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      try {
        document.execCommand('copy') ? resolve() : reject(new Error('Copy failed'));
      } catch (error) {
        reject(error);
      } finally {
        field.remove();
      }
    });
  }

  function showToast(message) {
    let toast = document.getElementById('setLoopToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'setLoopToast';
      toast.className = 'sl-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(window.setLoopToastTimer);
    window.setLoopToastTimer = setTimeout(function () { toast.classList.remove('show'); }, 3500);
  }

  function modalMarkup() {
    return [
      '<div class="sl-overlay" id="setLoopFeedbackModal" aria-hidden="true">',
      '  <div class="sl-dialog" role="dialog" aria-modal="true" aria-labelledby="slFeedbackTitle">',
      '    <button class="sl-close" type="button" data-sl-close aria-label="Close">×</button>',
      '    <div class="sl-kicker">SET Loop pilot feedback</div>',
      '    <h2 id="slFeedbackTitle">Tell us what you think</h2>',
      '    <p class="sl-copy" id="slFeedbackChoice"></p>',
      '    <div class="sl-grid">',
      '      <label>Name <span>optional</span><input id="slFeedbackName" autocomplete="name"></label>',
      '      <label>Department <span>optional</span><input id="slFeedbackDepartment" placeholder="Store Operations, Visual, IT..."></label>',
      '      <label>Level / role <span>optional</span><input id="slFeedbackLevel" placeholder="Store Manager, Director, VP..."></label>',
      '      <label>Email <span>optional</span><input id="slFeedbackEmail" type="email" autocomplete="email"></label>',
      '      <label class="sl-full">Comments or questions <span>optional</span><textarea id="slFeedbackComment" placeholder="What worked, what did not, or what would you like to explore?"></textarea></label>',
      '    </div>',
      '    <div class="sl-note" id="slFeedbackRoute">Choose how much to share. When a pilot owner is configured, sending opens an Outlook draft addressed to that owner.</div>',
      '    <div class="sl-actions">',
      '      <button class="sl-primary" type="button" id="slSendFeedback">Send to pilot owner</button>',
      '      <button class="sl-secondary" type="button" id="slSaveFeedback">Keep in this browser</button>',
      '    </div>',
      '  </div>',
      '</div>',
      '<div class="sl-overlay" id="setLoopShareModal" aria-hidden="true">',
      '  <div class="sl-dialog" role="dialog" aria-modal="true" aria-labelledby="slShareTitle">',
      '    <button class="sl-close" type="button" data-sl-close aria-label="Close">×</button>',
      '    <div class="sl-kicker">Invite someone into the Loop</div>',
      '    <h2 id="slShareTitle">Who are you sharing with?</h2>',
      '    <p class="sl-copy">Everything is optional. Add only what feels appropriate; the generated link tracks the department and level, never a person’s name or email.</p>',
      '    <div class="sl-section-label">About you</div>',
      '    <div class="sl-grid">',
      '      <label>Your name <span>optional</span><input id="slSenderName" autocomplete="name"></label>',
      '      <label>Your department <span>optional</span><input id="slSenderDepartment"></label>',
      '      <label>Your level / role <span>optional</span><input id="slSenderLevel"></label>',
      '      <label>Your email <span>optional</span><input id="slSenderEmail" type="email" autocomplete="email"></label>',
      '      <label class="sl-full">Pilot owner email <span>optional; saved only in this browser</span><input id="slOwnerEmail" type="email" placeholder="Where pilot feedback should be routed"></label>',
      '    </div>',
      '    <div class="sl-section-label">About the recipient</div>',
      '    <div class="sl-grid">',
      '      <label>Recipient name <span>optional</span><input id="slRecipientName"></label>',
      '      <label>Recipient email <span>optional</span><input id="slRecipientEmail" type="email"></label>',
      '      <label>Recipient department <span>optional</span><input id="slRecipientDepartment"></label>',
      '      <label>Recipient level / role <span>optional</span><input id="slRecipientLevel"></label>',
      '      <label class="sl-full">Personal note <span>optional</span><textarea id="slShareNote" placeholder="I thought you might want to explore..."></textarea></label>',
      '    </div>',
      '    <div class="sl-note">When a pilot owner email is provided, the email draft copies that address and the recipient can route feedback back to the same owner. Review the draft before sending.</div>',
      '    <div class="sl-actions">',
      '      <button class="sl-primary" type="button" id="slEmailShare">Open email draft</button>',
      '      <button class="sl-secondary" type="button" id="slCopyShare">Copy trackable link</button>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');
  }

  function addStyles() {
    const style = document.createElement('style');
    style.textContent = [
      '.sl-overlay{display:none;position:fixed;inset:0;background:rgba(17,19,26,.72);z-index:100000;align-items:center;justify-content:center;padding:16px}',
      '.sl-overlay.open{display:flex}.sl-dialog{width:min(680px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:18px;padding:30px;position:relative;box-shadow:0 24px 80px rgba(0,0,0,.35);color:#11131a;font-family:"Helvetica Neue",Arial,sans-serif}',
      '.sl-close{position:absolute;right:16px;top:14px;width:34px;height:34px;border:1px solid #ddd;border-radius:9px;background:#fff;color:#555;font-size:22px;cursor:pointer}',
      '.sl-kicker{font-size:11px;letter-spacing:1.3px;text-transform:uppercase;color:#ed2d8b;font-weight:800;margin-bottom:7px}.sl-dialog h2{font-size:25px;margin:0 40px 7px 0}.sl-copy{color:#667085;font-size:14px;line-height:1.5;margin:0 0 18px}',
      '.sl-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px}.sl-grid label{display:grid;gap:5px;font-size:12px;font-weight:800;color:#344054}.sl-grid label span{font-weight:500;color:#98a2b3}.sl-grid input,.sl-grid textarea{width:100%;border:1px solid #d0d5dd;border-radius:9px;padding:10px 11px;font:14px Arial,sans-serif;color:#11131a;background:#fff}.sl-grid textarea{min-height:78px;resize:vertical}.sl-full{grid-column:1/-1}',
      '.sl-section-label{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6941c6;font-weight:800;margin:20px 0 9px}.sl-note{font-size:12px;line-height:1.45;color:#475467;background:#f8f5ff;border-left:4px solid #7f56d9;padding:10px 12px;border-radius:0 8px 8px 0;margin-top:16px}',
      '.sl-actions{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;margin-top:18px}.sl-primary,.sl-secondary{border-radius:9px;padding:11px 16px;font-size:13px;font-weight:800;cursor:pointer}.sl-primary{border:0;background:#ed2d8b;color:#fff}.sl-secondary{border:1px solid #d0d5dd;background:#fff;color:#344054}',
      '.sl-toast{position:fixed;right:20px;bottom:20px;z-index:100001;max-width:360px;background:#11131a;color:#fff;border-radius:11px;padding:12px 16px;font:700 13px/1.4 Arial,sans-serif;box-shadow:0 12px 30px rgba(0,0,0,.25);opacity:0;transform:translateY(10px);pointer-events:none;transition:.2s}.sl-toast.show{opacity:1;transform:none}',
      '.sl-float{position:fixed;right:18px;bottom:76px;z-index:99990;display:flex;gap:7px;align-items:center}.sl-float button,.sl-float a{border:0;border-radius:999px;padding:10px 13px;font:800 12px Arial,sans-serif;text-decoration:none;cursor:pointer;box-shadow:0 8px 22px rgba(0,0,0,.2)}.sl-float button{background:#11131a;color:#fff}.sl-float a{background:#ed2d8b;color:#fff}',
      '@media(max-width:620px){.sl-grid{grid-template-columns:1fr}.sl-full{grid-column:auto}.sl-dialog{padding:24px 18px}.sl-float{right:10px;bottom:76px}.sl-results-link{display:none}}'
    ].join('');
    document.head.appendChild(style);
  }

  function closeModals() {
    document.querySelectorAll('.sl-overlay').forEach(function (modal) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    });
  }

  function openModal(idValue) {
    const modal = document.getElementById(idValue);
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function openFeedback(entry) {
    pendingReactionId = entry.id;
    const saved = profile();
    document.getElementById('slFeedbackChoice').textContent = entry.reaction + ' — ' + entry.section;
    document.getElementById('slFeedbackName').value = saved.name;
    document.getElementById('slFeedbackDepartment').value = saved.department;
    document.getElementById('slFeedbackLevel').value = saved.level;
    document.getElementById('slFeedbackEmail').value = saved.email;
    document.getElementById('slFeedbackComment').value = '';
    const owner = ownerEmail();
    document.getElementById('slFeedbackRoute').textContent = owner
      ? 'Sending will open an Outlook draft addressed to ' + owner + '. Review it before sending.'
      : 'No pilot owner is connected. Your feedback summary can still be copied and shared manually.';
    openModal('setLoopFeedbackModal');
  }

  function feedbackValues() {
    return {
      name: document.getElementById('slFeedbackName').value.trim(),
      department: document.getElementById('slFeedbackDepartment').value.trim(),
      level: document.getElementById('slFeedbackLevel').value.trim(),
      email: document.getElementById('slFeedbackEmail').value.trim()
    };
  }

  function saveFeedback(send) {
    const values = saveProfile(feedbackValues());
    const comment = document.getElementById('slFeedbackComment').value.trim();
    const ledger = read(LEDGER_KEY, []);
    const entry = ledger.find(function (item) { return item.id === pendingReactionId; });
    if (!entry) return;
    updateRecord(entry.id, { profile: values, comment: comment, delivery: send ? 'email-draft' : 'local-only' });
    closeModals();
    if (!send) {
      showToast('Saved to this pilot browser. Nothing was sent.');
      return;
    }
    const who = [
      values.name && 'Name: ' + values.name,
      values.department && 'Department: ' + values.department,
      values.level && 'Level / role: ' + values.level,
      values.email && 'Email: ' + values.email
    ].filter(Boolean).join('\n') || 'Participant details: not provided';
    const body = [
      'SET Loop pilot feedback',
      '',
      'Response: ' + entry.reaction,
      'Area: ' + entry.section,
      'Page: ' + entry.page,
      '',
      who,
      '',
      'Comments: ' + (comment || 'None provided'),
      '',
      'Pilot response ID: ' + entry.id,
      'Timestamp: ' + entry.timestamp,
      'Link: ' + cleanPageUrl()
    ].join('\n');
    const owner = ownerEmail();
    if (!owner) {
      copy(body).then(function () {
        showToast('No pilot owner is connected. Feedback summary copied.');
      }).catch(function () {
        window.prompt('Copy your feedback summary:', body);
      });
      return;
    }
    mailto(owner, 'SET Loop feedback: ' + entry.reaction + ' — ' + entry.section, body, '');
    showToast('Outlook draft opened. Send it so the pilot owner can include your response.');
  }

  function openShare() {
    const saved = profile();
    document.getElementById('slSenderName').value = saved.name;
    document.getElementById('slSenderDepartment').value = saved.department;
    document.getElementById('slSenderLevel').value = saved.level;
    document.getElementById('slSenderEmail').value = saved.email;
    document.getElementById('slOwnerEmail').value = ownerEmail();
    ['slRecipientName', 'slRecipientEmail', 'slRecipientDepartment', 'slRecipientLevel', 'slShareNote'].forEach(function (fieldId) {
      document.getElementById(fieldId).value = '';
    });
    openModal('setLoopShareModal');
  }

  function shareValues() {
    const sender = saveProfile({
      name: document.getElementById('slSenderName').value.trim(),
      department: document.getElementById('slSenderDepartment').value.trim(),
      level: document.getElementById('slSenderLevel').value.trim(),
      email: document.getElementById('slSenderEmail').value.trim()
    });
    return {
      sender: sender,
      ownerEmail: saveOwnerEmail(document.getElementById('slOwnerEmail').value),
      recipient: {
        name: document.getElementById('slRecipientName').value.trim(),
        email: document.getElementById('slRecipientEmail').value.trim(),
        department: document.getElementById('slRecipientDepartment').value.trim(),
        level: document.getElementById('slRecipientLevel').value.trim()
      },
      note: document.getElementById('slShareNote').value.trim()
    };
  }

  function createShare() {
    const values = shareValues();
    const shareId = id('share');
    const url = new URL(cleanPageUrl());
    const currentFragment = new URLSearchParams(url.hash.slice(1));
    const currentAnchor = url.hash.startsWith('#route=')
      ? currentFragment.get('anchor') || ''
      : url.hash.slice(1);
    url.searchParams.set('setref', shareId);
    if (values.recipient.department) url.searchParams.set('dept', values.recipient.department);
    if (values.recipient.level) url.searchParams.set('level', values.recipient.level);
    if (values.ownerEmail) {
      const fragment = new URLSearchParams();
      fragment.set('route', encodeOwnerRoute(values.ownerEmail));
      if (currentAnchor) fragment.set('anchor', currentAnchor);
      url.hash = fragment.toString();
    }
    const entry = record('share', {
      shareId: shareId,
      sender: values.sender,
      recipient: values.recipient,
      note: values.note,
      sharedUrl: url.toString()
    });
    return { values: values, entry: entry, url: url.toString() };
  }

  function emailShare() {
    const share = createShare();
    const senderName = share.values.sender.name || 'A colleague';
    const note = share.values.note ? share.values.note + '\n\n' : '';
    const body = [
      'Hi' + (share.values.recipient.name ? ' ' + share.values.recipient.name : '') + ',',
      '',
      note + senderName + ' invited you to explore the SET + SET Loop pilot.',
      '',
      'Open the interactive experience:',
      share.url,
      '',
      'You can react to individual ideas, ask to learn more, and join the Loop. Sharing personal details is optional.',
      '',
      'Pilot share ID: ' + share.entry.shareId
    ].join('\n');
    updateRecord(share.entry.id, { delivery: 'email-draft' });
    closeModals();
    mailto(share.values.recipient.email, 'Explore the SET + SET Loop pilot', body, share.values.ownerEmail);
    showToast(share.values.ownerEmail ? 'Outlook draft opened with the pilot owner copied.' : 'Outlook draft opened. Add recipients and review before sending.');
  }

  function copyShare() {
    const share = createShare();
    updateRecord(share.entry.id, { delivery: 'copied-link' });
    copy(share.url).then(function () {
      closeModals();
      showToast('Trackable link copied. Share details saved to this browser.');
    }).catch(function () {
      window.prompt('Copy this trackable link:', share.url);
    });
  }

  function reaction(section, reaction, button) {
    if (button) {
      const row = button.closest('.react-row, .feedback-bar') || button.parentElement;
      row.querySelectorAll('button').forEach(function (item) {
        item.classList.remove('reacted', 'active');
        if (item.style) {
          item.style.background = '';
          item.style.color = '';
          item.style.borderColor = '';
        }
      });
      button.classList.add('reacted', 'active');
      button.style.background = '#ed2d8b';
      button.style.color = '#fff';
      button.style.borderColor = '#ed2d8b';
    }
    const entry = record('reaction', { section: section || PAGE_NAME, reaction: reaction });
    showToast(reaction + ' recorded. Add context or send it to KC.');
    openFeedback(entry);
  }

  function installFloatingActions() {
    if (document.getElementById('floatingJoin')) return;
    const actions = document.createElement('div');
    actions.className = 'sl-float';
    actions.innerHTML = '<a href="../../vp-presentation.html?join=1">Join the Loop</a><button type="button" data-sl-share>Share</button>';
    document.body.appendChild(actions);
  }

  function install() {
    addStyles();
    document.body.insertAdjacentHTML('beforeend', modalMarkup());
    installFloatingActions();
    document.querySelectorAll('[data-sl-close]').forEach(function (button) { button.addEventListener('click', closeModals); });
    document.querySelectorAll('.sl-overlay').forEach(function (modal) {
      modal.addEventListener('click', function (event) { if (event.target === modal) closeModals(); });
    });
    document.getElementById('slSendFeedback').addEventListener('click', function () { saveFeedback(true); });
    document.getElementById('slSaveFeedback').addEventListener('click', function () { saveFeedback(false); });
    document.getElementById('slEmailShare').addEventListener('click', emailShare);
    document.getElementById('slCopyShare').addEventListener('click', copyShare);
    document.querySelectorAll('[data-sl-share]').forEach(function (button) { button.addEventListener('click', openShare); });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeModals(); });
    document.querySelectorAll('a').forEach(function (link) {
      if (link.textContent.includes('Join the Loop') && link.href.includes('vp-presentation.html')) {
        const url = new URL(link.href);
        url.searchParams.set('join', '1');
        link.href = url.toString();
      }
    });

    const ref = referral();
    const routedOwner = decodeOwnerRoute(new URLSearchParams(location.hash.slice(1)).get('route'));
    if (routedOwner) {
      document.querySelectorAll('a[href]').forEach(function (link) {
        const url = new URL(link.href, location.href);
        if (url.origin === location.origin && (url.pathname !== location.pathname || url.hash)) {
          const anchor = url.hash && !url.hash.startsWith('#route=') ? url.hash.slice(1) : '';
          const fragment = new URLSearchParams();
          fragment.set('route', encodeOwnerRoute(routedOwner));
          if (anchor) fragment.set('anchor', anchor);
          url.hash = fragment.toString();
          link.href = url.toString();
        }
      });
      const restoreAnchor = function () {
        const routedAnchor = new URLSearchParams(location.hash.slice(1)).get('anchor');
        if (!routedAnchor) return;
        requestAnimationFrame(function () {
          const target = document.getElementById(routedAnchor);
          if (target) target.scrollIntoView();
        });
      };
      restoreAnchor();
      window.addEventListener('hashchange', restoreAnchor);
    }
    if (ref.referralId && !sessionStorage.getItem('setloop_referral_seen_' + ref.referralId)) {
      record('referral-open', {});
      sessionStorage.setItem('setloop_referral_seen_' + ref.referralId, '1');
    }
    if (new URLSearchParams(location.search).get('join') === '1' && typeof window.openJoin === 'function') {
      window.openJoin();
    }
  }

  window.SETLoopFeedback = {
    openShare: openShare,
    react: reaction,
    record: record,
    readLedger: function () { return read(LEDGER_KEY, []); },
    getProfile: profile,
    saveProfile: saveProfile,
    ledgerKey: LEDGER_KEY,
    ownerEmail: ownerEmail
  };

  window.fbReact = function (button, label) { reaction(PAGE_NAME, label, button); };
  window.shareView = openShare;
  window.shareLoop = openShare;
  window.sharePresentation = openShare;
  window.copyLink = openShare;

  const originalReact = window.react;
  window.react = function (first, second, third) {
    if (first && first.nodeType === 1) {
      reaction(PAGE_NAME, second, first);
      return;
    }
    if (typeof first === 'string' && typeof second === 'string') {
      reaction(first, second, third);
      return;
    }
    if (typeof originalReact === 'function') originalReact.apply(window, arguments);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();
