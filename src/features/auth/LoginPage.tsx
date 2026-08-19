import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { useAuth } from '../../shared/lib/AuthContext';
import { supabase } from '../../shared/lib/supabase';
import { ArrowRight, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { signInWithPassword } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setAuthError(null);
    const { error } = await signInWithPassword(data.email, data.password);
    if (error) {
      setAuthError(error.message || 'Invalid email or password');
    }
  };



  const handleGoogleSignIn = async () => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      setAuthError(error.message);
    }
  };

  return (
    <div className="bg-gradient-to-br from-surface via-surface-container-low to-[#fbe8ec] min-h-screen flex items-center justify-center p-4">
      <main className="w-full max-w-md bg-surface-container-lowest rounded-xl border border-outline-variant shadow-ambient p-8 flex flex-col gap-6">
        
        {/* Header */}
        <header className="flex flex-col items-center text-center gap-1.5">
          <div className="flex items-center gap-2.5 mb-2">
            <img src="/logo.png" alt="CashTrack Logo" className="w-10 h-10 object-contain rounded-xl shadow-ambient" />
            <h1 className="font-bold text-2xl text-primary tracking-tight">CashTrack</h1>
          </div>
          <h2 className="font-bold text-lg text-on-surface leading-tight">
            Welcome back
          </h2>
          <p className="text-xs text-secondary">
            Log in to manage your finances securely.
          </p>
        </header>

        {/* Auth Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          {authError && (
            <div className="p-3 rounded-lg bg-cashout/10 border border-cashout/20 text-cashout text-xs font-semibold text-center animate-fade-in" role="alert">
              {authError}
            </div>
          )}
          <div className="flex flex-col gap-1 text-left">
            <label className="text-xs font-semibold text-on-surface" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              disabled={isSubmitting}
              {...register('email')}
              className={`w-full h-[44px] px-3.5 rounded-[12px] border ${
                errors.email ? 'border-cashout focus:border-cashout focus:ring-cashout/10' : 'border-outline-variant focus:border-primary focus:ring-primary/10'
              } focus:ring focus:outline-none text-sm text-on-surface transition-all bg-surface-container-lowest disabled:opacity-50`}
            />
            {errors.email && (
              <span className="text-xs font-medium text-cashout mt-1" role="alert">
                {errors.email.message}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1 text-left">
            <label className="text-xs font-semibold text-on-surface" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              disabled={isSubmitting}
              {...register('password')}
              className={`w-full h-[44px] px-3.5 rounded-[12px] border ${
                errors.password ? 'border-cashout focus:border-cashout focus:ring-cashout/10' : 'border-outline-variant focus:border-primary focus:ring-primary/10'
              } focus:ring focus:outline-none text-sm text-on-surface transition-all bg-surface-container-lowest disabled:opacity-50`}
            />
            {errors.password && (
              <span className="text-xs font-medium text-cashout mt-1" role="alert">
                {errors.password.message}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                disabled={isSubmitting}
                {...register('rememberMe')}
                className="w-4 h-4 rounded text-primary border-outline-variant focus:ring-primary"
              />
              <span className="text-secondary">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-primary hover:underline font-semibold">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-[44px] bg-primary text-on-primary font-bold text-sm rounded-xl hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 mt-2 shadow-md disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <span>Login</span>
                <ArrowRight className="w-4.5 h-4.5" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t border-outline-variant"></div>
          <span className="flex-shrink-0 px-4 text-xs font-medium text-secondary bg-surface-container-lowest">
            Or
          </span>
          <div className="flex-grow border-t border-outline-variant"></div>
        </div>

        {/* Social / Google Auth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSubmitting}
          className="w-full h-[44px] bg-surface-container-lowest border border-outline-variant text-on-surface font-semibold text-sm rounded-xl hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>



        {/* Footer */}
        <p className="text-center text-xs text-secondary">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-primary hover:underline">
            Sign Up
          </Link>
        </p>
      </main>
    </div>
  );
}
