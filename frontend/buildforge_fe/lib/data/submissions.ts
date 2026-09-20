export interface Submission {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  githubLink: string;
  liveLink: string;
  notes: string;
  selfChecks: {
    responsive: boolean;
    readmeAdded: boolean;
    liveLinkWorks: boolean;
  };
  submittedAt: string;
  reviewed: boolean;
}

export interface PeerReview {
  id: string;
  submissionId: string;
  reviewerId: string;
  score: number;
  feedback: string;
  submittedAt: string;
}

// User's own submissions
export const userSubmissions: Submission[] = [
  {
    id: "sub-001",
    taskId: "task-001",
    userId: "user-001",
    userName: "Alex Johnson",
    githubLink: "https://github.com/alexj/portfolio",
    liveLink: "https://alexj-portfolio.vercel.app",
    notes: "Added extra animations and dark mode support.",
    selfChecks: {
      responsive: true,
      readmeAdded: true,
      liveLinkWorks: true,
    },
    submittedAt: "2026-01-06T14:30:00Z",
    reviewed: true,
  },
  {
    id: "sub-002",
    taskId: "task-002",
    userId: "user-001",
    userName: "Alex Johnson",
    githubLink: "https://github.com/alexj/todo-app",
    liveLink: "https://alexj-todo.vercel.app",
    notes: "Implemented drag and drop for reordering todos.",
    selfChecks: {
      responsive: true,
      readmeAdded: true,
      liveLinkWorks: true,
    },
    submittedAt: "2026-01-13T16:45:00Z",
    reviewed: true,
  },
];

// Submissions assigned for peer review
export const peerReviewAssignments: Submission[] = [
  {
    id: "sub-101",
    taskId: "task-003",
    userId: "user-102",
    userName: "Sarah Chen",
    githubLink: "https://github.com/sarahc/weather-dashboard",
    liveLink: "https://sarahc-weather.vercel.app",
    notes: "Used OpenWeather API with 5-day forecast feature.",
    selfChecks: {
      responsive: true,
      readmeAdded: true,
      liveLinkWorks: true,
    },
    submittedAt: "2026-01-19T10:15:00Z",
    reviewed: false,
  },
  {
    id: "sub-102",
    taskId: "task-003",
    userId: "user-103",
    userName: "Mike Peters",
    githubLink: "https://github.com/mikep/news-dashboard",
    liveLink: "https://mikep-news.vercel.app",
    notes: "Integrated NewsAPI with category filtering.",
    selfChecks: {
      responsive: true,
      readmeAdded: false,
      liveLinkWorks: true,
    },
    submittedAt: "2026-01-19T11:30:00Z",
    reviewed: false,
  },
];

export const completedPeerReviews: PeerReview[] = [];
