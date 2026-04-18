// src/pages/auth/LoginPage.jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Wrench, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async ({ email, senha }) => {
    try {
      await login(email, senha);
      toast.success('Bem-vindo!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Credenciais inválidas';
      toast.error(msg);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'var(--color-surface-900)',
        backgroundImage: `
          radial-gradient(ellipse 80% 50% at 50% -20%, rgba(14,165,233,0.08) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 80% 80%, rgba(14,165,233,0.04) 0%, transparent 50%)
        `,
      }}
    >
      {/* Grid pattern overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(14,165,233,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.03) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{
              background: 'linear-gradient(135deg, var(--color-brand-600), var(--color-brand-500))',
              boxShadow: '0 0 32px rgba(14,165,233,0.25)',
            }}
          >
            <Wrench size={24} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
            Gerenciador de Manutenção
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Acesse com suas credenciais
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'var(--color-surface-800)',
            border: '1px solid var(--color-border-light)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
          }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            {/* E-mail */}
            <div>
              <label className="label">E-mail</label>
              <input
                type="email"
                className="input"
                placeholder="seu@email.com"
                autoComplete="email"
                {...register('email', {
                  required: 'E-mail obrigatório',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'E-mail inválido' },
                })}
              />
              {errors.email && <p className="field-error">{errors.email.message}</p>}
            </div>

            {/* Senha */}
            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ paddingRight: '2.5rem' }}
                  {...register('senha', { required: 'Senha obrigatória' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.senha && <p className="field-error">{errors.senha.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-lg w-full mt-1"
              style={{ boxShadow: '0 4px 16px rgba(14,165,233,0.2)' }}
            >
              {isSubmitting ? (
                <><Loader2 size={18} className="animate-spin" /> Entrando...</>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-5" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          Sistema interno — acesso restrito
        </p>
      </div>
    </div>
  );
}
