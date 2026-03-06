import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Trophy, 
  ChevronRight, 
  RotateCcw, 
  Brain, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Maximize2, 
  X,
  Star,
  Lock,
  ArrowRight,
  Volume2,
  VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ReactMarkdown from 'react-markdown';
import { PUZZLE_PACKS } from './data/puzzles';
import { PuzzlePack, Question } from './types';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SOUND_EFFECTS = {
  click: "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3",
  correct: "https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3",
  incorrect: "https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3",
  complete: "https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3",
  bg: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" // Placeholder for magical bg music
};

// --- Components ---

const StarBackground = () => {
  const stars = Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 5,
    duration: Math.random() * 3 + 2,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          initial={{ opacity: 0.2, scale: 0.5 }}
          animate={{ 
            opacity: [0.2, 0.8, 0.2],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: "easeInOut"
          }}
          className="absolute bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
          }}
        />
      ))}
    </div>
  );
};

const FloatingStar3D = ({ className }: { className?: string }) => {
  return (
    <motion.div
      animate={{ 
        y: [0, -20, 0],
        rotate: [0, 10, -10, 0],
        scale: [1, 1.1, 1]
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className={cn("relative", className)}
    >
      <Star className="w-16 h-16 text-amber-400 fill-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]" />
      <div className="absolute inset-0 bg-amber-400/20 blur-xl rounded-full" />
    </motion.div>
  );
};

const ConfettiStars = () => {
  const stars = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 2,
    size: Math.random() * 20 + 10,
    duration: Math.random() * 2 + 3,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          initial={{ y: -50, opacity: 0, rotate: 0 }}
          animate={{ 
            y: ['0vh', '110vh'],
            opacity: [0, 1, 1, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: "linear"
          }}
          className="absolute text-amber-400"
          style={{
            left: star.left,
            width: star.size,
            height: star.size,
          }}
        >
          <Star className="w-full h-full fill-current" />
        </motion.div>
      ))}
    </div>
  );
};

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className,
  disabled
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'amber';
  className?: string;
  disabled?: boolean;
}) => {
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20',
    secondary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20',
    outline: 'border-2 border-white/10 hover:bg-white/5 text-white',
    ghost: 'text-white/60 hover:text-white hover:bg-white/5',
    amber: 'bg-amber-500 hover:bg-amber-600 text-[#1e1b4b] font-bold'
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'px-6 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        className
      )}
    >
      {children}
    </motion.button>
  );
};

export default function App() {
  const [screen, setScreen] = useState<'home' | 'packs' | 'quiz' | 'result'>('home');
  const [selectedPack, setSelectedPack] = useState<PuzzlePack | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [hasRetriedCurrentQuestion, setHasRetriedCurrentQuestion] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    bgMusicRef.current = new Audio(SOUND_EFFECTS.bg);
    bgMusicRef.current.loop = true;
    bgMusicRef.current.volume = 0.3;

    return () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        bgMusicRef.current = null;
      }
    };
  }, []);

  const toggleMusic = () => {
    if (!bgMusicRef.current) return;
    if (isMuted) {
      bgMusicRef.current.play().catch(() => {});
      setIsMuted(false);
    } else {
      bgMusicRef.current.pause();
      setIsMuted(true);
    }
  };

  const playSound = useCallback((type: keyof typeof SOUND_EFFECTS) => {
    const audio = new Audio(SOUND_EFFECTS[type]);
    audio.play().catch(() => {});
  }, []);

  const handleStart = () => {
    playSound('click');
    if (isMuted) toggleMusic(); // Try to start music on first interaction
    setScreen('packs');
  };

  const handleSelectPack = (pack: PuzzlePack) => {
    if (pack.isLocked) return;
    playSound('click');
    setSelectedPack(pack);
    setCurrentQuestionIndex(0);
    setScore(0);
    setScreen('quiz');
  };

  const handleAnswer = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    setShowExplanation(false);
    const isCorrect = idx === selectedPack?.questions[currentQuestionIndex].correctAnswerIndex;
    
    if (isCorrect) {
      if (!hasRetriedCurrentQuestion) {
        setScore(s => s + 100);
      } else {
        setScore(s => s + 50);
      }
      playSound('correct');
    } else {
      if (!hasRetriedCurrentQuestion) {
        setHasRetriedCurrentQuestion(true);
      }
      playSound('incorrect');
    }
  };

  const handleNext = () => {
    playSound('click');
    if (currentQuestionIndex < (selectedPack?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setSelectedOption(null);
      setShowExplanation(false);
      setHasRetriedCurrentQuestion(false);
    } else {
      playSound('complete');
      setScreen('result');
    }
  };

  const resetGame = () => {
    playSound('click');
    setScreen('home');
    setSelectedPack(null);
    setCurrentQuestionIndex(0);
    setScore(0);
    setHasRetriedCurrentQuestion(false);
    setSelectedOption(null);
  };

  const currentQuestion = selectedPack?.questions[currentQuestionIndex];
  const isCorrect = selectedOption === currentQuestion?.correctAnswerIndex;

  return (
    <div className="min-h-screen bg-[#1e1b4b] text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      <StarBackground />
      
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Music Toggle */}
      <button 
        onClick={toggleMusic}
        className="fixed top-6 right-6 z-[100] p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 hover:bg-white/20 transition-all cursor-pointer"
      >
        {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
      </button>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-8 min-h-screen flex flex-col">
        <AnimatePresence mode="wait">
          {screen === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col md:flex-row items-center justify-center gap-12"
            >
              <div className="flex-1 flex items-center justify-center p-4 relative w-full">
                <FloatingStar3D className="absolute top-10 left-10" />
                <FloatingStar3D className="absolute bottom-20 right-10 scale-75 opacity-50" />
                <motion.div
                  animate={{ 
                    y: [0, -15, 0],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="relative w-full max-w-md aspect-[4/3] flex items-center justify-center"
                >
                  {/* Magical Frame */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 to-purple-600/30 rounded-[60px] blur-2xl animate-pulse" />
                  <div className="absolute -inset-4 border-4 border-white/10 rounded-[70px] backdrop-blur-sm" />
                  <div className="absolute -inset-8 border border-white/5 rounded-[80px]" />
                  
                  <img 
                    src="https://stupid-coffee-cow.myfilebase.com/ipfs/QmdLGrYB3Xf7M3cpn6GLnpq8r3gF6hAdRFhrTufv9coAmc"
                    alt="Magic Book"
                    className="w-full h-full object-contain rounded-[40px] relative z-10 drop-shadow-[0_32px_64px_rgba(0,0,0,0.6)]"
                  />
                  
                  {/* Floating Elements */}
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"
                  />
                </motion.div>
              </div>

              <div className="flex-1 w-full max-w-2xl">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: 'spring', damping: 20 }}
                  className="bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[64px] p-12 md:p-20 flex flex-col items-center shadow-[0_40px_100px_rgba(0,0,0,0.6)] relative overflow-hidden group"
                >
                  {/* Decorative Glow */}
                  <div className="absolute -top-32 -left-32 w-64 h-64 bg-indigo-500/30 rounded-full blur-[100px] group-hover:bg-indigo-500/40 transition-colors" />
                  <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-500/30 rounded-full blur-[100px] group-hover:bg-purple-500/40 transition-colors" />
                  
                  <div className="space-y-8 text-center relative z-10">
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <h1 className="text-6xl md:text-8xl font-black text-white leading-none tracking-tighter">
                        Castle <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Logic</span><br />
                        <span className="text-5xl md:text-6xl opacity-90 block mt-2">Quest</span>
                      </h1>
                    </motion.div>
                    
                    <motion.p 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-purple-100/80 text-xl md:text-2xl font-medium max-w-lg leading-relaxed mx-auto"
                    >
                      Dunia butuh orang hebat kayak kamu. Jangan biarkan rasa malas hari ini ngerusak mimpi besarmu besok. Semangat ya, pelan-pelan asal jalan terus!
                    </motion.p>
                  </div>

                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 w-full flex justify-center"
                  >
                    <Button onClick={handleStart} className="w-full md:w-auto md:px-20 bg-white text-indigo-950 hover:bg-slate-100 py-8 text-2xl rounded-[32px] group shadow-2xl font-black tracking-tight">
                      Begin Journey 
                      <motion.div
                        animate={{ x: [0, 8, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="w-8 h-8" />
                      </motion.div>
                    </Button>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {screen === 'packs' && (
            <motion.div
              key="packs"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="space-y-12 pt-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-2xl">
                    <Star className="w-8 h-8 text-amber-400 fill-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">Castle Logic✨</h2>
                    <p className="text-white/40 text-sm">Welcome back, seeker of wisdom</p>
                  </div>
                </div>
                <button 
                  onClick={() => setScreen('home')}
                  className="p-4 hover:bg-white/5 rounded-2xl transition-all border border-white/10 flex items-center gap-2 group cursor-pointer"
                >
                  <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                  <span className="font-bold hidden md:block">Back to Home</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
                <div className="space-y-6">
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 rounded-full border border-indigo-500/30 text-indigo-300 text-sm font-black tracking-widest uppercase"
                  >
                    <Sparkles className="w-4 h-4" />
                    Daily Challenge
                  </motion.div>
                  <h3 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter">
                    Select Your<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Magic Pack</span>
                  </h3>
                  <p className="text-white/60 text-xl md:text-2xl font-medium max-w-xl leading-relaxed">
                    Pilih paket tantangan yang ingin kamu hadapi hari ini. Setiap paket berisi teka-teki unik yang akan mengasah logika dan kreativitasmu.
                  </p>
                </div>
                
                <div className="hidden lg:flex justify-end">
                  <div className="p-8 bg-white/5 rounded-[48px] border border-white/10 backdrop-blur-xl flex items-center gap-8 shadow-2xl">
                    <div className="text-right">
                      <p className="text-white/40 text-xs font-black uppercase tracking-widest mb-1">Wisdom Level</p>
                      <p className="text-4xl font-black text-white">Master</p>
                    </div>
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.4)]">
                      <Brain className="w-10 h-10 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-8">
                {PUZZLE_PACKS.map((pack) => (
                  <motion.button
                    key={pack.id}
                    whileHover={{ y: -10 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectPack(pack)}
                    className="w-full bg-white rounded-[48px] p-3 flex flex-col items-center shadow-2xl text-left group cursor-pointer"
                  >
                    <div className="w-full aspect-[1.4/1] bg-slate-50 rounded-[40px] overflow-hidden relative">
                      <img src={pack.imageUrl} alt={pack.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      {pack.isLocked && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[4px]">
                          <Lock className="w-16 h-16 text-white" />
                        </div>
                      )}
                      <div className="absolute top-6 right-6">
                        <span className={cn(
                          "text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg",
                          pack.difficulty === 'Easy' ? "bg-emerald-500 text-white" :
                          pack.difficulty === 'Medium' ? "bg-amber-500 text-white" :
                          "bg-rose-500 text-white"
                        )}>
                          {pack.difficulty}
                        </span>
                      </div>
                    </div>
                    <div className="p-8 w-full">
                      <h4 className="text-3xl font-black text-slate-900 mb-2">{pack.title}</h4>
                      <p className="text-slate-400 font-medium text-base leading-relaxed">{pack.description}</p>
                      <div className="mt-6 flex items-center justify-between">
                        <span className="text-indigo-600 font-bold flex items-center gap-2">
                          {pack.questions.length} Challenges <Sparkles className="w-4 h-4" />
                        </span>
                        <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white group-hover:translate-x-2 transition-transform">
                          <ChevronRight className="w-6 h-6" />
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {screen === 'quiz' && selectedPack && currentQuestion && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex-1 flex flex-col gap-8"
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setScreen('packs')}
                    className="p-3 hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <div>
                    <h2 className="text-xl font-bold">{selectedPack.title}</h2>
                    <p className="text-white/40 text-xs uppercase tracking-widest">Challenge {currentQuestionIndex + 1} of {selectedPack.questions.length}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="flex-1 md:w-48 h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" 
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentQuestionIndex + 1) / selectedPack.questions.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-white/60">{Math.round(((currentQuestionIndex + 1) / selectedPack.questions.length) * 100)}%</span>
                </div>
              </div>

              <div className="flex-1 flex flex-col lg:flex-row gap-8">
                <div className="flex-1 space-y-6">
                  <div className="bg-white/10 rounded-[48px] p-8 md:p-12 flex flex-col items-center border border-white/10 backdrop-blur-xl relative overflow-hidden h-full min-h-[400px] justify-center shadow-2xl">
                    <Sparkles className="absolute top-8 right-8 w-8 h-8 text-amber-400/30 animate-pulse" />
                    
                    {currentQuestion.imageUrl && (
                      <div 
                        className="w-full max-w-2xl aspect-video rounded-[32px] overflow-hidden mb-10 bg-white/5 relative group cursor-pointer shadow-2xl"
                        onClick={() => setIsZoomed(true)}
                      >
                        <img src={currentQuestion.imageUrl} alt="Puzzle" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                        <div className="absolute bottom-6 right-6 p-3 bg-black/60 backdrop-blur-md rounded-2xl opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                          <Maximize2 className="w-6 h-6" />
                        </div>
                      </div>
                    )}
                    
                    <div className="text-3xl md:text-4xl font-black text-white text-left leading-tight max-w-3xl prose prose-invert prose-lg prose-p:my-2 prose-strong:text-amber-400">
                      <ReactMarkdown>
                        {currentQuestion.questionText}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>

                <div className="lg:w-[400px] flex flex-col gap-4">
                  <div className="p-6 bg-white/5 rounded-[32px] border border-white/10 mb-2">
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Choose Wisely</p>
                    <div className="grid grid-cols-1 gap-4">
                      {currentQuestion.options.map((option, idx) => (
                        <motion.button
                          key={idx}
                          disabled={selectedOption !== null}
                          onClick={() => handleAnswer(idx)}
                          whileHover={selectedOption === null ? { scale: 1.02, x: 5 } : {}}
                          whileTap={selectedOption === null ? { scale: 0.98 } : {}}
                          className={cn(
                            "p-6 rounded-[24px] flex items-center justify-between text-left text-lg font-bold transition-all border cursor-pointer group",
                            selectedOption === idx 
                              ? "bg-indigo-600 border-indigo-400 text-white shadow-[0_0_30px_rgba(79,70,229,0.4)]" 
                              : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                          )}
                        >
                          <span>{option}</span>
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                            selectedOption === idx ? "bg-white text-indigo-600" : "bg-white/10 text-white/40 group-hover:bg-white/20"
                          )}>
                            {String.fromCharCode(65 + idx)}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-auto p-6 bg-indigo-500/10 rounded-[32px] border border-indigo-500/20 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <Brain className="w-6 h-6 text-indigo-400" />
                    </div>
                    <p className="text-indigo-200/60 text-sm font-medium italic">"Trust your intuition, but verify with logic."</p>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {selectedOption !== null && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-[#1e1b4b]/98 z-50 flex flex-col items-center justify-center backdrop-blur-xl overflow-y-auto py-12 px-8"
                  >
                    <motion.div
                      initial={{ scale: 0.9, y: 40 }}
                      animate={{ scale: 1, y: 0 }}
                      className="w-full max-w-2xl space-y-8 my-auto text-center"
                    >
                      <div className="space-y-4">
                        <motion.div 
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', damping: 12 }}
                          className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4"
                        >
                          <span className="text-6xl block">
                            {isCorrect ? '✨' : '🔮'}
                          </span>
                        </motion.div>
                        <h4 className="text-5xl md:text-7xl font-black text-white tracking-tighter text-center">{isCorrect ? 'MAGICAL!' : 'TRY AGAIN!'}</h4>
                        <p className="text-purple-200 text-xl font-medium text-center">
                          {isCorrect ? "Your wisdom shines bright across the kingdom!" : "Not quite right, but the stars are aligning for you!"}
                        </p>
                      </div>

                      {!isCorrect && (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-10 space-y-6 relative overflow-hidden shadow-2xl"
                        >
                          <div className="flex items-center justify-center gap-3 text-amber-400 font-black tracking-[0.2em] text-xs uppercase">
                            <Sparkles className="w-4 h-4" />
                            Helpful Hint
                          </div>
                          <p className="text-white text-xl md:text-2xl leading-relaxed font-medium">
                            {currentQuestion.hint}
                          </p>
                          
                          {showExplanation && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              className="pt-6 border-t border-white/10 text-purple-200 text-base md:text-lg italic leading-relaxed"
                            >
                              <span className="font-bold text-white not-italic block mb-2">The Wisdom Behind:</span>
                              {currentQuestion.explanation}
                            </motion.div>
                          )}
                        </motion.div>
                      )}

                      <div className="flex flex-col md:flex-row gap-4 justify-center">
                        {isCorrect ? (
                          <Button onClick={handleNext} variant="amber" className="w-full md:w-auto md:px-16 py-6 text-2xl rounded-[24px] shadow-[0_0_50px_rgba(245,158,11,0.4)]">
                            Next Challenge
                          </Button>
                        ) : (
                          <>
                            <Button onClick={() => { setSelectedOption(null); setHasRetriedCurrentQuestion(true); }} className="w-full md:w-auto md:px-12 py-6 text-xl rounded-[24px] bg-white text-indigo-950 hover:bg-slate-100 shadow-2xl">
                              Give it another shot
                            </Button>
                            {!showExplanation && (
                              <button 
                                onClick={() => setShowExplanation(true)}
                                className="px-10 py-6 text-white/60 hover:text-white transition-all text-lg font-black flex items-center justify-center gap-3 border-2 border-white/10 rounded-[24px] hover:bg-white/5"
                              >
                                <Brain className="w-5 h-5" />
                                Reveal Wisdom
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {screen === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col pt-4 relative"
            >
              <ConfettiStars />
              <div className="w-full flex items-center justify-between h-20">
                <div className="flex items-center gap-3">
                  <Trophy className="w-8 h-8 text-amber-400" />
                  <h2 className="text-3xl text-white font-black italic tracking-tight">Quest Complete</h2>
                </div>
                <button 
                  onClick={resetGame}
                  className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/10 cursor-pointer group"
                >
                  <X className="w-8 h-8 group-rotate-90 transition-transform" />
                </button>
              </div>

              <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-16 relative py-12">
                {score >= 500 && <ConfettiStars />}
                <div className="flex-1 space-y-8 text-center md:text-left z-10">
                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="text-7xl md:text-9xl font-black text-white tracking-tighter leading-none">GLORIOUS<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">VICTORY!</span></h3>
                  </motion.div>
                  <p className="text-white/60 text-2xl font-medium max-w-md">You've mastered the enchanted puzzles and claimed your place among the legends.</p>
                  
                  <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                    <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
                      <Brain className="w-6 h-6 text-indigo-400" />
                      <span className="font-bold">Logic Master</span>
                    </div>
                    <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
                      <Sparkles className="w-6 h-6 text-purple-400" />
                      <span className="font-bold">Enchanted Mind</span>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <FloatingStar3D className="absolute -top-10 -left-10 scale-150 z-20" />
                  <FloatingStar3D className="absolute -bottom-10 -right-10 scale-125 rotate-45 opacity-50" />
                  
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      className="w-full max-w-md flex flex-col items-center justify-center relative"
                    >
                      <div className="absolute inset-0 flex items-center justify-center opacity-[0.1]">
                        <Star className="w-[400px] h-[400px] text-amber-500 fill-amber-500 blur-sm" />
                      </div>
                      
                      <div className="relative z-10 flex flex-col items-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', delay: 0.5 }}
                          className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mb-6 border border-white/20"
                        >
                          <Trophy className="w-12 h-12 text-amber-400" />
                        </motion.div>
                        
                        <motion.span 
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.7 }}
                          className="text-[10rem] font-black text-amber-400 tracking-tighter drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]"
                        >
                          {score}
                        </motion.span>
                        <span className="text-3xl font-black text-white/40 -mt-6">
                          OUT OF {(selectedPack?.questions.length || 0) * 100}
                        </span>
                        
                        <div className="mt-12 flex gap-4">
                          {Array.from({ length: 5 }).map((_, i) => {
                            const maxPossibleScore = (selectedPack?.questions.length || 0) * 100;
                            const percentage = maxPossibleScore > 0 ? score / maxPossibleScore : 0;
                            const starsEarned = Math.round(percentage * 5);
                            const isFilled = i < starsEarned;
                            
                            return (
                              <motion.div
                                key={i}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.8 + (i * 0.1) }}
                              >
                                <Star className={cn("w-12 h-12 drop-shadow-xl", isFilled ? "text-amber-400 fill-amber-400" : "text-white/10")} />
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                </div>
              </div>

              <div className="mt-auto pb-8">
                <Button onClick={resetGame} className="w-full bg-white text-[#1e1b4b] hover:bg-slate-100 py-8 text-3xl rounded-[32px] shadow-2xl font-black tracking-tight">
                  RETURN TO CASTLE HALLS
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Zoom Modal */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6 cursor-pointer"
            onClick={() => setIsZoomed(false)}
          >
            <img 
              src={currentQuestion?.imageUrl} 
              alt="Zoomed"
              className="max-w-full max-h-[80%] rounded-2xl shadow-2xl"
            />
            <button 
              onClick={() => setIsZoomed(false)}
              className="mt-12 text-white font-bold tracking-widest hover:text-white/80 transition-colors"
            >
              CLOSE
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
