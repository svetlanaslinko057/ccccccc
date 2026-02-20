import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        toast.success(t('loginSuccess'));
        
        // Redirect based on user role
        const user = JSON.parse(localStorage.getItem('user'));
        if (user.role === 'admin') {
          navigate('/admin');
        } else if (user.role === 'seller') {
          navigate('/seller/dashboard');
        } else {
          // Regular users go to their profile
          navigate('/profile');
        }
      } else {
        // Переводим сообщение об ошибке
        let errorMsg = result.error;
        if (errorMsg.includes('Invalid credentials')) {
          errorMsg = t('loginFailed') + ': ' + (language === 'ua' ? 'Невірний email або пароль' : 'Неверный email или пароль');
        } else if (errorMsg.includes('User not found')) {
          errorMsg = language === 'ua' ? 'Користувача не знайдено' : 'Пользователь не найден';
        } else if (!errorMsg.includes('Помилка') && !errorMsg.includes('Ошибка')) {
          errorMsg = t('loginFailed');
        }
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMsg = language === 'ua' ? 'Помилка підключення до серверу' : 'Ошибка подключения к серверу';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="login-page" className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-md w-full space-y-8 animate-fadeIn">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl transform rotate-3 hover:rotate-0 transition-transform">
              <span className="text-4xl">👋</span>
            </div>
          </div>
          <h2 data-testid="login-title" className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {t('welcomeBack')}
          </h2>
          <p className="mt-3 text-gray-600 text-lg">{t('signInToAccount')}</p>
        </div>

        <form data-testid="login-form" onSubmit={handleSubmit} className="mt-8 space-y-6 bg-white/80 backdrop-blur-lg p-10 rounded-3xl shadow-2xl border border-white/20">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">{t('emailAddress')}</Label>
              <Input
                data-testid="email-input"
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                data-testid="password-input"
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1"
              />
            </div>
          </div>

          <Button 
            data-testid="submit-button" 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl text-lg font-bold shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95" 
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                {t('signingIn')}
              </span>
            ) : (
              t('signIn')
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">або</span>
            </div>
          </div>

          <p className="text-center text-base text-gray-600">
            {t('dontHaveAccount')}{' '}
            <Link data-testid="register-link" to="/register" className="text-blue-600 hover:text-purple-600 font-bold hover:underline transition-colors">
              {t('signUp')} →
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;