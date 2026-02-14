import Link from 'next/link';
import { AnimatedCounter } from '@/components/marketing/animated-counter';
import { AnimatedCard } from '@/components/ui/animated-card';
import { StickyCta } from '@/components/marketing/sticky-cta';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">✏️</span>
            <span className="text-xl font-bold text-gray-900">WriteRight <span className="text-blue-600">SG</span></span>
          </Link>
          <nav className="flex items-center gap-1.5 sm:gap-3">
            <Link href="/login" className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
              Log in
            </Link>
            <Link
              href="/register"
              className="whitespace-nowrap rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors sm:px-4 sm:py-2.5 sm:text-sm"
            >
              Start Free
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section id="hero" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-blue-100 opacity-40 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-indigo-100 opacity-30 blur-3xl" />
          
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
            <div className="text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700">
                🎓 Aligned to MOE 1184 Syllabus
              </div>
              
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                AI Essay Feedback for
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Singapore Students
                </span>
              </h1>
              
              <p className="mx-auto mt-6 max-w-xl text-base text-gray-500 sm:text-lg leading-relaxed">
                Get instant, rubric-aligned feedback on English essays. Real-time scoring as you write. 
                Track improvement over time. Built specifically for O-Level preparation.
              </p>
              
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
                <Link
                  href="/register"
                  className="w-full rounded-xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 hover:shadow-blue-600/40 transition-all sm:w-auto"
                >
                  Try Free — 3 Essays/Month
                </Link>
                <Link
                  href="#how-it-works"
                  className="w-full rounded-xl border border-gray-200 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors sm:w-auto"
                >
                  See How It Works →
                </Link>
              </div>

              <div className="mt-10 flex items-center justify-center gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-1.5">✅ No credit card required</span>
                <span className="flex items-center gap-1.5">✅ Instant feedback</span>
                <span className="hidden items-center gap-1.5 sm:flex">✅ 70%+ teacher agreement</span>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="border-y bg-gray-50 py-8">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
              {[
                { value: '70%+', label: 'Teacher Agreement' },
                { value: '<5 min', label: 'Feedback Time' },
                { value: '1184', label: 'Syllabus Aligned' },
                { value: '30+', label: 'Achievement Badges' },
              ].map((stat) => (
                <div key={stat.label}>
                  <AnimatedCounter target={stat.value} className="text-2xl font-bold text-blue-600 sm:text-3xl" />
                  <p className="mt-1 text-xs text-gray-500 sm:text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">How WriteRight Works</h2>
              <p className="mt-3 text-gray-500">Three simple steps to better essays</p>
            </div>
            
            <div className="mt-12 grid gap-6 sm:mt-16 sm:grid-cols-3 sm:gap-8">
              {[
                {
                  emoji: '📸',
                  step: '01',
                  title: 'Write or Upload',
                  desc: 'Type your essay in our built-in editor with real-time AI coaching, or snap a photo of your handwritten work.',
                  color: 'bg-blue-50 text-blue-600',
                },
                {
                  emoji: '📊',
                  step: '02',
                  title: 'Get Scored & Feedback',
                  desc: 'Receive band scores for Task Fulfilment and Language, with specific feedback quoting your actual text.',
                  color: 'bg-indigo-50 text-indigo-600',
                },
                {
                  emoji: '🏆',
                  step: '03',
                  title: 'Improve & Earn Rewards',
                  desc: 'Track your progress, earn achievement badges, and unlock rewards from your parents\' wishlist.',
                  color: 'bg-violet-50 text-violet-600',
                },
              ].map((feature, i) => (
                <AnimatedCard key={feature.step} delay={i * 150}>
                  <div className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md sm:p-8">
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.color} text-2xl`}>
                      {feature.emoji}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-gray-300">STEP {feature.step}</div>
                    <h3 className="mt-3 text-lg font-bold text-gray-900">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-500">{feature.desc}</p>
                  </div>
                </AnimatedCard>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="bg-gray-50 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Everything You Need</h2>
              <p className="mt-3 text-gray-500">Built specifically for Singapore English essays</p>
            </div>
            
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { emoji: '✏️', title: 'Built-in Essay Editor', desc: 'Write with real-time AI coaching, grammar highlights, and live scoring' },
                { emoji: '📝', title: 'OCR for Handwriting', desc: 'Snap a photo of handwritten essays — AI reads and grades them' },
                { emoji: '📊', title: 'MOE-Aligned Rubrics', desc: 'Scored on Task Fulfilment (10) + Language (20) = 30 marks' },
                { emoji: '🔄', title: 'Model Rewrites', desc: 'See how to improve with side-by-side comparisons and explanations' },
                { emoji: '🏆', title: 'Achievements & Rewards', desc: 'Earn badges, build wishlists, parents track promises' },
                { emoji: '📈', title: 'Progress Analytics', desc: 'Score trends, error patterns, streak tracking for parents' },
              ].map((f, i) => (
                <AnimatedCard key={f.title} delay={i * 100}>
                  <div className="flex gap-4 rounded-xl border border-gray-100 bg-white p-5 transition-shadow hover:shadow-md">
                    <span className="text-2xl">{f.emoji}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{f.title}</h3>
                      <p className="mt-1 text-sm text-gray-500">{f.desc}</p>
                    </div>
                  </div>
                </AnimatedCard>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">What Parents & Students Say</h2>
              <p className="mt-3 text-gray-500">Real feedback from our community</p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {[
                {
                  quote: 'My son used to dread writing essays. Now he actually asks to do them because of the achievement badges. His scores improved from Band 2 to Band 4 in just two months!',
                  name: 'Mrs. Tan',
                  role: 'Parent',
                  stars: 5,
                },
                {
                  quote: 'The instant feedback is super helpful. I can see exactly where I went wrong and the model rewrite shows me how to fix it. Way better than waiting a week for my teacher.',
                  name: 'Ryan L.',
                  role: 'Student',
                  stars: 5,
                },
                {
                  quote: 'As a working parent, I love being able to track my daughter\'s progress without hovering. The promise system motivates her and I can see real improvement in the analytics.',
                  name: 'Mr. Chua',
                  role: 'Parent',
                  stars: 5,
                },
              ].map((t, i) => (
                <AnimatedCard key={i} delay={i * 150}>
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <div className="flex gap-0.5 text-amber-400">
                      {Array.from({ length: t.stars }).map((_, j) => (
                        <span key={j}>⭐</span>
                      ))}
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-gray-600">
                      <span className="text-2xl text-gray-200">&ldquo;</span>
                      {t.quote}
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                        {t.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                        <span className={`text-xs font-medium ${t.role === 'Parent' ? 'text-blue-600' : 'text-green-600'}`}>
                          {t.role}
                        </span>
                      </div>
                    </div>
                  </div>
                </AnimatedCard>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-gray-50 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Simple, Fair Pricing</h2>
              <p className="mt-3 text-gray-500">Start free, upgrade when you&apos;re ready</p>
            </div>
            
            <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
              {/* Free */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
                <h3 className="text-lg font-semibold text-gray-900">Free</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">$0</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">Perfect for trying out</p>
                <ul className="mt-6 space-y-3 text-sm text-gray-600">
                  <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> 3 submissions per month</li>
                  <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Full marking + feedback</li>
                  <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> AI writing coach</li>
                  <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Rewrite (view only)</li>
                  <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> 30-day analytics</li>
                </ul>
                <Link
                  href="/register"
                  className="mt-8 block rounded-xl border border-gray-200 py-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Get Started Free
                </Link>
              </div>

              {/* Plus */}
              <div className="relative rounded-2xl border-2 border-blue-600 bg-white p-6 shadow-lg shadow-blue-600/10 sm:p-8">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">
                  MOST POPULAR
                </div>
                <h3 className="text-lg font-semibold text-gray-900">WriteRight Plus</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">$14.90</span>
                  <span className="text-sm text-gray-500">/month</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">Everything for serious improvement</p>
                <ul className="mt-6 space-y-3 text-sm text-gray-600">
                  <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">✓</span> <strong>Unlimited</strong> submissions</li>
                  <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">✓</span> Full rewrite + copy/export</li>
                  <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">✓</span> Unlimited topic generation</li>
                  <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">✓</span> Full analytics history</li>
                  <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">✓</span> Priority processing (&lt;3 min)</li>
                  <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">✓</span> Up to 3 student profiles</li>
                  <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">✓</span> Achievement rewards system</li>
                </ul>
                <Link
                  href="/register"
                  className="mt-8 block rounded-xl bg-blue-600 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
                >
                  Start 7-Day Free Trial
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16">
          <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Ready to improve your essays?</h2>
            <p className="mt-3 text-blue-100">Join students across Singapore who are scoring higher with WriteRight.</p>
            <Link
              href="/register"
              className="mt-8 inline-block rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-blue-600 shadow-lg hover:bg-blue-50 transition-colors"
            >
              Get Started Free →
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t bg-gray-50 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="text-lg">✏️</span>
              <span className="font-semibold text-gray-900">WriteRight SG</span>
            </div>
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} WriteRight SG. Built for Singapore students.
            </p>
          </div>
        </div>
      </footer>

      {/* Sticky CTA for mobile */}
      <StickyCta />
    </div>
  );
}
