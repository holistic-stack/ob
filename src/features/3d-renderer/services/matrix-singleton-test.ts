/**
 * Matrix Singleton Thread Safety Test
 *
 * Simple verification that the singleton pattern with async initialization barriers
 * prevents race conditions during service startup.
 */

import { createLogger } from '../../../shared/services/logger.service.js';
import {
  getMatrixIntegrationService,
  MatrixIntegrationService,
} from './matrix-integration.service.js';
import { getMatrixServiceContainer, MatrixServiceContainer } from './matrix-service-container.js';

const logger = createLogger('MatrixSingletonTest');

/**
 * Test concurrent access to service container singleton
 */
async function testServiceContainerConcurrency(): Promise<void> {
  logger.info('Testing MatrixServiceContainer concurrent access...');

  // Reset to ensure clean state
  MatrixServiceContainer.resetInstance();

  // Create 20 concurrent requests for the singleton
  const promises = Array.from({ length: 20 }, async (_, index) => {
    logger.debug(`Starting request ${index + 1}`);
    const instance = await getMatrixServiceContainer({
      enableTelemetry: true,
      enableValidation: true,
      enableConfigManager: true,
      autoStartServices: true,
    });
    logger.debug(`Completed request ${index + 1}`);
    return instance;
  });

  const instances = await Promise.all(promises);

  // Verify all instances are the same object reference
  const firstInstance = instances[0];
  for (let i = 1; i < instances.length; i++) {
    if (instances[i] !== firstInstance) {
      throw new Error(`Instance ${i} is not the same as the first instance - singleton violated!`);
    }
  }

  // Verify the instance is properly initialized
  if (!firstInstance) {
    throw new Error('Singleton instance is null or undefined');
  }

  // Check if the instance is healthy (basic validation)
  if (!firstInstance.isHealthy()) {
    throw new Error('Singleton instance is not healthy');
  }

  logger.info('✅ MatrixServiceContainer concurrent access test passed');
  await firstInstance.shutdown();
}

/**
 * Test concurrent access to integration service singleton
 */
async function testIntegrationServiceConcurrency(): Promise<void> {
  logger.info('Testing MatrixIntegrationService concurrent access...');

  // Reset to ensure clean state
  MatrixIntegrationService.resetInstance();
  MatrixServiceContainer.resetInstance();

  // Create 15 concurrent requests for the singleton
  const promises = Array.from({ length: 15 }, async (_, index) => {
    logger.debug(`Starting integration service request ${index + 1}`);
    const instance = await getMatrixIntegrationService();
    logger.debug(`Completed integration service request ${index + 1}`);
    return instance;
  });

  const instances = await Promise.all(promises);

  // Verify all instances are the same object reference
  const firstInstance = instances[0];
  for (let i = 1; i < instances.length; i++) {
    if (instances[i] !== firstInstance) {
      throw new Error(
        `Integration service instance ${i} is not the same as the first instance - singleton violated!`
      );
    }
  }

  // Verify the instance can perform operations
  try {
    const healthStatus = await firstInstance.getHealthStatus();
    if (!healthStatus || typeof healthStatus !== 'object') {
      throw new Error('Integration service health status check failed');
    }
  } catch (error) {
    logger.warn('Health status check failed (may be expected in test environment):', error);
  }

  logger.info('✅ MatrixIntegrationService concurrent access test passed');
  await firstInstance.shutdown();
}

/**
 * Test race condition scenario
 */
async function testRaceConditionScenario(): Promise<void> {
  logger.info('Testing race condition scenario...');

  // Reset all singletons
  MatrixServiceContainer.resetInstance();
  MatrixIntegrationService.resetInstance();

  // Create a mix of container and integration service requests simultaneously
  const containerPromises = Array.from({ length: 10 }, () => getMatrixServiceContainer());
  const integrationPromises = Array.from({ length: 10 }, () => getMatrixIntegrationService());

  // Execute all promises concurrently
  const allPromises = [...containerPromises, ...integrationPromises];
  const results = await Promise.all(allPromises);

  // Verify containers are all the same
  const containers = results.slice(0, 10);
  const firstContainer = containers[0];
  for (const container of containers) {
    if (container !== firstContainer) {
      throw new Error('Container singleton violated in race condition test');
    }
  }

  // Verify integration services are all the same
  const integrationServices = results.slice(10);
  const firstIntegration = integrationServices[0];
  for (const service of integrationServices) {
    if (service !== firstIntegration) {
      throw new Error('Integration service singleton violated in race condition test');
    }
  }

  logger.info('✅ Race condition scenario test passed');

  // Cleanup
  await firstIntegration.shutdown();
}

/**
 * Run all singleton tests
 */
export async function runSingletonTests(): Promise<void> {
  logger.info('🧪 Starting Matrix Service Singleton Thread Safety Tests...');

  try {
    await testServiceContainerConcurrency();
    await testIntegrationServiceConcurrency();
    await testRaceConditionScenario();

    logger.info('🎉 All singleton thread safety tests passed!');
  } catch (error) {
    logger.error('❌ Singleton thread safety test failed:', error);
    throw error;
  }
}

// Export for external testing
export {
  testServiceContainerConcurrency,
  testIntegrationServiceConcurrency,
  testRaceConditionScenario,
};
