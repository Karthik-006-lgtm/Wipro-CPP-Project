import re
from typing import List, Dict, Any, Set, Tuple


# Controlled taxonomy of technical skills with aliases and categorizations
SKILL_TAXONOMY: Dict[str, Dict[str, Any]] = {
    # Programming Languages
    "Python": {
        "category": "Programming Languages",
        "aliases": ["python", "python3", "python 3", "py"],
    },
    "JavaScript": {
        "category": "Programming Languages",
        "aliases": ["javascript", "js", "ecmascript"],
    },
    "TypeScript": {
        "category": "Programming Languages",
        "aliases": ["typescript", "ts"],
    },
    "C++": {
        "category": "Programming Languages",
        "aliases": ["c++", "cpp"],
        "regex": r"(?:\bcpp\b|c\+\+)",
    },
    "C#": {
        "category": "Programming Languages",
        "aliases": ["c#", "csharp", "c-sharp"],
        "regex": r"(?:\bcsharp\b|\bc-sharp\b|c\#)",
    },
    "Java": {
        "category": "Programming Languages",
        "aliases": ["java", "core java"],
        "regex": r"\bjava\b(?!script)",
    },
    "Go": {
        "category": "Programming Languages",
        "aliases": ["golang"],
        "regex": r"(?:\bgolang\b|\bgo\s+language\b)",
    },
    "Rust": {
        "category": "Programming Languages",
        "aliases": ["rust", "rustlang"],
        "regex": r"(?:\brustlang\b|\brust\s+lang\b|\brust\b)",
    },
    "SQL": {
        "category": "Programming Languages",
        "aliases": ["sql", "t-sql", "pl/sql", "plsql"],
    },
    "HTML": {
        "category": "Programming Languages",
        "aliases": ["html", "html5"],
    },
    "CSS": {
        "category": "Programming Languages",
        "aliases": ["css", "css3"],
    },
    "Bash": {
        "category": "Programming Languages",
        "aliases": ["bash", "shell script", "shell scripting", "sh"],
        "regex": r"(?:\bbash\b|\bshell\s+scripting?\b)",
    },
    "Ruby": {
        "category": "Programming Languages",
        "aliases": ["ruby", "ruby on rails"],
    },
    "PHP": {
        "category": "Programming Languages",
        "aliases": ["php"],
    },
    "Kotlin": {
        "category": "Programming Languages",
        "aliases": ["kotlin"],
    },
    "Swift": {
        "category": "Programming Languages",
        "aliases": ["swift"],
    },

    # Frameworks & Libraries
    "FastAPI": {
        "category": "Frameworks & Libraries",
        "aliases": ["fastapi", "fast-api", "fast api"],
    },
    "React": {
        "category": "Frameworks & Libraries",
        "aliases": ["react", "react.js", "reactjs", "react js"],
    },
    "Node.js": {
        "category": "Frameworks & Libraries",
        "aliases": ["node.js", "nodejs", "node js", "node"],
        "regex": r"(?:\bnode\.js\b|\bnodejs\b|\bnode\s+js\b|\bnode\b(?=\s*(?:runtime|backend|server)))",
    },
    "Next.js": {
        "category": "Frameworks & Libraries",
        "aliases": ["next.js", "nextjs", "next js"],
    },
    "Django": {
        "category": "Frameworks & Libraries",
        "aliases": ["django", "django rest framework", "drf"],
    },
    "Flask": {
        "category": "Frameworks & Libraries",
        "aliases": ["flask"],
    },
    "Express.js": {
        "category": "Frameworks & Libraries",
        "aliases": ["express.js", "expressjs", "express js", "express"],
        "regex": r"(?:\bexpress\.js\b|\bexpressjs\b|\bexpress\s+js\b|\bexpress\b(?=\s*(?:framework|middleware)))",
    },
    "Spring Boot": {
        "category": "Frameworks & Libraries",
        "aliases": ["spring boot", "springboot", "spring framework"],
    },
    "Vue.js": {
        "category": "Frameworks & Libraries",
        "aliases": ["vue", "vue.js", "vuejs"],
    },
    "Angular": {
        "category": "Frameworks & Libraries",
        "aliases": ["angular", "angularjs"],
    },
    "Tailwind CSS": {
        "category": "Frameworks & Libraries",
        "aliases": ["tailwind", "tailwindcss", "tailwind css"],
    },
    ".NET": {
        "category": "Frameworks & Libraries",
        "aliases": [".net", "dotnet", ".net core", "asp.net"],
        "regex": r"(?:\bdotnet\b|\.net\s*core\b|\basp\.net\b|\.net\b)",
    },
    "SQLAlchemy": {
        "category": "Frameworks & Libraries",
        "aliases": ["sqlalchemy"],
    },

    # Databases & Storage
    "PostgreSQL": {
        "category": "Databases & Storage",
        "aliases": ["postgresql", "postgres", "psql", "postgres db"],
    },
    "MySQL": {
        "category": "Databases & Storage",
        "aliases": ["mysql"],
    },
    "MongoDB": {
        "category": "Databases & Storage",
        "aliases": ["mongodb", "mongo"],
    },
    "Redis": {
        "category": "Databases & Storage",
        "aliases": ["redis"],
    },
    "SQLite": {
        "category": "Databases & Storage",
        "aliases": ["sqlite", "sqlite3"],
    },
    "Cassandra": {
        "category": "Databases & Storage",
        "aliases": ["cassandra", "apache cassandra"],
    },
    "Elasticsearch": {
        "category": "Databases & Storage",
        "aliases": ["elasticsearch", "elastic search"],
    },
    "DynamoDB": {
        "category": "Databases & Storage",
        "aliases": ["dynamodb", "amazon dynamodb"],
    },

    # Cloud & DevOps
    "AWS": {
        "category": "Cloud & DevOps",
        "aliases": ["aws", "amazon web services", "ec2", "s3", "lambda"],
        "regex": r"(?:\bamazon\s+web\s+services\b|\baws\b|\baws\s+(?:ec2|s3|lambda|iam)\b)",
    },
    "Docker": {
        "category": "Cloud & DevOps",
        "aliases": ["docker", "docker compose", "dockerfile"],
    },
    "Kubernetes": {
        "category": "Cloud & DevOps",
        "aliases": ["kubernetes", "k8s"],
    },
    "Google Cloud Platform": {
        "category": "Cloud & DevOps",
        "aliases": ["gcp", "google cloud", "google cloud platform"],
    },
    "Microsoft Azure": {
        "category": "Cloud & DevOps",
        "aliases": ["azure", "microsoft azure"],
    },
    "Git": {
        "category": "Cloud & DevOps",
        "aliases": ["git", "github", "gitlab"],
        "regex": r"(?:\bgit\b|\bgithub\b|\bgitlab\b)",
    },
    "Linux": {
        "category": "Cloud & DevOps",
        "aliases": ["linux", "ubuntu", "debian", "centos", "redhat"],
    },
    "CI/CD": {
        "category": "Cloud & DevOps",
        "aliases": ["ci/cd", "ci-cd", "continuous integration", "github actions", "jenkins"],
        "regex": r"(?:\bci\/cd\b|\bci-cd\b|\bcontinuous\s+integration\b|\bgithub\s+actions\b|\bjenkins\b)",
    },
    "Terraform": {
        "category": "Cloud & DevOps",
        "aliases": ["terraform"],
    },
    "Nginx": {
        "category": "Cloud & DevOps",
        "aliases": ["nginx"],
    },

    # Architecture & Core Concepts
    "REST APIs": {
        "category": "Architecture & Concepts",
        "aliases": ["rest", "rest api", "restful", "restful api", "rest apis"],
        "regex": r"(?:\brestful\s+apis?\b|\brest\s+apis?\b|\brestful\b)",
    },
    "GraphQL": {
        "category": "Architecture & Concepts",
        "aliases": ["graphql"],
    },
    "Microservices": {
        "category": "Architecture & Concepts",
        "aliases": ["microservices", "microservice architecture", "micro-services"],
    },
    "System Design": {
        "category": "Architecture & Concepts",
        "aliases": ["system design", "distributed systems", "high availability", "scalability"],
    },
    "Data Structures & Algorithms": {
        "category": "Architecture & Concepts",
        "aliases": ["data structures", "algorithms", "dsa", "oop", "object-oriented programming"],
        "regex": r"(?:\bdata\s+structures\b|\balgorithms\b|\bdsa\b|\bobject-oriented\s+programming\b|\boop\b)",
    },
    "Unit Testing": {
        "category": "Architecture & Concepts",
        "aliases": ["unit testing", "pytest", "jest", "test-driven development", "tdd", "integration testing"],
    },
    "Agile": {
        "category": "Architecture & Concepts",
        "aliases": ["agile", "scrum", "kanban"],
    },

    # AI & Machine Learning
    "Machine Learning": {
        "category": "AI & Data Science",
        "aliases": ["machine learning", "ml", "deep learning", "neural networks"],
        "regex": r"(?:\bmachine\s+learning\b|\bdeep\s+learning\b|\bneural\s+networks\b)",
    },
    "PyTorch": {
        "category": "AI & Data Science",
        "aliases": ["pytorch"],
    },
    "TensorFlow": {
        "category": "AI & Data Science",
        "aliases": ["tensorflow", "keras"],
    },
    "Natural Language Processing": {
        "category": "AI & Data Science",
        "aliases": ["nlp", "natural language processing", "llm", "large language models"],
        "regex": r"(?:\bnatural\s+language\s+processing\b|\bnlp\b|\blarge\s+language\s+models?\b|\bllms?\b)",
    },
    "Pandas": {
        "category": "AI & Data Science",
        "aliases": ["pandas"],
    },
    "NumPy": {
        "category": "AI & Data Science",
        "aliases": ["numpy"],
    },
}


def extract_evidence(text: str, start_pos: int, end_pos: int, window: int = 40) -> str:
    """Extracts a short snippet (~80 chars) around the matched term."""
    snippet_start = max(0, start_pos - window)
    snippet_end = min(len(text), end_pos + window)
    
    snippet = text[snippet_start:snippet_end].replace("\n", " ")
    snippet = re.sub(r"\s+", " ", snippet).strip()
    
    prefix = "..." if snippet_start > 0 else ""
    suffix = "..." if snippet_end < len(text) else ""
    return f"{prefix}{snippet}{suffix}"


def extract_skills_from_text(text: str) -> List[Dict[str, Any]]:
    """
    Scans text against controlled skill taxonomy.
    Returns deduplicated list of detected skills with:
    - raw_term
    - normalized_name
    - category
    - evidence
    """
    if not text:
        return []

    detected_skills: List[Dict[str, Any]] = []
    seen_normalized: Set[str] = set()

    for normalized_name, meta in SKILL_TAXONOMY.items():
        category = meta["category"]
        regex_pattern = meta.get("regex")

        if not regex_pattern:
            # Build regex from aliases with word boundaries
            escaped_aliases = [re.escape(alias) for alias in meta["aliases"]]
            # Sort longest first so 'react js' matches before 'react'
            escaped_aliases.sort(key=len, reverse=True)
            regex_pattern = r"\b(?:" + "|".join(escaped_aliases) + r")\b"

        try:
            match = re.search(regex_pattern, text, re.IGNORECASE)
            if match and normalized_name not in seen_normalized:
                seen_normalized.add(normalized_name)
                start, end = match.span()
                matched_term = match.group(0)
                evidence = extract_evidence(text, start, end)

                detected_skills.append({
                    "raw_term": matched_term,
                    "normalized_name": normalized_name,
                    "category": category,
                    "evidence": evidence,
                })
        except re.error:
            continue

    # Sort skills by category, then by normalized name
    detected_skills.sort(key=lambda s: (s["category"], s["normalized_name"]))
    return detected_skills
