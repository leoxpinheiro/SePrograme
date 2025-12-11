import React, { useRef, useState } from 'react';
import { FeedbackButton } from './FeedbackButton';

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (base64: string) => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ label, value, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas for compression
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions (resize to reasonable web size to save storage)
          const MAX_DIMENSION = 1200;

          if (width > height) {
            if (width > MAX_DIMENSION) {
              height *= MAX_DIMENSION / width;
              width = MAX_DIMENSION;
            }
          } else {
            if (height > MAX_DIMENSION) {
              width *= MAX_DIMENSION / height;
              height = MAX_DIMENSION;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.7 quality
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          
          onChange(compressedBase64);
          setLoading(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (confirm('Deseja remover esta imagem? Se for a Logo, o texto original voltará a aparecer.')) {
          onChange('');
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-2">
        <label className="block text-xs font-bold text-gray-500 uppercase">{label}</label>
        {value && (
            <button 
                type="button" 
                onClick={handleRemove}
                className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-wide flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg"
            >
                🗑️ Remover Imagem
            </button>
        )}
      </div>
      
      <div className="flex flex-col gap-4">
        {/* Preview Area */}
        {value ? (
          <div className="relative w-full h-48 bg-gray-100 dark:bg-brand-950 rounded-xl overflow-hidden border border-gray-200 dark:border-brand-800 group">
             <img src={value} alt="Preview" className="w-full h-full object-contain" />
             
             {/* Hover Actions */}
             <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white text-gray-900 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-100 shadow-lg transform hover:scale-105 transition-all"
                >
                  Trocar Foto
                </button>
                <button 
                  type="button"
                  onClick={handleRemove}
                  className="text-white text-xs font-bold hover:text-red-300 underline"
                >
                  Remover e usar padrão
                </button>
             </div>
          </div>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-brand-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-brand-primary hover:bg-brand-surface dark:hover:bg-brand-primary/10 transition-colors group"
          >
             <div className="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-gray-400 group-hover:text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
             </div>
             <span className="text-xs font-bold text-gray-500 group-hover:text-brand-primary">{loading ? 'Comprimindo...' : 'Clique para enviar foto'}</span>
          </div>
        )}
        
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
        
        {/* Fallback URL input just in case */}
        {!value && (
            <div className="text-[10px] text-center text-gray-400 flex items-center gap-2">
               <span>Ou cole URL:</span>
               <input 
                 type="text" 
                 className="flex-grow px-2 py-1 text-xs rounded border border-gray-200 dark:bg-brand-950 dark:border-brand-800 outline-none focus:border-brand-primary" 
                 placeholder="https://..."
                 onChange={(e) => onChange(e.target.value)}
               />
            </div>
        )}
      </div>
    </div>
  );
};