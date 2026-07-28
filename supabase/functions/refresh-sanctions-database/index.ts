// Daily sanctions list refresh: pulls OFAC, UN, EU consolidated lists and
// processes any recent NFIU uploads from the nfiu-list-uploads storage bucket.
// Records outcome in sanctions_meta.
import { createClient } from "npm:@supabase/supabase-js@2";
import { XMLParser } from "npm:fast-xml-parser@4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const OFAC_URL = "https://www.treasury.gov/ofac/downloads/sdn.xml";
const UN_URL = "https://scsanctions.un.org/resources/xml/en/consolidated.xml";
const EU_URL =
  "https://webgate.ec.europa.eu/fsd/fsf/public/files/xmlFullSanctionsList_1_1/content?token=dG9rZW4tMjAxNw";

const NFIU_BUCKET = "nfiu-list-uploads";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type EntityRow = {
  source: "OFAC" | "UN" | "EU" | "NFIU";
  source_ref: string;
  entity_name: string;
  aliases: string[] | null;
  date_of_birth: string | null;
  nationality: string | null;
  entity_type: string | null;
  reason: string | null;
  list_date: string | null;
  raw_data: unknown;
  is_active: boolean;
  last_updated: string;
};

function toArray<T>(v: T | T[] | undefined | null): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function normalizeDate(input: unknown): string | null {
  if (!input) return null;
  const s = String(input).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/* ------------------------------- OFAC ------------------------------- */
function parseOFAC(xml: string): EntityRow[] {
  const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });
  const doc = parser.parse(xml);
  const entries = toArray(doc?.sdnList?.sdnEntry);
  const now = new Date().toISOString();
  return entries.map((e: any) => {
    const first = e.firstName ? String(e.firstName) : "";
    const last = e.lastName ? String(e.lastName) : "";
    const name = [first, last].filter(Boolean).join(" ").trim() || last || first;
    const akas = toArray(e?.akaList?.aka).map((a: any) =>
      [a.firstName, a.lastName].filter(Boolean).join(" ").trim(),
    ).filter(Boolean);
    const dob = toArray(e?.dateOfBirthList?.dateOfBirthItem)[0]?.dateOfBirth;
    const nat = toArray(e?.nationalityList?.nationality)[0]?.country;
    return {
      source: "OFAC",
      source_ref: String(e.uid ?? name),
      entity_name: name,
      aliases: akas.length ? akas : null,
      date_of_birth: dob ? String(dob) : null,
      nationality: nat ? String(nat) : null,
      entity_type: String(e.sdnType ?? "").toUpperCase() || null,
      reason: e.remarks ? String(e.remarks).slice(0, 500) : null,
      list_date: null,
      raw_data: e,
      is_active: true,
      last_updated: now,
    } as EntityRow;
  }).filter((r) => r.entity_name);
}

/* -------------------------------- UN -------------------------------- */
function parseUN(xml: string): EntityRow[] {
  const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });
  const doc = parser.parse(xml);
  const now = new Date().toISOString();
  const rows: EntityRow[] = [];

  const individuals = toArray(doc?.CONSOLIDATED_LIST?.INDIVIDUALS?.INDIVIDUAL);
  for (const i of individuals) {
    const name = [i.FIRST_NAME, i.SECOND_NAME, i.THIRD_NAME, i.FOURTH_NAME]
      .filter(Boolean).map(String).join(" ").trim();
    if (!name) continue;
    const akas = toArray(i?.INDIVIDUAL_ALIAS)
      .map((a: any) => a?.ALIAS_NAME).filter(Boolean).map(String);
    const dob = toArray(i?.INDIVIDUAL_DATE_OF_BIRTH)[0];
    const nat = toArray(i?.NATIONALITY?.VALUE)[0];
    rows.push({
      source: "UN",
      source_ref: String(i.DATAID ?? i.REFERENCE_NUMBER ?? name),
      entity_name: name,
      aliases: akas.length ? akas : null,
      date_of_birth: dob ? String(dob?.DATE ?? dob?.YEAR ?? "") || null : null,
      nationality: nat ? String(nat) : null,
      entity_type: "INDIVIDUAL",
      reason: i.COMMENTS1 ? String(i.COMMENTS1).slice(0, 500) : null,
      list_date: normalizeDate(i.LISTED_ON),
      raw_data: i,
      is_active: true,
      last_updated: now,
    });
  }

  const entities = toArray(doc?.CONSOLIDATED_LIST?.ENTITIES?.ENTITY);
  for (const e of entities) {
    const name = String(e.FIRST_NAME ?? "").trim();
    if (!name) continue;
    const akas = toArray(e?.ENTITY_ALIAS)
      .map((a: any) => a?.ALIAS_NAME).filter(Boolean).map(String);
    rows.push({
      source: "UN",
      source_ref: String(e.DATAID ?? e.REFERENCE_NUMBER ?? name),
      entity_name: name,
      aliases: akas.length ? akas : null,
      date_of_birth: null,
      nationality: null,
      entity_type: "ENTITY",
      reason: e.COMMENTS1 ? String(e.COMMENTS1).slice(0, 500) : null,
      list_date: normalizeDate(e.LISTED_ON),
      raw_data: e,
      is_active: true,
      last_updated: now,
    });
  }
  return rows;
}

/* -------------------------------- EU -------------------------------- */
function parseEU(xml: string): EntityRow[] {
  const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });
  const doc = parser.parse(xml);
  const now = new Date().toISOString();
  const entries = toArray(
    doc?.["export"]?.sanctionEntity ??
      doc?.sanctionsList?.sanctionEntity ??
      doc?.sanctionEntity,
  );
  return entries.map((e: any): EntityRow => {
    const names = toArray(e?.nameAlias);
    const primary = names.find((n: any) => n?.["@_strong"] === "true") ?? names[0];
    const name = String(primary?.["@_wholeName"] ?? primary?.wholeName ?? "").trim();
    const akas = names.slice(1).map((n: any) =>
      String(n?.["@_wholeName"] ?? n?.wholeName ?? ""),
    ).filter(Boolean);
    const type = String(e?.subjectType?.["@_code"] ?? e?.subjectType ?? "").toUpperCase();
    return {
      source: "EU",
      source_ref: String(e?.["@_logicalId"] ?? e?.logicalId ?? e?.["@_euReferenceNumber"] ?? name),
      entity_name: name,
      aliases: akas.length ? akas : null,
      date_of_birth: null,
      nationality: null,
      entity_type: type === "P" ? "INDIVIDUAL" : type === "E" ? "ENTITY" : null,
      reason: e?.remark ? String(e.remark).slice(0, 500) : null,
      list_date: normalizeDate(e?.["@_designationDate"] ?? e?.designationDate),
      raw_data: e,
      is_active: true,
      last_updated: now,
    };
  }).filter((r) => r.entity_name);
}

/* --------------------------- NFIU CSV/XML --------------------------- */
function parseNFIUCsv(text: string, fileName: string): EntityRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = (k: string) => header.findIndex((h) => h === k || h.includes(k));
  const nameIdx = idx("name");
  const now = new Date().toISOString();
  const rows: EntityRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const name = cols[nameIdx];
    if (!name) continue;
    rows.push({
      source: "NFIU",
      source_ref: `${fileName}:${i}:${name}`,
      entity_name: name,
      aliases: null,
      date_of_birth: cols[idx("dob")] ?? cols[idx("date_of_birth")] ?? null,
      nationality: cols[idx("nationality")] ?? null,
      entity_type: (cols[idx("type")] ?? "INDIVIDUAL").toUpperCase(),
      reason: cols[idx("reason")] ?? null,
      list_date: normalizeDate(cols[idx("date")] ?? cols[idx("list_date")]),
      raw_data: Object.fromEntries(header.map((h, j) => [h, cols[j]])),
      is_active: true,
      last_updated: now,
    });
  }
  return rows;
}

async function upsertBatch(supabase: any, rows: EntityRow[]) {
  if (rows.length === 0) return 0;
  let inserted = 0;
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error, count } = await supabase
      .from("sanctions_entities")
      .upsert(chunk, {
        onConflict: "source,source_ref",
        ignoreDuplicates: false,
        count: "exact",
      });
    if (error) throw error;
    inserted += count ?? chunk.length;
  }
  return inserted;
}

async function recordMeta(
  supabase: any,
  list: string,
  status: "success" | "failed",
  count: number,
  error?: string,
) {
  await supabase.from("sanctions_meta").upsert(
    {
      list_name: list,
      last_refreshed_at: new Date().toISOString(),
      record_count: count,
      status,
      error_message: error ?? null,
    },
    { onConflict: "list_name" },
  );
}

async function refreshList(
  supabase: any,
  list: "OFAC" | "UN" | "EU",
  url: string,
  parser: (xml: string) => EntityRow[],
): Promise<{ list: string; status: string; count: number; error?: string }> {
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "ApexAML/1.0 sanctions-refresh" },
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const xml = await resp.text();
    const rows = parser(xml);
    const count = await upsertBatch(supabase, rows);
    await recordMeta(supabase, list, "success", count);
    return { list, status: "success", count };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[refresh-sanctions] ${list} failed:`, msg);
    await recordMeta(supabase, list, "failed", 0, msg);
    return { list, status: "failed", count: 0, error: msg };
  }
}

async function refreshNFIU(supabase: any) {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: files, error } = await supabase.storage
      .from(NFIU_BUCKET)
      .list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    if (error) throw error;
    const recent = (files ?? []).filter((f: any) =>
      f?.created_at && f.created_at >= cutoff &&
      /\.(csv|xml)$/i.test(f.name)
    );
    if (recent.length === 0) {
      return { list: "NFIU", status: "skipped", count: 0, reason: "no_recent_uploads" };
    }
    let total = 0;
    for (const f of recent) {
      const { data: blob, error: dlErr } = await supabase.storage
        .from(NFIU_BUCKET).download(f.name);
      if (dlErr || !blob) continue;
      const text = await blob.text();
      let rows: EntityRow[] = [];
      if (f.name.toLowerCase().endsWith(".csv")) {
        rows = parseNFIUCsv(text, f.name);
      } else {
        // best-effort XML: treat every element with a Name/name node as entry
        try {
          const parser = new XMLParser({ ignoreAttributes: false });
          const doc = parser.parse(text);
          const flat: any[] = [];
          const walk = (n: any) => {
            if (!n || typeof n !== "object") return;
            if (n.name || n.Name || n.NAME) flat.push(n);
            for (const k of Object.keys(n)) walk(n[k]);
          };
          walk(doc);
          const now = new Date().toISOString();
          rows = flat.map((n, i) => ({
            source: "NFIU" as const,
            source_ref: `${f.name}:${i}`,
            entity_name: String(n.name ?? n.Name ?? n.NAME ?? "").trim(),
            aliases: null,
            date_of_birth: null,
            nationality: null,
            entity_type: "INDIVIDUAL",
            reason: null,
            list_date: null,
            raw_data: n,
            is_active: true,
            last_updated: now,
          })).filter((r) => r.entity_name);
        } catch (_e) { rows = []; }
      }
      total += await upsertBatch(supabase, rows);
    }
    await recordMeta(supabase, "NFIU", "success", total);
    return { list: "NFIU", status: "success", count: total };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[refresh-sanctions] NFIU failed:", msg);
    await recordMeta(supabase, "NFIU", "failed", 0, msg);
    return { list: "NFIU", status: "failed", count: 0, error: msg };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const cronSecret = Deno.env.get("CRON_SECRET");
  const provided = req.headers.get("x-cron-secret");
  if (!cronSecret || provided !== cronSecret) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const results = await Promise.all([
    refreshList(supabase, "OFAC", OFAC_URL, parseOFAC),
    refreshList(supabase, "UN", UN_URL, parseUN),
    refreshList(supabase, "EU", EU_URL, parseEU),
    refreshNFIU(supabase),
  ]);

  return json({ refreshed_at: new Date().toISOString(), results });
});
