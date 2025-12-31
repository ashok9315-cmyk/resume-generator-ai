# Resume Generator AI - Project Structure

## 📁 Directory Organization

```
resume-generator-ai/
├── 📁 src/                          # Next.js application source code
│   ├── app/                         # App router pages
│   ├── components/                  # React components
│   └── lib/                         # Utility libraries
├── 📁 lambda/                       # AWS Lambda functions
│   ├── processFile/                 # File processing Lambda
│   ├── upload/                      # File upload Lambda
│   ├── generateResume/              # Resume generation Lambda
│   ├── generateCoverLetter/         # Cover letter generation Lambda
│   └── shared/                      # Shared utilities
├── 📁 infrastructure/               # AWS CDK infrastructure code
│   ├── lib/                         # CDK stack definitions
│   └── bin/                         # CDK app entry point
├── 📁 scripts/                      # Automation scripts
│   ├── deployment/                  # Deployment scripts
│   └── testing/                     # Testing scripts
├── 📁 test-data/                    # Test files and sample data
├── 📁 docs/                         # Documentation
│   └── deployment/                  # Deployment guides
├── 📁 public/                       # Static assets
└── 📁 monitoring/                   # Monitoring configurations
```

## 🚀 Quick Start

### Development
```bash
npm run dev                          # Start development server
```

### Deployment
```bash
npm run deploy:full                  # Full deployment
npm run deploy:lambda                # Lambda functions only
npm run deploy:frontend              # Frontend only
```

### Testing
```bash
npm run test:deployment              # Test deployed components
npm test                            # Run unit tests
```

## 📋 Key Files

### Configuration
- `next.config.js` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `.env.local` - Local development environment variables
- `.env.production` - Production environment variables
- `env.example` - Environment variables template

### Core Application
- `src/app/page.tsx` - Home page
- `src/app/resume/page.tsx` - Resume generator page
- `src/app/cover-letter/page.tsx` - Cover letter generator page
- `src/components/ProgressIndicator.tsx` - Progress tracking component

### Infrastructure
- `infrastructure/lib/ats-stack.ts` - Main AWS infrastructure (Lambda, API Gateway)
- `infrastructure/lib/cloudfront-hosting-stack.ts` - CloudFront hosting setup

## 🔧 Scripts

### Deployment Scripts (`scripts/deployment/`)
- `deploy-full.js` - Complete deployment (Cross-platform)
- `deploy-full.bat` - Complete deployment (Windows)
- `deploy-full.sh` - Complete deployment (Linux/Mac)
- `deploy-lambda-only.js` - Lambda functions only (Cross-platform)
- `deploy-lambda-only.bat` - Lambda functions only (Windows)
- `deploy-frontend-only.js` - Frontend only (Cross-platform)
- `deploy-frontend-only.bat` - Frontend only (Windows)

### Testing Scripts (`scripts/testing/`)
- `test-deployment.js` - Test all deployed components (Cross-platform)
- `test-deployment.bat` - Test all deployed components (Windows)
- `test-direct-lambda.js` - Test Lambda function URLs
- `test-frontend-processing.js` - Test frontend processing

## 📚 Documentation (`docs/`)

### User Documentation
- `USER_GUIDE.md` - Complete user guide with tips and troubleshooting
- `QUICK_START.md` - 5-minute quick start guide for end users

*Note: Technical documentation (deployment guides, monitoring, logging, runbooks) are excluded from version control to keep the repository clean and user-focused.*

## 🧪 Test Data (`test-data/`)
- Sample resume files for testing
- Test output HTML files
- Various file sizes for performance testing

## 🏗️ Architecture

```
Frontend (Next.js) → CloudFront → S3
                  ↓
API Gateway → Lambda Functions → Anthropic Claude API
```

## 🌐 Live URLs

- **Production Site**: https://resume-generator-ai.solutionsynth.cloud
- **Resume Lambda**: https://rjstpa3gkzlyayomdodjl5dxju0uxeyg.lambda-url.us-east-1.on.aws/
- **Cover Letter Lambda**: https://exfj76qtfsswdyyhrrnuk7g3om0gwuwx.lambda-url.us-east-1.on.aws/