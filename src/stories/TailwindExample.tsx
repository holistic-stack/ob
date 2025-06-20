import React from 'react';

export interface TailwindExampleProps {
  /** The title to display */
  title?: string;
  /** The variant style */
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  /** Whether to show the card with shadow */
  elevated?: boolean;
}

/** Example component demonstrating Tailwind CSS v4 integration */
export const TailwindExample = ({
  title = 'Tailwind CSS v4 Example',
  variant = 'primary',
  elevated = false,
}: TailwindExampleProps) => {
  const variantClasses = {
    primary: 'bg-blue-500 text-white border-blue-600',
    secondary: 'bg-gray-500 text-white border-gray-600',
    success: 'bg-green-500 text-white border-green-600',
    warning: 'bg-yellow-500 text-black border-yellow-600',
    danger: 'bg-red-500 text-white border-red-600',
  };

  const shadowClass = elevated ? 'shadow-lg' : 'shadow-sm';

  return (
    <div className={`max-w-md mx-auto ${shadowClass} rounded-lg overflow-hidden`}>
      <div className={`px-6 py-4 border-l-4 ${variantClasses[variant]}`}>
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p className="text-sm opacity-90">
          This component demonstrates Tailwind CSS v4 integration with Storybook v9 in a Vite 6 project.
        </p>
      </div>
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex flex-wrap gap-2">
          <span className="inline-block bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
            #tailwindcss
          </span>
          <span className="inline-block bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
            #storybook
          </span>
          <span className="inline-block bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
            #vite
          </span>
        </div>
      </div>
      <div className="px-6 py-4">
        <button className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200">
          Click me!
        </button>
      </div>
    </div>
  );
};
