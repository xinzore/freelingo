import { motion } from "framer-motion";

interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: string;
}

export function ProgressBar({ progress, color = "bg-primary" }: ProgressBarProps) {
  return (
    <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden relative">
      {/* Glossy highlight for 3D effect */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/20 z-10 rounded-t-full" />
      <motion.div 
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ type: "spring", stiffness: 50, damping: 15 }}
      />
    </div>
  );
}
