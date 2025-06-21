import { test, expect } from '@playwright/test';

/**
 * @file Syntax Highlighting Debug E2E Tests
 * @description Tests to debug and verify OpenSCAD syntax highlighting functionality
 * 
 * This test suite focuses on verifying that syntax highlighting is working correctly
 * in the OpenSCAD editor by checking for proper CSS classes and color application.
 */

test.describe('OpenSCAD Syntax Highlighting Debug', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the demo page
    await page.goto('http://localhost:4201');
    
    // Wait for the editor to be fully loaded
    await page.waitForSelector('[data-testid="monaco-editor-container"]', { timeout: 10000 });
    
    // Wait for Monaco Editor to be initialized
    await page.waitForFunction(() => {
      return window.monaco && window.monaco.editor;
    }, { timeout: 15000 });

    console.log('[INIT] 🎨 Starting syntax highlighting debug test');
  });

  test('should have OpenSCAD language registered', async ({ page }) => {
    console.log('[DEBUG] 🔍 Checking if OpenSCAD language is registered...');
    
    // Check if OpenSCAD language is registered in Monaco
    const isLanguageRegistered = await page.evaluate(() => {
      if (!window.monaco || !window.monaco.languages) {
        return { registered: false, error: 'Monaco not available' };
      }
      
      const languages = window.monaco.languages.getLanguages();
      const openscadLanguage = languages.find(lang => lang.id === 'openscad');
      
      return {
        registered: !!openscadLanguage,
        language: openscadLanguage,
        totalLanguages: languages.length,
        allLanguageIds: languages.map(l => l.id)
      };
    });

    console.log('[DEBUG] 📊 Language registration result:', isLanguageRegistered);
    
    expect(isLanguageRegistered.registered).toBe(true);
    expect(isLanguageRegistered.language?.id).toBe('openscad');
  });

  test('should have OpenSCAD theme defined', async ({ page }) => {
    console.log('[DEBUG] 🎨 Checking if OpenSCAD theme is defined...');
    
    // Check if the OpenSCAD theme is defined
    const themeInfo = await page.evaluate(() => {
      if (!window.monaco || !window.monaco.editor) {
        return { available: false, error: 'Monaco editor not available' };
      }

      try {
        // Try to get current theme
        const currentTheme = window.monaco.editor.getTheme?.() || 'unknown';
        
        // Check if we can set the OpenSCAD theme
        window.monaco.editor.setTheme('openscad-dark');
        const afterSetTheme = window.monaco.editor.getTheme?.() || 'unknown';
        
        return {
          available: true,
          currentTheme,
          afterSetTheme,
          themeApplied: afterSetTheme === 'openscad-dark'
        };
      } catch (error) {
        return {
          available: false,
          error: error.message
        };
      }
    });

    console.log('[DEBUG] 🎨 Theme info:', themeInfo);
    
    expect(themeInfo.available).toBe(true);
  });

  test('should apply syntax highlighting to OpenSCAD keywords', async ({ page }) => {
    console.log('[DEBUG] 🔍 Testing syntax highlighting for keywords...');

    // Wait for the editor to be fully loaded and accessible
    await page.waitForFunction(() => {
      return window.monaco &&
             window.monaco.editor &&
             window.monaco.editor.getModels &&
             window.monaco.editor.getModels().length > 0;
    }, { timeout: 10000 });

    console.log('[DEBUG] ✅ Editor models are available');

    // Clear the editor and add test code
    const testCode = `module test_module(size = 10) {
    cube([size, size, size]);
    sphere(r = size/2);
}`;

    // Set the test code in the editor and check language
    const editorSetupResult = await page.evaluate((code) => {
      const models = window.monaco?.editor?.getModels();
      const editor = models?.[0];

      if (!editor) {
        return { success: false, error: 'No editor model found', modelCount: models?.length || 0 };
      }

      // Set the content
      editor.setValue(code);

      // Try to set the language explicitly
      try {
        window.monaco.editor.setModelLanguage(editor, 'openscad');
      } catch (e) {
        console.warn('Failed to set language:', e);
      }

      return {
        success: true,
        languageId: editor.getLanguageId?.() || 'unknown',
        modelCount: models?.length || 0,
        content: editor.getValue().substring(0, 50)
      };
    }, testCode);

    console.log('[DEBUG] 🔧 Editor setup result:', editorSetupResult);

    // Wait for syntax highlighting to be applied
    await page.waitForTimeout(3000);

    // Check for syntax highlighting classes and tokenization
    const highlightingInfo = await page.evaluate(() => {
      const editorElement = document.querySelector('.monaco-editor .view-lines');
      if (!editorElement) {
        return { found: false, error: 'Editor element not found' };
      }

      // Look for Monaco's token classes
      const tokenElements = editorElement.querySelectorAll('[class*="mtk"]');
      const classNames = Array.from(tokenElements).map(el => el.className);

      // Get unique classes
      const uniqueClasses = [...new Set(classNames)];

      // Look for specific content and classes
      const moduleElements = Array.from(editorElement.querySelectorAll('*')).filter(el =>
        el.textContent?.includes('module') && el.textContent.length < 10
      );

      const cubeElements = Array.from(editorElement.querySelectorAll('*')).filter(el =>
        el.textContent?.includes('cube') && el.textContent.length < 10
      );

      // Check if Monaco tokenizer is working
      const models = window.monaco?.editor?.getModels();
      const model = models?.[0];
      let tokenizationInfo = null;

      if (model) {
        try {
          // Try to get tokenization info
          const lineCount = model.getLineCount();
          tokenizationInfo = {
            lineCount,
            languageId: model.getLanguageId?.() || 'unknown',
            hasTokens: true
          };
        } catch (e) {
          tokenizationInfo = { error: e.message };
        }
      }

      return {
        found: tokenElements.length > 0,
        totalTokens: tokenElements.length,
        uniqueClasses,
        sampleClasses: classNames.slice(0, 15),
        moduleElements: moduleElements.map(el => ({ text: el.textContent, class: el.className })),
        cubeElements: cubeElements.map(el => ({ text: el.textContent, class: el.className })),
        editorContent: editorElement.textContent?.substring(0, 100),
        tokenizationInfo
      };
    });

    console.log('[DEBUG] 🎨 Detailed syntax highlighting info:', JSON.stringify(highlightingInfo, null, 2));

    expect(highlightingInfo.found).toBe(true);
    expect(highlightingInfo.totalTokens).toBeGreaterThan(0);

    // Check if we have different token classes (indicating proper tokenization)
    expect(highlightingInfo.uniqueClasses.length).toBeGreaterThan(1);
  });

  test('should have correct language set on editor model', async ({ page }) => {
    console.log('[DEBUG] 🔍 Checking editor model language...');
    
    const modelInfo = await page.evaluate(() => {
      const models = window.monaco?.editor?.getModels();
      if (!models || models.length === 0) {
        return { hasModel: false, error: 'No models found' };
      }

      const model = models[0];
      return {
        hasModel: true,
        languageId: model.getLanguageId(),
        modelUri: model.uri.toString(),
        totalModels: models.length
      };
    });

    console.log('[DEBUG] 📊 Model info:', modelInfo);
    
    expect(modelInfo.hasModel).toBe(true);
    expect(modelInfo.languageId).toBe('openscad');
  });

  test('should capture console logs for debugging', async ({ page }) => {
    console.log('[DEBUG] 🔍 Capturing console logs...');
    
    // Capture console logs
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Trigger a refresh to see initialization logs
    await page.reload();
    await page.waitForSelector('[data-testid="monaco-editor-container"]', { timeout: 10000 });
    
    // Wait a bit for logs to accumulate
    await page.waitForTimeout(2000);

    console.log('[DEBUG] 📝 Console logs captured:');
    logs.forEach(log => console.log('  ', log));

    // Check for specific initialization logs
    const hasLanguageRegistration = logs.some(log => log.includes('OpenSCAD language registered'));
    const hasThemeDefinition = logs.some(log => log.includes('OpenSCAD theme'));
    
    console.log('[DEBUG] 🔍 Key logs found:', {
      hasLanguageRegistration,
      hasThemeDefinition,
      totalLogs: logs.length
    });

    expect(logs.length).toBeGreaterThan(0);
  });
});
