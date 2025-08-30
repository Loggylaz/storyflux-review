import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'StoryFlux' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <main>
          <h1>StoryFlux (FR-first)</h1>
          {children}
        </main>
      </body>
    </html>
  );
}
