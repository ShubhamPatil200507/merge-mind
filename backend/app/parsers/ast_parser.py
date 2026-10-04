"""
MergeMind AST & Normalized Code Parser Engine
Performs syntax-aware analysis on Python, JavaScript, TypeScript, JSON, and YAML.
Uses Python's standard `ast` for Python files, and structural token parsing for JS/TS.
"""

import ast
import json
import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class NormalizedAST(BaseModel):
    filename: str
    functions: List[str] = []
    classes: List[str] = []
    apis: List[str] = []
    imports: List[str] = []
    exports: List[str] = []
    schemas: List[str] = []
    dependencies: List[str] = []
    tests: List[str] = []

class PythonASTParser:
    """Parses real Python source code using python's built-in `ast` module."""

    @staticmethod
    def parse_code(filename: str, code: str) -> NormalizedAST:
        result = NormalizedAST(filename=filename)
        try:
            tree = ast.parse(code, filename=filename)
        except SyntaxError:
            # Code snippet may be partial diff
            return PythonASTParser._fallback_diff_parse(filename, code)

        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                result.functions.append(f"{node.name}()")
                # Detect API route decorators (@app.get, @router.post, etc.)
                for deco in node.decorator_list:
                    if isinstance(deco, ast.Call):
                        func_name = getattr(deco.func, "attr", getattr(deco.func, "id", ""))
                        if func_name in ["get", "post", "put", "delete", "patch"]:
                            if deco.args and isinstance(deco.args[0], ast.Constant):
                                result.apis.append(f"{func_name.upper()} {deco.args[0].value}")
            elif isinstance(node, ast.ClassDef):
                result.classes.append(node.name)
                # Check for BaseModel / Schema inheritance
                for base in node.bases:
                    base_id = getattr(base, "id", getattr(base, "attr", ""))
                    if "model" in base_id.lower() or "schema" in base_id.lower():
                        result.schemas.append(node.name)
            elif isinstance(node, ast.Import):
                for alias in node.names:
                    result.imports.append(alias.name)
            elif isinstance(node, ast.ImportFrom):
                mod = node.module or ""
                for alias in node.names:
                    result.imports.append(f"{mod}.{alias.name}")

        if "test" in filename.lower():
            result.tests.append(filename)

        return result

    @staticmethod
    def _fallback_diff_parse(filename: str, diff_text: str) -> NormalizedAST:
        result = NormalizedAST(filename=filename)
        # Regex on diff hunks
        funcs = re.findall(r"^[+]?\s*def\s+([a-zA-Z0-9_]+)\s*\(", diff_text, re.MULTILINE)
        result.functions = [f"{f}()" for f in funcs]
        classes = re.findall(r"^[+]?\s*class\s+([a-zA-Z0-9_]+)", diff_text, re.MULTILINE)
        result.classes = classes
        imports = re.findall(r"^[+]?\s*(?:import\s+([a-zA-Z0-9_., ]+)|from\s+([a-zA-Z0-9_.]+)\s+import)", diff_text, re.MULTILINE)
        for i1, i2 in imports:
            result.imports.append(i1 or i2)
        return result

class JSTSASTParser:
    """Parses JavaScript and TypeScript code for functions, classes, API routes, and middleware."""

    @staticmethod
    def parse_code(filename: str, code: str) -> NormalizedAST:
        result = NormalizedAST(filename=filename)

        # 1. Functions & Methods
        # function foo()
        f1 = re.findall(r"(?:function\s+([a-zA-Z0-9_$]+)\s*\()", code)
        # const foo = (...) => or const foo = async (...) =>
        f2 = re.findall(r"(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>", code)
        # foo: async (...) =>
        f3 = re.findall(r"([a-zA-Z0-9_$]+)\s*:\s*(?:async\s*)?\([^)]*\)\s*=>", code)
        # method() {
        f4 = re.findall(r"(?:async\s+)?([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*\{", code)
        
        all_funcs = set(f1 + f2 + f3)
        # Filter common keywords
        keywords = {"if", "for", "while", "switch", "catch", "import", "export", "return"}
        for f in f4:
            if f not in keywords and len(f) > 2:
                all_funcs.add(f)
        result.functions = [f"{fn}()" for fn in all_funcs]

        # 2. Classes
        classes = re.findall(r"class\s+([a-zA-Z0-9_$]+)", code)
        result.classes = list(set(classes))

        # 3. API Routes & Middleware Registration
        # app.get('/v1/users', ...), router.post(...)
        route_matches = re.findall(r"(?:app|router)\.(get|post|put|delete|patch|use)\s*\(\s*['\"]([^'\"]+)['\"]", code)
        for method, path in route_matches:
            if method.lower() == "use":
                result.apis.append(f"USE {path}")
            else:
                result.apis.append(f"{method.upper()} {path}")

        # 4. Imports & Exports
        imports = re.findall(r"(?:import\s+(?:\{[^}]*\}|[a-zA-Z0-9_$, ]+)\s+from\s+['\"]([^'\"]+)['\"]|require\(['\"]([^'\"]+)['\"]\))", code)
        for i1, i2 in imports:
            result.imports.append(i1 or i2)

        exports = re.findall(r"export\s+(?:default\s+)?(?:class|function|const|let|var)?\s*([a-zA-Z0-9_$]+)", code)
        result.exports = list(set(exports))

        # 5. Schema / Prisma / Mongoose / Type definitions
        if "prisma" in filename.lower() or "schema" in filename.lower() or "model" in filename.lower():
            schema_models = re.findall(r"model\s+([a-zA-Z0-9_]+)", code)
            result.schemas = list(set(schema_models)) or [filename]
        type_defs = re.findall(r"(?:type|interface)\s+([a-zA-Z0-9_$]+)", code)
        if type_defs:
            result.schemas.extend(type_defs[:5])

        # 6. Tests
        if any(keyword in filename.lower() for keyword in ["test", "spec", "__tests__"]):
            result.tests.append(filename)

        return result

class ConfigDepParser:
    """Parses package manifests (package.json, requirements.txt, pyproject.toml) and configs."""

    @staticmethod
    def parse_package_json(filename: str, content: str) -> NormalizedAST:
        result = NormalizedAST(filename=filename)
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
            # Fallback regex
            matches = re.findall(r"['\"]([@a-zA-Z0-9_/-]+)['\"]\s*:\s*['\"]([^'\"]+)['\"]", content)
            for pkg, ver in matches:
                result.dependencies.append(f"{pkg}@{ver}")
        return result

    @staticmethod
    def parse_requirements_txt(filename: str, content: str) -> NormalizedAST:
        result = NormalizedAST(filename=filename)
        for line in content.splitlines():
            line = line.strip()
            if line and not line.startswith("#"):
                result.dependencies.append(line)
        return result

def parse_source_file(filename: str, content: str) -> NormalizedAST:
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
        # Default text/config parser
        res = NormalizedAST(filename=filename)
        if "test" in fn_lower or "spec" in fn_lower:
            res.tests.append(filename)
        return res
