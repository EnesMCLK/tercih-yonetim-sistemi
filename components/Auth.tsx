import React, { useState } from 'react';
import type { User } from '../types';
import { storageService } from '../services/storageService';
import { cryptoService } from '../services/cryptoService';
import { Card } from './common/Card';
import { Input } from './common/Input';
import { Button } from './common/Button';
import { Select } from './common/Select';
import { securityQuestions } from '../data/securityQuestions';

const sicilNoRegex = /^tk\d{5,6}$/;

interface AuthProps {
  onAuthSuccess: (user: User, sessionKey: CryptoKey) => void;
}

type View = 'login' | 'register' | 'forgotPassword';
type ForgotPasswordStep = 1 | 2 | 3;

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [view, setView] = useState<View>('login');
  const [sicilNo, setSicilNo] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSicilNoValid, setIsSicilNoValid] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Registration state
  const [securityQuestion, setSecurityQuestion] = useState(securityQuestions[0]);
  const [securityAnswer, setSecurityAnswer] = useState('');

  // Forgot Password State
  const [forgotPasswordStep, setForgotPasswordStep] = useState<ForgotPasswordStep>(1);
  const [userForReset, setUserForReset] = useState<User | null>(null);
  const [securityAnswerInput, setSecurityAnswerInput] = useState('');


  const handleSicilNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setSicilNo(value);
    if (view === 'register') {
      setIsSicilNoValid(sicilNoRegex.test(value));
    } else {
      setIsSicilNoValid(true);
    }
  };

  const resetForm = () => {
    setSicilNo('');
    setFullName('');
    setPassword('');
    setNewPassword('');
    setError(null);
    setIsSicilNoValid(true);
    setUserForReset(null);
    setForgotPasswordStep(1);
    setSecurityQuestion(securityQuestions[0]);
    setSecurityAnswer('');
    setSecurityAnswerInput('');
  };

  const switchView = (newView: View) => {
    setView(newView);
    resetForm();
  };

  const handleLoginRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const trimmedPassword = password.trim();
    const trimmedSicilNo = sicilNo.trim().toLowerCase();

    if (!trimmedPassword || !trimmedSicilNo) {
      setError("Sicil numarası ve şifre boş olamaz.");
      setIsLoading(false);
      return;
    }

    try {
      if (view === 'login') {
        const user = await storageService.getUser(trimmedSicilNo);
        if (user) {
          const passwordHash = await cryptoService.hashPassword(trimmedPassword, user.salt);
          if (user.passwordHash === passwordHash) {
            const sessionKey = await cryptoService.deriveSessionKey(trimmedPassword, user.salt);
            onAuthSuccess(user, sessionKey);
          } else {
            setError('Geçersiz sicil numarası veya şifre.');
          }
        } else {
          setError('Geçersiz sicil numarası veya şifre.');
        }
      } else { // Register view
        if (!isSicilNoValid) {
          setError('Sicil numarası "tk" ile başlamalı ve 5-6 rakam içermelidir.');
          setIsLoading(false);
          return;
        }

        const existingUser = await storageService.getUser(trimmedSicilNo);
        if (existingUser) {
          setError('Bu sicil numarası zaten kayıtlı.');
          setIsLoading(false);
          return;
        }

        if(!fullName.trim() || !securityAnswer.trim()){
          setError('Tüm alanlar zorunludur.');
          setIsLoading(false);
          return;
        }
        
        const salt = cryptoService.generateSalt();
        const passwordHash = await cryptoService.hashPassword(trimmedPassword, salt);
        const securityAnswerHash = await cryptoService.hashPassword(securityAnswer.trim(), salt);

        const newUser: User = {
          sicilNo: trimmedSicilNo,
          fullName: fullName.trim(),
          passwordHash,
          salt,
          securityQuestion,
          securityAnswerHash,
        };
        
        await storageService.createUser(newUser);
        const sessionKey = await cryptoService.deriveSessionKey(trimmedPassword, salt);
        onAuthSuccess(newUser, sessionKey);
      }
    } catch (err) {
      console.error("Authentication error:", err);
      setError("Bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
    } finally {
      if (document.getElementById('auth-form')) {
          setIsLoading(false);
      }
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Step 1: Find user by sicilNo
      if (forgotPasswordStep === 1) {
        const user = await storageService.getUser(sicilNo.trim().toLowerCase());
        if (user) {
          setUserForReset(user);
          setForgotPasswordStep(2);
        } else {
          setError("Bu sicil numarasına sahip bir kullanıcı bulunamadı.");
        }
      } 
      // Step 2: Verify user's full name and security answer
      else if (forgotPasswordStep === 2 && userForReset) {
        const securityAnswerHash = await cryptoService.hashPassword(securityAnswerInput.trim(), userForReset.salt);
        const isNameCorrect = fullName.trim().toLowerCase() === userForReset.fullName.toLowerCase();
        const isAnswerCorrect = securityAnswerHash === userForReset.securityAnswerHash;

        if (isNameCorrect && isAnswerCorrect) {
          setForgotPasswordStep(3);
        } else {
          setError("Ad Soyad veya güvenlik cevabı bilgisi eşleşmiyor.");
        }
      }
      // Step 3: Set new password
      else if (forgotPasswordStep === 3 && userForReset) {
         if (newPassword.trim().length < 6) {
            setError("Yeni şifre en az 6 karakter olmalıdır.");
            setIsLoading(false);
            return;
        }
        const newPasswordHash = await cryptoService.hashPassword(newPassword.trim(), userForReset.salt);
        await storageService.updateUserPassword(userForReset.sicilNo, newPasswordHash);
        
        // Automatically log in the user
        const sessionKey = await cryptoService.deriveSessionKey(newPassword.trim(), userForReset.salt);
        onAuthSuccess({ ...userForReset, passwordHash: newPasswordHash }, sessionKey);
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("Bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };


  const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
  );

  const KeyIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>
  );

  const IdCardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 012-2h4a2 2 0 012 2v1m-4 0h4m-9 4h1m-1 4h1m4-4h1m-1 4h1" /></svg>
  );

  const QuestionMarkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-1 1v1a1 1 0 102 0V8a1 1 0 00-1-1zM9 12a1 1 0 00-1 1v1a1 1 0 102 0v-1a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  );
  
  const renderForgotPasswordView = () => (
    <form onSubmit={handleForgotPasswordSubmit} className="space-y-6" id="auth-form">
      {forgotPasswordStep === 1 && (
        <>
          <p className="text-sm text-center text-slate-600 dark:text-slate-400">Şifrenizi sıfırlamak için lütfen sicil numaranızı girin.</p>
          <Input
            id="sicilNo"
            label="Sicil Numarası"
            type="text"
            value={sicilNo}
            onChange={handleSicilNoChange}
            required
            placeholder="tk12345"
            icon={<IdCardIcon />}
          />
        </>
      )}
      {forgotPasswordStep === 2 && userForReset && (
        <>
           <p className="text-sm text-center text-slate-600 dark:text-slate-400">Güvenlik için lütfen aşağıdaki bilgileri doldurun.</p>
           <Input 
            id="fullName" 
            label="Ad Soyad" 
            type="text" 
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required 
            icon={<UserIcon />}
          />
          <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-md">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Güvenlik Sorunuz:</p>
            <p className="text-sm text-slate-900 dark:text-slate-100 mt-1">{userForReset.securityQuestion}</p>
          </div>
          <Input
            id="securityAnswerInput"
            label="Güvenlik Cevabınız"
            type="text"
            value={securityAnswerInput}
            onChange={(e) => setSecurityAnswerInput(e.target.value)}
            required
            icon={<QuestionMarkIcon />}
           />
        </>
      )}
      {forgotPasswordStep === 3 && (
         <>
           <p className="text-sm text-center text-slate-600 dark:text-slate-400">Yeni şifrenizi belirleyin.</p>
           <Input 
              id="newPassword" 
              label="Yeni Şifre" 
              type="password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required 
              icon={<KeyIcon />}
            />
         </>
      )}
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
      <Button type="submit" variant="primary" disabled={isLoading}>
        {isLoading ? 'İşleniyor...' : (forgotPasswordStep === 3 ? 'Şifreyi Sıfırla' : 'İleri')}
      </Button>
    </form>
  );

  const renderLoginRegisterView = () => (
     <form onSubmit={handleLoginRegisterSubmit} className="space-y-6" id="auth-form">
      {view === 'register' && (
        <>
          <Input 
            id="fullName" 
            label="Ad Soyad" 
            type="text" 
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required 
            icon={<UserIcon />}
          />
           <Select
            id="securityQuestion"
            label="Güvenlik Sorusu"
            value={securityQuestion}
            onChange={(e) => setSecurityQuestion(e.target.value)}
          >
            {securityQuestions.map(q => (
              <option key={q} value={q}>{q}</option>
            ))}
          </Select>
          <Input
            id="securityAnswer"
            label="Güvenlik Cevabınız"
            type="text"
            value={securityAnswer}
            onChange={(e) => setSecurityAnswer(e.target.value)}
            required
            icon={<QuestionMarkIcon />}
           />
        </>
      )}
      <div>
        <Input
          id="sicilNo"
          label="Sicil Numarası"
          type="text"
          value={sicilNo}
          onChange={handleSicilNoChange}
          required
          placeholder="tk12345"
          icon={<IdCardIcon />}
        />
        {view === 'register' && sicilNo.length > 0 && !isSicilNoValid && (
          <p className="text-xs text-red-500 mt-1">Geçersiz format. Örnek: tk12345</p>
        )}
      </div>
      <Input 
        id="password" 
        label="Şifre" 
        type="password" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required 
        icon={<KeyIcon />}
      />
      {view === 'login' && (
        <div className="text-right text-sm">
          <button type="button" onClick={() => switchView('forgotPassword')} className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
            Şifremi Unuttum
          </button>
        </div>
      )}
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
      <Button type="submit" variant="primary" disabled={isLoading}>
        {isLoading ? 'İşleniyor...' : (view === 'login' ? 'Giriş Yap' : 'Kayıt Ol')}
      </Button>
    </form>
  );

  const getTitle = () => {
    if (view === 'login') return "Lütfen hesabınıza giriş yapın";
    if (view === 'register') return "Yeni bir hesap oluşturun";
    return "Şifrenizi Sıfırlayın";
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">Tercih Yönetim Sistemi</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">{getTitle()}</p>
        </div>
        <Card>
          {view === 'forgotPassword' ? renderForgotPasswordView() : renderLoginRegisterView()}
          
          <div className="mt-6 text-center">
             {view !== 'forgotPassword' ? (
                <button onClick={() => switchView(view === 'login' ? 'register' : 'login')} className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300" disabled={isLoading}>
                  {view === 'login' ? 'Hesabınız yok mu? Kayıt Olun' : 'Zaten hesabınız var mı? Giriş Yapın'}
                </button>
             ) : (
                <button onClick={() => switchView('login')} className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300" disabled={isLoading}>
                   Giriş ekranına dön
                </button>
             )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Auth;