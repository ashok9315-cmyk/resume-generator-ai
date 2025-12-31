# GitHub Actions Workflows

This directory contains automated workflows for the Resume Generator AI project.

## 🚀 Workflows Overview

### 1. **CI/CD Pipeline** (`ci.yml`)
**Triggers**: Push to `main`/`develop`, Pull Requests to `main`

**Features**:
- ✅ **Frontend Testing**: ESLint, unit tests, build verification
- ✅ **Lambda Testing**: Build and test all Lambda functions
- 🔒 **Security Scanning**: npm audit, secret detection
- 🚀 **Production Deployment**: Automated deployment to AWS (main branch only)
- 📊 **Deployment Verification**: Post-deployment health checks

**Environments**:
- **Production**: Deploys to `https://resume-generator-ai.solutionsynth.cloud`

### 2. **Pull Request Checks** (`pr-check.yml`)
**Triggers**: Pull Requests to `main`/`develop`

**Features**:
- 🔍 **Code Quality**: TypeScript, ESLint, formatting checks
- 🧪 **Test Coverage**: Unit tests with coverage reporting
- 🏗️ **Build Verification**: Ensures all components build successfully
- 🔧 **Lambda Validation**: Individual Lambda function checks
- 🔒 **Security Validation**: Hardcoded secret detection
- 📚 **Documentation Checks**: Ensures required docs are present

### 3. **Scheduled Health Checks** (`scheduled-tests.yml`)
**Triggers**: Every 6 hours, Manual dispatch

**Features**:
- 🌐 **Website Health**: Tests all public endpoints
- ⚡ **Lambda Health**: Validates Lambda function URLs
- ☁️ **AWS Resource Health**: S3, CloudFront, Lambda status checks
- 📈 **Performance Monitoring**: Load time measurements
- 🚨 **Failure Notifications**: Alerts when health checks fail

### 4. **Dependency Updates** (`dependency-update.yml`)
**Triggers**: Weekly (Mondays 9 AM UTC), Manual dispatch

**Features**:
- 📦 **Dependency Scanning**: Checks for outdated packages
- 🔒 **Security Auditing**: npm audit across all components
- 🔄 **Automated Updates**: Creates PRs with dependency updates
- 📊 **Detailed Reports**: Generates dependency and security reports

## 🔧 Setup Requirements

### GitHub Secrets
**📋 [Complete Setup Guide](../docs/GITHUB_SECRETS_SETUP.md)**

Add these secrets to your GitHub repository:

```bash
# AWS Credentials (Required)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key

# AI API Keys (Required)
ANTHROPIC_API_KEY=your-anthropic-api-key

# Optional Monitoring Keys
LANGCHAIN_API_KEY=your-langchain-api-key  # Optional
LANGSMITH_API_KEY=your-langsmith-api-key  # Optional
```

**⚠️ Important**: Follow the [detailed setup guide](../docs/GITHUB_SECRETS_SETUP.md) for step-by-step instructions on obtaining and configuring these credentials.

### Repository Settings
1. **Enable Actions**: Go to Settings → Actions → General → Allow all actions
2. **Branch Protection**: Set up branch protection rules for `main`
3. **Environments**: Create a `production` environment with required reviewers (optional)

## 📊 Workflow Status

### Main Branch Status
- [![CI/CD Pipeline](https://github.com/your-username/resume-generator-ai/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/your-username/resume-generator-ai/actions/workflows/ci.yml)
- [![Health Checks](https://github.com/your-username/resume-generator-ai/workflows/Scheduled%20Health%20Checks/badge.svg)](https://github.com/your-username/resume-generator-ai/actions/workflows/scheduled-tests.yml)

### Security & Dependencies
- [![Dependency Updates](https://github.com/your-username/resume-generator-ai/workflows/Dependency%20Updates/badge.svg)](https://github.com/your-username/resume-generator-ai/actions/workflows/dependency-update.yml)

## 🎯 Workflow Triggers

| Workflow | Push | PR | Schedule | Manual |
|----------|------|----|---------|---------| 
| CI/CD Pipeline | ✅ main/develop | ✅ to main | ❌ | ❌ |
| PR Checks | ❌ | ✅ to main/develop | ❌ | ❌ |
| Health Checks | ❌ | ❌ | ✅ Every 6h | ✅ |
| Dependency Updates | ❌ | ❌ | ✅ Weekly | ✅ |

## 🔄 Development Workflow

### For Contributors:
1. **Create Feature Branch**: `git checkout -b feature/your-feature`
2. **Make Changes**: Develop your feature
3. **Create PR**: Open PR to `main` or `develop`
4. **Automated Checks**: PR checks run automatically
5. **Review & Merge**: After approval, merge triggers deployment

### For Maintainers:
1. **Monitor Health**: Check scheduled health check results
2. **Review Dependencies**: Weekly dependency update PRs
3. **Security Updates**: Address security audit findings
4. **Performance**: Monitor deployment performance metrics

## 🚨 Troubleshooting

### Common Issues:

**Deployment Failures**:
- Check AWS credentials in secrets
- Verify API keys are valid
- Ensure AWS resources exist

**Test Failures**:
- Check for TypeScript errors
- Verify all dependencies are installed
- Review test logs for specific failures

**Security Alerts**:
- Review npm audit results
- Check for hardcoded secrets
- Update vulnerable dependencies

**Health Check Failures**:
- Verify website is accessible
- Check Lambda function status
- Validate AWS resource health

## 📈 Monitoring & Alerts

### What's Monitored:
- ✅ Website uptime and performance
- ✅ Lambda function health
- ✅ AWS resource status
- ✅ Security vulnerabilities
- ✅ Dependency freshness

### Alert Channels:
- GitHub Actions notifications
- Workflow run summaries
- Artifact reports (dependency, security)

## 🔒 Security Features

### Automated Security:
- **Secret Scanning**: Prevents hardcoded API keys
- **Dependency Auditing**: Weekly security audits
- **Access Control**: Environment-based deployment protection
- **Credential Management**: Secure secret storage

### Best Practices:
- All secrets stored in GitHub Secrets
- No hardcoded credentials in code
- Regular dependency updates
- Automated security scanning

---

## 🚀 Quick Start

1. **Fork/Clone** the repository
2. **Add Secrets** to your GitHub repository
3. **Push Changes** to trigger workflows
4. **Monitor** workflow runs in the Actions tab

The workflows will automatically handle testing, building, and deploying your Resume Generator AI application! 🎉