from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class CodeExecutionRequest(BaseModel):
    source_code: str = Field(..., max_length=65536, description="Source code to execute (max 64KB)")
    language_id: int = Field(..., description="Judge0 language ID")
    stdin: Optional[str] = Field(default="", max_length=16384, description="Standard input string (max 16KB)")


class CodeExecutionResponse(BaseModel):
    status: str = Field(..., description="'completed', 'in_progress', 'configuration_missing', 'service_unavailable', or 'error'")
    judge0_status: Optional[str] = Field(None, description="Raw Judge0 status description if returned")
    stdout: Optional[str] = Field(None, description="Standard output from execution")
    stderr: Optional[str] = Field(None, description="Standard error output")
    compile_output: Optional[str] = Field(None, description="Compiler or build output if compilation failed")
    execution_time_seconds: Optional[float] = Field(None, description="Runtime execution duration in seconds")
    time_ms: Optional[float] = Field(None, description="Execution duration in milliseconds")
    memory_kb: Optional[int] = Field(None, description="Peak memory usage in kilobytes")
    exit_code: Optional[int] = Field(None, description="Process exit code")
    message: Optional[str] = Field(None, description="Descriptive status message or diagnostic information")
    token: Optional[str] = Field(None, description="Judge0 async submission token if polled")


class CodingLanguage(BaseModel):
    id: int = Field(..., description="Judge0 language identifier")
    name: str = Field(..., description="Human-readable language name")
    key: str = Field(..., description="Syntax key (python, cpp, javascript, typescript, java)")
    version: str = Field(..., description="Language runtime version")
    starter_template: str = Field(..., description="Default starter code template")


class CodingProblemExample(BaseModel):
    input: str
    output: str
    explanation: Optional[str] = None


class CodingTestCase(BaseModel):
    input: str
    expected_output: str
    is_hidden: bool = False


class CodingProblem(BaseModel):
    id: str
    title: str
    difficulty: str  # 'Easy' | 'Medium' | 'Hard'
    category: str
    description: str
    examples: List[CodingProblemExample]
    constraints: List[str]
    starter_code: Dict[str, str]  # language key -> code
    hints: Optional[List[str]] = Field(default_factory=list)
    test_cases: Optional[List[CodingTestCase]] = Field(default_factory=list)


class TestCaseResult(BaseModel):
    test_case_index: int
    input: str
    expected_output: str
    actual_output: Optional[str] = None
    passed: bool
    execution_time_ms: Optional[float] = None
    error_message: Optional[str] = None


class CodeSubmitRequest(BaseModel):
    source_code: str = Field(..., max_length=65536, description="Source code to evaluate against test suite")
    language_id: int = Field(..., description="Judge0 language ID")
    problem_id: str = Field(..., description="Target problem ID to test against")


class CodeSubmitResponse(BaseModel):
    status: str = Field(..., description="'accepted', 'wrong_answer', 'compilation_error', 'runtime_error', 'time_limit_exceeded', 'service_unavailable', or 'error'")
    passed_count: int = Field(0, description="Number of passed test cases")
    total_count: int = Field(0, description="Total number of evaluated test cases")
    test_results: List[TestCaseResult] = Field(default_factory=list, description="Details for each evaluated test case")
    compile_output: Optional[str] = Field(None, description="Compiler or build diagnostic output if build failed")
    runtime_error: Optional[str] = Field(None, description="Runtime stderr or exception traceback")
    execution_time_seconds: Optional[float] = Field(None, description="Overall execution time in seconds")
    time_ms: Optional[float] = Field(None, description="Overall execution time in milliseconds")
    message: str = Field(..., description="Summary status message")
