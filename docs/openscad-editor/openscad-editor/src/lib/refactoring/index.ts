/**
 * @file Refactoring Module Index
 * 
 * Central export point for all refactoring functionality in the OpenSCAD editor.
 * Provides a clean API for importing refactoring services and providers.
 * 
 * @example
 * ```typescript
 * import { 
 *   RefactoringService, 
 *   OpenSCADRenameProvider,
 *   OpenSCADExtractProvider,
 *   OpenSCADOrganizationProvider 
 * } from './refactoring';
 * 
 * // Create and configure refactoring service
 * const refactoringService = new RefactoringService(parserService, symbolProvider);
 * await refactoringService.registerProviders(monaco, 'openscad');
 * ```
 */

// Main refactoring service
export {
  RefactoringService,
  type RefactoringServiceConfig,
  type RefactoringResult,
  type RefactoringAction,
  type RefactoringContext,
  DEFAULT_REFACTORING_CONFIG
} from './refactoring-service';

// Import for factory function
import { RefactoringService } from './refactoring-service';

// Rename provider
export {
  OpenSCADRenameProvider,
  type RenameConfig,
  type RenameResult,
  type RenameConflict,
  type RenameValidation,
  DEFAULT_RENAME_CONFIG
} from './rename-provider';

// Extract provider
export {
  OpenSCADExtractProvider,
  type ExtractConfig,
  type ExtractResult,
  type ExtractAction,
  type VariableExtractionContext,
  type FunctionExtractionContext,
  type ModuleExtractionContext,
  ExtractActionKind,
  DEFAULT_EXTRACT_CONFIG
} from './extract-provider';

// Organization provider
export {
  OpenSCADOrganizationProvider,
  type OrganizationConfig,
  type OrganizationResult,
  type OrganizationAction,
  type SymbolGroup,
  type OrganizationAnalysis,
  OrganizationActionKind,
  DEFAULT_ORGANIZATION_CONFIG
} from './organization-provider';

/**
 * Create a fully configured refactoring service
 * 
 * @param parserService - OpenSCAD parser service instance
 * @param symbolProvider - Symbol provider for AST analysis
 * @param positionUtilities - Position utilities for AST navigation
 * @param dependencyAnalyzer - Dependency analyzer for safe refactoring
 * @param config - Optional configuration overrides
 * @returns Configured refactoring service
 * 
 * @example
 * ```typescript
 * const refactoringService = createRefactoringService(
 *   parserService,
 *   symbolProvider,
 *   positionUtilities,
 *   dependencyAnalyzer,
 *   {
 *     rename: { enableScopeValidation: true },
 *     extract: { enableVariableExtraction: true },
 *     organization: { enableSorting: true }
 *   }
 * );
 * ```
 */
export function createRefactoringService(
  parserService?: any,
  symbolProvider?: any,
  positionUtilities?: any,
  dependencyAnalyzer?: any,
  config?: Partial<import('./refactoring-service').RefactoringServiceConfig>
): import('./refactoring-service').RefactoringService {
  return new RefactoringService(
    parserService,
    symbolProvider,
    positionUtilities,
    dependencyAnalyzer,
    config
  );
}

/**
 * Default refactoring configuration for OpenSCAD
 * 
 * Provides sensible defaults for all refactoring operations with
 * conservative settings for safety.
 */
export const OPENSCAD_REFACTORING_CONFIG: import('./refactoring-service').RefactoringServiceConfig = {
  rename: {
    enableScopeValidation: true,
    enableConflictDetection: true,
    enablePreview: true,
    maxReferences: 100
  },
  extract: {
    enableVariableExtraction: true,
    enableFunctionExtraction: true,
    enableModuleExtraction: true,
    autoGenerateNames: true,
    maxParameterCount: 10,
    minExpressionLength: 3
  },
  organization: {
    enableSorting: true,
    enableGrouping: true,
    enableUnusedRemoval: false, // Conservative default
    enableImportOrganization: true,
    sortOrder: 'dependency',
    groupingStrategy: 'type',
    preserveComments: true,
    addSeparators: true
  },
  enableCodeActions: true,
  enableQuickFix: true,
  enablePreview: true
};

/**
 * Utility function to check if refactoring is supported for a given context
 * 
 * @param context - Refactoring context to check
 * @returns Whether refactoring operations are supported
 */
export function isRefactoringSupported(context: {
  hasParserService?: boolean;
  hasSymbolProvider?: boolean;
  hasValidAST?: boolean;
}): boolean {
  return Boolean(
    context.hasParserService &&
    context.hasSymbolProvider &&
    context.hasValidAST
  );
}

/**
 * Utility function to validate refactoring action safety
 * 
 * @param action - Refactoring action to validate
 * @param context - Current refactoring context
 * @returns Whether the action is safe to execute
 */
export function isRefactoringActionSafe(
  action: import('./refactoring-service').RefactoringAction,
  context?: {
    hasCircularDependencies?: boolean;
    hasParseErrors?: boolean;
    isReadOnly?: boolean;
  }
): boolean {
  // Check if action is explicitly marked as safe
  if ('isSafe' in action && action.isSafe === false) {
    return false;
  }

  // Check context safety conditions
  if (context) {
    if (context.hasCircularDependencies) {
      return false;
    }
    if (context.hasParseErrors) {
      return false;
    }
    if (context.isReadOnly) {
      return false;
    }
  }

  return true;
}

/**
 * Utility function to get refactoring action priority
 * 
 * @param action - Refactoring action
 * @returns Priority score (higher = more important)
 */
export function getRefactoringActionPriority(
  action: import('./refactoring-service').RefactoringAction
): number {
  if (action.isPreferred) {
    return 100;
  }

  // Assign priorities based on action type
  if ('kind' in action) {
    switch (action.kind) {
      case 'organize.full':
        return 90;
      case 'extract.variable':
        return 80;
      case 'extract.function':
        return 75;
      case 'extract.module':
        return 70;
      case 'organize.remove_unused':
        return 60;
      case 'organize.sort':
        return 50;
      case 'organize.group':
        return 40;
      case 'organize.imports':
        return 30;
      default:
        return 10;
    }
  }

  return 10;
}

/**
 * Utility function to sort refactoring actions by priority
 * 
 * @param actions - Array of refactoring actions
 * @returns Sorted array with highest priority actions first
 */
export function sortRefactoringActionsByPriority(
  actions: import('./refactoring-service').RefactoringAction[]
): import('./refactoring-service').RefactoringAction[] {
  return [...actions].sort((a, b) => 
    getRefactoringActionPriority(b) - getRefactoringActionPriority(a)
  );
}

/**
 * Utility function to filter refactoring actions by safety
 * 
 * @param actions - Array of refactoring actions
 * @param context - Current refactoring context
 * @param onlyShowSafe - Whether to only show safe actions
 * @returns Filtered array of actions
 */
export function filterRefactoringActionsBySafety(
  actions: import('./refactoring-service').RefactoringAction[],
  context?: Parameters<typeof isRefactoringActionSafe>[1],
  onlyShowSafe: boolean = false
): import('./refactoring-service').RefactoringAction[] {
  if (!onlyShowSafe) {
    return actions;
  }

  return actions.filter(action => isRefactoringActionSafe(action, context));
}

/**
 * Utility function to group refactoring actions by category
 * 
 * @param actions - Array of refactoring actions
 * @returns Object with actions grouped by category
 */
export function groupRefactoringActionsByCategory(
  actions: import('./refactoring-service').RefactoringAction[]
): {
  extract: import('./refactoring-service').RefactoringAction[];
  organize: import('./refactoring-service').RefactoringAction[];
  other: import('./refactoring-service').RefactoringAction[];
} {
  const groups = {
    extract: [] as import('./refactoring-service').RefactoringAction[],
    organize: [] as import('./refactoring-service').RefactoringAction[],
    other: [] as import('./refactoring-service').RefactoringAction[]
  };

  for (const action of actions) {
    if ('kind' in action) {
      if (action.kind.startsWith('extract.')) {
        groups.extract.push(action);
      } else if (action.kind.startsWith('organize.')) {
        groups.organize.push(action);
      } else {
        groups.other.push(action);
      }
    } else {
      groups.other.push(action);
    }
  }

  return groups;
}
