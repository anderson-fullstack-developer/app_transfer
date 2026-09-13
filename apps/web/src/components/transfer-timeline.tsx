import { TRANSFER_TIMELINE_STEPS, type TransferView } from '@app/shared';
import { Alert } from '@app/ui/components';
import { cn } from '@app/ui/lib/cn';

const STOPPED_STATUSES = ['FAILED', 'CANCELLED', 'REFUNDED'] as const;

const STEP_LABEL: Record<string, string> = {
  DRAFT: 'Pedido criado',
  AWAITING_PAYMENT: 'A aguardar pagamento',
  PAYMENT_PROCESSING: 'A processar pagamento',
  PAID: 'Pagamento confirmado',
  PROCESSING: 'A processar',
  SENT_TO_PROVIDER: 'Enviado',
  DELIVERED: 'Recebido',
};

/** Timeline vertical do progresso de uma transferencia (doc, seccao 18 e 21). */
export function TransferTimeline({ transfer }: { transfer: TransferView }): React.JSX.Element {
  const stopped = (STOPPED_STATUSES as readonly string[]).includes(transfer.status);
  const currentIndex = TRANSFER_TIMELINE_STEPS.indexOf(
    transfer.status as (typeof TRANSFER_TIMELINE_STEPS)[number],
  );

  if (stopped) {
    return (
      <Alert>
        Esta transferência não foi concluída (estado: <strong>{transfer.status}</strong>). Nenhum
        novo envio foi criado automaticamente.
      </Alert>
    );
  }

  return (
    <ol className="space-y-0">
      {TRANSFER_TIMELINE_STEPS.map((step, i) => {
        const done = i <= currentIndex;
        const isLast = i === TRANSFER_TIMELINE_STEPS.length - 1;
        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 text-[10px] font-bold',
                  done
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground',
                )}
              >
                {done ? '✓' : ''}
              </span>
              {!isLast && (
                <span
                  className={cn('w-0.5 flex-1', done ? 'bg-primary' : 'bg-border')}
                  style={{ minHeight: 20 }}
                />
              )}
            </div>
            <p
              className={cn(
                'pb-5 text-sm',
                done ? 'font-medium text-foreground' : 'text-muted-foreground',
              )}
            >
              {STEP_LABEL[step] ?? step}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
