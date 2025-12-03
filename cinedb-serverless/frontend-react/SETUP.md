# CineDB Setup Guide

Quick start guide to get your modernized CineDB running.

## 1. Environment Configuration

Create a `.env` file in the project root:

```env
# AWS Cognito (from your existing setup)
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_COGNITO_CLIENT_ID=your-client-id

# Lambda Backend API
VITE_API_BASE_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:8080`

## 4. Application Structure

Your app now has three main pages:

### 🎬 Movies Page (`/`)
- Browse all movies
- Search and filter
- Modern grid layout
- Hero section

### ➕ Add Movie (`/add-movie`)
- Protected route (requires login)
- Form with validation
- Poster upload
- Genre selection

### 👨‍💼 Admin Dashboard (`/admin`)
- Protected route (requires login)
- Movie management table
- Statistics cards
- Delete functionality

## 5. Authentication Flow

1. Users sign up at `/auth`
2. AWS Cognito handles authentication
3. Session persists across page refreshes
4. Protected routes auto-redirect to `/auth`

## 6. API Integration

The app connects to your existing Lambda backend:

```typescript
// All API calls automatically include auth headers
import { movieApi } from '@/services/api.service';

// Get movies
const movies = await movieApi.getMovies();

// Create movie
await movieApi.createMovie(movieData);

// Upload poster
await movieApi.uploadPoster(formData);
```

## 7. Backend Endpoints Expected

Your Lambda API should have these endpoints:

```
GET    /movies              - List all movies
GET    /movies/:id          - Get single movie
POST   /movies              - Create movie
PUT    /movies/:id          - Update movie
DELETE /movies/:id          - Delete movie
POST   /movies/poster       - Upload poster image

GET    /admin/stats         - Get statistics
GET    /admin/users         - List users
```

## 8. Testing Without Backend

The app includes fallback mock data, so you can test the UI even if the backend isn't connected yet. Just leave `VITE_API_BASE_URL` empty.

## 9. Build for Production

```bash
npm run build
```

This creates static files in `dist/` ready for S3.

## 10. Next Steps

1. Test authentication with your Cognito pool
2. Verify API endpoints match your Lambda functions
3. Test file upload functionality
4. Customize movie fields to match your schema
5. Deploy to S3 (see DEPLOYMENT.md)

## Troubleshooting

**Cognito errors:**
- Check User Pool ID and Client ID in `.env`
- Verify callback URLs in Cognito console include your dev URL

**API errors:**
- Check `VITE_API_BASE_URL` points to correct API Gateway
- Verify CORS is enabled on your Lambda functions
- Check CloudWatch logs for Lambda errors

**Build errors:**
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear build cache: `rm -rf dist .vite`

## Features

✅ Modern React with TypeScript  
✅ AWS Cognito authentication  
✅ Protected routes  
✅ File upload with preview  
✅ Form validation  
✅ Loading states  
✅ Error handling  
✅ Toast notifications  
✅ Responsive design  
✅ Dark cinematic theme  
✅ S3-ready static build  

## Support

For issues, check:
1. Browser console for errors
2. Network tab for failed API calls
3. AWS CloudWatch for Lambda logs
4. Cognito console for auth issues
