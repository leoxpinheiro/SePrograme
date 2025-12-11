import { EventData, Guest, GuestEntry, AppConfig } from '../types';

const STORAGE_KEYS = {
  EVENTS: 'vip_events',
  GUESTS: 'vip_guests',
  CONFIG: 'vip_config',
  AUTH: 'vip_auth'
};

const setItemSafe = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      throw new Error("Limite de armazenamento cheio. Use imagens menores.");
    }
    throw e;
  }
};

const DEFAULT_CONFIG: AppConfig = {
  logoUrl: '',
  heroImageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop',
  heroVerticalPosition: 50,
  heroTitle: 'Melhores Festas',
  heroSubtitle: 'Garanta seu nome na lista e aproveite a noite.',
  heroBadgeText: 'Experiência Exclusiva',
  marqueeText: 'Eventos Premium, Lista VIP, Open Bar, Melhores Festas, Experiências Exclusivas',
  adminPassword: 'admin',
  adminPhone: '',
  defaultWhatsappPhrase: 'Oi! Estou confirmando meus nomes para a lista VIP do evento {{eventName}}.\nSegue a lista:\n{{nomes}}\nAguardo confirmação 😊'
};

const init = () => {
  if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) {
    setItemSafe(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
  } else {
    // Clean migration if needed
    const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONFIG) || '{}');
    let updated = false;
    
    if (!current.defaultWhatsappPhrase) {
        current.defaultWhatsappPhrase = DEFAULT_CONFIG.defaultWhatsappPhrase;
        updated = true;
    }
    if (!current.marqueeText) {
        current.marqueeText = DEFAULT_CONFIG.marqueeText;
        updated = true;
    }
    if (!current.heroBadgeText) {
        current.heroBadgeText = DEFAULT_CONFIG.heroBadgeText;
        updated = true;
    }

    if (updated) {
        setItemSafe(STORAGE_KEYS.CONFIG, JSON.stringify(current));
    }
  }
};

init();

export const StorageService = {
  getEvents: (): EventData[] => {
    const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
    const events: EventData[] = data ? JSON.parse(data) : [];
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  saveEvent: (event: EventData) => {
    const events = StorageService.getEvents(); 
    const existingIndex = events.findIndex(e => e.id === event.id);
    
    if (existingIndex >= 0) {
      events[existingIndex] = event;
    } else {
      events.push(event);
    }
    setItemSafe(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  },

  deleteEvent: (id: string) => {
    const events = StorageService.getEvents().filter(e => e.id !== id);
    setItemSafe(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  },

  getGuests: (eventId?: string): Guest[] => {
    const data = localStorage.getItem(STORAGE_KEYS.GUESTS);
    const rawGuests: any[] = data ? JSON.parse(data) : [];
    
    // Migration: ensure entries exist
    const guests: Guest[] = rawGuests.map(g => {
        if (g.entries) return g;
        return {
            ...g,
            entries: (g.names || []).map((n: string) => ({
                name: n,
                gender: 'M',
                checkedIn: false
            })),
            isFake: false
        };
    });

    if (eventId) {
      return guests.filter(g => g.eventId === eventId);
    }
    return guests;
  },

  addGuest: (guest: Guest) => {
    const data = localStorage.getItem(STORAGE_KEYS.GUESTS);
    const guests: Guest[] = data ? JSON.parse(data) : [];
    guests.push(guest);
    setItemSafe(STORAGE_KEYS.GUESTS, JSON.stringify(guests));
  },

  updateGuest: (updatedGuest: Guest) => {
      const data = localStorage.getItem(STORAGE_KEYS.GUESTS);
      const guests: Guest[] = data ? JSON.parse(data) : [];
      const index = guests.findIndex(g => g.id === updatedGuest.id);
      if (index !== -1) {
          guests[index] = updatedGuest;
          setItemSafe(STORAGE_KEYS.GUESTS, JSON.stringify(guests));
      }
  },

  getConfig: (): AppConfig => {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONFIG) || '{}');
    // Merge stored config with defaults to ensure no fields are undefined
    return { ...DEFAULT_CONFIG, ...stored };
  },

  saveConfig: (config: AppConfig) => {
    setItemSafe(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  },
  
  isAuthenticated: (): boolean => {
    return localStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
  },
  
  login: (password: string): boolean => {
    const config = StorageService.getConfig();
    // Default to 'admin' if somehow empty, though getConfig handles this
    const currentPass = config.adminPassword || 'admin';
    if (password === currentPass) {
      localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
      return true;
    }
    return false;
  },
  
  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
  }
};