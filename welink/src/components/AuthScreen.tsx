import React, { useState } from 'react';
import { UserProfile, ProfileType, EnterpriseType, SupplierType, CarrierType } from '../types';
import { 
  Shield, 
  Network, 
  User, 
  Building2, 
  Tractor, 
  LogIn, 
  UserPlus, 
  ArrowLeft,
  Key,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  X,
  XCircle,
  Copy,
  Lock,
  Unlock,
  Mail,
  RefreshCw,
  HelpCircle,
  AlertTriangle,
  FileKey
} from 'lucide-react';
import { WeLinkLogo } from './WeLinkLogo';

interface AuthScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  availableUsers: UserProfile[];
  onRefreshState: () => void;
  onBackToLanding?: () => void;
}

export default function AuthScreen({ onLoginSuccess, availableUsers, onRefreshState, onBackToLanding }: AuthScreenProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Profile specific states
  const [profileType, setProfileType] = useState<ProfileType>('client');
  const [enterpriseType, setEnterpriseType] = useState<EnterpriseType>('supermarche');
  const [supplierType, setSupplierType] = useState<SupplierType>('agriculteur');
  const [carrierType, setCarrierType] = useState<CarrierType>('moto');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Double-auth PIN state during login
  const [pinCode, setPinCode] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);

  // Password Strength Meter helpers
  const checkPasswordStrength = (pass: string) => {
    const checks = {
      length: pass.length >= 8,
      upper: /[A-Z]/.test(pass),
      lower: /[a-z]/.test(pass),
      digit: /\d/.test(pass),
      special: /[@$!%*?&._\-#+€()\[\]{}|\\/]/.test(pass),
    };
    const score = Object.values(checks).filter(Boolean).length;
    return { checks, score };
  };

  const { checks: passChecks, score: passScore } = checkPasswordStrength(password);

  const getStrengthLabel = (score: number) => {
    if (password.length === 0) return { label: 'Aucun', color: 'bg-slate-800 text-slate-500', width: 'w-0' };
    if (score <= 1) return { label: 'Très faible ⚠️', color: 'bg-red-500 text-red-400', width: 'w-1/5' };
    if (score === 2) return { label: 'Faible ⚠️', color: 'bg-orange-500 text-orange-400', width: 'w-2/5' };
    if (score === 3) return { label: 'Moyen 🔓', color: 'bg-amber-500 text-amber-400', width: 'w-3/5' };
    if (score === 4) return { label: 'Sécurisé ✨', color: 'bg-indigo-500 text-indigo-400', width: 'w-4/5' };
    return { label: 'Excellent (Fort) 💪', color: 'bg-emerald-500 text-emerald-400', width: 'w-full' };
  };

  const strengthDetails = getStrengthLabel(passScore);

  // States for Password Recovery Flow
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [recoveryKeyInput, setRecoveryKeyInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<'request' | 'reset'>('request');
  const [recoveryMethod, setRecoveryMethod] = useState<'email' | 'key'>('email');
  const [obtainedDemoToken, setObtainedDemoToken] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // State for showing the generated backup key upon successful registration
  const [generatedRecoveryKey, setGeneratedRecoveryKey] = useState('');
  const [isCopyingKey, setIsCopyingKey] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, pinCode }),
      });
      const data = await response.json();
      
      if (response.status === 403 && data.pinRequired) {
        setShowPinInput(true);
        setErrorMessage(data.error);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Erreur d\'identification');
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    if (!name || !email || !password) {
      setErrorMessage('Veuillez remplir les champs obligatoires (Nom, E-mail et Mot de passe).');
      return;
    }

    if (passScore < 4) {
      setErrorMessage('Veuillez choisir un mot de passe plus complexe d\'au moins 8 caractères.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name,
        email,
        password,
        profileType,
        enterpriseType: profileType === 'entreprise' ? enterpriseType : undefined,
        supplierType: profileType === 'fournisseur' ? supplierType : undefined,
        carrierType: profileType === 'livreur' ? carrierType : undefined,
        vehiclePlate: profileType === 'livreur' ? vehiclePlate : undefined,
        description,
        address,
        phone,
      };

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'inscription');
      }

      if (data.recoveryKey) {
        setGeneratedRecoveryKey(data.recoveryKey);
      }
      
      setSuccessMessage('Compte créé avec succès ! Voici votre Clé de Secours de récupération.');
      setEmail(payload.email);
      onRefreshState();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail) {
      setErrorMessage("Veuillez saisir votre adresse e-mail.");
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue.");
      }

      setSuccessMessage(data.message);
      if (data.demoResetToken) {
        setObtainedDemoToken(data.demoResetToken);
        setRecoveryToken(data.demoResetToken); // Auto fill in sandbox mode for convenience
      }
      setRecoveryStep('reset');
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmNewPassword) {
      setErrorMessage("Veuillez renseigner tous les champs du mot de passe.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    const { score } = checkPasswordStrength(newPassword);
    if (score < 4) {
      setErrorMessage("Le nouveau mot de passe choisi est trop simple.");
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const payload = {
        email: recoveryEmail,
        newPassword,
        token: recoveryMethod === 'email' ? recoveryToken : undefined,
        recoveryKey: recoveryMethod === 'key' ? recoveryKeyInput : undefined,
      };

      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Échec de la réinitialisation.");
      }

      setPassword(newPassword); // Pre-fill in login
      setEmail(recoveryEmail);
      setIsForgotPassword(false);
      setIsRegistering(false);
      setRecoveryStep('request');
      setSuccessMessage("Votre mot de passe a été mis à jour de façon réglementaire.");
      setObtainedDemoToken('');
      setRecoveryToken('');
      setRecoveryKeyInput('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyRecoveryKeyToClipboard = () => {
    if (!generatedRecoveryKey) return;
    navigator.clipboard.writeText(generatedRecoveryKey);
    setIsCopyingKey(true);
    setTimeout(() => setIsCopyingKey(false), 2000);
  };

  return (
    <div id="auth-screen-container" className="min-h-screen bg-welink-ambient flex flex-col justify-start items-center overflow-y-auto py-6 sm:py-12 px-4 sm:px-6 lg:px-8 text-slate-100 font-sans relative scrollbar-thin scrollbar-thumb-slate-800">
      {/* Dynamic graphic absolute glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="max-w-md w-full my-auto flex flex-col items-center space-y-6 relative z-10">
        
        {/* Logo/Brand Header */}
        <div className="flex flex-col items-center text-center">
          <WeLinkLogo iconSize="xl" className="flex-col !space-x-0 space-y-3.5" sloganClassName="text-center text-[10px] tracking-widest text-indigo-400 font-bold uppercase" />
        </div>

        {/* Generated Security Key Screen Layer (Saves account, forces backup validation) */}
        {generatedRecoveryKey ? (
          <div className="w-full bg-slate-900 rounded-3xl border border-indigo-500/30 p-8 shadow-2xl relative overflow-hidden backdrop-blur-md animate-fade-in">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-6 -mt-6"></div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-950 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <Shield className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-white uppercase tracking-wide">Compte créé avec succès !</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Afin de garantir un niveau de confidentialité optimal, nous vous fournissons une <strong className="text-emerald-400">Clé de Secours</strong> unique pour réinitialiser ou récupérer votre profil légalement en cas de perte de votre mot de passe.
              </p>

              {/* Secure display card */}
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 text-center space-y-3 shadow-inner my-6">
                <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Votre Clé de récupération</span>
                <div className="text-indigo-400 font-mono font-black text-sm tracking-widest bg-slate-900 px-3 py-2.5 rounded-xl border border-slate-800 flex items-center justify-center select-all">
                  {generatedRecoveryKey}
                </div>
                <button
                  id="copy-recovery-key-btn"
                  onClick={copyRecoveryKeyToClipboard}
                  type="button"
                  className="inline-flex items-center gap-2 text-xs text-indigo-300 hover:text-white transition font-medium hover:underline cursor-pointer"
                >
                  {isCopyingKey ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copié dans le presse-papier !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copier la clé de secours</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3.5 bg-indigo-950/30 border border-indigo-900/40 rounded-xl flex items-start gap-2.5 text-left text-[11px] text-indigo-300">
                <HelpCircle className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
                <span>Conservez ce code d'accès de secours hors ligne. L'administration ne pourra pas récupérer vos données chiffrées sans celui-ci en cas de perte.</span>
              </div>

              <button
                id="finish-reg-verify-btn"
                onClick={() => {
                  setGeneratedRecoveryKey('');
                  setIsRegistering(false);
                  setSuccessMessage('Connectez-vous maintenant avec votre adresse e-mail et nouveau mot de passe.');
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-500 transition font-bold text-white py-3 rounded-xl shadow-lg shadow-emerald-600/20 text-sm"
              >
                J'ai sauvegardé ma clé, passer à la connexion
              </button>
            </div>
          </div>
        ) : isForgotPassword ? (
          /* Password reset / recovery screen (Forgot password link) */
          <div className="w-full bg-slate-900 rounded-3xl border border-slate-800 p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>
            
            <div className="flex items-center space-x-2 mb-6 text-slate-400 hover:text-white transition cursor-pointer" onClick={() => { setIsForgotPassword(false); setErrorMessage(''); setSuccessMessage(''); }}>
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Retour à la connexion</span>
            </div>

            <div className="space-y-4 mb-6">
              <h2 className="text-md font-bold text-white uppercase tracking-wider">Récupération de compte légale</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Renseignez vos coordonnées pour valider votre sécurité d'accès et réinitialiser votre mot de passe de façon légale.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-4 rounded-xl bg-red-900/30 border border-red-800/50 text-red-300 text-sm">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-4 rounded-xl bg-emerald-900/30 border border-emerald-800/50 text-emerald-300 text-sm">
                {successMessage}
              </div>
            )}

            {recoveryStep === 'request' ? (
              <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 tracking-wider mb-1.5" htmlFor="recovery-email-input">Adresse e-mail du compte</label>
                  <div className="relative">
                    <input
                      id="recovery-email-input"
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="ex: marie@resto.com ou client1@email.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                      required
                    />
                    <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                  </div>
                </div>

                <button
                  id="send-recovery-code-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 transition font-semibold text-white py-3 rounded-xl shadow-lg text-sm flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? 'Recherche du compte...' : 'Demander la réinitialisation'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-5">
                {/* Method Toggles */}
                <div className="flex bg-slate-950 p-1 rounded-xl gap-1">
                  <button
                    id="recovery-method-email-btn"
                    type="button"
                    onClick={() => setRecoveryMethod('email')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] uppercase font-bold tracking-widest transition ${recoveryMethod === 'email' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    📧 Jeton e-mail
                  </button>
                  <button
                    id="recovery-method-key-btn"
                    type="button"
                    onClick={() => setRecoveryMethod('key')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] uppercase font-bold tracking-widest transition ${recoveryMethod === 'key' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    🔑 Clé de Secours
                  </button>
                </div>

                {/* Simulated Notification helper in sandbox to get the code instantly */}
                {recoveryMethod === 'email' && obtainedDemoToken && (
                  <div className="p-3 bg-indigo-950/40 border border-indigo-800 text-indigo-300 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                      <Shield className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Console de simulation e-mail (Mode Démo)</span>
                    </div>
                    <p className="text-[10px] leading-relaxed">
                      Jeton de secours intercepté : <strong className="bg-indigo-900 text-white font-mono rounded px-1.5 py-0.5 text-xs select-all tracking-widest leading-none font-black">{obtainedDemoToken}</strong> (expirera dans 15 minutes).
                    </p>
                  </div>
                )}

                {recoveryMethod === 'email' ? (
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 tracking-wider mb-1" htmlFor="recovery-token-input">Jeton e-mail à 6 chiffres</label>
                    <input
                      id="recovery-token-input"
                      type="text"
                      maxLength={6}
                      value={recoveryToken}
                      onChange={(e) => setRecoveryToken(e.target.value.replace(/\D/g, ''))}
                      placeholder="Saisissez le code temporaire"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-center font-mono font-black text-indigo-300 tracking-widest text-sm focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 tracking-wider mb-1" htmlFor="recovery-key-input">Clé de Secours brute (WLK-...)</label>
                    <input
                      id="recovery-key-input"
                      type="text"
                      value={recoveryKeyInput}
                      onChange={(e) => setRecoveryKeyInput(e.target.value.toUpperCase())}
                      placeholder="WLK-AZE8-RT45-P092-LK78"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 font-mono text-center text-xs text-white focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                )}

                {/* Password input block */}
                <div className="space-y-3 pt-2 border-t border-slate-800/60">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 tracking-wider mb-1" htmlFor="recovery-new-password">Nouveau mot de passe sécurisé</label>
                    <div className="relative">
                      <input
                        id="recovery-new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Créer un nouveau mot de passe fort"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                        required
                      />
                      <button
                        id="toggle-recovery-newpass"
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-3 text-slate-500 hover:text-white transition"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 tracking-wider mb-1" htmlFor="recovery-confirm-password">Confirmer le mot de passe</label>
                    <input
                      id="recovery-confirm-password"
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Saisir à nouveau pour confirmer"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <button
                  id="recovery-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 transition font-bold text-white py-3 rounded-xl text-sm"
                >
                  Enregistrer mon nouveau mot de passe
                </button>
              </form>
            )}

            <button
              id="back-btn-bottom"
              type="button"
              onClick={() => { setRecoveryStep('request'); setObtainedDemoToken(''); }}
              className="mt-4 text-center cursor-pointer text-[10px] w-full block uppercase font-bold text-slate-500 hover:text-indigo-400 transition"
            >
              Réinitialiser l'étape de demande
            </button>
          </div>
        ) : (
          /* Normal Auth (Login vs Register) card */
          <div id="auth-right-form-box" className="w-full bg-slate-900/90 rounded-3xl border border-slate-800/80 p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl -mr-12 -mt-12"></div>
            
            <div className="flex space-x-1 bg-slate-950 p-1.5 rounded-2xl mb-6">
              <button
                id="auth-toggle-login-btn"
                onClick={() => { setIsRegistering(false); setErrorMessage(''); setSuccessMessage(''); setShowPinInput(false); }}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-sm font-medium transition duration-200 ${!isRegistering ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                <LogIn className="w-4 h-4" />
                <span>Connexion</span>
              </button>
              <button
                id="auth-toggle-register-btn"
                onClick={() => { setIsRegistering(true); setErrorMessage(''); setSuccessMessage(''); setShowPinInput(false); }}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-sm font-medium transition duration-200 ${isRegistering ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Créer un compte</span>
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-4 rounded-xl bg-red-900/30 border border-red-800/50 text-red-300 text-sm">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-4 rounded-xl bg-emerald-900/30 border border-emerald-800/50 text-emerald-300 text-sm">
                {successMessage}
              </div>
            )}

            {/* Form Content */}
            {!isRegistering ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5" htmlFor="login-email-input">Adresse e-mail du compte</label>
                  <input
                    id="login-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: client1@email.com ou marie@resto.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                    required
                  />
                  {/* Removed demo passwords hint */}
                </div>

                {/* Secure Password Input */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold uppercase text-slate-400" htmlFor="login-password-input">Mot de passe</label>
                    <button
                      id="forgot-password-trigger-btn"
                      type="button"
                      onClick={() => { setIsForgotPassword(true); setRecoveryEmail(email); setErrorMessage(''); setSuccessMessage(''); }}
                      className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password-input"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                      required
                    />
                    <button
                      id="login-toggle-password-v"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-500 hover:text-white transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Dual PIN requirement block */}
                {showPinInput && (
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-850 space-y-2.5 animate-pulse">
                    <div>
                      <label className="block text-[10px] uppercase font-black text-amber-400 tracking-wider" htmlFor="login-pin-input">🔑 Double Authentification (PIN requis)</label>
                      <p className="text-[10px] text-slate-400">Pour des raisons réglementaires de sécurité, renseignez votre code secret PIN à 4 chiffres.</p>
                    </div>
                    <div>
                      <input
                        id="login-pin-input"
                        type="password"
                        maxLength={4}
                        placeholder="••••"
                        value={pinCode}
                        onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                        className="bg-slate-900 border border-slate-800 text-center tracking-widest font-black text-white text-xs rounded-lg py-1.5 w-24 focus:outline-none focus:border-indigo-550 font-mono"
                        required
                      />
                    </div>
                  </div>
                )}

                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 transition font-semibold text-white py-3 rounded-xl shadow-lg shadow-indigo-600/20 text-sm flex items-center justify-center space-x-2 disabled:opacity-50 mt-4"
                >
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>{loading ? 'Connexion en cours...' : 'Entrer sur mon espace'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4 max-h-[350px] sm:max-h-[430px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1" htmlFor="register-profile-type-select">Type de Profil</label>
                    <select
                      id="register-profile-type-select"
                      value={profileType}
                      onChange={(e) => setProfileType(e.target.value as ProfileType)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:bg-slate-950"
                    >
                      <option value="client">👤 Client (Acheteur et Recherche d'emploi)</option>
                      <option value="entreprise">🏢 Entreprise (Vente aux clients, Offres d'emploi)</option>
                      <option value="fournisseur">🌾 Fournisseur (Vente aux entreprises)</option>
                      <option value="livreur">🛵 Livreur / Transporteur (WeLink Delivery)</option>
                    </select>
                  </div>

                  {profileType === 'livreur' && (
                    <>
                      <div className="col-span-2 sm:col-span-1 animation-fade-in">
                        <label className="block text-xs font-semibold uppercase text-slate-400 mb-1" htmlFor="register-carrier-type-select">Type de Transport</label>
                        <select
                          id="register-carrier-type-select"
                          value={carrierType}
                          onChange={(e) => setCarrierType(e.target.value as CarrierType)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:bg-slate-950"
                        >
                          <option value="moto">🛵 Moto (Conducteur rapide)</option>
                          <option value="tricycle">🛺 Tricycle (Fret léger)</option>
                          <option value="voiture">🚗 Voiture / Petit Fourgon</option>
                          <option value="agence">🚛 Agence de fret routier</option>
                        </select>
                      </div>
                      <div className="col-span-2 sm:col-span-1 animation-fade-in">
                        <label className="block text-xs font-semibold uppercase text-slate-400 mb-1" htmlFor="register-vehicle-plate-input">N° Plaque Véhicule</label>
                        <input
                          id="register-vehicle-plate-input"
                          type="text"
                          value={vehiclePlate}
                          onChange={(e) => setVehiclePlate(e.target.value)}
                          placeholder="Ex: CI-ABJ-01A"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </>
                  )}

                  {profileType === 'entreprise' && (
                    <div className="col-span-2 animation-fade-in">
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1" htmlFor="register-enterprise-type-select">Catégorie d'Entreprise</label>
                      <select
                        id="register-enterprise-type-select"
                        value={enterpriseType}
                        onChange={(e) => setEnterpriseType(e.target.value as EnterpriseType)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:bg-slate-950"
                      >
                        <option value="supermarche">🛒 Supermarché</option>
                        <option value="marche">🏛️ Marché de quartier</option>
                        <option value="alimentation">🍎 Alimentation / Épicerie</option>
                        <option value="restaurant">🍳 Restaurant / Café</option>
                        <option value="hotel">🏨 Hôtel / Hébergement</option>
                        <option value="vetement">👚 Boutique de vêtement</option>
                        <option value="boucher">🥩 Boucher / Charcutier</option>
                        <option value="poissonnerie">🐟 Poissonnerie / Produits de mer</option>
                        <option value="autre">✨ Autre activité commerciale</option>
                      </select>
                    </div>
                  )}

                  {profileType === 'fournisseur' && (
                    <div className="col-span-2 animation-fade-in">
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1" htmlFor="register-supplier-type-select">Spécialité Fournisseur</label>
                      <select
                        id="register-supplier-type-select"
                        value={supplierType}
                        onChange={(e) => setSupplierType(e.target.value as SupplierType)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:bg-slate-950"
                      >
                        <option value="agriculteur">🚜 Agriculteur / Maraîcher</option>
                        <option value="artisan">🪵 Artisan d'art / Fabricant</option>
                        <option value="eleveur">🐑 Éleveur de bétail / Volaille</option>
                        <option value="poissonnier">🐟 Poissonnier / Produits de la mer</option>
                        <option value="autre">📦 Autre fournisseur</option>
                      </select>
                    </div>
                  )}

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1" htmlFor="register-name-input">Nom / Enseigne *</label>
                    <input
                      id="register-name-input"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nom ou Enseigne"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1" htmlFor="register-email-input">Adresse e-mail *</label>
                    <input
                      id="register-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ex: contact@entreprise.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  {/* Complex Password Input with validation */}
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1" htmlFor="register-password-input">Mot de passe réglementaire *</label>
                    <div className="relative">
                      <input
                        id="register-password-input"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Créer un mot de passe fort"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-10 py-2 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                        required
                      />
                      <button
                        id="register-toggle-password-v"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-500 hover:text-white transition"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Indicators (Pristine layout details) */}
                    {password && (
                      <div className="mt-3.5 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-850 space-y-2.5 transform duration-300">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sécurité du mot de passe :</span>
                          <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md ${strengthDetails.color === 'bg-slate-800 text-slate-500' ? 'bg-slate-900 border border-slate-800' : 'bg-slate-900 border border-slate-800'}`}>
                            {strengthDetails.label}
                          </span>
                        </div>
                        
                        {/* Interactive progress segmented meter bar */}
                        <div className="flex h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-850">
                          <div className={`h-full ${strengthDetails.color} ${strengthDetails.width} transition-all duration-300`}></div>
                        </div>

                        {/* Exact strength validation checklist */}
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-slate-400 font-semibold pt-1">
                          <div className="flex items-center gap-1.5 duration-200">
                            {passChecks.length ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                            <span className={passChecks.length ? 'text-slate-200 font-bold' : ''}>Min. 8 caractères</span>
                          </div>
                          <div className="flex items-center gap-1.5 duration-200">
                            {passChecks.upper ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                            <span className={passChecks.upper ? 'text-slate-200 font-bold' : ''}>1 Majuscule</span>
                          </div>
                          <div className="flex items-center gap-1.5 duration-200">
                            {passChecks.lower ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                            <span className={passChecks.lower ? 'text-slate-200 font-bold' : ''}>1 Minuscule</span>
                          </div>
                          <div className="flex items-center gap-1.5 duration-200">
                            {passChecks.digit ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                            <span className={passChecks.digit ? 'text-slate-200 font-bold' : ''}>1 Chiffre</span>
                          </div>
                          <div className="col-span-2 flex items-center gap-1.5 duration-200">
                            {passChecks.special ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                            <span className={passChecks.special ? 'text-slate-200 font-bold' : ''}>1 Caractère spécial (ex: @$!%*?&._-#)</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1" htmlFor="register-address-input">Adresse physique</label>
                    <input
                      id="register-address-input"
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ville, quartier"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1" htmlFor="register-phone-input">N° de Téléphone</label>
                    <input
                      id="register-phone-input"
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+225 01020304"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1" htmlFor="register-description-input">Description / Activité</label>
                    <textarea
                      id="register-description-input"
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Parlez-nous de vos produits ou services de proximité..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 resize-none font-sans"
                    />
                  </div>
                </div>

                <button
                  id="register-submit-btn"
                  type="submit"
                  disabled={loading || (password.length > 0 && passScore < 4)}
                  className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 transition font-semibold text-white py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 text-sm flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Unlock className="w-4 h-4 shrink-0" />
                  <span>{loading ? 'Inscription en cours...' : "Créer mon compte et enregistrer"}</span>
                </button>
              </form>
            )}

          </div>
        )}

        {/* Presentation Link below login card */}
        {onBackToLanding && (
          <button
            id="back-to-landing-btn"
            type="button"
            onClick={onBackToLanding}
            className="inline-flex items-center space-x-1.5 text-[10px] uppercase font-bold text-slate-400 hover:text-indigo-400 transition cursor-pointer border border-slate-850 bg-slate-900/40 hover:bg-slate-900 px-4 py-2 rounded-xl"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Présentation de la startup</span>
          </button>
        )}

      </div>
    </div>
  );
}
