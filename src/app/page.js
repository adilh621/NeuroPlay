'use client';

import { useState } from 'react';
import CNNVisualizer from './components/CNNVisualizer';
import LossChart from './components/LossChart';

export default function Home() {
  const [lossHistory, setLossHistory] = useState([]);

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#DEE5E5' }}>
      <header className="py-6 shadow-md" style={{ backgroundColor: '#9DC5BB' }}>
        <h1 className="text-4xl font-bold text-center text-white tracking-wide">Neuro Play</h1>
      </header>

      <section className="p-8">
        <p className="text-lg text-center text-gray-700 mb-6">
          Interactive CNN Visualizer with ReLU + Loss Tracking
        </p>

        <CNNVisualizer onLossUpdate={setLossHistory} />
        <LossChart data={lossHistory} />
      </section>
    </main>
  );
}
