'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

const input = [
  [1, 0, 1, 0, 1],
  [0, 1, 0, 1, 0],
  [1, 0, 1, 0, 1],
  [0, 1, 0, 1, 0],
  [1, 0, 1, 0, 1],
];

const target = [
  [1, 0, 1],
  [0, 1, 0],
  [1, 0, 1],
];

const initialFilter = [
  [0.2, -0.5, 0.3],
  [0.0, 0.8, -0.2],
  [0.1, -0.4, 0.6],
];

const learningRate = 0.01;
const maxSteps = 100;
const targetLoss = 0.01;

export default function CNNVisualizer({ onLossUpdate }) {
  const [filter, setFilter] = useState(initialFilter);
  const [gradient, setGradient] = useState(Array(3).fill(0).map(() => Array(3).fill(0)));
  const [step, setStep] = useState(0);
  const [positions, setPositions] = useState([]);
  const [lossHistory, setLossHistory] = useState([]);
  const [isAutoTraining, setIsAutoTraining] = useState(false);
  const stepCount = useRef(0);
  const isAutoTrainingRef = useRef(false);

  useEffect(() => {
    const pos = [];
    for (let i = 0; i <= 2; i++) {
      for (let j = 0; j <= 2; j++) {
        pos.push({ row: i, col: j });
      }
    }
    setPositions(pos);
  }, []);

  useEffect(() => {
    if (onLossUpdate) {
      onLossUpdate(lossHistory);
    }
  }, [lossHistory]);

  const current = positions[step];

  const rawConvolve = (r, c, kernel = filter) => {
    let sum = 0;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        sum += input[r + i][c + j] * kernel[i][j];
      }
    }
    return sum;
  };

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  const startAutoTraining = async () => {
    if (isAutoTrainingRef.current) return;

    setIsAutoTraining(true);
    isAutoTrainingRef.current = true;
    stepCount.current = 0;
    setStep(0);

    let mse = Infinity;
    let localFilter = filter;
    let localGradient = Array(3).fill(0).map(() => Array(3).fill(0));
    let newLossHistory = [...lossHistory];

    while (stepCount.current < maxSteps && isAutoTrainingRef.current) {
      for (let stepIndex = 0; stepIndex < positions.length; stepIndex++) {
        if (!isAutoTrainingRef.current) break;

        const { row, col } = positions[stepIndex];
        setStep(stepIndex);

        const prediction = rawConvolve(row, col, localFilter);
        const error = prediction - target[row][col];

        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            localGradient[i][j] += input[row + i][col + j] * error;
          }
        }

        await sleep(150);
      }

      // Update weights after full pass
      const avgGrad = localGradient.map(row =>
        row.map(val => parseFloat((val / 9).toFixed(6)))
      );

      localFilter = localFilter.map((fRow, i) =>
        fRow.map((w, j) => {
          const newW = w - learningRate * avgGrad[i][j];
          return parseFloat(Math.max(-2, Math.min(2, newW)).toFixed(4));
        })
      );

      // Recalculate loss and check if entire output matches
      let totalLoss = 0;
      let matchesAll = true;

      for (let i = 0; i <= 2; i++) {
        for (let j = 0; j <= 2; j++) {
          const pred = rawConvolve(i, j, localFilter);
          const reluOutput = Math.max(0, pred);
          const diff = reluOutput - target[i][j];
          totalLoss += diff * diff;

          if (parseFloat(reluOutput.toFixed(2)) !== target[i][j]) {
            matchesAll = false;
          }
        }
      }

      mse = parseFloat((totalLoss / 9).toFixed(4));
      newLossHistory.push(mse);

      // Update UI state
      setFilter(localFilter);
      setGradient(Array(3).fill(0).map(() => Array(3).fill(0)));
      setLossHistory([...newLossHistory]);
      setStep(0);
      stepCount.current++;

      console.log(`Pass ${stepCount.current}, Loss: ${mse}, Matches All: ${matchesAll}`);

      if (matchesAll || mse <= targetLoss) break;
    }

    setIsAutoTraining(false);
    isAutoTrainingRef.current = false;
  };

  const resetTraining = () => {
    setFilter(initialFilter);
    setGradient(Array(3).fill(0).map(() => Array(3).fill(0)));
    setStep(0);
    setLossHistory([]);
    setIsAutoTraining(false);
    isAutoTrainingRef.current = false;
    stepCount.current = 0;
  };

  return (
    <div className="max-w-5xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg text-center">
      <h2 className="text-2xl font-semibold mb-4">CNN Visualizer</h2>

      <div className="flex flex-wrap justify-center gap-10">
        {/* Input */}
        <div>
          <p className="font-semibold mb-2">Input (5×5)</p>
          <div className="grid grid-cols-5 gap-1">
            {input.flatMap((row, i) =>
              row.map((val, j) => {
                const isActive =
                  current &&
                  i >= current.row &&
                  i < current.row + 3 &&
                  j >= current.col &&
                  j < current.col + 3;

                return (
                  <motion.div
                    key={`input-${i}-${j}`}
                    className={`w-10 h-10 rounded flex items-center justify-center border font-bold text-sm ${
                      isActive ? 'bg-yellow-200' : 'bg-gray-100'
                    }`}
                    animate={{ scale: isActive ? [1, 1.1, 1] : 1 }}
                  >
                    {val}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Filter */}
        <div>
          <p className="font-semibold mb-2">Filter Weights + Avg Gradients</p>
          <div className="grid grid-cols-3 gap-1">
            {filter.flatMap((row, i) =>
              row.map((val, j) => (
                <div
                  key={`filter-${i}-${j}`}
                  className="relative w-16 h-16 border rounded bg-indigo-100 text-sm"
                >
                  <div className="font-bold">{val}</div>
                  <div className="absolute bottom-0 left-0 w-full text-xs text-gray-600">
                    ∇: {(gradient[i][j] / 9).toFixed(4)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Output vs Target */}
        <div>
          <p className="font-semibold mb-2">Output vs Target (ReLU Display Only)</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs">Output</p>
              <div className="grid grid-cols-3 gap-1">
                {positions.map((pos, i) => {
                  const raw = rawConvolve(pos.row, pos.col);
                  const display = Math.max(0, raw);
                  const isCurrent = i === step;

                  return (
                    <motion.div
                      key={`pred-${i}`}
                      className={`w-10 h-10 text-sm rounded flex items-center justify-center font-semibold border ${
                        isCurrent ? 'bg-green-300' : 'bg-gray-100'
                      }`}
                      animate={{ scale: isCurrent ? [1, 1.2, 1] : 1 }}
                    >
                      {!isAutoTraining || i <= step ? display.toFixed(2) : '...'}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs">Target</p>
              <div className="grid grid-cols-3 gap-1">
                {target.flatMap((row, i) =>
                  row.map((val, j) => (
                    <div
                      key={`target-${i}-${j}`}
                      className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center font-semibold text-sm border"
                    >
                      {val}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-6 flex flex-wrap justify-center gap-4">
        <button
          onClick={startAutoTraining}
          disabled={isAutoTraining}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
        >
          Start Training
        </button>

        <button
          onClick={resetTraining}
          disabled={isAutoTraining}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
