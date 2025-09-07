// Fix: Populate file with the main App component.
import React, { useState } from 'react';
import { ImageFile } from './types';
import HomePage from './components/HomePage';
import ImageGeneratorPage from './components/ImageGeneratorPage';
import ImageEditorPage from './components/ImageEditorPage';
import MultiImageEditorPage from './components/MultiImageEditorPage';
import { GitHubIcon } from './components/Icons';

const ApiKeyError: React.FC = () => (
  <div className="bg-red-900/50 border border-red-400 text-red-200 px-4 py-3 rounded-lg relative max-w-2xl mx-auto mt-10 text-center shadow-lg">
    <strong className="font-bold block mb-2">Configuration Error</strong>
    <span className="block sm:inline">
      Your Gemini API key is not configured. Please create a <code>.env.local</code> file in the root of the project and add the following line:
    </span>
    <pre className="bg-gray-900/50 p-2 rounded-md mt-4 text-left font-mono text-sm whitespace-pre-wrap">
      VITE_GEMINI_API_KEY=YOUR_API_KEY
    </pre>
    <p className="mt-4">
      You can get a free API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-white">Google AI Studio</a>.
    </p>
  </div>
);

export enum Page {
  HOME = 'HOME',
  GENERATOR = 'GENERATOR',
  EDITOR = 'EDITOR',
  MULTI_EDITOR = 'MULTI_EDITOR',
}

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.HOME);
  const [imageToEdit, setImageToEdit] = useState<ImageFile | null>(null);

  const navigate = (page: Page, image?: ImageFile) => {
    setImageToEdit(image || null);
    setCurrentPage(page);
  };

  const renderPage = () => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      return <ApiKeyError />;
    }
    switch (currentPage) {
      case Page.GENERATOR:
        return <ImageGeneratorPage navigate={navigate} />;
      case Page.EDITOR:
        return <ImageEditorPage navigate={navigate} initialImage={imageToEdit} />;
      case Page.MULTI_EDITOR:
        return <MultiImageEditorPage navigate={navigate} />;
      case Page.HOME:
      default:
        return <HomePage navigate={navigate} />;
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen font-sans text-white">
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50 shadow-lg shadow-black/20">
          <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                  <div className="flex items-center">
                      <button onClick={() => navigate(Page.HOME)} className="flex-shrink-0 text-white font-bold text-xl hover:opacity-80 transition-opacity">
                          Aadish AI Picshop
                      </button>
                  </div>
                   <div className="flex items-center">
                        <a href="https://github.com/AadishY/PicShop" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" title="View on GitHub">
                            <GitHubIcon className="w-6 h-6" />
                        </a>
                    </div>
              </div>
          </nav>
      </header>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;