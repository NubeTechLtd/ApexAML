# Archived roadmap sales follow-ups

Disabled at the owner’s request. Emails 2–5 previously ran at days 3, 7, 14 and 21. This is historical copy, not approved current claims; do not restore it automatically. The shared shell includes the original unsubscribe and open/click tracking URLs.

```typescript
function trackedLink(token: string, step: number, target: string): string {
  return `${FN_BASE}/email-track?t=${encodeURIComponent(token)}&s=${step}&url=${encodeURIComponent(target)}`;
}
function pixel(token: string, step: number): string {
  return `${FN_BASE}/email-track?t=${encodeURIComponent(token)}&s=${step}&type=open`;
}
function unsubscribeUrl(token: string): string {
  return `${FN_BASE}/email-unsubscribe?t=${encodeURIComponent(token)}`;
}

// ---------- Templates (plain-text-leaning HTML) ----------

interface Row {
  id: string;
  contact_name: string;
  institution_name: string;
  institution_type: string | null;
  email: string;
  ref_number: string;
  tracking_token: string;
  deadline: string;
}

function shell(opts: {
  preheader: string;
  bodyHtml: string;
  ctaText: string;
  ctaUrl: string;
  token: string;
  step: number;
}): string {
  const unsub = unsubscribeUrl(opts.token);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>ApexAML AML</title></head>
<body style="margin:0;padding:0;background:#ffffff;color:#1a1a1a;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55">
<div style="display:none;max-height:0;overflow:hidden;color:transparent">${escapeHtml(opts.preheader)}</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:24px 16px">
<table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%">
<tr><td style="padding:0 0 16px 0;font-weight:600;color:#0f172a;font-size:16px">ApexAML <span style="color:#64748b;font-weight:400">— CBN AML Compliance</span></td></tr>
<tr><td>${opts.bodyHtml}</td></tr>
<tr><td style="padding:24px 0 8px 0">
  <a href="${opts.ctaUrl}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600">${escapeHtml(opts.ctaText)}</a>
</td></tr>
<tr><td style="padding:24px 0 0 0;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;margin-top:24px">
  <p style="margin:16px 0 4px 0">ApexAML AML — CBN/NFIU compliance platform</p>
  <p style="margin:0 0 4px 0">Reply to this email or contact <a href="mailto:${REPLY_TO}" style="color:#1d4ed8">${REPLY_TO}</a></p>
  <p style="margin:8px 0 0 0">Don't want these? <a href="${unsub}" style="color:#64748b;text-decoration:underline">Unsubscribe</a> · NDPR: we only contact compliance officers who generated a CBN roadmap with us.</p>
</td></tr>
</table></td></tr></table>
<img src="${pixel(opts.token, opts.step)}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0" />
</body></html>`;
}

function tmplEmail2(r: Row) {
  const cta = trackedLink(
    r.tracking_token,
    2,
    `${APP_BASE}/?utm_source=drip&utm_campaign=cbn_followup&utm_content=email2#book-demo`,
  );
  const html = shell({
    preheader: `Have you submitted ${r.institution_name}'s roadmap to CBN yet?`,
    step: 2,
    token: r.tracking_token,
    ctaText: "Book free roadmap review →",
    ctaUrl: cta,
    bodyHtml: `<p>Hi ${escapeHtml(r.contact_name.split(" ")[0])},</p>
<p>You generated your CBN AML roadmap (Ref ${escapeHtml(r.ref_number)}) for <strong>${escapeHtml(r.institution_name)}</strong> three days ago.</p>
<p>Have you submitted it to CBN yet? If you'd like a second pair of eyes, our compliance team will review it for free — formatting, missing capability areas, attestation language.</p>
<p>Reply to this email, or book a 20-minute call:</p>`,
  });
  return { subject: `Have you submitted your CBN roadmap yet? — ${r.institution_name}`, html };
}

function tmplEmail3(r: Row) {
  const cta = trackedLink(
    r.tracking_token,
    3,
    `${APP_BASE}/?utm_source=drip&utm_campaign=cbn_followup&utm_content=email3#book-demo`,
  );
  const html = shell({
    preheader: `What CBN does when an institution's AML controls fall short.`,
    step: 3,
    token: r.tracking_token,
    ctaText: "Start your ApexAML implementation →",
    ctaUrl: cta,
    bodyHtml: `<p>Hi ${escapeHtml(r.contact_name.split(" ")[0])},</p>
<p>What happens if <strong>${escapeHtml(r.institution_name)}</strong> falls behind on its CBN AML roadmap? Based on prior CBN enforcement patterns under Circular BSD/DIR/PUB/LAB/019/002 and earlier AML guidance:</p>
<ol style="padding-left:18px;margin:0 0 16px 0">
<li><strong>Initial warning letter</strong> from the BSD demanding written justification within 14 days.</li>
<li><strong>Escalation to a targeted AML examination</strong> — on-site review of CDD files, STR/CTR submissions, sanctions screening evidence, and board minutes.</li>
<li><strong>Conditional licence renewal</strong> with mandated remediation milestones, additional capital reporting, or restrictions on new product launches.</li>
<li><strong>Public publication</strong> in the CBN's enforcement bulletin — visible to correspondent banks and counterparties.</li>
</ol>
<p>ApexAML covers all 10 CBN capability areas. Book a 30-minute walkthrough, then run a 30-45 day pilot on your own data.</p>`,
  });
  return { subject: `What happens if ${r.institution_name} falls behind on its CBN AML roadmap?`, html };
}

function tmplEmail4(r: Row) {
  const peer = (r.institution_type || "Nigerian financial institution").trim();
  const cta = trackedLink(
    r.tracking_token,
    4,
    `${APP_BASE}/?utm_source=drip&utm_campaign=cbn_followup&utm_content=email4#how-it-works`,
  );
  const html = shell({
    preheader: `How ${peer}s in your peer group are using ApexAML today.`,
    step: 4,
    token: r.tracking_token,
    ctaText: `See how ${peer}s use ApexAML →`,
    ctaUrl: cta,
    bodyHtml: `<p>Hi ${escapeHtml(r.contact_name.split(" ")[0])},</p>
<p>Your peers — other ${escapeHtml(peer)}s — are already live on ApexAML.</p>
<p style="margin:16px 0"><strong>See it on your own data: a 30-45 day pilot covering transaction monitoring, AI-assisted STR drafting and NFIU goAML export.</strong></p>
<p>Don't let <strong>${escapeHtml(r.institution_name)}</strong> be the one explaining to the BSD why your roadmap is still in draft.</p>`,
  });
  return { subject: `Your ${peer} peers are already live on ApexAML`, html };
}

function tmplEmail5(r: Row) {
  const cta = trackedLink(
    r.tracking_token,
    5,
    `${APP_BASE}/?utm_source=drip&utm_campaign=cbn_followup&utm_content=email5#pricing`,
  );
  const html = shell({
    preheader: `Book a 30-minute walkthrough of ApexAML.`,
    step: 5,
    token: r.tracking_token,
    ctaText: "Book a 30-minute walkthrough →",
    ctaUrl: cta,
    bodyHtml: `<p>Hi ${escapeHtml(r.contact_name.split(" ")[0])},</p>
<p>Last reminder for <strong>${escapeHtml(r.institution_name)}</strong>.</p>
<p>If you would like to see how ApexAML would run your CBN roadmap, book a 30-minute walkthrough. Then run a 30-45 day pilot on your own data.</p>`,
  });
  return { subject: `Ready to see ApexAML on your own data?`, html };
}


```
