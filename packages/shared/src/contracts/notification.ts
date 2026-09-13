export interface NotificationView {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  /** Ex.: { transferReference: "TRF-XXXX" } — usado para navegar ao clicar. */
  metadata: Record<string, unknown>;
}

export interface NotificationListResult {
  items: NotificationView[];
  unreadCount: number;
}
