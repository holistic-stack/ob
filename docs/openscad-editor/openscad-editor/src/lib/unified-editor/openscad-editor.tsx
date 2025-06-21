/**
 * @file OpenSCAD Editor Component
 *
 * A feature-toggle based OpenSCAD editor that provides configurable capabilities
 * for different use cases and performance requirements.
 *
 * Features can be selectively enabled/disabled for performance optimization
 * and customization based on use case requirements.
 *
 * @example Basic Editor
 * ```tsx
 * <OpenscadEditor
 *   value={code}
 *   onChange={setCode}
 *   features="BASIC"
 * />
 * ```
 *
 * @example Full IDE Experience
 * ```tsx
 * <OpenscadEditor
 *   value={code}
 *   onChange={setCode}
 *   features="FULL"
 *   onParseResult={handleParseResult}
 *   onError={handleErrors}
 * />
 * ```
 *
 * @example Custom Feature Configuration
 * ```tsx
 * <OpenscadEditor
 *   value={code}
 *   onChange={setCode}
 *   features={{
 *     core: { syntaxHighlighting: true, basicEditing: true, keyboardShortcuts: true },
 *     ast: { astParsing: true, errorDetection: true, documentOutline: false },
 *     enhanced: { codeCompletion: true, navigationCommands: false },
 *     advanced: { folding: true, bracketMatching: true }
 *   }}
 * />
 * ```
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import Editor, { type Monaco, loader } from '@monaco-editor/react';
import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api';

import { registerOpenSCADLanguage } from '../openscad-language';
import {
  type OpenscadEditorFeatures,
  type FeaturePreset,
  type PerformanceConfig,
  DEFAULT_PERFORMANCE,
  createFeatureConfig,
  requiresParser,
  hasIDEFeatures,
  hasAdvancedFeatures
} from './feature-config';

// Lazy imports for optional features
const lazyImports = {
  parserService: () => import('../services/openscad-parser-service'),
  completionProvider: () => import('../completion/completion-provider'),
  navigationProvider: () => import('../navigation/navigation-provider'),
  navigationCommands: () => import('../navigation/navigation-commands'),
  hoverProvider: () => import('../hover/hover-provider'),
  formattingService: () => import('../formatting/formatting-service'),
  diagnosticsService: () => import('../diagnostics'),
  editorFeatures: () => import('../editor-features'),
  keyboardShortcuts: () => import('../keyboard-shortcuts/keyboard-shortcuts-config')
};

const LANGUAGE_ID = 'openscad';
const THEME_ID = 'openscad-dark';

/**
 * Props for the OpenSCAD Editor
 */
export interface OpenscadEditorProps {
  /** Current code value */
  value?: string;
  /** Callback when code changes */
  onChange?: (value: string | undefined) => void;
  /** Editor height */
  height?: string | number;
  /** Editor width */
  width?: string | number;
  /** Editor theme */
  theme?: string;
  /** Monaco editor options */
  options?: monacoEditor.editor.IStandaloneEditorConstructionOptions;
  
  /** Feature configuration - can be a preset name or custom configuration */
  features?: FeaturePreset | OpenscadEditorFeatures;
  /** Performance configuration */
  performance?: Partial<PerformanceConfig>;
  
  /** WASM file path for the parser (when parser features are enabled) */
  wasmPath?: string;
  
  // Callbacks for AST-based features
  /** Callback when parse result changes (requires AST features) */
  onParseResult?: (result: any) => void;
  /** Callback when document outline changes (requires AST features) */
  onOutlineChange?: (outline: any[]) => void;
  /** Callback when errors are detected (requires error detection) */
  onError?: (errors: any[]) => void;
  /** Callback when formatting service is ready (requires formatting) */
  onFormattingServiceReady?: (service: any) => void;
}

/**
 * Editor state for tracking initialization and services
 */
interface EditorState {
  isMonacoReady: boolean;
  isParserReady: boolean;
  isInitialized: boolean;
  initError: string | null;
  currentErrors: any[];
}

/**
 * OpenSCAD Editor Component
 *
 * Provides a configurable OpenSCAD editing experience with selective feature enabling:
 * - Basic: Syntax highlighting and text editing
 * - Parser: Real-time parsing and error detection
 * - IDE: Code completion, navigation, hover info
 * - Advanced: Refactoring, symbol search, folding
 */
export const OpenscadEditor: React.FC<OpenscadEditorProps> = ({
  value = '',
  onChange,
  height = '400px',
  width = '100%',
  theme = THEME_ID,
  options = {},
  features = 'BASIC',
  performance = {},
  wasmPath = '/tree-sitter-openscad.wasm',
  onParseResult,
  onOutlineChange,
  onError,
  onFormattingServiceReady
}) => {
  // Resolve feature configuration
  const featureConfig = typeof features === 'string'
    ? createFeatureConfig(features)
    : features;

  console.log('🚀 [EDITOR] OpenscadEditor component initialized with features:', features);
  console.log('🔍 [EDITOR] Feature config:', {
    codeCompletion: featureConfig.ide.codeCompletion,
    requiresParser: requiresParser(featureConfig)
  });
  console.log('🔍 [EDITOR] Component render cycle starting...');
  
  const performanceConfig = { ...DEFAULT_PERFORMANCE, ...performance };
  
  // Refs for editor and services
  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const servicesRef = useRef<{
    parserService?: any;
    completionProvider?: any;
    enhancedCompletionProvider?: any;
    semanticHighlightingProvider?: any;
    navigationProvider?: any;
    hoverProvider?: any;
    formattingService?: any;
    diagnosticsService?: any;
    editorFeaturesService?: any;
    navigationCommands?: any;
  }>({});
  const disposablesRef = useRef<monacoEditor.IDisposable[]>([]);
  const parseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Component state
  const [state, setState] = useState<EditorState>({
    isMonacoReady: false,
    isParserReady: false,
    isInitialized: false,
    initError: null,
    currentErrors: []
  });

  /**
   * Initialize Monaco editor and register basic language support
   */
  const initializeMonaco = useCallback(async () => {
    console.log('🚀 [INIT] Starting Monaco initialization...');

    try {
      console.log('⏳ [LOADING] Initializing Monaco Editor...');
      const monaco = await loader.init();
      monacoRef.current = monaco;
      console.log('✅ [SUCCESS] Monaco Editor loaded successfully');

      console.log('⏳ [LOADING] Registering OpenSCAD language...');
      // Always register basic OpenSCAD language support
      const { disposables } = registerOpenSCADLanguage(monaco);
      disposablesRef.current.push(...disposables);
      console.log('✅ [SUCCESS] OpenSCAD language registered with disposables:', disposables.length);

      console.log('✅ [SUCCESS] Setting Monaco ready state...');
      setState(prev => ({ ...prev, isMonacoReady: true }));
      console.log('✅ [SUCCESS] Monaco initialization completed successfully');
    } catch (error) {
      console.error('❌ [ERROR] Monaco initialization failed:', error);
      setState(prev => ({
        ...prev,
        initError: `Failed to initialize Monaco: ${error instanceof Error ? error.message : String(error)}`
      }));
    }
  }, []);

  /**
   * Initialize parser-based services if required
   */
  /**
   * Initialize parser services when required
   * Fixed: Removed initializeEnhancedServices from dependency to prevent recreation
   */
  const initializeParserServices = useCallback(async () => {
    console.log('🚀 [INIT] initializeParserServices called');
    console.log('🔍 [INIT] requiresParser:', requiresParser(featureConfig));
    console.log('🔍 [INIT] monacoRef.current:', !!monacoRef.current);

    if (!requiresParser(featureConfig) || !monacoRef.current) {
      console.log('ℹ️ [INIT] Parser not required or Monaco not ready, skipping parser services initialization');
      setState(prev => ({ ...prev, isParserReady: true, isInitialized: true }));
      return;
    }

    try {
      console.log('🔧 [INIT] Initializing parser service...');
      // Lazy load parser service
      const { OpenSCADParserService } = await lazyImports.parserService();
      const parserService = new OpenSCADParserService();
      await parserService.init();
      servicesRef.current.parserService = parserService;
      console.log('✅ [INIT] Parser service initialized successfully');

      setState(prev => ({ ...prev, isParserReady: true }));

      // Initialize enhanced services directly here to avoid dependency issues
      console.log('🔧 [INIT] Calling initializeEnhancedServices...');
      await initializeEnhancedServicesInternal();
      console.log('✅ [INIT] Enhanced services initialization completed');

      setState(prev => ({ ...prev, isInitialized: true }));
      console.log('✅ [INIT] Parser services initialization completed successfully');
    } catch (error) {
      console.error('❌ [INIT] Parser services initialization failed:', error);
      setState(prev => ({
        ...prev,
        initError: `Failed to initialize AST services: ${error instanceof Error ? error.message : String(error)}`
      }));
    }
  }, [featureConfig]);

  /**
   * Initialize enhanced services based on feature configuration
   * Internal function to avoid useEffect dependency issues
   */
  const initializeEnhancedServicesInternal = async () => {
    console.log('🚀 [INIT] initializeEnhancedServices called');
    console.log('🔍 [INIT] Feature config:', {
      codeCompletion: featureConfig.ide.codeCompletion,
      navigationCommands: featureConfig.ide.navigationCommands,
      hoverInformation: featureConfig.ide.hoverInformation,
      diagnostics: featureConfig.ide.diagnostics,
      formatting: featureConfig.ide.formatting
    });

    const monaco = monacoRef.current;
    const parserService = servicesRef.current.parserService;

    console.log('🔍 [INIT] Dependencies:', {
      hasMonaco: !!monaco,
      hasParserService: !!parserService,
      parserServiceReady: parserService?.isReady?.() || false
    });

    if (!monaco || !parserService) {
      console.warn('❌ [INIT] Missing dependencies - monaco:', !!monaco, 'parserService:', !!parserService);
      return;
    }

    try {
      // Initialize completion provider
      if (featureConfig.ide.codeCompletion) {
        console.log('🔧 [INIT] Initializing completion providers...');

        // Try to initialize Enhanced Completion Provider first
        let enhancedProviderInitialized = false;
        try {
          console.log('🔧 [INIT] Importing Enhanced Completion Provider...');
          const { EnhancedCompletionProvider } = await import('../advanced-features/enhanced-completion-provider/enhanced-completion-provider');
          console.log('✅ [INIT] Enhanced Completion Provider imported successfully');

          // Get the enhanced parser from the parser service
          const enhancedParser = (parserService as any).parser;
          console.log('🔍 [INIT] Enhanced parser available:', !!enhancedParser);

          if (enhancedParser) {
            console.log('🔧 [INIT] Creating Enhanced Completion Provider instance...');
            const enhancedProvider = new EnhancedCompletionProvider(enhancedParser);

            // Update the enhanced provider with current AST and symbols when available
            if (parserService?.isReady()) {
              try {
                const ast = parserService.getAST();
                const symbols = parserService.getSymbols?.() || [];
                enhancedProvider.updateAST(ast, symbols);
                console.log('✅ [INIT] Enhanced Completion Provider initialized with AST and symbols:', {
                  astLength: ast?.length || 0,
                  symbolsLength: symbols.length
                });
              } catch (astError) {
                console.warn('⚠️ [INIT] Failed to get AST/symbols for Enhanced Completion Provider:', astError);
              }
            } else {
              console.log('ℹ️ [INIT] Enhanced Completion Provider initialized without initial AST (parser not ready)');
            }

            // Register enhanced completion provider for multiple language IDs to ensure coverage
            console.log('🔧 [INIT] Registering Enhanced Completion Provider with Monaco...');
            const disposables = [
              monaco.languages.registerCompletionItemProvider(LANGUAGE_ID, enhancedProvider),
              monaco.languages.registerCompletionItemProvider('plaintext', enhancedProvider) // Fallback
            ];
            console.log('✅ [INIT] Enhanced Completion Provider registered for multiple languages, disposables:', disposables.map(d => !!d));

            servicesRef.current.enhancedCompletionProvider = enhancedProvider;
            enhancedProviderInitialized = true;
            console.log('✅ [INIT] Enhanced Completion Provider setup completed successfully');
          } else {
            console.warn('❌ [INIT] Enhanced parser not available for Enhanced Completion Provider');
          }
        } catch (error) {
          console.error('❌ [INIT] Enhanced Completion Provider initialization failed:', error);
        }

        // Fallback to original completion provider if Enhanced provider failed
        if (!enhancedProviderInitialized) {
          try {
            console.log('🔧 [INIT] Falling back to original completion provider...');
            const { OpenSCADCompletionProvider } = await lazyImports.completionProvider();
            const completionProvider = new OpenSCADCompletionProvider(parserService);
            const disposable = monaco.languages.registerCompletionItemProvider(LANGUAGE_ID, completionProvider);
            console.log('✅ [INIT] Original completion provider registered, disposable:', !!disposable);

            servicesRef.current.completionProvider = completionProvider;
            console.log('✅ [INIT] Original OpenSCAD Completion Provider registered as fallback');
          } catch (fallbackError) {
            console.error('❌ [INIT] Fallback completion provider also failed:', fallbackError);
          }
        }
      } else {
        console.log('ℹ️ [INIT] Code completion disabled in feature configuration');
      }

      // Initialize Semantic Highlighting Provider
      if (featureConfig.advanced.semanticHighlighting) {
        try {
          const { createSemanticHighlightingProvider } = await import('../advanced-features/semantic-highlighting');
          const semanticProvider = createSemanticHighlightingProvider(parserService);

          // Register semantic highlighting provider
          monaco.languages.registerDocumentSemanticTokensProvider(LANGUAGE_ID, semanticProvider);
          servicesRef.current.semanticHighlightingProvider = semanticProvider;
        } catch (error) {
          console.warn('Semantic Highlighting Provider not available:', error);
        }
      }

      // Initialize navigation provider
      if (featureConfig.ide.navigationCommands) {
        const { OpenSCADNavigationProvider } = await lazyImports.navigationProvider();
        const navigationProvider = new OpenSCADNavigationProvider(parserService);
        monaco.languages.registerDefinitionProvider(LANGUAGE_ID, navigationProvider);
        monaco.languages.registerReferenceProvider(LANGUAGE_ID, navigationProvider);
        servicesRef.current.navigationProvider = navigationProvider;
      }

      // Initialize hover provider
      if (featureConfig.ide.hoverInformation) {
        const { OpenSCADHoverProvider } = await lazyImports.hoverProvider();
        const hoverProvider = new OpenSCADHoverProvider(parserService);
        monaco.languages.registerHoverProvider(LANGUAGE_ID, hoverProvider);
        servicesRef.current.hoverProvider = hoverProvider;
      }

      // Initialize formatting service
      if (featureConfig.ide.formatting) {
        const { FormattingService } = await lazyImports.formattingService();
        const formattingService = new FormattingService(parserService);
        servicesRef.current.formattingService = formattingService;
        onFormattingServiceReady?.(formattingService);
      }

      // Initialize diagnostics service
      if (featureConfig.ide.diagnostics || featureConfig.ide.quickFixes) {
        const { createDiagnosticsService } = await lazyImports.diagnosticsService();
        const diagnosticsService = createDiagnosticsService(parserService, {
          enableRealTime: featureConfig.ide.diagnostics,
          errorDetection: {
            enableSyntaxErrors: true,
            enableSemanticErrors: true,
            enableWarnings: true,
            enableHints: true
          },
          quickFix: {
            enableSyntaxFixes: featureConfig.ide.quickFixes,
            enableSemanticFixes: featureConfig.ide.quickFixes,
            enableRefactoring: featureConfig.ide.quickFixes
          }
        });
        
        await diagnosticsService.init();
        diagnosticsService.registerWithMonaco(monaco);
        servicesRef.current.diagnosticsService = diagnosticsService;
      }

      // Initialize advanced editor features
      if (hasAdvancedFeatures(featureConfig)) {
        const { createEditorFeaturesService } = await lazyImports.editorFeatures();
        const editorFeaturesService = createEditorFeaturesService(parserService, {
          enableFolding: featureConfig.advanced.folding,
          enableBracketMatching: featureConfig.advanced.bracketMatching,
          enableIndentation: featureConfig.advanced.smartIndentation,
          enableComments: featureConfig.advanced.commentCommands
        });
        
        await editorFeaturesService.registerWithMonaco(monaco);
        servicesRef.current.editorFeaturesService = editorFeaturesService;
      }
    } catch (error) {
      // Log error but don't throw to avoid breaking the editor
      setState(prev => ({
        ...prev,
        initError: `Failed to initialize enhanced services: ${error instanceof Error ? error.message : String(error)}`
      }));
    }
  };

  // Initialize Monaco on mount
  useEffect(() => {
    console.log('🔍 [EFFECT] Monaco initialization useEffect triggered');
    initializeMonaco();

    return () => {
      console.log('🔍 [EFFECT] Monaco cleanup triggered');
      // Cleanup disposables
      disposablesRef.current.forEach(disposable => disposable.dispose());
      disposablesRef.current = [];

      // Cleanup parse timeout
      if (parseTimeoutRef.current) {
        clearTimeout(parseTimeoutRef.current);
      }

      // Dispose services
      Object.values(servicesRef.current).forEach(service => {
        if (service && typeof service.dispose === 'function') {
          service.dispose();
        }
      });
      servicesRef.current = {};
    };
  }, [initializeMonaco]);

  // Initialize parser services when Monaco is ready
  useEffect(() => {
    console.log('🔍 [EFFECT] Parser services useEffect triggered', {
      isMonacoReady: state.isMonacoReady,
      hasInitializeParserServices: !!initializeParserServices
    });

    if (state.isMonacoReady) {
      console.log('✅ [EFFECT] Monaco is ready, calling initializeParserServices...');
      initializeParserServices();
    } else {
      console.log('⏳ [EFFECT] Monaco not ready yet, waiting...');
    }
  }, [state.isMonacoReady, initializeParserServices]);

  /**
   * Handle editor mount and register features
   */
  const handleEditorDidMount = useCallback(async (
    editor: monacoEditor.editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) => {
    editorRef.current = editor;

    console.log('[DEBUG] 🎨 Editor mounted, applying theme...');

    // Ensure the theme is applied after editor mount
    try {
      monaco.editor.setTheme('openscad-dark');
      console.log('[SUCCESS] ✅ Theme applied on editor mount');
    } catch (error) {
      console.warn('[WARN] ⚠️ Failed to apply theme on mount:', error);
    }

    // Ensure the model has the correct language
    const model = editor.getModel();
    if (model) {
      try {
        const currentLanguage = model.getLanguageId();
        console.log('[DEBUG] 🔍 Current model language:', currentLanguage);

        if (currentLanguage !== 'openscad') {
          console.log('[DEBUG] 🔧 Setting model language to openscad...');
          monaco.editor.setModelLanguage(model, 'openscad');
          console.log('[SUCCESS] ✅ Model language set to openscad');

          // Force a re-tokenization by triggering a content change
          const currentValue = model.getValue();
          model.setValue(currentValue);
          console.log('[DEBUG] 🔄 Triggered re-tokenization');
        }
      } catch (error) {
        console.warn('[WARN] ⚠️ Failed to check/set model language:', error);
      }
    }

    // Register keyboard shortcuts if enabled
    if (featureConfig.core.keyboardShortcuts) {
      try {
        const { KEYBOARD_SHORTCUTS } = await lazyImports.keyboardShortcuts();
        
        // Register navigation commands if available
        if (servicesRef.current.navigationProvider) {
          const { registerNavigationCommands } = await lazyImports.navigationCommands();
          const commands = registerNavigationCommands(editor, servicesRef.current.navigationProvider);
          servicesRef.current.navigationCommands = commands;
        }
        
        // Register formatting shortcuts
        if (featureConfig.ide.formatting) {
          const formatDocumentShortcut = KEYBOARD_SHORTCUTS.FORMAT_DOCUMENT;
          editor.addAction({
            id: formatDocumentShortcut.id,
            label: formatDocumentShortcut.label,
            keybindings: [formatDocumentShortcut.keybinding],
            contextMenuGroupId: 'modification',
            contextMenuOrder: 1.5,
            run: () => {
              editor.getAction('editor.action.formatDocument')?.run();
            }
          });
        }
      } catch (error) {
        // Silently fail keyboard shortcut registration to avoid breaking the editor
        // Error is logged internally by the keyboard shortcut system
      }
    }
    
    // Set up content change monitoring for parser features
    if (requiresParser(featureConfig) && servicesRef.current.parserService) {
      const model = editor.getModel();
      if (model) {
        const disposable = model.onDidChangeContent(() => {
          // Clear existing timeout
          if (parseTimeoutRef.current) {
            clearTimeout(parseTimeoutRef.current);
          }
          
          // Debounce parsing
          parseTimeoutRef.current = setTimeout(async () => {
            try {
              const code = model.getValue();
              const parseResult = await servicesRef.current.parserService.parseDocument(code);
              onParseResult?.(parseResult);

              const outline = servicesRef.current.parserService.getDocumentOutline();
              onOutlineChange?.(outline);

              // Update Enhanced Completion Provider with new AST and symbols
              if (servicesRef.current.enhancedCompletionProvider) {
                try {
                  const ast = servicesRef.current.parserService.getAST();
                  const symbols = servicesRef.current.parserService.getSymbols?.() || [];
                  servicesRef.current.enhancedCompletionProvider.updateAST(ast, symbols);
                } catch (error) {
                  console.warn('Failed to update Enhanced Completion Provider:', error);
                }
              }

              // Update error state
              setState(prev => ({ ...prev, currentErrors: parseResult.errors || [] }));
              onError?.(parseResult.errors || []);
            } catch (error) {
              // Update error state with parse error
              setState(prev => ({
                ...prev,
                currentErrors: [{ message: error instanceof Error ? error.message : String(error) }]
              }));
              onError?.([{ message: error instanceof Error ? error.message : String(error) }]);
            }
          }, performanceConfig.parseDebounceMs);
        });
        
        disposablesRef.current.push(disposable);
      }
    }
  }, [featureConfig, performanceConfig, onParseResult, onOutlineChange, onError]);

  // Default editor options
  const defaultOptions: monacoEditor.editor.IStandaloneEditorConstructionOptions = {
    language: LANGUAGE_ID,
    theme: 'openscad-dark', // Force our custom theme
    automaticLayout: true,
    minimap: { enabled: hasIDEFeatures(featureConfig) },
    scrollBeyondLastLine: false,
    lineNumbers: 'on',
    glyphMargin: true,
    folding: featureConfig.advanced.folding,
    lineDecorationsWidth: 20,
    lineNumbersMinChars: 3,
    fontSize: 14,
    tabSize: 2,
    insertSpaces: true,
    wordWrap: 'on',
    ...options
  };

  console.log('[DEBUG] 🎨 Editor options configured:', {
    language: defaultOptions.language,
    theme: defaultOptions.theme,
    originalThemeProp: theme,
    hasMonaco: !!monacoRef.current
  });

  // Show error state
  if (state.initError) {
    return (
      <div style={{ 
        height, 
        width, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#1e1e1e',
        color: '#ff6b6b',
        padding: '20px',
        fontFamily: 'monospace'
      }}>
        <div>
          <h3>❌ OpenSCAD Editor Initialization Error</h3>
          <p>{state.initError}</p>
          <p>Please check the console for more details.</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (!state.isInitialized) {
    return (
      <div style={{ 
        height, 
        width, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#1e1e1e',
        color: '#ffffff'
      }}>
        🚀 Loading OpenSCAD Editor...
      </div>
    );
  }

  // Prepare editor props conditionally
  const editorProps: any = {
    height: "100%",
    width: "100%",
    value,
    language: LANGUAGE_ID, // Explicitly set language at editor level
    onMount: handleEditorDidMount,
    options: defaultOptions
  };

  if (onChange) {
    editorProps.onChange = onChange;
  }

  console.log('[DEBUG] 🎨 Editor props configured:', {
    language: editorProps.language,
    optionsLanguage: editorProps.options.language,
    theme: editorProps.options.theme
  });

  console.log('🔍 [EDITOR] About to render editor with state:', {
    isMonacoReady: state.isMonacoReady,
    isParserReady: state.isParserReady,
    isInitialized: state.isInitialized,
    initError: state.initError
  });

  return (
    <div style={{ height, width, position: 'relative' }}>
      <Editor {...editorProps} />
      
      {/* Status indicator for parser features */}
      {requiresParser(featureConfig) && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          backgroundColor: state.currentErrors.length > 0 ? '#ff6b6b' : '#51cf66',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace',
          zIndex: 1000
        }}>
          {state.currentErrors.length > 0 ? `${state.currentErrors.length} errors` : '✓ Ready'}
        </div>
      )}
    </div>
  );
};

export default OpenscadEditor;
