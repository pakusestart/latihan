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
    description: 'Language & Logic for 6th Graders',
    icon: 'functions',
    color: 'indigo',
    imageUrl: 'https://stupid-coffee-cow.myfilebase.com/ipfs/QmQnWoce3zYX7mm6gYUZaxyer4DkvYwx4oaob4KoEGHWzH',
    challengesCount: 12,
    progress: 0,
    difficulty: 'Hard',
    questions: getQuestionsForPack('Bahasa Indonesia') as any
  },
  {
    id: 'math-angle',
    title: 'Matematika TKA',
    description: 'Mathematics TKA for 6th Graders',
    icon: 'category',
    color: 'amber',
    imageUrl: 'https://stupid-coffee-cow.myfilebase.com/ipfs/Qmf66pBsSe8V8yKSCBYMYhcFKEbpuo5voN9bYkbttLhmqp',
    challengesCount: 8,
    progress: 0,
    difficulty: 'Medium',
    questions: getQuestionsForPack('Matematika TKA') as any
  },
  {
    id: 'math-angle',
    title: 'Matematika Garis dan Sudut',
    description: 'Mathematics of Lines & Angles for 7th Graders',
    icon: 'category',
    color: 'amber',
    imageUrl: 'https://stupid-coffee-cow.myfilebase.com/ipfs/Qmf66pBsSe8V8yKSCBYMYhcFKEbpuo5voN9bYkbttLhmqp',
    challengesCount: 8,
    progress: 0,
    difficulty: 'Medium',
    questions: getQuestionsForPack('Matematika Garis dan Sudut') as any
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
