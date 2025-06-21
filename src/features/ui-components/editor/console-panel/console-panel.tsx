/**
 * Console Panel Component
 * 
 * A console output panel for displaying logs and messages with glass morphism effects.
 * Supports message filtering, timestamps, and auto-scrolling.
 */

import React, { forwardRef, useRef, useEffect } from 'react';
import {
  clsx,
  generateGlassClasses,
  generateAccessibleStyles,
  type BaseComponentProps,
  type AriaProps,
  type GlassConfig,
} from '../../shared';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Console message types
 */
export type ConsoleMessageType = 'info' | 'warning' | 'error' | 'success' | 'debug';

/**
 * Console message structure
 */
export interface ConsoleMessage {
  readonly id: string;
  readonly type: ConsoleMessageType;
  readonly message: string;
  readonly timestamp: Date;
  readonly source?: string;
}

/**
 * Props for the ConsolePanel component
 */
export interface ConsolePanelProps extends BaseComponentProps, AriaProps {
  /** Array of console messages */
  readonly messages: readonly ConsoleMessage[];
  
  /** Filter messages by type */
  readonly filter?: ConsoleMessageType | 'all';
  
  /** Whether to show timestamps */
  readonly showTimestamps?: boolean;
  
  /** Whether to show control buttons */
  readonly showControls?: boolean;
  
  /** Whether to auto-scroll to bottom */
  readonly autoScroll?: boolean;
  
  /** Maximum number of messages to display */
  readonly maxMessages?: number;
  
  /** Height of the console panel */
  readonly height?: number;
  
  /** Callback when console is cleared */
  readonly onClear?: () => void;
  
  /** Callback when filter changes */
  readonly onFilterChange?: (filter: ConsoleMessageType | 'all') => void;
  
  /** Glass morphism configuration */
  readonly glassConfig?: Partial<GlassConfig>;
  
  /** Whether the panel is over a light background */
  readonly overLight?: boolean;
  
  /** Custom CSS class name */
  readonly className?: string;
  
  /** Test ID for testing */
  readonly 'data-testid'?: string;
}

// ============================================================================
// Message Type Icons
// ============================================================================

const MessageIcon: React.FC<{ type: ConsoleMessageType }> = ({ type }) => {
  const iconProps = {
    className: "w-4 h-4 flex-shrink-0",
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
  };

  switch (type) {
    case 'info':
      return (
        <svg {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'warning':
      return (
        <svg {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    case 'error':
      return (
        <svg {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'success':
      return (
        <svg {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'debug':
      return (
        <svg {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    default:
      return null;
  }
};

// ============================================================================
// Console Message Component
// ============================================================================

interface ConsoleMessageItemProps {
  readonly message: ConsoleMessage;
  readonly showTimestamp: boolean;
}

const ConsoleMessageItem: React.FC<ConsoleMessageItemProps> = ({ 
  message, 
  showTimestamp 
}) => {
  const typeColors = {
    info: 'text-blue-400',
    warning: 'text-yellow-400',
    error: 'text-red-400',
    success: 'text-green-400',
    debug: 'text-purple-400',
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className={clsx(
      'flex items-start gap-2 py-1 px-2 text-sm font-mono',
      'hover:bg-white/5 transition-colors duration-150',
      typeColors[message.type]
    )}>
      <MessageIcon type={message.type} />
      {showTimestamp && (
        <span className="text-white/40 text-xs">
          {formatTime(message.timestamp)}
        </span>
      )}
      <span className="flex-1 break-words">{message.message}</span>
      {message.source && (
        <span className="text-white/30 text-xs">
          {message.source}
        </span>
      )}
    </div>
  );
};

// ============================================================================
// Console Controls Component
// ============================================================================

interface ConsoleControlsProps {
  readonly filter: ConsoleMessageType | 'all';
  readonly onClear?: () => void;
  readonly onFilterChange?: (filter: ConsoleMessageType | 'all') => void;
}

const ConsoleControls: React.FC<ConsoleControlsProps> = ({
  filter,
  onClear,
  onFilterChange,
}) => (
  <div className="flex items-center justify-between p-2 border-b border-white/20">
    <div className="flex items-center gap-2">
      <select
        value={filter}
        onChange={(e) => onFilterChange?.(e.target.value as ConsoleMessageType | 'all')}
        className="bg-black/40 border border-white/20 rounded px-2 py-1 text-xs text-white/90"
      >
        <option value="all">All</option>
        <option value="info">Info</option>
        <option value="warning">Warning</option>
        <option value="error">Error</option>
        <option value="success">Success</option>
        <option value="debug">Debug</option>
      </select>
    </div>
    
    <button
      onClick={onClear}
      className="px-2 py-1 bg-black/40 hover:bg-black/60 rounded text-xs text-white/80 hover:text-white transition-colors"
      aria-label="Clear console"
    >
      Clear
    </button>
  </div>
);

// ============================================================================
// ConsolePanel Component
// ============================================================================

/**
 * Console Panel component with glass morphism effects
 * 
 * @example
 * ```tsx
 * <ConsolePanel 
 *   messages={consoleMessages}
 *   showTimestamps
 *   showControls
 *   autoScroll
 *   onClear={() => setMessages([])}
 * />
 * ```
 */
export const ConsolePanel = forwardRef<HTMLDivElement, ConsolePanelProps>(
  (
    {
      messages,
      filter = 'all',
      showTimestamps = true,
      showControls = true,
      autoScroll = true,
      maxMessages = 1000,
      height = 200,
      onClear,
      onFilterChange,
      glassConfig,
      overLight = false,
      className,
      'data-testid': dataTestId,
      'aria-label': ariaLabel,
      ...rest
    },
    ref
  ) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    // ========================================================================
    // Effects
    // ========================================================================
    
    useEffect(() => {
      if (autoScroll && messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, [messages, autoScroll]);
    
    // ========================================================================
    // Message Filtering
    // ========================================================================
    
    const filteredMessages = messages
      .filter(message => filter === 'all' || message.type === filter)
      .slice(-maxMessages);
    
    // ========================================================================
    // Style Generation
    // ========================================================================
    
    const glassClasses = generateGlassClasses(glassConfig || {}, overLight);
    
    const panelClasses = generateAccessibleStyles(
      clsx(
        // Base panel styles
        'flex flex-col overflow-hidden',
        
        // Glass morphism effects
        'bg-black/20 backdrop-blur-sm border border-white/50 rounded-lg',
        'shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)]',
        
        // Gradient pseudo-elements
        'before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none',
        'after:absolute after:inset-0 after:rounded-lg after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none',
        
        // Position for pseudo-elements
        'relative',
        
        // Custom className
        className
      )
    );

    // ========================================================================
    // Render
    // ========================================================================
    
    return (
      <div
        ref={ref}
        className={panelClasses}
        style={{ height: `${height}px` }}
        data-testid={dataTestId}
        role="log"
        aria-label={ariaLabel || 'Console Output'}
        aria-live="polite"
        {...rest}
      >
        <div className="relative z-10 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-2 border-b border-white/20">
            <h3 className="text-white/90 text-sm font-medium">Console</h3>
            <span className="text-white/60 text-xs">
              {filteredMessages.length} messages
            </span>
          </div>
          
          {/* Controls */}
          {showControls && (
            <ConsoleControls
              filter={filter}
              onClear={onClear}
              onFilterChange={onFilterChange}
            />
          )}
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-white/60 text-sm">No messages to display</p>
              </div>
            ) : (
              <div className="space-y-0">
                {filteredMessages.map((message) => (
                  <ConsoleMessageItem
                    key={message.id}
                    message={message}
                    showTimestamp={showTimestamps}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ConsolePanel.displayName = 'ConsolePanel';

// ============================================================================
// Default Export
// ============================================================================

export default ConsolePanel;
