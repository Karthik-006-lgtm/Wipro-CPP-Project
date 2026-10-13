import React, { useState, useEffect, useRef } from 'react';
import {
  Code,
  Video,
  Building2,
  Play,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Download,
  Camera,
  Square,
  Sparkles,
  Bookmark,
  Mic,
  MicOff,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Terminal,
  Search,
  Send,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Layers,
  Check,
  X,
} from 'lucide-react';
import { apiClient, ApiClientError } from '../api/client';
import {
  CodingLanguage,
  CodingProblem,
  CodeExecutionResponse,
  CodeSubmitResponse,
  VideoAuditResponse,
  PreparationRecordCreate,
  PortalSectionId,
} from '../types';

type DomainTab = 'coding' | 'video' | 'company';
type VideoMode = 'technical' | 'non_technical';
type DrillMode = 'technical' | 'non_technical';
type DrillInputMethod = 'typed' | 'speech';

interface InterviewPrepProps {
  onNavigate?: (section: PortalSectionId) => void;
}

// 10 Curated Technical Questions for Video Practice
const TECHNICAL_VIDEO_QUESTIONS = [
  {
    title: 'Distributed Caching & Invalidation',
    prompt: 'Explain how you design a resilient caching strategy for a high-traffic microservices application. What invalidation mechanisms (e.g. write-through, cache-aside, CDC) do you choose and how do you handle cache stampedes?',
    tip: 'Mention Redis cluster setups, TTL strategies, Bloom filters, and mutex locking to prevent thundering herds.',
  },
  {
    title: 'Database Performance Under Extreme Load',
    prompt: 'Walk through your diagnostic process when database p99 query latency spikes under high concurrent read traffic. How do you isolate the bottleneck and mitigate it in production?',
    tip: 'Discuss execution plans, index cardinality, connection pooling limits, read replicas, and query optimization.',
  },
  {
    title: 'Algorithmic Complexity & Trade-offs',
    prompt: 'Describe a complex data structure or algorithmic problem you solved recently in a production codebase. What were the theoretical time and space complexities versus practical real-world trade-offs?',
    tip: 'Focus on Big-O analysis, CPU cache locality, memory footprint, and maintainability.',
  },
  {
    title: 'Distributed Consistency & Idempotency',
    prompt: 'How do you guarantee data consistency and idempotent operations across multiple microservices when distributed network partitions or message delivery retries occur?',
    tip: 'Reference idempotency keys, outbox pattern, saga orchestrations, and eventual consistency boundaries.',
  },
  {
    title: 'Monolith vs. Microservices Architecture',
    prompt: 'Under what specific system constraints would you advocate splitting a monolithic service into microservices, and when would you strongly argue against it?',
    tip: 'Evaluate team size, release velocity, failure domain isolation vs network overhead and distributed tracing complexity.',
  },
  {
    title: 'Memory Leaks & Profiling',
    prompt: 'Describe how you detect, reproduce, and fix memory leaks or event loop lag in backend runtime services.',
    tip: 'Mention heap snapshots, allocation instrumentation, GC cycle analysis, and profiling flamegraphs.',
  },
  {
    title: 'Concurrency Control: Optimistic vs. Pessimistic',
    prompt: 'Contrast optimistic locking (version timestamps) with pessimistic locking (SELECT FOR UPDATE) in relational database transactions. In what business scenarios is each optimal?',
    tip: 'Discuss conflict probability, lock contention overhead, deadlocks, and retry loops.',
  },
  {
    title: 'Security, TLS & Infrastructure Handshakes',
    prompt: 'Walk through the security handshake sequence in modern HTTPS/TLS 1.3 and explain how zero-trust service meshes secure inter-service communication.',
    tip: 'Address asymmetric key exchange, symmetric session keys, mTLS, and automated certificate renewal.',
  },
  {
    title: 'API Rate Limiting & Abuse Defense',
    prompt: 'How would you architect a distributed rate-limiting service capable of evaluating millions of incoming requests per second with sub-millisecond overhead?',
    tip: 'Discuss token bucket vs sliding window algorithms, Redis cluster atomic Lua scripts, and client headers (429 Retry-After).',
  },
  {
    title: 'Zero-Downtime Deployment Strategies',
    prompt: 'How do you design a robust CI/CD deployment pipeline that guarantees zero downtime and provides automated canary analysis with instant rollback triggers?',
    tip: 'Cover blue-green vs canary deployments, traffic splitting, automated synthetic smoke testing, and database schema migration compatibility.',
  },
];

// 10 Curated Non-Technical Questions for Video Practice
const NON_TECHNICAL_VIDEO_QUESTIONS = [
  {
    title: 'Navigating Technical Disagreements',
    prompt: 'Tell me about a time you strongly disagreed with a senior engineer or architect regarding a technical decision. How did you advocate for your point of view, and what was the resolution?',
    tip: 'Emphasize data-driven arguments, respectful technical trade-off documents (RFCs), and commitment to the final consensus.',
  },
  {
    title: 'Managing Production Incidents & Communication',
    prompt: 'Describe a situation where a bug or outage occurred in production under your watch. How did you communicate with engineering leadership, manage client impact, and conduct the blameless post-mortem?',
    tip: 'Highlight transparent stakeholder communication, clear incident roles, root cause analysis (5 Whys), and preventative action items.',
  },
  {
    title: 'Mid-Flight Shifting Priorities',
    prompt: 'Walk me through a project where product requirements or company priorities shifted significantly midway through execution. How did you reprioritize deliverables and keep your team aligned?',
    tip: 'Demonstrate adaptability, transparent backlog grooming, proactive scope negotiation, and maintaining quality standards.',
  },
  {
    title: 'Delivering Under Ambiguity and Deadlines',
    prompt: 'Tell me about a critical milestone you had to deliver with tight deadlines and ambiguous requirements. How did you establish confidence in your deliverables?',
    tip: 'Show how you broke down milestones, created early proof-of-concepts, gathered stakeholder feedback, and de-risked assumptions.',
  },
  {
    title: 'Constructive Peer Code Reviews',
    prompt: 'How do you foster a collaborative and constructive code review culture, especially when providing critical feedback to junior or peer developers?',
    tip: 'Talk about separating identity from code, explaining the "why", praising clean implementations, and pairing when appropriate.',
  },
  {
    title: 'Advocating for Technical Debt Remediation',
    prompt: 'Describe a time you successfully persuaded product managers or non-technical business leaders to allocate engineering sprints toward technical debt and platform refactoring.',
    tip: 'Connect technical debt directly to business outcomes: feature velocity, uptime SLAs, infrastructure cost, and developer morale.',
  },
  {
    title: 'Cross-Functional Collaboration',
    prompt: 'Tell me about a time you worked closely with non-technical stakeholders (e.g. Design, Sales, Customer Success). How did you bridge the technical communication gap?',
    tip: 'Focus on empathy, avoiding jargon, using visual mockups or user journeys, and understanding their business metrics.',
  },
  {
    title: 'Proudest Engineering Milestone',
    prompt: 'What engineering achievement or project are you proudest of in your career so far? What was your specific individual contribution, and what impact did it have?',
    tip: 'Use the STAR format: specify measurable impact (e.g. reduced latency by 40%, saved $50k/mo, or on-boarded 100k users).',
  },
  {
    title: 'Learning From Project Failures',
    prompt: 'Describe a project, architecture proposal, or initiative you led that did not achieve its intended objectives. What did you learn, and how did it change your engineering leadership?',
    tip: 'Demonstrate humility, intellectual honesty, ownership without defensiveness, and lasting systemic improvements.',
  },
  {
    title: 'Engineering Growth & Career Aspirations',
    prompt: 'Where do you see yourself contributing most effectively as a software engineer over the next 2-3 years? What technical and leadership domains are you focused on expanding?',
    tip: 'Align your personal growth goals with engineering excellence, technical mentorship, and high-impact business contributions.',
  },
];

// Verified Companies for Drills
const DRILL_COMPANIES = [
  { name: 'Google', slug: 'google', tech: ['Go', 'C++', 'Java', 'Python', 'Kubernetes'], stages: ['Online Assessment', 'Technical Coding Screen', 'System Design Round', 'Googleyness & Leadership'] },
  { name: 'Microsoft', slug: 'microsoft', tech: ['C#', 'TypeScript', 'Azure', 'C++', 'React'], stages: ['Codility Screen', 'Algorithm & DS Round', 'Cloud Architecture Round', 'As-Appropriate (AA) Interview'] },
  { name: 'Amazon', slug: 'amazon', tech: ['Java', 'Python', 'AWS', 'DynamoDB', 'Distributed Systems'], stages: ['OA1/OA2 Assessment', 'Data Structures & Algorithms', 'System Architecture', 'Bar Raiser (Leadership Principles)'] },
  { name: 'Stripe', slug: 'stripe', tech: ['Ruby', 'Java', 'TypeScript', 'PostgreSQL', 'Kafka'], stages: ['Take-home / Live Coding', 'Integration & Debugging', 'API Design & Architecture', 'Values & Team Fit'] },
  { name: 'Wipro', slug: 'wipro', tech: ['Java', 'Spring Boot', 'React', 'Oracle', 'Microservices'], stages: ['National Qualifier / Coding Test', 'Technical Interview 1', 'Client Solutioning Round', 'HR & Cultural Alignment'] },
  { name: 'TCS', slug: 'tcs', tech: ['Java', 'Python', 'Angular', 'SQL', 'Cloud Native'], stages: ['TCS NQT Algorithmic Test', 'Technical Specialist Round', 'Managerial Technical Round', 'HR Interview'] },
  { name: 'Infosys', slug: 'infosys', tech: ['Java', 'Spring', 'Python', 'AWS', 'Microservices'], stages: ['InfyTQ Technical Assessment', 'Technical Coding Interview', 'System Design & Problem Solving', 'HR Discussion'] },
];

export const InterviewPrep: React.FC<InterviewPrepProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<DomainTab>('coding');

  // ==========================================
  // SUBSECTION 1: CODING SANDBOX STATE
  // ==========================================
  const [languages, setLanguages] = useState<CodingLanguage[]>([]);
  const [selectedLanguageId, setSelectedLanguageId] = useState<number>(71); // Python 3 default
  const [problems, setProblems] = useState<CodingProblem[]>([]);
  const [selectedProblemId, setSelectedProblemId] = useState<string>('two-sum');
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('All Topics');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [problemSearch, setProblemSearch] = useState<string>('');
  const [sourceCode, setSourceCode] = useState<string>('');
  const [stdinInput, setStdinInput] = useState<string>('');
  const [showStdin, setShowStdin] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<CodeExecutionResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitResult, setSubmitResult] = useState<CodeSubmitResponse | null>(null);
  const [consoleTab, setConsoleTab] = useState<'run' | 'submit'>('run');
  const [showHints, setShowHints] = useState<boolean>(false);
  const [codingError, setCodingError] = useState<string | null>(null);

  // Helper to get starter template for a problem and language
  const getProblemStarter = (prob: CodingProblem, langId: number) => {
    const lang = languages.find((l) => l.id === langId);
    const key = lang?.key || 'python';
    return prob.starter_code?.[key] || lang?.starter_template || '';
  };

  // ==========================================
  // SUBSECTION 2: VIDEO INTERVIEW PRACTICE STATE
  // ==========================================
  const [videoCompany, setVideoCompany] = useState<string>('Google');
  const [videoMode, setVideoMode] = useState<VideoMode>('technical');
  const [currentVideoQIndex, setCurrentVideoQIndex] = useState<number>(0);
  const [isMediaActive, setIsMediaActive] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [recordedMimeType, setRecordedMimeType] = useState<string>('video/webm');
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [userTranscriptInput, setUserTranscriptInput] = useState<string>('');
  const [isAuditingVideo, setIsAuditingVideo] = useState<boolean>(false);
  const [videoAuditResult, setVideoAuditResult] = useState<VideoAuditResponse | null>(null);

  // ==========================================
  // SUBSECTION 3: COMPANY-SPECIFIC DRILLS STATE
  // ==========================================
  const [drillCompany, setDrillCompany] = useState<string>('Google');
  const [drillMode, setDrillMode] = useState<DrillMode>('technical');
  const [currentDrillIndex, setCurrentDrillIndex] = useState<number>(0);
  const [drillInputMethod, setDrillInputMethod] = useState<DrillInputMethod>('typed');
  const [drillAnswer, setDrillAnswer] = useState<string>('');
  const [isListeningSpeech, setIsListeningSpeech] = useState<boolean>(false);
  const [speechTranscriptPreview, setSpeechTranscriptPreview] = useState<string>('');
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [drillFeedback, setDrillFeedback] = useState<{
    score: number;
    strengths: string[];
    improvements: string[];
    verdict: string;
  } | null>(null);
  const [isEvaluatingDrill, setIsEvaluatingDrill] = useState<boolean>(false);

  // Persistence Status
  const [isSavingRecord, setIsSavingRecord] = useState<boolean>(false);
  const [saveStatusMessage, setSaveStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Media references
  const videoLiveRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Initial loading of coding metadata and initial clean state
  useEffect(() => {
    let isMounted = true;
    async function loadMeta() {
      try {
        const [langs, topicsList, probs] = await Promise.all([
          apiClient.getCodingLanguages(),
          apiClient.getCodingTopics(),
          apiClient.getCodingProblems(),
        ]);
        if (isMounted) {
          setLanguages(langs);
          setTopics(topicsList);
          setProblems(probs);
          if (probs.length > 0) {
            setSelectedProblemId(probs[0].id);
            const starter = probs[0].starter_code?.['python'] || langs.find(l => l.id === 71)?.starter_template || '';
            setSourceCode(starter);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setCodingError('Could not communicate with backend coding endpoints.');
        }
      }
    }
    loadMeta();

    // Check if user came from Company Details with pre-selected company
    try {
      const storedCompany = sessionStorage.getItem('selectedInterviewCompany');
      if (storedCompany) {
        setDrillCompany(storedCompany);
      }
    } catch {
      // Ignore storage errors
    }

    // Check Speech Recognition capability
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRec);

    return () => {
      isMounted = false;
      cleanupMediaStream();
      stopSpeechRecognition();
    };
  }, []);

  // When changing problems, populate starter code for current language
  const handleProblemChange = (probId: string) => {
    setSelectedProblemId(probId);
    setExecutionResult(null);
    setSubmitResult(null);
    setCodingError(null);
    setShowHints(false);
    const prob = problems.find((p) => p.id === probId);
    if (prob) {
      setSourceCode(getProblemStarter(prob, selectedLanguageId));
    }
  };

  const handleLanguageChange = (langId: number) => {
    setSelectedLanguageId(langId);
    setExecutionResult(null);
    setSubmitResult(null);
    setCodingError(null);
    const prob = problems.find((p) => p.id === selectedProblemId);
    if (prob) {
      setSourceCode(getProblemStarter(prob, langId));
    }
  };

  const handleResetStarter = () => {
    const prob = problems.find((p) => p.id === selectedProblemId);
    if (prob) {
      setSourceCode(getProblemStarter(prob, selectedLanguageId));
    } else {
      setSourceCode('');
    }
  };

  // Run Code with optional standard input
  const handleRunCode = async () => {
    if (!sourceCode.trim()) {
      setCodingError('Code editor is currently empty. Please write your solution before running.');
      return;
    }

    setIsExecuting(true);
    setCodingError(null);
    setExecutionResult(null);
    setConsoleTab('run');

    try {
      const res = await apiClient.executeCode({
        source_code: sourceCode,
        language_id: selectedLanguageId,
        stdin: showStdin ? stdinInput : undefined,
        problem_id: selectedProblemId,
      });
      setExecutionResult(res);
    } catch (err: any) {
      setCodingError(err instanceof ApiClientError ? err.message : 'Execution failed connecting to backend.');
    } finally {
      setIsExecuting(false);
    }
  };

  // Submit Code against automated test suite
  const handleSubmitCode = async () => {
    if (!sourceCode.trim()) {
      setCodingError('Code editor is currently empty. Please write your solution before submitting.');
      return;
    }

    setIsSubmitting(true);
    setCodingError(null);
    setSubmitResult(null);
    setConsoleTab('submit');

    try {
      const res = await apiClient.submitCode({
        source_code: sourceCode,
        language_id: selectedLanguageId,
        problem_id: selectedProblemId,
      });
      setSubmitResult(res);
    } catch (err: any) {
      setCodingError(err instanceof ApiClientError ? err.message : 'Submission failed connecting to backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Media Stream Cleanup
  const cleanupMediaStream = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoLiveRef.current) {
      videoLiveRef.current.srcObject = null;
    }
    setIsMediaActive(false);
    setIsRecording(false);
  };

  // Start Camera
  const handleStartCamera = async () => {
    setMediaError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support mediaDevices.getUserMedia video capture.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: true,
      });
      mediaStreamRef.current = stream;
      setIsMediaActive(true);
      if (videoLiveRef.current) {
        videoLiveRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setMediaError(err?.message || 'Camera or microphone access was denied.');
      setIsMediaActive(false);
    }
  };

  // Start Recording
  const handleStartRecording = () => {
    if (!mediaStreamRef.current) return;
    setMediaError(null);
    setRecordedBlobUrl(null);
    setVideoAuditResult(null);
    recordedChunksRef.current = [];

    let chosenMime = 'video/webm';
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
      chosenMime = 'video/webm;codecs=vp9,opus';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
      chosenMime = 'video/webm;codecs=vp8,opus';
    } else if (MediaRecorder.isTypeSupported('video/mp4')) {
      chosenMime = 'video/mp4';
    }
    setRecordedMimeType(chosenMime);

    try {
      const recorder = new MediaRecorder(mediaStreamRef.current, { mimeType: chosenMime });
      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const fullBlob = new Blob(recordedChunksRef.current, { type: chosenMime });
        const url = URL.createObjectURL(fullBlob);
        setRecordedBlobUrl(url);
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setMediaError(`Failed to initialize MediaRecorder: ${err?.message}`);
    }
  };

  // Stop Recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  const handleDiscardRecording = () => {
    if (recordedBlobUrl) {
      URL.revokeObjectURL(recordedBlobUrl);
    }
    setRecordedBlobUrl(null);
    setVideoAuditResult(null);
    setRecordingSeconds(0);
  };

  const handleDownloadRecording = () => {
    if (!recordedBlobUrl) return;
    const a = document.createElement('a');
    a.href = recordedBlobUrl;
    const ext = recordedMimeType.includes('mp4') ? 'mp4' : 'webm';
    a.download = `video-practice-${videoMode}-${new Date().toISOString().slice(0, 10)}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleAuditVideo = async () => {
    setIsAuditingVideo(true);
    try {
      const audit = await apiClient.auditVideo({
        duration_seconds: Math.max(1, recordingSeconds),
        recorded_format: recordedMimeType,
        transcript_input: userTranscriptInput,
      });
      setVideoAuditResult(audit);
    } catch (err: any) {
      setMediaError('Failed to run technical video audit.');
    } finally {
      setIsAuditingVideo(false);
    }
  };

  // Web Speech API handler for Company Drills
  const startSpeechRecognition = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListeningSpeech(true);
        setSpeechTranscriptPreview('');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript + ' ';
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        if (final) {
          setDrillAnswer((prev) => (prev ? `${prev} ${final.trim()}` : final.trim()));
        }
        setSpeechTranscriptPreview(interim);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListeningSpeech(false);
      };

      recognition.onend = () => {
        setIsListeningSpeech(false);
        setSpeechTranscriptPreview('');
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Could not start speech recognition:', err);
      setIsListeningSpeech(false);
    }
  };

  const stopSpeechRecognition = () => {
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      speechRecognitionRef.current = null;
    }
    setIsListeningSpeech(false);
  };

  // Evaluate Drill Answer
  const handleEvaluateDrill = () => {
    if (!drillAnswer.trim()) return;
    setIsEvaluatingDrill(true);

    setTimeout(() => {
      const words = drillAnswer.trim().split(/\s+/).length;
      let score = 70;
      const strengths: string[] = [];
      const improvements: string[] = [];

      if (words > 60) {
        score += 15;
        strengths.push('Provided substantial technical context and clear situational detail.');
      } else {
        improvements.push('Answer is somewhat brief; elaborate further on your technical decisions or STAR results.');
      }

      if (drillMode === 'technical') {
        if (/complexity|performance|architecture|scale|latency|database|cache|async/i.test(drillAnswer)) {
          score += 10;
          strengths.push('Strong reference to architectural metrics and systemic trade-offs.');
        } else {
          improvements.push('Consider incorporating concrete Big-O, scaling, or operational metrics into your response.');
        }
      } else {
        if (/team|impact|customer|result|collaborat|learn|resolv/i.test(drillAnswer)) {
          score += 10;
          strengths.push('Effective articulation of teamwork, stakeholder communication, and positive business outcome.');
        } else {
          improvements.push('Highlight the specific quantifiable impact and lessons learned more distinctly.');
        }
      }

      setDrillFeedback({
        score: Math.min(100, score),
        strengths,
        improvements,
        verdict: score >= 80 ? 'Exceeds Interview Bar' : score >= 65 ? 'Solid Foundation — Refine Depth' : 'Needs More Structured Detail',
      });
      setIsEvaluatingDrill(false);
    }, 600);
  };

  // Save to Preparation Records
  const handleSaveSession = async (payload: PreparationRecordCreate) => {
    setIsSavingRecord(true);
    setSaveStatusMessage(null);
    try {
      const res = await apiClient.createPreparationRecord(payload);
      setSaveStatusMessage({
        type: 'success',
        text: `Saved "${res.title}" to Preparation Records! (Record ID: #${res.id})`,
      });
    } catch (err: any) {
      if (err instanceof ApiClientError && err.status === 503) {
        setSaveStatusMessage({
          type: 'error',
          text: 'Database is unconfigured or unreachable. Configure DATABASE_URL in backend/.env to persist records.',
        });
      } else {
        setSaveStatusMessage({
          type: 'error',
          text: err instanceof ApiClientError ? err.message : 'Failed to save preparation record.',
        });
      }
    } finally {
      setIsSavingRecord(false);
    }
  };

  // Helper to save Coding Session
  const handleSaveCodingSession = () => {
    const prob = problems.find((p) => p.id === selectedProblemId);
    const lang = languages.find((l) => l.id === selectedLanguageId);
    const probTitle = prob?.title || selectedProblemId;
    const langName = lang?.name || `Language ${selectedLanguageId}`;

    let status = 'Draft Attempt';
    let score = 50;
    if (submitResult) {
      if (submitResult.status === 'accepted') {
        status = 'Accepted (All Tests Passed)';
        score = 100;
      } else if (submitResult.status === 'wrong_answer') {
        status = `Wrong Answer (${submitResult.passed_count}/${submitResult.total_count} Passed)`;
        score = Math.round((submitResult.passed_count / Math.max(1, submitResult.total_count)) * 80);
      } else if (submitResult.status === 'compilation_error') {
        status = 'Compilation Error';
        score = 25;
      } else if (submitResult.status === 'runtime_error') {
        status = 'Runtime Error';
        score = 30;
      }
    } else if (executionResult) {
      if (executionResult.status === 'completed' && executionResult.exit_code === 0) {
        status = 'Passed Execution';
        score = 90;
      } else if (executionResult.status === 'runtime_error' || (executionResult.status === 'completed' && executionResult.exit_code !== 0)) {
        status = 'Runtime Error';
        score = 50;
      } else if (executionResult.status === 'compilation_error') {
        status = 'Compilation Error';
        score = 25;
      } else if (executionResult.status === 'configuration_missing') {
        status = 'Sandbox Offline';
        score = 50;
      }
    }

    handleSaveSession({
      practice_type: 'coding',
      title: `Coding Sandbox: ${probTitle} (${langName})`,
      category: prob?.difficulty || 'Algorithm',
      status,
      summary: `Attempted ${probTitle} in ${langName}. Source size: ${sourceCode.length} chars.${submitResult ? ` Result: ${submitResult.status} (${submitResult.passed_count}/${submitResult.total_count} passed).` : ''}`,
      score,
      session_metadata: {
        problem_id: selectedProblemId,
        problem_title: probTitle,
        difficulty: prob?.difficulty || 'Medium',
        language_id: selectedLanguageId,
        language_name: langName,
        source_code: sourceCode,
        stdin: showStdin ? stdinInput : null,
        execution_result: executionResult,
        submit_result: submitResult,
        timestamp: new Date().toISOString(),
      },
    });
  };

  // Helper to save Video Session
  const handleSaveVideoSession = () => {
    const qList = videoMode === 'technical' ? TECHNICAL_VIDEO_QUESTIONS : NON_TECHNICAL_VIDEO_QUESTIONS;
    const currentQ = qList[currentVideoQIndex];
    const duration = recordingSeconds > 0 ? `${recordingSeconds}s` : 'Unrecorded';

    handleSaveSession({
      practice_type: 'video',
      title: `Video Practice [${videoCompany}]: ${currentQ.title} (${videoMode === 'technical' ? 'Technical' : 'Non-Technical'})`,
      category: videoMode === 'technical' ? 'Technical Architecture' : 'Behavioral STAR',
      status: recordedBlobUrl ? 'Recorded & Audited' : 'Notes Only',
      summary: `Target: ${videoCompany}. Answered Question ${currentVideoQIndex + 1}/10: "${currentQ.title}". Duration: ${duration}.`,
      score: videoAuditResult ? 85 : 75,
      session_metadata: {
        company: videoCompany,
        mode: videoMode,
        question_index: currentVideoQIndex,
        question_title: currentQ.title,
        question_prompt: currentQ.prompt,
        duration_seconds: recordingSeconds,
        transcript_notes: userTranscriptInput,
        format: recordedMimeType,
        audit_result: videoAuditResult,
        timestamp: new Date().toISOString(),
      },
    });
  };

  // Helper to save Company Drill Session
  const handleSaveDrillSession = () => {
    const questions = getCompanyDrillQuestions();
    const currentQ = questions[currentDrillIndex];

    handleSaveSession({
      practice_type: 'company',
      title: `${drillCompany} Drill: ${currentQ.title} (${drillMode === 'technical' ? 'Technical' : 'Cultural'})`,
      category: drillCompany,
      status: drillFeedback ? 'Evaluated Drill' : 'Completed Drill',
      summary: `Drill for ${drillCompany} (${drillMode}) via ${drillInputMethod}. Score: ${drillFeedback?.score || 75}%.`,
      score: drillFeedback?.score || 75,
      session_metadata: {
        company: drillCompany,
        drill_mode: drillMode,
        input_method: drillInputMethod,
        question_index: currentDrillIndex,
        question_title: currentQ.title,
        question_prompt: currentQ.prompt,
        answer: drillAnswer,
        feedback: drillFeedback,
        timestamp: new Date().toISOString(),
      },
    });
  };

  // Current Video Questions
  const videoQuestions = videoMode === 'technical' ? TECHNICAL_VIDEO_QUESTIONS : NON_TECHNICAL_VIDEO_QUESTIONS;
  const currentVideoQ = videoQuestions[currentVideoQIndex];

  // Company Drills Questions Generator
  function getCompanyDrillQuestions() {
    const comp = DRILL_COMPANIES.find((c) => c.name.toLowerCase() === drillCompany.toLowerCase()) || DRILL_COMPANIES[0];
    if (drillMode === 'technical') {
      return [
        {
          title: `${comp.name} Tech Stack & Architecture`,
          prompt: `How would you design a core microservice at ${comp.name} leveraging ${comp.tech.slice(0, 3).join(', ')}? Explain data storage, API contract design, and error recovery.`,
          stage: comp.stages[1] || 'Technical Screen',
        },
        {
          title: 'Algorithmic Optimization for Scale',
          prompt: `At ${comp.name}'s traffic scale, how do you prevent N+1 query bottlenecks and manage memory allocation under peak concurrency?`,
          stage: comp.stages[1] || 'Coding Round',
        },
        {
          title: 'System Design: Distributed Partitioning',
          prompt: `Walk through how you partition datasets across shards when horizontal scaling exceeds single-node capacity at ${comp.name}.`,
          stage: comp.stages[2] || 'System Design',
        },
        {
          title: 'Resilient Failure Recovery & Circuit Breaking',
          prompt: `How do you implement circuit breakers and fallback mechanisms to ensure high availability during downstream dependency outages?`,
          stage: comp.stages[2] || 'Architecture Screen',
        },
        {
          title: 'Database Indexing & Sharding Strategy',
          prompt: `Explain how you would choose between composite B-Tree indexes, Hash indexes, and LSM Trees for a write-heavy service at ${comp.name}.`,
          stage: comp.stages[1] || 'Technical Screen',
        },
        {
          title: 'Real-Time Streaming & Message Queues',
          prompt: `How do you guarantee exactly-once or at-least-once processing semantics using event brokers like Kafka or cloud message buses?`,
          stage: comp.stages[2] || 'System Design',
        },
        {
          title: 'API Gateway & Latency Budgets',
          prompt: `Design an API Gateway layer for ${comp.name} that enforces authentication, rate limiting, and request routing within a 5ms latency budget.`,
          stage: comp.stages[2] || 'Architecture',
        },
        {
          title: 'Data Consistency in Microservices',
          prompt: `When transactions span multiple services, how do you manage rollback mechanisms using the Saga or Two-Phase Commit patterns?`,
          stage: comp.stages[2] || 'System Design',
        },
        {
          title: 'Telemetry, Distributed Tracing & Observability',
          prompt: `How do you architect OpenTelemetry distributed tracing and metrics aggregation to diagnose intermittent 500 errors across 50+ services?`,
          stage: comp.stages[1] || 'Technical Screen',
        },
        {
          title: 'Production Readiness & Security Review',
          prompt: `What automated checks, vulnerability scans, and security gates do you mandate before releasing a service to ${comp.name}'s production environment?`,
          stage: comp.stages[3] || 'Bar Raiser / Solutioning',
        },
      ];
    } else {
      return [
        {
          title: `${comp.name} Cultural Alignment & Values`,
          prompt: `Why do you want to join ${comp.name} specifically, and how do your professional values align with their engineering standards?`,
          stage: comp.stages[3] || 'Leadership Round',
        },
        {
          title: 'Ownership & Taking Accountability',
          prompt: `Tell me about a time you identified a critical flaw in a product or process that was not your direct responsibility, and took initiative to fix it.`,
          stage: comp.stages[3] || 'Leadership / Culture',
        },
        {
          title: 'Customer Obsession & Quality Standards',
          prompt: `Describe a situation where you had to push back on an executive deadline to protect client stability, accessibility, or security.`,
          stage: comp.stages[3] || 'Managerial Round',
        },
        {
          title: 'Resolving Interpersonal Conflict',
          prompt: `Describe a disagreement with a team member where emotions or perspectives ran high. How did you maintain professionalism and reach a productive consensus?`,
          stage: comp.stages[3] || 'HR / Alignment',
        },
        {
          title: 'Working with Ambiguity',
          prompt: `How do you approach starting a project at ${comp.name} where requirements are unclear and domain experts have differing expectations?`,
          stage: comp.stages[3] || 'Bar Raiser',
        },
        {
          title: 'Mentorship & Knowledge Sharing',
          prompt: `Give an example of how you helped onboard or elevate the engineering capabilities of a junior colleague or cross-functional team member.`,
          stage: comp.stages[3] || 'Peer Collaboration',
        },
        {
          title: 'Learning from Critical Feedback',
          prompt: `Tell me about the most challenging constructive feedback you received from a peer or manager. How did you receive it and adapt your workflow?`,
          stage: comp.stages[3] || 'Culture Fit',
        },
        {
          title: 'Balancing Speed vs. Perfection',
          prompt: `How do you make pragmatic decisions between shipping a working MVP quickly versus spending time perfecting the architecture?`,
          stage: comp.stages[3] || 'Managerial Round',
        },
        {
          title: 'Cross-Cultural / Global Teamwork',
          prompt: `Describe your experience collaborating with distributed engineering teams across different timezones and diverse cultural backgrounds.`,
          stage: comp.stages[3] || 'Client Alignment',
        },
        {
          title: 'Long-Term Vision at ${comp.name}',
          prompt: `What specific technical impact or organizational contribution do you hope to make during your first year at ${comp.name}?`,
          stage: comp.stages[3] || 'Executive Interview',
        },
      ];
    }
  }

  const drillQuestions = getCompanyDrillQuestions();
  const currentDrillQ = drillQuestions[currentDrillIndex];

  // LeetCode-style problem filter based on topic, difficulty, and search keyword
  const filteredProblems = problems.filter((prob) => {
    if (selectedTopic !== 'All Topics' && prob.category !== selectedTopic) {
      return false;
    }
    if (selectedDifficulty !== 'All' && prob.difficulty !== selectedDifficulty) {
      return false;
    }
    if (problemSearch.trim()) {
      const q = problemSearch.toLowerCase().trim();
      const matchTitle = prob.title.toLowerCase().includes(q);
      const matchDesc = prob.description ? prob.description.toLowerCase().includes(q) : false;
      const matchCat = prob.category ? prob.category.toLowerCase().includes(q) : false;
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }
    return true;
  });

  const currentProblem: CodingProblem = problems.find((p) => p.id === selectedProblemId) || filteredProblems[0] || problems[0] || {
    id: 'placeholder',
    title: 'Select a Problem',
    category: 'Basic Problems',
    difficulty: 'Easy' as const,
    description: 'Choose a problem from the left sidebar to start coding.',
    examples: [],
    constraints: [],
    starter_code: {},
    hints: [],
  };

  return (
    <div id="section-interview-prep" role="tabpanel" aria-labelledby="nav-item-interview-prep">
      {/* Section Header */}
      <div className="section-header">
        <div className="section-eyebrow">
          <Code size={14} aria-hidden="true" />
          <span>Interactive Technical & Behavioral Preparation</span>
        </div>
        <h2 className="section-title">Interview Preparation Center</h2>
        <p className="section-desc">
          Prepare across three dedicated environments: solve algorithmic problems in a clean coding sandbox, practice vocal delivery with webcam video capture, and drill company-specific questions via typed or speech input.
        </p>
      </div>

      {/* Global Status Banner for Saved Records */}
      {saveStatusMessage && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '0.875rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: saveStatusMessage.type === 'success' ? 'rgba(52, 211, 153, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${saveStatusMessage.type === 'success' ? '#34d399' : '#ef4444'}`,
            color: saveStatusMessage.type === 'success' ? '#6ee7b7' : '#fca5a5',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {saveStatusMessage.type === 'success' ? (
              <CheckCircle size={16} aria-hidden="true" />
            ) : (
              <AlertCircle size={16} aria-hidden="true" />
            )}
            <span>{saveStatusMessage.text}</span>
          </div>
          {saveStatusMessage.type === 'success' && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => (onNavigate ? onNavigate('preparation-records') : (window.location.hash = '#preparation-records'))}
              style={{ fontSize: '0.75rem' }}
            >
              <span>View in Records</span>
              <ArrowRight size={12} aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {/* STRICT REQUIREMENT: EXACTLY THREE PRIMARY SUBSECTIONS */}
      <div
        role="tablist"
        aria-label="Interview Preparation Subsections"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
          padding: '0.5rem 0.75rem',
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '14px',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            role="tab"
            id="tab-coding-sandbox"
            aria-selected={activeTab === 'coding'}
            aria-controls="panel-coding-sandbox"
            className={`btn ${activeTab === 'coding' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab('coding')}
            style={{ gap: '0.5rem', padding: '0.5rem 1rem' }}
          >
            <Code size={16} aria-hidden="true" />
            <span>Coding Sandbox</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-video-interview"
            aria-selected={activeTab === 'video'}
            aria-controls="panel-video-interview"
            className={`btn ${activeTab === 'video' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab('video')}
            style={{ gap: '0.5rem', padding: '0.5rem 1rem' }}
          >
            <Video size={16} aria-hidden="true" />
            <span>Video Interview Practice</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-company-drills"
            aria-selected={activeTab === 'company'}
            aria-controls="panel-company-drills"
            className={`btn ${activeTab === 'company' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setActiveTab('company')}
            style={{ gap: '0.5rem', padding: '0.5rem 1rem' }}
          >
            <Building2 size={16} aria-hidden="true" />
            <span>Company-Specific Drills</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-info" style={{ fontSize: '0.725rem', padding: '0.3rem 0.65rem' }}>
            {activeTab === 'coding'
              ? 'Judge0 Runtimes Active (C++, Python, Java, JS, TS)'
              : activeTab === 'video'
              ? 'Webcam & Microphone Audio Active'
              : '52 Verified Company Tracks'}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBSECTION 1: CODING SANDBOX (LeetCode / HackerRank Platform Style)        */}
      {/* ========================================================================= */}
      {activeTab === 'coding' && (
        <div id="panel-coding-sandbox" role="tabpanel" aria-labelledby="tab-coding-sandbox">
          {/* Top Bar: Overview & Persistence */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.25rem',
              padding: '0.875rem 1.25rem',
              background: 'rgba(15, 23, 42, 0.75)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(99, 102, 241, 0.15)',
                  color: '#818cf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Code size={18} aria-hidden="true" />
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Algorithmic Problem Workbench
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {problems.length} problems across {topics.length} engineering topics • Local sandbox execution
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleSaveCodingSession}
                disabled={isSavingRecord || !sourceCode.trim()}
                title="Save this solution to Preparation Records in PostgreSQL"
                style={{ fontSize: '0.775rem', gap: '0.4rem' }}
              >
                <Bookmark size={13} aria-hidden="true" />
                <span>{isSavingRecord ? 'Saving...' : 'Save to Records'}</span>
              </button>
            </div>
          </div>

          {/* 3-Column LeetCode Workbench */}
          <div className="coding-workbench-grid">
            {/* COLUMN 1: Problem Explorer Sidebar */}
            <div
              className="card"
              style={{
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.875rem',
                maxHeight: '850px',
              }}
            >
              {/* Sidebar Header & Count */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                  <Layers size={15} style={{ color: '#818cf8' }} aria-hidden="true" />
                  <span>Topic & Problem Library</span>
                </div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#818cf8',
                    fontWeight: 600,
                  }}
                >
                  {filteredProblems.length} {filteredProblems.length === 1 ? 'Problem' : 'Problems'}
                </span>
              </div>

              {/* Topic Category Dropdown */}
              <div>
                <label
                  htmlFor="coding-topic-filter"
                  style={{ fontSize: '0.725rem', color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}
                >
                  Select Topic:
                </label>
                <select
                  id="coding-topic-filter"
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.65rem',
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-main)',
                    fontSize: '0.825rem',
                    outline: 'none',
                  }}
                >
                  <option value="All Topics">All Topics ({problems.length})</option>
                  {topics.map((t) => {
                    const count = problems.filter((p) => p.category === t).length;
                    return (
                      <option key={t} value={t}>
                        {t} {count > 0 ? `(${count})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Difficulty Filter Chips */}
              <div>
                <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', fontWeight: 600, display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Difficulty:
                </span>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      className={`diff-chip ${selectedDifficulty === diff ? 'active' : ''}`}
                      onClick={() => setSelectedDifficulty(diff)}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Problem Keyword Search */}
              <div style={{ position: 'relative' }}>
                <Search
                  size={14}
                  style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={problemSearch}
                  onChange={(e) => setProblemSearch(e.target.value)}
                  placeholder="Search problems..."
                  style={{
                    width: '100%',
                    padding: '0.45rem 1.85rem 0.45rem 2rem',
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-main)',
                    fontSize: '0.8rem',
                    outline: 'none',
                  }}
                />
                {problemSearch && (
                  <button
                    type="button"
                    onClick={() => setProblemSearch('')}
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                    }}
                    title="Clear search"
                  >
                    <X size={13} aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* Scrollable Problem Items List */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  overflowY: 'auto',
                  flex: 1,
                  paddingRight: '0.2rem',
                  minHeight: '280px',
                }}
              >
                {filteredProblems.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                    <p style={{ marginBottom: '0.5rem' }}>No problems match the current filter.</p>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setSelectedTopic('All Topics');
                        setSelectedDifficulty('All');
                        setProblemSearch('');
                      }}
                      style={{ fontSize: '0.725rem' }}
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  filteredProblems.map((prob) => {
                    const isActive = prob.id === currentProblem.id;
                    const diffColor =
                      prob.difficulty === 'Easy' ? '#34d399' : prob.difficulty === 'Medium' ? '#fbbf24' : '#f87171';
                    return (
                      <button
                        key={prob.id}
                        type="button"
                        className={`problem-list-item ${isActive ? 'active' : ''}`}
                        onClick={() => handleProblemChange(prob.id)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <span
                            style={{
                              fontSize: '0.825rem',
                              fontWeight: isActive ? 700 : 500,
                              color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '180px',
                            }}
                          >
                            {prob.title}
                          </span>
                          <span
                            style={{
                              fontSize: '0.675rem',
                              fontWeight: 700,
                              color: diffColor,
                            }}
                          >
                            {prob.difficulty}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span>{prob.category || 'Algorithms'}</span>
                          {prob.test_cases && prob.test_cases.length > 0 && (
                            <span style={{ opacity: 0.6 }}>• {prob.test_cases.length} tests</span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* COLUMN 2: Problem Description & Test Case Examples */}
            <div
              className="card"
              style={{
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.1rem',
                maxHeight: '850px',
                overflowY: 'auto',
              }}
            >
              {/* Problem Title & Category Badges */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', lineHeight: 1.3 }}>
                    {currentProblem.title}
                  </h3>
                  <span
                    className={`badge ${
                      currentProblem.difficulty === 'Easy'
                        ? 'badge-success'
                        : currentProblem.difficulty === 'Medium'
                        ? 'badge-warning'
                        : 'badge-danger'
                    }`}
                    style={{ fontSize: '0.75rem', flexShrink: 0 }}
                  >
                    {currentProblem.difficulty}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      fontSize: '0.725rem',
                      color: '#818cf8',
                      background: 'rgba(99, 102, 241, 0.12)',
                      padding: '0.15rem 0.55rem',
                      borderRadius: '4px',
                      fontWeight: 600,
                    }}
                  >
                    {currentProblem.category}
                  </span>
                </div>
              </div>

              {/* Description Body */}
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
                {currentProblem.description}
              </div>

              {/* Examples */}
              {currentProblem.examples && currentProblem.examples.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
                    Examples:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {currentProblem.examples.map((ex, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '0.75rem 0.875rem',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(15, 23, 42, 0.85)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '0.785rem',
                          fontFamily: 'monospace',
                        }}
                      >
                        <div style={{ color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                          <strong style={{ color: '#818cf8' }}>Input:</strong> {ex.input}
                        </div>
                        <div style={{ color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                          <strong style={{ color: '#34d399' }}>Output:</strong> {ex.output}
                        </div>
                        {ex.explanation && (
                          <div style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontFamily: 'inherit', fontSize: '0.75rem', marginTop: '0.35rem' }}>
                            <strong>Explanation:</strong> {ex.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Constraints */}
              {currentProblem.constraints && currentProblem.constraints.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '0.35rem', letterSpacing: '0.04em' }}>
                    Constraints:
                  </h4>
                  <ul style={{ paddingLeft: '1.25rem', margin: 0, fontSize: '0.785rem', color: 'var(--text-dim)' }}>
                    {currentProblem.constraints.map((c, idx) => (
                      <li key={idx} style={{ marginBottom: '0.25rem' }}>
                        <code style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '0.1rem 0.35rem', borderRadius: '3px', color: '#e2e8f0' }}>{c}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Hints Accordion */}
              {currentProblem.hints && currentProblem.hints.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowHints(!showHints)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      color: showHints ? '#fbbf24' : 'var(--text-dim)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      padding: '0.25rem 0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Lightbulb size={15} style={{ color: '#fbbf24' }} aria-hidden="true" />
                      <span>Hints & Approaches ({currentProblem.hints.length})</span>
                    </div>
                    {showHints ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
                  </button>

                  {showHints && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.6rem' }}>
                      {(currentProblem.hints || []).map((hint: string, hIdx: number) => (
                        <div
                          key={hIdx}
                          style={{
                            padding: '0.65rem 0.8rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(245, 158, 11, 0.08)',
                            border: '1px solid rgba(245, 158, 11, 0.2)',
                            fontSize: '0.775rem',
                            color: '#fde68a',
                            lineHeight: 1.5,
                          }}
                        >
                          <strong style={{ color: '#fbbf24' }}>Hint {hIdx + 1}:</strong> {hint}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* COLUMN 3: Code Editor, Language Bar, Run vs Submit & Tabbed Console */}
            <div className="coding-editor-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Editor Card */}
              <div
                className="card"
                style={{
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {/* Language Bar & Action Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {/* Language Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label htmlFor="coding-language-select" style={{ fontSize: '0.775rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                      Language:
                    </label>
                    <select
                      id="coding-language-select"
                      value={selectedLanguageId}
                      onChange={(e) => handleLanguageChange(Number(e.target.value))}
                      style={{
                        padding: '0.4rem 0.7rem',
                        background: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-main)',
                        fontSize: '0.825rem',
                        outline: 'none',
                      }}
                    >
                      {languages.length > 0 ? (
                        languages.map((lang) => (
                          <option key={lang.id} value={lang.id}>
                            {lang.name}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value={71}>Python (3.8.1)</option>
                          <option value={54}>C++ (GCC 9.2.0)</option>
                          <option value={62}>Java (OpenJDK 13.0.1)</option>
                          <option value={63}>JavaScript (Node.js 12.14.0)</option>
                          <option value={74}>TypeScript (3.7.4)</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Template Reset & Stdin Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleResetStarter}
                      title="Reload recommended starter template for this problem and language"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
                    >
                      <RotateCcw size={12} aria-hidden="true" />
                      <span>Starter Code</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSourceCode('')}
                      title="Clear code editor to empty"
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
                    >
                      <span>Blank</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowStdin(!showStdin)}
                      style={{
                        background: showStdin ? 'rgba(99, 102, 241, 0.2)' : 'none',
                        border: showStdin ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                        borderRadius: 'var(--radius-sm)',
                        color: showStdin ? '#818cf8' : 'var(--text-dim)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '0.35rem 0.6rem',
                      }}
                    >
                      {showStdin ? '− Stdin' : '+ Stdin'}
                    </button>
                  </div>
                </div>

                {/* Code Editor Textarea */}
                <div style={{ position: 'relative' }}>
                  <textarea
                    id="code-editor-textarea"
                    value={sourceCode}
                    onChange={(e) => setSourceCode(e.target.value)}
                    placeholder="// Write your solution here...&#10;// Click 'Run Code' to execute against custom input, or 'Submit' to run test cases."
                    rows={16}
                    spellCheck={false}
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      background: '#070c18',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#f1f5f9',
                      fontFamily: 'Consolas, "Fira Code", Monaco, monospace',
                      fontSize: '0.85rem',
                      lineHeight: 1.55,
                      resize: 'vertical',
                      outline: 'none',
                      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)',
                    }}
                    aria-label="Code Editor"
                  />
                </div>

                {/* Collapsible Custom Stdin Drawer */}
                {showStdin && (
                  <div style={{ marginTop: '0.25rem' }}>
                    <label htmlFor="custom-stdin-input" style={{ fontSize: '0.725rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>
                      Standard Input (stdin for Run Code):
                    </label>
                    <textarea
                      id="custom-stdin-input"
                      value={stdinInput}
                      onChange={(e) => setStdinInput(e.target.value)}
                      placeholder="Enter inputs here (e.g. 2 7 11 15\n9)..."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        background: '#0a0f1d',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#e2e8f0',
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                )}

                {/* Run Code & Submit Action Bar */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.65rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    id="run-code-btn"
                    onClick={handleRunCode}
                    disabled={isExecuting || isSubmitting || !sourceCode.trim()}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#fff',
                      border: 'none',
                      fontWeight: 600,
                      gap: '0.35rem',
                      padding: '0.45rem 1rem',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    <Play size={14} aria-hidden="true" />
                    <span>{isExecuting ? 'Running...' : 'Run Code'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    id="submit-code-btn"
                    onClick={handleSubmitCode}
                    disabled={isExecuting || isSubmitting || !sourceCode.trim()}
                    style={{
                      background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                      boxShadow: '0 2px 10px rgba(99, 102, 241, 0.35)',
                      fontWeight: 600,
                      gap: '0.35rem',
                      padding: '0.45rem 1.15rem',
                    }}
                  >
                    <Send size={14} aria-hidden="true" />
                    <span>{isSubmitting ? 'Evaluating Tests...' : 'Submit'}</span>
                  </button>
                </div>
              </div>

              {/* Execution Error Banner */}
              {codingError && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--danger-bg)',
                    border: '1px solid var(--danger-border)',
                    color: '#fca5a5',
                    fontSize: '0.8125rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <AlertCircle size={15} aria-hidden="true" />
                  <span>{codingError}</span>
                </div>
              )}

              {/* Tabbed Execution Console */}
              <div
                className="card"
                style={{
                  padding: '1rem',
                  background: '#0a0f1d',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {/* Console Navigation Tabs */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingBottom: '0.5rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setConsoleTab('run')}
                      style={{
                        background: 'none',
                        border: 'none',
                        borderBottom: consoleTab === 'run' ? '2px solid #10b981' : '2px solid transparent',
                        color: consoleTab === 'run' ? '#34d399' : 'var(--text-dim)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        padding: '0.25rem 0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <Terminal size={14} aria-hidden="true" />
                      <span>Run Output</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConsoleTab('submit')}
                      style={{
                        background: 'none',
                        border: 'none',
                        borderBottom: consoleTab === 'submit' ? '2px solid #818cf8' : '2px solid transparent',
                        color: consoleTab === 'submit' ? '#818cf8' : 'var(--text-dim)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        padding: '0.25rem 0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <CheckCircle size={14} aria-hidden="true" />
                      <span>
                        Test Results
                        {submitResult ? ` (${submitResult.passed_count}/${submitResult.total_count})` : ''}
                      </span>
                    </button>
                  </div>

                  {consoleTab === 'run' && executionResult && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.725rem' }}>
                      {executionResult.status === 'completed' && executionResult.exit_code === 0 && (
                        <span className="badge badge-success">Completed (0)</span>
                      )}
                      {(executionResult.status === 'runtime_error' || (executionResult.status === 'completed' && executionResult.exit_code !== 0)) && (
                        <span className="badge badge-danger">Runtime Error ({executionResult.exit_code})</span>
                      )}
                      {executionResult.status === 'compilation_error' && (
                        <span className="badge badge-danger">Compile Error</span>
                      )}
                      {executionResult.status === 'time_limit_exceeded' && (
                        <span className="badge badge-warning">Timeout</span>
                      )}
                    </div>
                  )}

                  {consoleTab === 'submit' && submitResult && (
                    <div style={{ fontSize: '0.725rem' }}>
                      {submitResult.status === 'accepted' ? (
                        <span className="badge badge-success">Accepted</span>
                      ) : submitResult.status === 'wrong_answer' ? (
                        <span className="badge badge-danger">Wrong Answer</span>
                      ) : submitResult.status === 'compilation_error' ? (
                        <span className="badge badge-danger">Compilation Error</span>
                      ) : (
                        <span className="badge badge-danger">Failed</span>
                      )}
                    </div>
                  )}
                </div>

                {/* TAB 1: RUN CODE OUTPUT */}
                {consoleTab === 'run' && (
                  <div>
                    {isExecuting ? (
                      <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.825rem' }}>
                        Compiling and executing code against stdin...
                      </div>
                    ) : executionResult ? (
                      <div>
                        {/* Metrics Bar */}
                        <div
                          style={{
                            display: 'flex',
                            gap: '1.25rem',
                            marginBottom: '0.75rem',
                            paddingBottom: '0.5rem',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            fontSize: '0.75rem',
                            color: 'var(--text-dim)',
                          }}
                        >
                          <div>
                            Time: <strong style={{ color: 'var(--text-main)' }}>{executionResult.time_ms || 0} ms</strong>
                          </div>
                          <div>
                            Memory: <strong style={{ color: 'var(--text-main)' }}>{executionResult.memory_kb || 0} KB</strong>
                          </div>
                          <div>
                            Exit Code: <strong style={{ color: 'var(--text-main)' }}>{executionResult.exit_code ?? 'N/A'}</strong>
                          </div>
                        </div>

                        {/* Stdout */}
                        {executionResult.stdout && (
                          <div style={{ marginBottom: '0.65rem' }}>
                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, marginBottom: '0.25rem' }}>
                              Standard Output (stdout):
                            </div>
                            <pre
                              style={{
                                margin: 0,
                                padding: '0.625rem',
                                background: '#050811',
                                borderRadius: 'var(--radius-sm)',
                                color: '#34d399',
                                fontFamily: 'monospace',
                                fontSize: '0.8rem',
                                overflowX: 'auto',
                                whiteSpace: 'pre-wrap',
                              }}
                            >
                              {executionResult.stdout}
                            </pre>
                          </div>
                        )}

                        {/* Stderr */}
                        {executionResult.stderr && (
                          <div style={{ marginBottom: '0.65rem' }}>
                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#f87171', fontWeight: 700, marginBottom: '0.25rem' }}>
                              Standard Error (stderr):
                            </div>
                            <pre
                              style={{
                                margin: 0,
                                padding: '0.625rem',
                                background: '#190a0d',
                                borderRadius: 'var(--radius-sm)',
                                color: '#fca5a5',
                                fontFamily: 'monospace',
                                fontSize: '0.8rem',
                                overflowX: 'auto',
                                whiteSpace: 'pre-wrap',
                              }}
                            >
                              {executionResult.stderr}
                            </pre>
                          </div>
                        )}

                        {/* Compiler Output */}
                        {executionResult.compile_output && (
                          <div>
                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#fbbf24', fontWeight: 700, marginBottom: '0.25rem' }}>
                              Compiler Output:
                            </div>
                            <pre
                              style={{
                                margin: 0,
                                padding: '0.625rem',
                                background: '#191408',
                                borderRadius: 'var(--radius-sm)',
                                color: '#fde68a',
                                fontFamily: 'monospace',
                                fontSize: '0.8rem',
                                overflowX: 'auto',
                                whiteSpace: 'pre-wrap',
                              }}
                            >
                              {executionResult.compile_output}
                            </pre>
                          </div>
                        )}

                        {!executionResult.stdout && !executionResult.stderr && !executionResult.compile_output && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic', padding: '0.5rem 0' }}>
                            Program completed with no output printed.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ padding: '1.25rem', color: 'var(--text-dim)', fontSize: '0.8rem', fontStyle: 'italic', textAlign: 'center' }}>
                        Click <strong>Run Code</strong> above to compile and run your code with custom standard input.
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: SUBMIT & TEST RESULTS */}
                {consoleTab === 'submit' && (
                  <div>
                    {isSubmitting ? (
                      <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.825rem' }}>
                        Grading your solution against problem test suite...
                      </div>
                    ) : submitResult ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {/* Overall Verdict Banner */}
                        <div
                          style={{
                            padding: '0.875rem 1rem',
                            borderRadius: 'var(--radius-sm)',
                            background:
                              submitResult.status === 'accepted'
                                ? 'rgba(52, 211, 153, 0.12)'
                                : 'rgba(239, 68, 68, 0.12)',
                            border: `1px solid ${
                              submitResult.status === 'accepted' ? '#34d399' : '#ef4444'
                            }`,
                            color: submitResult.status === 'accepted' ? '#6ee7b7' : '#fca5a5',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {submitResult.status === 'accepted' ? (
                              <CheckCircle size={18} aria-hidden="true" />
                            ) : (
                              <AlertCircle size={18} aria-hidden="true" />
                            )}
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                                {submitResult.status === 'accepted'
                                  ? 'Accepted'
                                  : submitResult.status === 'wrong_answer'
                                  ? 'Wrong Answer'
                                  : submitResult.status === 'compilation_error'
                                  ? 'Compilation Error'
                                  : 'Runtime Error'}
                              </div>
                              <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>
                                {submitResult.message}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right', fontSize: '0.75rem' }}>
                            <div>
                              Passed: <strong>{submitResult.passed_count} / {submitResult.total_count}</strong>
                            </div>
                            <div style={{ opacity: 0.75 }}>
                              {submitResult.time_ms || 0} ms
                            </div>
                          </div>
                        </div>

                        {/* Individual Test Cases List */}
                        {submitResult.test_results && submitResult.test_results.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.04em' }}>
                              Test Case Evaluation Breakdown:
                            </div>
                            {submitResult.test_results.map((tr) => (
                              <div
                                key={tr.test_case_index}
                                style={{
                                  padding: '0.65rem 0.75rem',
                                  borderRadius: 'var(--radius-sm)',
                                  background: tr.passed ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                                  border: `1px solid ${tr.passed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                                  fontSize: '0.775rem',
                                  fontFamily: 'monospace',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                                    Case #{tr.test_case_index}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: '0.7rem',
                                      fontWeight: 700,
                                      color: tr.passed ? '#34d399' : '#f87171',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                    }}
                                  >
                                    {tr.passed ? <Check size={12} aria-hidden="true" /> : <X size={12} aria-hidden="true" />}
                                    {tr.passed ? 'Passed' : 'Failed'}
                                  </span>
                                </div>

                                <div style={{ color: 'var(--text-dim)', marginBottom: '0.2rem' }}>
                                  <strong style={{ color: '#818cf8' }}>Input:</strong> {tr.input || '(empty)'}
                                </div>
                                <div style={{ color: 'var(--text-dim)', marginBottom: '0.2rem' }}>
                                  <strong style={{ color: '#34d399' }}>Expected:</strong> {tr.expected_output}
                                </div>
                                <div style={{ color: tr.passed ? '#34d399' : '#f87171' }}>
                                  <strong>Actual:</strong> {tr.actual_output || '(no output)'}
                                </div>
                                {tr.error_message && (
                                  <div style={{ color: '#fca5a5', fontSize: '0.725rem', marginTop: '0.25rem' }}>
                                    <strong>Error:</strong> {tr.error_message}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ padding: '1.25rem', color: 'var(--text-dim)', fontSize: '0.8rem', fontStyle: 'italic', textAlign: 'center' }}>
                        Click <strong>Submit</strong> above to grade your solution against the problem test cases.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBSECTION 2: VIDEO INTERVIEW PRACTICE (Webcam & MediaRecorder)             */}
      {/* ========================================================================= */}
      {activeTab === 'video' && (
        <div id="panel-video-interview" role="tabpanel" aria-labelledby="tab-video-interview">
          {/* Top Mode Selector: Technical Practice vs Non-Technical Practice */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.5rem',
              padding: '1rem',
              background: 'rgba(15, 23, 42, 0.75)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {/* Target Employer Select & Mode Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label htmlFor="video-company-select" style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                  Target Employer:
                </label>
                <select
                  id="video-company-select"
                  value={videoCompany}
                  onChange={(e) => {
                    setVideoCompany(e.target.value);
                    setCurrentVideoQIndex(0);
                  }}
                  style={{
                    padding: '0.45rem 0.75rem',
                    background: 'rgba(30, 41, 59, 0.9)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                  }}
                >
                  {DRILL_COMPANIES.map((c) => (
                    <option key={c.slug} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${videoMode === 'technical' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    setVideoMode('technical');
                    setCurrentVideoQIndex(0);
                  }}
                  style={{ fontSize: '0.775rem' }}
                >
                  <span>Technical Practice</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${videoMode === 'non_technical' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    setVideoMode('non_technical');
                    setCurrentVideoQIndex(0);
                  }}
                  style={{ fontSize: '0.775rem' }}
                >
                  <span>Non-Technical (Behavioral & HR)</span>
                </button>
              </div>
            </div>

            {/* Question Progress: 1 of 10 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                Question <strong>{currentVideoQIndex + 1}</strong> of <strong>{videoQuestions.length}</strong>
              </span>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCurrentVideoQIndex((p) => Math.max(0, p - 1))}
                  disabled={currentVideoQIndex === 0}
                  aria-label="Previous Question"
                >
                  <ChevronLeft size={14} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCurrentVideoQIndex((p) => Math.min(videoQuestions.length - 1, p + 1))}
                  disabled={currentVideoQIndex === videoQuestions.length - 1}
                  aria-label="Next Question"
                >
                  <ChevronRight size={14} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* Current Question Card */}
          <div
            className="card"
            style={{
              marginBottom: '1.5rem',
              padding: '1.25rem',
              borderLeft: '4px solid #6366f1',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                {currentVideoQIndex + 1}. {currentVideoQ.title}
              </h3>
              <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                {videoMode === 'technical' ? 'Technical Architecture' : 'Behavioral STAR'}
              </span>
            </div>
            <p style={{ fontSize: '0.95rem', color: '#e0e7ff', lineHeight: 1.5, margin: '0.5rem 0' }}>
              {currentVideoQ.prompt}
            </p>
            <div style={{ fontSize: '0.775rem', color: 'var(--text-dim)', fontStyle: 'italic', marginTop: '0.5rem' }}>
              💡 <strong>Interview Tip:</strong> {currentVideoQ.tip}
            </div>
          </div>

          {/* Media Capture & Recording Studio Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '1.5rem', alignItems: 'start' }}>
            {/* Left: Video Recorder / Preview */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Video size={16} style={{ color: '#ec4899' }} aria-hidden="true" />
                  <span>Webcam Video Studio</span>
                </div>

                {isRecording && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      color: '#ef4444',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#ef4444',
                        animation: 'pulse 1.5s infinite',
                      }}
                    />
                    <span>Recording ({Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')})</span>
                  </div>
                )}
              </div>

              {/* Video Stream / Playback Box */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '4 / 3',
                  background: '#090d16',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {recordedBlobUrl ? (
                  <video
                    src={recordedBlobUrl}
                    controls
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : isMediaActive ? (
                  <video
                    ref={videoLiveRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-dim)' }}>
                    <Camera size={36} style={{ opacity: 0.4, marginBottom: '0.75rem' }} aria-hidden="true" />
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Camera Stream Inactive</div>
                    <p style={{ fontSize: '0.75rem', maxWidth: '280px', margin: '0.35rem auto 0 auto' }}>
                      Click "Start Camera" below to initialize browser video recording.
                    </p>
                  </div>
                )}
              </div>

              {/* Media Error Banner */}
              {mediaError && (
                <div
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.625rem 0.875rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--danger-bg)',
                    border: '1px solid var(--danger-border)',
                    color: '#fca5a5',
                    fontSize: '0.775rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <AlertCircle size={14} aria-hidden="true" />
                  <span>{mediaError}</span>
                </div>
              )}

              {/* Recording Controls */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                {!isMediaActive && !recordedBlobUrl && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleStartCamera}
                    style={{ gap: '0.4rem' }}
                  >
                    <Camera size={14} aria-hidden="true" />
                    <span>Start Camera</span>
                  </button>
                )}

                {isMediaActive && !isRecording && !recordedBlobUrl && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleStartRecording}
                    style={{ background: '#ef4444', borderColor: '#ef4444', gap: '0.4rem' }}
                  >
                    <Play size={14} aria-hidden="true" />
                    <span>Record Answer</span>
                  </button>
                )}

                {isRecording && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={handleStopRecording}
                    style={{ gap: '0.4rem' }}
                  >
                    <Square size={14} aria-hidden="true" />
                    <span>Stop Recording</span>
                  </button>
                )}

                {recordedBlobUrl && (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleDiscardRecording}
                      style={{ gap: '0.4rem' }}
                    >
                      <RotateCcw size={13} aria-hidden="true" />
                      <span>Retake</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleDownloadRecording}
                      style={{ gap: '0.4rem' }}
                    >
                      <Download size={13} aria-hidden="true" />
                      <span>Download Video</span>
                    </button>
                  </>
                )}

                {isMediaActive && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={cleanupMediaStream}
                    style={{ marginLeft: 'auto', fontSize: '0.75rem' }}
                  >
                    <span>Turn Off Camera</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right: Notes, Audit & Save */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Transcript & Notes */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Candidate Notes / Speech Summary
                </div>
                <textarea
                  value={userTranscriptInput}
                  onChange={(e) => setUserTranscriptInput(e.target.value)}
                  placeholder="Outline key architectural points, STAR milestones, or verbal notes for this answer..."
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#090d16',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                    resize: 'vertical',
                    outline: 'none',
                  }}
                  aria-label="Candidate Answer Notes"
                />

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleAuditVideo}
                    disabled={isAuditingVideo || recordingSeconds === 0}
                    style={{ gap: '0.4rem', fontSize: '0.8rem' }}
                  >
                    <Sparkles size={14} aria-hidden="true" />
                    <span>{isAuditingVideo ? 'Auditing...' : 'Run Video Audit'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleSaveVideoSession}
                    disabled={isSavingRecord}
                    style={{ gap: '0.4rem', fontSize: '0.8rem' }}
                  >
                    <Bookmark size={13} aria-hidden="true" />
                    <span>Save Video Session</span>
                  </button>
                </div>
              </div>

              {/* Video Audit Results */}
              {videoAuditResult && (
                <div
                  className="card"
                  style={{
                    padding: '1.25rem',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#c7d2fe' }}>
                      Video Delivery Audit Report
                    </div>
                    <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                      Duration: {videoAuditResult.duration_formatted}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>
                    <strong>Quality Indicators:</strong>
                    <ul style={{ margin: '0.25rem 0 0 1.25rem', padding: 0 }}>
                      {videoAuditResult.stream_quality_notes.map((note, idx) => (
                        <li key={idx}>{note}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic', marginTop: '0.5rem' }}>
                    {videoAuditResult.disclaimer}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBSECTION 3: COMPANY-SPECIFIC DRILLS (Typed OR Web Speech Input)           */}
      {/* ========================================================================= */}
      {activeTab === 'company' && (
        <div id="panel-company-drills" role="tabpanel" aria-labelledby="tab-company-drills">
          {/* Top Controls: Target Company Selector & Mode Choice */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.5rem',
              padding: '1rem',
              background: 'rgba(15, 23, 42, 0.75)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {/* Target Employer Select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <label htmlFor="company-drill-select" style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                Target Employer:
              </label>
              <select
                id="company-drill-select"
                value={drillCompany}
                onChange={(e) => {
                  setDrillCompany(e.target.value);
                  setCurrentDrillIndex(0);
                  setDrillAnswer('');
                  setDrillFeedback(null);
                }}
                style={{
                  padding: '0.45rem 0.75rem',
                  background: 'rgba(30, 41, 59, 0.9)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                }}
              >
                {DRILL_COMPANIES.map((c) => (
                  <option key={c.slug} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Mode Toggle: Technical vs Non-Technical Drills */}
              <div style={{ display: 'flex', gap: '0.35rem', marginLeft: '0.5rem' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${drillMode === 'technical' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    setDrillMode('technical');
                    setCurrentDrillIndex(0);
                    setDrillAnswer('');
                    setDrillFeedback(null);
                  }}
                  style={{ fontSize: '0.775rem' }}
                >
                  <span>Technical Drills</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${drillMode === 'non_technical' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    setDrillMode('non_technical');
                    setCurrentDrillIndex(0);
                    setDrillAnswer('');
                    setDrillFeedback(null);
                  }}
                  style={{ fontSize: '0.775rem' }}
                >
                  <span>Cultural & Behavioral</span>
                </button>
              </div>
            </div>

            {/* Question Progress: 1 of 10 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                Drill <strong>{currentDrillIndex + 1}</strong> of <strong>{drillQuestions.length}</strong>
              </span>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setCurrentDrillIndex((p) => Math.max(0, p - 1));
                    setDrillAnswer('');
                    setDrillFeedback(null);
                  }}
                  disabled={currentDrillIndex === 0}
                  aria-label="Previous Drill Question"
                >
                  <ChevronLeft size={14} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setCurrentDrillIndex((p) => Math.min(drillQuestions.length - 1, p + 1));
                    setDrillAnswer('');
                    setDrillFeedback(null);
                  }}
                  disabled={currentDrillIndex === drillQuestions.length - 1}
                  aria-label="Next Drill Question"
                >
                  <ChevronRight size={14} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* Drill Question Card */}
          <div
            className="card"
            style={{
              marginBottom: '1.5rem',
              padding: '1.25rem',
              borderLeft: '4px solid #38bdf8',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                {currentDrillIndex + 1}. {currentDrillQ.title}
              </h3>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                  {drillCompany}
                </span>
                <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                  {currentDrillQ.stage}
                </span>
              </div>
            </div>
            <p style={{ fontSize: '0.95rem', color: '#e0f2fe', lineHeight: 1.5, margin: '0.5rem 0' }}>
              {currentDrillQ.prompt}
            </p>
          </div>

          {/* Answering Studio: Typed vs Speech Mode */}
          <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
            {/* Input Mode Selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                Your Answer Submission:
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Input Method:</span>
                <button
                  type="button"
                  className={`btn btn-sm ${drillInputMethod === 'typed' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    stopSpeechRecognition();
                    setDrillInputMethod('typed');
                  }}
                  style={{ fontSize: '0.75rem' }}
                >
                  <span>Typed Answer</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${drillInputMethod === 'speech' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setDrillInputMethod('speech')}
                  style={{ fontSize: '0.75rem', gap: '0.3rem' }}
                >
                  <Mic size={12} aria-hidden="true" />
                  <span>Speech-to-Text</span>
                </button>
              </div>
            </div>

            {/* Speech-to-Text Dictation Controls */}
            {drillInputMethod === 'speech' && (
              <div
                style={{
                  marginBottom: '1rem',
                  padding: '0.875rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: isListeningSpeech ? 'rgba(56, 189, 248, 0.1)' : 'rgba(30, 41, 59, 0.6)',
                  border: isListeningSpeech ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isListeningSpeech ? (
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: '#38bdf8',
                          animation: 'pulse 1.5s infinite',
                        }}
                      />
                    ) : (
                      <MicOff size={15} style={{ color: 'var(--text-dim)' }} aria-hidden="true" />
                    )}
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isListeningSpeech ? '#7dd3fc' : 'var(--text-main)' }}>
                      {isListeningSpeech ? 'Listening... Speak your answer into the microphone.' : 'Microphone Ready'}
                    </span>
                  </div>
                  {speechTranscriptPreview && (
                    <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '0.25rem', fontStyle: 'italic' }}>
                      "{speechTranscriptPreview}..."
                    </div>
                  )}
                  {!speechSupported && (
                    <div style={{ fontSize: '0.75rem', color: '#fca5a5', marginTop: '0.25rem' }}>
                      ⚠️ Web Speech API is not supported in this browser. Please use Typed mode.
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {isListeningSpeech ? (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={stopSpeechRecognition}
                      style={{ fontSize: '0.775rem', gap: '0.35rem' }}
                    >
                      <MicOff size={13} aria-hidden="true" />
                      <span>Stop Listening</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={startSpeechRecognition}
                      disabled={!speechSupported}
                      style={{ fontSize: '0.775rem', gap: '0.35rem' }}
                    >
                      <Mic size={13} aria-hidden="true" />
                      <span>Start Speaking</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Answer Textarea */}
            <textarea
              value={drillAnswer}
              onChange={(e) => setDrillAnswer(e.target.value)}
              placeholder={
                drillInputMethod === 'speech'
                  ? 'Your spoken words will appear here automatically. You can also edit this text directly...'
                  : `Type your ${drillMode} response tailored to ${drillCompany}'s interview standards...`
              }
              rows={7}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: '#090d16',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-main)',
                fontSize: '0.875rem',
                lineHeight: 1.5,
                resize: 'vertical',
                outline: 'none',
              }}
              aria-label="Company Drill Answer"
            />

            {/* Drill Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleEvaluateDrill}
                  disabled={isEvaluatingDrill || !drillAnswer.trim()}
                  style={{ gap: '0.35rem', fontWeight: 600 }}
                >
                  <Sparkles size={14} aria-hidden="true" />
                  <span>{isEvaluatingDrill ? 'Evaluating...' : 'Evaluate Answer'}</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setDrillAnswer('')}
                  disabled={!drillAnswer}
                  style={{ fontSize: '0.775rem' }}
                >
                  <span>Clear</span>
                </button>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleSaveDrillSession}
                disabled={isSavingRecord || !drillAnswer.trim()}
                style={{ gap: '0.35rem', fontSize: '0.775rem' }}
              >
                <Bookmark size={13} aria-hidden="true" />
                <span>Save Drill Session</span>
              </button>
            </div>

            {/* Drill Feedback Results */}
            {drillFeedback && (
              <div
                style={{
                  marginTop: '1.25rem',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#38bdf8' }}>
                    Drill Evaluation Score: {drillFeedback.score}/100
                  </div>
                  <span className={`badge ${drillFeedback.score >= 80 ? 'badge-success' : 'badge-warning'}`}>
                    {drillFeedback.verdict}
                  </span>
                </div>

                {drillFeedback.strengths.length > 0 && (
                  <div style={{ fontSize: '0.8rem', color: '#6ee7b7', marginBottom: '0.35rem' }}>
                    <strong>Strengths:</strong>
                    <ul style={{ margin: '0.2rem 0 0 1.25rem', padding: 0 }}>
                      {drillFeedback.strengths.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {drillFeedback.improvements.length > 0 && (
                  <div style={{ fontSize: '0.8rem', color: '#fde68a' }}>
                    <strong>Recommendations:</strong>
                    <ul style={{ margin: '0.2rem 0 0 1.25rem', padding: 0 }}>
                      {drillFeedback.improvements.map((imp, idx) => (
                        <li key={idx}>{imp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
