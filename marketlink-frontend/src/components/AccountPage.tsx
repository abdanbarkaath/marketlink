import Link from 'next/link';
import type { ReactNode } from 'react';

export const accountFieldClass =
  'min-h-12 w-full rounded-lg border border-[#899ab3] bg-white px-3 text-base text-[#192a48] focus-visible:outline-[#2455b5] disabled:bg-slate-100';

export const accountSubmitClass =
  'min-h-12 w-full rounded-lg bg-[#efc3aa] px-5 py-3 text-sm font-bold text-[#192a48] hover:bg-[#f4d0bc] focus-visible:outline-[#2455b5] disabled:opacity-60';

export default function AccountPage({
  mode,
  status,
  children,
}: {
  mode: 'login' | 'signup';
  status?: string;
  children?: ReactNode;
}) {
  const signingIn = mode === 'login';

  return (
    <main className="min-h-[calc(100dvh-72px)] bg-[#f5f7fb] pb-8 sm:pb-12">
      <div className="bg-[#192a48] px-4 pb-14 pt-7 text-white sm:px-6 sm:pb-20 sm:pt-10">
        <div className="mx-auto max-w-[30rem]">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {signingIn ? 'Sign in' : 'Create an account'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#d9e3f1] sm:text-base">
            {signingIn
              ? 'Access your MarketLink account.'
              : 'Create a customer account to connect with local marketing experts.'}
          </p>
        </div>
      </div>

      <div className="mx-auto -mt-8 px-4 sm:-mt-10 sm:px-6">
        <div className="mx-auto max-w-[30rem] rounded-xl border border-slate-200 bg-white p-5 sm:p-8">
          {status ? (
            <p role="status" className="text-sm text-slate-600">{status}</p>
          ) : (
            <>
              {children}
              <div className="mt-5 flex flex-wrap items-center gap-x-2 border-t border-slate-200 pt-2 text-sm text-slate-600">
                <span>{signingIn ? 'Looking for experts?' : 'Already have an account?'}</span>
                <Link
                  href={signingIn ? '/signup' : '/login'}
                  className="inline-flex min-h-11 items-center rounded-sm font-bold text-[#2455b5] underline underline-offset-4 focus-visible:outline-[#2455b5]"
                >
                  {signingIn ? 'Create an account' : 'Sign in'}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
