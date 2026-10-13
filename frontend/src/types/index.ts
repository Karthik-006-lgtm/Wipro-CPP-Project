export type PortalSectionId =
  | 'home'
  | 'resume-parser'
  | 'company-details'
  | 'interview-prep'
  | 'preparation-records'
  | 'resume-generator';

export interface SectionMeta {
  id: PortalSectionId;
  title: string;
  shortTitle: string;
  description: string;
  badge: string;
}

export interface DatabaseHealth {
  status: 'connected' | 'unreachable' | 'unconfigured' | string;
  connected: boolean;
  message: string;
  latency_ms?: number | null;
}

export interface BackendHealthResponse {
  status: string;
  app_name: string;
  environment: string;
  version: string;
  timestamp: string;
  database: DatabaseHealth;
}

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isStatusNotice?: boolean;
  isAiGenerated?: boolean;
  providerStatus?: string;
  modelUsed?: string | null;
  suggestions?: string[];
  attachmentName?: string;
  attachmentType?: string;
}

export interface AssistantHistoryItem {
  role: 'user' | 'assistant' | 'model';
  text: string;
}

export interface FileAttachment {
  file_name: string;
  mime_type: string;
  data_base64: string;
}

export interface AssistantChatRequest {
  message: string;
  section: PortalSectionId;
  history?: AssistantHistoryItem[];
  context_data?: Record<string, any>;
  file_attachment?: FileAttachment;
}

export interface AssistantChatResponse {
  success: boolean;
  reply: string;
  sender: 'assistant';
  is_ai_generated: boolean;
  provider_status: 'configured' | 'unconfigured' | 'rate_limited' | 'error' | string;
  model_used?: string | null;
  section_acknowledged: string;
  suggestions: string[];
  error_detail?: string | null;
}

export interface AssistantStatusResponse {
  is_configured: boolean;
  status: 'ready' | 'unconfigured' | string;
  model: string;
  max_message_chars: number;
  max_history_items: number;
  supported_modalities: string[];
  message: string;
}

export interface SelectedFileMetadata {
  name: string;
  sizeBytes: number;
  type: string;
  lastModifiedDate: string;
}

export interface ContactInfo {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  links: string[];
}

export interface DetectedSkill {
  raw_term: string;
  normalized_name: string;
  category: string;
  evidence: string;
}

export interface AtsCheck {
  name: string;
  status: 'pass' | 'warning' | 'fail';
  explanation: string;
  evidence?: string | null;
  suggested_improvement?: string | null;
}

export interface AtsEvaluation {
  heuristic_score: number;
  score_disclaimer: string;
  checks: AtsCheck[];
}

export interface ResumeMetadata {
  filename: string;
  file_format: string;
  file_size_bytes: number;
  word_count: number;
  char_count: number;
  structural_units: number;
}

export interface ResumeParseResponse {
  success: boolean;
  metadata: ResumeMetadata;
  contact_info: ContactInfo;
  sections_detected: string[];
  skills: DetectedSkill[];
  education: string[];
  experience: string[];
  certifications: string[];
  ats_evaluation: AtsEvaluation;
  extracted_text_preview: string;
  warnings: string[];
}

// Phase 4: Coding & Interview Types
export interface CodingLanguage {
  id: number;
  name: string;
  key: string;
  version: string;
  starter_template: string;
}

export interface CodingProblemExample {
  input: string;
  output: string;
  explanation?: string | null;
}

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  description: string;
  examples: CodingProblemExample[];
  constraints: string[];
  starter_code: Record<string, string>;
  hints?: string[];
  test_cases?: Array<{ input: string; expected_output: string; is_hidden?: boolean }>;
}

export interface CodeExecutionRequest {
  source_code: string;
  language_id: number;
  stdin?: string;
  problem_id?: string;
}

export interface CodeExecutionResponse {
  status: 'completed' | 'in_progress' | 'configuration_missing' | 'service_unavailable' | 'compilation_error' | 'runtime_error' | 'time_limit_exceeded' | 'error';
  judge0_status?: string | null;
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  execution_time_seconds?: number | null;
  time_ms?: number | null;
  memory_kb?: number | null;
  exit_code?: number | null;
  message?: string | null;
  token?: string | null;
}

export interface TestCaseResult {
  test_case_index: number;
  input: string;
  expected_output: string;
  actual_output?: string | null;
  passed: boolean;
  execution_time_ms?: number | null;
  error_message?: string | null;
}

export interface CodeSubmitRequest {
  source_code: string;
  language_id: number;
  problem_id: string;
}

export interface CodeSubmitResponse {
  status: 'accepted' | 'wrong_answer' | 'compilation_error' | 'runtime_error' | 'time_limit_exceeded' | 'service_unavailable' | 'error';
  passed_count: number;
  total_count: number;
  test_results: TestCaseResult[];
  compile_output?: string | null;
  runtime_error?: string | null;
  execution_time_seconds?: number | null;
  time_ms?: number | null;
  message: string;
}

export interface Judge0StatusResponse {
  is_configured: boolean;
  api_url: string;
  status: 'ready' | 'unconfigured' | 'unreachable';
  message: string;
}

export interface StarEvaluationRequest {
  question: string;
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface StarComponentCheck {
  component: 'Situation' | 'Task' | 'Action' | 'Result';
  word_count: number;
  status: 'pass' | 'warning' | 'needs_expansion';
  feedback: string;
}

export interface StarEvaluationResponse {
  completeness_score: number;
  status: 'structured' | 'needs_expansion' | 'incomplete';
  components: StarComponentCheck[];
  suggestions: string[];
  disclaimer: string;
}

export interface ArchitectureEvaluationRequest {
  problem_id: string;
  requirements_scope: string;
  high_level_design: string;
  data_modeling: string;
  scalability_tradeoffs: string;
}

export interface ArchitectureEvaluationResponse {
  structural_score: number;
  readiness_level: 'Comprehensive' | 'Adequate' | 'Needs Depth';
  pillars_covered: string[];
  pillars_to_expand: string[];
  recommendations: string[];
  disclaimer: string;
}

export interface VideoAuditRequest {
  duration_seconds: number;
  recorded_format: string;
  sampled_frames_count?: number;
  face_detected_ratio?: number | null;
  transcript_input?: string;
}

export interface VideoAuditResponse {
  recording_valid: boolean;
  duration_formatted: string;
  stream_quality_notes: string[];
  transcription_status: 'unconfigured' | 'user_provided' | 'ready';
  ai_feedback_status: 'unconfigured' | 'available';
  rubric_guidelines: Array<{ criterion: string; benchmark: string; guideline: string }>;
  disclaimer: string;
}

// Phase 5: Preparation Records Types
export interface PreparationRecord {
  id: number;
  practice_type: 'coding' | 'architecture' | 'company' | 'behavioral' | 'video';
  title: string;
  category?: string | null;
  status: string;
  summary?: string | null;
  score?: number | null;
  session_metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PreparationRecordCreate {
  practice_type: 'coding' | 'architecture' | 'company' | 'behavioral' | 'video';
  title: string;
  category?: string | null;
  status?: string;
  summary?: string | null;
  score?: number | null;
  session_metadata?: Record<string, any>;
}

export interface PreparationRecordListResponse {
  items: PreparationRecord[];
  total: number;
  limit: number;
  offset: number;
}

// Phase 6: Resume Generator Types
export interface PersonalInfo {
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  title?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface SkillGroup {
  category: string;
  skills: string[];
}

export interface EducationEntry {
  institution: string;
  degree: string;
  start_date?: string;
  end_date?: string;
  gpa_or_honors?: string;
  details?: string;
}

export interface ExperienceEntry {
  organization: string;
  role: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  current?: boolean;
  responsibilities: string[];
}

export interface ProjectEntry {
  title: string;
  description?: string;
  technologies: string[];
  contributions: string[];
  link?: string;
}

export interface CertificationEntry {
  name: string;
  issuer?: string;
  date?: string;
  credential_url_or_id?: string;
}

export interface CustomSection {
  title: string;
  items: string[];
}

export interface ResumeGeneratorRequest {
  template_id: 'classic_professional' | 'modern_technical' | string;
  personal_info: PersonalInfo;
  summary?: string;
  skill_groups: SkillGroup[];
  education: EducationEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
  custom_sections: CustomSection[];
}

export interface ResumePreviewResponse {
  valid: boolean;
  template_id: string;
  candidate_name: string;
  target_role?: string | null;
  section_counts: Record<string, number>;
  validation_warnings: string[];
}

export interface CompanyProfile {
  id: string;
  name: string;
  slug?: string;
  industry: string;
  location: string;
  description: string;
  tech_stack: string[];
  roles?: string[];
  open_roles?: string[];
  interview_stages: string[];
  culture_notes?: string;
  hiring_level?: string;
  website?: string | null;
  match_score?: number;
  match_percentage?: number;
  matched_skills?: string[];
  missing_skills?: string[];
}

export interface CompanyListResponse {
  items?: CompanyProfile[];
  companies?: CompanyProfile[];
  total: number;
  query?: string | null;
}

export interface CompanyMatchResult {
  company: CompanyProfile;
  match_score?: number;
  match_percentage?: number;
  matched_skills: string[];
  missing_skills?: string[];
  recommended_roles?: string[];
}

export interface CompanyMatchResponse {
  items?: CompanyMatchResult[];
  matches?: CompanyMatchResult[];
  candidate_skills?: string[];
  total?: number;
  total_matches?: number;
  total_input_skills?: number;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  created_at: string;
  last_login_at?: string | null;
}

export interface AuthResponse {
  token: string;
  token_type: string;
  user: User;
}

export interface ForgotPasswordResponse {
  message: string;
  email_sent: boolean;
  reset_token?: string | null;
}

export interface UserActivity {
  id: number;
  user_id: number;
  activity_type: string;
  title: string;
  status: string;
  metadata_json: Record<string, any>;
  created_at: string;
}

export interface ProfileSummaryStats {
  total_activities: number;
  coding_runs_today: number;
  coding_accepted_today: number;
  difficulty_breakdown: Record<string, number>;
  topics_explored: string[];
  interview_drills_count: number;
  resumes_parsed_count: number;
  resumes_generated_count: number;
  companies_matched_count: number;
}

export interface ProfileDashboardResponse {
  user: User;
  stats: ProfileSummaryStats;
  recent_submissions: UserActivity[];
  recent_activities: UserActivity[];
}
