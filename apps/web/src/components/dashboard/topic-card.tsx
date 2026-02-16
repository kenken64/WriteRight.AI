'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Topic } from '@/lib/validators/schemas';
import { useUpdateTopic, useDeleteTopic } from '@/lib/api/client';

const categories = [
  'environment', 'technology', 'social_issues',
  'education', 'health', 'current_affairs',
] as const;

const essayTypes = ['situational', 'continuous'] as const;

interface TopicCardProps {
  topic: Topic;
  isOwner: boolean;
}

export function TopicCard({ topic, isOwner }: TopicCardProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(topic.generated_prompts?.title ?? '');
  const [prompt, setPrompt] = useState(topic.generated_prompts?.prompt ?? '');
  const [category, setCategory] = useState(topic.category ?? '');
  const [essayType, setEssayType] = useState(topic.essay_type);

  const updateTopic = useUpdateTopic();
  const deleteTopic = useDeleteTopic();

  const handleSave = async () => {
    await updateTopic.mutateAsync({
      id: topic.id,
      category: (category || null) as Topic['category'],
      essay_type: essayType as Topic['essay_type'],
      generated_prompts: {
        ...topic.generated_prompts,
        title,
        prompt,
      },
    });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this topic?')) return;
    await deleteTopic.mutateAsync(topic.id);
  };

  const handleCancel = () => {
    setTitle(topic.generated_prompts?.title ?? '');
    setPrompt(topic.generated_prompts?.prompt ?? '');
    setCategory(topic.category ?? '');
    setEssayType(topic.essay_type);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="rounded-lg border bg-white p-4">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground">Essay Type</label>
              <select
                value={essayType}
                onChange={(e) => setEssayType(e.target.value as Topic['essay_type'])}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              >
                {essayTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={updateTopic.isPending}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {updateTopic.isPending ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              className="rounded-md border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-start justify-between">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
            {topic.category?.replace('_', ' ') ?? 'General'}
          </span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary capitalize">
            {topic.essay_type}
          </span>
        </div>
        {isOwner && (
          <div className="flex gap-1">
            <button
              onClick={() => setEditing(true)}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Edit topic"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteTopic.isPending}
              className="rounded-md p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              title="Delete topic"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        )}
      </div>
      <div className="mt-3">
        {topic.generated_prompts?.title && (
          <p className="font-medium text-sm">{topic.generated_prompts.title}</p>
        )}
        {topic.generated_prompts?.prompt && (
          <p className="mt-1 text-sm text-muted-foreground">{topic.generated_prompts.prompt}</p>
        )}
        {Array.isArray(topic.generated_prompts?.guidingPoints) && (
          <ul className="mt-2 list-disc pl-4 text-xs text-muted-foreground">
            {topic.generated_prompts.guidingPoints.slice(0, 3).map((gp: string, i: number) => (
              <li key={i}>{gp}</li>
            ))}
          </ul>
        )}
        {!topic.generated_prompts?.title && !topic.generated_prompts?.prompt && (
          <p className="text-sm text-muted-foreground italic">No prompt content generated yet</p>
        )}
      </div>
      <div className="mt-3 border-t pt-3">
        <Link
          href={`/assignments/new?topicId=${topic.id}`}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/></svg>
          Assign
        </Link>
      </div>
    </div>
  );
}
