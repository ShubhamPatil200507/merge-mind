"""
GitHub API Client for MergeMind.
Fetches branches, commits, PRs, diffs, file contents, and merge-base from GitHub with rate-limiting resilience.
Never stores or logs raw tokens.
"""

import os
import base64
from typing import List, Dict, Any, Optional, Tuple
import httpx
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

def get_auth_headers(token: Optional[str] = None) -> Dict[str, str]:
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "MergeMind-Agent/1.0"
    }
    effective_token = token.strip() if token and token.strip() else os.getenv("GITHUB_TOKEN", "").strip()
    if effective_token:
        headers["Authorization"] = f"Bearer {effective_token}"
    return headers

async def fetch_github_repository(
    repo_identifier: str,
    token: Optional[str] = None
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Fetches real GitHub repository data: branches, commits, PRs, diffs, and metadata.
    Returns (data_dict, error_or_warning_message).
    """
    owner, repo = parse_repo_identifier(repo_identifier)
    if not owner or not repo:
        return None, "Invalid repository format. Please enter 'owner/repo' (e.g. facebook/react) or full GitHub URL."

    headers = get_auth_headers(token)

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
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
                    reset_ts = res.headers.get("x-ratelimit-reset", "")
                    return None, f"GitHub API rate limit exceeded (HTTP 403). Anonymous access allows 60 req/hr. Please supply a GitHub Personal Access Token (PAT) for 5,000 req/hr. (Reset epoch: {reset_ts})"
                return None, "GitHub API access forbidden (HTTP 403). Check repository permissions or provide a Personal Access Token."
            elif res.status_code != 200:
                return None, f"GitHub API error (HTTP {res.status_code}): {res.text[:120]}"

            repo_meta = res.json()
            default_branch = repo_meta.get("default_branch", "main")

            # 2. Fetch branches with pagination
            branches = [default_branch]
            branches_res = await client.get(f"{repo_url}/branches?per_page=30", headers=headers)
            if branches_res.status_code == 200:
                found_branches = [b["name"] for b in branches_res.json()]
                if found_branches:
                    branches = [default_branch] + [b for b in found_branches if b != default_branch]

            # 3. Fetch PRs with pagination
            prs: List[Dict[str, Any]] = []
            prs_res = await client.get(f"{repo_url}/pulls?state=all&per_page=20", headers=headers)
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

            branches_to_fetch = branches[:4] if len(branches) > 1 else [default_branch]
            
            for br in branches_to_fetch:
                commits_res = await client.get(f"{repo_url}/commits?sha={br}&per_page=10", headers=headers)
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

            # Fetch file details & diffs for top commits
            for commit in commits[:8]:
                try:
                    c_detail = await client.get(f"{repo_url}/commits/{commit.sha}", headers=headers)
                    if c_detail.status_code == 200:
                        c_data = c_detail.json()
                        files = [f.get("filename", "") for f in c_data.get("files", []) if f.get("filename")]
                        commit.files_changed = files[:10]
                        patches = [f.get("patch", "") for f in c_data.get("files", []) if f.get("patch")]
                        if patches:
                            commit.diff_snippet = "\n".join(patches[:2])[:1200]
                        stats = c_data.get("stats", {})
                        commit.additions = stats.get("additions", 0)
                        commit.deletions = stats.get("deletions", 0)
                except Exception:
                    pass

            return {
                "name": f"{owner}/{repo}",
                "description": repo_meta.get("description", ""),
                "default_branch": default_branch,
                "stars": repo_meta.get("stargazers_count", 0),
                "forks": repo_meta.get("forks_count", 0),
                "open_issues_count": repo_meta.get("open_issues_count", 0),
                "branches": branches,
                "commits": commits,
                "pull_requests": prs
            }, None

    except httpx.TimeoutException:
        return None, "GitHub API request timed out (15s). GitHub servers may be slow or unresponsive. Please retry."
    except httpx.ConnectError:
        return None, "Network error: Unable to reach https://api.github.com. Please check your network connection."
    except Exception as exc:
        return None, f"GitHub integration error: {str(exc)}"

async def fetch_branch_comparison(
    repo_identifier: str,
    base_branch: str,
    head_branch: str,
    token: Optional[str] = None
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Performs a real branch-to-branch comparison using GitHub's Compare API.
    Determines merge base, changed files, ahead/behind status, and unified diffs.
    """
    owner, repo = parse_repo_identifier(repo_identifier)
    if not owner or not repo:
        return None, "Invalid repository identifier."

    headers = get_auth_headers(token)
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            compare_url = f"https://api.github.com/repos/{owner}/{repo}/compare/{base_branch}...{head_branch}"
            res = await client.get(compare_url, headers=headers)
            if res.status_code != 200:
                return None, f"GitHub Compare API error (HTTP {res.status_code}): {res.text[:120]}"

            data = res.json()
            merge_base = data.get("merge_base_commit", {}).get("sha", "")[:7]
            files_data = []
            for f in data.get("files", []):
                files_data.append({
                    "filename": f.get("filename"),
                    "status": f.get("status"),
                    "additions": f.get("additions", 0),
                    "deletions": f.get("deletions", 0),
                    "changes": f.get("changes", 0),
                    "patch": f.get("patch", "")
                })

            commits_data = []
            for c in data.get("commits", []):
                commits_data.append(CommitInfo(
                    sha=c["sha"][:7],
                    message=c.get("commit", {}).get("message", "").split("\n")[0],
                    author=c.get("commit", {}).get("author", {}).get("name", "Unknown"),
                    timestamp=c.get("commit", {}).get("author", {}).get("date", ""),
                    branch=head_branch,
                    files_changed=[f["filename"] for f in files_data[:5]],
                    diff_snippet=files_data[0]["patch"][:500] if files_data else ""
                ))

            return {
                "base_branch": base_branch,
                "head_branch": head_branch,
                "merge_base_sha": merge_base,
                "status": data.get("status", "diverged"),
                "ahead_by": data.get("ahead_by", 0),
                "behind_by": data.get("behind_by", 0),
                "total_commits": data.get("total_commits", 0),
                "files": files_data,
                "commits": commits_data
            }, None
    except Exception as exc:
        return None, f"Failed to compare branches: {str(exc)}"

async def fetch_file_content(
    repo_identifier: str,
    path: str,
    ref: str = "main",
    token: Optional[str] = None
) -> Tuple[Optional[str], Optional[str]]:
    """
    Fetches actual file contents from GitHub for a given path and git reference (commit/branch).
    """
    owner, repo = parse_repo_identifier(repo_identifier)
    if not owner or not repo:
        return None, "Invalid repository identifier."

    headers = get_auth_headers(token)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            content_url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}?ref={ref}"
            res = await client.get(content_url, headers=headers)
            if res.status_code == 200:
                data = res.json()
                if data.get("encoding") == "base64" and data.get("content"):
                    decoded = base64.b64decode(data["content"]).decode("utf-8", errors="replace")
                    return decoded, None
            # Fallback to raw content URL
            raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{ref}/{path}"
            raw_res = await client.get(raw_url, headers=headers)
            if raw_res.status_code == 200:
                return raw_res.text, None

            return None, f"File {path} not found at ref {ref} (HTTP {res.status_code})"
    except Exception as exc:
        return None, f"Failed to fetch file content: {str(exc)}"
