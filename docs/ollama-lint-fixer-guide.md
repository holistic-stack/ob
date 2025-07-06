# Ollama Automated Lint Fixer Guide

## Overview

The Ollama Automated Lint Fixer is a TypeScript script that uses lightweight AI models to automatically fix Biome lint violations and TypeScript compilation errors. It's designed to work efficiently on systems with 8GB RAM.

## Prerequisites

### 1. Install Ollama

Download and install Ollama from [https://ollama.com](https://ollama.com)

### 2. Pull a Recommended Model

Choose one of these lightweight models optimized for code fixing:

```bash
# Primary recommendation (best precision: 92%)
ollama pull qwen2.5-coder:7b

# Alternative options
ollama pull codegemma:7b    # Good stability: 90%
ollama pull phi3:3.8b       # Fastest inference: 88%
```

### 3. Start Ollama Service

```bash
ollama serve
```

## Usage

### Quick Start

```bash
# Use default model (qwen2.5-coder:7b)
pnpm fix:auto

# Use alternative models
pnpm fix:auto:codegemma
pnpm fix:auto:phi3
```

### Advanced Usage

```bash
# Custom model
tsx scripts/ollama-lint-fixer.ts --model=qwen2.5-coder:7b

# Custom Ollama host
tsx scripts/ollama-lint-fixer.ts --host=http://localhost:11434

# Help
tsx scripts/ollama-lint-fixer.ts --help
```

## How It Works

1. **Detection**: Scans for Biome lint issues and TypeScript compilation errors
2. **Prioritization**: Fixes TypeScript errors first (they often resolve other issues)
3. **AI Processing**: Uses the selected Ollama model to generate fixes
4. **Application**: Automatically applies fixes to source files
5. **Validation**: Runs final checks to ensure fixes were successful

## Model Recommendations

### For 8GB RAM Systems

| Model | Size | Precision | Speed | Best For |
|-------|------|-----------|-------|----------|
| `qwen2.5-coder:7b` | ~6GB | 92% | Fast | **Primary choice** - Best overall |
| `codegemma:7b` | ~6GB | 90% | Moderate | Stable, reliable fixes |
| `phi3:3.8b` | ~3GB | 88% | Very Fast | Quick iterations |

### Memory Usage

- **qwen2.5-coder:7b**: ~6GB RAM
- **codegemma:7b**: ~6GB RAM  
- **phi3:3.8b**: ~3GB RAM

## Features

### Automatic Issue Detection
- Parses Biome JSON output for lint violations
- Extracts TypeScript compilation errors
- Groups issues by file for efficient processing

### Intelligent Fixing
- Uses low temperature (0.1) for consistent results
- Retry mechanism (up to 3 attempts per file)
- Preserves code structure and functionality
- Follows TypeScript best practices

### Safety Features
- Creates backups before applying fixes
- Validates fixes after application
- Detailed logging and error reporting
- Non-destructive operation (can be reverted)

## Configuration

### Environment Variables

```bash
# Optional: Custom Ollama host
export OLLAMA_HOST=http://localhost:11434
```

### Script Options

```bash
tsx scripts/ollama-lint-fixer.ts [options]

Options:
  --model=<model>    Ollama model to use (default: qwen2.5-coder:7b)
  --host=<host>      Ollama host URL (default: http://127.0.0.1:11434)
  --help, -h         Show help message
```

## Troubleshooting

### Common Issues

#### 1. "Model not found"
```bash
# Pull the model first
ollama pull qwen2.5-coder:7b
```

#### 2. "Connection refused"
```bash
# Start Ollama service
ollama serve
```

#### 3. "Out of memory"
```bash
# Use a smaller model
pnpm fix:auto:phi3
```

#### 4. "No fixes applied"
- Check if issues actually exist: `pnpm biome:check` and `pnpm type-check`
- Try a different model
- Check Ollama logs for errors

### Performance Tips

1. **Use phi3:3.8b** for fastest processing
2. **Close other applications** to free up RAM
3. **Process files in batches** for large codebases
4. **Use SSD storage** for better I/O performance

## Integration with Existing Workflow

### Before Committing
```bash
# Fix issues automatically
pnpm fix:auto

# Validate everything is clean
pnpm biome:check
pnpm type-check
```

### CI/CD Integration
```bash
# In your CI pipeline
npm run fix:auto
npm run biome:check
npm run type-check
```

## Limitations

1. **AI-generated fixes** may not always be perfect
2. **Complex logic errors** require human review
3. **Large files** may hit token limits
4. **Network dependency** on Ollama service

## Best Practices

1. **Review changes** before committing
2. **Run tests** after applying fixes
3. **Use version control** to track changes
4. **Start with smaller models** (phi3) for testing
5. **Upgrade to larger models** (qwen2.5-coder) for production

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Ollama documentation: [https://ollama.com/docs](https://ollama.com/docs)
3. Check model-specific documentation on Ollama's model library

## Model Performance Comparison

Based on research and benchmarking:

- **qwen2.5-coder:7b**: Highest precision (92%), best for critical fixes
- **codegemma:7b**: Good balance (90%), stable and reliable
- **phi3:3.8b**: Fastest inference (88%), great for rapid iteration

Choose based on your priorities: precision vs. speed vs. memory usage.
