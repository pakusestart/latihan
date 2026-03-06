
/// <reference types="vite/client" />

import { Question } from '../types';

// Load all markdown files eagerly
const questionFiles = import.meta.glob('./content/*_question_*.md', { as: 'raw', eager: true });
const answerFiles = import.meta.glob('./content/*_answer_*.md', { as: 'raw', eager: true });

interface ParsedAnswer {
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  hint: string;
}

function parseAnswerFile(content: string): ParsedAnswer {
  const lines = content.split('\n');
  const options: string[] = [];
  let correctAnswerIndex = -1;
  let explanation = '';
  let hint = '';
  
  let currentSection: 'options' | 'explanation' | 'hint' = 'options';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.toLowerCase().startsWith('explanation:') || line.startsWith('> Explanation:')) {
      currentSection = 'explanation';
      explanation = line.replace(/^(> )?Explanation:\s*/i, '');
      continue;
    }

    if (line.toLowerCase().startsWith('hint:') || line.startsWith('> Hint:')) {
      currentSection = 'hint';
      hint = line.replace(/^(> )?Hint:\s*/i, '');
      continue;
    }

    if (currentSection === 'options') {
      // Check for checkbox format: - [ ] or - [x]
      const checkboxMatch = line.match(/^-\s*\[([ xX])\]\s*(.*)/);
      if (checkboxMatch) {
        const isCorrect = checkboxMatch[1].toLowerCase() === 'x';
        const text = checkboxMatch[2];
        if (isCorrect) correctAnswerIndex = options.length;
        options.push(text);
      } else {
        // Fallback for simple list
        if (line.startsWith('- ') || line.startsWith('* ')) {
             // Check if it ends with (Correct)
             const isCorrect = line.toLowerCase().includes('(correct)');
             const text = line.replace(/^[-*]\s*/, '').replace(/\s*\(Correct\)/i, '').trim();
             if (isCorrect) correctAnswerIndex = options.length;
             options.push(text);
        }
      }
    } else if (currentSection === 'explanation') {
        explanation += ' ' + line;
    } else if (currentSection === 'hint') {
        hint += ' ' + line;
    }
  }

  return {
    options,
    correctAnswerIndex: correctAnswerIndex === -1 ? 0 : correctAnswerIndex, // Default to 0 if not found
    explanation: explanation.trim(),
    hint: hint.trim()
  };
}

export function loadQuestionContent(packTitle: string, questionNumber: number | string): Partial<Question> {
  const questionKey = `./content/${packTitle}_question_${questionNumber}.md`;
  const answerKey = `./content/${packTitle}_answer_${questionNumber}.md`;

  const questionRaw = questionFiles[questionKey] as string;
  const answerRaw = answerFiles[answerKey] as string;

  if (!questionRaw) {
    console.warn(`Question file not found: ${questionKey}`);
    return { questionText: 'Question not found' };
  }

  if (!answerRaw) {
    console.warn(`Answer file not found: ${answerKey}`);
    return { questionText: questionRaw, options: [], correctAnswerIndex: 0, explanation: '', hint: '' };
  }

  // Parse image from question text
  let imageUrl: string | undefined;
  let questionText = questionRaw;
  
  const imageMatch = questionRaw.match(/^(Image:\s*(.+))(\r?\n|$)/i);
  if (imageMatch) {
    imageUrl = imageMatch[2].trim();
    questionText = questionRaw.replace(imageMatch[0], '').trim();
  }

  const parsedAnswer = parseAnswerFile(answerRaw);

  return {
    questionText,
    imageUrl,
    ...parsedAnswer
  };
}

export function getQuestionsForPack(packTitle: string): any[] {
  const questions: any[] = [];
  let i = 1;
  while (true) {
    const questionKey = `./content/${packTitle}_question_${i}.md`;
    if (questionFiles[questionKey]) {
      questions.push({
        id: `q${i}`,
        type: packTitle === 'Mystic Patterns' ? 'visual-pattern' : 'multiple-choice',
        ...loadQuestionContent(packTitle, i)
      });
      i++;
    } else {
      break;
    }
  }
  return questions;
}
