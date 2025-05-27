import Catalog from '../components/Catalog';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold text-center py-8 text-marsala">Catálogo Closet Festa</h1>
      <Catalog />
    </main>
  );
} 