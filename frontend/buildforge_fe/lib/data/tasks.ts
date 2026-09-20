// export type TaskStatus = "locked" | "open" | "submitted" | "reviewed" | "rejected";

export type TaskStatus =
  | "open"
  | "submitted"
  | "reviewed"
  | "rejected"
  | "locked"
  | (string & {});


export interface Task {
  id: string;
  week: number;
  title: string;
  description: string;
  fullDescription: string;
  deadline: string;
  status: TaskStatus;
  resources: { title: string; url: string }[];
  rubric: string[];
  score?: number;
  feedback?: string;
}

export const tasks: Task[] = [
  {
    id: "task-001",
    week: 1,
    title: "Build a Personal Portfolio Homepage",
    description: "Create a responsive homepage with hero section, about, and contact form.",
    fullDescription: `In this task, you will build a personal portfolio homepage from scratch using HTML, CSS, and JavaScript.

**Requirements:**
- Create a responsive hero section with your name and tagline
- Add an "About Me" section with your background
- Include a skills section with visual progress bars
- Build a contact form with validation
- Ensure the page is fully responsive across all devices

**Learning Objectives:**
- Understand responsive design principles
- Practice CSS Flexbox and Grid layouts
- Implement form validation with JavaScript`,
    deadline: "2026-01-07",
    status: "reviewed",
    resources: [
      { title: "CSS Flexbox Guide", url: "https://css-tricks.com/snippets/css/a-guide-to-flexbox/" },
      { title: "Responsive Design Basics", url: "https://web.dev/responsive-web-design-basics/" },
    ],
    rubric: [
      "Responsive design (works on mobile and desktop)",
      "Clean HTML structure with semantic elements",
      "CSS styling matches modern design principles",
      "Form validation works correctly",
      "Code is well-organized and commented",
    ],
    score: 8,
    feedback: "Great work on the responsive design! Consider adding more interactivity.",
  },
  {
    id: "task-002",
    week: 2,
    title: "React Todo Application",
    description: "Build a fully functional todo app with React hooks and local storage.",
    fullDescription: `Create a complete Todo application using React that demonstrates your understanding of component architecture and state management.

**Requirements:**
- Add, edit, and delete todos
- Mark todos as complete/incomplete
- Filter todos by status (all, active, completed)
- Persist data using localStorage
- Add due dates to todos

**Learning Objectives:**
- Master React hooks (useState, useEffect)
- Understand component composition
- Learn about data persistence`,
    deadline: "2026-01-14",
    status: "reviewed",
    resources: [
      { title: "React Hooks Documentation", url: "https://react.dev/reference/react" },
      { title: "localStorage API", url: "https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage" },
    ],
    rubric: [
      "All CRUD operations work correctly",
      "Filtering functionality implemented",
      "Data persists after page refresh",
      "Clean component architecture",
      "Good UX with loading states",
    ],
    score: 9,
    feedback: "Excellent implementation! Your code structure is very clean.",
  },
  {
    id: "task-003",
    week: 3,
    title: "API Integration Dashboard",
    description: "Build a dashboard that fetches and displays data from a public API.",
    fullDescription: `Create a data dashboard that integrates with a public API to display real-time information.

**Requirements:**
- Fetch data from a public API (weather, news, or similar)
- Display data in cards or a table format
- Implement search and filtering
- Add loading and error states
- Make it responsive and accessible

**Learning Objectives:**
- Learn API integration with fetch/axios
- Handle async operations in React
- Implement proper error handling`,
    deadline: "2026-01-21",
    status: "open",
    resources: [
      { title: "Fetch API Guide", url: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API" },
      { title: "Public APIs List", url: "https://github.com/public-apis/public-apis" },
    ],
    rubric: [
      "API integration works correctly",
      "Loading states are shown",
      "Error handling is implemented",
      "Search/filter functionality works",
      "Responsive and accessible design",
    ],
  },
  {
    id: "task-004",
    week: 4,
    title: "E-commerce Product Page",
    description: "Design and build a product detail page with cart functionality.",
    fullDescription: `Build a complete e-commerce product page with all standard features.

**Requirements:**
- Product image gallery with thumbnails
- Product details (name, price, description)
- Size/color selectors
- Add to cart functionality
- Quantity selector
- Reviews section

**Learning Objectives:**
- Build complex UI components
- Manage state across components
- Implement shopping cart logic`,
    deadline: "2026-01-28",
    status: "locked",
    resources: [
      { title: "E-commerce UX Best Practices", url: "https://baymard.com/blog" },
      { title: "React Context for Cart", url: "https://react.dev/reference/react/useContext" },
    ],
    rubric: [
      "Image gallery works smoothly",
      "Product options are selectable",
      "Cart functionality is complete",
      "Mobile responsive design",
      "Accessible components",
    ],
  },
  {
    id: "task-005",
    week: 5,
    title: "Authentication Flow",
    description: "Implement a complete authentication system with login, signup, and protected routes.",
    fullDescription: `Create a complete authentication system for a web application.

**Requirements:**
- Login and signup forms
- Form validation
- Protected routes
- Session management
- Logout functionality
- Remember me feature

**Learning Objectives:**
- Understand authentication flows
- Implement protected routes
- Handle form validation`,
    deadline: "2026-02-04",
    status: "locked",
    resources: [
      { title: "React Router Auth", url: "https://reactrouter.com/en/main/start/tutorial" },
      { title: "JWT Authentication", url: "https://jwt.io/introduction" },
    ],
    rubric: [
      "Login/signup forms work correctly",
      "Validation provides clear feedback",
      "Protected routes redirect properly",
      "Session persists correctly",
      "Secure password handling",
    ],
  },
  {
    id: "task-006",
    week: 6,
    title: "Real-time Chat Interface",
    description: "Build a chat UI with message threads and typing indicators.",
    fullDescription: `Create a real-time chat interface that demonstrates modern messaging patterns.

**Requirements:**
- Message thread display
- Send and receive messages
- Typing indicators
- Message timestamps
- Emoji support
- Responsive design

**Learning Objectives:**
- Build real-time UI patterns
- Handle optimistic updates
- Create engaging UX`,
    deadline: "2026-02-11",
    status: "locked",
    resources: [
      { title: "WebSocket Basics", url: "https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API" },
      { title: "Chat UI Patterns", url: "https://www.nngroup.com/articles/chat-ux/" },
    ],
    rubric: [
      "Messages display correctly",
      "Send functionality works",
      "Typing indicator shows",
      "Timestamps are formatted",
      "Mobile-friendly design",
    ],
  },
  {
    id: "task-007",
    week: 7,
    title: "Data Visualization Dashboard",
    description: "Create interactive charts and graphs using a charting library.",
    fullDescription: `Build a dashboard with various data visualizations using charts and graphs.

**Requirements:**
- Line chart showing trends
- Bar chart for comparisons
- Pie chart for distributions
- Interactive tooltips
- Responsive charts
- Data filtering

**Learning Objectives:**
- Learn charting libraries
- Handle data transformations
- Create interactive visualizations`,
    deadline: "2026-02-18",
    status: "locked",
    resources: [
      { title: "Recharts Documentation", url: "https://recharts.org/" },
      { title: "Data Visualization Best Practices", url: "https://www.tableau.com/learn/articles/data-visualization" },
    ],
    rubric: [
      "Charts render correctly",
      "Interactivity works",
      "Data is formatted properly",
      "Responsive on all devices",
      "Accessible chart labels",
    ],
  },
  {
    id: "task-008",
    week: 8,
    title: "Final Project: Full Stack Mini App",
    description: "Combine all learned skills to build a complete mini application.",
    fullDescription: `Apply everything you've learned to build a complete mini application of your choice.

**Requirements:**
- Choose a project idea (task manager, blog, portfolio, etc.)
- Implement frontend with React
- Add authentication
- Include at least one API integration
- Deploy to a hosting platform
- Write documentation

**Learning Objectives:**
- Apply all learned concepts
- Make architectural decisions
- Deploy a real application`,
    deadline: "2026-02-28",
    status: "locked",
    resources: [
      { title: "Vercel Deployment", url: "https://vercel.com/docs" },
      { title: "Project Ideas", url: "https://www.frontendmentor.io/" },
    ],
    rubric: [
      "Project idea is well-defined",
      "All core features work",
      "Code is clean and documented",
      "Successfully deployed",
      "README is comprehensive",
    ],
  },
];
