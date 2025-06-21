/**
 * Formatting Configuration Component
 * 
 * Provides a UI for configuring AST-based formatting options
 * and demonstrates formatting capabilities.
 */

import React, { useState, useCallback } from 'react';
import type { FormattingOptions } from './formatting-rules';
import { DEFAULT_FORMATTING_OPTIONS } from './formatting-rules';
import type { FormattingService, FormattingServiceConfig } from './formatting-service';
import type { FormatResult } from './ast-formatter';

// Inline styles for the component
const styles = {
  formattingConfig: {
    background: '#2d2d30',
    color: '#cccccc',
    padding: '16px',
    borderRadius: '8px',
    margin: '16px 0',
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
  },
  formattingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap' as const,
    gap: '8px'
  },
  headerTitle: {
    margin: '0',
    color: '#ffffff',
    fontSize: '18px'
  },
  formattingActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const
  },
  formatButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s'
  },
  formatButtonPrimary: {
    background: '#0e639c',
    color: 'white'
  },
  formatButtonSecondary: {
    background: '#3c3c3c',
    color: '#cccccc'
  },
  formatButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  formatStatus: {
    padding: '8px 12px',
    margin: '8px 0',
    borderRadius: '4px',
    fontSize: '14px'
  },
  formatStatusSuccess: {
    background: '#1e3a8a',
    color: '#dbeafe',
    borderLeft: '4px solid #3b82f6'
  },
  formatStatusError: {
    background: '#7f1d1d',
    color: '#fecaca',
    borderLeft: '4px solid #ef4444'
  },
  formattingOptions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '16px',
    margin: '16px 0'
  },
  optionGroup: {
    background: '#252526',
    padding: '12px',
    borderRadius: '6px'
  },
  optionGroupTitle: {
    margin: '0 0 12px 0',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600
  },
  optionRow: {
    margin: '8px 0'
  },
  optionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    cursor: 'pointer'
  },
  numberInput: {
    background: '#3c3c3c',
    border: '1px solid #464647',
    color: '#cccccc',
    padding: '4px 8px',
    borderRadius: '3px',
    width: '60px',
    marginLeft: '8px'
  },
  formattingInfo: {
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid #3c3c3c'
  },
  infoTitle: {
    margin: '0 0 12px 0',
    color: '#ffffff',
    fontSize: '14px'
  },
  shortcuts: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px'
  },
  shortcut: {
    fontSize: '13px',
    color: '#cccccc'
  },
  kbd: {
    background: '#3c3c3c',
    border: '1px solid #464647',
    borderRadius: '3px',
    padding: '2px 6px',
    fontSize: '11px',
    fontFamily: 'monospace',
    color: '#ffffff'
  }
};

export interface FormattingConfigProps {
  formattingService: FormattingService | null;
  currentCode: string;
  onFormattedCode?: (code: string) => void;
  onConfigChange?: (options: FormattingOptions) => void;
}

export const FormattingConfig: React.FC<FormattingConfigProps> = ({
  formattingService,
  currentCode,
  onFormattedCode,
  onConfigChange
}) => {
  const [options, setOptions] = useState<FormattingOptions>(DEFAULT_FORMATTING_OPTIONS);
  const [isFormatting, setIsFormatting] = useState(false);
  const [lastFormatResult, setLastFormatResult] = useState<FormatResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleOptionChange = useCallback((
    key: keyof FormattingOptions,
    value: boolean | number | string
  ) => {
    const newOptions = { ...options, [key]: value };
    setOptions(newOptions);
    
    // Update the formatting service
    if (formattingService) {
      formattingService.updateConfig({ formattingOptions: newOptions });
    }
    
    onConfigChange?.(newOptions);
  }, [options, formattingService, onConfigChange]);

  const handleFormatDocument = useCallback(async () => {
    if (!formattingService || !currentCode.trim()) {
      return;
    }

    setIsFormatting(true);
    
    try {
      const result = await formattingService.formatDocument(currentCode);
      setLastFormatResult(result);
      
      if (result.success) {
        onFormattedCode?.(result.text);
      }
    } catch (error) {
      console.error('Formatting error:', error);
      setLastFormatResult({
        text: currentCode,
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        changes: 0
      });
    } finally {
      setIsFormatting(false);
    }
  }, [formattingService, currentCode, onFormattedCode]);

  const handleResetToDefaults = useCallback(() => {
    setOptions(DEFAULT_FORMATTING_OPTIONS);
    
    if (formattingService) {
      formattingService.updateConfig({ formattingOptions: DEFAULT_FORMATTING_OPTIONS });
    }
    
    onConfigChange?.(DEFAULT_FORMATTING_OPTIONS);
  }, [formattingService, onConfigChange]);

  const formatStatus = lastFormatResult ? (
    lastFormatResult.success ? (
      <div style={{...styles.formatStatus, ...styles.formatStatusSuccess}}>
        ✅ Formatted successfully ({lastFormatResult.changes} changes)
      </div>
    ) : (
      <div style={{...styles.formatStatus, ...styles.formatStatusError}}>
        ❌ Formatting failed: {lastFormatResult.errors.join(', ')}
      </div>
    )
  ) : null;

  return (
    <div style={styles.formattingConfig}>
      <div style={styles.formattingHeader}>
        <h3 style={styles.headerTitle}>🎨 Code Formatting</h3>
        <div style={styles.formattingActions}>
          <button
            onClick={handleFormatDocument}
            disabled={isFormatting || !formattingService}
            style={{
              ...styles.formatButton,
              ...styles.formatButtonPrimary,
              ...(isFormatting || !formattingService ? styles.formatButtonDisabled : {})
            }}
          >
            {isFormatting ? '⏳ Formatting...' : '✨ Format Document'}
          </button>
          <button
            onClick={handleResetToDefaults}
            style={{...styles.formatButton, ...styles.formatButtonSecondary}}
          >
            🔄 Reset Defaults
          </button>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{...styles.formatButton, ...styles.formatButtonSecondary}}
          >
            {showAdvanced ? '📖 Basic' : '⚙️ Advanced'}
          </button>
        </div>
      </div>

      {formatStatus}

      <div style={styles.formattingOptions}>
        {/* Basic Options */}
        <div style={styles.optionGroup}>
          <h4 style={styles.optionGroupTitle}>Indentation</h4>
          <div style={styles.optionRow}>
            <label style={styles.optionLabel}>
              <input
                type="checkbox"
                checked={options.useSpaces}
                onChange={(e) => handleOptionChange('useSpaces', e.target.checked)}
              />
              Use spaces instead of tabs
            </label>
          </div>
          <div style={styles.optionRow}>
            <label style={styles.optionLabel}>
              Indent size:
              <input
                type="number"
                min="1"
                max="8"
                value={options.indentSize}
                onChange={(e) => handleOptionChange('indentSize', parseInt(e.target.value, 10))}
                style={styles.numberInput}
              />
            </label>
          </div>
        </div>

        <div style={styles.optionGroup}>
          <h4 style={styles.optionGroupTitle}>Spacing</h4>
          <div style={styles.optionRow}>
            <label style={styles.optionLabel}>
              <input
                type="checkbox"
                checked={options.insertSpaceAfterComma}
                onChange={(e) => handleOptionChange('insertSpaceAfterComma', e.target.checked)}
              />
              Space after comma
            </label>
          </div>
          <div style={styles.optionRow}>
            <label style={styles.optionLabel}>
              <input
                type="checkbox"
                checked={options.insertSpaceAfterKeywords}
                onChange={(e) => handleOptionChange('insertSpaceAfterKeywords', e.target.checked)}
              />
              Space after keywords
            </label>
          </div>
        </div>

        <div style={styles.optionGroup}>
          <h4 style={styles.optionGroupTitle}>Braces</h4>
          <div style={styles.optionRow}>
            <label style={styles.optionLabel}>
              <input
                type="checkbox"
                checked={options.insertNewLineAfterOpenBrace}
                onChange={(e) => handleOptionChange('insertNewLineAfterOpenBrace', e.target.checked)}
              />
              New line after opening brace
            </label>
          </div>
          <div style={styles.optionRow}>
            <label style={styles.optionLabel}>
              <input
                type="checkbox"
                checked={options.insertNewLineBeforeCloseBrace}
                onChange={(e) => handleOptionChange('insertNewLineBeforeCloseBrace', e.target.checked)}
              />
              New line before closing brace
            </label>
          </div>
        </div>

        {showAdvanced && (
          <>
            <div style={styles.optionGroup}>
              <h4 style={styles.optionGroupTitle}>Line Length</h4>
              <div style={styles.optionRow}>
                <label style={styles.optionLabel}>
                  Max line length:
                  <input
                    type="number"
                    min="40"
                    max="200"
                    value={options.maxLineLength}
                    onChange={(e) => handleOptionChange('maxLineLength', parseInt(e.target.value, 10))}
                    style={styles.numberInput}
                  />
                </label>
              </div>
            </div>
          </>
        )}
      </div>

      <div style={styles.formattingInfo}>
        <h4 style={styles.infoTitle}>⌨️ Keyboard Shortcuts</h4>
        <div style={styles.shortcuts}>
          <div style={styles.shortcut}>
            <span style={styles.kbd}>Shift</span> + <span style={styles.kbd}>Alt</span> + <span style={styles.kbd}>F</span> - Format Document
          </div>
          <div style={styles.shortcut}>
            <span style={styles.kbd}>Ctrl</span> + <span style={styles.kbd}>K</span> <span style={styles.kbd}>Ctrl</span> + <span style={styles.kbd}>F</span> - Format Selection
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormattingConfig;