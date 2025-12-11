import React, { useState } from 'react';

interface FeedbackButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => Promise<void> | void;
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'danger' | 'whatsapp' | 'secondary';
  className?: string;
  successText?: string;
}

export const FeedbackButton: React.FC<FeedbackButtonProps> = ({ 
  onClick, 
  children, 
  variant = 'primary', 
  className = '', 
  successText = 'Feito!',
  ...props 
}) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (status !== 'idle') return;
    
    setStatus('loading');
    try {
      await onClick(e);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      console.error(error);
      setStatus('idle');
    }
  };

  const getBaseColor = () => {
    if (variant === 'whatsapp') return 'bg-[#25D366] hover:bg-[#1db954] text-white shadow-lg shadow-green-500/20';
    if (variant === 'success') return 'bg-brand-primary hover:bg-brand-secondary text-white';
    if (variant === 'danger') return 'bg-accent-error hover:bg-red-600 text-white shadow-lg shadow-red-500/20';
    if (variant === 'secondary') return 'bg-white border border-gray-200 text-brand-dark hover:bg-gray-50 dark:bg-white/5 dark:border-white/10 dark:text-white dark:hover:bg-white/10';
    return 'bg-brand-primary hover:bg-brand-secondary text-white shadow-neon';
  };

  const colorClass = status === 'success' ? 'bg-green-500 text-white border-green-500 shadow-none' : getBaseColor();

  return (
    <button
      onClick={handleClick}
      disabled={status !== 'idle' || props.disabled}
      className={`${className} ${colorClass} transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]`}
      {...props}
    >
      {status === 'loading' && (
        <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {status === 'success' ? (
        <span className="flex items-center gap-1 font-bold animate-fade-in">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          {successText}
        </span>
      ) : (
        <span className={status === 'loading' ? 'opacity-0' : ''}>{children}</span>
      )}
    </button>
  );
};