import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../shared/lib/supabase';
import { Wallet, CheckCircle2, Loader2, Lock, ArrowRight } from 'lucide-react';

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordPage() {
  const [success, setSuccess] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setAuthError(null);
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      setAuthError(error.message || 'Failed to update password');
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="bg-gradient-to-br from-surface via-surface-container-low to-[#fbe8ec] min-h-screen flex items-center justify-center p-4">
      <main className="w-full max-w-md bg-surface-container-lowest rounded-xl border border-outline-variant shadow-ambient p-8 flex flex-col gap-6">
        
        {/* Header */}
        <header className="flex flex-col items-center text-center gap-1">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-on-primary font-bold shadow-ambient mb-2">
            <Wallet className="w-7 h-7" />
          </div>
          <h1 className="font-bold text-2xl text-on-surface">
            Set New Password
          </h1>
          <p className="text-sm text-secondary">
            Please enter your new secure password below.
          </p>
        </header>

        {success ? (
          /* Success State */
          <div className="flex flex-col items-center text-center gap-4 py-4 animate-fade-in">
            <CheckCircle2 className="w-14 h-14 text-cashin" />
            <div className="flex flex-col gap-1">
              <h2 className="font-bold text-lg text-on-surface">Password updated</h2>
              <p className="text-sm text-secondary px-2">
                Your password has been successfully updated. You can now use your new password to sign in.
              </p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full h-[44px] bg-primary text-on-primary font-bold text-sm rounded-xl hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 mt-4 shadow-md"
            >
              <span>Go to Login</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
          </div>
        ) : (
          /* Form State */
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            {authError && (
              <div className="p-3 rounded-lg bg-cashout/10 border border-cashout/20 text-cashout text-xs font-semibold text-center animate-fade-in" role="alert">
                {authError}
              </div>
            )}

            <div className="flex flex-col gap-1 text-left">
              <label className="text-xs font-semibold text-on-surface" htmlFor="password">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full h-[44px] pl-10 pr-3.5 rounded-[12px] border ${
                    errors.password ? 'border-cashout focus:border-cashout focus:ring-cashout/10' : 'border-outline-variant focus:border-primary focus:ring-primary/10'
                  } focus:ring focus:outline-none text-sm text-on-surface transition-all bg-surface-container-lowest`}
                />
                <Lock className="w-4.5 h-4.5 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              {errors.password && (
                <span className="text-xs font-medium text-cashout mt-1" role="alert">
                  {errors.password.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1 text-left">
              <label className="text-xs font-semibold text-on-surface" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                  className={`w-full h-[44px] pl-10 pr-3.5 rounded-[12px] border ${
                    errors.confirmPassword ? 'border-cashout focus:border-cashout focus:ring-cashout/10' : 'border-outline-variant focus:border-primary focus:ring-primary/10'
                  } focus:ring focus:outline-none text-sm text-on-surface transition-all bg-surface-container-lowest`}
                />
                <Lock className="w-4.5 h-4.5 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              {errors.confirmPassword && (
                <span className="text-xs font-medium text-cashout mt-1" role="alert">
                  {errors.confirmPassword.message}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-[44px] bg-primary text-on-primary font-bold text-sm rounded-xl hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 mt-2 shadow-md disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  <span>Updating password...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
