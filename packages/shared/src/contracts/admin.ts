import { TransferStatus, UserRole, UserStatus } from '../domain/enums.js';

/** Estados agrupados para os cards do dashboard (doc, seccao 21). */
export const ADMIN_COMPLETED_STATUSES: readonly TransferStatus[] = [TransferStatus.DELIVERED];
export const ADMIN_FAILED_STATUSES: readonly TransferStatus[] = [
  TransferStatus.FAILED,
  TransferStatus.CANCELLED,
  TransferStatus.REFUNDED,
];

export interface AdminStatsView {
  totalUsers: number;
  totalStudents: number;
  totalSenders: number;
  totalTransfers: number;
  /** Soma de sourceAmountMinor de todas as transferencias, em cents de EUR. */
  volumeEurMinor: string;
  pendingTransfers: number;
  failedTransfers: number;
  completedTransfers: number;
}

export interface AdminUserListItem {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  displayName: string | null;
  username: string | null;
  createdAt: string;
}

export interface AdminTransferListItem {
  reference: string;
  status: TransferStatus;
  senderEmail: string;
  senderDisplayName: string;
  studentUsername: string;
  studentDisplayName: string;
  sourceAmountMinor: string;
  destinationAmountMinor: string;
  provider: string;
  createdAt: string;
}

/** Filtros aceites por `GET /admin/transfers` (todos opcionais). */
export interface AdminTransferFilters {
  status?: TransferStatus;
  username?: string;
  reference?: string;
  dateFrom?: string;
  dateTo?: string;
}
