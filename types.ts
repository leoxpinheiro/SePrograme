
export interface GuestEntry {
  name: string;
  gender: 'M' | 'F';
  checkedIn: boolean;
  checkInTime?: number; // Timestamp of check-in
}

export interface Guest {
  id: string;
  eventId: string;
  entries: GuestEntry[];
  createdAt: string;
  isFake?: boolean;
}

export interface EventData {
  id: string;
  name: string;
  description: string;
  photoUrl: string;
  imagePosition?: number; // 0 to 100 percentage for vertical alignment
  date: string; // ISO string
  attractions: string;
  
  // Pricing
  priceLabel1: string; // e.g., "Mulher"
  priceValue1: string;
  priceLabel2: string; // e.g., "Homem"
  priceValue2: string;

  rules: string;
  capacity: number;
  
  address: string;
  
  tableLink: string;
  whatsappPhrase: string;
  showListPublicly: boolean;
  active: boolean;
}

export interface AppConfig {
  logoUrl: string;
  heroImageUrl: string;
  heroVerticalPosition: number;
  heroTitle: string;
  heroSubtitle: string;
  heroBadgeText: string;
  marqueeText: string;
  adminPassword: string;
  adminPhone: string;
  defaultWhatsappPhrase: string; // Global template for new events
}

export enum ViewMode {
  ADMIN_LOGIN = 'ADMIN_LOGIN',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  PUBLIC_EVENT = 'PUBLIC_EVENT',
}