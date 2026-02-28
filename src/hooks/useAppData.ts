import { useContext } from 'react';
import { AppContext, type AppContextValue } from '../context/AppContext';

export function useAppData(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppData must be used inside AppProvider');
  return ctx;
}
