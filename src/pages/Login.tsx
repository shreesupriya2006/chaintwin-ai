// Polished Login & Authentication Page for ChainTwin AI
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  Radio,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  googleProvider,
  sendPasswordResetEmail,
  isFirebaseConfigured,
} from '../lib/firebase';
import { useSupplyChainStore } from '../store/useSupplyChainStore';

export const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { setUser } = useSupplyChainStore();

  const handleDemoSignIn = () => {
    setUser({
      uid: 'demo-manager-001',
      email: 'manager@tiruppur-garments.com',
      displayName: 'K. Raghavan (Plant Manager)',
      photoURL: null,
      isDemoUser: true,
    });
    navigate('/');
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    if (!isFirebaseConfigured || !auth) {
      // In demo mode fallback
      handleDemoSignIn();
      setLoading(false);
      return;
    }

    try {
      if (isResetPassword) {
        await sendPasswordResetEmail(auth, email);
        setSuccessMsg('Password reset link sent to your email.');
        setIsResetPassword(false);
      } else if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        setUser({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: displayName || userCredential.user.email?.split('@')[0] || 'Manager',
          photoURL: userCredential.user.photoURL,
        });
        navigate('/');
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        setUser({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName || userCredential.user.email?.split('@')[0] || 'Manager',
          photoURL: userCredential.user.photoURL,
        });
        navigate('/');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    if (!isFirebaseConfigured || !auth) {
      handleDemoSignIn();
      setLoading(false);
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || result.user.email?.split('@')[0] || 'Manager',
        photoURL: result.user.photoURL,
      });
      navigate('/');
    } catch (err: any) {
      console.error('Google auth error:', err);
      setError(err.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-950 text-slate-100 select-none">
      {/* Left Column: Animated Digital Twin Branding Graphic */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-gradient-to-br from-navy-950 via-slate-900 to-indigo-950 border-r border-slate-800 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Logo */}
        <div className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-blue-600 to-teal-400 p-[2px] shadow-lg shadow-blue-500/30">
            <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-teal-400" />
            </div>
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white">
              ChainTwin<span className="text-teal-400"> AI</span>
            </span>
            <span className="block text-[11px] font-medium text-slate-400 tracking-wider uppercase">
              Autonomous Supply Chain Twin
            </span>
          </div>
        </div>

        {/* Center: Interactive Mini Twin Graphic */}
        <div className="relative my-auto flex flex-col items-center justify-center py-12 z-10">
          <div className="relative w-80 h-72 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md p-6 shadow-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-mono font-semibold text-emerald-400">
                  REAL-TIME NETWORK TWIN
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">6 Stages Active</span>
            </div>

            {/* Simulated Stage Pathway */}
            <div className="space-y-3.5 my-3">
              {[
                { label: 'Supplier (Coimbatore)', status: 'Active (SUP-01)', color: 'text-blue-400' },
                { label: 'Knitting Factory (Tiruppur Unit 1)', status: 'Cover: 5.8 Days', color: 'text-teal-400' },
                { label: 'Regional DC (Chennai Ambattur)', status: 'Orders in Flight', color: 'text-indigo-400' },
                { label: 'Retail Delivery (Madras Mart)', status: 'SLA Protected (100%)', color: 'text-emerald-400' },
              ].map((step, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-700" />
                    <span className="text-slate-300">{step.label}</span>
                  </div>
                  <span className={`font-mono text-[11px] font-semibold ${step.color}`}>
                    {step.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Multi-tier candidate optimizer running in Web Worker</span>
            </div>
          </div>
        </div>

        {/* Bottom Tagline & Features */}
        <div className="z-10 space-y-2">
          <p className="text-sm font-semibold text-white">
            Autonomous Digital Twin Recovery Agent
          </p>
          <p className="text-xs text-slate-400 max-w-md leading-relaxed">
            Detect disruptions across multi-tier dependencies, simulate stockout cascades in real-time, and orchestrate verified mathematical recovery plans with plain-language explainability.
          </p>
        </div>
      </div>

      {/* Right Column: Sign In / Sign Up Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 bg-slate-900/40">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {isResetPassword
                ? 'Reset Password'
                : isSignUp
                ? 'Create Plant Manager Account'
                : 'Welcome to ChainTwin AI'}
            </h2>
            <p className="text-xs text-slate-400">
              {isResetPassword
                ? 'Enter your registered email to receive recovery instructions.'
                : isSignUp
                ? 'Register your company credentials to initialize your private workspace.'
                : 'Sign in to monitor live digital twin telemetry and recovery scenarios.'}
            </p>
          </div>

          {/* Quick Demo Access Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/30 to-teal-900/30 border border-teal-500/30 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Hackathon One-Click Demo Mode
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-500/20 text-teal-300">
                Instant Access
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Launch immediately with the preloaded Tiruppur Cotton T-Shirt synthetic supply chain dataset. No Firebase registration required.
            </p>
            <button
              onClick={handleDemoSignIn}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition-all active:scale-98"
            >
              <span>Launch Live Digital Twin Demo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex-1 h-px bg-slate-800" />
            <span>OR SIGN IN WITH CREDENTIALS</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {isSignUp && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. K. Raghavan"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="manager@tiruppur-garments.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {!isResetPassword && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => setIsResetPassword(true)}
                    className="text-[11px] text-blue-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              {loading
                ? 'Processing...'
                : isResetPassword
                ? 'Send Reset Link'
                : isSignUp
                ? 'Create Workspace Account'
                : 'Sign In with Email'}
            </button>

            {/* Google Provider Button */}
            {!isResetPassword && (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium flex items-center justify-center gap-2 border border-slate-700 transition-colors"
              >
                <Globe className="w-4 h-4 text-blue-400" />
                <span>Continue with Google</span>
              </button>
            )}
          </form>

          {/* Toggle between Sign In / Sign Up */}
          <div className="text-center text-xs text-slate-400">
            {isResetPassword ? (
              <button
                onClick={() => setIsResetPassword(false)}
                className="text-blue-400 hover:underline"
              >
                Back to Sign In
              </button>
            ) : isSignUp ? (
              <span>
                Already have an account?{' '}
                <button
                  onClick={() => setIsSignUp(false)}
                  className="text-blue-400 font-semibold hover:underline"
                >
                  Sign In
                </button>
              </span>
            ) : (
              <span>
                New to ChainTwin AI?{' '}
                <button
                  onClick={() => setIsSignUp(true)}
                  className="text-blue-400 font-semibold hover:underline"
                >
                  Create an account
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
