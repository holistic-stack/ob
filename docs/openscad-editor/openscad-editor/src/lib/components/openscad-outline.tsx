import React from 'react';
import { type OutlineItem } from '../services/openscad-parser-service';

interface OpenscadOutlineProps {
  outline: OutlineItem[];
  onItemClick?: (item: OutlineItem) => void;
  title?: string;
}

interface OutlineItemProps {
  item: OutlineItem;
  onItemClick?: ((item: OutlineItem) => void) | undefined;
  depth?: number;
}

const OutlineItemComponent: React.FC<OutlineItemProps> = ({ 
  item, 
  onItemClick, 
  depth = 0 
}) => {
  const handleClick = () => {
    onItemClick?.(item);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'module': return '📦';
      case 'function': return '⚙️';
      case 'variable': return '📊';
      default: return '📄';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'module': return '#4fc3f7';
      case 'function': return '#81c784';
      case 'variable': return '#ffb74d';
      default: return '#e0e0e0';
    }
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 8px',
          paddingLeft: `${8 + depth * 16}px`,
          cursor: 'pointer',
          fontSize: '13px',
          lineHeight: '1.4',
          transition: 'background-color 0.2s',
          borderRadius: '3px',
          margin: '1px 4px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#2d2d30';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <span style={{ marginRight: '6px', fontSize: '12px' }}>
          {getIcon(item.type)}
        </span>
        <span style={{ 
          color: getTypeColor(item.type),
          fontWeight: '500',
          flex: 1
        }}>
          {item.name}
        </span>
        <span style={{ 
          color: '#888',
          fontSize: '11px',
          fontFamily: 'monospace'
        }}>
          {item.range.startLine + 1}:{item.range.startColumn + 1}
        </span>
      </div>
      
      {item.children && item.children.map((child, index) => (
        <OutlineItemComponent
          key={`${child.name}-${index}`}
          item={child}
          onItemClick={onItemClick}
          depth={depth + 1}
        />
      ))}
    </div>
  );
};

export const OpenscadOutline: React.FC<OpenscadOutlineProps> = ({
  outline,
  onItemClick,
  title = "Document Outline"
}) => {
  if (!outline || outline.length === 0) {
    return (
      <div style={{
        padding: '16px',
        color: '#888',
        fontSize: '13px',
        textAlign: 'center',
        fontStyle: 'italic'
      }}>
        <div style={{ marginBottom: '8px' }}>🌳</div>
        <div>No symbols found</div>
        <div style={{ fontSize: '11px', marginTop: '4px' }}>
          Add modules, functions, or variables to see the outline
        </div>
      </div>
    );
  }

  const symbolCounts = outline.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#1e1e1e',
      color: '#d4d4d4',
      fontSize: '13px'
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid #333',
        background: '#252526',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span>{title}</span>
        <span style={{ 
          color: '#888', 
          fontSize: '11px',
          fontFamily: 'monospace'
        }}>
          {outline.length} items
        </span>
      </div>

      {/* Stats */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid #333',
        background: '#252526',
        display: 'flex',
        gap: '12px',
        fontSize: '11px'
      }}>
        {symbolCounts['module'] && (
          <span style={{ color: '#4fc3f7' }}>
            📦 {symbolCounts['module']}
          </span>
        )}
        {symbolCounts['function'] && (
          <span style={{ color: '#81c784' }}>
            ⚙️ {symbolCounts['function']}
          </span>
        )}
        {symbolCounts['variable'] && (
          <span style={{ color: '#ffb74d' }}>
            📊 {symbolCounts['variable']}
          </span>
        )}
      </div>

      {/* Outline Items */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '4px 0'
      }}>
        {outline.map((item, index) => (
          <OutlineItemComponent
            key={`${item.name}-${index}`}
            item={item}
            onItemClick={onItemClick}
          />
        ))}
      </div>
    </div>
  );
};

export default OpenscadOutline;
