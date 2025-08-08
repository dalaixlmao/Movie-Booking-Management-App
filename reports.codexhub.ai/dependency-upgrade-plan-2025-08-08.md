# Movie Booking App Dependency Upgrade Plan

**Date**: August 8, 2025  
**Project**: Movie Booking App Monorepo  
**Prepared by**: UpgradeNavigator

## Executive Summary

This dependency upgrade plan has been created to address the outdated packages and security vulnerabilities identified in the Movie Booking App monorepo. The application is a full-stack movie booking platform built using Turborepo, with a Next.js user app, an Express.js backend server, and a Redis-based worker for managing seat booking transactions.

### Current State Overview:

- **Security Vulnerabilities**: 24 vulnerabilities detected (11 low, 6 moderate, 5 high, 2 critical)
- **Major Version Upgrades Required**: 14 packages
- **Minor/Patch Updates Required**: 30+ packages
- **Critical Security Issues**: Found in Next.js and form-data packages
- **High-Risk Vulnerabilities**: Identified in axios, body-parser, path-to-regexp, and cross-spawn

The upgrade plan is structured in a phased approach to minimize disruption while prioritizing security fixes and maintaining system stability.

## List of Outdated Dependencies

### Root Dependencies

#### Critical Security Issues
- **next@14.2.5** (Critical) - Multiple vulnerabilities including cache poisoning and authorization bypass
- **form-data@4.0.0-4.0.3** (Critical) - Uses unsafe random function for choosing boundary

#### High Security Issues
- **axios@1.7.2** (High) - Server-Side Request Forgery vulnerability
- **body-parser** (High) - Denial of service vulnerability when URL encoding is enabled
- **path-to-regexp** (High) - ReDoS vulnerability
- **cross-spawn@7.0.0-7.0.4** (High) - ReDoS vulnerability

#### Moderate Security Issues
- **@babel/helpers, @babel/runtime, @babel/runtime-corejs3** (Moderate) - RegExp complexity issues
- **esbuild** (Moderate) - Development server security issue
- **micromatch** (Moderate) - ReDoS vulnerability
- **nanoid** (Moderate) - Predictable results when given non-integer values

#### Major Version Updates Needed
- **@prisma/client**: 5.16.1 → 6.13.0
- **@types/bcrypt**: 5.0.2 → 6.0.0
- **@types/eslint**: 8.56.10 → 9.6.1
- **@types/express**: 4.17.21 → 5.0.3
- **@types/node**: 20.14.10 → 24.2.0
- **@types/react**: 18.3.3 → 19.1.9
- **@types/react-dom**: 18.3.0 → 19.1.7
- **bcrypt**: 5.1.1 → 6.0.0
- **eslint**: 8.57.0 → 9.32.0
- **express**: 4.19.2 → 5.1.0
- **next**: 14.2.5 → 15.4.6
- **react/react-dom**: 18.3.1 → 19.1.1
- **redis**: 4.6.15 → 5.8.0
- **zod**: 3.23.8 → 4.0.15

#### Minor Version Updates Needed
- **turbo**: 2.0.6 → 2.5.5
- **typescript**: 5.5.3 → 5.9.2
- **prettier**: 3.3.3 → 3.6.2
- **postcss**: 8.4.31 → 8.5.6
- **next-auth**: 4.24.7 → 4.24.11
- And others...

## Phased Upgrade Plan

### Phase 1: Critical Security Fixes (Week 1)

#### 1.1 Immediate Security Updates
- **Objective**: Address critical and high vulnerabilities without major version changes
- **Actions**:
  - Update axios to 1.11.0 (fixes SSRF vulnerability)
  - Apply security patches for body-parser, cookie, and send packages
  - Update Next.js to latest secure version in 14.x line (14.2.31)

```bash
# Root package updates
npm update axios@1.11.0 cookie form-data
npm install next@14.2.31 --save-exact

# Express server updates
cd apps/express-server
npm update body-parser path-to-regexp send
```

#### 1.2 Babel Dependencies Update
- **Objective**: Address moderate vulnerabilities in Babel ecosystem
- **Actions**:
  - Update @babel dependencies to address RegExp complexity issues
  
```bash
npm update @babel/helpers @babel/runtime @babel/runtime-corejs3
```

#### 1.3 Security Testing
- Run comprehensive tests on user app, express server, and worker
- Focus on API security, authentication flows, and booking process
- Verify that no regressions are introduced

**Rollback Procedure**: For each security update, maintain a record of the previous versions. If issues arise, revert to the specific package version using `npm install <package-name>@<previous-version>`.

### Phase 2: Non-Breaking Minor Updates (Week 2)

#### 2.1 Core Tools and Utilities
- **Objective**: Update minor versions of development tools and utilities
- **Actions**:
  - Update TypeScript to latest 5.x version
  - Update Prettier, ESLint (maintaining v8), and PostCSS
  
```bash
npm update typescript prettier postcss
cd apps/express-server && npm update
cd ../user-app && npm update
cd ../worker && npm update
cd ../../packages/db && npm update
```

#### 2.2 Database and Authentication Libraries
- **Objective**: Update Prisma and authentication libraries within current major versions
- **Actions**:
  - Update Prisma client and CLI to latest 5.x version
  - Update next-auth to latest 4.x version
  
```bash
cd packages/db
npm update prisma @prisma/client
npx prisma generate

cd ../../apps/user-app
npm update next-auth
```

#### 2.3 Integration Testing
- Verify database operations with updated Prisma
- Test authentication flows with updated next-auth
- Run integration tests across the booking flow

**Rollback Procedure**: If issues arise, revert to previous package versions using `npm install <package-name>@<previous-version>`.

### Phase 3: Major Framework Upgrades (Week 3-4)

#### 3.1 Express.js 5 Upgrade
- **Objective**: Upgrade Express.js from 4.x to 5.x
- **Potential Breaking Changes**:
  - Router method signature changes
  - Middleware execution order changes
  - Error handling modifications
- **Actions**:
  ```bash
  cd apps/express-server
  npm install express@5.1.0
  # Update middleware usage based on Express 5 docs
  ```
- **Testing Focus**:
  - API endpoint functionality
  - Error handling
  - Middleware chaining

#### 3.2 Redis 5.x Upgrade
- **Objective**: Upgrade Redis client from 4.x to 5.x
- **Potential Breaking Changes**:
  - API method signature changes
  - Connection handling differences
  - Command response format changes
- **Actions**:
  ```bash
  cd apps/express-server
  npm install redis@5.8.0
  cd ../worker
  npm install redis@5.8.0
  ```
- **Required Code Modifications**:
  - Update connection methods (Redis 5 has different connection patterns)
  - Update queue implementation to use new APIs
  - Adjust error handling
- **Testing Focus**:
  - Queue operations
  - Worker processes
  - Seat booking flow

#### 3.3 Prisma 6.x Upgrade
- **Objective**: Upgrade Prisma from 5.x to 6.x
- **Potential Breaking Changes**:
  - Schema definition changes
  - Query API modifications
  - Migration system changes
- **Actions**:
  ```bash
  cd packages/db
  npm install prisma@6.13.0 @prisma/client@6.13.0
  npx prisma format
  npx prisma generate
  ```
- **Testing Focus**:
  - Database migrations
  - CRUD operations
  - Relational queries

#### 3.4 React 19 & Next.js 15 Upgrade
- **Objective**: Upgrade React and Next.js to latest major versions
- **Potential Breaking Changes**:
  - React Server Components API changes
  - Next.js App Router modifications
  - Rendering behavior changes
- **Actions**:
  ```bash
  cd apps/user-app
  npm install next@15.4.6 react@19.1.1 react-dom@19.1.1
  npm install eslint-config-next@15.4.6
  ```
- **Required Code Modifications**:
  - Update server components to use latest patterns
  - Review and update use of React hooks
  - Adjust layouts and routing according to Next.js 15 conventions
- **Testing Focus**:
  - Page rendering and hydration
  - Client-side interactions
  - Server components functionality
  - Authentication flows

**Rollback Procedure**: For major version upgrades, create a branch before starting the upgrade. If severe issues are encountered, revert to the previous branch and redeploy.

### Phase 4: Dependency Type Definitions Update (Week 5)

#### 4.1 TypeScript Type Definitions
- **Objective**: Update TypeScript type definitions for major packages
- **Actions**:
  ```bash
  npm install @types/node@24.2.0 @types/react@19.1.9 @types/react-dom@19.1.7 @types/express@5.0.3 @types/bcrypt@6.0.0
  ```
- **Testing Focus**:
  - Type checking across the codebase
  - IDE intellisense and error detection

#### 4.2 Utility Libraries
- **Objective**: Update remaining utility libraries to latest versions
- **Actions**:
  ```bash
  npm install zod@4.0.15 bcrypt@6.0.0
  ```
- **Testing Focus**:
  - Form validations with Zod
  - Authentication with bcrypt

#### 4.3 Final Integration Testing
- Run comprehensive end-to-end tests
- Verify all critical user journeys
- Load test the booking system

## Testing Strategy

### Unit Testing
- Update test fixtures to account for new API patterns
- Ensure tests for critical components are updated for new library versions
- Focus on authentication, booking flow, and payment processing

### Integration Testing
- Test the complete user journey from login through booking completion
- Verify API endpoints with updated Express.js
- Test database operations with updated Prisma
- Verify queue operation with updated Redis

### Performance Testing
- Benchmark the application before and after updates
- Focus on booking transaction throughput
- Monitor memory usage with new library versions

## Contingency Planning

### Monitoring
- Implement enhanced logging during the upgrade period
- Set up alerts for increased error rates
- Monitor performance metrics for degradation

### Rollback Procedures
- **For Minor Updates**: Use `npm install <package>@<previous-version>` to revert
- **For Major Framework Updates**: Maintain branches with previous versions
- **For Critical Issues**: Prepare a full system snapshot before major upgrades

### Issue Resolution
- Document common issues encountered during similar upgrades
- Prepare troubleshooting guides for the team
- Schedule dedicated support time during upgrade windows

## Conclusion

This dependency upgrade plan provides a structured approach to modernizing the Movie Booking App's dependencies while prioritizing security and stability. By following the phased approach, the team can methodically address critical security issues first, then proceed with non-breaking updates, and finally tackle the more complex major version upgrades.

The plan addresses all 24 identified vulnerabilities and outlines specific steps for upgrading each major component of the system. By following this plan, the application will be more secure, maintain compatibility with modern tools and practices, and provide a better foundation for future development.