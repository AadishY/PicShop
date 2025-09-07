import React from 'react';
import { Page } from '../App';
import { ImageIcon, EditIcon, LayersIcon } from './Icons';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface HomePageProps {
  navigate: (page: Page) => void;
}

const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center pt-8 md:pt-16 px-4">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-4 animate-fade-in-down">
        Welcome to <span className="bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text">Aadish AI Picshop</span>
      </h1>
      <p className="max-w-3xl text-lg sm:text-xl text-gray-300 mb-16 animate-fade-in-up">
        Unleash your creativity. Generate stunning images from text or edit your photos with the power of AI.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        <FeatureCard
          icon={<ImageIcon className="w-10 h-10 mb-4 text-indigo-300" />}
          title="Image Generation"
          description="Create unique images from text descriptions. Just type your idea and see it come to life."
          onClick={() => navigate(Page.GENERATOR)}
        />
        <FeatureCard
          icon={<EditIcon className="w-10 h-10 mb-4 text-indigo-300" />}
          title="Image Editing"
          description="Upload a photo and use simple text prompts to perform powerful edits, from changing colors to adding objects."
          onClick={() => navigate(Page.EDITOR)}
        />
        <FeatureCard
          icon={<LayersIcon className="w-10 h-10 mb-4 text-indigo-300" />}
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

// Glassmorphism Card with Shadcn UI components
const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, onClick }) => (
  <Card 
    onClick={onClick}
    className="bg-slate-900/40 backdrop-blur-lg border-slate-700/80 text-white cursor-pointer group transition-all duration-300 hover:border-slate-500 hover:bg-slate-900/60"
  >
    <CardHeader className="items-center">
      <div className="mb-2 transition-transform duration-300 group-hover:scale-110">
        {icon}
      </div>
      <CardTitle className="text-2xl font-bold">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <CardDescription className="text-gray-400 text-base">
        {description}
      </CardDescription>
    </CardContent>
  </Card>
);

export default HomePage;
