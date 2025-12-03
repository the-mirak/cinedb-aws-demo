# CineDB - Modern Movie Database

A beautiful, modern movie database application built with React, TypeScript, and AWS Cognito authentication. Optimized for static hosting on AWS S3.

## 🚀 Features

- **AWS Cognito Authentication** - Secure user authentication with email/password
- **Modern React SPA** - Fast, responsive single-page application
- **Beautiful UI** - Cinematic dark theme with smooth animations
- **Mobile-First** - Fully responsive design
- **S3 Optimized** - Static build ready for AWS S3/CloudFront deployment
- **TypeScript** - Full type safety throughout the application

## 🛠 Tech Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **AWS Cognito** - Authentication and user management
- **Shadcn UI** - Beautiful, accessible components
- **React Router** - Client-side routing
- **Zod** - Runtime type validation

## 📋 Prerequisites

- Node.js 18+ and npm
- AWS Account
- AWS Cognito User Pool configured

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your AWS Cognito details:

```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_COGNITO_CLIENT_ID=your-client-id
```

### 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:8080`

### 4. Build for Production

```bash
npm run build
```

Built files will be in `dist/` folder, ready for S3 upload.

## 📦 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed AWS S3/CloudFront deployment instructions.

Quick deploy:
```bash
npm run build
aws s3 sync dist/ s3://your-bucket-name/ --delete
```

## 🔐 Authentication

The app uses AWS Cognito for authentication:

- **Sign Up** - Create new account with email/password
- **Sign In** - Authenticate existing users  
- **Protected Routes** - Automatic redirect to login
- **Session Management** - Persistent login with refresh tokens

Password requirements:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

## 🎨 Design System

The app uses a custom design system defined in:
- `src/index.css` - Color tokens and utilities
- `tailwind.config.ts` - Tailwind configuration

Key features:
- Dark cinematic theme with red accents
- Glass morphism effects
- Smooth animations and transitions
- Responsive typography

## 📁 Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── ui/          # Shadcn UI components
│   ├── Header.tsx   # Main navigation
│   └── ...
├── contexts/        # React contexts
│   └── AuthContext.tsx
├── services/        # Business logic
│   └── auth.service.ts
├── config/          # Configuration files
│   └── cognito.ts
├── pages/           # Page components
│   ├── Index.tsx
│   ├── Auth.tsx
│   └── NotFound.tsx
└── App.tsx          # Main app component
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📝 Environment Variables

All environment variables must be prefixed with `VITE_`:

- `VITE_AWS_REGION` - AWS region for Cognito
- `VITE_COGNITO_USER_POOL_ID` - Cognito User Pool ID
- `VITE_COGNITO_CLIENT_ID` - Cognito App Client ID

## 🔒 Security

- Input validation with Zod schemas
- Secure password requirements
- Client-side session management
- Protected routes with authentication checks
- No sensitive data in localStorage
- HTTPS required in production

## 🐛 Troubleshooting

**Build fails:**
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf .vite`

**Authentication not working:**
- Check Cognito configuration in `.env`
- Verify callback URLs in Cognito console
- Check browser console for errors

**Routing issues on S3:**
- Ensure error document is set to `index.html`
- Configure CloudFront custom error responses

## 📄 License

This project is private and proprietary.

## 🤝 Contributing

This is a private project. Contact the repository owner for contribution guidelines.

## 📧 Support

For issues or questions, please contact the development team.

---

Built with ❤️ using React and AWS
