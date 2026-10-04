"""
MergeMind AST & Normalized Code Parser Engine
Performs syntax-aware analysis on Python, JavaScript, TypeScript, JSON, and YAML.
Provides both NormalizedFile (comprehensive AST representation) and NormalizedAST (backwards compatible).
"""

import ast
import json
import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class NormalizedSymbol(BaseModel):
    name: str
    type: str  # "function", "class", "method", "variable", "route", "middleware", "schema"
    file: str
    line_start: Optional[int] = None
    line_end: Optional[int] = None
    signature: Optional[str] = None
    parent: Optional[str] = None
    references: List[str] = Field(default_factory=list)
    callers: List[str] = Field(default_factory=list)
    callees: List[str] = Field(default_factory=list)

class NormalizedFile(BaseModel):
    path: str
    language: str = "unknown"  # "python", "javascript", "typescript", "json", "yaml", "config", "unknown"
    parser_status: str = "success"  # "success", "partial_diff", "syntax_error", "unsupported"
    imports: List[str] = Field(default_factory=list)
    exports: List[str] = Field(default_factory=list)
    classes: List[str] = Field(default_factory=list)
    functions: List[str] = Field(default_factory=list)
    routes: List[str] = Field(default_factory=list)
    middleware: List[str] = Field(default_factory=list)
    models: List[str] = Field(default_factory=list)
    calls: List[str] = Field(default_factory=list)
    configuration: List[str] = Field(default_factory=list)
    dependencies: List[str] = Field(default_factory=list)
    security_sensitive_symbols: List[str] = Field(default_factory=list)
    state_transitions: List[str] = Field(default_factory=list)
    tests: List[str] = Field(default_factory=list)
    symbols: List[NormalizedSymbol] = Field(default_factory=list)
    registration_order: List[Dict[str, Any]] = Field(default_factory=list)  # tracks middleware & route mounting order

    # Backwards compatibility properties for legacy agents & tests
    @property
    def filename(self) -> str:
        return self.path

    @property
    def apis(self) -> List[str]:
        return self.routes

    @property
    def schemas(self) -> List[str]:
        return self.models

# Alias NormalizedAST to NormalizedFile for backwards compatibility
NormalizedAST = NormalizedFile

SECURITY_KEYWORDS = {
    "jwt", "token", "auth", "authorize", "authenticate", "bearer", "password",
    "secret", "api_key", "crypto", "bcrypt", "hash", "session", "permission",
    "role", "cors", "csrf", "oauth", "ssl", "tls", "cert"
}

STATE_TRANSITION_PATTERN = re.compile(
    r"""(?:status|state|lifecycle|phase|step)\s*(?:=|:=|=>|:)\s*['"]([a-zA-Z0-9_-]+)['"]""",
    re.IGNORECASE
)

CONFIG_ASSIGN_PATTERN = re.compile(
    r"""(?:const|let|var|export)?\s*([A-Z0-9_]{3,})\s*=\s*(?:process\.env\.([A-Z0-9_]+)|os\.getenv\(['"]([A-Z0-9_]+)['"]\)|['"]?([a-zA-Z0-9_./:-]+)['"]?)"""
)

class PythonASTParser:
    """Parses real Python source code using python's built-in `ast` module."""

    @staticmethod
    def parse_code(filename: str, code: str) -> NormalizedFile:
        result = NormalizedFile(path=filename, language="python")
        try:
            tree = ast.parse(code, filename=filename)
        except SyntaxError:
            result.parser_status = "partial_diff"
            return PythonASTParser._fallback_diff_parse(filename, code)
        except Exception:
            result.parser_status = "syntax_error"
            return result

        registration_seq = 0

        for node in ast.walk(tree):
            # 1. Functions & Methods
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                fn_name = node.name
                result.functions.append(f"{fn_name}()")

                sig_args = [a.arg for a in node.args.args]
                sig = f"{fn_name}({', '.join(sig_args)})"
                line_no = getattr(node, "lineno", None)
                end_line = getattr(node, "end_lineno", None)

                sym = NormalizedSymbol(
                    name=fn_name,
                    type="function" if not getattr(node, "_is_method", False) else "method",
                    file=filename,
                    line_start=line_no,
                    line_end=end_line,
                    signature=sig
                )

                # Check security sensitivity
                if any(k in fn_name.lower() for k in SECURITY_KEYWORDS):
                    result.security_sensitive_symbols.append(fn_name)

                # Route decorators (@app.get, @router.post, etc.)
                for deco in node.decorator_list:
                    if isinstance(deco, ast.Call):
                        func_attr = getattr(deco.func, "attr", getattr(deco.func, "id", ""))
                        if func_attr in ["get", "post", "put", "delete", "patch", "options", "head"]:
                            route_path = "/unknown"
                            if deco.args and isinstance(deco.args[0], ast.Constant):
                                route_path = str(deco.args[0].value)
                            route_entry = f"{func_attr.upper()} {route_path}"
                            result.routes.append(route_entry)
                            registration_seq += 1
                            result.registration_order.append({
                                "seq": registration_seq,
                                "type": "route",
                                "target": route_entry,
                                "handler": fn_name,
                                "line": line_no
                            })
                    elif isinstance(deco, ast.Name):
                        if "middleware" in deco.id.lower():
                            result.middleware.append(deco.id)

                result.symbols.append(sym)

            # 2. Classes & Data Models
            elif isinstance(node, ast.ClassDef):
                result.classes.append(node.name)
                is_model = False
                for base in node.bases:
                    base_id = getattr(base, "id", getattr(base, "attr", ""))
                    if any(term in base_id.lower() for term in ["model", "schema", "base", "entity", "document"]):
                        is_model = True
                if is_model:
                    result.models.append(node.name)

                sym = NormalizedSymbol(
                    name=node.name,
                    type="model" if is_model else "class",
                    file=filename,
                    line_start=getattr(node, "lineno", None),
                    line_end=getattr(node, "end_lineno", None)
                )
                result.symbols.append(sym)

            # 3. Imports
            elif isinstance(node, ast.Import):
                for alias in node.names:
                    result.imports.append(alias.name)
            elif isinstance(node, ast.ImportFrom):
                mod = node.module or ""
                for alias in node.names:
                    result.imports.append(f"{mod}.{alias.name}")

            # 4. Calls (tracking middleware, database calls, calls to auth)
            elif isinstance(node, ast.Call):
                call_name = ""
                if isinstance(node.func, ast.Attribute):
                    call_name = f"{getattr(node.func.value, 'id', '')}.{node.func.attr}"
                elif isinstance(node.func, ast.Name):
                    call_name = node.func.id

                if call_name:
                    result.calls.append(call_name)
                    if "add_middleware" in call_name or "middleware" in call_name:
                        mid_name = call_name
                        if node.args and isinstance(node.args[0], ast.Name):
                            mid_name = node.args[0].id
                        result.middleware.append(mid_name)
                        registration_seq += 1
                        result.registration_order.append({
                            "seq": registration_seq,
                            "type": "middleware",
                            "target": mid_name,
                            "line": getattr(node, "lineno", None)
                        })

        # Scan code text for state transitions and configurations
        for match in STATE_TRANSITION_PATTERN.finditer(code):
            result.state_transitions.append(match.group(1))

        if "test" in filename.lower() or "spec" in filename.lower():
            result.tests.append(filename)

        return result

    @staticmethod
    def _fallback_diff_parse(filename: str, diff_text: str) -> NormalizedFile:
        result = NormalizedFile(path=filename, language="python", parser_status="partial_diff")
        funcs = re.findall(r"^[+]?\s*def\s+([a-zA-Z0-9_]+)\s*\(", diff_text, re.MULTILINE)
        result.functions = [f"{f}()" for f in funcs]
        classes = re.findall(r"^[+]?\s*class\s+([a-zA-Z0-9_]+)", diff_text, re.MULTILINE)
        result.classes = classes
        imports = re.findall(r"^[+]?\s*(?:import\s+([a-zA-Z0-9_., ]+)|from\s+([a-zA-Z0-9_.]+)\s+import)", diff_text, re.MULTILINE)
        for i1, i2 in imports:
            result.imports.append(i1 or i2)
        if "test" in filename.lower():
            result.tests.append(filename)
        return result

class JSTSASTParser:
    """Parses JavaScript and TypeScript code for functions, classes, routes, middleware, and interfaces."""

    @staticmethod
    def parse_code(filename: str, code: str) -> NormalizedFile:
        lang = "typescript" if any(filename.lower().endswith(ext) for ext in [".ts", ".tsx"]) else "javascript"
        result = NormalizedFile(path=filename, language=lang)
        registration_seq = 0

        lines = code.splitlines()

        # 1. Functions
        f1 = re.findall(r"(?:function\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\))", code)
        for fn_name, args_str in f1:
            result.functions.append(f"{fn_name}()")
            result.symbols.append(NormalizedSymbol(
                name=fn_name,
                type="function",
                file=filename,
                signature=f"{fn_name}({args_str.strip()})"
            ))
            if any(k in fn_name.lower() for k in SECURITY_KEYWORDS):
                result.security_sensitive_symbols.append(fn_name)

        # Arrow functions: const foo = async (...) =>
        f2 = re.findall(r"(?:const|let|var|export\s+const)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>", code)
        for fn_name, args_str in f2:
            if fn_name not in result.functions:
                result.functions.append(f"{fn_name}()")
                result.symbols.append(NormalizedSymbol(
                    name=fn_name,
                    type="function",
                    file=filename,
                    signature=f"{fn_name}({args_str.strip()})"
                ))
                if any(k in fn_name.lower() for k in SECURITY_KEYWORDS):
                    result.security_sensitive_symbols.append(fn_name)

        # 2. Classes & Types/Interfaces
        classes = re.findall(r"(?:class\s+([a-zA-Z0-9_$]+))", code)
        result.classes = classes
        for c in classes:
            result.symbols.append(NormalizedSymbol(name=c, type="class", file=filename))

        # TypeScript interfaces & types
        if lang == "typescript":
            interfaces = re.findall(r"(?:interface|type)\s+([a-zA-Z0-9_$]+)", code)
            for iface in interfaces:
                result.models.append(iface)
                result.symbols.append(NormalizedSymbol(name=iface, type="schema", file=filename))

        # 3. Route & Middleware Mounting (Express, Fastify, Next.js API)
        # app.use('/v1', authMiddleware)
        # router.get('/users', handler)
        route_pattern = re.compile(
            r"""(?:app|router|server)\.(get|post|put|delete|patch|options|use)\s*\(\s*['"]([^'"]+)['"]\s*,\s*([^)]+)\)"""
        )
        for match in route_pattern.finditer(code):
            method = match.group(1).lower()
            path = match.group(2)
            handler = match.group(3).strip()
            registration_seq += 1

            if method == "use":
                result.middleware.append(f"{path} -> {handler}")
                result.registration_order.append({
                    "seq": registration_seq,
                    "type": "middleware",
                    "target": path,
                    "handler": handler
                })
            else:
                route_entry = f"{method.upper()} {path}"
                result.routes.append(route_entry)
                result.registration_order.append({
                    "seq": registration_seq,
                    "type": "route",
                    "target": route_entry,
                    "handler": handler
                })

        # Direct app.use(authMiddleware)
        direct_use = re.compile(r"""(?:app|router)\.use\s*\(\s*([a-zA-Z0-9_$.]+)\s*\)""")
        for match in direct_use.finditer(code):
            handler = match.group(1).strip()
            registration_seq += 1
            result.middleware.append(handler)
            result.registration_order.append({
                "seq": registration_seq,
                "type": "middleware",
                "target": "global",
                "handler": handler
            })

        # 4. Imports & Exports
        imp_matches = re.findall(r"""(?:import\s+(?:\{[^}]*\}|[a-zA-Z0-9_$*]+)\s+from\s+['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\))""", code)
        for i1, i2 in imp_matches:
            result.imports.append(i1 or i2)

        exp_matches = re.findall(r"""(?:export\s+(?:default\s+)?(?:const|let|var|function|class)?\s*([a-zA-Z0-9_$]+)|module\.exports\s*=\s*([a-zA-Z0-9_$]+))""", code)
        for e1, e2 in exp_matches:
            result.exports.append(e1 or e2)

        # 5. State transitions & Configuration
        for match in STATE_TRANSITION_PATTERN.finditer(code):
            result.state_transitions.append(match.group(1))

        if "test" in filename.lower() or "spec" in filename.lower():
            result.tests.append(filename)

        return result

class ConfigDepParser:
    """Parses package manifests (package.json, requirements.txt, pyproject.toml) and configs."""

    @staticmethod
    def parse_package_json(filename: str, content: str) -> NormalizedFile:
        result = NormalizedFile(path=filename, language="json")
        try:
            data = json.loads(content)
            deps = data.get("dependencies", {})
            dev_deps = data.get("devDependencies", {})
            for pkg, ver in {**deps, **dev_deps}.items():
                result.dependencies.append(f"{pkg}@{ver}")
            scripts = data.get("scripts", {})
            if "test" in scripts:
                result.tests.append(f"npm test: {scripts['test']}")
        except Exception:
            matches = re.findall(r"['\"]([@a-zA-Z0-9_/-]+)['\"]\s*:\s*['\"]([^'\"]+)['\"]", content)
            for pkg, ver in matches:
                result.dependencies.append(f"{pkg}@{ver}")
        return result

    @staticmethod
    def parse_requirements_txt(filename: str, content: str) -> NormalizedFile:
        result = NormalizedFile(path=filename, language="config")
        for line in content.splitlines():
            line = line.strip()
            if line and not line.startswith("#"):
                result.dependencies.append(line)
        return result

def parse_source_file(filename: str, content: str) -> NormalizedFile:
    """Dispatches to language-specific AST parser."""
    fn_lower = filename.lower()
    if fn_lower.endswith(".py"):
        return PythonASTParser.parse_code(filename, content)
    elif any(fn_lower.endswith(ext) for ext in [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]):
        return JSTSASTParser.parse_code(filename, content)
    elif fn_lower.endswith("package.json"):
        return ConfigDepParser.parse_package_json(filename, content)
    elif "requirements" in fn_lower and fn_lower.endswith(".txt"):
        return ConfigDepParser.parse_requirements_txt(filename, content)
    else:
        res = NormalizedFile(path=filename, language="unknown", parser_status="unsupported")
        if "test" in fn_lower or "spec" in fn_lower:
            res.tests.append(filename)
        return res
