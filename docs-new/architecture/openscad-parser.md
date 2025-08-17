# OpenSCAD Parser (from src)

Key areas
- ast/ (types, visitors for primitives, transforms, expressions, control-structures)
- extractors/ (primitive and parameter extractors)
- error-handling/ (strategies, handler, logger, recovery registry)
- services/ (module-registry, module-resolver, parsing initialization)
- node-location.ts, utils/*

Contracts
- Result-based error handling
- Strict typing for AST nodes and visitors

Tests
- Unit and integration tests across visitors, extractors, and strategies
