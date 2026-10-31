// UI & Application Types for ChainTwin AI
export * from '../../engine/types';

export type AppMode = 'LIVE' | 'SIMULATION';

export interface ToastNotification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isDemoUser?: boolean;
}
