import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Loader2, Check, AlertCircle, Save } from 'lucide-react';
import useAuthStore from '../../stores/useAuthStore';

const NAME_PATTERN = /^[A-Za-z0-9_.-]+$/;

export default function ProfileModal({ isOpen, onClose }) {
  const { profile, updateDisplayName, isDisplayNameAvailable, user } = useAuthStore();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availability, setAvailability] = useState({ status: 'idle', message: '' });

  useEffect(() => {
    if (isOpen) {
      setName(profile?.display_name || '');
      setError('');
      setSuccess('');
      setAvailability({ status: 'idle', message: '' });
    }
  }, [isOpen, profile]);

  useEffect(() => {
    setSuccess('');
    const trimmed = name.trim();
    const current = profile?.display_name || '';

    if (!trimmed) {
      setAvailability({ status: 'idle', message: '' });
      return;
    }
    if (trimmed.toLowerCase() === current.toLowerCase()) {
      setAvailability({ status: 'current', message: 'This is your current name.' });
      return;
    }
    if (trimmed.length < 3 || trimmed.length > 24) {
      setAvailability({ status: 'invalid', message: '3–24 characters required.' });
      return;
    }
    if (!NAME_PATTERN.test(trimmed)) {
      setAvailability({
        status: 'invalid',
        message: 'Only letters, numbers, and . _ - allowed.',
      });
      return;
    }

    setAvailability({ status: 'checking', message: 'Checking availability…' });

    let cancelled = false;
    const timeout = setTimeout(async () => {
      const available = await isDisplayNameAvailable(trimmed, user?.id);
      if (cancelled) return;
      setAvailability(
        available
          ? { status: 'available', message: 'Available!' }
          : { status: 'taken', message: 'That name is already taken.' },
      );
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [name, profile, isDisplayNameAvailable, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    const result = await updateDisplayName(name);
    setSubmitting(false);
    if (result.ok) {
      setSuccess('Display name updated!');
    } else {
      setError(result.error || 'Could not update display name.');
    }
  };

  const canSubmit =
    !submitting &&
    availability.status === 'available' &&
    name.trim().length >= 3;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-dark-800 border border-gray-700/50 rounded-2xl p-8 shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 mb-4">
                <User size={24} className="text-neon-cyan" />
              </div>
              <h2 className="text-xl font-display uppercase tracking-widest text-white">
                Profile
              </h2>
              <p className="text-sm text-gray-500 font-mono mt-2">
                Update your display name
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 font-mono mb-2 uppercase tracking-wider">
                  Display name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Choose a new display name"
                    required
                    minLength={3}
                    maxLength={24}
                    pattern="[A-Za-z0-9_.\-]+"
                    title="Letters, numbers, and . _ - only"
                    className="w-full bg-dark-700 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-200 font-mono placeholder:text-gray-600 focus:outline-none focus:border-neon-cyan/50 focus:shadow-[0_0_10px_rgba(0,240,255,0.1)] transition-all"
                  />
                </div>

                <div className="mt-2 h-5 text-xs font-mono flex items-center gap-1.5">
                  {availability.status === 'checking' && (
                    <span className="text-gray-500 flex items-center gap-1.5">
                      <Loader2 size={12} className="animate-spin" />
                      {availability.message}
                    </span>
                  )}
                  {availability.status === 'available' && (
                    <span className="text-neon-green flex items-center gap-1.5">
                      <Check size={12} />
                      {availability.message}
                    </span>
                  )}
                  {availability.status === 'taken' && (
                    <span className="text-red-400 flex items-center gap-1.5">
                      <AlertCircle size={12} />
                      {availability.message}
                    </span>
                  )}
                  {availability.status === 'invalid' && (
                    <span className="text-amber-400 flex items-center gap-1.5">
                      <AlertCircle size={12} />
                      {availability.message}
                    </span>
                  )}
                  {availability.status === 'current' && (
                    <span className="text-gray-500">{availability.message}</span>
                  )}
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-red-400 font-mono text-center bg-red-400/5 border border-red-400/10 rounded-lg py-2 px-3"
                  >
                    {error}
                  </motion.p>
                )}
                {success && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-neon-green font-mono text-center bg-neon-green/5 border border-neon-green/20 rounded-lg py-2 px-3"
                  >
                    {success}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={canSubmit ? { scale: 1.02 } : {}}
                whileTap={canSubmit ? { scale: 0.98 } : {}}
                type="submit"
                disabled={!canSubmit}
                className="w-full flex items-center justify-center gap-2 py-3 bg-neon-cyan/10 border border-neon-cyan/50 rounded-xl text-neon-cyan font-mono text-sm uppercase tracking-wider hover:bg-neon-cyan/20 hover:shadow-neon-cyan transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Save size={16} />
                    Save changes
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
