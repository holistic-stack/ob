import { EnhancedOpenscadParser } from './enhanced-parser.js';

describe('OpenscadParser with Visitor AST Generator', () => {
  let parser: EnhancedOpenscadParser;

  beforeAll(async () => {
    parser = new EnhancedOpenscadParser();
    await parser.init();
  });

  afterAll(() => {
    parser.dispose();
  });

  describe('parseAST with visitor generator', () => {
    it('should parse a simple cube', () => {
      const code = 'cube(10);';
      const ast = parser.parseAST(code);

      expect(ast).toHaveLength(1);
      expect(ast[0].type).toBe('cube');
      expect(ast[0]).toHaveProperty('location');
    });

    it('should parse a simple sphere', () => {
      const code = 'sphere(5);';
      const ast = parser.parseAST(code);

      expect(ast).toHaveLength(1);
      expect(ast[0].type).toBe('sphere');
      expect(ast[0]).toHaveProperty('location');
    });

    it('should parse a simple cylinder', () => {
      const code = 'cylinder(h=10, r=5);';
      const ast = parser.parseAST(code);

      expect(ast).toHaveLength(1);
      expect(ast[0].type).toBe('cylinder');
      expect(ast[0]).toHaveProperty('location');
    });

    it('should parse a simple translate', () => {
      const code = 'translate([1, 2, 3]) cube(10);';
      const ast = parser.parseAST(code);

      expect(ast).toHaveLength(1);
      expect(ast[0].type).toBe('translate');
      expect(ast[0]).toHaveProperty('location');
    });

    it('should parse a simple union', () => {
      const code = 'union() { cube(10); sphere(5); }';
      const ast = parser.parseAST(code);

      expect(ast).toHaveLength(1);
      expect(ast[0].type).toBe('union');
      expect(ast[0]).toHaveProperty('location');
    });

    it('should parse a simple difference', () => {
      const code = 'difference() { cube(20, center=true); sphere(10); }';
      const ast = parser.parseAST(code);

      expect(ast).toHaveLength(1);
      expect(ast[0].type).toBe('difference');
      expect(ast[0]).toHaveProperty('location');
    });

    it('should parse a simple intersection', () => {
      const code = 'intersection() { cube(20, center=true); sphere(15); }';
      const ast = parser.parseAST(code);

      expect(ast).toHaveLength(1);
      expect(ast[0].type).toBe('intersection');
      expect(ast[0]).toHaveProperty('location');
    });

    it('should parse complex nested operations', () => {
      const code =
        'difference() { cube(20, center=true); translate([0, 0, 5]) { rotate([0, 0, 45]) cube(10, center=true); } }';
      const ast = parser.parseAST(code);

      expect(ast).toHaveLength(1);
      expect(ast[0].type).toBe('difference');
      expect(ast[0]).toHaveProperty('location');
    });
  });
});
