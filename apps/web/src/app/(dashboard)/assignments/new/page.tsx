'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCreateAssignment, useTopic } from '@/lib/api/client';
import { newAssignmentFormSchema } from '@/lib/validators/schemas';

export default function NewAssignmentPage() {
  const searchParams = useSearchParams();
  const topicId = searchParams.get('topicId');
  const { data: topic } = useTopic(topicId);

  const [essayType, setEssayType] = useState<'situational' | 'continuous'>('situational');
  const [essaySubType, setEssaySubType] = useState('letter');
  const [prompt, setPrompt] = useState('');
  const [wordCountMin, setWordCountMin] = useState(250);
  const [wordCountMax, setWordCountMax] = useState(500);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (topic && !prefilled) {
      const type = topic.essay_type ?? 'situational';
      setEssayType(type);
      setEssaySubType(type === 'situational' ? 'letter' : 'narrative');
      setPrompt(topic.generated_prompts?.prompt ?? '');
      setPrefilled(true);
    }
  }, [topic, prefilled]);

  const handleWordCount = (value: string, setter: (v: number) => void) => {
    const num = parseInt(value, 10);
    setter(isNaN(num) ? 0 : Math.max(0, Math.min(num, 5000)));
  };
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const createAssignment = useCreateAssignment();

  const subTypes =
    essayType === 'situational'
      ? ['letter', 'email', 'report', 'speech', 'proposal']
      : ['narrative', 'expository', 'argumentative', 'descriptive'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const result = newAssignmentFormSchema.safeParse({
      essayType,
      essaySubType,
      prompt,
      wordCountMin,
      wordCountMax,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (!errors[field]) errors[field] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    try {
      const guidingPoints = topic?.generated_prompts?.guidingPoints;
      await createAssignment.mutateAsync({
        essay_type: result.data.essayType,
        essay_sub_type: result.data.essaySubType as any,
        prompt: result.data.prompt,
        word_count_min: result.data.wordCountMin,
        word_count_max: result.data.wordCountMax,
        ...(topicId ? { topic_id: topicId } : {}),
        ...(Array.isArray(guidingPoints) && guidingPoints.length > 0
          ? { guiding_points: guidingPoints }
          : {}),
      });
      router.push('/assignments');
    } catch (err: any) {
      setFieldErrors({ prompt: err?.message || 'Failed to create assignment. Please try again.' });
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-2xl font-bold md:text-3xl">Create Assignment</h1>
      {topic?.generated_prompts?.title && (
        <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">From topic</p>
          <p className="text-sm font-medium">{topic.generated_prompts.title}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-6">
        <div>
          <label className="block text-sm font-medium">Essay Type</label>
          <div className="mt-2 flex gap-3">
            {(['situational', 'continuous'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setEssayType(t);
                  setEssaySubType(t === 'situational' ? 'letter' : 'narrative');
                }}
                className={`rounded-md border px-4 py-2 text-sm capitalize ${
                  essayType === t ? 'border-primary bg-primary/10 text-primary' : 'text-muted-foreground'
                }`}
              >
                {t} Writing
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Sub-type</label>
          <select
            value={essaySubType}
            onChange={(e) => setEssaySubType(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          >
            {subTypes.map((st) => (
              <option key={st} value={st}>
                {st.charAt(0).toUpperCase() + st.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Write a letter to your school principal suggesting ways to reduce energy consumption..."
          />
          {fieldErrors.prompt && (
            <p className="mt-1 text-xs text-destructive">{fieldErrors.prompt}</p>
          )}
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium">Min Words</label>
            <input
              type="number"
              value={wordCountMin}
              onChange={(e) => handleWordCount(e.target.value, setWordCountMin)}
              onBlur={(e) => handleWordCount(e.target.value, setWordCountMin)}
              min={50}
              max={5000}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
            {fieldErrors.wordCountMin && (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.wordCountMin}</p>
            )}
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium">Max Words</label>
            <input
              type="number"
              value={wordCountMax}
              onChange={(e) => handleWordCount(e.target.value, setWordCountMax)}
              onBlur={(e) => handleWordCount(e.target.value, setWordCountMax)}
              min={100}
              max={5000}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
            {fieldErrors.wordCountMax && (
              <p className="mt-1 text-xs text-destructive">{fieldErrors.wordCountMax}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={createAssignment.isPending}
          className="w-full rounded-md bg-primary py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {createAssignment.isPending ? 'Creating...' : 'Create Assignment'}
        </button>
      </form>
    </div>
  );
}
