<div align="center">

# 🌟 CareerNova AI
### *Enterprise Full-Stack Career Intelligence & Algorithmic Preparation Platform*

[![Live Application](https://img.shields.io/badge/🌐_Live_Frontend-GitHub_Pages-2ea44f?style=for-the-badge&logo=githubpages&logoColor=white)](https://karthik-006-lgtm.github.io/Wipro-CPP-Project/)
[![API Gateway](https://img.shields.io/badge/⚡_Live_Backend_API-AWS_EC2-FF9900?style=for-the-badge&logo=amazonec2&logoColor=white)](http://65.1.107.152/)
[![Swagger Docs](https://img.shields.io/badge/📚_Swagger_UI-Interactive_Docs-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](http://65.1.107.152/docs)
[![Database](https://img.shields.io/badge/🐘_Live_Database-AWS_RDS_PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)](http://65.1.107.152/api/v1/health)

<br/>

[![CI Quality Gate](https://img.shields.io/github/actions/workflow/status/Karthik-006-lgtm/Wipro-CPP-Project/ci.yml?branch=main&label=CI%20Quality%20Gate&logo=github&style=flat-square)](https://github.com/Karthik-006-lgtm/Wipro-CPP-Project/actions/workflows/ci.yml)
[![Deployment Pipeline](https://img.shields.io/github/actions/workflow/status/Karthik-006-lgtm/Wipro-CPP-Project/deploy.yml?branch=main&label=Deploy%20Pipeline&logo=githubactions&logoColor=white&style=flat-square)](https://github.com/Karthik-006-lgtm/Wipro-CPP-Project/actions/workflows/deploy.yml)
[![Tests Passing](https://img.shields.io/badge/Tests-92%2F92%20Passing%20(100%25)-success?style=flat-square&logo=pytest&logoColor=white)](backend/tests/)
[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.14-3776AB?style=flat-square&logo=python&logoColor=white)](backend/)
[![React](https://img.shields.io/badge/React-18.3%20%7C%20TypeScript-61DAFB?style=flat-square&logo=react&logoColor=black)](frontend/)
[![AWS Region](https://img.shields.io/badge/AWS%20Region-ap--south--1%20(Mumbai)-232F3E?style=flat-square&logo=amazonwebservices&logoColor=white)](https://aws.amazon.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

<br/>

> **Wipro CPP Capstone Project**  
> **Architect & Lead Developer:** Karthikeyan ([@Karthik-006-lgtm](https://github.com/Karthik-006-lgtm))  
> **GitHub Repository:** [https://github.com/Karthik-006-lgtm/Wipro-CPP-Project](https://github.com/Karthik-006-lgtm/Wipro-CPP-Project)

</div>

---

## 🧭 Executive Live Cloud Dashboard

The complete **CareerNova AI** full-stack ecosystem is fully provisioned and operational across global edge CDN and AWS Cloud infrastructure:

| Tier | Component | Cloud Provider & Region | Live URL & Status | SLA & Health |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend SPA** | React 18 + Vite + TS | **GitHub Pages Edge CDN** | [🔗 **Launch Web Application**](https://karthik-006-lgtm.github.io/Wipro-CPP-Project/) | `HTTP 200 OK` (Global CDN) |
| **Backend API** | FastAPI + Uvicorn + Nginx | **AWS EC2** (`ap-south-1` Mumbai) | [🔗 **`http://65.1.107.152/`**](http://65.1.107.152/) | `HTTP 200 OK` (Auto-recovering) |
| **Interactive Docs** | OpenAPI 3.1 Swagger UI | **AWS EC2** (`ap-south-1` Mumbai) | [🔗 **`http://65.1.107.152/docs`**](http://65.1.107.152/docs) | Complete Interactive Spec |
| **Database Tier** | PostgreSQL 16 Engine | **AWS RDS** (`db.t4g.micro`) | [🔗 **Endpoint Health Check**](http://65.1.107.152/api/v1/health) | `Connected` • **3.06 ms latency** |
| **Storage Bucket** | Resume Archival & Exports | **AWS S3** (`ap-south-1` Mumbai) | `careernova-resumes-karthik2026` | SSE-AES256 Encrypted |
| **Code Runner** | C++ GCC / Multi-Language | **EC2 Ubuntu Host Engine** | Integrated Sandbox Runner | Zero-dependency Runtime |

---

## 🏛️ Comprehensive Cloud Architecture

```
                                  ┌────────────────────────────────────────────────────────┐
                                  │                USER WEB BROWSER / CLIENT              │
                                  │   https://karthik-006-lgtm.github.io/Wipro-CPP-Project/ │
                                  └───────────────────────────┬────────────────────────────┘
                                                              │
                                            HTTPS Requests    │   CORS Whitelisted
                                            Stateful Sessions │   JWT Bearer Auth
                                                              ▼
                                  ┌────────────────────────────────────────────────────────┐
                                  │                AWS EC2 CLOUD INSTANCE                  │
                                  │             careernova-server (65.1.107.152)            │
                                  │                                                        │
                                  │   ┌────────────────────────────────────────────────┐   │
                                  │   │     Nginx Web Server / Reverse Proxy (:80)     │   │
                                  │   └───────────────────────┬────────────────────────┘   │
                                  │                           │ Forward to localhost:8000  │
                                  │                           ▼                            │
                                  │   ┌────────────────────────────────────────────────┐   │
                                  │   │    FastAPI Application Daemon (Systemd Unit)   │   │
                                  │   │     - Asynchronous ASGI Gateway (Uvicorn)      │   │
                                  │   │     - Pydantic v2 Type-Safe Contracts          │   │
                                  │   │     - ATS Heuristic Scoring Engine             │   │
                                  │   │     - Local C++ & Multi-Lang Compiler Engine   │   │
                                  │   └───────┬───────────────────┬────────────────┬───┘   │
                                  └───────────┼───────────────────┼────────────────┼───────┘
                                              │                   │                │
                        PostgreSQL Connection │     Object Stream │                │ Google GenAI API
                        TCP Port 5432         │     Encrypted Put │                │ Multimodal Gemini
                                              ▼                   ▼                ▼
                          ┌─────────────────────────┐  ┌──────────────────┐  ┌───────────────────┐
                          │   AWS RDS POSTGRESQL    │  │   AWS S3 BUCKET  │  │ GEMINI AI GATEWAY │
                          │      careernova-db      │  │ careernova-res...│  │ - Resume Feedback │
                          │ - Users & Auth Profiles │  │ - Resumes (.pdf) │  │ - STAR Evaluation │
                          │ - Practice & Code Logs  │  │ - Versioned Docs │  │ - Career Coaching │
                          │ - 3.06 ms Query Latency │  │ - SSE-AES256     │  │ - Fallback Safety │
                          └─────────────────────────┘  └──────────────────┘  └───────────────────┘
```

---

## 🎯 The 4 CPPE Engineering Modules

This capstone project is architected and deployed strictly adhering to the 4 foundational engineering tracks:

### 1. 🤖 AI Engineering
* **Gemini AI Career Co-Pilot**: Deep integration with Google Gemini Flash for real-time resume critique, behavioral interview coaching, and role-gap analysis.
* **Deterministic ATS Scoring Engine**: A mathematical, multi-tier diagnostic system evaluating action-verb density, quantifiable achievements, section ordering, and contact completeness.
* **Multi-Language Sandboxed Execution**: Dual execution paths:
  1. *Judge0 Remote REST Sandbox* for rapid multi-language execution (Python, Java, JavaScript, TypeScript, C++).
  2. *Native Host C++ Sandbox* powered by `g++ 15` on Ubuntu EC2, compiling and executing candidate solutions in isolated temporary sub-processes with timeout guards.

### 2. 🗄️ Data Engineering
* **Managed Relational Persistence**: AWS RDS PostgreSQL 16 database running on high-efficiency ARM-based Graviton2 (`db.t4g.micro`) in Free Tier.
* **Schema Governance via Alembic**: Fully automated database versioning and transactional migrations:
  * `20261013_0001`: Initial schema for practice records, execution benchmarks, and metrics.
  * `20261013_0002`: Authentication schemas, user credentials, salted password hashes, and profile entities.
* **Connection Efficiency**: Utilizes native asynchronous `psycopg 3` connection pooling for ultra-low database latency (**3.06 ms**).

### 3. ☁️ Cloud Engineering
* **Compute Provisioning**: AWS EC2 virtual machine (`careernova-server`, `t3.micro`/`Ubuntu Server`) in Asia Pacific (Mumbai) `ap-south-1`.
* **Reverse Proxy Architecture**: Production Nginx reverse proxy listening on Port 80, buffering payloads, handling client timeouts, and forwarding requests to FastAPI running on Port 8000.
* **Resilient Process Supervision**: Linux `systemd` daemon unit (`careernova.service`) with automated boot auto-start and failure restart loops.
* **Scalable Object Archival**: AWS S3 Bucket (`careernova-resumes-karthik2026`) with server-side AES-256 encryption for safe resume asset backups.

### 4. 🔒 Security Engineering
* **Zero Hardcoded Secrets**: Strict separation of configuration and secrets using Pydantic Settings, local environment variables, and encrypted key pairs.
* **Network Isolation**:
  * EC2 Security Group restricts inbound traffic to Port 22 (SSH), Port 80 (HTTP), and Port 443 (HTTPS).
  * RDS Security Group (`careernova-rds-sg`) blocks public database access and allows ingress strictly on PostgreSQL Port 5432.
* **Cross-Origin Resource Sharing (CORS)**: Strict CORS policy explicitly allowing `https://karthik-006-lgtm.github.io` and blocking unauthorized domains.
* **In-Memory Document Handling**: Uploaded resume files are parsed in-memory using binary streams without unencrypted disk writes.

---

## 💻 Interactive Platform Modules

The live web application features 6 specialized career acceleration workspaces:

| # | Workspace Module | Core Technical Capabilities | Live Navigation |
| :-: | :--- | :--- | :--- |
| **01** | **🏠 Home Portfolio** | Central launchpad with real-time API health monitor, system readiness metrics, and quick action bars. | [Open Home](https://karthik-006-lgtm.github.io/Wipro-CPP-Project/) |
| **02** | **📄 ATS Resume Parser** | In-memory `.pdf`, `.docx`, `.txt` parsing, 4-tier score breakdown, keyword matching, and action verb density calculation. | [Open Parser](https://karthik-006-lgtm.github.io/Wipro-CPP-Project/) |
| **03** | **🏢 Employer Directory** | Curated database of 52 top tier technology firms (Google, Microsoft, Amazon, Wipro, TCS, Meta) with hiring round insights and stack matching. | [Open Directory](https://karthik-006-lgtm.github.io/Wipro-CPP-Project/) |
| **04** | **🧠 Interview & Coding Lab** | Live code editor supporting 5 languages, algorithmic problem catalogs (DSA, OOP, Arrays, Strings), custom STDIN, execution timers, and STAR video drills. | [Open Coding Lab](https://karthik-006-lgtm.github.io/Wipro-CPP-Project/) |
| **05** | **📊 Preparation Audit Logs** | Real-time PostgreSQL history dashboard logging every coding attempt, score, execution time, and submission timestamp. | [Open Audit Logs](https://karthik-006-lgtm.github.io/Wipro-CPP-Project/) |
| **06** | **📝 ATS Resume Generator** | Role-targeted resume builder with instant PDF and Word (DOCX) export engines and ATS single-column formatting. | [Open Generator](https://karthik-006-lgtm.github.io/Wipro-CPP-Project/) |

---

## 🧪 Automated Testing & Verification Suite

CareerNova AI maintains a **100% pass rate** across all automated test suites on both local machines and live AWS production instances:

```text
============================= test session starts ==============================
platform linux -- Python 3.14.4, pytest-9.1.1, pluggy-1.6.0
rootdir: /home/ubuntu/careernova/backend
configfile: pytest.ini
testpaths: tests
collected 92 items

tests/test_auth_and_profile.py ......                                    [  6%]
tests/test_companies.py ........                                         [ 15%]
tests/test_gemini_assistant.py .....................                     [ 38%]
tests/test_interview_coding.py ....................                      [ 59%]
tests/test_preparation_records.py ...........                            [ 71%]
tests/test_resume_generator.py .........                                 [ 81%]
tests/test_resume_parser.py .................                            [100%]

======================== 92 passed, 2 warnings in 5.28s ========================
```

---

## 📂 Repository Directory Layout

```
Wipro-CPP-Project/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Automated CI test runner & typechecker
│       └── deploy.yml             # GitHub Pages automated deployment pipeline
├── backend/
│   ├── alembic/                   # Database migration version scripts
│   ├── app/
│   │   ├── api/v1/                # Versioned REST endpoints (auth, parser, coding, records)
│   │   ├── core/                  # Security, configuration, and database session engines
│   │   ├── models/                # SQLAlchemy database ORM entities
│   │   ├── schemas/               # Pydantic v2 validation contracts
│   │   ├── services/              # ATS scoring, C++ code runner, Gemini gateway
│   │   └── main.py                # FastAPI entrypoint & middleware configuration
│   ├── tests/                     # 92 Pytest automated test suites
│   ├── .env.example               # Backend template environment configuration
│   ├── alembic.ini                # Alembic database migration config
│   └── requirements.txt           # Pinned production Python dependencies
├── frontend/
│   ├── src/
│   │   ├── api/                   # Type-safe Axios/Fetch API client layer
│   │   ├── components/            # Reusable UI components & navigation bars
│   │   ├── context/               # React Authentication Context
│   │   ├── pages/                 # 6 Primary workspace pages
│   │   ├── types/                 # Domain interfaces & TypeScript contracts
│   │   ├── App.tsx                # Master component & routing controller
│   │   └── index.css              # Glassmorphic dark mode CSS design tokens
│   ├── .env.production            # Live AWS EC2 API endpoint binding
│   ├── package.json               # Frontend dependencies & build commands
│   └── vite.config.ts             # Vite bundler & build configurations
└── README.md                      # Enterprise project dashboard & documentation
```

---

## ⚡ Local Development Quickstart

If you wish to run CareerNova AI locally on your development machine:

### 1. Clone the Codebase
```bash
git clone https://github.com/Karthik-006-lgtm/Wipro-CPP-Project.git
cd Wipro-CPP-Project
```

### 2. Backend Setup
```bash
cd backend
python -m venv .venv

# Activate Virtual Environment:
# On Windows:
.\.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install Dependencies:
pip install -r requirements.txt

# Run Migrations:
alembic upgrade head

# Start FastAPI:
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser to interact with the local development instance!

---

## 👨‍💻 Author & Acknowledgements

**Karthikeyan**  
* **GitHub**: [@Karthik-006-lgtm](https://github.com/Karthik-006-lgtm)  
* **Project Repository**: [Wipro-CPP-Project](https://github.com/Karthik-006-lgtm/Wipro-CPP-Project)  
* **Capstone**: Wipro CPP Project (Continuous Performance & Practice Program)

---

<div align="center">
  <sub>Engineered with precision for modern engineering career success. © 2026 CareerNova AI. All rights reserved.</sub>
</div>
