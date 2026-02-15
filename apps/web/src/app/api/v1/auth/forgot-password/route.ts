import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { NextResponse, type NextRequest } from 'next/server';
import crypto from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Look up user by email (don't reveal if user exists or not)
    const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
    const user = userData?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );

    // Always return success (don't leak user existence)
    if (!user) {
      return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' });
    }

    // Generate secure token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate any existing tokens for this user
    await supabaseAdmin
      .from('password_reset_tokens')
      .delete()
      .eq('user_id', user.id);

    // Store hashed token
    const { error: insertError } = await supabaseAdmin
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Failed to store reset token:', insertError);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }

    // Build reset URL
    const forwardedHost = request.headers.get('x-forwarded-host');
    const host = forwardedHost || request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const origin = `${protocol}://${host}`;
    const resetUrl = `${origin}/reset-password?token=${rawToken}`;

    // Send email via Resend
    const brandName = process.env.NEXT_PUBLIC_APP_NAME || 'WriteRight';
    const senderEmail = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

    await resend.emails.send({
      from: `${brandName} <${senderEmail}>`,
      to: email,
      subject: `Reset your ${brandName} password`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">Reset your password</h2>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.5;">
            We received a request to reset your password. Click the button below to choose a new one.
          </p>
          <div style="margin: 32px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Reset Password
            </a>
          </div>
          <p style="color: #888; font-size: 14px; line-height: 1.5;">
            This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
          <p style="color: #aaa; font-size: 12px;">${brandName}</p>
        </div>
      `,
    });

    return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
