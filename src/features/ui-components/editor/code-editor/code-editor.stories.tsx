import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { CodeEditor } from './code-editor';

// Code examples for different languages
const codeExamples = {
  javascript: `// JavaScript Example
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));`,

  typescript: `// TypeScript Example
interface User {
  id: number;
  name: string;
  email: string;
}

function createUser(data: Partial<User>): User {
  return {
    id: Math.random(),
    name: 'Unknown',
    email: 'unknown@example.com',
    ...data,
  };
}`,

  openscad: `// OpenSCAD Example
module gear(teeth=20, pitch=5, thickness=3) {
  pitch_radius = teeth * pitch / (2 * PI);
  
  linear_extrude(height=thickness) {
    difference() {
      circle(r=pitch_radius + 2);
      circle(r=2); // Center hole
    }
  }
}

gear(teeth=16, pitch=3);`,

  python: `# Python Example
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    
    return quicksort(left) + middle + quicksort(right)

print(quicksort([3, 6, 8, 10, 1, 2, 1]))`,

  html: `<!-- HTML Example -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Glass Morphism Demo</title>
</head>
<body>
  <div class="glass-container">
    <h1>Welcome to Glass UI</h1>
    <p>Beautiful glass morphism effects</p>
  </div>
</body>
</html>`,

  css: `/* CSS Example */
.glass-container {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 
    inset 1px 1px 0 rgba(255, 255, 255, 0.75),
    0 6px 6px rgba(0, 0, 0, 0.2);
}`,
};

const meta: Meta<typeof CodeEditor> = {
  title: 'Editor/CodeEditor',
  component: CodeEditor,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Code editor component with syntax highlighting, line numbers, and glass morphism effects.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    language: {
      control: { type: 'select' },
      options: ['javascript', 'typescript', 'python', 'java', 'cpp', 'html', 'css', 'json', 'markdown', 'openscad'],
      description: 'Programming language for syntax highlighting',
    },
    theme: {
      control: { type: 'select' },
      options: ['light', 'dark', 'auto'],
      description: 'Editor theme',
    },
    showLineNumbers: {
      control: { type: 'boolean' },
      description: 'Whether to show line numbers',
    },
    readOnly: {
      control: { type: 'boolean' },
      description: 'Whether the editor is read-only',
    },
    overLight: {
      control: { type: 'boolean' },
      description: 'Whether the editor is over a light background',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full h-96 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: codeExamples.javascript,
    language: 'javascript',
    showLineNumbers: true,
    theme: 'dark',
  },
};

export const TypeScript: Story = {
  args: {
    value: codeExamples.typescript,
    language: 'typescript',
    showLineNumbers: true,
    theme: 'dark',
  },
};

export const OpenSCAD: Story = {
  args: {
    value: codeExamples.openscad,
    language: 'openscad',
    showLineNumbers: true,
    theme: 'dark',
  },
};

export const Python: Story = {
  args: {
    value: codeExamples.python,
    language: 'python',
    showLineNumbers: true,
    theme: 'dark',
  },
};

export const WithoutLineNumbers: Story = {
  args: {
    value: codeExamples.javascript,
    language: 'javascript',
    showLineNumbers: false,
    theme: 'dark',
  },
};

export const ReadOnly: Story = {
  args: {
    value: codeExamples.css,
    language: 'css',
    showLineNumbers: true,
    readOnly: true,
    theme: 'dark',
  },
};

export const Interactive: Story = {
  render: (args) => {
    const [code, setCode] = useState(codeExamples.javascript);
    const [language, setLanguage] = useState<'javascript' | 'typescript' | 'python' | 'openscad' | 'html' | 'css'>('javascript');
    const [saveCount, setSaveCount] = useState(0);

    const handleLanguageChange = (newLanguage: typeof language) => {
      setLanguage(newLanguage);
      setCode(codeExamples[newLanguage]);
    };

    const handleSave = () => {
      setSaveCount(prev => prev + 1);
      console.log('Code saved!', { code, language });
    };

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {Object.keys(codeExamples).map((lang) => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang as typeof language)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                language === lang
                  ? 'bg-blue-500 text-white'
                  : 'bg-black/20 text-white/80 hover:bg-black/40'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
        
        <CodeEditor
          {...args}
          value={code}
          onChange={setCode}
          language={language}
          onSave={handleSave}
          showLineNumbers
        />
        
        {saveCount > 0 && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-green-400 text-sm">
            Code saved {saveCount} time{saveCount !== 1 ? 's' : ''}! (Ctrl+S)
          </div>
        )}
      </div>
    );
  },
  args: {
    theme: 'dark',
  },
};

export const LightTheme: Story = {
  args: {
    value: codeExamples.html,
    language: 'html',
    showLineNumbers: true,
    theme: 'light',
    overLight: true,
  },
  decorators: [
    (Story) => (
      <div className="w-full h-96 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-4">
        <Story />
      </div>
    ),
  ],
};
