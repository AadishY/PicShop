import React from 'react';
import { ImageFile } from '../types';
import { Page } from '../App';
import { ImageIcon, EditIcon, LayersIcon } from './Icons';
import { Card, Button } from './ui';

interface HomePageProps {
  navigate: (page: Page, image?: ImageFile) => void;
}

const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center pt-8 md:pt-16">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-4 animate-fade-in-down">
        Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">Aadish AI Picshop</span>
      </h1>
      <p className="max-w-2xl text-lg sm:text-xl text-gray-300 mb-8 animate-fade-in-up">
        Unleash your creativity. Generate stunning images from text or edit your photos with the power of AI.
      </p>
      <div className="mb-12 animate-fade-in-up">
        <Button onClick={() => navigate(Page.GENERATOR)} size="lg" className="text-lg">
          <ImageIcon className="w-5 h-5 mr-2" />
          Start Generating
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        <FeatureCard
          icon={<ImageIcon className="w-10 h-10 mb-4 text-indigo-400" />}
          title="Image Generation"
          description="Create unique images from text descriptions. Just type your idea and see it come to life."
          onClick={() => navigate(Page.GENERATOR)}
        />
        <FeatureCard
          icon={<EditIcon className="w-10 h-10 mb-4 text-indigo-400" />}
          title="Image Editing"
          description="Upload a photo and use simple text prompts to perform powerful edits, from changing colors to adding objects."
          onClick={() => navigate(Page.EDITOR)}
        />
        <FeatureCard
          icon={<LayersIcon className="w-10 h-10 mb-4 text-indigo-400" />}
          title="Multiple Images Editing"
          description="Combine and edit multiple images in one go. This feature is currently in beta."
          onClick={() => navigate(Page.MULTI_EDITOR)}
          isBeta={true}
        />
      </div>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  isBeta?: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, onClick, isBeta = false }) => (
  <Card 
    onClick={onClick}
    className="relative p-8 flex flex-col items-center cursor-pointer group transition-all duration-300 hover:bg-gray-800/80 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2"
  >
    {isBeta && (
      <span className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">BETA</span>
    )}
    <div className="mb-4 transition-transform duration-300 group-hover:scale-110">
      {icon}
    </div>
    <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </Card>
);

export default HomePage;