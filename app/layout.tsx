import type { Metadata } from 'next';
import { AppProvider } from '@/context/AppContext';
import 'maplibre-gl/dist/maplibre-gl.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Epoch — A historical atlas',
  description:
    'Explore a changing world. An interactive globe of historical polities with illustrative datasets.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
