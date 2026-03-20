import { useGetNotebook, useRemoveFromNotebook } from "@workspace/api-client-react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { GamifiedButton } from "@/components/ui/gamified-button";
import { Volume2, Trash2, BookX } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";

export function Notebook() {
  const { data: notebookWords, isLoading, refetch } = useGetNotebook();
  const removeMutation = useRemoveFromNotebook();
  const { isAuthenticated, login } = useAuth();

  const speakWord = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleRemove = async (id: number) => {
    await removeMutation.mutateAsync({ id });
    refetch();
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopBar />
      
      <main className="max-w-md mx-auto pt-8 px-4 flex flex-col items-center">
        <h1 className="w-full text-3xl font-display font-bold text-gray-800 mb-6">Kelime Defterim</h1>
        
        {!isAuthenticated ? (
          <div className="w-full bg-white border-2 border-border rounded-2xl p-8 text-center flex flex-col items-center">
            <BookX className="w-16 h-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-display font-bold text-gray-700 mb-2">Giriş Yapmalısın</h2>
            <p className="text-gray-500 mb-6 font-medium">
              Öğrendiğin kelimeleri kaydetmek ve tekrar etmek için giriş yapmalısın.
            </p>
            <GamifiedButton onClick={login} className="px-8">
              Giriş Yap
            </GamifiedButton>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : !notebookWords || notebookWords.length === 0 ? (
          <div className="w-full bg-white border-2 border-border rounded-2xl p-8 text-center flex flex-col items-center">
            <BookX className="w-16 h-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-display font-bold text-gray-700 mb-2">Defterin Boş</h2>
            <p className="text-gray-500 font-medium">
              Derslerde karşılaştığın kelimeleri defterine ekleyebilirsin.
            </p>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-4">
            {notebookWords.map((item) => (
              <div key={item.id} className="bg-white border-2 border-border border-b-4 rounded-2xl p-4 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => speakWord(item.word.english)}
                      className="p-2 bg-secondary/10 text-secondary rounded-full hover:bg-secondary hover:text-white transition-colors"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                    <div>
                      <h3 className="font-display font-bold text-xl text-gray-800">{item.word.english}</h3>
                      <p className="text-sm text-gray-400 font-medium">[{item.word.pronunciation}]</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemove(item.id)}
                    disabled={removeMutation.isPending}
                    className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="pl-12">
                  <p className="font-display font-bold text-primary mb-2 text-lg">{item.word.turkish}</p>
                  <div className="bg-gray-50 p-3 rounded-xl border-2 border-gray-100">
                    <p className="text-gray-700 italic text-sm mb-1">"{item.word.example}"</p>
                    <p className="text-gray-500 text-xs">"{item.word.exampleTurkish}"</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
