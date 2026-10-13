import re
from typing import List, Optional
from app.schemas.company import (
    CompanyProfile,
    CompanyMatchResult,
    CompanyMatchResponse,
)

VERIFIED_COMPANIES_CATALOGUE: List[CompanyProfile] = [
    CompanyProfile(
        id="google",
        name="Google",
        industry="Internet & Cloud Infrastructure",
        location="Mountain View, CA / Hyderabad / Bengaluru / Remote",
        description="Global technology leader building web search, cloud infrastructure (GCP), developer tools, and high-scale distributed systems.",
        tech_stack=["Python", "C++", "Java", "Go", "Kubernetes", "Linux", "Distributed Systems", "SQL", "gRPC", "Algorithms"],
        roles=["Software Engineer (SDE)", "Cloud Solutions Architect", "Site Reliability Engineer (SRE)", "Systems Infrastructure Engineer"],
        interview_stages=["Online Algorithmic Assessment", "Technical Phone Screen", "Data Structures & Algorithms (3-4 rounds)", "System Design Architecture", "Googliness & Leadership"],
        website="https://careers.google.com",
    ),
    CompanyProfile(
        id="microsoft",
        name="Microsoft",
        industry="Enterprise Software & Cloud Platforms",
        location="Redmond, WA / Bengaluru / Hyderabad / Remote",
        description="Enterprise software and cloud computing innovator powering Azure, developer frameworks, productivity platforms, and enterprise solutions.",
        tech_stack=["TypeScript", "C#", ".NET", "Python", "Azure", "React", "SQL", "Docker", "Microservices", "REST APIs"],
        roles=["Full Stack Engineer", "Azure Platform Engineer", "Backend Services Developer", "Security Software Engineer"],
        interview_stages=["Online Coding Test", "Technical Screen", "Data Structures & Algorithms", "System Architecture & API Design", "As-Appropriate (AA) Bar Raiser"],
        website="https://careers.microsoft.com",
    ),
    CompanyProfile(
        id="amazon",
        name="Amazon",
        industry="E-Commerce & Cloud Computing (AWS)",
        location="Seattle, WA / Hyderabad / Bengaluru / Arlington, VA",
        description="Global e-commerce and distributed cloud infrastructure provider (AWS) operating microservices at extreme global scale.",
        tech_stack=["Java", "Python", "AWS", "Docker", "PostgreSQL", "NoSQL", "Distributed Systems", "Linux", "REST APIs", "Microservices"],
        roles=["Software Development Engineer (SDE I/II)", "Cloud Support Engineer", "DevOps Engineer", "Solutions Architect"],
        interview_stages=["Online Assessment (OA)", "Technical Screen", "Data Structures & Coding (2 rounds)", "System Design & Scalability", "Leadership Principles (LP) Bar Raiser"],
        website="https://amazon.jobs",
    ),
    CompanyProfile(
        id="apple",
        name="Apple",
        industry="Consumer Electronics & Operating Systems",
        location="Cupertino, CA / Austin, TX / Bengaluru / Munich",
        description="Creator of iPhone, Mac, iOS, macOS, and custom silicon architectures designed with uncompromising privacy and human-centered design.",
        tech_stack=["Swift", "Objective-C", "C++", "Python", "Rust", "iOS", "macOS", "Metal", "CoreML", "Linux"],
        roles=["iOS Software Engineer", "Systems Software Engineer", "Core OS Developer", "Firmware Engineer"],
        interview_stages=["Recruiter Screening", "Technical Phone Coding", "System Performance & Architecture", "Onsite Coding (3 rounds)", "Team Fit & Domain Deep Dive"],
        website="https://jobs.apple.com",
    ),
    CompanyProfile(
        id="meta",
        name="Meta (formerly Facebook)",
        industry="Social Platforms & AI Infrastructure",
        location="Menlo Park, CA / London / Singapore / Remote",
        description="Social technology pioneer connecting billions across Instagram, WhatsApp, Messenger, and open-source AI models like Llama.",
        tech_stack=["Python", "C++", "Hack", "PHP", "React", "GraphQL", "PyTorch", "Distributed Systems", "Linux", "MySQL"],
        roles=["Software Engineer", "Production Engineer", "Research Scientist", "Full Stack Web Engineer"],
        interview_stages=["Technical Coding Screen", "Algorithms & Problem Solving", "Product Architecture / System Design", "Behavioral Leadership"],
        website="https://metacareers.com",
    ),
    CompanyProfile(
        id="netflix",
        name="Netflix",
        industry="Streaming Media & Cloud Architecture",
        location="Los Gatos, CA / Remote",
        description="Global entertainment streaming platform driving content delivery networks, chaos engineering, and high-concurrency microservices.",
        tech_stack=["Java", "Node.js", "Python", "AWS", "React", "Kafka", "Cassandra", "Spinnaker", "Microservices", "GraphQL"],
        roles=["Senior Software Engineer", "Platform Infrastructure Engineer", "Data Platform Engineer", "UI Systems Architect"],
        interview_stages=["Recruiter Screen", "Technical Screen with Staff Engineer", "In-depth System Architecture & Concurrency", "Company Culture & Values (2 rounds)"],
        website="https://jobs.netflix.com",
    ),
    CompanyProfile(
        id="adobe",
        name="Adobe",
        industry="Creative Cloud & Digital Media",
        location="San Jose, CA / Noida / Bengaluru / Remote",
        description="Industry standard in digital media, document workflows, and creative applications including Photoshop, Illustrator, and Acrobat.",
        tech_stack=["C++", "Java", "JavaScript", "TypeScript", "React", "Python", "AWS", "Machine Learning", "WebGL", "REST APIs"],
        roles=["Computer Vision Software Engineer", "Full Stack Web Engineer", "Graphics Engine Developer", "Cloud Services Engineer"],
        interview_stages=["Online Assessment", "Technical Coding Screen", "Graphics / Core Architecture Discussion", "Managerial & Culture Fit"],
        website="https://careers.adobe.com",
    ),
    CompanyProfile(
        id="oracle",
        name="Oracle",
        industry="Enterprise Database & Cloud Infrastructure (OCI)",
        location="Austin, TX / Bengaluru / Hyderabad / Redwood City, CA",
        description="Enterprise database pioneer and hyperscale cloud infrastructure provider powering mission-critical transactional platforms globally.",
        tech_stack=["Java", "C++", "SQL", "Python", "OCI", "Linux", "Kubernetes", "PL/SQL", "Docker", "Distributed Storage"],
        roles=["Cloud Infrastructure Engineer", "Database Kernel Developer", "Backend Systems Engineer", "Java Enterprise Developer"],
        interview_stages=["Coding Assessment", "Technical Screen", "Database Concurrency & Systems Round", "Cloud Architecture Round", "Director Interview"],
        website="https://oracle.com/careers",
    ),
    CompanyProfile(
        id="ibm",
        name="IBM",
        industry="Hybrid Cloud & Enterprise AI",
        location="Armonk, NY / Bengaluru / San Jose / Cambridge, MA",
        description="Enterprise hybrid cloud and cognitive solutions leader powering Red Hat OpenShift, watsonx, and enterprise modernization.",
        tech_stack=["Python", "Java", "Go", "Kubernetes", "Red Hat OpenShift", "Linux", "Docker", "Cloud", "Microservices", "AI/ML"],
        roles=["Hybrid Cloud Developer", "OpenShift Software Engineer", "Enterprise AI Engineer", "Site Reliability Engineer"],
        interview_stages=["Cognitive & Coding Assessment", "Technical Deep Dive", "Architecture Design Round", "Professional Values & Fit"],
        website="https://ibm.com/careers",
    ),
    CompanyProfile(
        id="salesforce",
        name="Salesforce",
        industry="Enterprise CRM & Cloud Platforms",
        location="San Francisco, CA / Hyderabad / Bengaluru / Remote",
        description="World leader in customer relationship management (CRM), multi-tenant enterprise architecture, and real-time business apps.",
        tech_stack=["Java", "Apex", "TypeScript", "React", "Python", "PostgreSQL", "AWS", "Kafka", "Microservices", "REST APIs"],
        roles=["Software Engineering MTS", "Platform Infrastructure Developer", "Data Platform Engineer", "Security Software Engineer"],
        interview_stages=["HackerRank Coding Screen", "Algorithm & Code Quality Interview", "Multi-tenant System Design Round", "Engineering Leadership Round"],
        website="https://salesforce.com/careers",
    ),
    CompanyProfile(
        id="cisco",
        name="Cisco Systems",
        industry="Networking, Security & IoT",
        location="San Jose, CA / Bengaluru / Boxborough, MA",
        description="Global networking hardware and cyber-defense leader providing routers, enterprise firewalls, and cloud security frameworks.",
        tech_stack=["C", "C++", "Python", "Go", "Linux", "Networking", "TCP/IP", "Docker", "Kubernetes", "REST APIs"],
        roles=["Network Software Engineer", "Cloud Security Engineer", "Embedded Systems Developer", "DevOps Engineer"],
        interview_stages=["Online Technical Test", "Systems Programming Screen", "Network Protocols & Architecture", "Engineering Manager Round"],
        website="https://jobs.cisco.com",
    ),
    CompanyProfile(
        id="intel",
        name="Intel",
        industry="Semiconductors & Systems Computing",
        location="Santa Clara, CA / Bengaluru / Folsom, CA",
        description="Semiconductor innovator manufacturing cutting-edge microprocessors, chipsets, and low-level firmware architecture.",
        tech_stack=["C", "C++", "Python", "Assembly", "Linux", "FPGA", "Verilog", "Compilers", "RTOS", "Kernel"],
        roles=["Firmware Engineer", "System Software Developer", "Compiler Optimization Engineer", "Silicon Design Engineer"],
        interview_stages=["Technical Pre-screen", "Low-Level / C++ Coding Round", "Operating Systems & Hardware Architecture", "Panel Discussion"],
        website="https://jobs.intel.com",
    ),
    CompanyProfile(
        id="nvidia",
        name="NVIDIA",
        industry="Accelerated Computing & AI Platforms",
        location="Santa Clara, CA / Bengaluru / Pune / Remote",
        description="World leader in GPU computing, CUDA architecture, ray tracing graphics, and accelerated AI infrastructure.",
        tech_stack=["C++", "CUDA", "Python", "C", "Linux", "GPU Architecture", "PyTorch", "Docker", "Computer Vision", "Deep Learning"],
        roles=["Deep Learning Software Engineer", "CUDA Compiler Engineer", "GPU Systems Architect", "Driver Software Developer"],
        interview_stages=["Technical Coding & Math Screen", "CUDA & High Performance Computing Round", "System Architecture & Memory Management", "Engineering Director Round"],
        website="https://nvidia.com/careers",
    ),
    CompanyProfile(
        id="uber",
        name="Uber",
        industry="Mobility & Real-Time Logistics",
        location="San Francisco, CA / Bengaluru / Amsterdam / Hyderabad",
        description="Global mobility and delivery platform processing millions of real-time geospatial trips with low-latency event architectures.",
        tech_stack=["Go", "Java", "Python", "Kafka", "Cassandra", "React Native", "PostgreSQL", "Microservices", "Docker", "Distributed Systems"],
        roles=["Software Engineer (Backend)", "Mobile Engineer (Android/iOS)", "Infrastructure Reliability Engineer", "Data Platform Engineer"],
        interview_stages=["Online Coding Assessment", "Data Structures & Algorithms Screen", "Large-scale Distributed System Design", "Bar Raiser Interview"],
        website="https://uber.com/careers",
    ),
    CompanyProfile(
        id="airbnb",
        name="Airbnb",
        industry="Travel Marketplace & Hospitality Platform",
        location="San Francisco, CA / Remote",
        description="Global community marketplace connecting travelers with unique accommodations through responsive web and mobile experiences.",
        tech_stack=["Java", "Kotlin", "TypeScript", "React", "GraphQL", "MySQL", "AWS", "Kafka", "Swift", "Microservices"],
        roles=["Software Engineer (Full Stack)", "Backend Services Engineer", "Mobile Engineer", "Platform Infrastructure Engineer"],
        interview_stages=["Recruiter Screen", "Practical Coding / Problem Solving", "System Design & Data Modeling", "Core Values & Cross-functional Interview"],
        website="https://careers.airbnb.com",
    ),
    CompanyProfile(
        id="spotify",
        name="Spotify",
        industry="Audio Streaming & Content Discovery",
        location="Stockholm, Sweden / New York, NY / Remote",
        description="World's most popular audio streaming subscription service, pioneering recommendation algorithms and autonomous squad workflows.",
        tech_stack=["Java", "Python", "C++", "TypeScript", "React", "GCP", "Kubernetes", "Cassandra", "Docker", "Microservices"],
        roles=["Backend Engineer", "Web Engineer", "Machine Learning Engineer", "Platform Engineer"],
        interview_stages=["CoderPad Technical Screen", "Algorithms & Problem Solving", "System Architecture Round", "Values & Culture Discussion"],
        website="https://spotifyjobs.com",
    ),
    CompanyProfile(
        id="stripe",
        name="Stripe",
        industry="Fintech & Global Payments Infrastructure",
        location="San Francisco, CA / Dublin / Remote",
        description="Financial infrastructure platform building developer-first APIs, high-reliability payment processing engines, and banking rails.",
        tech_stack=["Ruby", "Go", "TypeScript", "PostgreSQL", "React", "Kafka", "Redis", "Distributed Systems", "APIs", "SQL"],
        roles=["Backend Infrastructure Engineer", "Full Stack Payments Engineer", "Reliability Engineer", "API Platform Engineer"],
        interview_stages=["Technical Phone Screen", "Practical Coding (Bug Fixing / Refactoring)", "System Architecture & Data Modeling", "Integration & API Design", "Manager & Culture Alignment"],
        website="https://stripe.com/jobs",
    ),
    CompanyProfile(
        id="paypal",
        name="PayPal",
        industry="Digital Payments & FinTech Commerce",
        location="San Jose, CA / Chennai / Bengaluru / Singapore",
        description="Global digital payment platform enabling secure transactions, digital wallets, and fraud prevention for millions of merchants.",
        tech_stack=["Java", "Node.js", "Python", "React", "Oracle", "PostgreSQL", "Kafka", "Docker", "Kubernetes", "REST APIs"],
        roles=["Software Development Engineer", "Fintech Backend Developer", "Application Security Engineer", "Risk & Fraud Modeling Engineer"],
        interview_stages=["Online Assessment", "Technical Coding Round", "System Design & Financial Consistency", "Managerial & Behavioral Fit"],
        website="https://careers.paypal-corp.com",
    ),
    CompanyProfile(
        id="twitter",
        name="X (formerly Twitter)",
        industry="Real-Time Social Communications & Messaging",
        location="San Francisco, CA / Remote",
        description="Real-time communication and news delivery platform distributing hundreds of millions of public posts daily.",
        tech_stack=["Scala", "Java", "Python", "C++", "Kafka", "GraphQL", "Rust", "Distributed Systems", "Linux", "Kubernetes"],
        roles=["Systems Software Engineer", "Real-Time Infrastructure Engineer", "Core Services Developer", "Data Platform Engineer"],
        interview_stages=["Algorithmic Coding Screen", "Distributed Stream Architecture Round", "Low-Latency System Design", "Executive Bar Raiser"],
        website="https://careers.x.com",
    ),
    CompanyProfile(
        id="qualcomm",
        name="Qualcomm",
        industry="Wireless Telecom & Mobile Processors",
        location="San Diego, CA / Hyderabad / Bengaluru / Chennai",
        description="World leader in 5G wireless technology, Snapdragon mobile system-on-chip (SoC) architectures, and edge neural processing.",
        tech_stack=["C", "C++", "Python", "Linux", "RTOS", "Embedded Systems", "5G", "DSP", "Kernel", "Device Drivers"],
        roles=["Embedded Software Engineer", "Modem Systems Developer", "Android Kernel Engineer", "Wireless Protocol Engineer"],
        interview_stages=["Online Technical Test", "C/C++ Embedded Screening", "Operating Systems & Protocol Stacks", "HR & Culture Round"],
        website="https://qualcomm.com/careers",
    ),
    CompanyProfile(
        id="amd",
        name="Advanced Micro Devices (AMD)",
        industry="High Performance Processors & Graphics",
        location="Santa Clara, CA / Austin, TX / Hyderabad / Bengaluru",
        description="High-performance processor and graphics chipmaker powering data centers, gaming consoles, and cloud compute clusters.",
        tech_stack=["C++", "C", "Python", "Linux", "GPU", "Compilers", "ROCm", "System Architecture", "OpenCL", "Verilog"],
        roles=["GPU Software Development Engineer", "Compiler Optimization Specialist", "Firmware Engineer", "Platform Systems Developer"],
        interview_stages=["Coding & Architecture Screen", "Low-Level Systems & Memory Round", "High Performance Architecture Deep Dive", "Manager Round"],
        website="https://amd.com/en/corporate/careers",
    ),
    CompanyProfile(
        id="atlassian",
        name="Atlassian",
        industry="Developer Tools & Enterprise Collaboration",
        location="Sydney, Australia / Bengaluru / San Francisco / Remote",
        description="Makers of Jira, Confluence, Bitbucket, and Trello empowering teams with collaborative agile engineering tools.",
        tech_stack=["Java", "Kotlin", "TypeScript", "React", "AWS", "GraphQL", "PostgreSQL", "Microservices", "Docker", "Kafka"],
        roles=["Full Stack Software Engineer", "Backend Cloud Engineer", "Site Reliability Engineer", "Platform Architect"],
        interview_stages=["CoderPad Coding Screen", "Code Craftsmanship & Refactoring", "Cloud Architecture & Scalability", "Values Interview (Open Company, No Bullshit)"],
        website="https://atlassian.com/company/careers",
    ),
    CompanyProfile(
        id="snowflake",
        name="Snowflake",
        industry="Cloud Data Warehouse & Analytics",
        location="Bozeman, MT / San Mateo, CA / Bengaluru / Remote",
        description="Cloud data platform offering a high-performance multi-cluster shared-data architecture across AWS, Azure, and GCP.",
        tech_stack=["C++", "Java", "Go", "Python", "SQL", "Cloud Infrastructure", "Distributed Systems", "Kubernetes", "Linux", "Rust"],
        roles=["Database Engine Developer", "Cloud Infrastructure Engineer", "Data Platform Software Engineer", "Core Systems Engineer"],
        interview_stages=["Online Algorithmic Test", "Technical Phone Screen", "Distributed Query Engine Design", "Core Systems Coding (2 rounds)", "Hiring Manager Round"],
        website="https://snowflake.com/careers",
    ),
    CompanyProfile(
        id="databricks",
        name="Databricks",
        industry="Unified Analytics & Lakehouse Platform",
        location="San Francisco, CA / Bengaluru / Amsterdam / Remote",
        description="Creators of Apache Spark, Delta Lake, and MLflow unifying data engineering, governance, and enterprise AI workloads.",
        tech_stack=["Scala", "Java", "Python", "C++", "Go", "Distributed Systems", "Kubernetes", "AWS", "Azure", "Cloud"],
        roles=["Distributed Systems Engineer", "Lakehouse Platform Developer", "Core Spark Engineer", "Full Stack Web Engineer"],
        interview_stages=["Online Coding Challenge", "Technical Screening", "Distributed Concurrency & Storage Round", "System Architecture", "Leadership & Values"],
        website="https://databricks.com/company/careers",
    ),
    CompanyProfile(
        id="vmware",
        name="VMware (Broadcom)",
        industry="Virtualization & Cloud Infrastructure",
        location="Palo Alto, CA / Bengaluru / Remote",
        description="Pioneers in x86 virtualization, enterprise hypervisors (ESXi), software-defined networking, and modern container platforms.",
        tech_stack=["C++", "Go", "Python", "Java", "Linux", "Kubernetes", "Docker", "Virtualization", "Networking", "Distributed Systems"],
        roles=["Hypervisor Software Engineer", "Cloud Native Developer", "Networking Infrastructure Engineer", "Storage Systems Engineer"],
        interview_stages=["Technical Coding Screen", "Operating Systems & Virtualization Round", "System Architecture & Scalability", "Behavioral & Competency Discussion"],
        website="https://broadcom.com/careers",
    ),
    CompanyProfile(
        id="sap",
        name="SAP SE",
        industry="Enterprise Resource Planning & Business AI",
        location="Walldorf, Germany / Bengaluru / Palo Alto / Singapore",
        description="Market leader in enterprise application software, powering business operations across supply chains, ERP, and commerce.",
        tech_stack=["Java", "ABAP", "Python", "TypeScript", "Node.js", "HANA", "Cloud Foundry", "Kubernetes", "Docker", "SQL"],
        roles=["Developer Associate", "Cloud Platform Engineer", "Enterprise Full Stack Engineer", "SAP HANA Database Developer"],
        interview_stages=["Online Coding & Aptitude Test", "Technical Subject Matter Discussion", "System Design & Enterprise Integration", "Managerial & HR Interview"],
        website="https://jobs.sap.com",
    ),
    CompanyProfile(
        id="intuit",
        name="Intuit",
        industry="Financial Tech & Consumer Platforms",
        location="Mountain View, CA / Bengaluru / San Diego / Remote",
        description="Financial technology leader behind TurboTax, QuickBooks, and Credit Karma helping consumers and small businesses thrive.",
        tech_stack=["Java", "Kotlin", "TypeScript", "React", "AWS", "Kubernetes", "Spring Boot", "GraphQL", "NoSQL", "Docker"],
        roles=["Software Engineer", "Cloud Infrastructure Engineer", "Machine Learning Engineer", "Frontend Specialist"],
        interview_stages=["Craft Demonstration / Coding Screen", "System Architecture Round", "Data Structures & Algorithms", "Values & Customer Obsession Round"],
        website="https://intuit.com/careers",
    ),
    CompanyProfile(
        id="workday",
        name="Workday",
        industry="Enterprise Cloud HCM & Financials",
        location="Pleasanton, CA / Dublin, Ireland / Remote",
        description="Cloud applications leader for human resources, financial management, and workforce analytics with memory-resident architecture.",
        tech_stack=["Java", "Scala", "TypeScript", "React", "Python", "AWS", "MySQL", "Distributed Systems", "Kafka", "Microservices"],
        roles=["Software Development Engineer", "Cloud Infrastructure Architect", "UI Systems Developer", "Platform Automation Engineer"],
        interview_stages=["Recruiter Pre-screen", "Technical Coding Interview", "Architecture & Data Pipeline Design", "Values & Cross-functional Fit"],
        website="https://workday.com/careers",
    ),
    CompanyProfile(
        id="servicenow",
        name="ServiceNow",
        industry="Digital Workflows & Enterprise Automation",
        location="Santa Clara, CA / Hyderabad / Bengaluru / San Diego",
        description="Cloud-based enterprise platform automating digital workflows for enterprise operations, IT support, and customer service.",
        tech_stack=["Java", "JavaScript", "Python", "React", "MariaDB", "Linux", "Docker", "Kubernetes", "REST APIs", "Microservices"],
        roles=["Software Software Engineer", "Full Stack Cloud Developer", "Platform Reliability Engineer", "AI/ML Solutions Engineer"],
        interview_stages=["HackerRank Screening", "Core Algorithms Round", "Enterprise Workflow & Data Design Round", "Director Interview"],
        website="https://careers.servicenow.com",
    ),
    CompanyProfile(
        id="splunk",
        name="Splunk (Cisco)",
        industry="Observability & Security Analytics",
        location="San Francisco, CA / San Jose, CA / Remote",
        description="Leading data platform for security, observability, and machine data analytics powering modern Security Operations Centers (SOC).",
        tech_stack=["Go", "C++", "Python", "Java", "React", "Kafka", "Docker", "Kubernetes", "Distributed Systems", "Linux"],
        roles=["Software Development Engineer", "Observability Pipeline Developer", "Full Stack Cloud Engineer", "Core Engine Developer"],
        interview_stages=["Technical Screening", "Coding & Data Processing Round", "High-Throughput Streaming Design", "Team & Managerial Alignment"],
        website="https://splunk.com/en_us/careers.html",
    ),
    CompanyProfile(
        id="paloaltonetworks",
        name="Palo Alto Networks",
        industry="Cybersecurity & Cloud Network Protection",
        location="Santa Clara, CA / Bengaluru / Tel Aviv / Remote",
        description="Global cybersecurity leader delivering next-generation firewalls, cloud security (Prisma Cloud), and automated SecOps (Cortex).",
        tech_stack=["Python", "Go", "C", "C++", "AWS", "Kubernetes", "Linux", "Networking", "Microservices", "Docker"],
        roles=["Cloud Security Engineer", "Threat Intelligence Software Developer", "Backend Systems Engineer", "Network Firewall Specialist"],
        interview_stages=["Online Coding Test", "Technical Phone Screen", "Systems Security & Networking Architecture", "Director Panel Round"],
        website="https://jobs.paloaltonetworks.com",
    ),
    CompanyProfile(
        id="cloudflare",
        name="Cloudflare",
        industry="Edge Compute, CDN & Internet Security",
        location="San Francisco, CA / Austin, TX / London / Remote",
        description="Global web infrastructure company powering edge computing (Workers), DDoS protection, and ultra-fast content delivery.",
        tech_stack=["Rust", "Go", "TypeScript", "Lua", "C", "Linux", "Networking", "PostgreSQL", "BGP", "Kubernetes"],
        roles=["Systems Engineer", "Edge Platform Developer", "Network Protocols Engineer", "Security Operations Engineer"],
        interview_stages=["Recruiter Chat", "Take-Home Project or Live Coding", "Distributed Systems & Networking Deep Dive", "Founder / Senior Leadership Round"],
        website="https://cloudflare.com/careers",
    ),
    CompanyProfile(
        id="wipro",
        name="Wipro Limited",
        industry="IT Services & Digital Transformation Consulting",
        location="Bengaluru, India / Global Delivery Hubs / Hybrid",
        description="Global information technology and consulting corporation delivering enterprise cloud modernization, full-stack digital platforms, and cybersecurity services.",
        tech_stack=["Java", "Python", "C++", "React", "Angular", "Spring Boot", "SQL", "Cloud Platforms", "DevOps", "HTML", "CSS", "JavaScript"],
        roles=["Project Engineer", "Full Stack Developer", "Cloud Application Engineer", "Enterprise Systems Analyst"],
        interview_stages=["National Level Aptitude Assessment", "Coding & Technical Screening", "Technical Interview Round", "HR & Competency Discussion"],
        website="https://careers.wipro.com",
    ),
    CompanyProfile(
        id="tcs",
        name="Tata Consultancy Services (TCS)",
        industry="IT Services & Enterprise Consulting",
        location="Mumbai / Bengaluru / Hyderabad / Global",
        description="Multinational IT service consulting leader providing mission-critical enterprise engineering, cloud transformation, and application development.",
        tech_stack=["Java", "Python", "SQL", "Spring Boot", "React", "Node.js", "Docker", "Kubernetes", "Linux", "Database Systems"],
        roles=["Systems Engineer", "Digital Full Stack Engineer", "Technology Architect", "Cloud Automation Developer"],
        interview_stages=["TCS NQT Assessment", "Technical Coding Interview", "Managerial Architectural Round", "HR Assessment"],
        website="https://tcs.com/careers",
    ),
    CompanyProfile(
        id="infosys",
        name="Infosys",
        industry="Digital Services & Enterprise Consulting",
        location="Bengaluru / Pune / Hyderabad / Global",
        description="Global consulting and technology services leader enabling enterprises to navigate cloud-first and AI-driven digital modernization.",
        tech_stack=["Python", "Java", "JavaScript", "TypeScript", "SQL", "AWS", "Azure", "Microservices", "REST APIs", "Spring Boot"],
        roles=["Systems Engineer Specialist", "Full Stack Developer", "Technology Analyst", "Data Engineer"],
        interview_stages=["Online Technical & Aptitude Exam", "Hands-on Programming Round", "Technical Subject Matter Interview", "HR Evaluation"],
        website="https://infosys.com/careers",
    ),
    CompanyProfile(
        id="hcltech",
        name="HCLTech",
        industry="Digital Engineering & Global IT Services",
        location="Noida / Chennai / Bengaluru / Global",
        description="Global technology company helping enterprises reimagine business through digital, engineering, cloud, and AI solutions.",
        tech_stack=["Java", ".NET", "Python", "React", "Cloud", "Azure", "DevOps", "SQL", "Microservices", "Docker"],
        roles=["Software Engineer", "Lead Developer", "Cloud Migration Specialist", "DevOps Engineer"],
        interview_stages=["Online Technical Assessment", "Coding & Problem Solving Round", "Technical Subject Matter Discussion", "HR Discussion"],
        website="https://hcltech.com/careers",
    ),
    CompanyProfile(
        id="techmahindra",
        name="Tech Mahindra",
        industry="Telecom Services & Digital Solutions",
        location="Pune / Hyderabad / Bengaluru / Global",
        description="Provider of digital transformation, consulting, and business re-engineering services, specializing in telecommunication and 5G networks.",
        tech_stack=["Java", "Python", "C++", "5G", "Telecom Networks", "Cloud", "Angular", "Spring Boot", "SQL", "Linux"],
        roles=["Associate Software Engineer", "Telecom Systems Developer", "Full Stack Web Developer", "Network Engineer"],
        interview_stages=["Aptitude & Technical Screen", "Programming Assessment", "Technical Panel Interview", "HR Interaction"],
        website="https://techmahindra.com/careers",
    ),
    CompanyProfile(
        id="ltimindtree",
        name="LTIMindtree",
        industry="Global Technology Consulting & Enterprise Services",
        location="Mumbai / Bengaluru / Chennai / Global",
        description="Global technology consulting and digital solutions company enabling enterprises across diverse industries to build future-ready platforms.",
        tech_stack=["Java", "Python", "React", "Node.js", "AWS", "Azure", "Microservices", "SQL", "DevOps", "Docker"],
        roles=["Specialist Software Engineer", "Senior Systems Engineer", "Cloud Platform Developer", "Data Integration Engineer"],
        interview_stages=["Online Aptitude & Coding Test", "Technical Architecture Discussion", "Managerial Technical Evaluation", "HR Round"],
        website="https://ltimindtree.com/careers",
    ),
    CompanyProfile(
        id="cognizant",
        name="Cognizant Technology Solutions",
        industry="Digital Business & Enterprise Technology Modernization",
        location="Teaneck, NJ / Chennai / Bengaluru / Hyderabad / Global",
        description="Global professional services company modernizing technology, reimagining processes, and transforming experiences for enterprise clients.",
        tech_stack=["Java", "C#", "Python", "React", "Angular", "Spring Boot", "SQL", "AWS", "Azure", "Microservices"],
        roles=["Programmer Analyst", "Full Stack Specialist", "Cloud Application Developer", "Quality Engineering Developer"],
        interview_stages=["Cognizant GenC Assessment", "Technical Interview Round", "Managerial & Scenario Round", "HR Discussion"],
        website="https://cognizant.com/careers",
    ),
    CompanyProfile(
        id="accenture",
        name="Accenture",
        industry="Global Management & Enterprise Technology Services",
        location="Dublin, Ireland / Bengaluru / Chicago / Global",
        description="Global professional services powerhouse delivering digital, cloud, security, and enterprise AI transformation worldwide.",
        tech_stack=["Java", "Python", "React", "Node.js", "AWS", "Azure", "GCP", "SQL", "DevOps", "Salesforce"],
        roles=["Associate Software Engineer", "Application Development Senior Analyst", "Cloud Solutions Architect", "Full Stack Developer"],
        interview_stages=["Cognitive & Technical Assessment", "Coding Assessment Round", "Technical Competency Interview", "HR & Culture Round"],
        website="https://accenture.com/careers",
    ),
    CompanyProfile(
        id="mphasis",
        name="Mphasis",
        industry="Cloud & Cognitive Enterprise Solutions",
        location="Bengaluru / Pune / Chennai / New York",
        description="Information technology services company specializing in cloud and cognitive services for banking, capital markets, and insurance.",
        tech_stack=["Java", "Python", "Spring Boot", "React", "AWS", "Microservices", "SQL", "PostgreSQL", "Docker", "DevOps"],
        roles=["Associate Software Engineer", "Cloud DevOps Engineer", "Full Stack Developer", "Backend Systems Specialist"],
        interview_stages=["Online Aptitude & Coding Exam", "Technical Evaluation Round", "Architectural Review", "HR Competency Interview"],
        website="https://mphasis.com/careers",
    ),
    CompanyProfile(
        id="persistentsystems",
        name="Persistent Systems",
        industry="Digital Engineering & Enterprise Modernization",
        location="Pune / Bengaluru / Santa Clara, CA / Global",
        description="Digital engineering and enterprise modernization specialist building software products, platforms, and intelligent digital solutions.",
        tech_stack=["Java", "Python", "React", "Go", "AWS", "Azure", "Docker", "Kubernetes", "Microservices", "REST APIs"],
        roles=["Software Engineer", "Senior Platform Developer", "Cloud Solutions Specialist", "Product Engineering Analyst"],
        interview_stages=["Online Coding Assessment", "Hands-on Technical Round", "System Design & Code Quality Round", "HR Evaluation"],
        website="https://persistent.com/careers",
    ),
    CompanyProfile(
        id="zoho",
        name="Zoho Corporation",
        industry="Cloud Business Applications & SaaS Suite",
        location="Chennai / Austin, TX / Tenkasi / Global",
        description="Privately owned technology firm providing over 55+ web-based business applications, CRM, mail, and workplace software.",
        tech_stack=["Java", "C++", "Python", "JavaScript", "HTML", "CSS", "MySQL", "Linux", "Networking", "Algorithms"],
        roles=["Software Developer", "Quality Assurance Engineer", "Member Technical Staff", "Frontend Developer"],
        interview_stages=["Written Aptitude & Basic C/C++ Test", "Advanced Algorithmic Programming Round", "Application Design Round", "HR & Cultural Alignment"],
        website="https://zoho.com/careers",
    ),
    CompanyProfile(
        id="freshworks",
        name="Freshworks",
        industry="Customer Engagement & ITSM SaaS Platforms",
        location="San Mateo, CA / Chennai / Bengaluru / Remote",
        description="Creator of delightful enterprise software for IT service management (Freshservice) and customer support (Freshdesk).",
        tech_stack=["Ruby on Rails", "Java", "Python", "Node.js", "React", "AWS", "PostgreSQL", "Redis", "Kafka", "Docker"],
        roles=["Software Development Engineer (SDE)", "Frontend Engineer", "DevOps Platform Engineer", "Data Platform Engineer"],
        interview_stages=["HackerEarth Coding Screen", "Data Structures & Problem Solving", "System Architecture & API Design", "Values & Culture Round"],
        website="https://freshworks.com/careers",
    ),
    CompanyProfile(
        id="swiggy",
        name="Swiggy",
        industry="Hyperlocal On-Demand Logistics & Delivery",
        location="Bengaluru, India / Remote",
        description="India's leading on-demand convenience platform connecting millions of consumers with restaurants, grocery stores, and dine-in experiences.",
        tech_stack=["Go", "Java", "Python", "React Native", "Kafka", "AWS", "DynamoDB", "PostgreSQL", "Docker", "Kubernetes"],
        roles=["Software Development Engineer (SDE I/II/III)", "Engineering Manager", "Data Scientist", "DevOps Architect"],
        interview_stages=["Online Machine Coding Test", "Data Structures & Algorithms Screen", "High-Throughput Low-Latency System Design", "Hiring Manager Fit"],
        website="https://careers.swiggy.com",
    ),
    CompanyProfile(
        id="zomato",
        name="Zomato",
        industry="Food Delivery & High-Throughput Consumer App",
        location="Gurugram, India / Remote",
        description="Online food ordering, restaurant discovery, and quick-commerce platform serving millions of active users daily.",
        tech_stack=["Python", "Go", "PHP", "React Native", "PostgreSQL", "Redis", "AWS", "Kafka", "Microservices", "Elasticsearch"],
        roles=["Software Engineer", "Backend Architect", "Mobile Developer", "Infrastructure Engineer"],
        interview_stages=["Technical Coding Assignment", "System Design & Scalability Round", "Live Problem Solving Interview", "Founder / VP Engineering Round"],
        website="https://zomato.com/careers",
    ),
    CompanyProfile(
        id="razorpay",
        name="Razorpay",
        industry="Fintech Payment Gateway & Banking Platform",
        location="Bengaluru, India / Remote",
        description="Leading Indian fintech platform powering digital payments, neo-banking accounts, and payroll automation for businesses.",
        tech_stack=["Go", "PHP", "Python", "Node.js", "React", "MySQL", "AWS", "Kafka", "Docker", "Kubernetes"],
        roles=["Software Development Engineer", "Security Software Engineer", "Platform Architect", "Frontend Engineer"],
        interview_stages=["Online Coding Test", "Data Structures & Algorithms", "Financial Transaction Concurrency & System Design", "Culture Fit Interview"],
        website="https://razorpay.com/jobs",
    ),
    CompanyProfile(
        id="flipkart",
        name="Flipkart",
        industry="E-Commerce Platform & Supply Chain Logistics",
        location="Bengaluru, India / Remote",
        description="Pioneer in Indian e-commerce, operating massive warehouse logistics, flash-sale traffic handling, and supply chain tracking.",
        tech_stack=["Java", "Python", "C++", "Kafka", "HBase", "MySQL", "React", "Docker", "Kubernetes", "Distributed Systems"],
        roles=["Software Development Engineer (SDE I/II)", "Data Platform Engineer", "Site Reliability Engineer", "Frontend Developer"],
        interview_stages=["Machine Coding Round", "Problem Solving & Algorithms", "System Architecture & Fault Tolerance", "Hiring Manager Round"],
        website="https://flipkartcareers.com",
    ),
    CompanyProfile(
        id="paytm",
        name="Paytm (One97 Communications)",
        industry="Digital Payments & Financial Services",
        location="Noida, India / Bengaluru / Remote",
        description="Pioneer in digital payments, Soundbox IoT point-of-sale terminals, and mobile financial services in India.",
        tech_stack=["Java", "Node.js", "Python", "React", "Oracle", "MySQL", "AWS", "Kafka", "Redis", "Microservices"],
        roles=["Software Engineer", "Senior Backend Engineer", "Mobile Software Developer", "Platform Security Specialist"],
        interview_stages=["Online Coding Screen", "Core Algorithms & Concurrency", "Payment Processing Architecture Round", "Leadership Round"],
        website="https://paytm.com/careers",
    ),
    CompanyProfile(
        id="jio",
        name="Jio Platforms Limited",
        industry="Telecommunications & Digital Services Ecosystem",
        location="Navi Mumbai / Bengaluru / Hyderabad / Remote",
        description="Digital services ecosystem powering India's largest 4G/5G mobile telecom network, streaming apps, cloud, and digital commerce.",
        tech_stack=["Java", "Python", "C++", "5G", "Kubernetes", "Docker", "Angular", "React", "PostgreSQL", "Cloud Native"],
        roles=["Member Technical Staff", "Cloud Network Engineer", "Full Stack Developer", "Data Engineering Specialist"],
        interview_stages=["Online Assessment", "Technical Coding & Systems Screen", "Telecom Cloud Architecture Round", "HR & Management Discussion"],
        website="https://jio.com/careers",
    ),
    CompanyProfile(
        id="cred",
        name="CRED",
        industry="Fintech Rewards & Credit Card Platform",
        location="Bengaluru, India / Remote",
        description="High-trust community of creditworthy individuals offering bill payments, rewards, and peer-to-peer lending platforms.",
        tech_stack=["Go", "Java", "React Native", "Kafka", "PostgreSQL", "AWS", "Docker", "Kubernetes", "Redis", "Microservices"],
        roles=["Software Engineer", "Backend Craftsman", "Mobile Developer", "Infrastructure Engineer"],
        interview_stages=["Craft & Code Quality Screening", "Data Structures & Concurrency", "System Design & Clean Architecture", "Values & Cultural Alignment"],
        website="https://cred.club/careers",
    ),
    CompanyProfile(
        id="dell",
        name="Dell Technologies",
        industry="Enterprise Infrastructure, Storage & Hybrid Cloud",
        location="Round Rock, TX / Bengaluru / Hopkinton, MA / Remote",
        description="Global provider of end-to-end computing infrastructure, enterprise servers (PowerEdge), storage arrays, and VMware integrations.",
        tech_stack=["C++", "Python", "Java", "Go", "Linux", "Kubernetes", "Docker", "Cloud", "Storage Systems", "REST APIs"],
        roles=["Software Principal Engineer", "Cloud Storage Developer", "Full Stack Systems Engineer", "Embedded Firmware Engineer"],
        interview_stages=["Online Technical Test", "Core C++/Python Systems Programming", "Enterprise Storage Architecture Round", "HR & Behavioral Discussion"],
        website="https://jobs.dell.com",
    ),
]


def _normalize_skill(skill: str) -> str:
    """Normalizes skill terms for robust matching (e.g., 'react.js' -> 'react')."""
    s = skill.lower().strip()
    s = re.sub(r'(\.js|js)$', '', s)
    s = re.sub(r'[^a-z0-9#+]', '', s)
    return s


def list_companies(query: Optional[str] = None) -> List[CompanyProfile]:
    """
    Returns catalogue companies, optionally filtered by name, industry, location, or tech stack query.
    """
    if not query or not query.strip():
        return VERIFIED_COMPANIES_CATALOGUE

    q = query.strip().lower()
    results = []
    for company in VERIFIED_COMPANIES_CATALOGUE:
        name_match = q in company.name.lower()
        industry_match = q in company.industry.lower()
        location_match = q in company.location.lower()
        desc_match = q in company.description.lower()
        stack_match = any(q in tech.lower() for tech in company.tech_stack)
        role_match = any(q in role.lower() for role in company.roles)

        if name_match or industry_match or location_match or desc_match or stack_match or role_match:
            results.append(company)

    return results


def get_company_by_id(company_id: str) -> Optional[CompanyProfile]:
    """Retrieves a single company profile by its ID slug."""
    cid = company_id.strip().lower()
    for company in VERIFIED_COMPANIES_CATALOGUE:
        if company.id == cid:
            return company
    return None


def match_companies_by_skills(skills: List[str]) -> CompanyMatchResponse:
    """
    Compares candidate skills against company tech stacks and returns ranked matches.
    """
    if not skills:
        return CompanyMatchResponse(items=[], matches=[], total=0, total_matches=0, total_input_skills=0)

    # Normalize input skills
    cleaned_candidate_skills = {
        _normalize_skill(s): s.strip() for s in skills if s and s.strip()
    }

    results: List[CompanyMatchResult] = []

    for company in VERIFIED_COMPANIES_CATALOGUE:
        matched_original_names: List[str] = []

        for comp_tech in company.tech_stack:
            norm_comp_tech = _normalize_skill(comp_tech)
            for norm_cand, orig_cand in cleaned_candidate_skills.items():
                if norm_comp_tech == norm_cand or (len(norm_cand) >= 3 and norm_cand in norm_comp_tech) or (len(norm_comp_tech) >= 3 and norm_comp_tech in norm_cand):
                    if comp_tech not in matched_original_names:
                        matched_original_names.append(comp_tech)

        if matched_original_names:
            # Score based on proportion of company's tech stack covered
            match_pct = min(100, int((len(matched_original_names) / max(1, len(company.tech_stack))) * 100))
            # Ensure at least a realistic threshold rating
            match_pct = max(match_pct, min(95, len(matched_original_names) * 15))

            missing_skills = [t for t in company.tech_stack if t not in matched_original_names]

            results.append(
                CompanyMatchResult(
                    company=company,
                    matched_skills=matched_original_names,
                    missing_skills=missing_skills,
                    match_percentage=match_pct,
                    match_score=match_pct,
                    recommended_roles=company.roles[:2],
                )
            )

    # Sort results by match percentage descending
    results.sort(key=lambda r: r.match_percentage, reverse=True)

    return CompanyMatchResponse(
        items=results,
        matches=results,
        total=len(results),
        total_matches=len(results),
        total_input_skills=len(cleaned_candidate_skills),
    )
