import React, { useState, useEffect } from 'react';
import { EventData, Guest, GuestEntry } from '../types';
import { StorageService } from '../services/storage.ts';
import { FeedbackButton } from '../components/FeedbackButton';

interface PublicEventProps {
  eventId: string;
}

export const PublicEvent: React.FC<PublicEventProps> = ({ eventId }) => {
  const [event, setEvent] = useState<EventData | null>(null);
  const [guestsCount, setGuestsCount] = useState(0);
  const [allGuestsList, setAllGuestsList] = useState<GuestEntry[]>([]);
  
  // Form State - Default 3 names as requested
  const [entries, setEntries] = useState<Partial<GuestEntry>[]>([
      { name: '', gender: 'M' },
      { name: '', gender: 'M' },
      { name: '', gender: 'M' }
  ]);
  const [submitted, setSubmitted] = useState(false);
  const [showFullListModal, setShowFullListModal] = useState(false);
  const [listSearch, setListSearch] = useState('');

  useEffect(() => {
    const loadEvent = () => {
      const allEvents = StorageService.getEvents();
      const found = allEvents.find(e => e.id === eventId);
      if (found) {
        setEvent(found);
        const guests = StorageService.getGuests(eventId);
        const entriesList = guests.flatMap(g => g.entries).sort((a, b) => a.name.localeCompare(b.name));
        setAllGuestsList(entriesList);
        setGuestsCount(entriesList.length);
      }
    };
    loadEvent();
  }, [eventId]);

  const handleEntryChange = (index: number, field: keyof GuestEntry, value: any) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setEntries(newEntries);
  };

  const addEntryField = () => {
    if (entries.length < 10) { 
        setEntries([...entries, { name: '', gender: 'M' }]);
    }
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!event) return;
    
    const validEntries = entries.filter(n => n.name && n.name.trim().length > 0) as GuestEntry[];
    if (validEntries.length < 1) {
        alert("Preencha pelo menos um nome para entrar na lista.");
        throw new Error("Validation failed");
    }

    await new Promise(resolve => setTimeout(resolve, 800));

    const finalEntries: GuestEntry[] = validEntries.map(e => ({
        name: e.name, gender: e.gender, checkedIn: false
    }));

    const newGuest: Guest = {
        id: Date.now().toString(),
        eventId: event.id,
        entries: finalEntries,
        createdAt: new Date().toISOString(),
        isFake: false
    };
    StorageService.addGuest(newGuest);
    setSubmitted(true);
    setGuestsCount(prev => prev + finalEntries.length);
    setAllGuestsList(prev => [...prev, ...finalEntries].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleWhatsAppRedirect = () => {
      if (!event) return;
      const validEntries = entries.filter(n => n.name && n.name.trim().length > 0);
      const namesString = validEntries.map(e => `- ${e.name}`).join('\n');
      
      const config = StorageService.getConfig();
      const rawPhone = config.adminPhone || ''; 
      const cleanPhone = rawPhone.replace(/\D/g, ''); 
      
      let phrase = event.whatsappPhrase || 'Oi! Estou confirmando meus nomes para a lista VIP do evento {{eventName}}.\nSegue a lista:\n{{nomes}}\nAguardo confirmação 😊';
      
      phrase = phrase.replace(/\{\{eventName\}\}/g, event.name)
                     .replace(/\[NOME DA FESTA\]/g, event.name)
                     .replace(/\{eventName\}/g, event.name)
                     .replace(/\{\{nomes\}\}/g, namesString)
                     .replace(/\[nomes\]/g, namesString)
                     .replace(/\{nomes\}/g, namesString)
                     .replace(/\{\{names\}\}/g, namesString);

      const encodedMessage = encodeURIComponent(phrase);
      const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      
      const waUrl = cleanPhone.length > 8 
          ? `https://wa.me/${finalPhone}?text=${encodedMessage}` 
          : `https://wa.me/?text=${encodedMessage}`;
          
      window.open(waUrl, '_blank');
  };

  const getEventDateString = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      
      const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
      
      const weekday = days[date.getDay()];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${weekday} • ${day} de ${month} • ${hours}:${minutes}h`;
  };

  if (!event) return <div className="min-h-screen flex items-center justify-center text-brand-primary font-bold animate-pulse">Carregando...</div>;
  const progressPercent = Math.min(100, (guestsCount / event.capacity) * 100);

  return (
    <div className="animate-fade-in max-w-xl mx-auto space-y-8 pb-32">
        
        {/* 1. PREMIUM BANNER - Large & Immersive */}
        <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden bg-brand-surface dark:bg-brand-dark shadow-neon ring-1 ring-white/10 group">
            <div className="absolute inset-0 bg-cover bg-center blur-3xl opacity-40 scale-125 animate-pulse-slow" style={{ backgroundImage: `url(${event.photoUrl})` }}></div>
            <img 
                src={event.photoUrl} 
                className="relative z-10 w-full h-full object-contain transform transition-transform duration-700 hover:scale-[1.02]"
                alt={event.name}
            />
            {/* Gradient Bottom Fade */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/50 to-transparent z-20"></div>
        </div>

        {/* 2. HEADER INFO - Centered & Clean */}
        <div className="text-center px-4 relative z-10">
            <h1 className="text-4xl md:text-5xl font-black text-brand-dark dark:text-white leading-none mb-4 tracking-tight drop-shadow-lg">{event.name}</h1>
            
            <div className="inline-flex items-center gap-2 bg-white/50 dark:bg-white/5 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 shadow-sm mb-6">
                <span className="w-2 h-2 rounded-full bg-brand-neon animate-pulse"></span>
                <p className="text-lg font-bold text-brand-primary dark:text-brand-electric capitalize">
                    {getEventDateString(event.date)}
                </p>
            </div>

            {event.description && (
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed font-medium text-base md:text-lg max-w-md mx-auto opacity-90">
                    {event.description}
                </p>
            )}

            <div className="flex justify-center gap-4 mt-6">
                  <div className="flex flex-col bg-brand-pink/10 border border-brand-pink/20 px-5 py-2 rounded-xl min-w-[100px]">
                      <span className="text-[10px] font-bold uppercase text-brand-pink tracking-wider">{event.priceLabel1}</span>
                      <span className="text-xl font-black text-brand-pink">R$ {event.priceValue1}</span>
                  </div>
                  <div className="flex flex-col bg-brand-primary/10 border border-brand-primary/20 px-5 py-2 rounded-xl min-w-[100px]">
                      <span className="text-[10px] font-bold uppercase text-brand-primary dark:text-brand-electric tracking-wider">{event.priceLabel2}</span>
                      <span className="text-xl font-black text-brand-primary dark:text-brand-electric">R$ {event.priceValue2}</span>
                  </div>
            </div>
        </div>

        {/* 3. RULES - Attention Box */}
        {event.rules && (
            <div className="bg-accent-warning/10 border border-accent-warning/30 p-6 rounded-2xl mx-2 shadow-sm flex items-start gap-4 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-accent-warning/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                <span className="text-3xl shrink-0">⚠️</span>
                <div className="relative z-10">
                    <h3 className="text-sm font-black text-accent-warning uppercase tracking-widest mb-2">Regras do Evento</h3>
                    <p className="text-brand-dark dark:text-white text-sm whitespace-pre-line leading-relaxed font-medium opacity-90">
                        {event.rules}
                    </p>
                </div>
            </div>
        )}

        {/* 4. VIP FORM - Modern & Glassmorphic */}
        <div className="bg-white dark:bg-[#111625] rounded-3xl shadow-glass border border-gray-100 dark:border-white/10 overflow-hidden relative">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-neon via-brand-primary to-brand-pink"></div>
             
             {/* Header */}
             <div className="p-8 pb-4">
                 <h2 className="text-3xl font-black text-brand-dark dark:text-white mb-2">Lista VIP</h2>
                 <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 font-medium">Garanta seu desconto preenchendo abaixo.</p>
                 
                 <div className="flex justify-between text-[10px] font-bold text-brand-primary dark:text-brand-electric mb-2 uppercase tracking-widest">
                     <span>{guestsCount} confirmados</span>
                     <span>Restam {event.capacity - guestsCount}</span>
                 </div>
                 <div className="h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                     <div className="h-full bg-gradient-to-r from-brand-primary to-brand-neon rounded-full transition-all duration-1000 shadow-neon" style={{ width: `${progressPercent}%` }}></div>
                 </div>
             </div>

             <div className="p-8 pt-2">
                {!submitted ? (
                    <form className="space-y-5">
                        <div className="space-y-4">
                            {entries.map((entry, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row gap-3">
                                    <input 
                                        type="text" 
                                        placeholder={`Nome ${idx + 1}`}
                                        value={entry.name}
                                        onChange={(e) => handleEntryChange(idx, 'name', e.target.value)}
                                        className="flex-grow h-12 px-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm font-semibold text-brand-dark dark:text-white focus:border-brand-primary focus:bg-white dark:focus:bg-brand-darker focus:ring-1 focus:ring-brand-primary outline-none transition-all placeholder:text-gray-400"
                                    />
                                    <div className="flex bg-gray-50 dark:bg-white/5 rounded-xl p-1 h-12 border border-gray-200 dark:border-white/10 shrink-0 gap-1 w-full sm:w-auto">
                                        <button 
                                            type="button" 
                                            onClick={() => handleEntryChange(idx, 'gender', 'M')} 
                                            className={`flex-1 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 ${entry.gender === 'M' ? 'bg-brand-primary text-white shadow-md' : 'text-gray-400 border border-transparent hover:border-gray-300 dark:hover:border-white/20'}`}
                                        >
                                            <span className="text-base leading-none">♂</span> Homem
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => handleEntryChange(idx, 'gender', 'F')} 
                                            className={`flex-1 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 ${entry.gender === 'F' ? 'bg-brand-primary text-white shadow-md' : 'text-gray-400 border border-transparent hover:border-gray-300 dark:hover:border-white/20'}`}
                                        >
                                            <span className="text-base leading-none">♀</span> Mulher
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="flex justify-between items-center px-1">
                             <button type="button" onClick={addEntryField} className="text-xs font-bold text-brand-primary hover:text-brand-secondary flex items-center gap-1 disabled:opacity-50 transition-colors uppercase tracking-wide">
                                 <span className="text-lg leading-none">+</span> Adicionar nome
                             </button>
                             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{entries.length} nomes</span>
                        </div>

                        <FeedbackButton 
                            onClick={handleSubmit} 
                            disabled={guestsCount >= event.capacity} 
                            successText="Sucesso!"
                            className="w-full h-14 rounded-xl text-sm font-black shadow-neon uppercase tracking-[0.1em] mt-6"
                        >
                            {guestsCount >= event.capacity ? 'Lista Esgotada' : 'Confirmar Lista VIP'}
                        </FeedbackButton>
                        
                        {/* MOVED: Reserve Table Button - Now immediately below VIP Button */}
                        {event.tableLink && (
                             <a href={event.tableLink} target="_blank" className="block w-full h-14 bg-accent-warning hover:bg-[#E6B800] text-brand-darker font-black text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 uppercase tracking-wide transform active:scale-95 transition-all mt-4">
                                <span className="text-xl">🥂</span> Reservar Mesa
                            </a>
                        )}
                    </form>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-20 h-20 bg-accent-whatsapp/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-slide-up">
                            <span className="text-4xl">🎉</span>
                        </div>
                        <h3 className="text-2xl font-black text-brand-dark dark:text-white mb-2">Nomes Enviados!</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium text-sm leading-relaxed max-w-xs mx-auto">
                            Clique abaixo para finalizar sua confirmação enviando a lista no WhatsApp.
                        </p>
                        <button onClick={handleWhatsAppRedirect} className="w-full h-16 bg-[#25D366] hover:bg-[#1db954] text-white font-bold rounded-xl text-lg shadow-lg shadow-green-500/30 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 active:scale-[0.98]">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-8.683-2.031-.967-.272-.297-.471-.446-.966-.446-.495 0-.865.198-1.312.693-.446.495-1.708 1.668-1.708 4.071 0 2.403 1.758 4.723 2.006 5.045.247.322 3.46 5.28 8.385 7.408 2.922 1.264 4.062 1.015 4.78.941.718-.074 2.278-.931 2.599-1.831.321-.9.321-1.671.223-1.832z"/></svg>
                            Confirmar no WhatsApp
                        </button>
                        <button onClick={() => {setSubmitted(false); setEntries([{name: '', gender: 'M'}, {name: '', gender: 'M'}, {name: '', gender: 'M'}])}} className="mt-8 text-brand-primary font-bold hover:underline text-xs uppercase tracking-wide">Cadastrar mais nomes</button>
                    </div>
                )}
             </div>
        </div>

        {/* 5. LOCATION (COLORFUL MAP) */}
        {event.address && (
             <div className="bg-white dark:bg-[#111625] rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-white/10">
                 <div className="p-6 flex items-center gap-4 border-b border-gray-50 dark:border-white/5">
                    <div className="w-10 h-10 bg-brand-surface dark:bg-white/10 rounded-xl flex items-center justify-center text-xl shrink-0">📍</div>
                    <div className="flex-grow">
                        <h3 className="font-bold text-sm text-brand-dark dark:text-white mb-0.5 uppercase tracking-wide">Localização</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                            {event.address}
                        </p>
                    </div>
                 </div>
                 <div className="w-full h-[300px] bg-gray-100 relative">
                     <iframe 
                        width="100%" 
                        height="100%" 
                        frameBorder="0" 
                        scrolling="no" 
                        marginHeight={0} 
                        marginWidth={0} 
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(event.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                        className="transition-all duration-500"
                        style={{ filter: 'none' }} // Ensuring colorful map
                     ></iframe>
                     <a href={`https://maps.google.com/?q=${encodeURIComponent(event.address)}`} target="_blank" className="absolute bottom-4 right-4 bg-white text-brand-dark font-bold text-xs px-4 py-2 rounded-lg shadow-lg hover:bg-gray-50 z-10">
                        Abrir GPS ↗
                     </a>
                 </div>
             </div>
        )}

        {/* 6. CONFIRMED LIST - Ordered after Map, Status Badges Removed */}
        {event.showListPublicly && (
            <div className="bg-white dark:bg-[#111625] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-white/10">
                <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-50 dark:border-white/5">
                    <h3 className="font-bold text-lg text-brand-dark dark:text-white">Confirmados</h3>
                    <span className="bg-green-500/10 text-green-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-green-500/20">Total: {guestsCount}</span>
                </div>
                <div className="space-y-3">
                    {/* Show 5 items, sorted alphabetically, removed status badges */}
                    {allGuestsList.slice(0, 5).map((g, i) => (
                        <div key={i} className="flex items-center gap-4 px-2 py-1">
                             <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-xs font-black text-brand-primary border border-brand-primary/20">
                                {g.name.charAt(0).toUpperCase()}
                             </div>
                             <span className="text-brand-dark dark:text-gray-200 font-bold truncate flex-grow text-sm">{g.name}</span>
                        </div>
                    ))}
                </div>
                {allGuestsList.length > 5 && (
                    <button onClick={() => setShowFullListModal(true)} className="w-full mt-6 py-4 text-brand-dark dark:text-white font-bold text-xs uppercase tracking-widest bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl transition-colors border border-gray-200 dark:border-white/5">
                        Ver todos (+{allGuestsList.length - 5})
                    </button>
                )}
                {allGuestsList.length === 0 && <p className="text-gray-400 text-center text-sm py-4 italic">A lista ainda está vazia.</p>}
            </div>
        )}

        {/* FULL LIST MODAL - Status Badges Removed */}
        {showFullListModal && (
            <div className="fixed inset-0 z-50 bg-brand-darker/90 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6 animate-fade-in">
                <div className="bg-white dark:bg-[#111625] w-full max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl animate-slide-up border border-gray-200 dark:border-white/10">
                    <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-[#111625] sticky top-0 rounded-t-3xl z-10">
                        <h3 className="font-bold text-xl text-brand-dark dark:text-white">Lista Completa</h3>
                        <button onClick={() => setShowFullListModal(false)} className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-white/5 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10">✕</button>
                    </div>
                    <div className="p-4 bg-brand-surface dark:bg-black/20">
                        <input 
                            type="text" 
                            placeholder="Buscar nome..." 
                            className="w-full h-12 px-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-brand-primary dark:text-white outline-none shadow-sm text-sm"
                            onChange={e => setListSearch(e.target.value.toLowerCase())}
                        />
                    </div>
                    <div className="overflow-y-auto p-4 space-y-1 flex-grow scrollbar-thin scrollbar-thumb-brand-primary/20">
                        {allGuestsList.filter(g => g.name.toLowerCase().includes(listSearch)).map((g, i) => (
                            <div key={i} className="flex justify-between items-center p-3 rounded-xl hover:bg-brand-surface dark:hover:bg-white/5 border border-transparent hover:border-brand-primary/10 transition-all">
                                <span className="text-gray-700 dark:text-gray-200 font-semibold text-sm">{g.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};