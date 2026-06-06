import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

// DELETE a provider
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.mailProvider.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete provider' }, { status: 500 });
  }
}

// PATCH – set as active (deactivates all others first)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // Deactivate all
    await prisma.mailProvider.updateMany({ data: { isActive: false } });
    // Activate the selected one
    const provider = await prisma.mailProvider.update({ where: { id }, data: { isActive: true } });
    const { password: _, ...providerWithoutPassword } = provider;
    return NextResponse.json({ success: true, provider: providerWithoutPassword });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update provider' }, { status: 500 });
  }
}

// PUT – update a provider's details
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { title, host, port, encryption, secure, fromName, email, password } = body;

    if (!title || !host || !port || !email) {
      return NextResponse.json({ error: 'Title, host, port, and email are required.' }, { status: 400 });
    }

    const updateData: any = {
      title,
      host,
      port: String(port),
      encryption: encryption || 'TLS / SSL / STARTTLS',
      secure: !!secure,
      fromName,
      email
    };

    if (password && password.trim() !== '') {
      updateData.password = password;
    }

    const provider = await prisma.mailProvider.update({
      where: { id },
      data: updateData,
    });

    const { password: _, ...providerWithoutPassword } = provider;
    return NextResponse.json({ success: true, provider: providerWithoutPassword });
  } catch (error) {
    console.error('Update provider error:', error);
    return NextResponse.json({ error: 'Failed to update provider' }, { status: 500 });
  }
}

// POST – send a test email using this provider's configuration
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const provider = await prisma.mailProvider.findUnique({ where: { id } });
    if (!provider) {
      return NextResponse.json({ error: 'Mail provider not found' }, { status: 404 });
    }

    const transporter = nodemailer.createTransport({
      host: provider.host,
      port: parseInt(provider.port),
      secure: provider.secure,
      auth: { user: provider.email, pass: provider.password },
    });

    const senderName = provider.fromName || provider.title || 'HR System Test';
    await transporter.sendMail({
      from: `"${senderName}" <${provider.email}>`,
      to: provider.email, // Send test email to themselves
      subject: `SMTP Connection Test: ${provider.title}`,
      html: `
        <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #10b981; margin-top: 0;">SMTP Connection Successful!</h2>
          <p>This is a test email sent from your HR Performance Management System to verify your SMTP mail provider configuration.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
          <p style="font-size: 13px; color: #64748b;"><strong>Provider Details:</strong><br />
          Title: ${provider.title}<br />
          Host: ${provider.host}<br />
          Port: ${provider.port}<br />
          Encryption: ${provider.encryption}</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: `Test email sent successfully to ${provider.email}` });
  } catch (error: any) {
    console.error('Test email sending error:', error);
    return NextResponse.json({ error: `Connection failed: ${error.message || error}` }, { status: 500 });
  }
}
