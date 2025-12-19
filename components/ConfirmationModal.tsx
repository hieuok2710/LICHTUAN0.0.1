
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  message
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-popup-in border border-slate-200">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-red-50 p-3 rounded-xl text-red-600">
              <AlertTriangle size={24} />
            </div>
            <button 
              onClick={onCancel}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-all"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-black text-slate-900 mb-2">Xác nhận xóa</h3>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              {message}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl uppercase tracking-widest transition-all active:scale-95"
            >
              No
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl uppercase tracking-widest transition-all shadow-lg shadow-red-100 active:scale-95"
            >
              Yes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
