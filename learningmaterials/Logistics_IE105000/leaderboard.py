import streamlit as st
import streamlit.components.v1 as components
import sqlite3
import pandas as pd
from datetime import datetime
import json
from pathlib import Path

st.set_page_config(page_title="Global Logistics — Leaderboard", page_icon="🌐", layout="wide")

ADMIN_PASSWORD = "1234IE105000"
DB_PATH = "leaderboard.db"

# ── DB helpers ─────────────────────────────────────────────────────────────────

def get_conn():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.execute("PRAGMA journal_mode=WAL")
    return conn

def init_db():
    conn = get_conn()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS scores (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id   TEXT    DEFAULT '',
            name         TEXT    NOT NULL,
            profit       INTEGER NOT NULL,
            units        INTEGER DEFAULT 0,
            chain        TEXT    DEFAULT '',
            submitted_at TEXT    DEFAULT (datetime('now','localtime'))
        )
    """)
    # Migration for existing DB
    try:
        conn.execute("ALTER TABLE scores ADD COLUMN student_id TEXT DEFAULT ''")
    except Exception:
        pass
    conn.commit()
    conn.close()

init_db()

def get_scores():
    conn = get_conn()
    df = pd.read_sql("SELECT * FROM scores ORDER BY profit DESC", conn)
    conn.close()
    return df

def add_score(name, profit, units, chain, student_id=""):
    conn = get_conn()
    conn.execute(
        "INSERT INTO scores (student_id, name, profit, units, chain) VALUES (?,?,?,?,?)",
        (student_id.strip(), name.strip(), int(profit), int(units), chain.strip())
    )
    conn.commit()
    conn.close()

def delete_score(sid):
    conn = get_conn()
    conn.execute("DELETE FROM scores WHERE id=?", (sid,))
    conn.commit()
    conn.close()

def update_score(sid, name, profit, units, chain):
    conn = get_conn()
    conn.execute(
        "UPDATE scores SET name=?, profit=?, units=?, chain=? WHERE id=?",
        (name.strip(), int(profit), int(units), chain.strip(), sid)
    )
    conn.commit()
    conn.close()

def delete_all():
    conn = get_conn()
    conn.execute("DELETE FROM scores")
    conn.commit()
    conn.close()

# ── URL params ────────────────────────────────────────────────────────────────

params         = st.query_params
pre_autosubmit = params.get("autosubmit", "")
pre_studentId  = params.get("studentId",  "")
pre_name       = params.get("name",       "")
pre_profit     = params.get("profit",     "")
pre_units      = params.get("units",      "")
pre_chain      = params.get("chain",      "")

# Auto-save score when all params arrive from game (runs only once per submission)
if pre_autosubmit and pre_name and pre_profit:
    if "autosubmit_done" not in st.session_state:
        add_score(pre_name, int(pre_profit),
                  int(pre_units) if pre_units else 0,
                  pre_chain, pre_studentId)
        st.session_state.autosubmit_done = True
        st.session_state.autosubmit_name = pre_name
        st.query_params.clear()

# ── Tab navigation ─────────────────────────────────────────────────────────────

TABS = ["🎮 Game", "🏆 Leaderboard", "🔐 Admin"]

# Default to Leaderboard tab when arriving from game submit
if "tab" not in st.session_state:
    st.session_state.tab = "🏆 Leaderboard" if pre_autosubmit else "🎮 Game"

st.title("🌐 Global Logistics Game")

cols = st.columns(len(TABS))
for col, name in zip(cols, TABS):
    if col.button(name, use_container_width=True,
                  type="primary" if st.session_state.tab == name else "secondary"):
        st.session_state.tab = name
        st.rerun()

st.divider()

# ══════════════════════════════════════════════════════════════════════════════
# 🎮  GAME
# ══════════════════════════════════════════════════════════════════════════════

if st.session_state.tab == "🎮 Game":
    here = Path(__file__).parent
    style_css  = (here / "style.css").read_text(encoding="utf-8")
    config_js  = (here / "config.js").read_text(encoding="utf-8")
    game_js    = (here / "game.js").read_text(encoding="utf-8")
    index_html = (here / "index.html").read_text(encoding="utf-8")

    game_html = index_html
    game_html = game_html.replace(
        '<link rel="stylesheet" href="style.css" />',
        f'<style>{style_css}\nbody{{height:680px!important;}}</style>'
    )
    game_html = game_html.replace(
        '<script src="config.js"></script>',
        f'<script>{config_js}</script>'
    )
    game_html = game_html.replace(
        '<script src="game.js"></script>',
        f'<script>{game_js}</script>'
    )

    components.html(game_html, height=680, scrolling=False)

# ══════════════════════════════════════════════════════════════════════════════
# 🏆  LEADERBOARD  (+ inline submit form when score data is present)
# ══════════════════════════════════════════════════════════════════════════════

elif st.session_state.tab == "🏆 Leaderboard":
    if st.session_state.get("autosubmit_done"):
        st.success(f"✅ **{st.session_state.autosubmit_name}** 님의 점수가 등록되었습니다!")
        st.balloons()
        del st.session_state["autosubmit_done"]
        del st.session_state["autosubmit_name"]

    df = get_scores()
    if df.empty:
        st.info("No scores yet. Play the game and submit your result!")
    else:
        df_display = df.copy().reset_index(drop=True)
        df_display.index = df_display.index + 1
        df_display.index.name = "Rank"

        medals = {1: "🥇", 2: "🥈", 3: "🥉"}

        def fmt_profit(v):
            return f"+${v:,}" if v >= 0 else f"-${abs(v):,}"

        df_display["Net Profit"] = df_display["profit"].apply(fmt_profit)
        df_display["Units Sold"] = df_display["units"]
        df_display["Supply Chain"] = df_display["chain"]
        df_display["Submitted"] = pd.to_datetime(df_display["submitted_at"]).dt.strftime("%Y-%m-%d %H:%M")
        df_display["Name"] = df_display.apply(
            lambda r: medals.get(r.name, "") + " " +
                      (f"[{r['student_id']}] " if r.get("student_id") else "") + r["name"], axis=1
        )

        st.dataframe(
            df_display[["Name", "Net Profit", "Units Sold", "Supply Chain", "Submitted"]],
            use_container_width=True,
            hide_index=False,
        )

        c1, c2, c3 = st.columns(3)
        c1.metric("Submissions", len(df))
        c2.metric("Best Profit", fmt_profit(df["profit"].max()))
        c3.metric("Average Profit", fmt_profit(int(df["profit"].mean())))

# ══════════════════════════════════════════════════════════════════════════════
# 🔐  ADMIN
# ══════════════════════════════════════════════════════════════════════════════

elif st.session_state.tab == "🔐 Admin":
    pwd = st.text_input("Admin Password", type="password", key="admin_pwd")

    if pwd == ADMIN_PASSWORD:
        st.success("✅ Admin access granted")
        a1, a2 = st.tabs(["📋 Manage Scores", "⚙️ Game Config Editor"])

        # ── Manage Scores ──────────────────────────────────────────────────────
        with a1:
            df = get_scores()
            if df.empty:
                st.info("No submissions yet.")
            else:
                col_bulk1, col_bulk2 = st.columns([4, 1])
                with col_bulk2:
                    if st.button("🗑️ Delete ALL", type="secondary", use_container_width=True):
                        delete_all()
                        st.rerun()

                st.divider()

                for _, row in df.iterrows():
                    with st.expander(f"#{int(row['id'])}  {row['name']}  |  ${int(row['profit']):,}  |  {row['chain']}"):
                        c1, c2 = st.columns([3, 1])
                        with c1:
                            n_name   = st.text_input("Name",   value=row["name"],            key=f"n_{row['id']}")
                            n_profit = st.number_input("Profit", value=int(row["profit"]),   key=f"p_{row['id']}")
                            n_units  = st.number_input("Units",  value=int(row["units"] or 0),key=f"u_{row['id']}")
                            n_chain  = st.text_input("Chain",  value=row["chain"] or "",     key=f"c_{row['id']}")
                        with c2:
                            st.write("")
                            st.write("")
                            if st.button("💾 Save",   key=f"s_{row['id']}", use_container_width=True):
                                update_score(row["id"], n_name, n_profit, n_units, n_chain)
                                st.rerun()
                            if st.button("🗑️ Delete", key=f"d_{row['id']}", use_container_width=True):
                                delete_score(row["id"])
                                st.rerun()

        # ── Game Config Editor ─────────────────────────────────────────────────
        with a2:
            st.subheader("Game Config Editor")
            st.info("Edit values below, then click **Generate config.js** and commit the file to GitHub.")

            DEFAULT_REGIONS = {
                "NorthAmerica": {"label":"North America","demand":120,"marketPrice":200,"mapPos":{"x":24,"y":32},
                    "mine":{"buildCost":100000,"opCostPerUnit":115,"outputPerPeriod":80},
                    "factory":{"buildCost":200000,"opCostPerUnit":135,"outputPerPeriod":220},
                    "hub":{"buildCost":60000,"opCostPerUnit":70}},
                "SouthAmerica": {"label":"South America","demand":60,"marketPrice":160,"mapPos":{"x":31,"y":65},
                    "mine":{"buildCost":70000,"opCostPerUnit":70,"outputPerPeriod":110},
                    "factory":{"buildCost":130000,"opCostPerUnit":90,"outputPerPeriod":160},
                    "hub":{"buildCost":35000,"opCostPerUnit":35}},
                "Europe":       {"label":"Europe","demand":100,"marketPrice":225,"mapPos":{"x":50,"y":24},
                    "mine":{"buildCost":120000,"opCostPerUnit":140,"outputPerPeriod":60},
                    "factory":{"buildCost":180000,"opCostPerUnit":145,"outputPerPeriod":200},
                    "hub":{"buildCost":70000,"opCostPerUnit":85}},
                "Africa":       {"label":"Africa","demand":50,"marketPrice":140,"mapPos":{"x":52,"y":57},
                    "mine":{"buildCost":55000,"opCostPerUnit":40,"outputPerPeriod":130},
                    "factory":{"buildCost":100000,"opCostPerUnit":70,"outputPerPeriod":140},
                    "hub":{"buildCost":25000,"opCostPerUnit":25}},
                "MiddleEast":   {"label":"Middle East","demand":40,"marketPrice":175,"mapPos":{"x":59,"y":38},
                    "mine":{"buildCost":65000,"opCostPerUnit":55,"outputPerPeriod":100},
                    "factory":{"buildCost":140000,"opCostPerUnit":95,"outputPerPeriod":170},
                    "hub":{"buildCost":40000,"opCostPerUnit":50}},
                "Asia":         {"label":"Asia","demand":150,"marketPrice":150,"mapPos":{"x":74,"y":28},
                    "mine":{"buildCost":75000,"opCostPerUnit":80,"outputPerPeriod":120},
                    "factory":{"buildCost":120000,"opCostPerUnit":55,"outputPerPeriod":210},
                    "hub":{"buildCost":50000,"opCostPerUnit":65}},
                "Oceania":      {"label":"Oceania","demand":30,"marketPrice":190,"mapPos":{"x":80,"y":68},
                    "mine":{"buildCost":80000,"opCostPerUnit":90,"outputPerPeriod":90},
                    "factory":{"buildCost":160000,"opCostPerUnit":105,"outputPerPeriod":180},
                    "hub":{"buildCost":30000,"opCostPerUnit":55}},
            }

            if "cfg" not in st.session_state:
                st.session_state.cfg = {k: dict(v) for k, v in DEFAULT_REGIONS.items()}

            cfg = st.session_state.cfg
            budget = st.number_input("Starting Budget ($)", value=500_000, step=10_000)

            for rid, rdata in cfg.items():
                with st.expander(f"🌍 {rdata['label']}"):
                    cc1, cc2 = st.columns(2)
                    with cc1:
                        cfg[rid]["demand"]      = st.number_input("Demand (units)",       value=rdata["demand"],      key=f"{rid}_d",  step=10)
                        cfg[rid]["marketPrice"] = st.number_input("Market Price ($/unit)", value=rdata["marketPrice"], key=f"{rid}_mp", step=5)
                    with cc2:
                        st.write("")

                    st.markdown("**⛏️ Mine**")
                    m1, m2, m3 = st.columns(3)
                    cfg[rid]["mine"]["buildCost"]       = m1.number_input("Build Cost",   value=rdata["mine"]["buildCost"],       key=f"{rid}_mb",  step=5000)
                    cfg[rid]["mine"]["opCostPerUnit"]   = m2.number_input("Op Cost/unit", value=rdata["mine"]["opCostPerUnit"],   key=f"{rid}_mo",  step=5)
                    cfg[rid]["mine"]["outputPerPeriod"] = m3.number_input("Max Output",   value=rdata["mine"]["outputPerPeriod"], key=f"{rid}_mout",step=10)

                    st.markdown("**🏭 Factory**")
                    f1, f2, f3 = st.columns(3)
                    cfg[rid]["factory"]["buildCost"]       = f1.number_input("Build Cost",   value=rdata["factory"]["buildCost"],       key=f"{rid}_fb",  step=5000)
                    cfg[rid]["factory"]["opCostPerUnit"]   = f2.number_input("Op Cost/unit", value=rdata["factory"]["opCostPerUnit"],   key=f"{rid}_fo",  step=5)
                    cfg[rid]["factory"]["outputPerPeriod"] = f3.number_input("Max Output",   value=rdata["factory"]["outputPerPeriod"], key=f"{rid}_fout",step=10)

                    st.markdown("**🏪 Sales Hub**")
                    h1, h2 = st.columns(2)
                    cfg[rid]["hub"]["buildCost"]     = h1.number_input("Build Cost",   value=rdata["hub"]["buildCost"],     key=f"{rid}_hb", step=5000)
                    cfg[rid]["hub"]["opCostPerUnit"] = h2.number_input("Op Cost/unit", value=rdata["hub"]["opCostPerUnit"], key=f"{rid}_ho", step=5)

            if st.button("⚙️ Generate config.js", type="primary", use_container_width=True):
                lines = ['/**\n * config.js — Auto-generated from admin panel.\n */\n\nconst CONFIG = {\n\n']
                lines.append(f'  budget: {{ initial: {budget:_} }},\n\n')
                lines.append('  gameMode: { periods: 1, showCostBreakdown: true },\n\n')
                lines.append('  regions: {\n')
                for rid, r in cfg.items():
                    mp = r["mapPos"]
                    lines.append(f'    {rid}: {{\n')
                    lines.append(f'      label: "{r["label"]}",\n')
                    lines.append(f'      demand: {r["demand"]},\n')
                    lines.append(f'      marketPrice: {r["marketPrice"]},\n')
                    lines.append(f'      mapPos: {{ x: {mp["x"]}, y: {mp["y"]} }},\n')
                    lines.append(f'      facilityCosts: {{\n')
                    m = r["mine"]
                    lines.append(f'        mine:     {{ buildCost: {m["buildCost"]:_}, opCostPerUnit: {m["opCostPerUnit"]}, outputPerPeriod: {m["outputPerPeriod"]} }},\n')
                    f_ = r["factory"]
                    lines.append(f'        factory:  {{ buildCost: {f_["buildCost"]:_}, opCostPerUnit: {f_["opCostPerUnit"]}, outputPerPeriod: {f_["outputPerPeriod"]} }},\n')
                    h = r["hub"]
                    lines.append(f'        salesHub: {{ buildCost: {h["buildCost"]:_}, opCostPerUnit: {h["opCostPerUnit"]} }},\n')
                    lines.append(f'      }},\n')
                    lines.append(f'    }},\n')
                lines.append('  },\n\n')
                lines.append('''  facilities: {
    mine:     { label: "Mine",      emoji: "⛏️", description: "Extracts raw materials. Cost and output vary by region." },
    factory:  { label: "Factory",   emoji: "🏭", description: "Produces finished goods. Cost and output vary by region." },
    salesHub: { label: "Sales Hub", emoji: "🏪", outputPerPeriod: 0, description: "Sells goods to local customers." },
  },

  transportCost: {
    NorthAmerica: { SouthAmerica: 4,  Europe: 6,  Africa: 9,  MiddleEast: 11, Asia: 13, Oceania: 14 },
    SouthAmerica: { NorthAmerica: 4,  Europe: 8,  Africa: 7,  MiddleEast: 12, Asia: 15, Oceania: 13 },
    Europe:       { NorthAmerica: 6,  SouthAmerica: 8,  Africa: 5,  MiddleEast: 6,  Asia: 9,  Oceania: 14 },
    Africa:       { NorthAmerica: 9,  SouthAmerica: 7,  Europe: 5,  MiddleEast: 5,  Asia: 10, Oceania: 12 },
    MiddleEast:   { NorthAmerica: 11, SouthAmerica: 12, Europe: 6,  Africa: 5,  Asia: 6,  Oceania: 9  },
    Asia:         { NorthAmerica: 13, SouthAmerica: 15, Europe: 9,  Africa: 10, MiddleEast: 6,  Oceania: 5  },
    Oceania:      { NorthAmerica: 14, SouthAmerica: 13, Europe: 14, Africa: 12, MiddleEast: 9,  Asia: 5     },
  },
};\n''')

                config_js_out = "".join(lines)
                st.code(config_js_out, language="javascript")
                st.download_button("⬇️ Download config.js", data=config_js_out,
                                   file_name="config.js", mime="text/javascript",
                                   use_container_width=True)

    elif pwd:
        st.error("❌ Incorrect password.")
