import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { PublicEvent } from './pages/PublicEvent';
import { Admin } from './pages/Admin';
import { StorageService } from './services/storage.ts';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.hash || '#/');
  const [isDark, setIsDark] = useState(false);
  const config = StorageService.getConfig();

  useEffect(() => {
    const handleHashChange = () => setCurrentPath(window.location.hash || '#/');
    window.addEventListener('hashchange', handleHashChange);
    
    // Auto dark mode logic respecting preference
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };

  const navigate = (path: string) => window.location.hash = path;

  // STRICT Date Formatter
  const formatEventDate = (dateStr: string) => {
    if (!dateStr) return { day: '', time: '', weekday: '', full: '' };
    const d = new Date(dateStr);
    
    // Manual formatting for Portuguese consistency
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    
    const weekday = days[d.getDay()];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    
    return {
      day: `${day} ${month}`,
      time: `${hours}:${minutes}h`,
      weekday: weekday,
      full: `${weekday} • ${day} ${month} • ${hours}:${minutes}h`
    };
  };

  const renderPage = () => {
    let path = currentPath.replace('#', '');
    if (!path.startsWith('/')) path = '/' + path;
    
    if (path.startsWith('/event/')) return <PublicEvent eventId={path.split('/')[2]} />;
    if (path === '/admin') return <Admin />;

    // --- HOME PAGE REDESIGNED ---
    
    // Parse marquee text
    const marqueeItems = (config.marqueeText || 'Eventos Premium, Lista VIP, Open Bar').split(',').map(s => s.trim());

    return (
      <div className="space-y-12 animate-fade-in pb-12">
        
        {/* HERO BANNER - Compact Premium & Animated */}
        <div className="relative rounded-3xl overflow-hidden h-[280px] md:h-[320px] group shadow-neon border border-brand-primary/20">
            <img 
                src={config.heroImageUrl} 
                alt="Banner" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                style={{ objectPosition: `center ${config.heroVerticalPosition || 50}%` }}
            />
            {/* Premium Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-neon/90 via-brand-primary/80 to-transparent flex flex-col justify-center px-8 md:px-16">
                <div className="max-w-2xl space-y-4 animate-slide-up">
                    <span className="inline-block px-4 py-1.5 text-[10px] md:text-xs font-bold tracking-[0.2em] text-white uppercase bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-glass">
                        {config.heroBadgeText || 'Experiência Exclusiva'}
                    </span>
                    <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-lg">
                        {config.heroTitle}
                    </h1>
                    <p className="text-brand-surface text-sm md:text-lg font-medium opacity-90 max-w-lg leading-relaxed">
                        {config.heroSubtitle}
                    </p>
                </div>
            </div>
        </div>

        {/* INFINITE MARQUEE - Modern Horizontal Scroll */}
        <div className="w-full overflow-hidden bg-white dark:bg-white/5 border-y border-gray-100 dark:border-white/5 py-4">
            <div className="flex animate-marquee whitespace-nowrap">
                {/* Loop twice for smooth infinite effect */}
                {[...Array(2)].map((_, groupIndex) => (
                    <div key={groupIndex} className="flex gap-12 px-6">
                        {marqueeItems.map((item, i) => (
                            <React.Fragment key={i}>
                                <span className={`text-sm font-bold uppercase tracking-widest ${i % 2 === 0 ? 'text-brand-primary dark:text-brand-electric' : 'text-brand-neon'}`}>
                                    {item}
                                </span>
                                <span className="text-gray-300 dark:text-gray-700">•</span>
                            </React.Fragment>
                        ))}
                    </div>
                ))}
            </div>
        </div>
        
        {/* COMPACT EVENT GRID - Glassmorphism Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {StorageService.getEvents().map(event => {
                const dateInfo = formatEventDate(event.date);
                return (
                  <div 
                    key={event.id} 
                    className="group relative bg-white dark:bg-white/5 backdrop-blur-xl rounded-3xl overflow-hidden shadow-float hover:shadow-neon-purple transition-all duration-500 border border-gray-100 dark:border-white/10 hover:-translate-y-2 cursor-pointer flex flex-col h-full"
                    onClick={() => navigate(`/event/${event.id}`)}
                  >
                      
                      {/* Image Area with Gradient Fade */}
                      <div className="relative w-full aspect-[4/5] overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity"></div>
                          <img 
                              src={event.photoUrl} 
                              alt={event.name} 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                              style={{ objectPosition: `center ${event.imagePosition !== undefined ? event.imagePosition : 50}%` }}
                          />
                          
                          {/* Floating Date Badge */}
                          <div className="absolute top-4 left-4 z-20 bg-white/90 dark:bg-black/60 backdrop-blur-md px-3 py-2 rounded-2xl shadow-lg border border-white/20 flex flex-col items-center min-w-[60px]">
                             <span className="text-[10px] font-black text-brand-neon uppercase tracking-wider">{dateInfo.day.split(' ')[1]}</span>
                             <span className="text-2xl font-bold text-brand-dark dark:text-white leading-none">{dateInfo.day.split(' ')[0]}</span>
                          </div>

                          {/* Content Overlay */}
                          <div className="absolute bottom-0 left-0 w-full p-6 z-20">
                               <h2 className="text-2xl font-bold text-white leading-tight mb-2 drop-shadow-md group-hover:text-brand-electric transition-colors">
                                 {event.name}
                               </h2>
                               <div className="flex items-center gap-2 text-sm font-medium text-gray-200 mb-4">
                                  <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-sm border border-white/10 text-xs font-bold uppercase">{dateInfo.weekday}</span>
                                  <span>{dateInfo.time}</span>
                               </div>
                          </div>
                      </div>

                      {/* Info & Action - Clean Bottom */}
                      <div className="p-5 flex flex-col flex-grow bg-white dark:bg-[#111625] relative z-20">
                           {/* Prices */}
                           <div className="flex items-center justify-between gap-3 mb-5">
                                <div className="flex-1 flex flex-col items-center p-2 rounded-xl bg-brand-surface dark:bg-white/5 border border-brand-primary/10">
                                    <span className="text-[10px] font-bold uppercase text-brand-primary dark:text-brand-electric">{event.priceLabel1}</span>
                                    <span className="text-base font-black text-brand-dark dark:text-white">R$ {event.priceValue1}</span>
                                </div>
                                <div className="flex-1 flex flex-col items-center p-2 rounded-xl bg-brand-surface dark:bg-white/5 border border-brand-primary/10">
                                    <span className="text-[10px] font-bold uppercase text-brand-primary dark:text-brand-electric">{event.priceLabel2}</span>
                                    <span className="text-base font-black text-brand-dark dark:text-white">R$ {event.priceValue2}</span>
                                </div>
                           </div>
                          
                          {/* Action Button */}
                          <button 
                                className="w-full py-3.5 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold rounded-xl transition-all duration-300 text-xs uppercase tracking-[0.1em] shadow-neon hover:shadow-neon-purple hover:scale-[1.02] flex items-center justify-center gap-2"
                            >
                                Entrar na Lista VIP
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                            </button>
                      </div>
                  </div>
                );
            })}
        </div>
        
        {StorageService.getEvents().length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-white dark:bg-white/5 rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
                <div className="w-20 h-20 bg-brand-surface dark:bg-white/10 rounded-full flex items-center justify-center mb-6 animate-pulse-slow">
                    <span className="text-4xl">📅</span>
                </div>
                <h3 className="text-xl font-bold text-brand-dark dark:text-white mb-2">Nenhum evento ativo</h3>
                <p className="text-gray-500 text-sm mb-6">Crie seu primeiro evento no painel administrativo.</p>
                <button onClick={() => navigate('/admin')} className="text-brand-primary font-bold hover:text-brand-neon transition-colors text-sm uppercase tracking-wide border-b-2 border-brand-primary">Acessar Painel Admin</button>
            </div>
        )}
      </div>
    );
  };

  return (
    <Layout toggleTheme={toggleTheme} isDark={isDark} onNavigate={navigate}>
       {renderPage()}
    </Layout>
  );
}

export default App;