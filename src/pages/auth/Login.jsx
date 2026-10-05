import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';

import {
  Building2,
  ShieldCheck,
  Eye,
  EyeOff,
  Users,
  FolderKanban,
  CreditCard,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';

export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const { login } = useAuth();

  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const onSubmit = async (values) => {
    setLoading(true);

    try {
      const identifier = values.identifier.trim();

      if (!identifier) {
        throw new Error('Email or Client ID is required');
      }

      console.log('LOGIN IDENTIFIER:', identifier);

      /*
       * =====================================================
       * LOGIN
       * =====================================================
       *
       * Employee:
       *     lokesh@gmail.com
       *
       * Client:
       *     ZWOLF-CL-123456
       *
       * AuthContext ka login() automatically decide karega:
       *
       * Email
       *     -> /api/auth/login
       *
       * Client ID
       *     -> /api/client-auth/login
       */

      const user = await login(
        identifier,
        values.password
      );

      console.log('LOGIN SUCCESS:', user);

      if (!user?.role) {
        throw new Error('Invalid user role');
      }

      success(`Welcome, ${user.name}!`);

      navigate(`/${user.role}/dashboard`, {
        replace: true,
      });
    } catch (err) {
      console.error('LOGIN ERROR:', err);

      toastError(
        err?.response?.data?.message ||
          err?.message ||
          'Login failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#eef2f7]">
      <div className="flex min-h-screen">

        {/* =====================================================
            CORPORATE BRAND PANEL
        ====================================================== */}

        <section className="relative hidden overflow-hidden bg-[#081426] lg:flex lg:w-[50%]">

          <div className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full bg-blue-600/20 blur-[140px]" />

          <div className="pointer-events-none absolute -bottom-48 -left-40 h-[560px] w-[560px] rounded-full bg-indigo-600/10 blur-[140px]" />

          <div className="pointer-events-none absolute left-[45%] top-[38%] h-[300px] w-[300px] rounded-full bg-blue-500/[0.04] blur-[100px]" />

          {/* Premium Wave */}

          <div className="pointer-events-none absolute right-[-1px] top-0 z-30 h-full w-[75px]">

            <svg
              viewBox="0 0 100 1000"
              preserveAspectRatio="none"
              className="h-full w-full"
            >
              <path
                d="
                  M100 0
                  C58 105 55 195 82 285
                  C108 370 108 445 78 525
                  C50 600 52 685 84 765
                  C108 830 108 920 100 1000
                  L100 1000
                  L100 0
                  Z
                "
                fill="#f8fafc"
              />
            </svg>

          </div>

          {/* Main Content */}

          <div className="relative z-10 flex w-full flex-col justify-between px-12 py-10 xl:px-16 xl:py-12">

            {/* Brand */}

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#081426] shadow-xl">
                  <Building2
                    size={22}
                    strokeWidth={2}
                  />
                </div>

                <div>

                  <div className="text-[17px] font-bold tracking-[0.08em] text-white">
                    ZWOLF
                  </div>

                  <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.25em] text-blue-300">
                    Consultancy Service
                  </div>

                </div>

              </div>

              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Secure Portal
              </div>

            </div>

            {/* Main Content */}

            <div className="max-w-[590px]">

              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                One workspace. Complete control.
              </p>

              <h1 className="text-[42px] font-semibold leading-[1.08] tracking-[-1.5px] text-white xl:text-[54px]">
                Run your business

                <span className="block text-blue-400">
                  with clarity.
                </span>

              </h1>

              <p className="mt-6 max-w-[520px] text-[15px] leading-7 text-slate-400">
                A centralized platform for managing your
                clients, projects, people, payments and
                everyday business operations.
              </p>

              {/* Features */}

              <div className="mt-10 grid grid-cols-3 gap-3">

                <Feature
                  icon={Users}
                  title="People"
                  text="Team management"
                />

                <Feature
                  icon={FolderKanban}
                  title="Projects"
                  text="Work & delivery"
                />

                <Feature
                  icon={CreditCard}
                  title="Finance"
                  text="Payments & tracking"
                />

              </div>

            </div>

            {/* Bottom */}

            <div className="flex items-end justify-between border-t border-white/[0.08] pt-6">

              <div>

                <p className="text-[11px] font-medium text-slate-500">
                  © {new Date().getFullYear()} Zwolf Consultancy Service
                </p>

                <p className="mt-1 text-[10px] text-slate-600">
                  Built for efficient business operations
                </p>

              </div>

              <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-slate-500">

                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                System operational

              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            LOGIN SECTION
        ====================================================== */}

        <main className="flex w-full items-center justify-center bg-[#f8fafc] px-5 py-10 sm:px-8 lg:w-[50%]">

          <div className="w-full max-w-[430px]">

            {/* Mobile Brand */}

            <div className="mb-10 flex items-center gap-3 lg:hidden">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#081426] text-white shadow-lg shadow-slate-900/10">
                <Building2 size={20} />
              </div>

              <div>

                <p className="text-base font-bold tracking-wide text-slate-900">
                  ZWOLF
                </p>

                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-blue-600">
                  Consultancy Service
                </p>

              </div>

            </div>

            {/* Login Card */}

            <div className="relative">

              <div className="pointer-events-none absolute inset-x-6 bottom-[-18px] h-24 rounded-[40px] bg-slate-900/10 blur-2xl" />

              <div className="relative rounded-[28px] border border-white bg-white p-7 shadow-[0_30px_80px_-25px_rgba(15,23,42,0.30)] ring-1 ring-slate-900/[0.03] sm:p-9">

                {/* Top accent */}

                <div className="absolute left-7 right-7 top-0 h-[3px] rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 sm:left-9 sm:right-9" />

                {/* Icon */}

                <div className="flex h-13 w-13 items-center justify-center rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 shadow-sm">

                  <ShieldCheck
                    size={23}
                    strokeWidth={1.9}
                  />

                </div>

                {/* Heading */}

                <div className="mt-6">

                  <h2 className="text-[27px] font-bold tracking-[-0.7px] text-slate-950">
                    Welcome back
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Sign in with your company email or
                    client portal ID.
                  </p>

                </div>

                {/* Form */}

                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="mt-8 space-y-5"
                >

                  {/* Email / Client ID */}

                  <Input
                    label="Email or Client ID"
                    type="text"
                    placeholder="Email or ZWOLF-CL-123456"
                    autoComplete="username"
                    {...register('identifier', {
                      required:
                        'Email or Client ID is required',
                    })}
                    error={errors.identifier?.message}
                  />

                  {/* Password */}

                  <div className="relative">

                    <Input
                      label="Password"
                      type={
                        showPassword
                          ? 'text'
                          : 'password'
                      }
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      {...register('password', {
                        required:
                          'Password is required',
                      })}
                      error={errors.password?.message}
                    />

                    {!errors.password && (
                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            (prev) => !prev
                          )
                        }
                        className="absolute right-3 top-[38px] flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700"
                        aria-label={
                          showPassword
                            ? 'Hide password'
                            : 'Show password'
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    )}

                  </div>

                  {/* Button */}

                  <Button
                    type="submit"
                    loading={loading}
                    disabled={loading}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b1730] py-3.5 text-sm font-semibold text-white shadow-[0_12px_25px_-8px_rgba(11,23,48,0.55)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_16px_30px_-8px_rgba(37,99,235,0.45)] focus:outline-none focus:ring-4 focus:ring-blue-500/15 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-80"
                  >

                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Signing in...
                      </>
                    ) : (
                      <>Sign in</>
                    )}

                  </Button>

                </form>

                {/* Security */}

                <div className="mt-7 rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50 to-white p-3.5 shadow-[0_8px_25px_-18px_rgba(15,23,42,0.35)]">

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm ring-1 ring-slate-100">
                      <ShieldCheck size={16} />
                    </div>

                    <div className="min-w-0">

                      <p className="text-[11px] font-semibold text-slate-700">
                        Secure portal access
                      </p>

                      <p className="mt-0.5 text-[10px] text-slate-400">
                        Authorized users only
                      </p>

                    </div>

                    <div className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1">

                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                      <span className="text-[9px] font-semibold uppercase tracking-wide text-emerald-600">
                        Secure
                      </span>

                    </div>

                  </div>

                </div>

              </div>

            </div>

            {/* Footer */}

            <div className="mt-7 flex items-center justify-center gap-2 text-[10px] text-slate-400">

              <span>ZWOLF</span>

              <span className="h-1 w-1 rounded-full bg-slate-300" />

              <span>Management System</span>

              <span className="h-1 w-1 rounded-full bg-slate-300" />

              <span>Secure Portal</span>

            </div>

          </div>

        </main>

      </div>
    </div>
  );
}


/* =============================================================
   FEATURE COMPONENT
============================================================= */

function Feature({ icon: Icon, title, text }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.035] p-4 transition-colors duration-200 hover:bg-white/[0.06]">

      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
        <Icon size={16} />
      </div>

      <p className="mt-3 text-xs font-semibold text-white">
        {title}
      </p>

      <p className="mt-1 text-[10px] text-slate-500">
        {text}
      </p>

    </div>
  );
}