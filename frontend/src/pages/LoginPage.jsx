import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';
import { Shield, Lock, Eye, EyeOff, Users, Lightbulb, TrendingUp, User } from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';

export const LoginPage = () => {
  const { t } = useLanguageStore();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login, error, isLoading, clearError, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
    return () => {
      clearError();
    };
  }, [user, navigate, clearError]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(formData);
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-['Inter',sans-serif] text-slate-900 relative bg-[#F4F7FB] overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white via-[#e8f0fe] to-[#f4e8fe] opacity-60"></div>
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-[#cae0ff] blur-[120px] rounded-full opacity-40"></div>
        <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-[#e3d1ff] blur-[150px] rounded-full opacity-30"></div>
      </div>

      {/* Strategic Banner */}
      <div className="w-full bg-[#0F2C59] text-white py-2 px-6 relative z-20 flex justify-center items-center text-[11px] font-bold tracking-widest uppercase">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-blue-300" />
          <span>{t('loginPage.banner')}</span>
        </div>
        
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3">
          <LanguageSwitcher />
        </div>
      </div>

      <main className="flex-grow flex items-center justify-center relative px-6 py-12 z-10">
        <div className="max-w-[1400px] w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Content */}
          <section className="hidden lg:flex flex-col justify-center space-y-12 pr-12">
            <div className="space-y-6">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#e3eefa] text-[#0F2C59] text-[11px] font-bold tracking-widest uppercase shadow-sm">
                {t('loginPage.banner')}
              </div>
              <h1 className="text-[4rem] font-bold tracking-tight leading-[1.1] text-[#0F2C59]">
                HCLTech <span className="text-slate-300 font-light">×</span> ANZ <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1b4cc4] to-[#7127FF]">{t('loginPage.title_highlight')}</span>
              </h1>
              <div className="h-1.5 w-24 bg-gradient-to-r from-[#1b4cc4] to-[#7127FF] rounded-full"></div>
              <p className="text-[1.1rem] text-slate-500 max-w-lg leading-relaxed font-medium">
                {t('loginPage.description')}
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-6 pt-4">
              {[
                { icon: Users, labelKey: "joint_rd", subKey: "initiatives" },
                { icon: Lightbulb, labelKey: "future_ready", subKey: "solutions" },
                { icon: Shield, labelKey: "secure", subKey: "infrastructure" },
                { icon: TrendingUp, labelKey: "scalable", subKey: "impact" }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 bg-white/50 backdrop-blur-sm rounded-[24px] shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-white">
                  <div className="w-12 h-12 flex items-center justify-center bg-white rounded-full text-[#1b4cc4] shadow-sm">
                    <item.icon size={22} strokeWidth={2} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0F2C59] text-sm leading-tight">{t(`loginPage.features.${item.labelKey}`)}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold tracking-wider">{t(`loginPage.features.${item.subKey}`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Login Card */}
          <section className="w-full max-w-[480px] mx-auto lg:ml-auto flex flex-col justify-center">
            <div className="bg-white rounded-[40px] p-10 md:p-14 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden border border-white/50">
              <div className="text-center mb-10 space-y-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-[20px] bg-white border-2 border-[#e8f0fe] shadow-sm mx-auto">
                  <Lock size={28} strokeWidth={1.5} className="text-[#0F2C59]" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-[1.75rem] font-bold text-[#0F2C59] leading-tight">{t('loginPage.welcome')} <br /> {t('loginPage.welcome_highlight')}</h2>
                  <p className="text-slate-500 text-sm font-medium">{t('loginPage.subtitle')}</p>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-[16px] bg-red-50 border border-red-100 text-red-600 text-sm font-semibold text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email / Username */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-2" htmlFor="username">
                    {t('loginPage.email_username')}
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400">
                      <User size={20} strokeWidth={2} />
                    </div>
                    <input
                      className="block w-full pl-14 pr-5 py-4 bg-[#f4f7fb] border border-transparent rounded-[16px] text-[#0F2C59] font-semibold text-sm placeholder-slate-400 focus:bg-white focus:border-[#cae0ff] focus:ring-4 focus:ring-[#cae0ff]/30 outline-none transition-all"
                      id="username"
                      name="username"
                      type="text"
                      placeholder={t('loginPage.email_placeholder')}
                      value={formData.username}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-2" htmlFor="password">
                    {t('loginPage.password')}
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400">
                      <Lock size={20} strokeWidth={2} />
                    </div>
                    <input
                      className="block w-full pl-14 pr-12 py-4 bg-[#f4f7fb] border border-transparent rounded-[16px] text-[#0F2C59] font-semibold text-sm placeholder-slate-400 focus:bg-white focus:border-[#cae0ff] focus:ring-4 focus:ring-[#cae0ff]/30 outline-none transition-all"
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('loginPage.password_placeholder')}
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 hover:text-[#0F2C59] transition-colors"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
                    </button>
                  </div>
                </div>

                {/* Options */}
                <div className="flex items-center justify-between px-2 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        className="peer appearance-none w-4 h-4 rounded-[4px] border-2 border-slate-300 checked:bg-[#0F2C59] checked:border-[#0F2C59] transition-all cursor-pointer"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-slate-500">{t('loginPage.remember_me')}</span>
                  </label>
                  <a href="#" className="text-sm font-bold text-[#1b4cc4] hover:underline">
                    {t('loginPage.forgot_password')}
                  </a>
                </div>

                {/* Submit */}
                <button
                  className="w-full bg-[#0F2C59] text-white font-bold py-4 rounded-[16px] shadow-md hover:bg-[#153b75] hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? t('loginPage.signing_in') : t('loginPage.sign_in')}
                </button>
              </form>

              <div className="mt-10 flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <Shield size={14} className="text-[#1b4cc4]" />
                  {t('loginPage.secure_access')}
                </div>
                <div className="text-[9px] font-semibold text-slate-300 uppercase tracking-widest">
                  {t('loginPage.authorized_only')}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
