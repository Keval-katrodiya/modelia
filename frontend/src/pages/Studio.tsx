import React, { useState, useEffect, FormEvent, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload } from '../components/Upload';
import { GenerationHistory } from '../components/GenerationHistory';
import { useAuth } from '../contexts/AuthContext';
import { useGenerate } from '../hooks/useGenerate';
import { generationsAPI, Generation } from '../utils/api';

const STYLE_OPTIONS = [
  { value: 'casual', label: 'Casual' },
  { value: 'formal', label: 'Formal' },
  { value: 'sporty', label: 'Sporty' },
  { value: 'elegant', label: 'Elegant' },
];

export const Studio: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { isGenerating, error, retryCount, generate, abort } = useGenerate();

  const [image, setImage] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('casual');
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadGenerations = useCallback(async (): Promise<void> => {
    // Double check token exists before making request
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, skipping generation load');
      return;
    }

    setLoadingHistory(true);
    try {
      const data = await generationsAPI.getRecent(5);
      setGenerations(data);
      console.log('Loaded generations successfully:', data.length);
    } catch (err) {
      console.error('Failed to load generations:', err);
      // Just log, don't crash or redirect
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Don't auto-load on mount - only load after first successful generation
  // This prevents 401 errors on initial login

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();

    if (!image) {
      return;
    }

    const result = await generate({
      image,
      prompt,
      style,
      maxRetries: 3,
    });

    if (result) {
      // Refresh history after successful generation
      await loadGenerations();
    }
  };

  const handleRestore = (generation: Generation): void => {
    setPrompt(generation.prompt);
    setStyle(generation.style);
    // Note: Can't restore the actual image file from URL in this simple implementation
  };

  const handleLogout = (): void => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Modelia AI Studio</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="btn-secondary text-sm"
              aria-label="Logout"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Generation Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="card space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900">Create Generation</h2>

              <Upload
                onImageSelect={setImage}
                disabled={isGenerating}
                currentImage={image}
              />

              <div>
                <label htmlFor="prompt" className="label">
                  Prompt
                </label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="input resize-none"
                  rows={3}
                  placeholder="Describe the fashion style you want to generate..."
                  required
                  disabled={isGenerating}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">{prompt.length}/500 characters</p>
              </div>

              <div>
                <label htmlFor="style" className="label">
                  Style
                </label>
                <select
                  id="style"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="input"
                  disabled={isGenerating}
                >
                  {STYLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
                  role="alert"
                >
                  {error}
                  {retryCount > 0 && (
                    <p className="text-sm mt-1">Retry attempt: {retryCount}/3</p>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={isGenerating || !image || !prompt}
                  aria-busy={isGenerating}
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    'Generate'
                  )}
                </button>

                {isGenerating && (
                  <button
                    type="button"
                    onClick={abort}
                    className="btn-danger"
                    aria-label="Abort generation"
                  >
                    Abort
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Right Column - History */}
          <div className="lg:col-span-1">
            {loadingHistory ? (
              <div className="card">
                <p className="text-gray-500 text-center py-8">Loading history...</p>
              </div>
            ) : (
              <GenerationHistory
                generations={generations}
                onRestore={handleRestore}
                disabled={isGenerating}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

