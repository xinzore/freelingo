import { GamifiedButton } from "@/components/ui/gamified-button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <img 
        src={`${import.meta.env.BASE_URL}images/mascot-sad.png`} 
        alt="Mascot Sad" 
        className="w-48 h-48 mb-8"
      />
      <h1 className="text-5xl font-display font-bold text-gray-800 mb-4">404</h1>
      <p className="text-xl text-gray-500 font-medium mb-8 max-w-sm">
        Görünüşe göre kayboldun! Aradığın sayfa mevcut değil.
      </p>
      
      <Link href="/">
        <GamifiedButton className="px-10">Ana Sayfaya Dön</GamifiedButton>
      </Link>
    </div>
  );
}
