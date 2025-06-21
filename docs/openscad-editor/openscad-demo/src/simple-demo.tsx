import React, { useState } from 'react';
import Editor from '@monaco-editor/react';

const SimpleDemo: React.FC = () => {
  const [code, setCode] = useState<string>(`// Sample OpenSCAD Code

cube(10);
sphere(5);
translate([10, 0, 0])
  cylinder(h=20, r=3);

// Functions and modules
module my_shape(size) {
  difference() {
    cube(size);
    sphere(size/2);
  }
}

my_shape(15);
`);

  return (
    <div style={{ padding: '20px' }}>
      <h1>OpenSCAD Editor Demo (Simple)</h1>
      <p>This is a basic Monaco editor with OpenSCAD syntax highlighting.</p>
      
      <div style={{ height: '500px', border: '1px solid #ccc'}}>
        <Editor
          height="100%"
          language="javascript" // Fallback language for basic highlighting
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value || '')}
          options={{
            glyphMargin: true,
            lineNumbers: 'on',
            minimap: { enabled: false },
          }}
        />
      </div>

      <details style={{ marginTop: '20px' }}>
        <summary>Current Code (for debugging)</summary>
        <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
          {code}
        </pre>
      </details>
    </div>
  );
};

export default SimpleDemo;
