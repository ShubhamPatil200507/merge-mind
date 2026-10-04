"""
GitHub API Client for MergeMind.
Fetches branches, commits, PRs, and diffs from GitHub with rate-limiting resilience.
Never stores or logs raw tokens.
"""

from typing import List, Dict, Any, Optional, Tuple
import httpx
import re
from app.models import CommitInfo

def parse_repo_identifier(repo_input: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Parses 'owner/repo' or 'https://github.com/owner/repo' into (owner, repo).
    """
    cleaned = repo_input.strip().rstrip("/")
    if "github.com/" in cleaned:
        cleaned = cleaned.split("github.com/")[-1]
    
    parts = cleaned.split("/")
    if len(parts) >= 2:
        return parts[0], parts[1].replace(".git", "")
    return None, None

async def fetch_github_repository(
    repo_identifier: str,
    token: Optional[str] = None
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Fetches real GitHub repository data: branches, commits, PRs, diffs.
    Returns (data_dict, error_or_warning_message).
    """
    owner, repo = parse_repo_identifier(repo_identifier)
    if not owner or not repo:
        return None, "Invalid repository format. Please enter 'owner/repo' (e.g. facebook/react) or full GitHub URL."

    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "MergeMind-Agent/1.0"
    }
    if token and token.strip():
        clean_token = token.strip()
        headers["Authorization"] = f"Bearer {clean_token}"

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            repo_url = f"https://api.github.com/repos/{owner}/{repo}"
            
            # 1. Fetch repo metadata
            res = await client.get(repo_url, headers=headers)
            
            if res.status_code == 401:
                return None, "GitHub API: Invalid Personal Access Token (HTTP 401 Unauthorized). Please check your token or leave it blank for public repos."
            elif res.status_code == 404:
                return None, f"GitHub API: Repository '{owner}/{repo}' not found (HTTP 404). If private, provide a Personal Access Token with 'repo' scope."
            elif res.status_code == 403:
                remaining = res.headers.get("x-ratelimit-remaining", "0")
                if remaining == "0":
                    return None, "GitHub API rate limit exceeded (HTTP 403). GitHub allows 60 req/hr for anonymous access. Add a GitHub Personal Access Token (PAT) for 5,000 req/hr, or explore Demo Mode."
                return None, "GitHub API access forbidden (HTTP 403). Check repository permissions or provide a Personal Access Token."
            elif res.status_code != 200:
                return None, f"GitHub API error (HTTP {res.status_code}): {res.text[:120]}"

            repo_meta = res.json()
            default_branch = repo_meta.get("default_branch", "main")

            # 2. Fetch branches
            branches = [default_branch]
            branches_res = await client.get(f"{repo_url}/branches?per_page=15", headers=headers)
            if branches_res.status_code == 200:
                found_branches = [b["name"] for b in branches_res.json()]
                if found_branches:
                    branches = [default_branch] + [b for b in found_branches if b != default_branch]

            # 3. Fetch PRs
            prs: List[Dict[str, Any]] = []
            prs_res = await client.get(f"{repo_url}/pulls?state=all&per_page=10", headers=headers)
            if prs_res.status_code == 200:
                for p in prs_res.json():
                    prs.append({
                        "id": p["id"],
                        "number": p["number"],
                        "title": p["title"],
                        "author": p.get("user", {}).get("login", "unknown"),
                        "author_avatar": p.get("user", {}).get("avatar_url", ""),
                        "source_branch": p.get("head", {}).get("ref", "unknown"),
                        "target_branch": p.get("base", {}).get("ref", "unknown"),
                        "created_at": p.get("created_at", ""),
                        "updated_at": p.get("updated_at", ""),
                        "status": p.get("state", "open"),
                        "description": p.get("body") or "",
                        "changed_files_count": 0,
                        "additions": 0,
                        "deletions": 0
                    })

            # 4. Fetch recent commits across branches
            commits: List[CommitInfo] = []
            shas_seen = set()

            branches_to_fetch = branches[:3] if len(branches) > 1 else [default_branch]
            
            for br in branches_to_fetch:
                commits_res = await client.get(f"{repo_url}/commits?sha={br}&per_page=8", headers=headers)
                if commits_res.status_code == 200:
                    for c in commits_res.json():
                        sha_short = c["sha"][:7]
                        if sha_short in shas_seen:
                            continue
                        shas_seen.add(sha_short)

                        msg = c.get("commit", {}).get("message", "").split("\n")[0]
                        author = c.get("commit", {}).get("author", {}).get("name", "Unknown")
                        ts = c.get("commit", {}).get("author", {}).get("date", "")
                        
                        commits.append(CommitInfo(
                            sha=sha_short,
                            message=msg,
                            author=author,
                            timestamp=ts,
                            branch=br,
                            files_changed=[],
                            additions=0,
                            deletions=0,
                            diff_snippet=""
                        ))

            # Fallback general commits fetch if branches returned empty
            if not commits:
                commits_res = await client.get(f"{repo_url}/commits?per_page=15", headers=headers)
                if commits_res.status_code == 200:
                    for c in commits_res.json():
                        sha_short = c["sha"][:7]
                        msg = c.get("commit", {}).get("message", "").split("\n")[0]
                        author = c.get("commit", {}).get("author", {}).get("name", "Unknown")
                        ts = c.get("commit", {}).get("author", {}).get("date", "")
                        commits.append(CommitInfo(
                            sha=sha_short,
                            message=msg,
                            author=author,
                            timestamp=ts,
                            branch=default_branch,
                            files_changed=[],
                            additions=0,
                            deletions=0,
                            diff_snippet=""
                        ))

            # Fetch file details for top commits to populate files_changed and diff_snippet
            for commit in commits[:4]:
                try:
                    c_detail = await client.get(f"{repo_url}/commits/{commit.sha}", headers=headers)
                    if c_detail.status_code == 200:
                        c_data = c_detail.json()
                        files = [f.get("filename", "") for f in c_data.get("files", []) if f.get("filename")]
                        commit.files_changed = files[:5]
                        patches = [f.get("patch", "") for f in c_data.get("files", []) if f.get("patch")]
                        if patches:
                            commit.diff_snippet = patches[0][:300]
                        stats = c_data.get("stats", {})
                        commit.additions = stats.get("additions", 0)
                        commit.deletions = stats.get("deletions", 0)
                except Exception:
                    pass

            return {
                "name": f"{owner}/{repo}",
                "branches": branches,
                "commits": commits,
                "pull_requests": prs
            }, None

    except httpx.TimeoutException:
        return None, "GitHub API request timed out (12s). GitHub servers may be slow. Please retry or switch to Demo Mode."
    except httpx.ConnectError:
        return None, "Network error: Unable to reach https://api.github.com. Please check your internet connection or use Demo Mode."
    except Exception as exc:
        return None, f"GitHub integration error: {str(exc)}"
