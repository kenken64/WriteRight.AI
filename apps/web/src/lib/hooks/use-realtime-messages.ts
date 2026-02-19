'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { SubmissionMessage } from '@/lib/api/client';

export function useRealtimeMessages(submissionId: string) {
  const qc = useQueryClient();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`submission-messages:${submissionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'submission_messages',
          filter: `submission_id=eq.${submissionId}`,
        },
        (payload) => {
          const newMsg = payload.new as SubmissionMessage;
          qc.setQueryData<SubmissionMessage[]>(
            ['submission-messages', submissionId],
            (old) => {
              if (!old) return [newMsg];
              // Dedup by id
              if (old.some((m) => m.id === newMsg.id)) return old;
              return [...old, newMsg];
            },
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [submissionId, qc]);
}
