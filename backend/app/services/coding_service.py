import asyncio
import base64
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from typing import List, Optional, Dict, Any
from urllib.parse import urlparse
import httpx

from app.core.config import settings
from app.schemas.coding import (
    CodeExecutionResponse,
    CodingLanguage,
    CodingProblem,
    CodingProblemExample,
    CodeSubmitResponse,
    TestCaseResult,
)
from app.services.problem_repository import (
    ALL_PROBLEMS,
    TOPIC_CATEGORIES,
    get_all_problems,
    get_problem_by_id,
    filter_problems,
    get_all_topics,
)

# Standard Judge0 CE language identifiers
SUPPORTED_LANGUAGES: List[CodingLanguage] = [
    CodingLanguage(
        id=71,
        name="Python (3.8.1)",
        key="python",
        version="3.8.1",
        starter_template=(
            "def solution():\n"
            "    # Read input and implement solution\n"
            "    import sys\n"
            "    input_data = sys.stdin.read().strip()\n"
            "    print(f\"Output: {input_data}\")\n\n"
            "if __name__ == '__main__':\n"
            "    solution()\n"
        ),
    ),
    CodingLanguage(
        id=63,
        name="JavaScript (Node.js 12.14.0)",
        key="javascript",
        version="12.14.0",
        starter_template=(
            "const fs = require('fs');\n\n"
            "function solution() {\n"
            "    const input = fs.readFileSync(0, 'utf-8').trim();\n"
            "    console.log(`Output: ${input}`);\n"
            "}\n\n"
            "solution();\n"
        ),
    ),
    CodingLanguage(
        id=74,
        name="TypeScript (3.7.4)",
        key="typescript",
        version="3.7.4",
        starter_template=(
            "import * as fs from 'fs';\n\n"
            "function solution(): void {\n"
            "    const input: string = fs.readFileSync(0, 'utf-8').trim();\n"
            "    console.log(`Output: ${input}`);\n"
            "}\n\n"
            "solution();\n"
        ),
    ),
    CodingLanguage(
        id=54,
        name="C++ (GCC 9.2.0)",
        key="cpp",
        version="GCC 9.2.0",
        starter_template=(
            "#include <iostream>\n"
            "#include <string>\n\n"
            "int main() {\n"
            "    std::string input;\n"
            "    if (std::cin >> input) {\n"
            "        std::cout << \"Output: \" << input << std::endl;\n"
            "    }\n"
            "    return 0;\n"
            "}\n"
        ),
    ),
    CodingLanguage(
        id=62,
        name="Java (OpenJDK 13.0.1)",
        key="java",
        version="13.0.1",
        starter_template=(
            "import java.util.Scanner;\n\n"
            "public class Main {\n"
            "    public static void main(String[] args) {\n"
            "        Scanner scanner = new Scanner(System.in);\n"
            "        if (scanner.hasNextLine()) {\n"
            "            String line = scanner.nextLine();\n"
            "            System.out.println(\"Output: \" + line);\n"
            "        }\n"
            "    }\n"
            "}\n"
        ),
    ),
]

SUPPORTED_LANGUAGE_IDS = {lang.id for lang in SUPPORTED_LANGUAGES}

# Curated original practice coding problems catalogue from problem_repository
SAMPLE_CODING_PROBLEMS: List[CodingProblem] = ALL_PROBLEMS



def get_service_status() -> Dict[str, Any]:
    """Inspects whether Judge0 or the local code execution sandbox is active."""
    has_key = bool(settings.JUDGE0_API_KEY and settings.JUDGE0_API_KEY.strip())
    enable_local = getattr(settings, "ENABLE_LOCAL_CODE_RUNNER", True)
    if has_key:
        return {
            "is_configured": True,
            "api_url": settings.JUDGE0_API_URL,
            "status": "ready",
            "message": "Judge0 API endpoint configured and ready for live code execution.",
        }
    elif enable_local:
        return {
            "is_configured": True,
            "api_url": "local://embedded-runner",
            "status": "ready",
            "message": "CareerNova AI Local Code Runner active (Python, C++, Java, JavaScript, TypeScript).",
        }
    return {
        "is_configured": False,
        "api_url": settings.JUDGE0_API_URL,
        "status": "unconfigured",
        "message": "Judge0 API key is unconfigured. Remote sandboxed code execution requires JUDGE0_API_KEY in backend/.env.",
    }


def _safe_decode(val: Optional[str]) -> Optional[str]:
    """Safely decodes potentially base64-encoded output from Judge0."""
    if not val:
        return val
    try:
        # Check if Judge0 returned a base64 encoded string
        decoded = base64.b64decode(val).decode("utf-8")
        return decoded
    except Exception:
        return val


async def execute_code(
    source_code: str,
    language_id: int,
    stdin: Optional[str] = "",
) -> CodeExecutionResponse:
    """
    Executes user source code via Judge0 remote sandbox or embedded host sandbox.
    """
    # 1. Validation: language ID
    if language_id not in SUPPORTED_LANGUAGE_IDS:
        return CodeExecutionResponse(
            status="error",
            message=f"Unsupported language ID: {language_id}. Supported IDs are: {sorted(list(SUPPORTED_LANGUAGE_IDS))}",
        )

    # 2. Validation: length bounds
    if len(source_code.encode("utf-8")) > 65536:
        return CodeExecutionResponse(
            status="error",
            message="Source code size exceeds maximum allowable limit of 64KB.",
        )
    if stdin and len(stdin.encode("utf-8")) > 16384:
        return CodeExecutionResponse(
            status="error",
            message="Standard input size exceeds maximum allowable limit of 16KB.",
        )

    # 3. Check configuration readiness
    api_key = settings.JUDGE0_API_KEY.strip() if settings.JUDGE0_API_KEY else ""
    enable_local = getattr(settings, "ENABLE_LOCAL_CODE_RUNNER", True)

    if not api_key:
        if enable_local:
            return await execute_code_locally(source_code, language_id, stdin)
        return CodeExecutionResponse(
            status="configuration_missing",
            message=(
                "Judge0 API key is not configured in backend settings. "
                "To execute code in a remote sandbox, set JUDGE0_API_KEY in backend/.env. "
                "Local execution is disabled to prevent security vulnerabilities."
            ),
        )

    # 4. Prepare remote request to Judge0
    parsed_url = urlparse(settings.JUDGE0_API_URL)
    is_rapidapi = "rapidapi.com" in parsed_url.netloc.lower()

    endpoint = f"{settings.JUDGE0_API_URL.rstrip('/')}/submissions?base64_encoded=false&wait=true"

    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    if is_rapidapi:
        headers["X-RapidAPI-Key"] = api_key
        headers["X-RapidAPI-Host"] = parsed_url.netloc
    else:
        headers["X-Auth-Token"] = api_key

    payload = {
        "source_code": source_code,
        "language_id": language_id,
        "stdin": stdin or "",
        "cpu_time_limit": 5,
        "memory_limit": 128000,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(endpoint, json=payload, headers=headers)

            if resp.status_code in (401, 403):
                return CodeExecutionResponse(
                    status="service_unavailable",
                    message="Judge0 authentication failed. The provided API key is invalid or unauthorized.",
                )
            elif resp.status_code == 429:
                return CodeExecutionResponse(
                    status="service_unavailable",
                    message="Judge0 rate limit exceeded. Please wait a moment before resubmitting.",
                )
            elif resp.status_code >= 500:
                return CodeExecutionResponse(
                    status="service_unavailable",
                    message=f"Judge0 remote service error (HTTP {resp.status_code}). Remote sandbox is currently unavailable.",
                )
            elif resp.status_code not in (200, 201):
                return CodeExecutionResponse(
                    status="error",
                    message=f"Judge0 submission returned unexpected HTTP {resp.status_code}.",
                )

            data = resp.json()

            # Parse Judge0 standard response fields
            judge0_status = data.get("status", {})
            status_desc = judge0_status.get("description", "Unknown Status")
            status_id = judge0_status.get("id", 0)

            stdout = data.get("stdout")
            stderr = data.get("stderr")
            compile_output = data.get("compile_output")
            time_sec = float(data["time"]) if data.get("time") is not None else None
            memory_kb = int(data["memory"]) if data.get("memory") is not None else None
            exit_code = data.get("exit_code")

            # Determine normalized completion status
            # Status IDs: 1 (In Queue), 2 (Processing), 3 (Accepted), 4 (Wrong Answer), 5 (Time Limit Exceeded), 6 (Compilation Error), 7-12 (Runtime Errors)
            if status_id in (1, 2):
                normalized_status = "in_progress"
            elif status_id == 6:
                normalized_status = "compilation_error"
            elif status_id == 5:
                normalized_status = "time_limit_exceeded"
            elif status_id >= 7:
                normalized_status = "runtime_error"
            else:
                normalized_status = "completed"

            time_ms = round(time_sec * 1000, 1) if time_sec is not None else None

            return CodeExecutionResponse(
                status=normalized_status,
                judge0_status=status_desc,
                stdout=stdout,
                stderr=stderr,
                compile_output=compile_output,
                execution_time_seconds=time_sec,
                time_ms=time_ms,
                memory_kb=memory_kb,
                exit_code=exit_code,
                message=f"Execution finished: {status_desc}",
                token=data.get("token"),
            )

    except httpx.TimeoutException:
        return CodeExecutionResponse(
            status="service_unavailable",
            message="Remote code execution timed out while communicating with Judge0 sandbox.",
        )
    except Exception as exc:
        # Avoid leaking internal network details or stack trace
        return CodeExecutionResponse(
            status="error",
            message=f"Communication error with code execution engine: {type(exc).__name__}",
        )


async def execute_code_locally(
    source_code: str,
    language_id: int,
    stdin: Optional[str] = "",
) -> CodeExecutionResponse:
    """Runs user source code in an isolated local subprocess asynchronously."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(
        None,
        _sync_execute_code_locally,
        source_code,
        language_id,
        stdin,
    )


def _sync_execute_code_locally(
    source_code: str,
    language_id: int,
    stdin: Optional[str] = "",
) -> CodeExecutionResponse:
    """Executes code via local toolchains (Python, C++ GCC, Java javac, Node.js)."""
    start_time = time.perf_counter()
    timeout_sec = 5.0
    temp_dir = tempfile.mkdtemp(prefix="careernova_run_")

    try:
        if language_id == 71:  # Python
            file_path = os.path.join(temp_dir, "solution.py")
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(source_code)
            cmd = [sys.executable, file_path]

        elif language_id == 63:  # JavaScript (Node.js)
            file_path = os.path.join(temp_dir, "solution.js")
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(source_code)
            cmd = ["node", file_path]

        elif language_id == 74:  # TypeScript
            file_path = os.path.join(temp_dir, "solution.ts")
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(source_code)
            cmd = ["node", "--experimental-strip-types", file_path]

        elif language_id == 54:  # C++ (GCC)
            cpp_file = os.path.join(temp_dir, "solution.cpp")
            exe_file = os.path.join(temp_dir, "solution.exe" if os.name == "nt" else "solution")
            with open(cpp_file, "w", encoding="utf-8") as f:
                f.write(source_code)

            compile_proc = subprocess.run(
                ["g++", "-O2", "-std=c++14", cpp_file, "-o", exe_file],
                capture_output=True,
                text=True,
                timeout=10.0,
            )
            if compile_proc.returncode != 0:
                elapsed = time.perf_counter() - start_time
                return CodeExecutionResponse(
                    status="compilation_error",
                    judge0_status="Compilation Error",
                    compile_output=compile_proc.stderr or compile_proc.stdout,
                    execution_time_seconds=round(elapsed, 3),
                    time_ms=round(elapsed * 1000, 1),
                    exit_code=compile_proc.returncode,
                    message="C++ compilation failed with errors.",
                )
            cmd = [exe_file]

        elif language_id == 62:  # Java
            class_match = re.search(r"(?:public\s+)?class\s+([A-Za-z0-9_]+)", source_code)
            class_name = class_match.group(1) if class_match else "Main"
            java_file = os.path.join(temp_dir, f"{class_name}.java")
            with open(java_file, "w", encoding="utf-8") as f:
                f.write(source_code)

            compile_proc = subprocess.run(
                ["javac", java_file],
                capture_output=True,
                text=True,
                timeout=10.0,
            )
            if compile_proc.returncode != 0:
                elapsed = time.perf_counter() - start_time
                return CodeExecutionResponse(
                    status="compilation_error",
                    judge0_status="Compilation Error",
                    compile_output=compile_proc.stderr or compile_proc.stdout,
                    execution_time_seconds=round(elapsed, 3),
                    time_ms=round(elapsed * 1000, 1),
                    exit_code=compile_proc.returncode,
                    message="Java compilation failed with errors.",
                )
            cmd = ["java", "-cp", temp_dir, class_name]

        else:
            return CodeExecutionResponse(
                status="error",
                message=f"Unsupported local execution language ID: {language_id}",
            )

        run_proc = subprocess.run(
            cmd,
            input=stdin or "",
            capture_output=True,
            text=True,
            timeout=timeout_sec,
        )
        elapsed = time.perf_counter() - start_time
        exit_code = run_proc.returncode

        if exit_code == 0:
            status = "completed"
            judge0_status = "Accepted"
            message = "Execution finished successfully (Local Runner)."
        else:
            status = "runtime_error"
            judge0_status = f"Runtime Error (Exit Code {exit_code})"
            message = f"Process exited with non-zero code {exit_code}."

        return CodeExecutionResponse(
            status=status,
            judge0_status=judge0_status,
            stdout=run_proc.stdout or "",
            stderr=run_proc.stderr or None,
            execution_time_seconds=round(elapsed, 3),
            time_ms=round(elapsed * 1000, 1),
            exit_code=exit_code,
            message=message,
        )

    except subprocess.TimeoutExpired:
        elapsed = time.perf_counter() - start_time
        return CodeExecutionResponse(
            status="time_limit_exceeded",
            judge0_status="Time Limit Exceeded",
            message=f"Execution timed out ({timeout_sec:.1f}s CPU time limit exceeded).",
            execution_time_seconds=round(elapsed, 3),
            time_ms=round(elapsed * 1000, 1),
            exit_code=124,
        )
    except FileNotFoundError as exc:
        return CodeExecutionResponse(
            status="error",
            message=f"Local execution toolchain not found on host: {exc.filename}",
        )
    except Exception as exc:
        return CodeExecutionResponse(
            status="error",
            message=f"Local execution error: {type(exc).__name__}: {str(exc)}",
        )
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


async def submit_code(
    source_code: str,
    language_id: int,
    problem_id: str,
) -> CodeSubmitResponse:
    """
    Evaluates user code against the problem's defined test cases.
    Performs real automated testing, checks outputs line-by-line,
    and returns comprehensive test results without fabricating data.
    """
    problem = get_problem_by_id(problem_id)
    if not problem:
        return CodeSubmitResponse(
            status="error",
            passed_count=0,
            total_count=0,
            test_results=[],
            message=f"Coding problem with ID '{problem_id}' was not found.",
        )

    test_cases = problem.test_cases or []
    if not test_cases:
        from app.schemas.coding import CodingTestCase
        test_cases = [
            CodingTestCase(input=ex.input, expected_output=ex.output)
            for ex in problem.examples
        ]

    test_results: List[TestCaseResult] = []
    total_count = len(test_cases)
    passed_count = 0
    overall_status = "accepted"
    compile_output = None
    runtime_error = None
    total_time_sec = 0.0

    for idx, tc in enumerate(test_cases, start=1):
        exec_res = await execute_code(
            source_code=source_code,
            language_id=language_id,
            stdin=tc.input,
        )

        if exec_res.execution_time_seconds:
            total_time_sec += exec_res.execution_time_seconds

        if exec_res.status == "compilation_error":
            return CodeSubmitResponse(
                status="compilation_error",
                passed_count=0,
                total_count=total_count,
                test_results=test_results,
                compile_output=exec_res.compile_output or exec_res.stderr or exec_res.message,
                execution_time_seconds=round(total_time_sec, 3),
                time_ms=round(total_time_sec * 1000, 1),
                message="Compilation failed. Please inspect syntax and declarations.",
            )

        if exec_res.status == "time_limit_exceeded":
            test_results.append(
                TestCaseResult(
                    test_case_index=idx,
                    input=tc.input.strip(),
                    expected_output=tc.expected_output.strip(),
                    actual_output=None,
                    passed=False,
                    execution_time_ms=exec_res.time_ms,
                    error_message="Time Limit Exceeded",
                )
            )
            return CodeSubmitResponse(
                status="time_limit_exceeded",
                passed_count=passed_count,
                total_count=total_count,
                test_results=test_results,
                execution_time_seconds=round(total_time_sec, 3),
                time_ms=round(total_time_sec * 1000, 1),
                message=f"Time limit exceeded on test case {idx}.",
            )

        if exec_res.status == "runtime_error":
            test_results.append(
                TestCaseResult(
                    test_case_index=idx,
                    input=tc.input.strip(),
                    expected_output=tc.expected_output.strip(),
                    actual_output=exec_res.stdout.strip() if exec_res.stdout else None,
                    passed=False,
                    execution_time_ms=exec_res.time_ms,
                    error_message=exec_res.stderr or exec_res.message,
                )
            )
            runtime_error = exec_res.stderr or exec_res.message
            overall_status = "runtime_error"
            break

        if exec_res.status in ("service_unavailable", "configuration_missing", "error"):
            return CodeSubmitResponse(
                status=exec_res.status,
                passed_count=passed_count,
                total_count=total_count,
                test_results=test_results,
                message=exec_res.message or "Execution service unavailable.",
            )

        actual = (exec_res.stdout or "").strip()
        expected = tc.expected_output.strip()

        actual_norm = "\n".join(line.rstrip() for line in actual.splitlines())
        expected_norm = "\n".join(line.rstrip() for line in expected.splitlines())

        passed = (actual_norm == expected_norm)
        if passed:
            passed_count += 1
        else:
            if overall_status == "accepted":
                overall_status = "wrong_answer"

        test_results.append(
            TestCaseResult(
                test_case_index=idx,
                input=tc.input.strip(),
                expected_output=tc.expected_output.strip(),
                actual_output=actual,
                passed=passed,
                execution_time_ms=exec_res.time_ms,
                error_message=None if passed else "Actual output does not match expected output.",
            )
        )

    msg = (
        f"Accepted! All {total_count} test cases passed."
        if passed_count == total_count and overall_status == "accepted"
        else f"Wrong Answer: Passed {passed_count} of {total_count} test cases."
    )
    if overall_status == "runtime_error":
        msg = f"Runtime Error on test case {len(test_results)}. {runtime_error or ''}"

    return CodeSubmitResponse(
        status=overall_status,
        passed_count=passed_count,
        total_count=total_count,
        test_results=test_results,
        runtime_error=runtime_error,
        execution_time_seconds=round(total_time_sec, 3),
        time_ms=round(total_time_sec * 1000, 1),
        message=msg,
    )


