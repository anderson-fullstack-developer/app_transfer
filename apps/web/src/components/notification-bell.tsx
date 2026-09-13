'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type NotificationListResult, type NotificationView } from '@app/shared';
import { cn } from '@app/ui/lib/cn';
import { apiFetch } from '@/lib/api-client';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.floor(hours / 24)}d`;
}

export function NotificationBell(): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery<NotificationListResult>({
    queryKey: ['notifications'],
    queryFn: () => apiFetch<NotificationListResult>('/notifications'),
    refetchInterval: 15_000,
  });

  useEffect(() => {
    function onClickOutside(e: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const onSelect = async (n: NotificationView): Promise<void> => {
    setOpen(false);
    if (!n.readAt) {
      await apiFetch(`/notifications/${n.id}/read`, { method: 'PATCH' });
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
    const transferReference = n.metadata.transferReference;
    if (typeof transferReference === 'string') {
      router.push(`/transfers/${encodeURIComponent(transferReference)}`);
    }
  };

  const markAllRead = async (): Promise<void> => {
    await apiFetch('/notifications/read-all', { method: 'PATCH' });
    await queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const unread = data?.unreadCount ?? 0;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-muted"
        aria-label="Notificações"
      >
        <span aria-hidden>🔔</span>
        {unread > 0 && (
          <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-danger text-[10px] font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-border bg-surface shadow-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <p className="text-sm font-semibold">Notificações</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-xs text-primary hover:underline"
              >
                Marcar tudo como lido
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {!data || data.items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                Sem notificações.
              </p>
            ) : (
              data.items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => void onSelect(n)}
                  className={cn(
                    'block w-full border-b border-border px-4 py-3 text-left text-sm last:border-b-0 hover:bg-muted/60',
                    !n.readAt && 'bg-primary/5',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{n.title}</p>
                    {!n.readAt && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="mt-0.5 text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{timeAgo(n.createdAt)}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
