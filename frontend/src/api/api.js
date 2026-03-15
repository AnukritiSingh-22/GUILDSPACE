// src/api/api.js
// Mock API — swap these with real fetch/axios calls later

export const POSTS = [
  {
    id: 1,
    title: "Building an open-source air quality prediction model for Indian cities",
    desc: "Looking for collaborators to help build and train an ML model that predicts PM2.5 levels across 40+ cities. Need help with feature engineering, model architecture, and interpretability dashboards.",
    poster: { name: "Meera Krishnan", initials: "MK", city: "Bengaluru" },
    tags: ["Python", "ML", "Data Viz", "GIS"],
    difficulty: 6, minTrust: 3.0,
    domain: "Research", applyType: "questions",
    questions: [
      "What is your relevant experience with ML and environmental data?",
      "Why does this project interest you?",
      "How many hours per week can you commit?",
    ],
    applicants: 10, aiMatch: 94, timeAgo: "2h ago",
    aiReason: "Strong match on all required skills. Trust value meets minimum. Two geospatial ML projects in history directly align with project needs.",
  },
  {
    id: 2,
    title: "Redesigning civic participation — UX research on voter apps",
    desc: "Running a user study on digital voting interfaces in rural India. Need someone with UX research and data analysis background for qualitative interview design and analysis.",
    poster: { name: "Sneha Joshi", initials: "SJ", city: "Pune" },
    tags: ["UX Research", "Data Analysis", "Figma"],
    difficulty: 3, minTrust: 1.5,
    domain: "Design", applyType: "oneclick",
    questions: [],
    applicants: 4, aiMatch: 78, timeAgo: "5h ago",
    aiReason: "Good match on UX Research and Data Analysis skills. Trust value comfortably meets the minimum threshold.",
  },
  {
    id: 3,
    title: "NLP pipeline for summarising Supreme Court judgements",
    desc: "Building a legal tech tool to make court orders accessible. Need a collaborator for NLP fine-tuning using Indian legal corpus. 8,000 labelled documents ready.",
    poster: { name: "Ravi Verma", initials: "RV", city: "Delhi" },
    tags: ["NLP", "Python", "Legal Tech", "PyTorch"],
    difficulty: 8, minTrust: 4.0,
    domain: "Tech / Dev", applyType: "questions",
    questions: [
      "Describe your NLP fine-tuning experience and frameworks used.",
      "Have you worked with Indian or legal language datasets before?",
    ],
    applicants: 7, aiMatch: 61, timeAgo: "1d ago",
    aiReason: "Strong NLP skills match. Trust 4.2 meets the 4.0 minimum. Promising candidate despite missing some secondary skills.",
  },
  {
    id: 4,
    title: "Groundwater dataset cleanup sprint — Maharashtra borewells",
    desc: "Raw government data from 2,000+ borewells spanning 15 years. Need help cleaning, standardising and publishing as open dataset. Python + Pandas sufficient.",
    poster: { name: "Ananya Rao", initials: "AR2", city: "Mumbai" },
    tags: ["Python", "Pandas", "Data Cleaning"],
    difficulty: 2, minTrust: 1.0,
    domain: "Social / NGO", applyType: "oneclick",
    questions: [],
    applicants: 12, aiMatch: 88, timeAgo: "3h ago",
    aiReason: "Strong Python and data skills. Low difficulty — great trust-building project.",
  },
];

export const APPLICANTS = [
  {
    id: 1, name: "Aryan Rao", initials: "AR", trust: 4.2, projects: 7, fit: 94, badge: "Top pick",
    role: "ML Engineer", city: "Delhi",
    skills: ["Python ✓", "ML ✓", "Data Viz ✓", "NLP ✓"], missing: ["GIS"],
    answers: [
      "Built ML pipelines for flood zone prediction using NDVI and rainfall data for 2 years. Comfortable with XGBoost and LightGBM on time-series sensor data.",
      "Air quality is a measurable public health issue and I've been looking for a project at this intersection.",
      "8–10 hrs/week, weekends preferred",
    ],
  },
  {
    id: 2, name: "Priya Kapoor", initials: "PK", trust: 3.8, projects: 5, fit: 88, badge: null,
    role: "Data Scientist", city: "Chennai",
    skills: ["Python ✓", "GIS ✓", "Data Viz ✓"], missing: ["ML"],
    answers: ["3 years with geospatial data at a climate NGO.", "Air quality in Chennai is severe — very personal motivation.", "6 hrs/week"],
  },
  {
    id: 3, name: "Vikram Reddy", initials: "VR", trust: 5.1, projects: 12, fit: 72, badge: null,
    role: "PhD Env. Sci.", city: "Hyderabad",
    skills: ["ML ✓", "Climate ✓"], missing: ["Python (R user)", "Data Viz"],
    answers: ["Environmental science researcher with ML in R.", "Strong domain expertise for ground-truth validation.", "10+ hrs/week"],
  },
  {
    id: 4, name: "Sunita Nair", initials: "SN", trust: 2.1, projects: 3, fit: 41, badge: null,
    role: "Backend Dev", city: "Kochi",
    skills: ["Python ✓"], missing: ["ML", "Data Viz", "GIS"],
    answers: ["Backend dev, learning ML.", "Want to contribute to climate open-source.", "5 hrs/week"],
  },
  {
    id: 5, name: "Kabir Mehta", initials: "KM", trust: 3.3, projects: 4, fit: 65, badge: null,
    role: "ML Researcher", city: "Jaipur",
    skills: ["PyTorch ✓", "ML ✓", "Python ✓"], missing: ["Data Viz", "GIS"],
    answers: ["Deep learning researcher. 2 papers on environmental sensor fusion.", "Applied ML for climate is my focus.", "8 hrs/week"],
  },
];

export const CURRENT_USER = {
  name: "Aryan Rao",
  initials: "AR",
  trust: 4.2,
  level: 3,
  role: "ML Engineer",
  city: "Delhi",
  college: "IIT Delhi",
  skills: ["Python", "Machine Learning", "NLP", "Data Viz", "React", "Statistics", "PyTorch"],
  interests: "Climate tech, civic tech, open-source AI, health data, language preservation",
  links: { github: "github.com/aryanrao", arxiv: "arxiv.org/a/aryanrao" },
  projects: [
    {
      title: "Dialect-aware ASR for low-resource Indian languages",
      status: "Completed", domain: "Research",
      tags: ["NLP", "Python", "Speech"],
      rating: 5.0, trustGain: 1.2,
      collab: "Priya S., Karan M.", duration: "6 months",
    },
    {
      title: "Real-time traffic anomaly detection for Mumbai expressways",
      status: "Active", domain: "Tech / Dev",
      tags: ["ML", "Python", "CV"],
      rating: null, collab: "Aditya K.", duration: "2 months",
    },
    {
      title: "Crop yield anomalies open dataset — Vidarbha",
      status: "Completed", domain: "Social / NGO",
      tags: ["Data", "Python", "GIS"],
      rating: 4.3, trustGain: 0.8,
      collab: "Solo", duration: "3 months",
    },
  ],
};

// Simulate async fetch
export const fetchPosts = () => Promise.resolve(POSTS);
export const fetchApplicants = () => Promise.resolve(APPLICANTS);
export const fetchUser = () => Promise.resolve(CURRENT_USER);
export const submitApplication = (data) => {
  console.log("Application submitted:", data);
  return new Promise(res => setTimeout(() => res({ success: true }), 800));
};
export const createPost = (data) => {
  console.log("Post created:", data);
  return new Promise(res => setTimeout(() => res({ success: true, id: Date.now() }), 800));
};