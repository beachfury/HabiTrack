// apps/api/src/notify/provider.ts
export type NotifyKind = 'password_reset_code' | 'password_reset' | 'onboard_link' | 'generic';

export type NotifyPayload = {
  kind: 'password_reset' | 'password_reset_code' | 'onboard_link' | 'generic';
  userId: number;
  toEmail: string | null;
  subject: string;
  text?: string | null;
  html?: string | null;
};

export interface NotificationProvider {
  enqueue(m: NotifyPayload): Promise<void>;
}
