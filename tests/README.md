# Global Integration and E2E Tests Directory

This folder contains global cross-service integration tests, end-to-end user journey tests, and security regression validation suites.

## Directory Structure
- `/e2e`: Playwright/Cypress end-to-end client scripts.
- `/integration`: Monolith to FastAPI ML interface integrity checks.

## Running Tests
To run all tests across components:
```bash
# Run backend unit tests
cd ../backend && npm test

# Run frontend tests
cd ../frontend && npm test

# Run ML unit tests
cd ../ml-service && pytest
```
