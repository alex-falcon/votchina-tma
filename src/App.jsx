import React, { useState, useEffect } from 'react';
import { Pickaxe, Scroll, Skull, Crown, Users, Zap, Shield, Swords, BookOpen } from 'lucide-react';

// ==========================================
// ВАСЯ: Конфиг API
// ==========================================
const API_BASE_URL = 'https://api.viviral.net/api';
const MAX_ENERGY = 10;
const MAX_PATIENCE = 10;

export default function App() {
  const [activeTab, setActiveTab] = useState('work');
  const [clickEffect, setClickEffect] = useState(false);
  
  // Состояния загрузки и ID
  const [loading, setLoading] = useState(true);
  const [tgId, setTgId] = useState(null);

  // Стейт игрока (пустой по умолчанию)
  const [player, setPlayer] = useState({
    name: '...',
    rank: 'Холоп',
    kopecks: 0,
    debt: 0,
    energy: 10,
    patience: 10,
    boss_id: 0
  });

  // ==========================================
  // ИНИЦИАЛИЗАЦИЯ (Загрузка данных с сервера)
  // ==========================================
  useEffect(() => {
    // 1. Инициализируем Telegram WebApp
    const tg = window.Telegram?.WebApp;
    let userId = 123456789; // Дефолт (на случай если ты открыл просто в браузере, а не в ТГ)

    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
      tg.ready();
      tg.expand(); // Разворачиваем игру на весь экран телефона
      userId = tg.initDataUnsafe.user.id;
    }
    setTgId(userId);

    // 2. Делаем запрос к твоему VPS
    fetch(`${API_BASE_URL}/player/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (!data.detail) {
          setPlayer(data); // Записываем реальные данные из БД!
        } else {
          console.error("Сервер ответил:", data.detail);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Ошибка сети:", err);
        setLoading(false);
      });
  }, []);

  const triggerShake = () => {
    setClickEffect(true);
    setTimeout(() => setClickEffect(false), 200);
  };

  // ==========================================
  // МЕХАНИКА: БАТРАЧИТЬ (POST запрос)
  // ==========================================
  const handleWork = async () => {
    if (player.energy <= 0) {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert("Сил нет, барин! Иди в лавку за медовухой.");
      } else {
        alert("Сил нет, барин! Иди в лавку за медовухой.");
      }
      return;
    }

    triggerShake();

    try {
      const res = await fetch(`${API_BASE_URL}/work`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tg_id: tgId })
      });
      const data = await res.json();

      if (data.status === 'success') {
        // Обновляем циферки на экране
        setPlayer(prev => ({
          ...prev,
          energy: data.new_energy,
          kopecks: prev.kopecks + data.earned,
          debt: data.new_debt
        }));
        
        // Вибрация телефона (Кайф!)
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
      } else {
        if (window.Telegram?.WebApp) window.Telegram.WebApp.showAlert(data.detail);
      }
    } catch (err) {
      console.error("Ошибка при батрачестве:", err);
    }
  };

  // Механика покупки (мокаем)
  const buyItem = (itemName, price, type) => {
    const msg = "Скоро добавим оплату в Telegram Stars!";
    if (window.Telegram?.WebApp) window.Telegram.WebApp.showAlert(msg);
    else alert(msg);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-stone-950 text-amber-500 font-serif text-xl animate-pulse">
        Загрузка летописи...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-stone-950 text-stone-200 font-serif overflow-hidden relative">
      {/* Эффект грязи/виньетки на фоне */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-stone-950/80 to-stone-950 opacity-90 z-0"></div>

      {/* --- ВЕРХНЯЯ ПАНЕЛЬ (ГРАМОТА/СТАТУС) --- */}
      <header className="relative z-10 bg-stone-900 border-b-2 border-amber-900/50 p-4 shadow-xl">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-xl font-bold text-amber-500 uppercase tracking-wider">{player.name}</h1>
            <div className="text-sm text-stone-400 flex items-center gap-1">
              <Crown size={14} className="text-amber-600" />
              {player.rank} {player.boss_id !== 0 && <span className="text-stone-600 text-xs">(Барин ID: {player.boss_id})</span>}
            </div>
          </div>
          <div className="text-right bg-stone-950 p-2 rounded border border-stone-800">
            <div className="text-amber-400 font-bold flex justify-end items-center gap-1">
              {player.kopecks} <span className="text-xs text-stone-500">коп.</span>
            </div>
            {player.debt > 0 && (
              <div className="text-red-500 text-xs font-bold mt-1">
                Долг: {player.debt}
              </div>
            )}
          </div>
        </div>

        {/* Прогресс бары */}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-yellow-500 flex items-center gap-1"><Zap size={10}/> Энергия</span>
              <span>{player.energy}/{MAX_ENERGY}</span>
            </div>
            <div className="h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
              <div className="h-full bg-gradient-to-r from-yellow-700 to-yellow-400 transition-all" style={{width: `${(player.energy/MAX_ENERGY)*100}%`}}></div>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-blue-500 flex items-center gap-1"><Shield size={10}/> Терпение</span>
              <span>{player.patience}/{MAX_PATIENCE}</span>
            </div>
            <div className="h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
              <div className="h-full bg-gradient-to-r from-blue-700 to-blue-400 transition-all" style={{width: `${(player.patience/MAX_PATIENCE)*100}%`}}></div>
            </div>
          </div>
        </div>
      </header>

      {/* --- ОСНОВНАЯ ЗОНА (КОНТЕНТ) --- */}
      <main className="flex-1 relative z-10 overflow-y-auto p-4 pb-24">
        
        {/* ВКЛАДКА: БАТРАЧИТЬ (ГЛАВНАЯ) */}
        {activeTab === 'work' && (
          <div className="flex flex-col items-center justify-center h-full space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-black text-stone-400 opacity-20 uppercase tracking-widest absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -z-10">ГАЛЕРЫ</h2>
            </div>
            
            <button 
              onClick={handleWork}
              className={`
                relative group w-48 h-48 rounded-full bg-stone-800 flex flex-col items-center justify-center
                border-4 border-stone-700 shadow-[0_0_30px_rgba(0,0,0,0.8)]
                active:scale-95 transition-transform duration-100
                ${clickEffect ? 'animate-pulse bg-stone-700 border-amber-800' : ''}
                ${player.energy === 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}
              `}
            >
              <div className="absolute inset-2 rounded-full border border-stone-600/30"></div>
              <Pickaxe size={64} className={`mb-2 ${player.energy > 0 ? 'text-stone-400 group-active:text-amber-500 group-active:-rotate-12 transition-all' : 'text-stone-600'}`} />
              <span className="font-bold text-xl uppercase tracking-widest">Батрачить</span>
              <span className="text-xs text-stone-500 mt-1">-1 Энергия</span>
            </button>

            {player.boss_id !== 0 && (
              <div className="text-sm text-stone-500 bg-stone-900/50 px-4 py-2 rounded-lg border border-red-900/30">
                Отработка оброка для Барина
              </div>
            )}
          </div>
        )}

        {/* ВКЛАДКА: ВЛАСТЬ (ДОНОСЫ И ПИРАМИДА) */}
        {activeTab === 'power' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-xl font-bold text-amber-500 border-b border-stone-800 pb-2 flex items-center gap-2">
              <Crown className="text-amber-600" /> Иерархия & Власть
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              <button className="bg-stone-900 border border-stone-700 p-4 rounded-xl flex flex-col items-center gap-2 active:bg-stone-800">
                <Users size={24} className="text-blue-500" />
                <span className="text-sm font-bold">Моя Пирамида</span>
              </button>
              
              <button className="bg-red-950 border border-red-900 p-4 rounded-xl flex flex-col items-center gap-2 active:bg-red-900 text-red-200">
                <Scroll size={24} className="text-red-500" />
                <span className="text-sm font-bold text-center">Накатать Донос</span>
                <span className="text-xs text-red-700">Анонимно</span>
              </button>

              <button className="bg-stone-900 border border-stone-700 p-4 rounded-xl flex flex-col items-center gap-2 active:bg-stone-800 col-span-2">
                <Swords size={24} className="text-stone-400" />
                <span className="text-sm font-bold">Сбежать в Казаки</span>
                <span className="text-xs text-yellow-600">Цена: 50 Stars</span>
              </button>
            </div>
          </div>
        )}

        {/* ВКЛАДКА: РЫНОК (МАГАЗИН И УНИЖЕНИЯ) */}
        {activeTab === 'shop' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
             <div>
              <h2 className="text-xl font-bold text-amber-500 border-b border-stone-800 pb-2 mb-4 flex items-center gap-2">
                <BookOpen className="text-amber-600" /> Теневой Рынок
              </h2>
              <div className="space-y-3">
                <div className="bg-stone-900 border border-stone-800 p-3 rounded-xl flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-stone-950 rounded-full border border-yellow-900/50 flex items-center justify-center">
                      <Zap size={20} className="text-yellow-600"/>
                    </div>
                    <div>
                      <div className="font-bold text-sm">Медовуха</div>
                      <div className="text-xs text-stone-500">Фулл Энергия (10/10)</div>
                    </div>
                  </div>
                  <button onClick={() => buyItem('energy', 30, 'energy')} className="bg-stone-800 hover:bg-stone-700 text-yellow-500 text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-1 border border-stone-700">
                    30 ⭐️
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- НИЖНЯЯ НАВИГАЦИЯ (BOTTOM NAV) --- */}
      <nav className="absolute bottom-0 w-full bg-stone-950 border-t-2 border-stone-800 z-50">
        <div className="flex justify-around items-center h-16 px-2">
          <NavBtn 
            icon={<Pickaxe size={24} />} 
            label="Грязь" 
            active={activeTab === 'work'} 
            onClick={() => setActiveTab('work')} 
          />
          <NavBtn 
            icon={<Crown size={24} />} 
            label="Власть" 
            active={activeTab === 'power'} 
            onClick={() => setActiveTab('power')} 
          />
          <div className="relative -top-5">
            <button className="w-14 h-14 bg-gradient-to-b from-amber-600 to-amber-800 rounded-full flex items-center justify-center border-4 border-stone-950 shadow-lg shadow-amber-900/20 text-stone-950">
              <Scroll size={28} />
            </button>
          </div>
          <NavBtn 
            icon={<BookOpen size={24} />} 
            label="Рынок" 
            active={activeTab === 'shop'} 
            onClick={() => setActiveTab('shop')} 
          />
          <NavBtn 
            icon={<Users size={24} />} 
            label="Площадь" 
            active={activeTab === 'square'} 
            onClick={() => {
                if(window.Telegram?.WebApp) window.Telegram.WebApp.showAlert("Слухи пишутся...");
            }} 
          />
        </div>
      </nav>
    </div>
  );
}

// Компонент кнопки навигации
function NavBtn({ icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-16 gap-1 transition-colors ${active ? 'text-amber-500' : 'text-stone-500 hover:text-stone-300'}`}
    >
      <div className={`${active ? 'animate-bounce-small' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </button>
  );
}