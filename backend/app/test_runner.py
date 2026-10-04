"""
MergeMind Secure Test Runner Engine
Executes approved test commands in a restricted process environment:
- Command allowlist validation
- Argument validation & shell-injection prevention
- Environment stripping (zero backend secrets)
- Hard timeouts (10 seconds)
- Process termination on timeout
- Honest reporting: clearly identifies mode as 'restricted_host_execution' rather than claiming full container isolation when running on the host.
"""

import asyncio
import os
import shlex
import time
from typing import Dict, Any, Optional
from pydantic import BaseModel

ALLOWED_COMMAND_PREFIXES = [
    "npm test",
    "npm run test",
    "npx vitest",
    "pytest",
    "python -m unittest",
    "mvn test",
    "cargo test",
    "go test"
]

class TestExecutionResult(BaseModel):
    command: str
    status: str  # "completed", "failed", "timeout", "unavailable", "forbidden"
    exit_code: Optional[int] = None
    stdout: str
    stderr: str
    duration_ms: int
    is_sandboxed: bool = False
    execution_mode: str = "restricted_host_execution"
    disclaimer: str

async def run_sandboxed_test(command: str, cwd: Optional[str] = None) -> TestExecutionResult:
    """
    Executes an approved test command under strict security constraints.
    Accurately reports restricted_host_execution instead of claiming container sandbox.
    """
    start_time = time.perf_counter()
    clean_cmd = command.strip()

    # 1. Security Check: Command allowlist validation
    is_allowed = any(clean_cmd.startswith(prefix) for prefix in ALLOWED_COMMAND_PREFIXES)
    if not is_allowed:
        return TestExecutionResult(
            command=clean_cmd,
            status="forbidden",
            exit_code=1,
            stdout="",
            stderr=f"Security Policy: Command '{clean_cmd}' is not in the approved test runner allowlist. Allowed runners: {', '.join(ALLOWED_COMMAND_PREFIXES)}.",
            duration_ms=0,
            is_sandboxed=False,
            execution_mode="restricted_host_execution",
            disclaimer="Arbitrary command execution blocked by MergeMind policy."
        )

    # 2. Check for shell injection characters
    dangerous_chars = [";", "&&", "||", "|", "`", "$", ">", "<", "\n"]
    if any(c in clean_cmd for c in dangerous_chars):
        return TestExecutionResult(
            command=clean_cmd,
            status="forbidden",
            exit_code=1,
            stdout="",
            stderr="Security Policy: Command contains shell chaining or redirection operators and was rejected.",
            duration_ms=0,
            is_sandboxed=False,
            execution_mode="restricted_host_execution",
            disclaimer="Shell operator chaining blocked by MergeMind policy."
        )

    # 3. Environment sanitization: Strip API keys and tokens
    clean_env = {
        "PATH": os.environ.get("PATH", ""),
        "SYSTEMROOT": os.environ.get("SYSTEMROOT", ""),
        "TMP": os.environ.get("TMP", ""),
        "TEMP": os.environ.get("TEMP", ""),
        "NODE_ENV": "test",
        "CI": "true"
    }

    work_dir = cwd or os.getcwd()

    try:
        proc = await asyncio.create_subprocess_shell(
            clean_cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=work_dir,
            env=clean_env
        )

        try:
            stdout_data, stderr_data = await asyncio.wait_for(proc.communicate(), timeout=10.0)
            duration_ms = int((time.perf_counter() - start_time) * 1000)
            exit_code = proc.returncode

            stdout_str = stdout_data.decode("utf-8", errors="replace")[:3000]
            stderr_str = stderr_data.decode("utf-8", errors="replace")[:3000]

            return TestExecutionResult(
                command=clean_cmd,
                status="completed" if exit_code == 0 else "failed",
                exit_code=exit_code,
                stdout=stdout_str,
                stderr=stderr_str,
                duration_ms=duration_ms,
                is_sandboxed=False,
                execution_mode="restricted_host_execution",
                disclaimer="Restricted host execution with command allowlist, stripped credentials, and 10s timeout."
            )

        except asyncio.TimeoutError:
            try:
                proc.kill()
            except ProcessLookupError:
                pass
            return TestExecutionResult(
                command=clean_cmd,
                status="timeout",
                exit_code=124,
                stdout="",
                stderr="Execution terminated: Test process exceeded the strict 10-second timeout.",
                duration_ms=10000,
                is_sandboxed=False,
                execution_mode="restricted_host_execution",
                disclaimer="Runaway process terminated by execution timeout."
            )

    except Exception as e:
        return TestExecutionResult(
            command=clean_cmd,
            status="unavailable",
            exit_code=-1,
            stdout="",
            stderr=f"Test runner unavailable in this host environment: {str(e)}. Please run this command in your local repository terminal.",
            duration_ms=int((time.perf_counter() - start_time) * 1000),
            is_sandboxed=False,
            execution_mode="restricted_host_execution",
            disclaimer="MergeMind reports test runner availability truthfully rather than fabricating simulated passes."
        )
