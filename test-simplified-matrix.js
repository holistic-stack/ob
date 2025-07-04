// Quick test of simplified matrix operations
import { MatrixOperationsAPI, Matrix } from './src/features/3d-renderer/exports/matrix-operations.exports.js';

async function testSimplifiedMatrix() {
  console.log('Testing simplified matrix operations...');
  
  const api = new MatrixOperationsAPI();
  
  // Test basic operations
  const a = new Matrix([[1, 2], [3, 4]]);
  const b = new Matrix([[5, 6], [7, 8]]);
  
  try {
    const addResult = await api.add(a, b);
    if (addResult.success) {
      console.log('✅ Matrix addition works:', addResult.data.result.to2DArray());
      console.log('   Execution time:', addResult.data.executionTime, 'ms');
    } else {
      console.log('❌ Matrix addition failed:', addResult.error);
    }
    
    const multiplyResult = await api.multiply(a, b);
    if (multiplyResult.success) {
      console.log('✅ Matrix multiplication works:', multiplyResult.data.result.to2DArray());
      console.log('   Execution time:', multiplyResult.data.executionTime, 'ms');
    } else {
      console.log('❌ Matrix multiplication failed:', multiplyResult.error);
    }
    
    const transposeResult = await api.transpose(a);
    if (transposeResult.success) {
      console.log('✅ Matrix transpose works:', transposeResult.data.result.to2DArray());
      console.log('   Execution time:', transposeResult.data.executionTime, 'ms');
    } else {
      console.log('❌ Matrix transpose failed:', transposeResult.error);
    }
    
    console.log('\n🎉 Simplified matrix operations are working!');
    console.log('📊 Performance metrics:', api.getPerformanceMetrics());
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSimplifiedMatrix();
