import React from 'react';
import { ImageFile } from '../types';
import { Page } from '../App';
import { ImageIcon, EditIcon, LayersIcon } from './Icons';
import { Card } from './ui';

interface HomePageProps {
  navigate: (page: Page, image?: ImageFile) => void;
}

const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center pt-8 md:pt-16">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-4 animate-fade-in-down">
        Welcome to <span className="bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text">Aadish AI Picshop</span>
      </h1>
      <p className="max-w-2xl text-lg sm:text-xl text-gray-300 mb-12 animate-fade-in-up">
        Unleash your creativity. Generate stunning images from text or edit your photos with the power of AI.
      </p>

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
          title="Multi-Image Mixer"
          description="Combine multiple photos, create collages, or transfer elements between images with a single prompt."
          onClick={() => navigate(Page.MULTI_EDITOR)}
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
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, onClick }) => (
  <Card 
    onClick={onClick}
    className="relative p-8 flex flex-col items-center cursor-pointer group feature-card-glow"
  >
    <div className="mb-4 transition-transform duration-300 group-hover:scale-110">
      {icon}
    </div>
    <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </Card>
);

export default HomePage;
