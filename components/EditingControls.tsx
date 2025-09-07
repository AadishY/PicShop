import React from 'react';
import { Button } from './ui';
import { SparklesIcon, NewSessionIcon } from './Icons';
import LoadingSpinner from './LoadingSpinner';

import { UploadIcon } from './Icons';

interface EditingControlsProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  style: string;
  setStyle: (style: string) => void;
  styles: { value: string; label: string }[];
  examplePrompts: string[];
  loadingPrompts: boolean;
  handleEdit: () => void;
  isLoading: boolean;
  error: string | null;
  handleNewSession: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const EditingControls: React.FC<EditingControlsProps> = ({
  prompt,
  setPrompt,
  style,
  setStyle,
  styles,
  examplePrompts,
  loadingPrompts,
  handleEdit,
  isLoading,
  error,
  handleNewSession,
  fileInputRef,
}) => {
  return (
    <div className="flex flex-col gap-6">
      <>
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-300">Editing Instructions</label>
            <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className="text-xs">
              <UploadIcon className="w-4 h-4 mr-1" />
              Upload New
            </Button>
          </div>
          <textarea
            id="prompt"
            rows={3}
            className="w-full bg-gray-800 border border-gray-600 rounded-md text-white p-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="style" className="block text-sm font-medium text-gray-300 mb-2">Style Presets</label>
          <select
            id="style"
            className="w-full bg-gray-800 border border-gray-600 rounded-md text-white p-2.5 focus:ring-indigo-500 focus:border-indigo-500 transition"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          >
            {styles.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-2">Try an example:</h4>
          {loadingPrompts ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <LoadingSpinner className="w-4 h-4" />
              <span>Analyzing image...</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((p, i) => (
                <button key={i} onClick={() => setPrompt(p)} className="text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded-full transition-colors">
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className='flex flex-col gap-4'>
          <Button
              onClick={handleEdit}
              isLoading={isLoading}
              loadingText="Applying Edit..."
              size="lg"
          >
              <SparklesIcon className="w-5 h-5 mr-2"/>
              Apply AI Edit
          </Button>
        </div>

        {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}

        <div className="border-t border-gray-700 mt-4 pt-4">
            <Button onClick={handleNewSession} variant="ghost" className="w-full">
              <NewSessionIcon className="w-5 h-5 mr-2" />
              Start New Session
            </Button>
        </div>
      </>
    </div>
  );
};

export default EditingControls;
