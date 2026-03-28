import React, { useState, useEffect } from 'react';
import { Pickaxe, Scroll, Skull, Crown, Users, Zap, Shield, Swords, BookOpen, Copy, CheckCircle2, ArrowUpCircle } from 'lucide-react';

// ==========================================
// ВАСЯ: Боевой Конфиг
// ==========================================
const API_BASE_URL = 'https://api.viviral.net/api';
const MAX_ENERGY = 10;
const MAX_PATIENCE = 10;

export default function App() {
  const [activeTab, setActiveTab] = useState('work');
  const [clickEffect, setClickEffect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tgId, setTgId] = useState(null);
  const [copied, setCopied] = useState(false);

  // Стейты для вкладок
  const [squareNews, setSquareNews] = useState([]);
  const [victims, setVictims] = useState({ snitch: [], humiliate: [] });
  const [snitchText, setSnitchText] = useState("");

  const [player, setPlayer] = useState({
    name: '...', rank: 'Холоп', kopecks: 0, debt: 0,
    energy: 10, patience: 10, boss_id: 0, slaves: 0, ref_link: "", strikes: 0
  });

  // Вибрация (Telegram HapticFeedback)
  const haptic = (type = 'light') => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred(type);
    }
  };

  const alertUser = (msg) => {
    if (window.Telegram?.WebApp) window.Telegram.WebApp.showAlert(msg);
    else alert(msg);
  };

  // Загрузка данных игрока
  const loadPlayerData = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/player/${id}`);
      const data = await res.json();
      if (!data.detail) setPlayer(data);
    } catch (err) { console.error("Ошибка загрузки игрока:", err); }
  };

  // Загрузка списков (жертвы и площадь)
  const loadDynamicData = async (id) => {
    try {
      const [resSquare, resVictims] = await Promise.all([
        fetch(`${API_BASE_URL}/square`),
        fetch(`${API_BASE_URL}/victims/${id}`)
      ]);
      const dataSquare = await resSquare.json();
      const dataVictims = await resVictims.json();
      
      setSquareNews(dataSquare.news || []);
      setVictims(dataVictims);
    } catch (err) { console.error("Ошибка загрузки списков:", err); }
  };

  // ИНИЦИАЛИЗАЦИЯ
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    let userId = 123456789; // Дефолт для браузера

    if (tg && tg.initDataUnsafe?.user) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#0c0a09');
      userId = tg.initDataUnsafe.user.id;
    }
    setTgId(userId);

    Promise.all([
      loadPlayerData(userId),
      loadDynamicData(userId)
    ]).finally(() => setLoading(false));
  }, []);

  // КНОПКА: БАТРАЧИТЬ
  const handleWork = async () => {
    if (player.energy <= 0) {
      haptic('heavy');
      alertUser("Сил нет, барин! Иди в лавку за медовухой.");
      return;
    }

    setClickEffect(true);
    setTimeout(() => setClickEffect(false), 200);
    haptic('medium');

    try {
      const res = await fetch(`${API_BASE_URL}/work`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tg_id: tgId })
      });
      const data = await res.json();

      if (data.status === 'success') {
        setPlayer(prev => ({ ...prev, energy: data.new_energy, kopecks: prev.kopecks + data.earned, debt: data.new_debt }));
      } else {
        alertUser(data.detail);
      }
    } catch (err) { console.error(err); }
  };

  // КНОПКА: ПОВЫСИТЬ СТАТУС
  const handleUpgrade = async () => {
    haptic('medium');
    try {
      const res = await fetch(`${API_BASE_URL}/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tg_id: tgId })
      });
      const data = await res.json();
      alertUser(data.msg);
      if (data.status === 'success') loadPlayerData(tgId);
    } catch (err) { console.error(err); }
  };

  // КНОПКА: НАКАТАТЬ ДОНОС
  const handleSnitch = async (targetId) => {
    if (!snitchText) return alertUser("Напиши кляузу сначала (до 100 симв.)!");
    haptic('heavy');
    try {
      const res = await fetch(`${API_BASE_URL}/snitch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tg_id: tgId, target_id: targetId, data: snitchText })
      });
      const data = await res.json();
      alertUser(data.message);
      setSnitchText("");
      loadPlayerData(tgId); // Обновляем статы (вдруг нас побили опричники)
    } catch (err) { console.error(err); }
  };

  // КНОПКА: КУПИТЬ И УНИЗИТЬ (Мок для Telegram Stars)
  const handleBuy = (itemName) => {
    haptic('light');
    alertUser(`Покупка: "${itemName}". Скоро добавим оплату в Telegram Stars!`);
  };

  // КОПИРОВАТЬ РЕФКУ
  const copyRef = () => {
    haptic('light');
    // Используем fallback для старых телефонов
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(player.ref_link);
    } else {
      let textArea = document.createElement("textarea");
      textArea.value = player.ref_link;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try { document.execCommand('copy'); } catch (err) { console.error(err); }
      textArea.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // СМЕНА ВКЛАДКИ (С обновлением динамических данных)
  const changeTab = (tabName) => {
    haptic('light');
    setActiveTab(tabName);
    if (tabName === 'square' || tabName === 'power' || tabName === 'shop') {
      loadDynamicData(tgId); // Подтягиваем свежие слухи и списки жертв
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-stone-950 text-amber-500 font-serif text-xl animate-pulse">Загрузка летописи...</div>;

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-stone-950 text-stone-200 font-serif overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-stone-950/80 to-stone-950 opacity-90 z-0"></div>

      {/* --- ШАПКА --- */}
      <header className="relative z-10 bg-stone-900 border-b-2 border-amber-900/50 p-4 shadow-xl shrink-0">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-xl font-bold text-amber-500 uppercase tracking-wider">{player.name}</h1>
            <div className="text-sm text-stone-400 flex items-center gap-1">
              <Crown size={14} className="text-amber-600" />
              {player.rank} {player.strikes > 0 && <span className="text-red-500 text-xs">(Страйков: {player.strikes})</span>}
            </div>
          </div>
          <div className="text-right bg-stone-950 p-2 rounded border border-stone-800">
            <div className="text-amber-400 font-bold flex justify-end items-center gap-1">
              {player.kopecks} <span className="text-xs text-stone-500">коп.</span>
            </div>
            {player.debt > 0 && <div className="text-red-500 text-xs font-bold mt-1">Долг: {player.debt}</div>}
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-[10px] mb-1"><span className="text-yellow-500 uppercase tracking-wider">Энергия</span><span>{player.energy}/{MAX_ENERGY}</span></div>
            <div className="h-1.5 bg-stone-950 rounded-full border border-stone-800 overflow-hidden"><div className="h-full bg-gradient-to-r from-yellow-700 to-yellow-400 transition-all" style={{width: `${(player.energy/MAX_ENERGY)*100}%`}}></div></div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-[10px] mb-1"><span className="text-blue-500 uppercase tracking-wider">Терпение</span><span>{player.patience}/{MAX_PATIENCE}</span></div>
            <div className="h-1.5 bg-stone-950 rounded-full border border-stone-800 overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-700 to-blue-400 transition-all" style={{width: `${(player.patience/MAX_PATIENCE)*100}%`}}></div></div>
          </div>
        </div>
      </header>

      {/* --- КОНТЕНТ --- */}
      <main className="flex-1 relative z-10 overflow-y-auto p-4 pb-24 scrollbar-hide">
        
        {/* ВКЛАДКА 1: БАТРАЧИТЬ */}
        {activeTab === 'work' && (
          <div className="flex flex-col items-center justify-center h-full space-y-8 animate-in fade-in duration-300">
            <button onClick={handleWork} className={`relative group w-48 h-48 rounded-full bg-stone-800 flex flex-col items-center justify-center border-4 border-stone-700 shadow-[0_0_30px_rgba(0,0,0,0.8)] active:scale-95 transition-transform ${clickEffect ? 'bg-stone-700 border-amber-800' : ''} ${player.energy === 0 ? 'opacity-50 grayscale' : ''}`}>
              <Pickaxe size={64} className={`mb-2 ${player.energy > 0 ? 'text-stone-400' : 'text-stone-600'}`} />
              <span className="font-bold text-xl uppercase tracking-widest">Батрачить</span>
            </button>
            
            <div className="w-full space-y-3">
              <div className="bg-stone-900/80 p-4 rounded-xl border border-stone-800 flex justify-between items-center">
                <div>
                  <div className="text-sm text-stone-400">Душ в подчинении</div>
                  <div className="text-xl text-amber-500 font-bold">{player.slaves}</div>
                </div>
                <Users size={32} className="text-stone-700"/>
              </div>
              <button onClick={handleUpgrade} className="w-full bg-amber-900/30 hover:bg-amber-800/50 text-amber-500 border border-amber-900/50 py-3 rounded-xl font-bold text-sm flex justify-center items-center gap-2 active:scale-95 transition-all">
                <ArrowUpCircle size={18} /> Повысить статус (от 2 душ)
              </button>
            </div>
          </div>
        )}

        {/* ВКЛАДКА 2: ВЛАСТЬ И ДОНОСЫ */}
        {activeTab === 'power' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-amber-500 border-b border-stone-800 pb-2 flex items-center gap-2"><Crown /> Тайный Приказ</h2>
            <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl space-y-3 shadow-lg">
              <p className="text-xs text-stone-400 leading-relaxed mb-2">Напиши кляузу на зажравшихся бояр. Если донос удастся 5 раз — боярин поедет в Сибирь, а его имущество конфискуют.</p>
              
              <input type="text" placeholder="Текст кляузы (до 100 симв.)" maxLength={100} value={snitchText} onChange={e => setSnitchText(e.target.value)} className="w-full bg-stone-950 border border-stone-700 rounded-lg p-3 text-sm text-stone-200 focus:outline-none focus:border-red-900 placeholder-stone-600"/>
              
              <div className="text-xs text-stone-500 mt-4 mb-2 uppercase tracking-wider font-bold">Выберите жертву:</div>
              {victims.snitch.length === 0 ? <div className="text-sm text-stone-600 text-center py-4 bg-stone-950 rounded-lg border border-stone-800">Все попрятались по усадьбам...</div> : victims.snitch.map(v => (
                <button key={v.id} onClick={() => handleSnitch(v.id)} className="w-full flex justify-between items-center bg-red-950/20 border border-red-900/30 p-3 rounded-lg hover:bg-red-900/40 active:scale-95 transition-all text-sm group">
                  <span className="font-bold text-stone-300">{v.name}</span> 
                  <span className="text-red-500 text-xs border border-red-900/50 bg-red-950/50 px-2 py-1 rounded group-active:bg-red-900">Сдать ({v.rank})</span>
                </button>
              ))}
            </div>

            <button onClick={() => handleBuy('Побег в Казаки (50 Stars)')} className="w-full bg-stone-900 border border-stone-700 p-4 rounded-xl flex items-center justify-between active:scale-95 transition-all shadow-lg">
                <div className="flex items-center gap-3">
                    <Swords className="text-stone-400" />
                    <span className="text-sm font-bold">Сбежать в Казаки</span>
                </div>
                <span className="text-xs text-yellow-600 font-bold border border-yellow-900/50 px-2 py-1 rounded bg-stone-950">50 ⭐️</span>
            </button>
          </div>
        )}

        {/* ВКЛАДКА 3: РЕФЕРАЛКА (ЦЕНТР) */}
        {activeTab === 'ref' && (
          <div className="space-y-6 animate-in zoom-in-95 duration-300 flex flex-col items-center justify-center h-full text-center">
            <div className="w-24 h-24 bg-stone-900 rounded-full border border-amber-900/50 flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(217,119,6,0.2)]">
                <Users size={48} className="text-amber-600"/>
            </div>
            <div>
                <h2 className="text-2xl font-black text-amber-500 uppercase tracking-widest">Вербовка душ</h2>
                <p className="text-sm text-stone-400 mt-2 px-4">Разошли эту грамоту своим кентам. Когда они зайдут в игру, они станут твоими вечными холопами, а ты будешь забирать <span className="text-amber-500 font-bold">4 копейки</span> с каждого их взмаха киркой!</p>
            </div>
            
            <button onClick={copyRef} className="bg-gradient-to-b from-stone-800 to-stone-900 border border-amber-700/50 p-4 rounded-xl flex items-center justify-center gap-3 w-full max-w-[250px] active:scale-95 shadow-lg transition-all mt-4">
               {copied ? <CheckCircle2 className="text-green-500"/> : <Copy className="text-amber-500"/>}
               <span className="font-bold text-stone-200">{copied ? 'Грамота скопирована!' : 'Скопировать ссылку'}</span>
            </button>
          </div>
        )}

        {/* ВКЛАДКА 4: РЫНОК И УНИЖЕНИЯ */}
        {activeTab === 'shop' && (
          <div className="space-y-8 animate-in fade-in duration-300">
             {/* ТЕНЕВОЙ РЫНОК */}
             <div>
              <h2 className="text-xl font-bold text-amber-500 border-b border-stone-800 pb-2 mb-4 flex items-center gap-2"><BookOpen /> Теневой Рынок</h2>
              <div className="space-y-3">
                <ShopItem icon={<Zap className="text-yellow-600"/>} name="Медовуха" desc="Фулл Энергия (10/10)" price="30" onClick={() => handleBuy('Медовуха')} />
                <ShopItem icon={<Shield className="text-purple-600"/>} name="Беруши" desc="Фулл Терпение (10/10)" price="30" onClick={() => handleBuy('Беруши')} />
                <ShopItem icon={<Scroll className="text-stone-400"/>} name="Индульгенция" desc="Очистить все страйки" price="150" onClick={() => handleBuy('Индульгенция')} />
              </div>
            </div>

            {/* ЛАВКА УНИЖЕНИЙ */}
            <div>
              <h2 className="text-xl font-bold text-red-500 border-b border-red-900/30 pb-2 mb-4 flex items-center gap-2"><Skull className="text-red-600" /> Лавка Унижений</h2>
              <p className="text-xs text-stone-500 mb-3 leading-relaxed">Плати Stars, чтобы наказать чернь публично. Жертвы выбираются случайно среди тех, кто ниже тебя по статусу.</p>
              
              {victims.humiliate.length === 0 ? (
                <div className="bg-red-950/20 border border-red-900/30 p-4 rounded-xl flex flex-col items-center justify-center">
                    <Skull size={24} className="text-red-900/50 mb-2" />
                    <span className="text-sm text-stone-500">Ты на дне. Унижать пока некого.</span>
                </div>
              ) : (
                <div className="space-y-2">
                    {victims.humiliate.map(v => (
                        <div key={v.id} className="bg-stone-900 border border-stone-800 p-3 rounded-lg flex justify-between items-center text-sm shadow-sm">
                            <span className="font-bold text-stone-300">{v.name} <span className="text-[10px] text-stone-500 font-normal">({v.rank})</span></span>
                            <div className="flex gap-1">
                                <button onClick={() => handleBuy(`Плюнуть в ${v.name}`)} className="bg-red-950/40 text-red-500 px-2 py-1 rounded text-[10px] border border-red-900/50 hover:bg-red-900/50">Плюнуть (10⭐️)</button>
                                <button onClick={() => handleBuy(`Выпороть ${v.name}`)} className="bg-red-950/40 text-red-500 px-2 py-1 rounded text-[10px] border border-red-900/50 hover:bg-red-900/50">Выпороть (50⭐️)</button>
                            </div>
                        </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ВКЛАДКА 5: ПЛОЩАДЬ */}
        {activeTab === 'square' && (
          <div className="space-y-4 animate-in fade-in duration-300">
             <h2 className="text-xl font-bold text-amber-500 border-b border-stone-800 pb-2 flex items-center gap-2"><Scroll /> Слухи на площади</h2>
             <div className="space-y-3">
               {squareNews.map((news, idx) => (
                 <div key={idx} className="bg-stone-900 border-l-4 border-amber-800 p-4 rounded-r-xl shadow-md text-sm text-stone-300 italic leading-relaxed">
                   «{news}»
                 </div>
               ))}
               <button onClick={() => {haptic('light'); loadDynamicData(tgId)}} className="w-full text-center text-xs text-stone-500 mt-6 py-3 border border-stone-800 rounded-lg bg-stone-900 hover:text-stone-300 active:scale-95 transition-all">Прислушаться (Обновить)...</button>
             </div>
          </div>
        )}
      </main>

      {/* --- BOTTOM NAV --- */}
      <nav className="absolute bottom-0 w-full bg-stone-950 border-t-2 border-stone-800 z-50 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
        <div className="flex justify-around items-center h-[4.5rem] px-1 pb-2">
          <NavBtn icon={<Pickaxe size={22} />} label="Грязь" active={activeTab === 'work'} onClick={() => changeTab('work')} />
          <NavBtn icon={<Crown size={22} />} label="Власть" active={activeTab === 'power'} onClick={() => changeTab('power')} />
          <div className="relative -top-5">
            <button onClick={() => changeTab('ref')} className="w-14 h-14 bg-gradient-to-b from-amber-600 to-amber-800 rounded-full flex items-center justify-center border-4 border-stone-950 shadow-lg text-stone-950 active:scale-95 transition-transform">
              <Users size={28} />
            </button>
          </div>
          <NavBtn icon={<BookOpen size={22} />} label="Рынок" active={activeTab === 'shop'} onClick={() => changeTab('shop')} />
          <NavBtn icon={<Scroll size={22} />} label="Площадь" active={activeTab === 'square'} onClick={() => changeTab('square')} />
        </div>
      </nav>
    </div>
  );
}

// Компонент элемента магазина
function ShopItem({ icon, name, desc, price, onClick }) {
    return (
        <div className="bg-stone-900 border border-stone-800 p-3 rounded-xl flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-stone-950 rounded-full border border-stone-800 flex items-center justify-center">
                {icon}
            </div>
            <div>
                <div className="font-bold text-sm text-stone-200">{name}</div>
                <div className="text-[10px] text-stone-500 uppercase tracking-wide">{desc}</div>
            </div>
            </div>
            <button onClick={onClick} className="bg-stone-800 hover:bg-stone-700 active:scale-95 text-yellow-500 text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1 border border-stone-700 transition-all">
                {price} ⭐️
            </button>
        </div>
    );
}

function NavBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-[4.5rem] h-full gap-1 transition-colors ${active ? 'text-amber-500' : 'text-stone-500 hover:text-stone-300'}`}>
      <div className={`${active ? 'animate-bounce-small' : ''}`}>{icon}</div>
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </button>
  );
}