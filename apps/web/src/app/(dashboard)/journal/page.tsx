'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { journalApi, type JournalEntry } from '@/lib/api/journal';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Star,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Brain,
  Loader2,
  X,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const EMOTION_OPTIONS = ['Confident', 'Anxious', 'Greedy', 'Fearful', 'Calm', 'Impulsive', 'Disciplined', 'Frustrated'];

const EMOTION_COLORS: Record<string, string> = {
  Confident: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  Calm: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  Disciplined: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
  Anxious: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  Greedy: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  Fearful: 'text-red-400 bg-red-400/10 border-red-400/20',
  Impulsive: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  Frustrated: 'text-red-500 bg-red-500/10 border-red-500/20',
};

function EmotionTag({ emotion }: { emotion: string }) {
  const color = EMOTION_COLORS[emotion] ?? 'text-white/40 bg-white/5 border-white/10';
  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border', color)}>
      {emotion}
    </span>
  );
}

function StarRating({ rating, onChange }: { rating: number | null; onChange?: (r: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          onClick={() => onChange?.(s)}
          disabled={!onChange}
          className={cn('transition-all duration-150', onChange ? 'cursor-pointer hover:scale-125' : 'cursor-default')}
        >
          <Star
            className={cn(
              'w-3.5 h-3.5 transition-colors',
              (rating ?? 0) >= s ? 'text-yellow-400 fill-yellow-400' : 'text-white/15',
            )}
          />
        </button>
      ))}
    </div>
  );
}

function JournalCard({
  entry,
  isSelected,
  onClick,
}: {
  entry: JournalEntry;
  isSelected: boolean;
  onClick: () => void;
}) {
  const pnl = entry.trade.profit;
  const isWin = pnl !== null && pnl > 0;
  const emotions = entry.emotions?.split(',').map((e) => e.trim()).filter(Boolean) ?? [];

  return (
    <motion.button
      layout
      onClick={onClick}
      whileHover={{ x: 2 }}
      className={cn(
        'w-full text-left p-4 rounded-[20px] border transition-all duration-300 group',
        isSelected
          ? 'bg-indigo-500/8 border-indigo-500/25 shadow-[0_0_20px_rgba(99,102,241,0.08)]'
          : 'bg-white/[0.02] border-white/[0.05] hover:border-white/10 hover:bg-white/[0.03]',
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">{entry.trade.symbol}</span>
            <span
              className={cn(
                'text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md',
                entry.trade.direction === 'LONG'
                  ? 'text-emerald-400 bg-emerald-400/10'
                  : 'text-rose-400 bg-rose-400/10',
              )}
            >
              {entry.trade.direction}
            </span>
          </div>
          <p className="text-[10px] text-white/25 uppercase tracking-widest font-mono">{fmtDate(entry.createdAt)}</p>
        </div>
        <div className="text-right shrink-0 space-y-1">
          {pnl !== null ? (
            <p className={cn('text-sm font-bold', isWin ? 'text-emerald-400' : 'text-rose-400')}>
              {isWin ? '+' : ''}${Math.abs(pnl).toFixed(2)}
            </p>
          ) : (
            <p className="text-xs text-white/25">Open</p>
          )}
          <StarRating rating={entry.rating} />
        </div>
      </div>

      {emotions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {emotions.slice(0, 3).map((e) => (
            <EmotionTag key={e} emotion={e} />
          ))}
          {emotions.length > 3 && (
            <span className="text-[10px] text-white/20 uppercase tracking-widest self-center">
              +{emotions.length - 3}
            </span>
          )}
        </div>
      )}

      {entry.aiAnalysis && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span className="text-[10px] text-indigo-300 uppercase tracking-widest font-bold">AI Analysis</span>
        </div>
      )}
    </motion.button>
  );
}

function InsightsBar() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data } = useQuery({
    queryKey: ['journal-insights'],
    queryFn: () => journalApi.insights(),
    enabled: isAuthenticated,
  });
  if (!data?.emotionalPatterns) return null;
  const topEmotion = Object.entries(data.emotionalPatterns).sort(([, a], [, b]) => b - a)[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-4 rounded-[22px] border border-white/[0.07] bg-white/[0.02] px-5 py-4"
    >
      <div className="flex items-center gap-2 shrink-0">
        <Brain className="w-4 h-4 text-indigo-400" />
        <span className="text-[10px] font-bold text-white/35 uppercase tracking-[0.3em]">Emotional Insights</span>
      </div>
      <div className="flex items-center gap-5 ml-auto">
        <div className="text-center">
          <p className="text-lg font-bold text-white">{data.totalEntries}</p>
          <p className="text-[9px] text-white/25 uppercase tracking-widest">Entries</p>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="text-center">
          <p className="text-lg font-bold text-yellow-400">
            {data.averageRating > 0 ? data.averageRating.toFixed(1) : '—'}
          </p>
          <p className="text-[9px] text-white/25 uppercase tracking-widest">Avg Rating</p>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="text-center">
          <p className="text-sm font-bold text-white truncate max-w-[80px]">{topEmotion ? topEmotion[0] : '—'}</p>
          <p className="text-[9px] text-white/25 uppercase tracking-widest">Top Emotion</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function JournalPage() {
  const queryClient = useQueryClient();
  const [selectedEntry, setSelectedEntry] = React.useState<JournalEntry | null>(null);
  const [editingEmotions, setEditingEmotions] = React.useState<string[]>([]);
  const [editingLesson, setEditingLesson] = React.useState('');
  const [isEditing, setIsEditing] = React.useState(false);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['journal'],
    queryFn: () => journalApi.list({ limit: 100 }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      journalApi.update(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
      queryClient.invalidateQueries({ queryKey: ['journal-insights'] });
      setSelectedEntry(updated);
      setIsEditing(false);
      toast.success('Journal entry saved');
    },
    onError: () => toast.error('Failed to save entry'),
  });

  const rateMutation = useMutation({
    mutationFn: ({ id, rating }: { id: string; rating: number }) => journalApi.rate(id, rating),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
      setSelectedEntry(updated);
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: (id: string) => journalApi.analyze(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
      setSelectedEntry(updated);
      toast.success('AI analysis complete');
    },
    onError: () => toast.error('AI analysis failed'),
  });

  const handleSelectEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setEditingEmotions(entry.emotions?.split(',').map((e) => e.trim()).filter(Boolean) ?? []);
    setEditingLesson(entry.lessonLearned ?? '');
    setIsEditing(false);
  };

  const handleSave = () => {
    if (!selectedEntry) return;
    updateMutation.mutate({
      id: selectedEntry.id,
      payload: {
        emotions: editingEmotions.join(', '),
        lessonLearned: editingLesson,
      },
    });
  };

  const toggleEmotion = (emotion: string) => {
    setEditingEmotions((prev) =>
      prev.includes(emotion) ? prev.filter((e) => e !== emotion) : [...prev, emotion],
    );
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed top-0 left-0 h-72 w-72 rounded-full bg-indigo-500/5 blur-[120px]" />

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[28px] border border-indigo-500/15 bg-gradient-to-br from-indigo-500/[0.04] to-transparent p-6 md:p-8"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/35 to-transparent" />
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-indigo-400/70">Trade Journal</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">My Trades</h1>
            <p className="text-sm text-white/40">Track emotions · Learn lessons · Get AI insights</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-indigo-400" />
          </div>
        </div>
      </motion.div>

      {/* ── Insights bar ── */}
      <InsightsBar />

      {/* ── Main split panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.35fr] gap-4">
        {/* Entry List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">
              {entries.length} entr{entries.length !== 1 ? 'ies' : 'y'}
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-[20px] bg-white/[0.025] animate-pulse border border-white/[0.04]" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-[20px] bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto">
                <BookOpen className="w-7 h-7 text-white/10" />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-bold text-white/20 uppercase tracking-widest">No trades recorded</p>
                <p className="text-xs text-white/15">Journal entries are created from your trade history.</p>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {(entries as JournalEntry[]).map((entry) => (
                  <JournalCard
                    key={entry.id}
                    entry={entry}
                    isSelected={selectedEntry?.id === entry.id}
                    onClick={() => handleSelectEntry(entry)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* ── Detail Panel ── */}
        <motion.div
          layout
          className="rounded-[24px] border border-white/[0.06] bg-white/[0.015] flex flex-col min-h-[520px] overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {!selectedEntry ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center gap-4 p-10 text-center"
              >
                <div className="w-16 h-16 rounded-[20px] bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <ChevronRight className="w-6 h-6 text-white/10" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white/20 uppercase tracking-widest">Select a trade</p>
                  <p className="text-xs text-white/15">Click any entry to view details and insights.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={selectedEntry.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col h-full"
              >
                {/* Trade header */}
                <div className="p-5 border-b border-white/[0.06] bg-white/[0.01]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white">{selectedEntry.trade.symbol}</span>
                        <span
                          className={cn(
                            'text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg',
                            selectedEntry.trade.direction === 'LONG'
                              ? 'text-emerald-400 bg-emerald-400/10'
                              : 'text-rose-400 bg-rose-400/10',
                          )}
                        >
                          {selectedEntry.trade.direction}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/25 font-mono">{fmtDateTime(selectedEntry.createdAt)}</p>
                    </div>
                    <div className="text-right space-y-1">
                      {selectedEntry.trade.profit !== null && (
                        <p
                          className={cn(
                            'text-xl font-bold',
                            selectedEntry.trade.profit >= 0 ? 'text-emerald-400' : 'text-rose-400',
                          )}
                        >
                          {selectedEntry.trade.profit >= 0 ? '+' : ''}$
                          {Math.abs(selectedEntry.trade.profit).toFixed(2)}
                        </p>
                      )}
                      <StarRating
                        rating={selectedEntry.rating}
                        onChange={(r) => rateMutation.mutate({ id: selectedEntry.id, rating: r })}
                      />
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 p-5 space-y-5 overflow-y-auto">
                  {/* Emotions */}
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-bold text-white/25 uppercase tracking-[0.3em] block">
                      Emotions During Trade
                    </label>
                    {isEditing ? (
                      <div className="flex flex-wrap gap-2">
                        {EMOTION_OPTIONS.map((e) => (
                          <button
                            key={e}
                            onClick={() => toggleEmotion(e)}
                            className={cn(
                              'px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all duration-200',
                              editingEmotions.includes(e)
                                ? EMOTION_COLORS[e] ?? 'bg-indigo-500 text-white border-indigo-400/40'
                                : 'bg-white/[0.03] text-white/30 border-white/[0.06] hover:border-white/15',
                            )}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 min-h-[28px]">
                        {editingEmotions.length > 0 ? (
                          editingEmotions.map((e) => <EmotionTag key={e} emotion={e} />)
                        ) : (
                          <p className="text-xs text-white/15">No emotions recorded</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Lesson */}
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-bold text-white/25 uppercase tracking-[0.3em] block">
                      Lesson Learned
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editingLesson}
                        onChange={(e) => setEditingLesson(e.target.value)}
                        rows={4}
                        placeholder="What did you learn from this trade?"
                        className="w-full bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-indigo-400/40 outline-none resize-none transition-colors"
                      />
                    ) : (
                      <p className="text-sm text-white/45 leading-relaxed">
                        {editingLesson || <span className="text-white/15">No lesson recorded</span>}
                      </p>
                    )}
                  </div>

                  {/* AI Analysis */}
                  {selectedEntry.aiAnalysis && (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.3em]">
                          AI Analysis
                        </label>
                      </div>
                      <div className="p-4 rounded-xl bg-indigo-500/[0.06] border border-indigo-500/20">
                        <p className="text-xs text-white/55 leading-relaxed whitespace-pre-line">
                          {selectedEntry.aiAnalysis}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-5 border-t border-white/[0.06] flex gap-3">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="h-10 px-4 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/40 text-[11px] font-bold uppercase tracking-widest hover:bg-white/[0.06] transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={updateMutation.isPending}
                        className="flex-1 h-10 bg-indigo-500 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-400 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(99,102,241,0.25)]"
                      >
                        {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Entry'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="h-10 px-4 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/45 text-[11px] font-bold uppercase tracking-widest hover:bg-white/[0.06] hover:text-white/70 transition-all"
                      >
                        Edit
                      </button>
                      {!selectedEntry.aiAnalysis && (
                        <button
                          onClick={() => analyzeMutation.mutate(selectedEntry.id)}
                          disabled={analyzeMutation.isPending}
                          className="flex-1 h-10 border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 rounded-xl text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-500/20 disabled:opacity-50 transition-all"
                        >
                          {analyzeMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                          AI Analyze
                        </button>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
