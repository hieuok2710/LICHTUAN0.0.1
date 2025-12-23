
import React from 'react';
import { Shield, Clock, Bell, CheckCircle, ChevronDown, Calendar } from 'lucide-react';
import { HeroConfig } from '../types';
import { DEFAULT_HERO_CONFIG } from '../constants';

interface WelcomeHeroProps {
  onDismiss: () => void;
  config?: HeroConfig;
}

const WelcomeHero: React.FC<WelcomeHeroProps> = ({ onDismiss, config = DEFAULT_HERO_CONFIG }) => {
  return (
    <div className="relative overflow-hidden bg-slate-900 rounded-[32px] mb-8 shadow-2xl animate-popup-in">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-red-600/20 to-transparent pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-16">
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/10 border border-red-500/20 rounded-full">
            <Shield size={14} className="text-red-500" />
            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">{config.systemLabel}</span>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight uppercase tracking-tighter">
              {config.titleLine1} <br />
              <span className="text-red-500">{config.titleLine2}</span>
            </h1>
            <p className="text-slate-400 text-sm md:text-base font-medium max-w-xl leading-relaxed">
              {config.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
              <Clock size={16} className="text-blue-400" />
              <span className="text-xs font-bold text-slate-300">{config.feature1}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
              <Calendar size={16} className="text-emerald-400" />
              <span className="text-xs font-bold text-slate-300">{config.feature2}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
              <CheckCircle size={16} className="text-orange-400" />
              <span className="text-xs font-bold text-slate-300">{config.feature3}</span>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              onClick={onDismiss}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-900/40 transition-all active:scale-95 flex items-center gap-2"
            >
              Bắt đầu làm việc
              <ChevronDown size={18} />
            </button>
          </div>
        </div>

        <div className="hidden lg:block w-72 h-72 relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-red-600 to-orange-500 rounded-[48px] rotate-6 opacity-20"></div>
          <div className="absolute inset-0 bg-white/5 backdrop-blur-sm border border-white/10 rounded-[48px] shadow-2xl flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-20 h-20 bg-red-600 rounded-[24px] shadow-lg shadow-red-900/50 flex items-center justify-center text-white">
              <Bell size={40} className="animate-pulse" />
            </div>
            <div>
              <p className="text-white font-black text-lg uppercase tracking-tight">Trợ lý ảo</p>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Sẵn sàng nhắc việc</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeHero;
