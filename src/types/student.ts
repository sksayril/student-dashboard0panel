export interface Teammate {
  id: string;
  name: string;
  avatar: string;
  score: number;
}

export interface Lesson {
  id: string;
  title: string;
  category: string;
  duration: string;
  color: string;
}

export interface SkillCategory {
  name: string;
  percentage: number;
  color: string;
}

export interface StudentData {
  name: string;
  avatar: string;
  score: number;
  weeklyHours: number;
  semesterHours: number;
  skillImprovement: number;
  mainSkillpoints: number;
  teammates: Teammate[];
  nextLessons: Lesson[];
  skills: SkillCategory[];
}
