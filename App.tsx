// Fix: Populate file with the main App component.
import React, { useState } from 'react';
import { ImageFile } from './types';
import HomePage from './components/HomePage';
import ImageGeneratorPage from './components/ImageGeneratorPage';
import ImageEditorPage from './components/ImageEditorPage';
import MultiImageEditorPage from './components/MultiImageEditorPage';
import { GitHubIcon } from './components/Icons';

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