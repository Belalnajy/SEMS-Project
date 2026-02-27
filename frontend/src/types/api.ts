export interface Role {
  id: number;
  name: 'supervisor' | 'manager' | 'student' | 'guest';
}

export interface Section {
  id: number;
  name: string;
  description?: string | null;
}

export interface StudentProfile {
  id: number;
  full_name: string;
  student_number: string;
  is_guest: boolean;
  section?: Section;
}

export interface User {
  id: number;
  username: string;
  national_id: string;
  email: string;
  role: Role;
  student?: StudentProfile;
  created_at: string;
}

export interface Subject {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface ExamModel {
  id: number;
  name: string;
  duration_minutes: number;
  allow_reattempt: boolean;
  is_active: boolean;
  subject: Subject;
  questions?: Question[];
  created_at: string;
}

export interface Answer {
  id: number;
  answer_text: string;
  is_correct?: boolean; // Hidden for students
  sort_order: number;
}

export interface Question {
  id: number;
  question_text: string;
  sort_order: number;
  answers: Answer[];
}

export interface Result {
  result_id: number;
  student_name: string;
  student_number: string;
  section_name: string;
  subject_name: string;
  exam_name: string;
  exam_id: number;
  score: number;
  total_questions: number;
  percentage: number;
  completed_at: string;
}

export interface Stats {
  total_exams_taken: number;
  average_score: number;
}

export interface AuthResponse {
  user: User;
  token: string;
}
