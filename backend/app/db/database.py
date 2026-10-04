"""
MergeMind Database Layer
Lightweight, thread-safe SQLite persistence for repositories, branches, commits,
analyses, risks, agent execution runs, reviews, and test runs.
"""

import sqlite3
import json
import os
import datetime
from typing import Dict, Any, List, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "mergemind.db")

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes database schema with required tables and indexes."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS repositories (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        owner TEXT NOT NULL,
        default_branch TEXT NOT NULL DEFAULT 'main',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS analyses (
        id TEXT PRIMARY KEY,
        repository_id TEXT NOT NULL,
        repository_name TEXT NOT NULL,
        branch_a TEXT,
        branch_b TEXT,
        analysis_engine TEXT NOT NULL, -- 'llm_reasoning' or 'deterministic_rule_based'
        llm_model TEXT,
        risk_summary TEXT NOT NULL, -- JSON
        agent_trace TEXT NOT NULL,   -- JSON
        is_demo INTEGER NOT NULL DEFAULT 0,
        analyzed_at TEXT NOT NULL,
        FOREIGN KEY (repository_id) REFERENCES repositories(id)
    );

    CREATE TABLE IF NOT EXISTS risks (
        id TEXT PRIMARY KEY,
        analysis_id TEXT NOT NULL,
        collision_type TEXT NOT NULL,
        risk_level TEXT NOT NULL,
        risk_score TEXT NOT NULL,      -- JSON
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        why_it_exists TEXT NOT NULL,
        affected_files TEXT NOT NULL,  -- JSON
        affected_components TEXT NOT NULL, -- JSON
        branches TEXT NOT NULL,        -- JSON
        commits TEXT NOT NULL,         -- JSON
        evidence TEXT NOT NULL,        -- JSON
        confidence REAL NOT NULL,
        recommended_steps TEXT NOT NULL, -- JSON
        test_recommendation TEXT NOT NULL, -- JSON
        compatibility_patch TEXT,      -- JSON
        review_status TEXT NOT NULL DEFAULT 'PENDING',
        review_notes TEXT,
        reviewed_at TEXT,
        FOREIGN KEY (analysis_id) REFERENCES analyses(id)
    );

    CREATE TABLE IF NOT EXISTS agent_runs (
        id TEXT PRIMARY KEY,
        analysis_id TEXT NOT NULL,
        agent_name TEXT NOT NULL,
        action TEXT NOT NULL,
        status TEXT NOT NULL,
        duration_ms INTEGER NOT NULL,
        output_summary TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (analysis_id) REFERENCES analyses(id)
    );

    CREATE TABLE IF NOT EXISTS test_runs (
        id TEXT PRIMARY KEY,
        analysis_id TEXT NOT NULL,
        risk_id TEXT NOT NULL,
        command TEXT NOT NULL,
        status TEXT NOT NULL, -- 'success', 'failure', 'error', 'sandboxed_unavailable'
        exit_code INTEGER,
        stdout TEXT,
        stderr TEXT,
        duration_ms INTEGER NOT NULL,
        executed_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_analyses_repo ON analyses(repository_name);
    CREATE INDEX IF NOT EXISTS idx_risks_analysis ON risks(analysis_id);
    CREATE INDEX IF NOT EXISTS idx_agent_runs_analysis ON agent_runs(analysis_id);
    """)

    conn.commit()
    conn.close()

# Auto-initialize DB on module import
init_db()

def save_analysis(analysis_data: Dict[str, Any]) -> str:
    """Saves or updates an analysis and all its detected risks in SQLite."""
    conn = get_db_connection()
    cursor = conn.cursor()
    analysis_id = analysis_data.get("id") or f"ana_{int(datetime.datetime.utcnow().timestamp())}"
    repo_name = analysis_data.get("repository_name", "unknown")
    owner = repo_name.split("/")[0] if "/" in repo_name else "local"

    # Upsert repository
    cursor.execute("""
    INSERT INTO repositories (id, name, owner, default_branch, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET updated_at = excluded.updated_at
    """, (repo_name, repo_name, owner, "main", datetime.datetime.utcnow().isoformat(), datetime.datetime.utcnow().isoformat()))

    # Insert analysis record
    cursor.execute("""
    INSERT OR REPLACE INTO analyses (
        id, repository_id, repository_name, branch_a, branch_b,
        analysis_engine, llm_model, risk_summary, agent_trace, is_demo, analyzed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        analysis_id,
        repo_name,
        repo_name,
        analysis_data.get("active_branch_a"),
        analysis_data.get("active_branch_b"),
        analysis_data.get("analysis_engine", "deterministic_rule_based"),
        analysis_data.get("llm_model", "none"),
        json.dumps(analysis_data.get("risk_summary", {})),
        json.dumps([t if isinstance(t, dict) else t.dict() for t in analysis_data.get("agent_trace", [])]),
        1 if analysis_data.get("is_demo") else 0,
        analysis_data.get("analyzed_at", datetime.datetime.utcnow().isoformat())
    ))

    # Insert risks
    for r in analysis_data.get("detected_risks", []):
        r_dict = r if isinstance(r, dict) else r.dict()
        cursor.execute("""
        INSERT OR REPLACE INTO risks (
            id, analysis_id, collision_type, risk_level, risk_score,
            title, summary, why_it_exists, affected_files, affected_components,
            branches, commits, evidence, confidence, recommended_steps,
            test_recommendation, compatibility_patch, review_status, review_notes, reviewed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            r_dict.get("id"),
            analysis_id,
            r_dict.get("collision_type"),
            r_dict.get("risk_level"),
            json.dumps(r_dict.get("risk_score", {})),
            r_dict.get("title", "Risk"),
            r_dict.get("summary", ""),
            r_dict.get("why_it_exists", ""),
            json.dumps(r_dict.get("affected_files", [])),
            json.dumps(r_dict.get("affected_components", [])),
            json.dumps(r_dict.get("branches", [])),
            json.dumps(r_dict.get("commits", [])),
            json.dumps(r_dict.get("evidence", [])),
            float(r_dict.get("confidence", 0.9)),
            json.dumps(r_dict.get("recommended_steps", [])),
            json.dumps(r_dict.get("test_recommendation", {})),
            json.dumps(r_dict.get("compatibility_patch", {})) if r_dict.get("compatibility_patch") else None,
            r_dict.get("review_status", "PENDING"),
            r_dict.get("review_notes"),
            datetime.datetime.utcnow().isoformat() if r_dict.get("review_status") != "PENDING" else None
        ))

    conn.commit()
    conn.close()
    return analysis_id

def update_risk_review(risk_id: str, status: str, notes: Optional[str] = None) -> bool:
    """Updates review state for a risk in database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE risks
    SET review_status = ?, review_notes = ?, reviewed_at = ?
    WHERE id = ?
    """, (status, notes, datetime.datetime.utcnow().isoformat(), risk_id))
    affected = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return affected

def get_latest_reviews() -> Dict[str, Dict[str, Any]]:
    """Loads all reviewed risks from SQLite into an in-memory dictionary."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, review_status, review_notes FROM risks WHERE review_status != 'PENDING'")
    rows = cursor.fetchall()
    reviews = {}
    for r in rows:
        reviews[r["id"]] = {
            "status": r["review_status"],
            "notes": r["review_notes"]
        }
    conn.close()
    return reviews

def get_audit_trail() -> List[Dict[str, Any]]:
    """Retrieves full audit log of analyses and risk reviews from SQLite."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT 
        r.id as risk_id, r.title, r.collision_type, r.risk_level, 
        r.review_status, r.review_notes, r.reviewed_at,
        a.id as analysis_id, a.repository_name, a.analysis_engine, a.analyzed_at
    FROM risks r
    JOIN analyses a ON r.analysis_id = a.id
    ORDER BY r.reviewed_at DESC, a.analyzed_at DESC
    LIMIT 50
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]
