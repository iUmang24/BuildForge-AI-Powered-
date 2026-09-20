export interface User {
  id: string;
  name: string;
  email: string;
  college: string;
  domain: string;
  skillLevel: "beginner" | "intermediate" | "advanced";
  internshipId: string;
  currentWeek: number;
  startDate: string;
  endDate: string;
  finalScore: number | null;
  certificateId: string | null;
}


