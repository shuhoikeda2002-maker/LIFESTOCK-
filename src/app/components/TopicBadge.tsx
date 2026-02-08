import { motion } from 'motion/react';

interface TopicBadgeProps {
  topic: string;
  className?: string;
}

export function TopicBadge({ topic, className = "" }: TopicBadgeProps) {
  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center justify-center px-6 py-2 bg-[#030213] rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] border border-purple-500/50 ${className}`}
    >
      <span className="text-white font-black text-lg tracking-wider">
        <span className="text-purple-400 mr-2 uppercase text-[10px] tracking-widest">Topic</span>
        {topic}
      </span>
    </motion.div>
  );
}
