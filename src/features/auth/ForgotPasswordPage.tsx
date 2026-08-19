import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { useAuth } from '../../shared/lib/AuthContext';
import { ArrowLeft, Mail, CheckCircle2, Loader2 } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const { resetPasswordForEmail } = useAuth();
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setAuthError(null);
    const { error } = await resetPasswordForEmail(data.email);
    if (error) {
      setAuthError(error.message || 'Failed to send password reset email');
    } else {
      setSubmittedEmail(data.email);
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
            Reset password
          </h2>
          <p className="text-xs text-secondary">
            Enter your email to receive a password reset link.
          </p>
        </header>

        {submittedEmail ? (
          /* Success State */
          <div className="flex flex-col items-center text-center gap-4 py-4 animate-fade-in">
            <CheckCircle2 className="w-14 h-14 text-cashin" />
            <div className="flex flex-col gap-1">
              <h2 className="font-bold text-lg text-on-surface">Check your email</h2>
              <p className="text-sm text-secondary px-2">
                We have sent a password reset link to <strong className="text-on-surface">{submittedEmail}</strong>.
              </p>
            </div>
            <Link
              to="/login"
              className="w-full h-[44px] bg-primary text-on-primary font-bold text-sm rounded-xl hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 mt-4 shadow-md"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
              <span>Back to Login</span>
            </Link>
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
              <label className="text-xs font-semibold text-on-surface" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register('email')}
                  className={`w-full h-[44px] pl-10 pr-3.5 rounded-[12px] border ${
                    errors.email ? 'border-cashout focus:border-cashout focus:ring-cashout/10' : 'border-outline-variant focus:border-primary focus:ring-primary/10'
                  } focus:ring focus:outline-none text-sm text-on-surface transition-all bg-surface-container-lowest`}
                />
                <Mail className="w-4.5 h-4.5 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              {errors.email && (
                <span className="text-xs font-medium text-cashout mt-1" role="alert">
                  {errors.email.message}
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
                  <span>Sending link...</span>
                </>
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>

            <Link
              to="/login"
              className="w-full h-[44px] bg-surface-container-lowest border border-outline-variant text-on-surface font-semibold text-sm rounded-xl hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2 shadow-sm mt-1"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
              <span>Back to Login</span>
            </Link>
          </form>
        )}
      </main>
    </div>
  );
}
