import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetLesson, useCompleteLesson, useAddToNotebook } from "@workspace/api-client-react";
import { GamifiedButton } from "@/components/ui/gamified-button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { X, Heart, AlertCircle, CheckCircle2, Volume2, PlusCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Word, Question } from "@workspace/api-client-react/src/generated/api.schemas";

type Exercise = 
  | { type: 'word', data: Word }
  | { type: 'question', data: Question };

export function Lesson() {
  const [, params] = useRoute("/lesson/:id");
  const [, setLocation] = useLocation();
  const lessonId = parseInt(params?.id || "0");

  const { data: lesson, isLoading } = useGetLesson(lessonId);
  const completeLessonMutation = useCompleteLesson();

  const [queue, setQueue] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hearts, setHearts] = useState(5);
  
  // Exercise State
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [isFlipped, setIsFlipped] = useState(false); // For word cards
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong' | 'finished'>('idle');

  // Initialize queue once lesson data is loaded
  useEffect(() => {
    if (lesson && queue.length === 0) {
      const initialQueue: Exercise[] = [
        ...lesson.words.map(w => ({ type: 'word' as const, data: w })),
        ...lesson.questions.map(q => ({ type: 'question' as const, data: q }))
      ];
      setQueue(initialQueue);
    }
  }, [lesson]);

  const currentExercise = queue[currentIndex];
  const progress = queue.length > 0 ? (currentIndex / queue.length) * 100 : 0;

  const playBeep = (isCorrect: boolean) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      if (isCorrect) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      // Audio might fail if not interacted first
    }
  };

  const handleCheck = () => {
    if (!currentExercise) return;

    if (currentExercise.type === 'word') {
      // Word cards are just for learning, simply move to next
      handleNext();
      return;
    }

    // Question logic
    const q = currentExercise.data as Question;
    const isCorrect = selectedAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();

    if (isCorrect) {
      setStatus('correct');
      playBeep(true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#58CC02', '#89E219']
      });
    } else {
      setStatus('wrong');
      playBeep(false);
      setHearts(h => Math.max(0, h - 1));
      // Push question to end of queue to try again
      setQueue(prev => [...prev, currentExercise]);
    }
  };

  const handleNext = () => {
    if (currentIndex >= queue.length - 1) {
      setStatus('finished');
      finishLesson();
    } else {
      setCurrentIndex(prev => prev + 1);
      setStatus('idle');
      setSelectedAnswer("");
      setIsFlipped(false);
    }
  };

  const finishLesson = async () => {
    try {
      await completeLessonMutation.mutateAsync({
        data: {
          lessonId,
          score: Math.round((hearts / 5) * 100)
        }
      });
    } catch (e) {
      console.error("Failed to save progress", e);
    }
  };

  if (isLoading || !currentExercise) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-display font-bold text-gray-500 animate-pulse">Ders yükleniyor...</p>
      </div>
    );
  }

  if (status === 'finished') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-lg mx-auto w-full text-center">
          <img 
            src={`${import.meta.env.BASE_URL}images/chest-open.png`} 
            alt="Chest" 
            className="w-48 h-48 mb-8 animate-bounce"
          />
          <h1 className="text-4xl font-display font-bold text-yellow-500 mb-4">Ders Tamamlandı!</h1>
          <div className="bg-white border-2 border-border p-6 rounded-2xl w-full flex justify-around">
            <div className="flex flex-col items-center">
              <span className="text-sm font-bold text-gray-400 uppercase">Toplam XP</span>
              <span className="text-2xl font-display font-bold text-yellow-500">+{lesson?.xpReward || 10}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-sm font-bold text-gray-400 uppercase">Kalan Can</span>
              <span className="text-2xl font-display font-bold text-red-500">{hearts}</span>
            </div>
          </div>
        </main>
        <div className="p-4 bg-white border-t-2 border-border">
          <div className="max-w-lg mx-auto w-full">
            <GamifiedButton className="w-full" onClick={() => setLocation("/")}>
              Devam Et
            </GamifiedButton>
          </div>
        </div>
      </div>
    );
  }

  if (hearts === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-lg mx-auto w-full text-center">
          <img 
            src={`${import.meta.env.BASE_URL}images/mascot-sad.png`} 
            alt="Mascot Sad" 
            className="w-48 h-48 mb-8"
          />
          <h1 className="text-3xl font-display font-bold text-gray-800 mb-4">Canın Bitti!</h1>
          <p className="text-gray-500 font-medium mb-8">Hata yapmak öğrenmenin bir parçasıdır. Tekrar deneyebilirsin.</p>
        </main>
        <div className="p-4 bg-white border-t-2 border-border flex flex-col gap-3">
          <div className="max-w-lg mx-auto w-full space-y-3">
            <GamifiedButton className="w-full" variant="outline" onClick={() => setLocation("/")}>
              Çıkış Yap
            </GamifiedButton>
            <GamifiedButton className="w-full" onClick={() => { setHearts(5); setStatus('idle'); }}>
              Tekrar Dene
            </GamifiedButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Top Header */}
      <header className="p-4 max-w-3xl mx-auto w-full flex items-center gap-4">
        <button onClick={() => setLocation("/")} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
          <X className="w-7 h-7" strokeWidth={2.5} />
        </button>
        <div className="flex-1">
          <ProgressBar progress={progress} />
        </div>
        <div className="flex items-center gap-1.5 font-bold text-red-500">
          <Heart className="w-6 h-6 fill-current" />
          <span className="text-lg">{hearts}</span>
        </div>
      </header>

      {/* Main Exercise Area */}
      <main className="flex-1 flex flex-col p-4 max-w-2xl mx-auto w-full relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            {currentExercise.type === 'word' ? (
              <WordExercise 
                word={currentExercise.data as Word} 
                isFlipped={isFlipped}
                setIsFlipped={setIsFlipped}
              />
            ) : (
              <QuestionExercise 
                question={currentExercise.data as Question}
                selectedAnswer={selectedAnswer}
                setSelectedAnswer={setSelectedAnswer}
                status={status}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Action Bar */}
      <div className={cn(
        "border-t-2 transition-colors duration-300 z-50",
        status === 'idle' ? "bg-white border-border" :
        status === 'correct' ? "bg-green-100 border-green-200" :
        "bg-red-100 border-red-200"
      )}>
        <div className="p-4 max-w-2xl mx-auto w-full pb-safe">
          
          {/* Feedback messages */}
          <AnimatePresence>
            {status !== 'idle' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex items-start gap-4"
              >
                {status === 'correct' ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-green-500">
                      <CheckCircle2 className="w-8 h-8 fill-current text-white bg-green-500 rounded-full" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-2xl text-green-600">Harika!</h3>
                      <p className="text-green-700 font-medium">Doğru cevap.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-red-500">
                      <AlertCircle className="w-8 h-8 fill-current text-white bg-red-500 rounded-full" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-2xl text-red-600">Yanlış!</h3>
                      <p className="text-red-700 font-medium mt-1">
                        Doğru Cevap: <span className="font-bold">{(currentExercise.data as Question).correctAnswer}</span>
                      </p>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {status === 'idle' ? (
             <GamifiedButton 
               className="w-full" 
               onClick={handleCheck}
               disabled={currentExercise.type === 'question' && !selectedAnswer}
             >
               {currentExercise.type === 'word' ? 'Anladım' : 'Kontrol Et'}
             </GamifiedButton>
          ) : (
            <GamifiedButton 
               className="w-full" 
               variant={status === 'correct' ? 'success' : 'danger'}
               onClick={handleNext}
             >
               Devam Et
             </GamifiedButton>
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-components for specific exercise types

function WordExercise({ word, isFlipped, setIsFlipped }: { word: Word, isFlipped: boolean, setIsFlipped: (v: boolean) => void }) {
  const addToNotebookMutation = useAddToNotebook();
  
  const speakWord = (text: string, lang = 'en-US') => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    speakWord(word.english);
  }, [word]);

  const handleAddToNotebook = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await addToNotebookMutation.mutateAsync({
        data: {
          wordId: word.id
        }
      });
      toast.success("Kelime defterine eklendi!");
    } catch (err) {
      toast.error("Bu kelime zaten defterinde veya giriş yapman gerekiyor.");
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="flex justify-between w-full items-center mb-8">
        <h2 className="text-2xl font-display font-bold text-gray-700">Yeni Kelime Öğren</h2>
        <button 
          onClick={handleAddToNotebook}
          className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-dark transition-colors px-3 py-1.5 bg-primary/10 rounded-full"
          disabled={addToNotebookMutation.isPending}
        >
          <PlusCircle className="w-4 h-4" />
          Deftere Ekle
        </button>
      </div>
      
      <div 
        className="w-full max-w-sm aspect-square cursor-pointer"
        style={{ perspective: "1000px" }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <motion.div 
          className="w-full h-full relative"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          {/* Front */}
          <div 
            className="absolute inset-0 bg-white border-2 border-border border-b-8 rounded-3xl flex flex-col items-center justify-center p-8 text-center"
            style={{ backfaceVisibility: "hidden" }}
          >
            <button 
              onClick={(e) => { e.stopPropagation(); speakWord(word.english); }}
              className="absolute top-4 right-4 p-3 bg-secondary/10 text-secondary rounded-full hover:bg-secondary hover:text-white transition-colors"
            >
              <Volume2 className="w-6 h-6" />
            </button>
            <span className="text-5xl font-display font-bold text-primary mb-4">{word.english}</span>
            <span className="text-xl text-gray-400 font-medium">[{word.pronunciation}]</span>
            <div className="absolute bottom-6 text-gray-300 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              Çevirmek için tıkla
            </div>
          </div>
          
          {/* Back */}
          <div 
            className="absolute inset-0 bg-secondary border-2 border-secondary-dark border-b-8 rounded-3xl flex flex-col items-center justify-center p-8 text-center"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <span className="text-4xl font-display font-bold text-white mb-6">{word.turkish}</span>
            <div className="bg-white/20 p-4 rounded-xl w-full">
              <div className="flex justify-between items-start mb-2">
                <p className="text-white italic text-left">"{word.example}"</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); speakWord(word.example); }}
                  className="p-1.5 bg-white/20 text-white rounded-full hover:bg-white/40 transition-colors ml-2 shrink-0"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-white/80 text-sm text-left">"{word.exampleTurkish}"</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function QuestionExercise({ question, selectedAnswer, setSelectedAnswer, status }: { 
  question: Question, 
  selectedAnswer: string, 
  setSelectedAnswer: (v: string) => void,
  status: 'idle' | 'correct' | 'wrong' | 'finished'
}) {
  const isMultipleChoice = question.type === 'multiple-choice' || question.type === 'fill-blank';
  const isTranslation = question.type === 'translate-to-english' || question.type === 'translate-to-turkish';

  const [wordBank, setWordBank] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);

  // Initialize word bank if it's a translation with options
  useEffect(() => {
    if (isTranslation && question.options) {
      setWordBank(question.options);
      setSelectedWords(selectedAnswer ? selectedAnswer.split(' ').filter(Boolean) : []);
    }
  }, [question, isTranslation]);

  // Update selectedAnswer string when chips change
  useEffect(() => {
    if (isTranslation && question.options) {
      setSelectedAnswer(selectedWords.join(' '));
    }
  }, [selectedWords, isTranslation, question.options, setSelectedAnswer]);

  const toggleWord = (word: string, fromBank: boolean) => {
    if (status !== 'idle') return;
    
    if (fromBank) {
      setWordBank(prev => prev.filter(w => w !== word));
      setSelectedWords(prev => [...prev, word]);
    } else {
      setSelectedWords(prev => prev.filter(w => w !== word));
      setWordBank(prev => [...prev, word]);
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full">
      <h2 className="text-2xl font-display font-bold text-gray-800 mb-6">
        {question.type === 'translate-to-turkish' ? 'Bu cümleyi çevir' : 
         question.type === 'translate-to-english' ? 'İngilizceye çevir' : 
         question.type === 'fill-blank' ? 'Boşluğu doldur' : 
         'Doğru olanı seç'}
      </h2>

      <div className="flex items-start gap-4 mb-8">
        <img 
          src={`${import.meta.env.BASE_URL}images/mascot-happy.png`} 
          alt="Mascot" 
          className="w-24 h-24 hidden md:block" 
        />
        <div className="relative bg-white border-2 border-border p-4 rounded-2xl rounded-tl-none w-full shadow-sm">
          {/* Speech bubble pointer */}
          <div className="absolute -left-3 top-0 w-4 h-4 bg-white border-l-2 border-t-2 border-border -skew-x-[30deg]"></div>
          <span className="text-xl font-medium text-gray-700">{question.question}</span>
        </div>
      </div>

      {isMultipleChoice && question.options && (
        <div className="flex flex-col gap-3 mt-auto">
          {question.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => status === 'idle' && setSelectedAnswer(opt)}
              disabled={status !== 'idle'}
              className={cn(
                "p-4 rounded-2xl border-2 text-left font-medium text-lg transition-all",
                selectedAnswer === opt 
                  ? "bg-secondary/10 border-secondary text-secondary-dark border-b-4" 
                  : "bg-white border-border text-gray-700 border-b-4 hover:bg-gray-50 active:border-b-2 active:mt-[2px]"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {isTranslation && question.options && (
        <div className="flex flex-col flex-1">
          {/* Answer Area */}
          <div className="min-h-[100px] border-t-2 border-b-2 border-border py-4 mb-8 flex flex-wrap gap-2 items-start content-start bg-gray-50/50">
            {selectedWords.map((word, i) => (
              <motion.button
                layoutId={`word-${word}-${i}`}
                key={`ans-${word}-${i}`}
                onClick={() => toggleWord(word, false)}
                className="bg-white border-2 border-border border-b-4 rounded-xl px-4 py-2 font-bold text-gray-700 hover:bg-gray-50"
              >
                {word}
              </motion.button>
            ))}
          </div>

          {/* Word Bank */}
          <div className="flex flex-wrap gap-2 justify-center">
            {wordBank.map((word, i) => (
              <motion.button
                layoutId={`word-${word}-${i}`}
                key={`bank-${word}-${i}`}
                onClick={() => toggleWord(word, true)}
                className="bg-white border-2 border-border border-b-4 rounded-xl px-4 py-2 font-bold text-gray-700 hover:bg-gray-50"
              >
                {word}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {isTranslation && !question.options && (
        <textarea
          value={selectedAnswer}
          onChange={(e) => setSelectedAnswer(e.target.value)}
          disabled={status !== 'idle'}
          placeholder="Cevabınızı buraya yazın..."
          className="w-full bg-white border-2 border-border rounded-2xl p-4 text-lg font-medium text-gray-800 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 resize-none min-h-[150px]"
        />
      )}
    </div>
  );
}
