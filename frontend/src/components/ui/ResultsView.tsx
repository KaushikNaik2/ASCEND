import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, ChevronDown, BookOpen, Loader2, Sparkles, AlertTriangle, CheckCircle } from 'lucide-react';
import type { AppState } from '../../types';

interface MappingEntry {
  syllabus_text: string;
  matched_concept: string;
  confidence: number;
  module_context: string;
  concept_cluster_id: string | null;
}

interface MappingData {
  subject_detected?: string;
  total_topics?: number;
  unmapped_count?: number;
  coverage_score?: number;
  mappings?: MappingEntry[];
  // Legacy support
  modules?: any[];
  subject_name?: string;
  semester?: string;
}

interface ResultsViewProps {
  data: MappingData;
  setAppState: (state: AppState) => void;
  onApprove?: () => Promise<void>;
  isApproving?: boolean;
}

export default function ResultsView({ data, setAppState, onApprove, isApproving = false }: ResultsViewProps) {
  const [copied, setCopied] = useState(false);

  // Group mappings by module_context for accordion display
  const mappings = data.mappings || [];
  const grouped = mappings.reduce<Record<string, MappingEntry[]>>((acc, m) => {
    const key = m.module_context || 'Ungrouped';
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});
  const moduleKeys = Object.keys(grouped);

  const [expandedModule, setExpandedModule] = useState<string | null>(moduleKeys[0] || null);

  const subjectName = data.subject_detected || data.subject_name || 'Your Syllabus';
  const coveragePct = data.coverage_score ? Math.round(data.coverage_score * 100) : null;
  const totalTopics = data.total_topics || mappings.length;
  const unmappedCount = data.unmapped_count || mappings.filter(m => m.matched_concept === 'UNMAPPED').length;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApprove = async () => {
    if (onApprove) {
      await onApprove();
    } else {
      setAppState('dashboard');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-4xl mx-auto h-[80vh] flex flex-col pt-8"
    >
      {/* Header */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/10 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-2">{subjectName}</h2>
          <div className="flex gap-3 text-sm text-slate-300 flex-wrap">
            <span className="flex items-center gap-1.5 bg-white/5 py-1 px-3 rounded-full">
              <BookOpen className="w-4 h-4 text-purple-400" />
              {totalTopics} Topics Mapped
            </span>
            {coveragePct !== null && (
              <span className={`flex items-center gap-1.5 py-1 px-3 rounded-full ${coveragePct >= 80 ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                {coveragePct}% Coverage
              </span>
            )}
            {unmappedCount > 0 && (
              <span className="flex items-center gap-1.5 bg-red-500/10 py-1 px-3 rounded-full text-red-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                {unmappedCount} Unmapped
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="relative z-10 flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-colors text-sm font-medium cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
          {copied ? 'Copied' : 'Copy JSON'}
        </button>
      </div>

      {/* Mappings Accordion */}
      <div className="flex-1 overflow-y-auto pr-2 pb-10 space-y-4 custom-scrollbar relative z-10">
        {moduleKeys.map((moduleKey, i) => {
          const entries = grouped[moduleKey];
          const isExpanded = expandedModule === moduleKey;

          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={moduleKey}
              className={`glass-panel border rounded-2xl overflow-hidden transition-colors ${isExpanded ? 'border-blue-500/30 bg-slate-900/60' : 'border-white/5 hover:border-white/10'}`}
            >
              <button
                onClick={() => setExpandedModule(isExpanded ? null : moduleKey)}
                className="w-full flex items-center justify-between p-5 text-left cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-colors ${isExpanded ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-slate-400 group-hover:bg-white/10'}`}>
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">{moduleKey}</h3>
                    <span className="text-xs text-slate-500">{entries.length} concepts</span>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-blue-400' : ''}`} />
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 pt-0 pl-16 md:pl-20 border-t border-white/5">
                      <ul className="space-y-3 pt-4">
                        {entries.map((entry, j) => {
                          const isUnmapped = entry.matched_concept === 'UNMAPPED';
                          return (
                            <motion.li
                              initial={{ x: -10, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: j * 0.05 }}
                              key={j}
                              className="flex items-start gap-3 text-slate-300"
                            >
                              {isUnmapped ? (
                                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                              )}
                              <div className="flex-1">
                                <span className="text-[15px]">{entry.syllabus_text}</span>
                                {!isUnmapped && (
                                  <span className="ml-2 text-xs text-blue-400/70">→ {entry.matched_concept}</span>
                                )}
                                {isUnmapped && (
                                  <span className="ml-2 text-xs text-yellow-500/70">Out of Scope</span>
                                )}
                              </div>
                              {!isUnmapped && (
                                <span className={`text-xs px-2 py-0.5 rounded-md shrink-0 ${entry.confidence >= 0.8 ? 'bg-green-500/10 text-green-400' : entry.confidence >= 0.5 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
                                  {Math.round(entry.confidence * 100)}%
                                </span>
                              )}
                            </motion.li>
                          );
                        })}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom Action Bar */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <button
          onClick={() => setAppState('upload')}
          disabled={isApproving}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/10 rounded-full font-medium text-sm transition-all cursor-pointer shadow-lg shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Parse Another Syllabus
        </button>

        <button
          onClick={handleApprove}
          disabled={isApproving}
          className="px-7 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 backdrop-blur-xl rounded-full font-bold text-sm text-white transition-all cursor-pointer shadow-lg shadow-indigo-500/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isApproving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Approve &amp; Generate Roadmap
            </>
          )}
        </button>
      </motion.div>

    </motion.div>
  );
}
