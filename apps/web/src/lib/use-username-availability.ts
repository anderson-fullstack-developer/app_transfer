'use client';

import { useEffect, useState } from 'react';
import { normalizeUsername, type UsernameAvailability, validateUsername } from '@app/shared';
import { apiFetch, ApiError } from './api-client';

type State =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'invalid'; reason: string }
  | { status: 'available'; username: string }
  | { status: 'taken'; reason: string };

/** Verifica a disponibilidade de um @username com debounce (400ms). */
export function useUsernameAvailability(raw: string): State {
  const [state, setState] = useState<State>({ status: 'idle' });

  useEffect(() => {
    const normalized = normalizeUsername(raw);
    if (normalized.length === 0) {
      setState({ status: 'idle' });
      return;
    }

    // Validacao local imediata (formato / reservados).
    const local = validateUsername(normalized);
    if (!local.valid) {
      setState({ status: 'invalid', reason: local.reason ?? 'Username invalido.' });
      return;
    }

    setState({ status: 'checking' });
    const controller = new AbortController();
    const timer = setTimeout(() => {
      apiFetch<UsernameAvailability>(
        `/students/username/${encodeURIComponent(normalized)}/availability`,
      )
        .then((res) => {
          if (controller.signal.aborted) return;
          setState(
            res.available
              ? { status: 'available', username: res.username }
              : { status: 'taken', reason: res.reason ?? 'Ja esta em uso.' },
          );
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          setState({
            status: 'invalid',
            reason: err instanceof ApiError ? err.message : 'Nao foi possivel verificar.',
          });
        });
    }, 400);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [raw]);

  return state;
}
