import { GameBoard } from '@/components/game-board';
import { Header } from '@/components/header';
import { adjectives, animals } from '@/lib/utils';
import { redirect } from 'next/navigation';

export function generateStaticParams() {
  const paths = [];
  for (let i = 0; i < adjectives.length; i++) {
    for (let j = 0; j < animals.length; j++) {
      paths.push({
        gameId: `${adjectives[i]}-${animals[j]}`
      });
    }
  }
  return paths;
}

export default function GamePage({ params }: { params: { gameId: string } }) {
  // Validate gameId format
  const [adjective, animal] = params.gameId.split('-');
  const isValidGameId = 
    adjectives.includes(adjective as typeof adjectives[number]) && 
    animals.includes(animal as typeof animals[number]);

  if (!isValidGameId) {
    redirect('/');
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <GameBoard initialGameId={params.gameId} />
      </div>
    </main>
  );
}