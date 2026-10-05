"""
GitHub API Client for MergeMind.
Fetches branches, commits, PRs, diffs, file contents, and merge-base from GitHub with rate-limiting resilience.
Includes automatic Git Smart Protocol + Atom feed + commit patch fallbacks when anonymous GitHub REST API limits (60 req/hr) are reached.
Never stores or logs raw tokens.
"""

import os
import re
import base64
import asyncio
import xml.etree.ElementTree as ET
from typing import List, Dict, Any, Optional, Tuple
import httpx
from app.models import CommitInfo

def parse_repo_identifier(repo_input: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Parses 'owner/repo', 'https://github.com/owner/repo', or 'git@github.com:owner/repo.git' into (owner, repo).
    """
    cleaned = repo_input.strip().rstrip("/")
    if "github.com/" in cleaned:
        cleaned = cleaned.split("github.com/")[-1]
    elif "github.com:" in cleaned:
        cleaned = cleaned.split("github.com:")[-1]
    
    cleaned = cleaned.replace(".git", "")
    parts = [p.strip() for p in cleaned.split("/") if p.strip()]
    if len(parts) >= 2:
        return parts[0], parts[1]
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

async def _fetch_branches_via_smart_git(client: httpx.AsyncClient, owner: str, repo: str) -> List[str]:
    """
    Fetches real branch list without GitHub REST API rate limits via Git Smart HTTP Protocol.
    """
    branches: List[str] = []
    smart_url = f"https://github.com/{owner}/{repo}.git/info/refs?service=git-upload-pack"
    try:
        res = await client.get(smart_url, headers={"User-Agent": "git/2.34.1"}, timeout=8.0)
        if res.status_code == 200:
            for line in res.text.splitlines():
                if "refs/heads/" in line:
                    b_name = line.split("refs/heads/")[-1].split("\x00")[0].split()[0].strip()
                    if b_name and b_name not in branches:
                        branches.append(b_name)
    except Exception as exc:
        print(f"[SmartGit] Branch lookup error for {owner}/{repo}: {exc}")
    
    # Ensure default branch priority
    default = "main" if "main" in branches else ("master" if "master" in branches else (branches[0] if branches else "main"))
    if default in branches:
        branches.remove(default)
        branches.insert(0, default)
    elif not branches:
        branches = ["main"]
        
    return branches

async def _fetch_patch_details(client: httpx.AsyncClient, owner: str, repo: str, full_sha: str) -> Tuple[List[str], str, int, int]:
    """
    Fetches raw commit patch from GitHub with zero REST rate limit to get files and diffs.
    """
    files: List[str] = []
    diff_snippet = ""
    additions = 0
    deletions = 0
    patch_url = f"https://github.com/{owner}/{repo}/commit/{full_sha}.patch"
    try:
        res = await client.get(patch_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=6.0)
        if res.status_code == 200:
            patch_text = res.text
            for line in patch_text.splitlines():
                if line.startswith("diff --git a/"):
                    parts = line.split(" b/")
                    if len(parts) >= 2:
                        files.append(parts[1].strip())
                elif line.startswith("+") and not line.startswith("+++"):
                    additions += 1
                elif line.startswith("-") and not line.startswith("---"):
                    deletions += 1
            diff_snippet = patch_text[:1400]
    except Exception:
        pass
    return files[:10], diff_snippet, additions, deletions

async def fetch_resilient_fallback(
    owner: str,
    repo: str
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Zero-rate-limit fallback using Git Smart HTTP Protocol and public Atom streams.
    Succeeds even when GitHub unauthenticated API rate limit (60 req/hr) is completely exhausted on cloud host.
    """
    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
        # 1. Fetch branches via Smart Git
        branches = await _fetch_branches_via_smart_git(client, owner, repo)
        default_branch = branches[0] if branches else "main"

        # 2. Fetch commits via Atom feeds
        commits: List[CommitInfo] = []
        seen_shas = set()
        branches_to_scan = branches[:3] if len(branches) > 1 else [default_branch]

        for br in branches_to_scan:
            atom_url = f"https://github.com/{owner}/{repo}/commits/{br}.atom"
            try:
                res = await client.get(atom_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=6.0)
                if res.status_code == 200:
                    tree = ET.fromstring(res.content)
                    ns = {"atom": "http://www.w3.org/2005/Atom"}
                    for entry in tree.findall("atom:entry", ns)[:6]:
                        raw_id = entry.findtext("atom:id", "", ns)
                        sha = raw_id.split("/")[-1] if "/" in raw_id else raw_id
                        if sha in seen_shas:
                            continue
                        seen_shas.add(sha)
                        title = entry.findtext("atom:title", "", ns).strip()
                        author_el = entry.find("atom:author/atom:name", ns)
                        author = author_el.text if author_el is not None else "Contributor"
                        updated = entry.findtext("atom:updated", "", ns)
                        commits.append(CommitInfo(
                            sha=sha[:7],
                            message=title,
                            author=author,
                            timestamp=updated,
                            branch=br,
                            files_changed=[],
                            diff_snippet="",
                            additions=0,
                            deletions=0
                        ))
            except Exception as e:
                print(f"[AtomFeed] Error for {owner}/{repo} branch {br}: {e}")

        # If branch-specific feeds returned few commits, try default feed
        if len(commits) < 2:
            try:
                def_url = f"https://github.com/{owner}/{repo}/commits.atom"
                res = await client.get(def_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=6.0)
                if res.status_code == 200:
                    tree = ET.fromstring(res.content)
                    ns = {"atom": "http://www.w3.org/2005/Atom"}
                    for entry in tree.findall("atom:entry", ns)[:8]:
                        raw_id = entry.findtext("atom:id", "", ns)
                        sha = raw_id.split("/")[-1] if "/" in raw_id else raw_id
                        if sha in seen_shas:
                            continue
                        seen_shas.add(sha)
                        title = entry.findtext("atom:title", "", ns).strip()
                        author_el = entry.find("atom:author/atom:name", ns)
                        author = author_el.text if author_el is not None else "Contributor"
                        updated = entry.findtext("atom:updated", "", ns)
                        commits.append(CommitInfo(
                            sha=sha[:7],
                            message=title,
                            author=author,
                            timestamp=updated,
                            branch=default_branch,
                            files_changed=[],
                            diff_snippet="",
                            additions=0,
                            deletions=0
                        ))
            except Exception:
                pass

        if not commits:
            return None, f"Could not find commits for '{owner}/{repo}'. Please check repository name or provide a Personal Access Token for private repositories."

        # 3. Concurrently fetch patch diffs for top commits
        patch_tasks = []
        for c in commits[:6]:
            patch_tasks.append(_fetch_patch_details(client, owner, repo, c.sha))

        results = await asyncio.gather(*patch_tasks, return_exceptions=True)
        for i, res_tuple in enumerate(results):
            if isinstance(res_tuple, tuple) and len(res_tuple) == 4:
                files, snippet, add, rm = res_tuple
                commits[i].files_changed = files
                commits[i].diff_snippet = snippet
                commits[i].additions = add
                commits[i].deletions = rm

        return {
            "name": f"{owner}/{repo}",
            "description": f"Live GitHub repository: {owner}/{repo}",
            "default_branch": default_branch,
            "stars": 0,
            "forks": 0,
            "open_issues_count": 0,
            "branches": branches,
            "commits": commits,
            "pull_requests": [],
            "warning_message": "GitHub REST API rate limit reached on host. Ingested live repository data via Git protocol and public commit stream.",
            "rate_limited": True
        }, None

async def fetch_github_repository(
    repo_identifier: str,
    token: Optional[str] = None
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Fetches real GitHub repository data: branches, commits, PRs, diffs, and metadata.
    Attempts REST API first, and automatically falls back to Git Smart Protocol + Atom feed
    when unauthenticated rate limits (403/429) or timeouts occur.
    """
    owner, repo = parse_repo_identifier(repo_identifier)
    if not owner or not repo:
        return None, "Invalid repository format. Please enter 'owner/repo' (e.g. facebook/react) or full GitHub URL."

    headers = get_auth_headers(token)

    try:
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            repo_url = f"https://api.github.com/repos/{owner}/{repo}"
            
            # 1. Fetch repo metadata
            res = await client.get(repo_url, headers=headers)
            
            if res.status_code == 401:
                return None, "GitHub API: Invalid Personal Access Token (HTTP 401 Unauthorized). Please check your token or leave it blank for public repos."
            elif res.status_code == 404:
                # If unauthenticated, could be rate limit or private/not found
                if not headers.get("Authorization"):
                    # Check if smart git sees it
                    fallback_data, fallback_err = await fetch_resilient_fallback(owner, repo)
                    if fallback_data:
                        return fallback_data, None
                return None, f"GitHub API: Repository '{owner}/{repo}' not found (HTTP 404). If private, provide a Personal Access Token with 'repo' scope."
            elif res.status_code in (403, 429):
                print(f"[GitHubClient] REST API rate limit (HTTP {res.status_code}). Triggering resilient fallback for {owner}/{repo}...")
                return await fetch_resilient_fallback(owner, repo)
            elif res.status_code != 200:
                print(f"[GitHubClient] REST API returned HTTP {res.status_code}. Triggering resilient fallback...")
                return await fetch_resilient_fallback(owner, repo)

            repo_meta = res.json()
            default_branch = repo_meta.get("default_branch", "main")

            # 2. Fetch branches
            branches = [default_branch]
            try:
                branches_res = await client.get(f"{repo_url}/branches?per_page=30", headers=headers)
                if branches_res.status_code == 200:
                    found_branches = [b["name"] for b in branches_res.json()]
                    if found_branches:
                        branches = [default_branch] + [b for b in found_branches if b != default_branch]
            except Exception:
                pass

            # 3. Fetch PRs
            prs: List[Dict[str, Any]] = []
            try:
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
            except Exception:
                pass

            # 4. Fetch recent commits across branches
            commits: List[CommitInfo] = []
            shas_seen = set()
            branches_to_fetch = branches[:3] if len(branches) > 1 else [default_branch]
            
            for br in branches_to_fetch:
                try:
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
                except Exception:
                    pass

            # If REST commits failed or rate limited, fallback
            if len(commits) < 2:
                print(f"[GitHubClient] Incomplete commits retrieved via REST. Trying resilient fallback...")
                return await fetch_resilient_fallback(owner, repo)

            # 5. Fetch details & diffs for top commits concurrently
            async def _fetch_single_commit_detail(commit: CommitInfo):
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

            await asyncio.gather(*[_fetch_single_commit_detail(c) for c in commits[:6]], return_exceptions=True)

            return {
                "name": f"{owner}/{repo}",
                "description": repo_meta.get("description", ""),
                "default_branch": default_branch,
                "stars": repo_meta.get("stargazers_count", 0),
                "forks": repo_meta.get("forks_count", 0),
                "open_issues_count": repo_meta.get("open_issues_count", 0),
                "branches": branches,
                "commits": commits,
                "pull_requests": prs,
                "warning_message": None,
                "rate_limited": False
            }, None

    except (httpx.TimeoutException, httpx.ConnectError) as exc:
        print(f"[GitHubClient] REST network/timeout error: {exc}. Trying resilient fallback...")
        return await fetch_resilient_fallback(owner, repo)
    except Exception as exc:
        print(f"[GitHubClient] Unexpected REST error: {exc}. Trying resilient fallback...")
        return await fetch_resilient_fallback(owner, repo)

async def fetch_branch_comparison(
    repo_identifier: str,
    base_branch: str,
    head_branch: str,
    token: Optional[str] = None
) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    """
    Performs branch-to-branch comparison using GitHub's Compare API with patch fallback.
    """
    owner, repo = parse_repo_identifier(repo_identifier)
    if not owner or not repo:
        return None, "Invalid repository identifier."

    headers = get_auth_headers(token)
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            compare_url = f"https://api.github.com/repos/{owner}/{repo}/compare/{base_branch}...{head_branch}"
            res = await client.get(compare_url, headers=headers)
            if res.status_code == 200:
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
            
            # Fallback to compare .patch endpoint
            patch_url = f"https://github.com/{owner}/{repo}/compare/{base_branch}...{head_branch}.patch"
            patch_res = await client.get(patch_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=8.0)
            if patch_res.status_code == 200:
                files_data = []
                current_file = None
                current_patch = []
                for line in patch_res.text.splitlines():
                    if line.startswith("diff --git a/"):
                        if current_file:
                            files_data.append({
                                "filename": current_file,
                                "status": "modified",
                                "additions": 0,
                                "deletions": 0,
                                "changes": 0,
                                "patch": "\n".join(current_patch[:50])
                            })
                        parts = line.split(" b/")
                        current_file = parts[1].strip() if len(parts) >= 2 else "unknown"
                        current_patch = [line]
                    elif current_file:
                        current_patch.append(line)
                if current_file:
                    files_data.append({
                        "filename": current_file,
                        "status": "modified",
                        "additions": 0,
                        "deletions": 0,
                        "changes": 0,
                        "patch": "\n".join(current_patch[:50])
                    })

                return {
                    "base_branch": base_branch,
                    "head_branch": head_branch,
                    "merge_base_sha": "HEAD~BASE",
                    "status": "diverged",
                    "ahead_by": len(files_data),
                    "behind_by": 0,
                    "total_commits": len(files_data),
                    "files": files_data,
                    "commits": []
                }, None

            return None, f"Could not compare branches '{base_branch}' and '{head_branch}'."
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
        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            # 1. Try raw content URL first (fastest, zero rate limit)
            raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{ref}/{path}"
            raw_res = await client.get(raw_url, headers=headers)
            if raw_res.status_code == 200:
                return raw_res.text, None

            # 2. Try contents API
            content_url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}?ref={ref}"
            res = await client.get(content_url, headers=headers)
            if res.status_code == 200:
                data = res.json()
                if data.get("encoding") == "base64" and data.get("content"):
                    decoded = base64.b64decode(data["content"]).decode("utf-8", errors="replace")
                    return decoded, None

            return None, f"File {path} not found at ref {ref}."
    except Exception as exc:
        return None, f"Failed to fetch file content: {str(exc)}"
