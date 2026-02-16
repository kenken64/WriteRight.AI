'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useParentOnboard, useParentSkipOnboard } from '@/lib/api/client';
import type { ParentType } from '@/lib/validators/schemas';
import { Users, Check, ArrowRight, Link2 } from 'lucide-react';

type Step = 'welcome' | 'enter-code' | 'success';

const CODE_LENGTH = 6;

interface Props {
  displayName: string;
}

export function ParentOnboardFlow({ displayName }: Props) {
  const [step, setStep] = useState<Step>('welcome');
  const [parentType, setParentType] = useState<ParentType>('parent');
  const [codeDigits, setCodeDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [confetti, setConfetti] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const linkChild = useParentOnboard();
  const skipOnboard = useParentSkipOnboard();

  useEffect(() => {
    if (step === 'success') {
      setConfetti(true);
      const timer = setTimeout(() => setConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Focus first input when entering code step
  useEffect(() => {
    if (step === 'enter-code') {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  const submitCode = useCallback((digits: string[]) => {
    const code = digits.join('').toUpperCase();
    if (code.length !== CODE_LENGTH) return;

    linkChild.mutate(
      { inviteCode: code, parentType },
      { onSuccess: () => setStep('success') },
    );
  }, [linkChild, parentType]);

  const handleInputChange = (index: number, value: string) => {
    // Only allow valid characters
    const char = value.slice(-1).toUpperCase();
    if (char && !/^[A-HJ-NP-Z2-9]$/.test(char)) return;

    const newDigits = [...codeDigits];
    newDigits[index] = char;
    setCodeDigits(newDigits);

    // Auto-advance to next input
    if (char && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (char && index === CODE_LENGTH - 1 && newDigits.every(d => d)) {
      submitCode(newDigits);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      const newDigits = [...codeDigits];
      newDigits[index - 1] = '';
      setCodeDigits(newDigits);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, '');
    const chars = pasted.slice(0, CODE_LENGTH).split('');
    const newDigits = [...codeDigits];
    chars.forEach((c, i) => { newDigits[i] = c; });
    setCodeDigits(newDigits);

    // Focus last filled input or next empty
    const nextIndex = Math.min(chars.length, CODE_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();

    // Auto-submit if all filled
    if (newDigits.every(d => d) && newDigits.length === CODE_LENGTH) {
      submitCode(newDigits);
    }
  };

  const handleSkip = () => {
    skipOnboard.mutate(undefined, {
      onSuccess: () => {
        router.push('/assignments');
        router.refresh();
      },
    });
  };

  return (
    <div className="relative w-full max-w-lg">
      {/* Confetti overlay */}
      {confetti && (
        <div className="pointer-events-none absolute inset-0 -top-20 z-10 flex justify-center">
          <div className="text-5xl animate-bounce">🎉</div>
        </div>
      )}

      {/* Progress dots */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {(['welcome', 'enter-code', 'success'] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              s === step ? 'w-8 bg-primary' : i < ['welcome', 'enter-code', 'success'].indexOf(step) ? 'w-2.5 bg-primary/60' : 'w-2.5 bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-xl border bg-white p-8 shadow-sm transition-all duration-300">
        {step === 'welcome' && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Welcome, {displayName}!</h2>
            <p className="mt-3 text-muted-foreground">
              As a parent, you can monitor your child&apos;s essay progress, set rewards, and track their improvement over time.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              To get started, tell us your role and link your account to your child&apos;s using their invite code.
            </p>

            <div className="mt-6 space-y-2">
              <p className="text-sm font-medium text-foreground">I am a...</p>
              {([
                { value: 'parent' as const, label: 'Parent / Guardian' },
                { value: 'school_teacher' as const, label: 'School Teacher' },
                { value: 'tuition_teacher' as const, label: 'Tuition Centre Teacher' },
              ]).map((option) => (
                <button
                  key={option.value}
                  onClick={() => setParentType(option.value)}
                  className={`flex w-full items-center rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                    parentType === option.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 text-muted-foreground hover:border-gray-300'
                  }`}
                >
                  <span className={`mr-3 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                    parentType === option.value
                      ? 'border-primary bg-primary'
                      : 'border-gray-300'
                  }`}>
                    {parentType === option.value && (
                      <span className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </span>
                  {option.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep('enter-code')}
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
            >
              <Link2 className="h-4 w-4" />
              Link My Child&apos;s Account
            </button>

            <div className="mt-4">
              <button
                onClick={handleSkip}
                disabled={skipOnboard.isPending}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {skipOnboard.isPending ? 'Skipping...' : "I'll do this later"}
              </button>
            </div>
          </div>
        )}

        {step === 'enter-code' && (
          <div className="text-center">
            <h2 className="text-xl font-bold">Enter your child&apos;s invite code</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ask your child to share their 6-character invite code from their Settings page.
            </p>

            <div className="mt-8 flex justify-center gap-2" onPaste={handlePaste}>
              {codeDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={`h-14 w-12 rounded-lg border-2 text-center font-mono text-2xl font-bold uppercase transition-all ${
                    digit
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 focus:border-primary'
                  } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                />
              ))}
            </div>

            {linkChild.isError && (
              <p className="mt-4 text-sm text-destructive">{linkChild.error.message}</p>
            )}

            {linkChild.isPending && (
              <p className="mt-4 text-sm text-muted-foreground">Verifying code...</p>
            )}

            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => {
                  setStep('welcome');
                  setCodeDigits(Array(CODE_LENGTH).fill(''));
                  linkChild.reset();
                }}
                className="rounded-lg border px-4 py-2 text-sm text-muted-foreground hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => submitCode(codeDigits)}
                disabled={!codeDigits.every(d => d) || linkChild.isPending}
                className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                Verify & Link
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">Account linked!</h2>
            <p className="mt-3 text-muted-foreground">
              You&apos;re now connected to your child&apos;s account. You can view their assignments, track progress, and set up rewards.
            </p>

            <button
              onClick={() => {
                router.push('/assignments');
                router.refresh();
              }}
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
