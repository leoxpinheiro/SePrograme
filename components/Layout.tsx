import React from 'react';
import { StorageService } from '../services/storage.ts';

interface LayoutProps {
  children: React.ReactNode;
  toggleTheme: () => void;
  isDark: boolean;
  onNavigate: (path: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, toggleTheme, isDark, onNavigate }) => {
  const config = StorageService.getConfig();

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500`}>
      
      {/* Header - Glassmorphism Premium */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors duration-300 ${isDark ? 'bg-brand-darker/80 border-white/5' : 'bg-white/80 border-white/50 shadow-sm'}`}>
        <div className="max-w-6xl mx-auto px-6 h-[80px] flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => onNavigate('/')}>
            {config.logoUrl ? (
               <img src={config.logoUrl} alt="Logo" className="h-10 w-auto object-contain transition-transform group-hover:scale-105 drop-shadow-lg" />
            ) : (
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-neon rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-neon transform group-hover:rotate-6 transition-all duration-300">
                    S
                 </div>
                 <span className="font-bold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand-dark to-brand-primary dark:from-white dark:to-brand-surface">
                    Se Programe
                 </span>
               </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
             <button
              onClick={toggleTheme}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border ${isDark ? 'bg-white/5 border-white/10 text-brand-warning hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-brand-primary hover:bg-gray-100'}`}
              aria-label="Alternar Tema"
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 24.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
            
            <button
               onClick={() => onNavigate('/admin')}
               className="text-sm font-bold px-6 py-2.5 rounded-xl bg-brand-dark text-white hover:bg-brand-primary transition-all shadow-lg active:scale-95 border border-white/10 dark:bg-white dark:text-brand-darker dark:hover:bg-brand-surface"
            >
              Painel
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 relative">
        {/* Background Gradients */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
            <div className={`absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-primary/20 rounded-full blur-[120px] mix-blend-multiply opacity-50 animate-pulse-slow ${isDark ? 'bg-brand-primary/10' : ''}`}></div>
            <div className={`absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-brand-neon/20 rounded-full blur-[120px] mix-blend-multiply opacity-50 animate-pulse-slow ${isDark ? 'bg-brand-neon/10' : ''}`}></div>
        </div>
        {children}
      </main>

      <footer className={`py-12 border-t mt-12 ${isDark ? 'bg-brand-darker border-white/5' : 'bg-white border-gray-100'}`}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
             <div className="w-6 h-6 bg-brand-primary rounded-lg flex items-center justify-center text-white font-bold text-xs">S</div>
             <span className="font-bold text-sm text-brand-dark dark:text-white">Se Programe</span>
          </div>
          <p className={`text-xs font-medium uppercase tracking-widest ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
            &copy; {new Date().getFullYear()} • Plataforma de Eventos
          </p>
        </div>
      </footer>
    </div>
  );
};