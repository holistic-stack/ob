/**
 * @file Liquid Glass Showcase Component
 * 
 * Comprehensive showcase demonstrating authentic Apple Liquid Glass design patterns
 * with real-world use cases, complex gradient layers, and beautiful backgrounds.
 * 
 * Features:
 * - Authentic glass morphism effects with multiple gradient layers
 * - Complex shadow combinations with inset highlights
 * - Beautiful background images to showcase transparency
 * - Multiple component variations and use cases
 * - Responsive design with mobile-first approach
 */

import React, { useState } from 'react';

// Icon components for the showcase
const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z" />
    <path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z" />
  </svg>
);

const MusicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path fillRule="evenodd" d="M19.952 1.651a.75.75 0 0 1 .298.599V16.303a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.403-4.909l2.311-.66a1.5 1.5 0 0 0 1.088-1.442V6.994l-9 2.572v9.737a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.402-4.909l2.31-.66a1.5 1.5 0 0 0 1.088-1.442V5.25a.75.75 0 0 1 .544-.721l10.5-3a.75.75 0 0 1 .658.122Z" clipRule="evenodd" />
  </svg>
);

const AppsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path fillRule="evenodd" d="M3 6a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3v2.25a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3V6ZM3 15.75a3 3 0 0 1 3-3h2.25a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-2.25Zm9.75 0a3 3 0 0 1 3-3H18a3 3 0 0 1 3 3V18a3 3 0 0 1-3 3h-2.25a3 3 0 0 1-3-3v-2.25Z" clipRule="evenodd" />
  </svg>
);

const ShopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path fillRule="evenodd" d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 0 0 4.25 22.5h15.5a1.875 1.875 0 0 0 1.865-2.071l-1.263-12a1.875 1.875 0 0 0-1.865-1.679H16.5V6a4.5 4.5 0 1 0-9 0ZM12 3a3 3 0 0 0-3 3v.75h6V6a3 3 0 0 0-3-3Z" clipRule="evenodd" />
  </svg>
);

const CallIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clipRule="evenodd" />
  </svg>
);

const MapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
  </svg>
);

const StarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M8 2v2H6c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-2V2h-2v2H10V2H8zm10 16H6V9h12v9z"/>
  </svg>
);

// Authentic Liquid Glass Button Component
interface LiquidGlassButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'rounded';
  className?: string;
}

const LiquidGlassButton: React.FC<LiquidGlassButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'default',
  className = '' 
}) => {
  const baseClasses = `
    relative inline-flex items-center justify-center px-6 py-3 text-white text-sm font-medium
    bg-white/2.5 border border-white/50 backdrop-blur-sm
    shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)]
    hover:bg-white/30 transition-all duration-300
    before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none
    after:absolute after:inset-0 after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none
    transition antialiased
  `;
  
  const variantClasses = variant === 'rounded' 
    ? 'rounded-full before:rounded-full after:rounded-full'
    : 'rounded-lg before:rounded-lg after:rounded-lg';

  return (
    <button 
      className={`${baseClasses} ${variantClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

// Authentic Liquid Glass Container Component
interface LiquidGlassContainerProps {
  children: React.ReactNode;
  className?: string;
}

const LiquidGlassContainer: React.FC<LiquidGlassContainerProps> = ({ children, className = '' }) => {
  return (
    <div className={`
      bg-black/20 backdrop-blur-sm border border-white/50 rounded-xl 
      shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)] 
      text-white relative 
      before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none 
      after:absolute after:inset-0 after:rounded-lg after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none
      ${className}
    `}>
      {children}
    </div>
  );
};

// App Icon Component
interface AppIconProps {
  icon: React.ReactNode;
  label: string;
  variant?: 'square' | 'round';
}

const AppIcon: React.FC<AppIconProps> = ({ icon, label, variant = 'square' }) => {
  return (
    <div className="flex flex-col items-center gap-2 relative z-10">
      <LiquidGlassButton
        variant={variant === 'round' ? 'rounded' : 'default'}
        className="h-12 w-12 p-2"
      >
        {icon}
      </LiquidGlassButton>
      <span className="text-xs text-center">{label}</span>
    </div>
  );
};

// DS Components

// Location Card Component (inspired by  UI)
interface LocationCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description?: string;
  variant?: 'compact' | 'detailed';
  className?: string;
}

const LocationCard: React.FC<LocationCardProps> = ({
  icon,
  title,
  subtitle,
  description,
  variant = 'compact',
  className = ''
}) => {
  const baseClasses = `
    bg-black/20 backdrop-blur-sm border border-white/50 rounded-lg
    shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)]
    p-4 text-white relative
    before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none
    after:absolute after:inset-0 after:rounded-lg after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none
  `;

  return (
    <div className={`${baseClasses} ${className}`}>
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center border border-white/30">
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="text-xs opacity-60">{subtitle}</p>
          </div>
        </div>
        {variant === 'detailed' && description && (
          <p className="text-xs opacity-70 mt-3 leading-relaxed">{description}</p>
        )}
      </div>
    </div>
  );
};

// Testimonial Card Component (inspired by  UI)
interface TestimonialCardProps {
  quote: string;
  author: string;
  jobTitle: string;
  avatar: string;
  className?: string;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({
  quote,
  author,
  jobTitle,
  avatar,
  className = ''
}) => {
  const baseClasses = `
    max-w-sm bg-black/20 backdrop-blur-sm border border-white/50 rounded-lg
    shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)]
    p-6 text-white relative
    before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none
    after:absolute after:inset-0 after:rounded-lg after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none
  `;

  return (
    <div className={`${baseClasses} ${className}`}>
      <div className="relative z-10">
        <div className="flex flex-col text-center">
          <blockquote className="text-sm opacity-80 mb-4 leading-relaxed">
            &quot;{quote}&quot;
          </blockquote>
          <div className="flex flex-col items-center">
            <img
              src={avatar}
              alt={`${author} avatar`}
              className="w-12 h-12 rounded-full mb-2 ring-2 ring-white/30"
            />
            <h3 className="text-sm font-semibold">{author}</h3>
            <p className="text-xs opacity-70">{jobTitle}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Location Detail Card Component (inspired by  UI)
interface LocationDetailCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  actions?: Array<{ label: string; onClick?: () => void }>;
  className?: string;
}

const LocationDetailCard: React.FC<LocationDetailCardProps> = ({
  icon,
  title,
  subtitle,
  description,
  actions = [],
  className = ''
}) => {
  const baseClasses = `
    max-w-sm bg-black/20 backdrop-blur-sm border border-white/50 rounded-lg
    shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)]
    p-6 text-white relative
    before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none
    after:absolute after:inset-0 after:rounded-lg after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none
  `;

  return (
    <div className={`${baseClasses} ${className}`}>
      <div className="relative z-10">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-white/20 rounded-lg mb-4 flex items-center justify-center border border-white/30">
            <div className="w-8 h-8">
              {icon}
            </div>
          </div>
          <h2 className="text-lg font-semibold mb-1">{title}</h2>
          <p className="text-sm opacity-70 mb-2">{subtitle}</p>
          <p className="text-xs opacity-60 mb-4">{description}</p>
          {actions.length > 0 && (
            <div className="flex gap-2">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-all duration-300 border border-white/30"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Showcase Component
export const LiquidGlassShowcase: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<string>('single-button');

  const demos = [
    { id: 'single-button', name: 'Single Button' },
    { id: 'button-group', name: 'Button Group' },
    { id: 'dock-horizontal', name: 'Horizontal Dock' },
    { id: 'dock-grid', name: 'Grid Dock' },
    { id: 'control-panel', name: 'Control Panel' },
    { id: 'notification', name: 'Notification' },
    { id: 'location-cards', name: 'Location Cards' },
    { id: 'location-detail', name: 'Location Detail' },
    { id: 'testimonial', name: 'Testimonial' },
  ];

  const backgroundImages = [
    'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&auto=format&fit=crop&q=90',
    'https://images.unsplash.com/photo-1683802175911-464278f124aa?w=800&auto=format&fit=crop&q=90',
    'https://images.unsplash.com/photo-1694637449947-cfe5552518c2?w=800&auto=format&fit=crop&q=90',
    'https://images.unsplash.com/photo-1688223954626-084a6a6c7266?w=800&auto=format&fit=crop&q=90',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop&q=90',
    'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&auto=format&fit=crop&q=90',
    'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&auto=format&fit=crop&q=90', // Location cards
    'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&auto=format&fit=crop&q=90', // Location detail
    'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800&auto=format&fit=crop&q=90', // Testimonial
  ];

  const renderDemo = () => {
    const bgImage = backgroundImages[demos.findIndex(d => d.id === activeDemo)] ?? backgroundImages[0];
    
    switch (activeDemo) {
      case 'single-button':
        return (
          <div 
            className="flex items-center justify-center w-full min-h-[400px] bg-cover bg-center bg-no-repeat rounded-md" 
            style={{ backgroundImage: `url('${bgImage}')` }}
          >
            <LiquidGlassButton>
              Beautiful Button
            </LiquidGlassButton>
          </div>
        );

      case 'button-group':
        return (
          <div 
            className="flex items-center justify-center w-full min-h-[400px] bg-cover bg-center bg-no-repeat rounded-md" 
            style={{ backgroundImage: `url('${bgImage}')` }}
          >
            <div className="flex rounded-lg overflow-hidden border border-white/50 backdrop-blur-sm">
              <LiquidGlassButton className="border-r border-white/50 rounded-none">
                First
              </LiquidGlassButton>
              <LiquidGlassButton className="border-r border-white/50 rounded-none">
                Second
              </LiquidGlassButton>
              <LiquidGlassButton className="rounded-none">
                Third
              </LiquidGlassButton>
            </div>
          </div>
        );

      case 'dock-horizontal':
        return (
          <div 
            className="flex items-center justify-center w-full min-h-[400px] bg-cover bg-center bg-no-repeat rounded-md" 
            style={{ backgroundImage: `url('${bgImage}')` }}
          >
            <LiquidGlassContainer className="flex gap-3 p-4">
              <AppIcon icon={<MailIcon />} label="Mail" />
              <AppIcon icon={<MusicIcon />} label="Music" />
              <AppIcon icon={<AppsIcon />} label="Apps" />
            </LiquidGlassContainer>
          </div>
        );

      case 'dock-grid':
        return (
          <div 
            className="flex items-center justify-center w-full min-h-[400px] bg-cover bg-center bg-no-repeat rounded-md" 
            style={{ backgroundImage: `url('${bgImage}')` }}
          >
            <LiquidGlassContainer className="flex flex-col gap-4 p-4">
              <div className="flex gap-3">
                <AppIcon icon={<MailIcon />} label="Mail" variant="round" />
                <AppIcon icon={<MusicIcon />} label="Music" variant="round" />
                <AppIcon icon={<AppsIcon />} label="Apps" variant="round" />
              </div>
              <div className="flex gap-3">
                <AppIcon icon={<ShopIcon />} label="Shop" variant="round" />
                <AppIcon icon={<CallIcon />} label="Call" variant="round" />
                <AppIcon icon={<MapIcon />} label="Map" variant="round" />
              </div>
            </LiquidGlassContainer>
          </div>
        );

      case 'control-panel':
        return (
          <div 
            className="flex items-center justify-center w-full min-h-[400px] bg-cover bg-center bg-no-repeat rounded-md" 
            style={{ backgroundImage: `url('${bgImage}')` }}
          >
            <LiquidGlassContainer className="flex flex-col gap-6 p-6 max-w-sm">
              <h3 className="text-lg font-semibold relative z-10 mb-2">Control Center</h3>
              <div className="flex gap-4 relative z-10">
                <LiquidGlassButton className="flex-1 px-4 py-3">
                  Wi-Fi
                </LiquidGlassButton>
                <LiquidGlassButton className="flex-1 px-4 py-3">
                  Bluetooth
                </LiquidGlassButton>
              </div>
              <div className="flex gap-4 relative z-10">
                <LiquidGlassButton className="flex-1 px-4 py-3">
                  Airplane Mode
                </LiquidGlassButton>
                <LiquidGlassButton className="flex-1 px-4 py-3">
                  Do Not Disturb
                </LiquidGlassButton>
              </div>
            </LiquidGlassContainer>
          </div>
        );

      case 'notification':
        return (
          <div
            className="flex items-center justify-center w-full min-h-[400px] bg-cover bg-center bg-no-repeat rounded-md"
            style={{ backgroundImage: `url('${bgImage}')` }}
          >
            <LiquidGlassContainer className="flex items-start gap-4 p-4 max-w-md">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center relative z-10">
                <MailIcon />
              </div>
              <div className="flex-1 relative z-10">
                <h4 className="font-semibold mb-1">New Message</h4>
                <p className="text-sm opacity-90 mb-3 leading-relaxed">You have received a new message from John Doe</p>
                <div className="flex gap-2">
                  <LiquidGlassButton className="text-xs px-4 py-2">
                    Reply
                  </LiquidGlassButton>
                  <LiquidGlassButton className="text-xs px-4 py-2">
                    Dismiss
                  </LiquidGlassButton>
                </div>
              </div>
            </LiquidGlassContainer>
          </div>
        );

      case 'location-cards':
        return (
          <div
            className="flex items-center justify-center w-full min-h-[400px] bg-cover bg-center bg-no-repeat rounded-md"
            style={{ backgroundImage: `url('${bgImage}')` }}
          >
            <div className="flex gap-4 max-w-4xl w-full px-4">
              {/* Left Card */}
              <LocationCard
                icon={<MapIcon />}
                title="Central Park"
                subtitle="New York, NY"
                description="843 acres of green space in the heart of Manhattan, featuring lakes, meadows, walking paths, recreational facilities, and countless opportunities for outdoor activities."
                variant="detailed"
                className="flex-1"
              />

              {/* Right Column with 2 Cards */}
              <div className="flex-1 flex flex-col gap-4">
                <LocationCard
                  icon={<StarIcon />}
                  title="Times Square"
                  subtitle="Tourist attraction"
                  variant="compact"
                />
                <LocationCard
                  icon={<CalendarIcon />}
                  title="Brooklyn Bridge"
                  subtitle="Historic landmark"
                  variant="compact"
                />
              </div>
            </div>
          </div>
        );

      case 'location-detail':
        return (
          <div
            className="flex items-center justify-center w-full min-h-[400px] bg-cover bg-center bg-no-repeat rounded-md"
            style={{ backgroundImage: `url('${bgImage}')` }}
          >
            <LocationDetailCard
              icon={<MapIcon />}
              title="Central Park"
              subtitle="New York, NY"
              description="843 acres of green space in Manhattan"
              actions={[
                { label: 'View Map', onClick: () => console.log('View Map clicked') },
                { label: 'Directions', onClick: () => console.log('Directions clicked') }
              ]}
            />
          </div>
        );

      case 'testimonial':
        return (
          <div
            className="flex items-center justify-center w-full min-h-[400px] bg-cover bg-center bg-no-repeat rounded-md"
            style={{ backgroundImage: `url('${bgImage}')` }}
          >
            <TestimonialCard
              quote="This product has completely transformed our workflow. The team's productivity has increased by 300% and our clients are thrilled with the results."
              author="Sarah Johnson"
              jobTitle="CEO, TechStart Inc."
              avatar="https://images.unsplash.com/photo-1539614474468-f423a2d2270c?w=480&h=480&fit=crop&crop=face&auto=format"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-6">Liquid Glass Showcase</h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Explore authentic Apple Liquid Glass design patterns with real-world use cases, including components inspired by DS.
          Each demo showcases complex gradient layers, shadow combinations, and beautiful transparency effects.
        </p>

        {/* Demo Navigation */}
        <div className="flex flex-wrap gap-3 mb-8">
          {demos.map((demo) => (
            <button
              key={demo.id}
              onClick={() => setActiveDemo(demo.id)}
              className={`px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
                activeDemo === demo.id
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {demo.name}
            </button>
          ))}
        </div>
      </div>

      {/* Demo Container */}
      <div className="bg-gray-50 rounded-xl p-6 shadow-inner">
        {renderDemo()}
      </div>

      {/* Technical Details */}
      <div className="mt-10 p-8 bg-gray-50 rounded-xl">
        <h2 className="text-xl font-semibold mb-6">Technical Implementation</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold mb-3">Glass Morphism Effects</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• <code className="bg-gray-200 px-1 rounded">backdrop-filter: blur()</code> for authentic glass blur</li>
              <li>• <code className="bg-gray-200 px-1 rounded">bg-black/20</code> for subtle transparency</li>
              <li>• <code className="bg-gray-200 px-1 rounded">border-white/50</code> for glass edge definition</li>
              <li>• Complex shadow combinations for depth</li>
              <li>• Multiple gradient layers using pseudo-elements</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3"> UI Integration</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Location cards with flexible layouts</li>
              <li>• Testimonial cards with avatar support</li>
              <li>• Detail cards with action buttons</li>
              <li>• Responsive multi-card compositions</li>
              <li>• Creative Tim design patterns</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Performance Features</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Hardware-accelerated animations</li>
              <li>• GPU-optimized transform and opacity</li>
              <li>• Progressive enhancement with fallbacks</li>
              <li>• Efficient CSS with minimal repaints</li>
              <li>• Responsive design with mobile-first approach</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiquidGlassShowcase;
