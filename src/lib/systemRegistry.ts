import type { WidgetRegistry, WidgetConfig } from './types/widget'

// Lazy loading functions for widgets
const loadBirthdayCard = () => import('../components/cards/BirthdayCard.svelte');
const loadAyahCard = () => import('../components/cards/AyahCard.svelte');
const loadPromptCard = () => import('../components/cards/PromptCard.svelte');
const loadFeedbackPrompt = () => import('../components/cards/FeedbackPrompt.svelte');
const loadWallCard = () => import('../components/cards/WallCard.svelte');
const loadWeeklyReflectionCard = () => import('../components/cards/WeeklyReflectionCard.svelte');
const loadWeeklyReflectionDigestCard = () => import('../components/cards/WeeklyReflectionDigestCard.svelte');
const loadAgePlaygroundCard = () => import('../components/cards/AgePlaygroundCard.svelte');
const loadProfileQuizCard = () => import('../components/cards/ProfileQuizCard.svelte');
const loadGuessFamilyCard = () => import('../components/cards/GuessFamilyCard.svelte');
const loadScenarioCard = () => import('../components/cards/ScenarioCard.svelte');
const loadScenarioDigestCard = () => import('../components/cards/ScenarioDigestCard.svelte');
const loadReflectionMoodCard = () => import('../components/cards/ReflectionMoodCard.svelte');
const loadClosingRitualCard = () => import('../components/cards/ClosingRitualCard.svelte');
const loadProfessionCard = () => import('../components/cards/ProfessionCard.svelte');
const loadQuizCard = () => import('../components/cards/QuizCard.svelte');
const loadIslamicQACard = () => import('../components/cards/IslamicQACard.svelte');
const loadIslamicReflectionDigestCard = () => import('../components/cards/IslamicReflectionDigestCard.svelte');

export const systemRegistry: WidgetRegistry = {
  // ANCHOR WIDGETS (High Priority) - Maximum 3-4 visible at first load
  reflectionMood: {
    id: 'reflectionMood',
    name: 'Reflection & Mood Today',
    component: loadReflectionMoodCard,
    priority: 100,
    enabled: true
  },
  ayah: {
    id: 'ayah',
    name: 'Daily Ayah',
    component: loadAyahCard,
    priority: 95,
    enabled: true
  },
  birthday: {
    id: 'birthday',
    name: 'Birthday & Milestones',
    component: loadBirthdayCard,
    priority: 90,
    enabled: true
  },
  quiz: {
    id: 'quiz',
    name: 'Family Quiz',
    component: loadQuizCard,
    priority: 87,
    enabled: true
  },
  scenario: {
    id: 'scenario',
    name: 'What Would You Do?',
    component: loadScenarioCard,
    priority: 85,
    enabled: true
  },
  closingRitual: {
    id: 'closingRitual',
    name: 'Daily Closure',
    component: loadClosingRitualCard,
    priority: 80,
    enabled: true
  },
  
  // QUIET MODE WIDGETS (Lower Priority) - Collapsed by default, shown in "Explore More"
  wall: {
    id: 'wall',
    name: 'Family Wall',
    component: loadWallCard,
    priority: 75,
    enabled: true
  },
  scenarioDigest: {
    id: 'scenarioDigest',
    name: 'Scenario Reflection Digest',
    component: loadScenarioDigestCard,
    priority: 70,
    enabled: true
  },
  profileQuiz: {
    id: 'profileQuiz',
    name: 'Set Your Fun Profile',
    component: loadProfileQuizCard,
    priority: 65,
    enabled: false // Replaced by unified QuizCard
  },
  agePlayground: {
    id: 'agePlayground',
    name: 'Age Playground',
    component: loadAgePlaygroundCard,
    priority: 60,
    enabled: true
  },
  professionCard: {
    id: 'professionCard',
    name: 'Family Professions',
    component: loadProfessionCard,
    priority: 55,
    enabled: true
  },
  islamicQA: {
    id: 'islamicQA',
    name: 'Islamic Q&A',
    component: loadIslamicQACard,
    priority: 53,
    enabled: true
  },
  islamicReflectionDigest: {
    id: 'islamicReflectionDigest',
    name: 'Islamic Reflection Digest',
    component: loadIslamicReflectionDigestCard,
    priority: 52,
    enabled: true
  },

  // LEGACY/MERGED WIDGETS - Keep for backward compatibility but lower priority
  guessFamily: {
    id: 'guessFamily',
    name: 'Guess Family Answers',
    component: loadGuessFamilyCard,
    priority: 50,
    enabled: false // Merged into unified QuizCard
  },
  weeklyReflection: {
    id: 'weeklyReflection',
    name: 'Weekly Reflection',
    component: loadWeeklyReflectionCard,
    priority: 45,
    enabled: false // Functionality merged into ReflectionMoodCard
  },
  weeklyReflectionDigest: {
    id: 'weeklyReflectionDigest',
    name: 'Family Reflections Digest',
    component: loadWeeklyReflectionDigestCard,
    priority: 40,
    enabled: true
  },
  prompt: {
    id: 'prompt',
    name: 'Role-aware Prompts',
    component: loadPromptCard,
    priority: 35,
    enabled: false // Disabled per PHASE1 requirements - repetitive, shallow, low bonding
  },
  feedback: {
    id: 'feedback',
    name: 'Feedback Prompt (Legacy)',
    component: loadFeedbackPrompt,
    priority: 30,
    enabled: false // Disabled in favor of reflectionMood
  }
}