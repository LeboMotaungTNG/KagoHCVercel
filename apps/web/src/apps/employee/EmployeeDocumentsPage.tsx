/**
 * EmployeeDocumentsPage
 * ---------------------
 * Employee-facing view for company documents uploaded by the Owner under
 * Organization Settings → Documents Library, plus a premium hero that lets
 * the employee view / download their latest payslip and see payroll
 * insights at a glance.
 *
 * Frontend-only: reads the same localStorage-backed store used by the
 * Owner tab. When the backend ships, swap the utility functions in
 * `shared/utils/documentsLibrary` — this page stays intact.
 */

import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  Search, Download, Eye, Receipt, Inbox, ArrowRight,
  Calendar, TrendingUp, History, ShieldCheck, ChevronRight,
} from "lucide-react";
import SharedLayout from "./SharedLayout";
import { C, R, SHADOW, FONT_NUM } from "../../shared/utils/employee";
import {
  CATEGORY_META, CATEGORY_ORDER,
  type DocCategory, type OrgDocument, type PayslipMeta,
  demoPayslip, downloadDataUrl, formatBytes, formatDate, formatMoney,
  loadLatestPayslip, loadOrgDocumentsAsync, saveLatestPayslip,
} from "../../shared/utils/documentsLibrary";
import {
  buildPayslipObjectUrl, downloadPayslipPdf,
} from "../../shared/utils/payslipPdf";

/* ─────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────── */

const getCurrentUserName = (): string => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return "Employee";
    const u = JSON.parse(raw);
    return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Employee";
  } catch { return "Employee"; }
};

const openInNewTab = (doc: { title: string; mimeType: string; dataUrl: string }) => {
  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) return;
  if (doc.mimeType.startsWith("image/")) {
    w.document.write(
      `<title>${doc.title}</title>` +
      `<body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;min-height:100vh">` +
      `<img src="${doc.dataUrl}" style="max-width:100%;max-height:100vh"/></body>`,
    );
  } else {
    w.location.href = doc.dataUrl;
  }
};

/** Next 25th of the month — mirrors typical SA monthly payroll. */
const nextPaydayInfo = (): { label: string; daysUntil: number } => {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), 25);
  if (now.getDate() > 25) target.setMonth(target.getMonth() + 1);
  const days = Math.max(0, Math.round((target.getTime() - now.getTime()) / 86_400_000));
  const label = target.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
  return { label, daysUntil: days };
};

/* ─────────────────────────────────────────────────────────────────────
 * Main page
 * ────────────────────────────────────────────────────────────────── */

const EmployeeDocumentsPage: React.FC = () => {
  const [docs, setDocs] = useState<OrgDocument[]>([]);
  const [payslip, setPayslip] = useState<PayslipMeta | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DocCategory | "All">("All");

  useEffect(() => {
    const loadDocs = async () => {
      const result = await loadOrgDocumentsAsync();
      setDocs(result);
    };

    loadDocs();

    // Self-heal legacy payslips missing the structured `data` field so the
    // real-PDF renderer always has something to work with.
    let existing = loadLatestPayslip();
    if (!existing || !existing.data) {
      existing = demoPayslip(getCurrentUserName());
      saveLatestPayslip(existing);
    }
    setPayslip(existing);
  }, []);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = docs
      .filter(d => filter === "All" ? true : d.category === filter)
      .filter(d => !q
        ? true
        : d.title.toLowerCase().includes(q) ||
          (d.description ?? "").toLowerCase().includes(q));

    const byCat = new Map<DocCategory, OrgDocument[]>();
    filtered.forEach(d => {
      const arr = byCat.get(d.category) ?? [];
      arr.push(d);
      byCat.set(d.category, arr);
    });
    byCat.forEach(arr => arr.sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1)));

    return CATEGORY_ORDER
      .filter(c => c !== "Payslip")
      .map(c => ({ category: c, items: byCat.get(c) ?? [] }))
      .filter(g => g.items.length > 0);
  }, [docs, query, filter]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<DocCategory, number>();
    docs.forEach(d => counts.set(d.category, (counts.get(d.category) ?? 0) + 1));
    return counts;
  }, [docs]);

  const lastUpdate = docs[0]?.uploadedAt;

  return (
    <SharedLayout>
      <Helmet>
        <title>My Documents | Kago HC</title>
        <meta name="description" content="Company documents & your latest payslip." />
      </Helmet>

      <style>{`
        .kg-doc-hero  { display: grid; gap: 18px; grid-template-columns: 1fr; }
        .kg-doc-list  { display: grid; gap: 12px; grid-template-columns: 1fr; }
        .kg-doc-meta  { display: grid; gap: 12px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
        @media (min-width: 760px)  {
          .kg-doc-list  { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .kg-doc-meta  { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (min-width: 1120px) {
          .kg-doc-hero  { grid-template-columns: 1.7fr 1fr; }
          .kg-doc-list  { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
      `}</style>

      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <PageHeader
          docCount={docs.length}
          categoryCount={new Set(docs.map(d => d.category)).size}
          lastUpdate={lastUpdate}
        />

        {payslip && (
          <div className="kg-doc-hero" style={{ marginBottom: 26 }}>
            <PayslipHero payslip={payslip} employeeName={getCurrentUserName()} />
            <PayrollInsights payslip={payslip} />
          </div>
        )}

        {/* Section header */}
        <div style={{
          display: "flex", alignItems: "flex-end", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12, marginBottom: 14,
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.4, color: C.faint, textTransform: "uppercase" }}>
              Shared by HR
            </div>
            <h2 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 800, color: C.ink, letterSpacing: -0.4 }}>
              Company documents
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: C.muted, fontSize: 12.5, fontWeight: 600 }}>
            <ShieldCheck size={14} color={C.green} />
            All documents are private to you and your organization.
          </div>
        </div>

        {/* Filter bar */}
        <section
          style={{
            background: C.surface, border: `1px solid ${C.line}`,
            borderRadius: R.lg, boxShadow: SHADOW,
            padding: "12px 14px", marginBottom: 22,
            display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center",
          }}
        >
          <div style={{ position: "relative", flex: "1 1 260px", minWidth: 200 }}>
            <Search size={14} color={C.faint}
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input
              placeholder="Search documents…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                width: "100%", padding: "9px 12px 9px 34px",
                borderRadius: 10, border: `1px solid ${C.line}`,
                fontSize: 13.5, color: C.ink, outline: "none",
                background: C.surfaceAlt,
              }}
            />
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <Chip active={filter === "All"} onClick={() => setFilter("All")}
              label={`All ${docs.length ? `· ${docs.length}` : ""}`.trim()} />
            {CATEGORY_ORDER.filter(c => c !== "Payslip").map(c => {
              const count = categoryCounts.get(c) ?? 0;
              if (count === 0 && filter !== c) return null;
              return (
                <Chip
                  key={c}
                  active={filter === c}
                  onClick={() => setFilter(c)}
                  label={`${CATEGORY_META[c].label} · ${count}`}
                  tint={CATEGORY_META[c].color}
                />
              );
            })}
          </div>
        </section>

        {/* Groups */}
        {docs.length === 0 ? (
          <EmptyState
            icon={<Inbox size={30} color={C.faint} />}
            title="No documents yet"
            body="Your HR team hasn't shared any documents with you yet. When they do, they'll appear here."
          />
        ) : grouped.length === 0 ? (
          <EmptyState
            icon={<Search size={26} color={C.faint} />}
            title="Nothing matches your search"
            body="Try a different keyword or category."
          />
        ) : (
          grouped.map(group => (
            <CategoryGroup key={group.category} category={group.category} items={group.items} />
          ))
        )}

        <p style={{ textAlign: "center", color: C.faint, fontSize: 12.5, margin: "30px 0 8px" }}>
          KagoHC · Documents stay yours, always available.
        </p>
      </div>
    </SharedLayout>
  );
};

/* ─────────────────────────────────────────────────────────────────────
 * Page header
 * ────────────────────────────────────────────────────────────────── */

const PageHeader: React.FC<{ docCount: number; categoryCount: number; lastUpdate?: string }> = ({
  docCount, categoryCount, lastUpdate,
}) => (
  <header style={{ marginBottom: 22 }}>
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      fontSize: 11, fontWeight: 800, letterSpacing: 1.4,
      color: C.coralDk, textTransform: "uppercase",
      background: C.coralBg, padding: "5px 10px", borderRadius: 999,
    }}>
      Human Resources
    </div>
    <h1 style={{ margin: "12px 0 6px", fontSize: 34, fontWeight: 800, color: C.ink, letterSpacing: -0.8, lineHeight: 1.05 }}>
      My Documents
    </h1>
    <p style={{ margin: 0, color: C.muted, fontSize: 14.5, maxWidth: 640 }}>
      Everything HR has shared with you — your latest payslip, employment conditions, policies and more.
    </p>

    <div style={{
      marginTop: 14, display: "flex", flexWrap: "wrap", gap: 18,
      color: C.muted, fontSize: 12.5, fontWeight: 600,
    }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.coral }} />
        {docCount} document{docCount === 1 ? "" : "s"}
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.blue }} />
        {categoryCount} categor{categoryCount === 1 ? "y" : "ies"}
      </span>
      {lastUpdate && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green }} />
          Updated {formatDate(lastUpdate)}
        </span>
      )}
    </div>
  </header>
);

/* ─────────────────────────────────────────────────────────────────────
 * Payslip hero (deep navy, premium)
 * ────────────────────────────────────────────────────────────────── */

const PayslipHero: React.FC<{ payslip: PayslipMeta; employeeName: string }> = ({
  payslip, employeeName,
}) => {
  const deductions = Math.max(0, payslip.gross - payslip.net);
  return (
    <section
      style={{
        position: "relative", overflow: "hidden",
        background: `linear-gradient(135deg, #1a2036 0%, #2b3560 55%, #3a3b7a 100%)`,
        borderRadius: R.hero, padding: 28,
        boxShadow: "0 20px 44px rgba(26,32,54,0.35)",
        color: "#fff",
        minHeight: 300,
        display: "flex", flexDirection: "column",
      }}
    >
      {/* decorative glows */}
      <div aria-hidden style={{
        position: "absolute", right: -80, top: -80, width: 260, height: 260,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${C.coral} 0%, rgba(230,167,158,0) 65%)`,
        opacity: 0.35,
      }} />
      <div aria-hidden style={{
        position: "absolute", left: -40, bottom: -80, width: 200, height: 200,
        borderRadius: "50%", background: "rgba(255,255,255,0.05)",
      }} />

      {/* Top row */}
      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: "rgba(255,255,255,0.10)",
            border: "1px solid rgba(255,255,255,0.16)",
            borderRadius: 999, padding: "5px 12px",
            fontSize: 10.5, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase",
          }}>
            <Receipt size={12} /> Latest payslip
          </span>
          <h2 style={{
            margin: "14px 0 4px", fontSize: 30, fontWeight: 800,
            letterSpacing: -0.7, lineHeight: 1.1,
          }}>
            {payslip.period}
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.72)" }}>
            Issued {formatDate(payslip.issueDate)} · {employeeName}
          </p>
        </div>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          fontSize: 11.5, fontWeight: 700,
          color: "rgba(255,255,255,0.82)",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 999, padding: "5px 12px",
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%",
            background: C.green, boxShadow: `0 0 0 4px rgba(125,198,149,0.25)`,
          }} />
          Paid
        </div>
      </div>

      {/* Divider */}
      <div style={{ position: "relative", height: 1, background: "rgba(255,255,255,0.14)", margin: "22px 0 20px" }} />

      {/* Amount grid */}
      <div style={{
        position: "relative", display: "grid",
        gridTemplateColumns: "1.4fr 1fr 1fr", gap: 20,
        alignItems: "flex-end",
      }}>
        <div style={FONT_NUM}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.3, opacity: 0.7, textTransform: "uppercase" }}>
            Net pay
          </div>
          <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.05, marginTop: 4 }}>
            {formatMoney(payslip.net, payslip.currency)}
          </div>
        </div>
        <MiniStat label="Gross" value={formatMoney(payslip.gross, payslip.currency)} />
        <MiniStat label="Deductions" value={formatMoney(deductions, payslip.currency)} />
      </div>

      {/* Actions */}
      <div style={{
        position: "relative", marginTop: 24, paddingTop: 20,
        borderTop: "1px solid rgba(255,255,255,0.14)",
        display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center",
      }}>
        <PrimaryHeroBtn
          onClick={async () => {
            if (!payslip.data) return;
            const url = await buildPayslipObjectUrl(payslip.data);
            window.open(url, "_blank", "noopener,noreferrer");
          }}
        >
          <Eye size={15} /> View payslip
        </PrimaryHeroBtn>
        <GhostHeroBtn
          onClick={() => { if (payslip.data) void downloadPayslipPdf(payslip.data, payslip.fileName); }}
        >
          <Download size={15} /> Download PDF
        </GhostHeroBtn>
        <button
          type="button"
          onClick={() => { /* placeholder — wire to /employee/payslips when built */ }}
          style={{
            marginLeft: "auto",
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "transparent", border: "none",
            color: "rgba(255,255,255,0.75)", fontSize: 12.5, fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Payslip history <ChevronRight size={14} />
        </button>
      </div>
    </section>
  );
};

const MiniStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={FONT_NUM}>
    <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1.1, opacity: 0.65, textTransform: "uppercase" }}>
      {label}
    </div>
    <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: "rgba(255,255,255,0.92)" }}>
      {value}
    </div>
  </div>
);

const PrimaryHeroBtn: React.FC<React.PropsWithChildren<{ onClick: () => void }>> = ({
  onClick, children,
}) => (
  <button
    type="button" onClick={onClick}
    style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "11px 20px", borderRadius: 10,
      border: "none",
      background: `linear-gradient(135deg, ${C.coral} 0%, ${C.coralDk} 100%)`,
      color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
      boxShadow: "0 8px 20px rgba(216,138,127,0.4)",
      transition: "transform .15s, box-shadow .15s",
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = "translateY(-1px)";
      e.currentTarget.style.boxShadow = "0 12px 26px rgba(216,138,127,0.5)";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = "";
      e.currentTarget.style.boxShadow = "0 8px 20px rgba(216,138,127,0.4)";
    }}
  >
    {children}
  </button>
);

const GhostHeroBtn: React.FC<React.PropsWithChildren<{ onClick: () => void }>> = ({
  onClick, children,
}) => (
  <button
    type="button" onClick={onClick}
    style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "10px 18px", borderRadius: 10,
      background: "rgba(255,255,255,0.10)",
      border: "1px solid rgba(255,255,255,0.24)",
      color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
      transition: "background .15s ease",
    }}
    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
    onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.10)")}
  >
    {children}
  </button>
);

/* ─────────────────────────────────────────────────────────────────────
 * Payroll insights column
 * ────────────────────────────────────────────────────────────────── */

const PayrollInsights: React.FC<{ payslip: PayslipMeta }> = ({ payslip }) => {
  const monthIdx = new Date().getMonth(); // Jan = 0
  const monthsPaid = monthIdx + 1;
  const ytd = payslip.net * monthsPaid;
  const { label: paydayLabel, daysUntil } = nextPaydayInfo();

  return (
    <aside style={{
      display: "grid", gap: 12, gridTemplateColumns: "1fr",
      alignContent: "start",
    }}>
      <InsightCard
        icon={<TrendingUp size={18} />}
        tint={C.green} tintBg={C.greenBg}
        label="Year-to-date net"
        value={formatMoney(ytd, payslip.currency)}
        hint={`Across ${monthsPaid} pay run${monthsPaid === 1 ? "" : "s"} this year`}
      />
      <InsightCard
        icon={<Calendar size={18} />}
        tint={C.blue} tintBg={C.blueBg}
        label="Next payday"
        value={paydayLabel}
        hint={daysUntil === 0 ? "Today — check your account" : `in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`}
      />
      <InsightCard
        icon={<History size={18} />}
        tint={C.purple} tintBg={C.purpleBg}
        label="Payslip history"
        value={`${monthsPaid} available`}
        hint="Every payslip is stored securely"
        cta="View archive"
      />
    </aside>
  );
};

const InsightCard: React.FC<{
  icon: React.ReactNode; tint: string; tintBg: string;
  label: string; value: string; hint?: string; cta?: string;
}> = ({ icon, tint, tintBg, label, value, hint, cta }) => (
  <div style={{
    background: C.surface, border: `1px solid ${C.line}`,
    borderRadius: R.lg, boxShadow: SHADOW,
    padding: 18, display: "flex", alignItems: "center", gap: 14,
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 12,
      background: tintBg, color: tint,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      {icon}
    </div>
    <div style={{ minWidth: 0, flex: 1 }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, letterSpacing: 0.2 }}>
        {label}
      </div>
      <div style={{ fontSize: 19, fontWeight: 800, color: C.ink, letterSpacing: -0.3, marginTop: 2, ...FONT_NUM }}>
        {value}
      </div>
      {hint && (
        <div style={{ fontSize: 11.5, color: C.faint, marginTop: 2 }}>
          {hint}
        </div>
      )}
    </div>
    {cta && (
      <button type="button" style={{
        background: "transparent", border: "none",
        color: tint, fontSize: 12, fontWeight: 700, cursor: "pointer",
        display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0,
      }}>
        {cta} <ArrowRight size={13} />
      </button>
    )}
  </div>
);

/* ─────────────────────────────────────────────────────────────────────
 * Category group + document card
 * ────────────────────────────────────────────────────────────────── */

const CategoryGroup: React.FC<{ category: DocCategory; items: OrgDocument[] }> = ({
  category, items,
}) => {
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;
  return (
    <section style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: meta.bg, color: meta.color,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon size={17} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.ink, letterSpacing: -0.2 }}>
            {meta.label}
          </div>
          <div style={{ fontSize: 11.5, color: C.faint }}>
            {meta.blurb}
          </div>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 800, letterSpacing: 0.5,
          background: meta.bg, color: meta.color,
          borderRadius: 999, padding: "3px 10px",
        }}>
          {items.length}
        </span>
      </div>
      <div className="kg-doc-list">
        {items.map(d => <DocCard key={d.id} doc={d} />)}
      </div>
    </section>
  );
};

const DocCard: React.FC<{ doc: OrgDocument }> = ({ doc }) => {
  const meta = CATEGORY_META[doc.category];
  const Icon = meta.icon;
  return (
    <article
      style={{
        position: "relative", background: C.surface,
        border: `1px solid ${C.line}`, borderRadius: R.lg,
        padding: 18, display: "flex", flexDirection: "column", gap: 12,
        boxShadow: SHADOW, overflow: "hidden",
        transition: "transform .15s, box-shadow .15s, border-color .15s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 14px 28px rgba(16,24,40,0.08)";
        e.currentTarget.style.borderColor = meta.color;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = SHADOW;
        e.currentTarget.style.borderColor = C.line;
      }}
    >
      {/* accent stripe */}
      <div aria-hidden style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
        background: meta.color, opacity: 0.85,
      }} />

      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 10,
          background: meta.bg, color: meta.color, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={19} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: 14.5, fontWeight: 800, color: C.ink, lineHeight: 1.3, letterSpacing: -0.1,
            overflow: "hidden", display: "-webkit-box",
            WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          }}>
            {doc.title}
          </div>
          <div style={{ fontSize: 11.5, color: C.faint, marginTop: 3 }}>
            {formatDate(doc.uploadedAt)} · {formatBytes(doc.size)}
          </div>
        </div>
      </div>

      {doc.description ? (
        <p style={{
          margin: 0, fontSize: 12.5, color: C.text, lineHeight: 1.5,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          minHeight: 38,
        }}>
          {doc.description}
        </p>
      ) : (
        <p style={{ margin: 0, minHeight: 38, fontSize: 12.5, color: C.faint, fontStyle: "italic" }}>
          No description provided.
        </p>
      )}

      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 8, marginTop: "auto", paddingTop: 10, borderTop: `1px solid ${C.line}`,
      }}>
        <button
          type="button"
          onClick={() => openInNewTab(doc)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 999,
            background: C.ink, color: "#fff",
            border: "none", cursor: "pointer",
            fontSize: 12.5, fontWeight: 700,
            transition: "background .15s ease",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "#0f1523")}
          onMouseLeave={e => (e.currentTarget.style.background = C.ink)}
        >
          <Eye size={13} /> Open
        </button>
        <button
          type="button"
          onClick={() => downloadDataUrl(doc.dataUrl, doc.fileName)}
          title="Download"
          aria-label="Download"
          style={{
            width: 34, height: 34, borderRadius: "50%",
            background: C.surfaceAlt, border: `1px solid ${C.line}`,
            color: C.text, cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            transition: "all .15s ease",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = meta.bg;
            e.currentTarget.style.color = meta.color;
            e.currentTarget.style.borderColor = meta.color;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = C.surfaceAlt;
            e.currentTarget.style.color = C.text;
            e.currentTarget.style.borderColor = C.line;
          }}
        >
          <Download size={14} />
        </button>
      </div>
    </article>
  );
};

/* ─────────────────────────────────────────────────────────────────────
 * Small building blocks
 * ────────────────────────────────────────────────────────────────── */

const Chip: React.FC<{
  label: string; active: boolean; onClick: () => void; tint?: string;
}> = ({ label, active, onClick, tint = C.ink }) => (
  <button type="button" onClick={onClick} style={{
    padding: "7px 13px", borderRadius: 999, fontSize: 12, fontWeight: 700,
    border: `1px solid ${active ? tint : C.line}`,
    background: active ? tint : "#fff",
    color: active ? "#fff" : C.text,
    cursor: "pointer", transition: "all .15s ease",
  }}>
    {label}
  </button>
);

const EmptyState: React.FC<{ icon: React.ReactNode; title: string; body: string }> = ({
  icon, title, body,
}) => (
  <div style={{
    background: C.surface, border: `1px dashed ${C.line}`,
    borderRadius: R.lg, padding: "56px 24px", textAlign: "center",
  }}>
    <div style={{ marginBottom: 12 }}>{icon}</div>
    <div style={{ fontSize: 15, fontWeight: 800, color: C.ink }}>{title}</div>
    <p style={{ fontSize: 13, color: C.muted, margin: "6px auto 0", maxWidth: 380 }}>
      {body}
    </p>
  </div>
);

export default EmployeeDocumentsPage;
