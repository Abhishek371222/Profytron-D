'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportApi, type SupportTicket } from '@/lib/api/support';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MessageSquare, Plus, X, ChevronRight, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { label: 'General', value: 'general' },
  { label: 'Billing', value: 'billing' },
  { label: 'Technical', value: 'technical' },
  { label: 'Trading', value: 'trading' },
  { label: 'Account', value: 'account' },
  { label: 'Other', value: 'other' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }> = {
  OPEN: { label: 'Open', color: 'text-chart-4 bg-chart-4/10 border-chart-4/20', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', color: 'text-chart-5 bg-chart-5/10 border-chart-5/20', icon: Loader2 },
  RESOLVED: { label: 'Resolved', color: 'text-chart-3 bg-chart-3/10 border-chart-3/20', icon: CheckCircle },
  CLOSED: { label: 'Closed', color: 'text-foreground/30 bg-foreground/5 border-border', icon: X },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.OPEN;
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-micro font-bold uppercase tracking-widest border', cfg.color)}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

export default function SupportPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = React.useState(false);
  const [selectedTicket, setSelectedTicket] = React.useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = React.useState('');

  const [form, setForm] = React.useState({
    subject: '',
    description: '',
    category: 'general',
  });

  const { data: ticketsRaw, isLoading } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: () => supportApi.getTickets(),
  });
  const tickets: SupportTicket[] = Array.isArray(ticketsRaw) ? ticketsRaw : [];

  const { data: ticketDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['support-ticket', selectedTicket?.id],
    queryFn: () => supportApi.getTicket(selectedTicket!.id),
    enabled: !!selectedTicket?.id,
  });

  const createMutation = useMutation({
    mutationFn: supportApi.createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      setShowCreate(false);
      setForm({ subject: '', description: '', category: 'general' });
      toast.success('Support ticket submitted — our team was notified by email');
    },
    onError: (error: unknown) => {
      const payload =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { error?: string | string[]; message?: string | string[] } } })
              .response?.data
          : undefined;
      const raw = payload?.error ?? payload?.message;
      const message = Array.isArray(raw)
        ? raw.join(', ')
        : typeof raw === 'string' && raw.trim()
          ? raw
          : 'Failed to create ticket';
      toast.error(message);
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ ticketId, message }: { ticketId: string; message: string }) =>
      supportApi.addResponse(ticketId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-ticket', selectedTicket?.id] });
      setReplyText('');
      toast.success('Reply sent');
    },
    onError: () => toast.error('Failed to send reply'),
  });

  const handleCreate = () => {
    if (form.subject.trim().length < 5) {
      toast.error('Subject must be at least 5 characters');
      return;
    }
    if (form.description.trim().length < 10) {
      toast.error('Description must be at least 10 characters');
      return;
    }
    createMutation.mutate({
      subject: form.subject.trim(),
      description: form.description.trim(),
      category: form.category,
    });
  };

  const handleReply = () => {
    if (!replyText.trim() || !selectedTicket) return;
    replyMutation.mutate({ ticketId: selectedTicket.id, message: replyText });
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="flex items-start justify-between gap-4"
      >
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-foreground uppercase tracking-tight">Support Center</h2>
          <p className="text-xs text-foreground/30 uppercase tracking-widest font-semibold">Submit tickets · Track responses · Get help</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-premium flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest"
        >
          <Plus className="w-4 h-4" />
          New Ticket
        </button>
      </motion.div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 rounded-2xl bg-foreground/3 border border-border space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">New Support Ticket</h3>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center hover:bg-foreground/10">
                <X className="w-4 h-4 text-foreground/40" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-micro font-bold text-foreground/30 uppercase tracking-widest block mb-1.5">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, category: cat.value }))}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-micro font-bold uppercase tracking-widest border transition-all',
                        form.category === cat.value
                          ? 'bg-primary text-primary-foreground border-primary/40'
                          : 'bg-foreground/3 text-foreground/30 border-border hover:text-foreground hover:border-border',
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-micro font-bold text-foreground/30 uppercase tracking-widest block mb-1.5">Subject</label>
                <input
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="Briefly describe your issue..."
                  className="w-full h-11 bg-foreground/3 border border-border rounded-xl px-4 text-sm text-foreground placeholder:text-foreground/20 focus:border-primary/40 outline-none"
                />
              </div>

              <div>
                <label className="text-micro font-bold text-foreground/30 uppercase tracking-widest block mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Provide details about your issue..."
                  rows={4}
                  className="w-full bg-foreground/3 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-foreground/20 focus:border-primary/40 outline-none resize-none"
                />
              </div>

              <button
                type="button"
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="w-full h-11 bg-primary text-primary-foreground rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50"
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                {createMutation.isPending ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6">
        { }
        <div className="space-y-3">
          <div className="text-micro font-bold text-foreground/20 uppercase tracking-widest">
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
          </div>

          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-foreground/3 animate-pulse" />
            ))
          ) : tickets.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <MessageSquare className="w-10 h-10 text-foreground/10 mx-auto" />
              <p className="text-sm text-foreground/20 uppercase tracking-widest font-semibold">No tickets yet</p>
            </div>
          ) : (
            tickets.map((ticket, idx) => {
              const isSelected = selectedTicket?.id === ticket.id;
              return (
                <motion.button
                  key={ticket.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.3, ease: 'easeOut' }}
                  whileHover={{ y: -2 }}
                  onClick={() => setSelectedTicket(ticket)}
                  className={cn(
                    'w-full text-left p-4 rounded-2xl border transition-all duration-200',
                    isSelected
                      ? 'bg-primary/10 border-primary/30 shadow-[var(--shadow-card-hover)]'
                      : 'bg-foreground/2 border-border hover:border-primary/20 hover:bg-foreground/4 hover:shadow-[var(--shadow-card)]',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{ticket.subject}</p>
                      <p className="text-micro text-foreground/30 uppercase tracking-widest font-semibold">{ticket.category}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <StatusBadge status={ticket.status} />
                      <ChevronRight className="w-3.5 h-3.5 text-foreground/20" />
                    </div>
                  </div>
                </motion.button>
              );
            })
          )}
        </div>

        { }
        <div className="rounded-2xl bg-foreground/2 border border-border flex flex-col min-h-[400px]">
          {!selectedTicket ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
              <MessageSquare className="w-10 h-10 text-foreground/10" />
              <p className="text-sm text-foreground/20 uppercase tracking-widest font-semibold">Select a ticket to view</p>
            </div>
          ) : isLoadingDetail ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-foreground/20 animate-spin" />
            </div>
          ) : ticketDetail ? (
            <>
              <div className="p-5 border-b border-border space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-foreground">{ticketDetail.subject}</h3>
                  <StatusBadge status={ticketDetail.status} />
                </div>
                <p className="text-xs text-foreground/30 uppercase tracking-widest font-semibold">{ticketDetail.category}</p>
                <p className="text-sm text-foreground/50 leading-relaxed">{ticketDetail.description}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {(ticketDetail.responses || []).length === 0 ? (
                  <p className="text-xs text-foreground/20 text-center uppercase tracking-widest py-8">No responses yet — our team will reply soon.</p>
                ) : (
                  ticketDetail.responses!.map((resp) => (
                    <div
                      key={resp.id}
                      className={cn(
                        'p-4 rounded-xl text-sm',
                        resp.isAdmin
                          ? 'bg-primary/10 border border-primary/20 ml-4'
                          : 'bg-foreground/3 border border-border mr-4',
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={cn('text-micro font-bold uppercase tracking-widest', resp.isAdmin ? 'text-primary' : 'text-foreground/40')}>
                          {resp.isAdmin ? 'Support Team' : (resp.user?.fullName || 'You')}
                        </span>
                      </div>
                      <p className="text-foreground/70 leading-relaxed">{resp.message}</p>
                    </div>
                  ))
                )}
              </div>

              {ticketDetail.status !== 'RESOLVED' && ticketDetail.status !== 'CLOSED' && (
                <div className="p-5 border-t border-border flex gap-3">
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleReply()}
                    placeholder="Type a reply..."
                    className="flex-1 h-11 bg-foreground/3 border border-border rounded-xl px-4 text-sm text-foreground placeholder:text-foreground/20 focus:border-primary/40 outline-none"
                  />
                  <button
                    onClick={handleReply}
                    disabled={!replyText.trim() || replyMutation.isPending}
                    className="h-11 px-4 bg-primary text-primary-foreground rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50"
                  >
                    {replyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
                  </button>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
