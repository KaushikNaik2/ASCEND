import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, FileText } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  className?: string;
}

export default function UploadZone({ onFileSelect, className }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={cn("w-full max-w-2xl mx-auto", className)}
    >
      <div className="mb-8 text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
          Digitize your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Curriculum</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Upload any university syllabus PDF. Our AI instantly extracts modules, topics, and structures them into usable data.
        </p>
      </div>

      <motion.div
        animate={isDragging ? "drag" : "idle"}
        variants={{
          idle: { scale: 1, borderColor: "rgba(59, 130, 246, 0.2)" },
          drag: { scale: 1.02, borderColor: "rgba(139, 92, 246, 0.8)", backgroundColor: "rgba(15, 23, 42, 0.8)" }
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="glass-panel relative overflow-hidden rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer group"
      >
        <input 
          type="file" 
          accept="application/pdf" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handleFileInput}
        />
        
        <div className="flex flex-col items-center justify-center space-y-6 pointer-events-none relative z-0">
          <div className="relative">
            <motion.div 
              className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="bg-secondary/50 p-4 rounded-full border border-white/5 relative shadow-lg">
              <UploadCloud className="w-10 h-10 text-primary" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">Drop your syllabus here</h3>
            <p className="text-sm text-muted-foreground">Or click to browse from your computer</p>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono bg-black/20 py-1.5 px-3 rounded-full border border-white/5">
            <FileText className="w-3 h-3" />
            <span>Accepts ONLY PDF files (max 10MB)</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
