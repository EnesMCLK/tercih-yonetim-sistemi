import React, { useState, useEffect, useCallback } from 'react';
import type { User, Preference } from '../types';
import { storageService } from '../services/storageService';
import { cryptoService } from '../services/cryptoService';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { Select } from './common/Select';
import { turkishProvinces } from '../data/provinces';
import { Spinner } from './common/Spinner';

interface PreferenceManagerProps {
  user: User;
  sessionKey: CryptoKey;
  onLogout: () => void;
}

const MAX_PREFERENCES = 3;
const MIN_PREFERENCES = 1;

const PreferenceManager: React.FC<PreferenceManagerProps> = ({ user, sessionKey, onLogout }) => {
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [newPreference, setNewPreference] = useState('');
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const availableProvinces = turkishProvinces.filter(
    province => !preferences.some(p => p.name === province)
  );

  const savePreferences = useCallback(async (newPrefs: Preference[]) => {
    setIsSaving(true);
    try {
      const encryptedPrefs = await cryptoService.encrypt(newPrefs, sessionKey);
      await storageService.savePreferences(user.sicilNo, encryptedPrefs);
      setPreferences(newPrefs);
    } catch (error) {
      console.error("Failed to encrypt and save preferences:", error);
      // Optionally: show an error message to the user
    } finally {
      setIsSaving(false);
    }
  }, [sessionKey, user.sicilNo]);
  
  useEffect(() => {
    const loadPreferences = async () => {
      setIsLoading(true);
      try {
        const encryptedPrefs = await storageService.getPreferences(user.sicilNo);
        let loadedPreferences: Preference[] = [];
        if (encryptedPrefs) {
          loadedPreferences = await cryptoService.decrypt<Preference[]>(encryptedPrefs, sessionKey);
        }
        setPreferences(loadedPreferences);
        
        const currentAvailable = turkishProvinces.filter(
          province => !loadedPreferences.some(p => p.name === province)
        );
        if (currentAvailable.length > 0) {
          setNewPreference(currentAvailable[0]);
        }
      } catch (error) {
        console.error("Failed to load or decrypt preferences:", error);
        // Data might be corrupted or decryption failed. Start with a clean slate.
        setPreferences([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [user.sicilNo, sessionKey]);

  const handleAddPreference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPreference.trim() === '' || preferences.length >= MAX_PREFERENCES) return;

    const newPref: Preference = {
      id: new Date().toISOString(),
      name: newPreference.trim(),
    };
    const updatedPrefs = [...preferences, newPref];
    await savePreferences(updatedPrefs);

    const nextAvailableProvinces = turkishProvinces.filter(
      province => !updatedPrefs.some(p => p.name === province)
    );
    
    setNewPreference(nextAvailableProvinces.length > 0 ? nextAvailableProvinces[0] : '');
  };

  const handleDeletePreference = async (id: string) => {
    if (preferences.length <= MIN_PREFERENCES) return;
    const updatedPreferences = preferences.filter(p => p.id !== id);
    await savePreferences(updatedPreferences);

    const deletedPreference = preferences.find(p => p.id === id);
    if (deletedPreference && newPreference === '') {
       setNewPreference(deletedPreference.name);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
  };

  const handleDrop = async (targetIndex: number) => {
    if (draggedItemIndex === null || draggedItemIndex === targetIndex) {
        setDraggedItemIndex(null);
        return;
    }

    const updatedPreferences = [...preferences];
    const [draggedItem] = updatedPreferences.splice(draggedItemIndex, 1);
    updatedPreferences.splice(targetIndex, 0, draggedItem);

    await savePreferences(updatedPreferences);
    setDraggedItemIndex(null);
  };

  const handleMovePreference = async (index: number, direction: 'up' | 'down') => {
      if ((direction === 'up' && index === 0) || (direction === 'down' && index === preferences.length - 1)) {
        return;
      }
  
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      const updatedPreferences = [...preferences];
      const [movedItem] = updatedPreferences.splice(index, 1);
      updatedPreferences.splice(newIndex, 0, movedItem);
  
      await savePreferences(updatedPreferences);
  };


  const DragHandleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 dark:text-slate-500" viewBox="0 0 20 20" fill="currentColor">
      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );

  const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  );

  const ArrowUpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
    </svg>
  );

  const ArrowDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
  
  const canAddMore = preferences.length < MAX_PREFERENCES;
  const canDelete = preferences.length > MIN_PREFERENCES;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <Spinner size="h-12 w-12" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Hoş Geldiniz, <span className="text-indigo-600 dark:text-indigo-400">{user.fullName}</span></h1>
            <p className="text-slate-500 dark:text-slate-400">Sicil No: {user.sicilNo}</p>
          </div>
          <button
            onClick={onLogout}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Çıkış Yap
          </button>
        </header>

        <div className="relative">
          {isSaving && (
            <div className="absolute inset-0 bg-slate-200/50 dark:bg-slate-900/60 flex items-center justify-center rounded-xl z-50">
              <Spinner size="h-10 w-10" />
            </div>
          )}
          <Card className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Yeni Tercih Ekle</h2>
            {canAddMore ? (
              <form onSubmit={handleAddPreference} className="flex flex-col sm:flex-row gap-4">
                <div className="flex-grow">
                   <Select
                    id="new-preference"
                    label="Tercih Edilecek İl"
                    value={newPreference}
                    onChange={(e) => setNewPreference(e.target.value)}
                    aria-label="Yeni tercih"
                    disabled={availableProvinces.length === 0}
                  >
                    {availableProvinces.map(province => (
                      <option key={province} value={province}>{province}</option>
                    ))}
                  </Select>
                </div>
                <Button type="submit" className="sm:w-auto mt-auto sm:mt-7" disabled={newPreference === ''}>Ekle</Button>
              </form>
            ) : (
              <div className="text-center text-slate-500 dark:text-slate-400 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                Maksimum tercih sayısına ulaştınız ({MAX_PREFERENCES} adet).
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Kayıtlı Tercihleriniz ({preferences.length}/{MAX_PREFERENCES})</h2>
            {preferences.length === 0 ? (
              <p className="text-center text-slate-500 dark:text-slate-400 py-8">En az {MIN_PREFERENCES} tercih eklemelisiniz.</p>
            ) : (
              <>
                <ul className="space-y-3">
                  {preferences.map((pref, index) => (
                    <li 
                      key={pref.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(index)}
                      onDragEnd={() => setDraggedItemIndex(null)}
                      className={`flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg shadow-sm transition-opacity ${draggedItemIndex === index ? 'opacity-50' : 'opacity-100'}`}
                    >
                      <div className="flex items-center min-w-0">
                          <div className="cursor-grab mr-3" aria-label="Sıralamak için sürükle">
                            <DragHandleIcon />
                          </div>
                          <span className="bg-indigo-500 text-white rounded-full h-8 w-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">{index + 1}</span>
                          <span className="font-medium truncate" title={pref.name}>{pref.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                         <button
                            onClick={() => handleMovePreference(index, 'up')}
                            disabled={index === 0}
                            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
                            aria-label={`Yukarı taşı: ${pref.name}`}
                          >
                            <ArrowUpIcon />
                          </button>
                          <button
                            onClick={() => handleMovePreference(index, 'down')}
                            disabled={index === preferences.length - 1}
                            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
                            aria-label={`Aşağı taşı: ${pref.name}`}
                          >
                            <ArrowDownIcon />
                          </button>
                          <button
                            onClick={() => handleDeletePreference(pref.id)}
                            disabled={!canDelete}
                            className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent disabled:text-slate-400"
                            aria-label={`Sil: ${pref.name}`}
                          >
                            <TrashIcon />
                          </button>
                      </div>
                    </li>
                  ))}
                </ul>
                {!canDelete && preferences.length > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">
                    Listenizde en az {MIN_PREFERENCES} tercih bulunmalıdır.
                  </p>
                )}
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PreferenceManager;