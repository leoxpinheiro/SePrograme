import React, { useState, useEffect } from 'react';
import { EventData, Guest, GuestEntry, AppConfig } from '../types';
import { StorageService } from '../services/storage.ts';
import { ImageUpload } from '../components/ImageUpload';
import { FeedbackButton } from '../components/FeedbackButton';

export const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [events, setEvents] = useState<EventData[]>([]);
  
  // Views
  const [view, setView] = useState<'EVENTS' | 'BILHETERIA' | 'CREATE' | 'CONFIG'>('EVENTS');
  const [activeTab, setActiveTab] = useState<'DETALHES' | 'MIDIA' | 'PRECOS' | 'FAKE'>('DETALHES');
  const [formData, setFormData] = useState<Partial<EventData>>({});
  
  // Bilheteria
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [bilheteriaFilter, setBilheteriaFilter] = useState<'ALL' | 'PRESENT' | 'MISSING'>('ALL');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [recentCheckIns, setRecentCheckIns] = useState<{name: string, time: string}[]>([]);
  
  // Print View Logic
  const [showPrintModal, setShowPrintModal] = useState(false);
  
  // Fake Names
  const [fakeNamesInput, setFakeNamesInput] = useState('');
  
  const [configData, setConfigData] = useState<AppConfig>(StorageService.getConfig());

  useEffect(() => {
    setIsAuthenticated(StorageService.isAuthenticated());
    if (StorageService.isAuthenticated()) refreshData();
  }, []);

  const refreshData = () => {
    setEvents(StorageService.getEvents()); 
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (StorageService.login(password)) {
      setIsAuthenticated(true);
      refreshData();
      setConfigData(StorageService.getConfig());
    } else alert("Senha incorreta.");
  };

  // --- CRUD ---
  const resetAndCreate = () => {
    const currentConfig = StorageService.getConfig();
    setFormData({
      name: '', 
      description: '', 
      photoUrl: '', 
      imagePosition: 50,
      date: new Date().toISOString().slice(0, 16),
      attractions: '',
      priceLabel1: 'Mulher', priceValue1: '0,00',
      priceLabel2: 'Homem', priceValue2: '50,00',
      rules: '- Chegar até 00h\n- Proibido entrada de menores',
      capacity: 200, address: '', tableLink: '', active: true,
      whatsappPhrase: currentConfig.defaultWhatsappPhrase || 'Oi! Estou confirmando meus nomes para a lista VIP do evento {{eventName}}.\nSegue a lista:\n{{nomes}}\nAguardo confirmação 😊',
      id: Date.now().toString()
    });
    setView('CREATE');
    setActiveTab('DETALHES');
  };

  const handleSaveEvent = async () => {
    if (!formData.name) {
         alert("Nome do evento é obrigatório");
         return;
    }
    await new Promise(r => setTimeout(r, 600));
    StorageService.saveEvent({ ...formData, id: formData.id || Date.now().toString() } as EventData);
    refreshData();
    setView('EVENTS');
  };

  const handleSaveConfig = async () => {
      await new Promise(r => setTimeout(r, 600));
      StorageService.saveConfig(configData);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este evento?")) {
      StorageService.deleteEvent(id);
      refreshData();
    }
  };

  const copyEventLink = async (id: string) => {
      const url = `${window.location.origin}${window.location.pathname}#/event/${id}`;
      await navigator.clipboard.writeText(url);
  };

  // --- Bilheteria ---
  const handleCheckIn = async (guestId: string, entryIndex: number, currentStatus: boolean) => {
    await new Promise(r => setTimeout(r, 200));

    const guests = StorageService.getGuests(selectedEventId);
    const guest = guests.find(g => g.id === guestId);
    if (guest) {
        guest.entries[entryIndex].checkedIn = !currentStatus;
        guest.entries[entryIndex].checkInTime = !currentStatus ? Date.now() : undefined;
        StorageService.updateGuest(guest);
        
        if (!currentStatus) {
            const time = new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
            setRecentCheckIns(prev => [{name: guest.entries[entryIndex].name, time}, ...prev].slice(0, 3));
        }

        setRefreshTrigger(p => p + 1);
    }
  };

  const getFilteredGuests = () => {
      if (!selectedEventId) return [];
      const guests = StorageService.getGuests(selectedEventId);
      const flatList = guests.flatMap(g => g.entries.map((e, idx) => ({ ...e, guestId: g.id, entryIndex: idx, isFake: g.isFake })));
      
      const normalizedSearch = searchTerm.toLowerCase();
      
      return flatList.filter(e => {
          const matchName = e.name.toLowerCase().includes(normalizedSearch);
          if (bilheteriaFilter === 'PRESENT') return matchName && e.checkedIn;
          if (bilheteriaFilter === 'MISSING') return matchName && !e.checkedIn;
          return matchName;
      }).sort((a, b) => a.name.localeCompare(b.name));
  };
  
  const stats = (() => {
      if (!selectedEventId) return { total: 0, checkedIn: 0, missing: 0 };
      const guests = StorageService.getGuests(selectedEventId).flatMap(g => g.entries);
      const checkedIn = guests.filter(g => g.checkedIn).length;
      return { total: guests.length, checkedIn, missing: guests.length - checkedIn };
  })();

  const getTimeAgo = (ts?: number) => {
      if (!ts) return '';
      const diff = Math.floor((Date.now() - ts) / 60000);
      if (diff < 1) return 'agora';
      if (diff < 60) return `${diff}m`;
      return `${Math.floor(diff/60)}h`;
  };

  const handleAddFakes = async () => {
      const names = fakeNamesInput.split('\n').filter(n => n.trim());
      if (names.length === 0) return;
      await new Promise(r => setTimeout(r, 500));
      StorageService.addGuest({
          id: Date.now().toString(), eventId: formData.id!, entries: names.map(n => ({ name: n, gender: 'M', checkedIn: false })),
          createdAt: new Date().toISOString(), isFake: true
      });
      setFakeNamesInput('');
  };

  const openPrintModal = (evtId: string) => {
      setSelectedEventId(evtId);
      setShowPrintModal(true);
  };
  
  const handlePrint = () => {
      window.print();
  };

  if (!isAuthenticated) return (
      <div className="flex justify-center items-center min-h-[80vh]">
          <form onSubmit={handleLogin} className="bg-white dark:bg-[#111625] p-10 rounded-3xl shadow-glass border border-white/10 max-w-sm w-full text-center">
              <div className="w-14 h-14 bg-brand-primary rounded-xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6 shadow-neon">S</div>
              <h2 className="text-xl font-bold text-brand-dark dark:text-white mb-6">Acesso Administrativo</h2>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full h-[50px] px-4 border border-gray-200 dark:border-white/10 rounded-xl mb-4 outline-none focus:border-brand-primary bg-gray-50 dark:bg-black/20 dark:text-white" placeholder="Digite sua senha" />
              <button className="w-full h-[50px] bg-brand-primary text-white font-bold rounded-xl shadow-neon hover:bg-brand-secondary transition-colors">Entrar</button>
          </form>
      </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-[80vh]">
      {/* SIDEBAR */}
      <div className="lg:col-span-1 print:hidden">
        <div className="sticky top-28 rounded-2xl p-6 bg-white border-gray-100 shadow-float border dark:bg-[#111625] dark:border-white/5">
            <div className="flex items-center gap-3 mb-8 px-2">
                <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-neon">S</div>
                <span className="font-bold text-lg text-brand-dark dark:text-white">Se Programe</span>
            </div>
            
            <div className="space-y-2">
                <button onClick={() => setView('EVENTS')} className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-3 ${view === 'EVENTS' ? 'bg-brand-primary/10 text-brand-primary dark:bg-white/10 dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                    <span>📅</span> Meus Eventos
                </button>
                <button onClick={() => setView('BILHETERIA')} className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-3 ${view === 'BILHETERIA' ? 'bg-green-500/10 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                    <span>🎟️</span> Bilheteria
                </button>
                <button onClick={() => setView('CONFIG')} className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-3 ${view === 'CONFIG' ? 'bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-200' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                    <span>⚙️</span> Configurações
                </button>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5">
                 <button onClick={() => {StorageService.logout(); setIsAuthenticated(false)}} className="w-full text-left px-4 py-2 text-accent-error font-bold text-xs hover:underline">Sair do Painel</button>
            </div>
        </div>
      </div>

      <div className="lg:col-span-3 print:w-full print:col-span-4">
          <div className="max-w-[900px] print:max-w-none">
              
              {/* EVENTS LIST */}
              {view === 'EVENTS' && (
                  <div className="space-y-6">
                      <div className="flex justify-between items-center">
                          <h2 className="text-2xl font-bold text-brand-dark dark:text-white">Gerenciar Eventos</h2>
                          <button onClick={resetAndCreate} className="h-[46px] px-6 bg-brand-primary hover:bg-brand-secondary text-white rounded-xl font-bold text-sm shadow-neon transition-all">+ Novo Evento</button>
                      </div>
                      
                      <div className="grid gap-4">
                          {events.map(ev => (
                              <div key={ev.id} className="bg-white dark:bg-[#111625] p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 flex flex-col sm:flex-row gap-6 items-start sm:items-center hover:shadow-float transition-all duration-300 relative group">
                                  <div className="w-16 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative ring-1 ring-black/5">
                                      {ev.photoUrl && <img src={ev.photoUrl} className="w-full h-full object-cover" />}
                                  </div>
                                  <div className="flex-grow">
                                      <h3 className="font-bold text-base text-brand-dark dark:text-white mb-1">{ev.name}</h3>
                                      <p className="text-xs text-gray-500 font-medium">{new Date(ev.date).toLocaleDateString()} • {ev.capacity} vagas</p>
                                  </div>
                                  
                                  {/* PRODUCER ACTIONS - Updated Secondary Buttons */}
                                  <div className="flex flex-wrap gap-2">
                                      <div className="flex flex-col gap-2">
                                          <FeedbackButton 
                                              onClick={() => copyEventLink(ev.id)} 
                                              variant="secondary"
                                              className="px-3 py-1.5 text-[10px] rounded-lg font-bold h-7 w-32 justify-start"
                                              successText="Copiado!"
                                          >
                                              🔗 Copiar Link
                                          </FeedbackButton>
                                          <button 
                                              onClick={() => openPrintModal(ev.id)} 
                                              className="px-3 py-1.5 bg-white border border-gray-200 text-brand-dark font-bold text-[10px] rounded-lg hover:bg-gray-50 dark:bg-white/5 dark:border-white/10 dark:text-white dark:hover:bg-white/10 h-7 w-32 text-left"
                                          >
                                              🖨️ Ver Lista
                                          </button>
                                      </div>
                                      
                                      <div className="w-px bg-gray-100 h-10 mx-2 self-center hidden sm:block"></div>

                                      <div className="flex flex-col gap-2">
                                        <button onClick={() => { setFormData(ev); setView('CREATE'); }} className="px-3 py-1.5 bg-brand-surface text-brand-primary font-bold text-xs rounded-lg hover:bg-brand-primary/20 dark:bg-white/10 dark:text-white h-7">Editar</button>
                                        <button onClick={() => { setSelectedEventId(ev.id); setView('BILHETERIA'); }} className="px-3 py-1.5 bg-green-500/10 text-green-600 font-bold text-xs rounded-lg hover:bg-green-500/20 dark:text-green-400 h-7">Bilheteria</button>
                                      </div>
                                      <div className="flex items-center">
                                         <FeedbackButton onClick={async () => handleDelete(ev.id)} variant="danger" className="w-8 h-8 rounded-lg p-0" successText="X">🗑️</FeedbackButton>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* BILHETERIA PREMIUM */}
              {view === 'BILHETERIA' && (
                  <div className="rounded-3xl shadow-glass h-[85vh] flex flex-col overflow-hidden border border-gray-200 dark:border-white/10 bg-white dark:bg-[#111625]">
                      
                      {/* HEADER */}
                      <div className="p-4 border-b border-gray-100 bg-brand-surface dark:bg-[#0C0E12] dark:border-white/5 space-y-3">
                          
                          <div className="flex flex-col md:flex-row justify-between gap-3">
                              <select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)} className="h-[40px] px-3 rounded-xl font-bold text-sm min-w-[200px] border border-gray-200 bg-white text-gray-900 focus:border-brand-primary dark:bg-white/5 dark:text-white dark:border-white/10 outline-none">
                                  <option value="">Selecione o Evento...</option>
                                  {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                              </select>

                              {/* Stats Pills */}
                              <div className="flex gap-2 text-xs font-bold items-center overflow-x-auto pb-1">
                                  <div className="px-3 py-1.5 bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 shadow-sm whitespace-nowrap">
                                      <span className="text-gray-400 uppercase text-[9px]">Total </span>
                                      <span className="text-base text-brand-dark dark:text-white ml-1">{stats.total}</span>
                                  </div>
                                  <div className="px-3 py-1.5 bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 shadow-sm whitespace-nowrap">
                                      <span className="text-green-500 uppercase text-[9px]">Presentes </span>
                                      <span className="text-base text-green-600 ml-1">{stats.checkedIn}</span>
                                  </div>
                                  <div className="px-3 py-1.5 bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 shadow-sm whitespace-nowrap">
                                      <span className="text-brand-primary uppercase text-[9px]">Chegada </span>
                                      <span className="text-base text-brand-primary ml-1">{stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0}%</span>
                                  </div>
                              </div>
                          </div>

                          {/* Search & Tabs */}
                          <div className="flex gap-2">
                              <input type="text" placeholder="Buscar nome..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-grow h-[42px] px-4 rounded-xl text-sm border bg-white border-gray-200 text-gray-900 focus:border-brand-primary dark:bg-white/5 dark:border-white/10 dark:text-white outline-none" />
                          </div>

                          <div className="flex p-1 bg-gray-200 dark:bg-white/5 rounded-xl gap-1">
                              <button onClick={() => setBilheteriaFilter('ALL')} className={`flex-1 py-2 rounded-lg text-[10px] font-black tracking-wider transition-all uppercase ${bilheteriaFilter === 'ALL' ? 'bg-white text-brand-primary shadow-sm dark:bg-brand-primary dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>Todos</button>
                              <button onClick={() => setBilheteriaFilter('PRESENT')} className={`flex-1 py-2 rounded-lg text-[10px] font-black tracking-wider transition-all uppercase ${bilheteriaFilter === 'PRESENT' ? 'bg-white text-green-600 shadow-sm dark:bg-green-600 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>Presentes</button>
                              <button onClick={() => setBilheteriaFilter('MISSING')} className={`flex-1 py-2 rounded-lg text-[10px] font-black tracking-wider transition-all uppercase ${bilheteriaFilter === 'MISSING' ? 'bg-white text-red-500 shadow-sm dark:bg-red-500 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}>Faltam</button>
                          </div>
                      </div>
                      
                      {/* Recent Check-ins Block */}
                      {recentCheckIns.length > 0 && (
                          <div className="bg-green-500/10 px-4 py-2 border-b border-green-500/20 flex gap-3 overflow-x-auto items-center">
                              <span className="text-[9px] font-black text-green-700 dark:text-green-400 uppercase tracking-widest shrink-0">Últimos:</span>
                              {recentCheckIns.map((r, i) => (
                                  <div key={i} className="flex items-center gap-1.5 bg-white dark:bg-white/10 px-2 py-1 rounded-md shadow-sm border border-green-500/10">
                                      <span className="text-[10px] font-bold text-gray-800 dark:text-white">{r.name}</span>
                                      <span className="text-[9px] text-gray-400 font-mono">{r.time}</span>
                                  </div>
                              ))}
                          </div>
                      )}

                      {/* List Compact */}
                      <div className="flex-grow overflow-y-auto p-2 space-y-1.5 bg-gray-50 dark:bg-[#06070A]">
                          {getFilteredGuests().map((item, i) => (
                              <div key={i} className={`flex justify-between items-center px-4 py-3 rounded-xl border shadow-sm transition-all ${item.checkedIn ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-500/20' : 'bg-white border-gray-100 dark:bg-white/5 dark:border-white/5'}`}>
                                  <div className="min-w-0 pr-3">
                                      <div className={`font-bold text-sm truncate ${item.checkedIn ? 'text-green-700 dark:text-green-400' : 'text-brand-dark dark:text-white'}`}>{item.name}</div>
                                      <div className="flex gap-2 text-[9px] font-bold uppercase tracking-wider opacity-60 text-gray-500 dark:text-gray-400 mt-0.5">
                                          <span className="bg-gray-100 dark:bg-white/10 px-1.5 rounded">{item.gender === 'M' ? 'Masc' : 'Fem'}</span>
                                          {item.checkedIn && item.checkInTime && <span>• {new Date(item.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                                      </div>
                                  </div>
                                  
                                  <FeedbackButton 
                                      onClick={() => handleCheckIn(item.guestId, item.entryIndex, item.checkedIn)} 
                                      variant={item.checkedIn ? 'danger' : 'success'}
                                      className={`h-8 px-4 rounded-lg font-bold text-[10px] shadow-sm uppercase tracking-wide min-w-[90px]`}
                                      successText="OK"
                                  >
                                      {item.checkedIn ? 'Desmarcar' : 'Confirmar'}
                                  </FeedbackButton>
                              </div>
                          ))}
                          {getFilteredGuests().length === 0 && (
                              <div className="text-center py-10 opacity-40 text-gray-500 dark:text-gray-400 text-sm">Nenhum nome encontrado</div>
                          )}
                      </div>
                  </div>
              )}

              {/* CREATE / EDIT */}
              {view === 'CREATE' && (
                  <div className="bg-white dark:bg-[#111625] rounded-3xl shadow-glass border border-gray-100 dark:border-white/10 p-8">
                      <div className="flex gap-2 overflow-x-auto border-b border-gray-100 dark:border-white/5 mb-6 pb-2">
                          {['DETALHES', 'MIDIA', 'PRECOS', 'FAKE'].map(t => (
                              <button key={t} onClick={() => setActiveTab(t as any)} className={`px-4 py-2 font-bold text-xs rounded-lg transition-colors ${activeTab === t ? 'bg-brand-primary/10 text-brand-primary dark:bg-white/10 dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>{t}</button>
                          ))}
                      </div>
                      
                      {activeTab === 'DETALHES' && (
                          <div className="space-y-5">
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nome do Evento</label>
                                  <input className="w-full h-[46px] px-4 border border-gray-200 rounded-xl font-medium focus:border-brand-primary outline-none text-sm dark:bg-black/20 dark:border-white/10 dark:text-white" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Pagode do Domingo" />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Data e Hora</label>
                                      <input type="datetime-local" className="w-full h-[46px] px-4 border border-gray-200 rounded-xl font-medium text-sm dark:bg-black/20 dark:border-white/10 dark:text-white" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Capacidade da Lista</label>
                                      <input type="number" className="w-full h-[46px] px-4 border border-gray-200 rounded-xl font-medium text-sm dark:bg-black/20 dark:border-white/10 dark:text-white" value={formData.capacity || 200} onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})} />
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Descrição Completa</label>
                                  <textarea className="w-full p-4 border border-gray-200 rounded-xl font-medium h-24 focus:border-brand-primary outline-none text-sm dark:bg-black/20 dark:border-white/10 dark:text-white" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Detalhes do evento..." />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-brand-primary uppercase mb-2">Mensagem do WhatsApp (Use &#123;&#123;nomes&#125;&#125; e &#123;&#123;eventName&#125;&#125;)</label>
                                  <textarea className="w-full p-4 border border-brand-primary/20 rounded-xl font-medium h-24 focus:border-brand-primary outline-none text-sm bg-brand-surface dark:bg-black/20 dark:border-white/10 dark:text-white" value={formData.whatsappPhrase || ''} onChange={e => setFormData({...formData, whatsappPhrase: e.target.value})} placeholder="Ex: Quero confirmar: {{nomes}}" />
                                  <p className="text-xs text-gray-500 mt-1">Este modelo será usado apenas para este evento.</p>
                              </div>
                          </div>
                      )}

                      {activeTab === 'MIDIA' && (
                          <div className="space-y-6">
                              <ImageUpload label="Banner Vertical (4:5)" value={formData.photoUrl || ''} onChange={v => setFormData({...formData, photoUrl: v})} />
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Posição da Imagem (Foco Vertical)</label>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-400">Topo</span>
                                    <input type="range" min="0" max="100" value={formData.imagePosition || 50} onChange={e => setFormData({...formData, imagePosition: parseInt(e.target.value)})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                                    <span className="text-[10px] text-gray-400">Base</span>
                                  </div>
                                  <p className="text-[10px] text-gray-400 mt-1">Ajuste para centralizar o rosto ou parte importante da foto.</p>
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Link Reserva de Mesa</label>
                                  <input className="w-full h-[46px] px-4 border border-gray-200 rounded-xl font-medium text-sm dark:bg-black/20 dark:border-white/10 dark:text-white" placeholder="https://..." value={formData.tableLink || ''} onChange={e => setFormData({...formData, tableLink: e.target.value})} />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Endereço / Link Maps</label>
                                  <input className="w-full h-[46px] px-4 border border-gray-200 rounded-xl font-medium text-sm dark:bg-black/20 dark:border-white/10 dark:text-white" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Ex: Av. Paulista, 1000 - São Paulo" />
                              </div>
                          </div>
                      )}

                      {activeTab === 'PRECOS' && (
                          <div className="space-y-6">
                              <div className="bg-brand-surface p-5 rounded-2xl border border-brand-primary/10 dark:bg-black/20 dark:border-white/5">
                                  <h4 className="font-bold text-brand-dark dark:text-white mb-3 text-sm">Valores da Lista VIP</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                          <label className="text-xs font-bold text-gray-400">Categoria 1</label>
                                          <div className="flex gap-2">
                                              <input className="h-[40px] px-3 w-1/2 rounded-lg border border-gray-200 text-sm dark:bg-[#111625] dark:border-white/10 dark:text-white" placeholder="Rótulo (Ex: Mulher)" value={formData.priceLabel1 || ''} onChange={e => setFormData({...formData, priceLabel1: e.target.value})} />
                                              <input className="h-[40px] px-3 w-1/2 rounded-lg border border-gray-200 text-sm dark:bg-[#111625] dark:border-white/10 dark:text-white" placeholder="Valor" value={formData.priceValue1 || ''} onChange={e => setFormData({...formData, priceValue1: e.target.value})} />
                                          </div>
                                      </div>
                                      <div className="space-y-2">
                                          <label className="text-xs font-bold text-gray-400">Categoria 2</label>
                                          <div className="flex gap-2">
                                              <input className="h-[40px] px-3 w-1/2 rounded-lg border border-gray-200 text-sm dark:bg-[#111625] dark:border-white/10 dark:text-white" placeholder="Rótulo (Ex: Homem)" value={formData.priceLabel2 || ''} onChange={e => setFormData({...formData, priceLabel2: e.target.value})} />
                                              <input className="h-[40px] px-3 w-1/2 rounded-lg border border-gray-200 text-sm dark:bg-[#111625] dark:border-white/10 dark:text-white" placeholder="Valor" value={formData.priceValue2 || ''} onChange={e => setFormData({...formData, priceValue2: e.target.value})} />
                                          </div>
                                      </div>
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Regras (Card Amarelo)</label>
                                  <textarea className="w-full p-4 border border-gray-200 rounded-xl font-medium h-24 text-sm dark:bg-black/20 dark:border-white/10 dark:text-white" value={formData.rules || ''} onChange={e => setFormData({...formData, rules: e.target.value})} placeholder="- Proibido entrada de menores..." />
                              </div>
                              <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5">
                                  <input type="checkbox" className="w-4 h-4 text-brand-primary rounded focus:ring-brand-primary" checked={!!formData.showListPublicly} onChange={e => setFormData({...formData, showListPublicly: e.target.checked})} />
                                  <span className="font-bold text-gray-700 text-sm dark:text-gray-300">Mostrar nomes confirmados na página pública</span>
                              </label>
                          </div>
                      )}

                      {activeTab === 'FAKE' && (
                          <div className="space-y-4">
                               <div className="bg-yellow-500/10 text-yellow-700 p-4 rounded-xl text-xs font-medium dark:text-yellow-400 border border-yellow-500/20">
                                   Cole os nomes abaixo, um por linha. Eles aparecerão como confirmados.
                               </div>
                               <textarea className="w-full p-4 border border-gray-200 rounded-xl font-medium h-32 text-sm dark:bg-black/20 dark:border-white/10 dark:text-white" placeholder="Nome Sobrenome&#10;Nome Sobrenome" value={fakeNamesInput} onChange={e => setFakeNamesInput(e.target.value)} />
                               <FeedbackButton onClick={handleAddFakes} className="w-full h-[46px] rounded-xl text-sm" successText="Adicionados!">Adicionar Nomes</FeedbackButton>
                          </div>
                      )}

                      <div className="mt-8 flex gap-4 pt-6 border-t border-gray-100 dark:border-white/5">
                          <button onClick={() => setView('EVENTS')} className="h-[50px] px-6 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 text-sm dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/5">Cancelar</button>
                          <FeedbackButton onClick={handleSaveEvent} className="h-[50px] flex-grow rounded-xl text-sm shadow-neon" successText="Evento Salvo!">Salvar Alterações</FeedbackButton>
                      </div>
                  </div>
              )}

              {/* CONFIG */}
              {view === 'CONFIG' && (
                  <div className="bg-white dark:bg-[#111625] p-8 rounded-3xl shadow-glass border border-gray-100 dark:border-white/10 space-y-6">
                      <h3 className="font-bold text-xl text-brand-dark dark:text-white mb-4">Configurações Gerais</h3>
                      
                      <div>
                          <label className="block text-xs font-bold text-brand-primary uppercase mb-2">Senha do Painel (opcional)</label>
                          <div className="relative">
                            <input 
                                className="w-full h-[50px] px-4 border border-gray-200 rounded-xl text-sm dark:bg-black/20 dark:border-white/10 dark:text-white bg-gray-50" 
                                type="password" 
                                value={configData.adminPassword || ''} 
                                onChange={e => setConfigData({...configData, adminPassword: e.target.value})} 
                                placeholder="********"
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-2 font-medium">Use para restringir o acesso ao painel administrativo.</p>
                      </div>
                      
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">WhatsApp do Admin</label>
                          <input className="w-full h-[50px] px-4 border border-gray-200 rounded-xl text-sm dark:bg-black/20 dark:border-white/10 dark:text-white" placeholder="5511999999999" value={configData.adminPhone || ''} onChange={e => setConfigData({...configData, adminPhone: e.target.value})} />
                      </div>
                      
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Modelo Padrão de WhatsApp</label>
                          <textarea className="w-full p-4 border border-gray-200 rounded-xl font-medium h-32 focus:border-brand-primary outline-none text-sm dark:bg-black/20 dark:border-white/10 dark:text-white" value={configData.defaultWhatsappPhrase || ''} onChange={e => setConfigData({...configData, defaultWhatsappPhrase: e.target.value})} placeholder="Use {{nomes}} e {{eventName}}" />
                          <p className="text-xs text-gray-400 mt-2">Este modelo será carregado automaticamente ao criar novos eventos.</p>
                      </div>
                      
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Frases do Letreiro Animado (separadas por vírgula)</label>
                          <textarea className="w-full p-4 border border-gray-200 rounded-xl font-medium h-32 focus:border-brand-primary outline-none text-sm dark:bg-black/20 dark:border-white/10 dark:text-white" value={configData.marqueeText || ''} onChange={e => setConfigData({...configData, marqueeText: e.target.value})} placeholder="Ex: Lista VIP, Open Bar, Melhores Eventos" />
                      </div>

                      <div className="h-px bg-gray-100 dark:bg-white/5 my-4"></div>
                      
                      <ImageUpload label="Logo do Topo (Remova para usar Texto Padrão)" value={configData.logoUrl || ''} onChange={v => setConfigData({...configData, logoUrl: v})} />
                      <ImageUpload label="Banner da Home" value={configData.heroImageUrl || ''} onChange={v => setConfigData({...configData, heroImageUrl: v})} />
                      
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Posição do Banner Home (Foco Vertical)</label>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] text-gray-400">Topo</span>
                             <input type="range" min="0" max="100" value={configData.heroVerticalPosition || 50} onChange={e => setConfigData({...configData, heroVerticalPosition: parseInt(e.target.value)})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                             <span className="text-[10px] text-gray-400">Base</span>
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Título Home</label>
                              <input className="w-full h-[50px] px-4 border border-gray-200 rounded-xl text-sm dark:bg-black/20 dark:border-white/10 dark:text-white" value={configData.heroTitle || ''} onChange={e => setConfigData({...configData, heroTitle: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Subtítulo Home</label>
                              <input className="w-full h-[50px] px-4 border border-gray-200 rounded-xl text-sm dark:bg-black/20 dark:border-white/10 dark:text-white" value={configData.heroSubtitle || ''} onChange={e => setConfigData({...configData, heroSubtitle: e.target.value})} />
                          </div>
                          <div className="col-span-2">
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Texto do Badge (Home)</label>
                              <input className="w-full h-[50px] px-4 border border-gray-200 rounded-xl text-sm dark:bg-black/20 dark:border-white/10 dark:text-white" value={configData.heroBadgeText || ''} onChange={e => setConfigData({...configData, heroBadgeText: e.target.value})} placeholder="Ex: Experiência Exclusiva" />
                          </div>
                      </div>
                      
                      <FeedbackButton onClick={handleSaveConfig} className="w-full h-[50px] rounded-xl text-sm mt-4 shadow-neon" successText="Salvo!">Salvar Configurações</FeedbackButton>
                  </div>
              )}
          </div>
      </div>

      {/* PRINT MODAL (Internal View) */}
      {showPrintModal && (
          <div className="fixed inset-0 z-50 bg-white overflow-y-auto animate-fade-in">
              <div className="max-w-4xl mx-auto p-10 print:p-0">
                  <div className="flex justify-between items-center mb-8 print:hidden">
                      <h1 className="text-2xl font-bold">Visualização de Impressão</h1>
                      <div className="flex gap-2">
                          <button onClick={handlePrint} className="bg-brand-primary text-white px-4 py-2 rounded-lg font-bold">🖨️ Imprimir</button>
                          <button onClick={() => setShowPrintModal(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold">Fechar</button>
                      </div>
                  </div>
                  
                  {/* PRINT CONTENT */}
                  <div className="border border-black p-8 print:border-0 print:p-0 font-mono">
                      <div className="text-center border-b-2 border-black pb-4 mb-6">
                          <h2 className="text-3xl font-black uppercase tracking-wider">{events.find(e => e.id === selectedEventId)?.name}</h2>
                          <p className="text-lg mt-2">LISTA VIP OFICIAL • {new Date().toLocaleDateString()}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm font-medium">
                          {StorageService.getGuests(selectedEventId)
                             .flatMap(g => g.entries.map(e => e.name))
                             .sort((a,b) => a.localeCompare(b))
                             .map((name, i) => (
                                 <div key={i} className="border-b border-gray-300 py-1 flex justify-between items-center">
                                     <span className="uppercase">{name}</span>
                                     <span className="w-4 h-4 border border-black inline-block ml-2 rounded-sm"></span>
                                 </div>
                             ))
                          }
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};