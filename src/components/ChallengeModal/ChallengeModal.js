import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

function generateChallenge() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const correctIdx = Math.floor(Math.random() * 26);
  const correctLetter = alphabet[correctIdx];

  const options = new Set([correctLetter]);
  while (options.size < 4) {
    options.add(alphabet[Math.floor(Math.random() * 26)]);
  }

  const shuffled = Array.from(options).sort(() => Math.random() - 0.5);
  return { correctLetter, options: shuffled };
}

export default function ChallengeModal({ isOpen, onSuccess, onCancel }) {
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);

  const challenge = useMemo(
    () => (isOpen ? generateChallenge() : null),
    [isOpen]
  );

  useEffect(() => {
    if (isOpen) {
      setSelected(null);
      setResult(null);
    }
  }, [isOpen]);

  if (!isOpen || !challenge) return null;

  const handleSelect = (letter) => {
    if (selected) return;
    setSelected(letter);
    if (letter === challenge.correctLetter) {
      setResult('correct');
      setTimeout(() => onSuccess(), 350);
    } else {
      setResult('wrong');
      setTimeout(() => onCancel(), 900);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onCancel}
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-xs bg-dark-800 border border-gray-700/50 rounded-2xl p-6 shadow-2xl text-center"
          >
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 mb-3">
              <ShieldCheck size={20} className="text-neon-cyan" />
            </div>

            <h3 className="text-sm font-display uppercase tracking-widest text-gray-300 mb-1">
              Quick Check
            </h3>
            <p className="text-xs text-gray-500 font-mono mb-5">
              What letter is this?
            </p>

            <div className="text-7xl font-display text-white mb-6 select-none leading-none">
              {challenge.correctLetter}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {challenge.options.map((letter) => {
                let btnClass =
                  'bg-dark-700 border-gray-600 text-gray-300 hover:bg-dark-600 hover:border-gray-500';

                if (selected === letter) {
                  btnClass =
                    result === 'correct'
                      ? 'bg-neon-green/20 border-neon-green/50 text-neon-green'
                      : 'bg-red-500/20 border-red-500/50 text-red-400';
                } else if (result && letter === challenge.correctLetter) {
                  btnClass =
                    'bg-neon-green/10 border-neon-green/30 text-neon-green/70';
                }

                return (
                  <motion.button
                    key={letter}
                    whileHover={!selected ? { scale: 1.05 } : {}}
                    whileTap={!selected ? { scale: 0.95 } : {}}
                    onClick={() => handleSelect(letter)}
                    disabled={!!selected}
                    className={`py-3 rounded-xl border font-mono text-lg uppercase tracking-wider transition-all ${btnClass} disabled:cursor-not-allowed`}
                  >
                    {letter}
                  </motion.button>
                );
              })}
            </div>

            {result === 'wrong' && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-400 font-mono mt-3"
              >
                Wrong! Submission cancelled.
              </motion.p>
            )}

            <button
              onClick={onCancel}
              className="mt-4 text-xs text-gray-600 hover:text-gray-400 font-mono transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
