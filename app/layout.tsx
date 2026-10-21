import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'devntom solutions · Travel & Umrah CRM',
  description: 'Enterprise Travel & Umrah CRM with role-based access, multi-tier package costing, booking records, invoices, and agent management.',
  openGraph: {
    title: 'devntom solutions · Travel & Umrah CRM',
    description: 'Enterprise Travel & Umrah CRM with role-based access, multi-tier package costing, booking records, invoices, and agent management.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'devntom solutions · Travel & Umrah CRM',
    description: 'Enterprise Travel & Umrah CRM with role-based access, multi-tier package costing, booking records, invoices, and agent management.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-slate-50">
      <body className="h-full bg-slate-50 text-neutral-900 font-sans antialiased overflow-hidden selection:bg-emerald-500/20 selection:text-emerald-900">
        {children}
      </body>
    </html>
  );
}
