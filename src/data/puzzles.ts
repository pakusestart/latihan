import { PuzzlePack } from '../types';
import { getQuestionsForPack } from './loader';

/**
 * PUZZLE_PACKS Configuration
 * 
 * To add a new pack:
 * 1. Add a new object to the PUZZLE_PACKS array.
 * 2. Set id, title, description, icon ('functions', 'category', 'psychology'), color, and imageUrl.
 * 3. Add questions to the 'questions' array.
 * 
 * Content Loading:
 * Questions and Answers are loaded from markdown files in `src/data/content/`.
 * Naming convention:
 * - Question: `[PackTitle]_question_[QuestionNumber].md`
 * - Answer: `[PackTitle]_answer_[QuestionNumber].md`
 */

export const PUZZLE_PACKS: PuzzlePack[] = [
  {
    id: 'bahasa-indonesia',
    title: 'Bahasa Indonesia',
    description: 'Language & Logic',
    icon: 'functions',
    color: 'indigo',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800',
    challengesCount: 12,
    progress: 0,
  difficulty: 'Easy',
    questions: getQuestionsForPack('Bahasa Indonesia') as any
  },
  {
    id: 'mystic-patterns',
    title: 'Mystic Patterns',
    description: 'Ancient Runes & Sequences',
    icon: 'category',
    color: 'amber',
    imageUrl: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&q=80&w=800',
    challengesCount: 8,
    progress: 0,
    difficulty: 'Hard',
    questions: getQuestionsForPack('Mystic Patterns') as any
  },
  {
    id: 'fairy-riddles',
    title: 'Fairy Riddles',
    description: 'Whispers from the Pixies',
    icon: 'psychology',
    color: 'rose',
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=800',
    challengesCount: 15,
    difficulty: 'Easy',
    isLocked: true,
    requiredLevel: 5,
    questions: getQuestionsForPack('Fairy Riddles') as any
  }
];
