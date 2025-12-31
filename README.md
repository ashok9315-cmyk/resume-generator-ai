# Resume Generator AI

🚀 **AI-powered ATS-compatible resume and cover letter generator** built with Next.js, AWS serverless infrastructure, and advanced AI technology.

**Live Application**: https://resume-generator-ai.solutionsynth.cloud

## ✨ Features

- **🎯 Resume Generator**: Upload existing resume and get ATS-optimized, job-tailored versions
- **💼 Cover Letter Generator**: AI-generated personalized cover letters
- **📁 File Processing**: Support for PDF and DOCX uploads (up to 5MB)
- **🤖 Smart AI Optimization**: Keyword matching, content enhancement, and professional formatting
- **📱 Responsive Design**: Works on desktop, tablet, and mobile devices
- **🔒 Privacy-First**: No permanent storage, secure processing
- **⚡ Fast Processing**: Optimized for quick turnaround (30-60 seconds)

## 📚 User Documentation

### **For End Users:**
- **[📖 Complete User Guide](docs/USER_GUIDE.md)** - Comprehensive guide with tips, troubleshooting, and best practices
- **[⚡ Quick Start Guide](docs/QUICK_START.md)** - Get started in 5 minutes
- **[🎯 Live Application](https://resume-generator-ai.solutionsynth.cloud)** - Start creating your resume now!

### **For Developers:**
- **[🏗️ Project Structure](PROJECT_STRUCTURE.md)** - Complete project organization
- **[🚀 Deployment Scripts](scripts/deployment/)** - Automated deployment tools

## 🚀 Quick Start for Users

1. **Visit**: https://resume-generator-ai.solutionsynth.cloud
2. **Choose**: Resume Generator or Cover Letter Generator
3. **Upload**: Your current resume (PDF/DOCX or paste text)
4. **Add**: Job description for the role you're targeting
5. **Generate**: Let AI optimize your content (30-60 seconds)
6. **Download**: Use "Print to PDF" for best results

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: AWS Lambda, API Gateway, S3
- **AI/ML**: Anthropic Claude, LangChain, LangGraph
- **Infrastructure**: AWS CDK, CloudFront, Route53
- **Monitoring**: CloudWatch, X-Ray, LangSmith
- **Security**: IAM roles, CORS, environment variables

## 🏗️ Architecture

```
Frontend (Next.js) → CloudFront → S3
                  ↓
Lambda Functions → Anthropic Claude API
                  ↓
S3 Storage ← File Processing
```

## 🔧 Development Setup

### Prerequisites

- Node.js 18+
- AWS Account with credentials configured
- Anthropic API key
- LangChain/LangSmith API key (optional)

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository>
cd resume-generator-ai
npm install
```

2. **Set up environment variables:**
```bash
cp env.example .env.local
# Edit .env.local with your API keys
```

3. **Run development server:**
```bash
npm run dev
```

4. **Access locally:**
Open http://localhost:3000

## 🚀 Deployment

### Quick Deployment
```bash
npm run deploy:full    # Complete deployment
npm run deploy:lambda  # Lambda functions only
npm run deploy:frontend # Frontend only
```

### Manual Deployment
See [Deployment Guide](scripts/deployment/DEPLOYMENT_README.md) for detailed instructions.

## 📊 Development & Operations

For deployment instructions, see the automated scripts in `scripts/deployment/` directory.

## 🧪 Testing

```bash
npm test                    # Unit tests
npm run test:deployment     # Test deployed components
npm run test:integration    # Integration tests
```

## 📁 Project Structure

```
resume-generator-ai/
├── src/                    # Next.js application
├── lambda/                 # AWS Lambda functions
├── infrastructure/         # AWS CDK infrastructure
├── scripts/               # Deployment & testing scripts
├── docs/                  # Documentation
├── test-data/             # Test files and samples
└── monitoring/            # CloudWatch configurations
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Users**: Check the [User Guide](docs/USER_GUIDE.md) and [Quick Start](docs/QUICK_START.md)
- **Developers**: See [Project Structure](PROJECT_STRUCTURE.md) and deployment scripts in `scripts/`
- **Issues**: Create an issue in the repository

---

**Ready to create your perfect resume?** 
### [🚀 **Start Now →**](https://resume-generator-ai.solutionsynth.cloud)


