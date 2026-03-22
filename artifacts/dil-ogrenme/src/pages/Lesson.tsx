import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetLesson, useCompleteLesson, useAddToNotebook } from "@workspace/api-client-react";
import { GamifiedButton } from "@/components/ui/gamified-button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { X, Heart, AlertCircle, CheckCircle2, Volume2, PlusCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { launchSuccessConfetti, playFeedbackTone, speakText } from "@/lib/lessonFeedback";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Word, Question } from "@workspace/api-client-react";

type Exercise = 
  | { type: 'word', data: Word }
  | { type: 'question', data: Question };

interface SessionResult {
  questionId: number;
  type: string;
  question: string;
  correctAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
  score?: number;
}

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
  
  // Results Tracking
  const [results, setResults] = useState<SessionResult[]>([]);
  const [completionStep, setCompletionStep] = useState<'stats' | 'streak' | 'review'>('stats');
  const [userProgress, setUserProgress] = useState<any>(null);

  // Initialize queue once lesson data is loaded
  useEffect(() => {
    if (lesson && queue.length === 0) {
      const words = Array.isArray(lesson.words) ? lesson.words : [];
      const questions = Array.isArray(lesson.questions) ? lesson.questions : [];
      const initialQueue: Exercise[] = [
        ...words.map(w => ({ type: 'word' as const, data: w })),
        ...questions.map(q => ({ type: 'question' as const, data: q }))
      ];
      setQueue(initialQueue);
    }
  }, [lesson]);

  const currentExercise = queue[currentIndex];
  const progress = queue.length > 0 ? (currentIndex / queue.length) * 100 : 0;

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

    // Track result for the session (only for the first attempt of each question)
    const existingResult = results.find(r => r.questionId === q.id);
    if (!existingResult) {
      setResults(prev => [...prev, {
        questionId: q.id,
        type: q.type,
        question: q.question,
        correctAnswer: q.correctAnswer,
        userAnswer: selectedAnswer,
        isCorrect: isCorrect
      }]);
    }

    if (isCorrect) {
      setStatus('correct');
      playFeedbackTone(true);
      launchSuccessConfetti();
    } else {
      setStatus('wrong');
      playFeedbackTone(false);
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
      const response = await completeLessonMutation.mutateAsync({
        data: {
          lessonId,
          score: Math.round((hearts / 5) * 100)
        }
      });
      setUserProgress(response);
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
    const accuracy = Math.round((results.filter(r => r.isCorrect).length / results.length) * 100) || 0;
    const totalXp = (userProgress?.xpEarned || 10);

    return (
      <div className="min-h-screen bg-[#131f24] text-white flex flex-col">
        <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-lg mx-auto w-full text-center">
          <AnimatePresence mode="wait">
            {completionStep === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="w-full flex flex-col items-center"
              >
                <div className="relative mb-8">
                  <motion.div 
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                  >
                    <img 
                      src={`${import.meta.env.BASE_URL}images/mascot-happy.png`} 
                      alt="Mascot" 
                      className="w-48 h-48"
                    />
                  </motion.div>
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="absolute -top-4 -right-4 bg-yellow-400 text-black font-bold px-3 py-1 rounded-full shadow-lg"
                  >
                    MÜKEMMEL!
                  </motion.div>
                </div>
                
                <h1 className="text-4xl font-display font-bold text-yellow-400 mb-8">Test Bitti!</h1>
                
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="bg-[#1f2f36] border-2 border-[#37464f] p-4 rounded-2xl flex flex-col items-center">
                    <span className="text-xs font-bold text-gray-400 uppercase mb-1">TOPLAM PUAN</span>
                    <div className="flex items-center gap-2">
                       <span className="text-yellow-500 text-xl">⚡</span>
                       <span className="text-3xl font-display font-bold text-white">{totalXp}</span>
                    </div>
                  </div>
                  <div className="bg-[#1f2f36] border-2 border-[#37464f] p-4 rounded-2xl flex flex-col items-center">
                    <span className="text-xs font-bold text-gray-400 uppercase mb-1">BAŞARI</span>
                    <div className="flex items-center gap-2">
                       <span className="text-green-500 text-xl">🎯</span>
                       <span className="text-3xl font-display font-bold text-white">%{accuracy}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {completionStep === 'streak' && (
              <motion.div
                key="streak"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="w-full flex flex-col items-center"
              >
                <h2 className="text-2xl font-display font-bold text-white mb-12">
                  Serinin {(userProgress?.streak || 0) + 1}. günü yarın başlayacak!
                </h2>
                
                <div className="relative mb-12">
                  <img 
                    src={`${import.meta.env.BASE_URL}images/mascot-happy.png`} 
                    alt="Mascot" 
                    className="w-48 h-48"
                  />
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-orange-500 rounded-full p-2 shadow-xl border-4 border-[#131f24]">
                    <span className="text-2xl">🔥</span>
                  </div>
                </div>

                <div className="bg-[#1f2f36] border-2 border-[#37464f] p-6 rounded-3xl w-full">
                  <div className="flex justify-between mb-4">
                    {['Pa', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'].map((day, i) => {
                      const todayIdx = (new Date().getDay() + 6) % 7;
                      const isPast = i < todayIdx;
                      const isToday = i === todayIdx;
                      return (
                        <div key={day} className="flex flex-col items-center gap-2">
                          <span className={cn("text-xs font-bold", isToday ? "text-orange-500" : "text-gray-500")}>{day}</span>
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center border-2",
                            isPast ? "bg-orange-500 border-orange-500 text-white" :
                            isToday ? "bg-orange-500 border-orange-500 text-white" :
                            "bg-[#37464f] border-[#37464f]"
                          )}>
                            {isPast || isToday ? "✓" : ""}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="h-0.5 bg-[#37464f] w-full mb-4" />
                  <p className="text-gray-400 text-sm font-medium">
                    İpucu: Yarın alıştırma yapman serini sıfırlanmaktan kurtarır!
                  </p>
                </div>
              </motion.div>
            )}

            {completionStep === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full flex flex-col items-center"
              >
                <h2 className="text-3xl font-display font-bold text-white mb-2">Sonuçlarına bak!</h2>
                <p className="text-gray-400 font-medium mb-8">Çözümleri görmek için aşağıdaki kutucuklara tıkla.</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {results.map((res, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toast.info(`Soru: ${res.question}\nCevabın: ${res.userAnswer}\nDoğru: ${res.correctAnswer}`, { duration: 5000 })}
                      className={cn(
                        "aspect-square rounded-2xl border-2 p-3 flex flex-col items-start justify-between relative group",
                        res.isCorrect ? "bg-[#1f2f36] border-[#37464f]" : "bg-[#1f2f36] border-red-900/50"
                      )}
                    >
                      <span className={cn(
                        "text-[10px] font-bold line-clamp-3 text-left uppercase",
                        res.isCorrect ? "text-green-500" : "text-red-500"
                      )}>
                        {res.type.replace(/-/g, ' ')}
                      </span>
                      {res.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 self-end" />
                      ) : (
                        <X className="w-5 h-5 text-red-500 self-end" />
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <div className="p-4 bg-[#131f24] border-t-2 border-[#1f2f36] space-y-3">
          <div className="max-w-lg mx-auto w-full flex gap-3">
            {completionStep === 'review' ? (
               <GamifiedButton className="flex-1 bg-[#23333b] hover:bg-[#304550] border-b-4 border-[#18252b]" onClick={() => setCompletionStep('stats')}>
                 GERİ DÖN
               </GamifiedButton>
            ) : (
               <button 
                 onClick={() => setCompletionStep('review')}
                 className="flex-1 px-6 py-3 rounded-2xl border-2 border-[#37464f] font-bold text-gray-400 hover:bg-[#1f2f36] transition-colors"
               >
                 DERSİ GÖZDEN GEÇİR
               </button>
            )}

            <GamifiedButton 
              className="flex-1" 
              onClick={() => {
                if (completionStep === 'stats') setCompletionStep('streak');
                else setLocation("/");
              }}
            >
              DEVAM ET
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
                lessonId={lessonId}
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

function WordExercise({ word, isFlipped, setIsFlipped, lessonId }: { 
  word: Word, 
  isFlipped: boolean, 
  setIsFlipped: (v: boolean) => void,
  lessonId: number
}) {
  const addToNotebookMutation = useAddToNotebook();

  useEffect(() => {
    speakText(word.english);
  }, [word]);

  const handleAddToNotebook = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await addToNotebookMutation.mutateAsync({
        data: {
          english: word.english,
          turkish: word.turkish,
          pronunciation: word.pronunciation,
          example: word.example,
          lessonId: lessonId
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
              onClick={(e) => { e.stopPropagation(); speakText(word.english); }}
              className="absolute top-4 right-4 p-3 bg-secondary/10 text-secondary rounded-full hover:bg-secondary hover:text-white transition-colors"
            >
              <Volume2 className="w-6 h-6" />
            </button>
            <span className="text-5xl font-display font-bold text-primary mb-4">{word.english}</span>
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
                  onClick={(e) => { e.stopPropagation(); speakText(word.example); }}
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
  const isListenWrite = question.type === 'listen-and-write';

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
         question.type === 'listen-and-write' ? 'Duyduğunu yaz' :
         'Doğru olanı seç'}
      </h2>

      <div className="flex items-start gap-4 mb-8">
        <img 
          src={`${import.meta.env.BASE_URL}images/mascot-happy.png`} 
          alt="Mascot" 
          className="w-24 h-24 hidden md:block" 
        />
        <div className="relative bg-white border-2 border-border p-4 rounded-2xl rounded-tl-none w-full shadow-sm flex items-center gap-4">
          {/* Speech bubble pointer */}
          <div className="absolute -left-3 top-0 w-4 h-4 bg-white border-l-2 border-t-2 border-border -skew-x-[30deg]"></div>
          {question.type === 'listen-and-write' ? (
             <button 
               onClick={() => {
                 speakText(question.question);
               }}
               className="p-3 bg-secondary text-white rounded-xl shadow-lg hover:bg-secondary-dark transition-colors"
             >
               <Volume2 className="w-8 h-8" />
             </button>
          ) : (
            <span className="text-xl font-medium text-gray-700">{question.question}</span>
          )}
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

      {(isTranslation || isListenWrite) && !question.options && (
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
