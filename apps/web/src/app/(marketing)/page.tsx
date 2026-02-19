import Link from 'next/link';
import { AnimatedCounter } from '@/components/marketing/animated-counter';
import { AnimatedCard } from '@/components/ui/animated-card';
import { StickyCta } from '@/components/marketing/sticky-cta';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-[60px] max-w-[1080px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <img src="/logo.jpg" alt="WriteRight AI" className="h-8 w-8 rounded-full object-cover" />
            WriteRight <span className="text-blue-600">SG</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="#how-it-works" className="hidden rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900 sm:inline-block">
              How It Works
            </Link>
            <Link href="#pricing" className="hidden rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900 sm:inline-block">
              Pricing
            </Link>
            <Link href="#faq" className="hidden rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900 sm:inline-block">
              FAQ
            </Link>
            <Link href="/login" className="ml-1 rounded-[10px] border-[1.5px] border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600">
              Log in
            </Link>
            <Link href="/register" className="rounded-[10px] bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition-all hover:-translate-y-px hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/30">
              Try Free
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section id="hero" className="relative overflow-hidden px-6 pb-16 pt-20 text-center sm:pb-16 sm:pt-20">
          <div className="pointer-events-none absolute left-1/2 top-[-120px] h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-blue-600/[0.06] blur-none" style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)' }} />
          <div className="relative">
            <div className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-semibold text-blue-600">
              🎓 Aligned to MOE 1184 Syllabus
            </div>
            <h1 className="mx-auto max-w-[700px] text-4xl font-extrabold leading-[1.15] tracking-tight sm:text-5xl">
              Better essays, better grades
              <br />
              <span className="bg-gradient-to-br from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                — in minutes, not months
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-[540px] text-lg leading-relaxed text-gray-500">
              Submit an essay, get a score, feedback, and a model rewrite in under 2 minutes. Scored to Singapore&apos;s MOE marking scheme.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/register" className="rounded-xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-px hover:bg-blue-700 hover:shadow-blue-600/40">
                Try a Sample Essay — Free
              </Link>
              <Link href="/register" className="rounded-xl border-[1.5px] border-gray-200 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 transition-all hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600">
                Start Free — 3 Essays/Month
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">✅ No credit card required</span>
              <span className="flex items-center gap-1.5">✅ Feedback in under 2 minutes</span>
              <span className="flex items-center gap-1.5">✅ Cancel anytime</span>
            </div>
          </div>
        </section>

        {/* Demo Teaser */}
        <div className="relative z-10 mx-auto -mt-4 max-w-[780px] px-6">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg shadow-black/[0.08]">
            {/* Window chrome */}
            <div className="flex items-center gap-2 border-b bg-gray-50 px-5 py-3 text-xs text-gray-400">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              </div>
              <span className="ml-2">WriteRight — AI Essay Feedback</span>
            </div>
            {/* Two-column demo */}
            <div className="grid min-h-[280px] grid-cols-1 sm:grid-cols-2">
              {/* Left: student essay */}
              <div className="border-b p-6 sm:border-b-0 sm:border-r">
                <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">📝 Student&apos;s Essay</div>
                <p className="text-sm leading-7 text-gray-500">
                  Good morning Mr Chew, teachers and fellow schoolmates. Imagine this: every time you{' '}
                  <span className="rounded bg-yellow-200 px-0.5">switch on a light</span>, you are also
                  switching on pollution. Behind their warm glow lies a costly truth: traditional light bulbs are{' '}
                  <span className="rounded bg-green-200 px-0.5">highly inefficient, wasting huge amounts of energy</span>.
                  The more electricity we use, the more fossil fuels will be burned…
                </p>
              </div>
              {/* Right: AI feedback */}
              <div className="bg-blue-50/60 p-6">
                <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">📊 AI Feedback</div>
                {/* Score bars */}
                {[
                  { label: 'Content', pct: 90, score: '9/10', color: 'bg-green-500', textColor: 'text-green-600' },
                  { label: 'Language', pct: 80, score: '16/20', color: 'bg-green-500', textColor: 'text-green-600' },
                  { label: 'Total', pct: 83, score: '25/30', color: 'bg-blue-600', textColor: 'text-blue-600' },
                ].map((row) => (
                  <div key={row.label} className="mb-2 flex items-center gap-3">
                    <span className="w-[100px] text-sm text-gray-500">{row.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                      <div className={`h-full rounded-full ${row.color}`} style={{ width: `${row.pct}%` }} />
                    </div>
                    <span className={`w-[30px] text-sm font-bold ${row.textColor}`}>{row.score}</span>
                  </div>
                ))}
                {/* Feedback blurb */}
                <div className="mt-4 rounded-lg border border-green-200 bg-white p-3 text-xs leading-relaxed text-gray-500">
                  <strong className="text-green-600">💪 Strength:</strong> Excellent rhetorical technique — effective use of questions to build persuasive momentum.
                  <br /><br />
                  <strong className="text-green-600">⚠️ Improve:</strong> &ldquo;the generation that saves Earth, not destroy it&rdquo; → fix parallel structure to &ldquo;not <em>destroys</em> it&rdquo;
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <section id="how-it-works" className="bg-gray-50 py-16 sm:py-20">
          <div className="mx-auto max-w-[1080px] px-6">
            <div className="mb-12 text-center">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">How It Works</h2>
              <p className="mt-2 text-gray-500">Three steps. Under two minutes.</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-3">
              {[
                { num: '1', title: 'Submit', desc: 'Type in our editor, paste text, or snap a photo of handwritten work. Any English essay.' },
                { num: '2', title: 'Get Scored', desc: 'AI scores on Content + Language using MOE 1184 criteria. Paragraph-level feedback with specific quotes.' },
                { num: '3', title: 'Improve', desc: 'See a model rewrite of your essay side-by-side. Understand exactly what "better" looks like.' },
              ].map((step, i) => (
                <AnimatedCard key={step.num} delay={i * 150}>
                  <div className="text-center">
                    <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-blue-100 text-xl font-extrabold text-blue-600">
                      {step.num}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
                    <p className="mx-auto mt-2 max-w-[280px] text-sm text-gray-500">{step.desc}</p>
                  </div>
                </AnimatedCard>
              ))}
            </div>
          </div>
        </section>

        {/* Audience Split — Parents & Students */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-[1080px] px-6">
            <div className="mb-12 text-center">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Built for Your Family</h2>
              <p className="mt-2 text-gray-500">Whether you&apos;re the parent guiding or the student writing</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                {
                  icon: '👨‍👩‍👧',
                  title: 'For Parents',
                  subtitle: 'See your child improve — without hovering',
                  items: [
                    'Track scores and progress trends at a glance',
                    'Set assignments in 30 seconds — pick a topic or use ours',
                    'Costs less than a single tuition session per month',
                    'Motivate with family rewards tied to real achievements',
                  ],
                },
                {
                  icon: '🎓',
                  title: 'For Students',
                  subtitle: 'Know exactly what to fix — and how',
                  items: [
                    'Get detailed feedback in 2 minutes, not 2 weeks',
                    'See a model rewrite so you learn from every essay',
                    'Earn achievements and build your streak',
                    'Real-time AI coaching while you write in the editor',
                  ],
                },
              ].map((card) => (
                <AnimatedCard key={card.title}>
                  <div className="rounded-2xl border border-gray-200 bg-white p-8">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                      {card.icon} {card.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-400">{card.subtitle}</p>
                    <ul className="mt-5 space-y-2">
                      {card.items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-gray-500">
                          <span className="mt-0.5 font-bold text-green-500">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </AnimatedCard>
              ))}
            </div>
          </div>
        </section>

        {/* Why WriteRight Works — Benefit Stack */}
        <section className="bg-gray-50 py-16 sm:py-20">
          <div className="mx-auto max-w-[1080px] px-6">
            <div className="mb-12 text-center">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Why WriteRight Works</h2>
              <p className="mt-2 text-gray-500">Specific feedback, not vague encouragement</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {[
                {
                  icon: '🎯',
                  title: 'Know exactly where to improve',
                  desc: 'Paragraph-level scoring across Content, Language, and Organisation — aligned to MOE 1184 marking scheme.',
                  proof: 'Try it free — paste any essay and see the breakdown',
                },
                {
                  icon: '✨',
                  title: 'See what "good" looks like',
                  desc: 'AI rewrites your essay with improvements highlighted. Side-by-side comparison so you learn from every attempt.',
                  proof: 'Model rewrite included with every submission',
                },
                {
                  icon: '📈',
                  title: 'Track progress over time',
                  desc: 'Score history, trend charts, and error patterns. Parents and students both see improvement — backed by data.',
                  proof: 'Progress dashboard for parents and students',
                },
              ].map((b, i) => (
                <AnimatedCard key={b.title} delay={i * 150}>
                  <div className="rounded-2xl border border-gray-200 bg-white p-7">
                    <div className="text-3xl">{b.icon}</div>
                    <h3 className="mt-3 font-bold text-gray-900">{b.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{b.desc}</p>
                    <div className="mt-3 border-t pt-3 text-xs font-semibold text-blue-600">
                      → {b.proof}
                    </div>
                  </div>
                </AnimatedCard>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-16 sm:py-20">
          <div className="mx-auto max-w-[1080px] px-6">
            <div className="mb-12 text-center">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Simple, Fair Pricing</h2>
              <p className="mt-2 text-gray-500">Start free. Upgrade when you see results.</p>
            </div>
            <div className="mx-auto grid max-w-[720px] gap-6 sm:grid-cols-2">
              {/* Free */}
              <div className="rounded-2xl border border-gray-200 bg-white p-8">
                <h3 className="text-lg font-bold text-gray-900">Free</h3>
                <div className="mt-2 text-4xl font-extrabold text-gray-900">$0</div>
                <p className="mt-1 text-sm text-gray-400">Try it out, no commitment</p>
                <ul className="mt-5 space-y-2.5 text-sm text-gray-500">
                  <li className="flex items-center gap-2"><span className="font-bold text-green-500">✓</span> 3 essay submissions per month</li>
                  <li className="flex items-center gap-2"><span className="font-bold text-green-500">✓</span> Full AI scoring + feedback</li>
                  <li className="flex items-center gap-2"><span className="font-bold text-green-500">✓</span> Model rewrite (view only)</li>
                  <li className="flex items-center gap-2"><span className="font-bold text-green-500">✓</span> Basic progress tracking</li>
                </ul>
                <Link href="/register" className="mt-6 block rounded-xl border-[1.5px] border-gray-200 py-3 text-center text-sm font-semibold text-gray-700 transition-all hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600">
                  Start Free
                </Link>
              </div>
              {/* Plus */}
              <div className="relative rounded-2xl border-2 border-blue-600 bg-white p-8 shadow-lg shadow-blue-600/10">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
                  Most Popular
                </div>
                <h3 className="text-lg font-bold text-gray-900">WriteRight Plus</h3>
                <div className="mt-2">
                  <span className="text-4xl font-extrabold text-gray-900">$14.90</span>
                  <span className="text-sm text-gray-400"> /month</span>
                </div>
                <p className="mt-1 text-sm text-gray-400">Everything for serious improvement</p>
                <ul className="mt-5 space-y-2.5 text-sm text-gray-500">
                  <li className="flex items-center gap-2"><span className="font-bold text-green-500">✓</span> <strong>Unlimited</strong> submissions</li>
                  <li className="flex items-center gap-2"><span className="font-bold text-green-500">✓</span> Full rewrite with copy + export</li>
                  <li className="flex items-center gap-2"><span className="font-bold text-green-500">✓</span> Unlimited topic generation</li>
                  <li className="flex items-center gap-2"><span className="font-bold text-green-500">✓</span> Full analytics + trend history</li>
                  <li className="flex items-center gap-2"><span className="font-bold text-green-500">✓</span> Priority feedback (&lt;2 min)</li>
                  <li className="flex items-center gap-2"><span className="font-bold text-green-500">✓</span> Up to 3 student profiles</li>
                  <li className="flex items-center gap-2"><span className="font-bold text-green-500">✓</span> Family rewards system</li>
                </ul>
                <Link href="/register" className="mt-6 block rounded-xl bg-blue-600 py-3 text-center text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-px hover:bg-blue-700">
                  Start 7-Day Free Trial
                </Link>
              </div>
            </div>
            <p className="mx-auto mt-6 max-w-[720px] text-center text-sm text-gray-400">
              💡 <strong className="text-gray-700">$14.90/month</strong> — that&apos;s the price of one bowl of laksa.
              <br />One English tuition session costs $60–120.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="bg-gray-50 py-16 sm:py-20">
          <div className="mx-auto max-w-[1080px] px-6">
            <div className="mb-12 text-center">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Frequently Asked Questions</h2>
            </div>
            <div className="mx-auto max-w-[700px] divide-y divide-gray-200">
              {[
                {
                  q: 'How does the AI score essays?',
                  a: "WriteRight uses GPT-4o fine-tuned on Singapore's MOE 1184 English Language marking scheme. Essays are scored on Task Fulfilment (10 marks) and Language (20 marks) for a total of 30. Feedback references specific paragraphs from your essay.",
                },
                {
                  q: 'Is it really aligned to MOE standards?',
                  a: "Yes. Our scoring rubric is modelled directly on the MOE 1184 Situational Writing and Continuous Writing criteria used in O-Level English. We score Content, Language, Organisation, and Tone/Register — the same dimensions your school uses.",
                },
                {
                  q: 'What levels does it support?',
                  a: "Currently Sec 1 through Sec 5 (O-Level track). We're working on JC (A-Level GP) support — join the waitlist to be notified.",
                },
                {
                  q: 'Is my child\'s data safe?',
                  a: 'Absolutely. All data is encrypted and stored securely. We never share or sell student data. Essays are processed by AI for scoring only and are not used to train models.',
                },
                {
                  q: 'Can I cancel anytime?',
                  a: 'Yes, cancel with one click from your account settings. No lock-in, no penalty. Your free tier access continues after cancellation.',
                },
                {
                  q: 'Can my child upload handwritten essays?',
                  a: 'Yes! Take a photo of handwritten work and our OCR (optical character recognition) will transcribe it. You can review and edit the transcription before submitting for grading.',
                },
                {
                  q: 'How is this different from ChatGPT?',
                  a: "ChatGPT gives generic writing feedback. WriteRight scores specifically against Singapore's MOE rubric with band scores, tracks progress over time, provides structured model rewrites, and has parent dashboards + student gamification. It's purpose-built for SG English essays.",
                },
              ].map((faq) => (
                <details key={faq.q} className="group">
                  <summary className="flex cursor-pointer items-center justify-between py-5 text-base font-semibold text-gray-900">
                    {faq.q}
                    <span className="ml-4 text-xl text-gray-400 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="pb-5 text-sm leading-relaxed text-gray-500">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-gradient-to-br from-blue-600 to-indigo-600 px-6 py-16 text-center text-white">
          <h2 className="text-2xl font-bold sm:text-3xl">Better essays start here</h2>
          <p className="mt-2 text-blue-100">Paste any essay and see the AI feedback in under 2 minutes. Free, no signup required.</p>
          <Link href="/register" className="mt-6 inline-block rounded-xl bg-white px-8 py-3.5 text-base font-bold text-blue-600 transition-all hover:-translate-y-px hover:bg-blue-50">
            Try a Sample Essay — Free
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-[1080px] px-6">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            <Link href="#" className="hover:text-gray-700">About</Link>
            <Link href="#faq" className="hover:text-gray-700">FAQ</Link>
            <Link href="#" className="hover:text-gray-700">Terms of Service</Link>
            <Link href="#" className="hover:text-gray-700">Privacy Policy</Link>
            <Link href="#" className="hover:text-gray-700">Contact</Link>
          </div>
          <p className="mt-3 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} WriteRight SG. Built for Singapore students.
          </p>
        </div>
      </footer>

      {/* Sticky CTA for mobile */}
      <StickyCta />
    </div>
  );
}
