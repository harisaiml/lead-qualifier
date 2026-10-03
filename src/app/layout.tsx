import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LeadScore AI — AI-Powered Lead Quality Scorer',
  description:
    'Score your business leads from 0–100 using AI. Evaluate business quality, buying intent, website quality, contact info, and conversion potential. Built for freelancers, agencies, and sales teams.',
  keywords: ['lead scoring', 'AI lead qualification', 'sales prospecting', 'lead quality', 'CRM', 'outreach'],
  openGraph: {
    title: 'LeadScore AI — AI-Powered Lead Quality Scorer',
    description: 'Score business leads instantly with Gemini AI. Built for SDRs and agencies.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#050A15] text-white antialiased">{children}</body>
    </html>
  );
}
