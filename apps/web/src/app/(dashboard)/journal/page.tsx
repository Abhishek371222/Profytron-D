'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { journalApi, type JournalEntry } from '@/lib/api/journal';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  BookOpen, Star, Sparkles, TrendingUp, TrendingDown, ChevronRight,
  Brain, Smile, Frown, Meh, Zap, Loader2, X, BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const EMOTION_OPTIONS = ['Confident', 'Anxious', 'Greedy', 'Fearful', 'Calm', 'Impulsive', 'Disciplined', 'Frustrated'];

const EMOTION_COLORS: Record<string, string> = {
  Confident: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  Calm: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  Disciplined: 'text-p bg-p/10 border-p/20',
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
          className={cn('transition-colors', onChange ? 'cursor-pointer hover:scale-110' : 'cursor-default')}
        >
          <Star className={cn('w-4 h-4', (rating ?? 0) >= s ? 'text-yellow-400 fill-yellow-400' : 'text-white/15')} />
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
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 rounded-2xl border transition-all',
        isSelected ? 'bg-p/10 border-p/30' : 'bg-white/2 border-white/5 hover:border-white/10 hover:bg-white/4',
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">{entry.trade.symbol}</span>
            <span className={cn('text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded', entry.trade.direction === 'LONG' ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10')}>
              {entry.trade.direction}
            </span>
          </div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest">
            {fmtDate(entry.createdAt)}
          </p>
        </div>
        <div className="text-right shrink-0">
          {pnl !== null ? (
            <p className={cn('text-sm font-bold', isWin ? 'text-emerald-400' : 'text-red-400')}>
              {isWin ? '+' : ''}${pnl.toFixed(2)}
            </p>
          ) : (
            <p className="text-sm text-white/30">Open</p>
          )}
          <StarRating rating={entry.rating} />
        </div>
      </div>

      {emotions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {emotions.slice(0, 3).map((e) => (
            <EmotionTag key={e} emotion={e} />
          ))}
          {emotions.length > 3 && (
            <span className="text-[10px] text-white/20 uppercase tracking-widest self-center">+{emotions.length - 3}</span>
          )}
        </div>
      )}

      {entry.aiAnalysis && (
        <div className="mt-2 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-p" />
          <span className="text-[10px] text-p uppercase tracking-widest font-bold">AI Analysis available</span>
        </div>
      )}
    </button>
  );
}

function InsightsPanel({ userId }: { userId?: string }) {
  const { data } = useQuery({
    queryKey: ['journal-insights'],
    queryFn: () => journalApi.insights(),
  });
  if (!data) return null;
  const topEmotion = Object.entries(data.emotionalPatterns).sort(([, a], [, b]) => b - a)[0];
  return (
    <div className="p-5 rounded-2xl bg-white/3 border border-white/8 space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="w-4 h-4 text-p" />
        <span className="text-xs font-bold text-white uppercase tracking-widest">Emotional Insights</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-xl font-bold text-white">{data.totalEntries}</p>
          <p className="text-[10px] text-white/30 uppercase tracking-widest">Entries</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-yellow-400">{data.averageRating > 0 ? data.averageRating.toFixed(1) : '—'}</p>
          <p className="text-[10px] text-white/30 uppercase tracking-widest">Avg Rating</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-white truncate">{topEmotion ? topEmotion[0] : '—'}</p>
          <p className="text-[10px] text-white/30 uppercase tracking-widest">Top Emotion</p>
        </div>
      </div>
    </div>
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
    mutationFn: ({ id, payload }: { id: string; payload: any }) => journalApi.update(id, payload),
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
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-white uppercase tracking-tight">Trade Journal</h2>
          <p className="text-xs text-white/30 uppercase tracking-widest font-semibold">Emotions · Lessons · AI analysis</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-p/10 border border-p/20 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-p" />
        </div>
      </div>

      <InsightsPanel />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-6">
        {/* Entry List */}
        <div className="space-y-3">
          <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">
            {entries.length} entr{entries.length !== 1 ? 'ies' : 'y'}
          </p>

          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-white/3 animate-pulse" />
            ))
          ) : entries.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-white/10 mx-auto" />
              <p className="text-sm text-white/20 uppercase tracking-widest font-semibold">No journal entries yet</p>
              <p className="text-xs text-white/15">Journal entries are created from your trade history.</p>
            </div>
          ) : (
            entries.map((entry) => (
              <JournalCard
                key={entry.id}
                entry={entry}
                isSelected={selectedEntry?.id === entry.id}
                onClick={() => handleSelectEntry(entry)}
              />
            ))
          )}
        </div>

        {/* Detail Panel */}
        <div className="rounded-2xl bg-white/2 border border-white/5 flex flex-col min-h-[500px]">
          {!selectedEntry ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
              <BookOpen className="w-10 h-10 text-white/10" />
              <p className="text-sm text-white/20 uppercase tracking-widest font-semibold">Select an entry to review</p>
            </div>
          ) : (
            <>
              {/* Trade Summary */}
              <div className="p-5 border-b border-white/5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-bold text-white">{selectedEntry.trade.symbol}</span>
                      <span className={cn('text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded', selectedEntry.trade.direction === 'LONG' ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10')}>
                        {selectedEntry.trade.direction}
                      </span>
                    </div>
                    <p className="text-xs text-white/30">
                      {fmtDateTime(selectedEntry.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    {selectedEntry.trade.profit !== null && (
                      <p className={cn('text-lg font-bold', selectedEntry.trade.profit >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                        {selectedEntry.trade.profit >= 0 ? '+' : ''}${selectedEntry.trade.profit.toFixed(2)}
                      </p>
                    )}
                    <StarRating
                      rating={selectedEntry.rating}
                      onChange={(r) => rateMutation.mutate({ id: selectedEntry.id, rating: r })}
                    />
                  </div>
                </div>
              </div>

              {/* Editable body */}
              <div className="flex-1 p-5 space-y-5 overflow-y-auto">
                {/* Emotions */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Emotions During Trade</label>
                  {isEditing ? (
                    <div className="flex flex-wrap gap-2">
                      {EMOTION_OPTIONS.map((e) => (
                        <button
                          key={e}
                          onClick={() => toggleEmotion(e)}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all',
                            editingEmotions.includes(e)
                              ? EMOTION_COLORS[e] ?? 'bg-p text-white border-p/40'
                              : 'bg-white/3 text-white/30 border-white/5 hover:border-white/10',
                          )}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 min-h-[32px]">
                      {editingEmotions.length > 0 ? (
                        editingEmotions.map((e) => <EmotionTag key={e} emotion={e} />)
                      ) : (
                        <p className="text-xs text-white/20">No emotions recorded</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Lesson Learned */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Lesson Learned</label>
                  {isEditing ? (
                    <textarea
                      value={editingLesson}
                      onChange={(e) => setEditingLesson(e.target.value)}
                      rows={4}
                      placeholder="What did you learn from this trade?"
                      className="w-full bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-p/40 outline-none resize-none"
                    />
                  ) : (
                    <p className="text-sm text-white/50 leading-relaxed">
                      {editingLesson || <span className="text-white/20">No lesson recorded</span>}
                    </p>
                  )}
                </div>

                {/* AI Analysis */}
                {selectedEntry.aiAnalysis && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-p" />
                      <label className="text-[10px] font-bold text-p uppercase tracking-widest">AI Analysis</label>
                    </div>
                    <div className="p-4 rounded-xl bg-p/5 border border-p/15">
                      <p className="text-xs text-white/60 leading-relaxed whitespace-pre-line">{selectedEntry.aiAnalysis}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-5 border-t border-white/5 flex gap-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="h-10 px-4 rounded-xl bg-white/5 text-white/40 text-xs font-bold uppercase tracking-widest hover:bg-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                      className="flex-1 h-10 bg-p text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-p/90 disabled:opacity-50"
                    >
                      {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Entry'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="h-10 px-4 rounded-xl bg-white/5 text-white/60 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
                    >
                      Edit
                    </button>
                    {!selectedEntry.aiAnalysis && (
                      <button
                        onClick={() => analyzeMutation.mutate(selectedEntry.id)}
                        disabled={analyzeMutation.isPending}
                        className="flex-1 h-10 bg-p/15 border border-p/30 text-p rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-p/20 disabled:opacity-50 transition-colors"
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
