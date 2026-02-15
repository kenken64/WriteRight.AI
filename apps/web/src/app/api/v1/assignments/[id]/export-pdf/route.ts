import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: assignment } = await supabase
    .from("assignments")
    .select("*, submissions(*, evaluations(*), rewrites(*))")
    .eq("id", id)
    .single();

  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const submission = assignment.submissions?.[0];
  const evaluation = submission?.evaluations?.sort((a: any, b: any) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )?.[0];
  const rewrite = submission?.rewrites?.sort((a: any, b: any) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )?.[0];

  const html = buildReportHtml(assignment, submission, evaluation, rewrite);

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="writeright-report-${id}.html"`,
    },
  });
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildReportHtml(assignment: any, submission: any, evaluation: any, rewrite: any): string {
  const dimensionRows = (evaluation?.dimension_scores ?? [])
    .map((d: any) => `<tr><td>${escapeHtml(d.name)}</td><td>${d.score}/${d.maxScore}</td><td>Band ${d.band}</td><td>${escapeHtml(d.justification)}</td></tr>`)
    .join("");

  const strengthsList = (evaluation?.strengths ?? [])
    .map((s: any) => `<li>${escapeHtml(s.text)}${s.suggestion ? ` — <em>${escapeHtml(s.suggestion)}</em>` : ""}</li>`)
    .join("");

  const weaknessesList = (evaluation?.weaknesses ?? [])
    .map((w: any) => `<li>${escapeHtml(w.text)}${w.quote ? ` ("${escapeHtml(w.quote)}")` : ""}${w.suggestion ? ` → <em>${escapeHtml(w.suggestion)}</em>` : ""}</li>`)
    .join("");

  const nextStepsList = (evaluation?.next_steps ?? [])
    .map((s: string) => `<li>${escapeHtml(s)}</li>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>WriteRight Report</title>
<style>
  body { font-family: 'Segoe UI', system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1a1a1a; line-height: 1.6; }
  h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 8px; }
  h2 { color: #1e40af; margin-top: 32px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th, td { border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }
  th { background: #eff6ff; font-weight: 600; }
  .score-badge { display: inline-block; background: #2563eb; color: white; padding: 4px 16px; border-radius: 20px; font-size: 1.2em; font-weight: bold; }
  .section { margin: 24px 0; padding: 16px; background: #f8fafc; border-radius: 8px; }
  .essay-text { white-space: pre-wrap; background: #fff; padding: 16px; border: 1px solid #e5e7eb; border-radius: 4px; }
  .meta { color: #6b7280; font-size: 0.9em; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
<h1>📝 WriteRight Essay Report</h1>
<p class="meta">Exported: ${new Date().toLocaleDateString("en-SG", { dateStyle: "long" })}</p>

<div class="section">
  <h2>Assignment</h2>
  <p><strong>Type:</strong> ${escapeHtml(assignment.essay_type ?? "")} ${assignment.essay_sub_type ? `(${escapeHtml(assignment.essay_sub_type)})` : ""}</p>
  <p><strong>Prompt:</strong> ${escapeHtml(assignment.prompt ?? "")}</p>
  ${assignment.guiding_points?.length ? `<p><strong>Guiding Points:</strong></p><ul>${assignment.guiding_points.map((g: string) => `<li>${escapeHtml(g)}</li>`).join("")}</ul>` : ""}
</div>

${submission?.ocr_text ? `
<div class="section">
  <h2>Student's Essay</h2>
  <div class="essay-text">${escapeHtml(submission.ocr_text)}</div>
</div>
` : ""}

${evaluation ? `
<div class="section">
  <h2>Evaluation</h2>
  <p>Total Score: <span class="score-badge">${evaluation.total_score}/30 — Band ${evaluation.band}</span></p>
  <p class="meta">Model: ${escapeHtml(evaluation.model_id)} | Confidence: ${Math.round(evaluation.confidence * 100)}%</p>
  <table><thead><tr><th>Dimension</th><th>Score</th><th>Band</th><th>Justification</th></tr></thead><tbody>${dimensionRows}</tbody></table>
  ${strengthsList ? `<h3>✅ Strengths</h3><ul>${strengthsList}</ul>` : ""}
  ${weaknessesList ? `<h3>⚠️ Areas for Improvement</h3><ul>${weaknessesList}</ul>` : ""}
  ${nextStepsList ? `<h3>📌 Next Steps</h3><ol>${nextStepsList}</ol>` : ""}
</div>
` : "<p><em>No evaluation available yet.</em></p>"}

${rewrite ? `
<div class="section">
  <h2>AI-Rewritten Version (${escapeHtml(rewrite.mode)})</h2>
  <p class="meta">Target Band: ${rewrite.target_band}</p>
  <div class="essay-text">${escapeHtml(rewrite.rewritten_text)}</div>
</div>
` : ""}

<p class="meta" style="text-align:center; margin-top:40px;">Generated by WriteRight • Print this page (Ctrl+P) to save as PDF</p>
</body>
</html>`;
}
