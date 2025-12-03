# Demo Mode - Read-Only Implementation

## ✅ What's Implemented

### Frontend (LIVE)
Demo mode provides a **read-only experience** for users to explore the CineDB interface without real authentication.

**Live at**: https://cinedb.mirak.tech/

## 🎯 How It Works

### 1. User Enables Demo Mode
- Go to `/auth`
- Toggle "Demo Mode" switch
- Click "Sign In"

### 2. What Gets Stored
```javascript
localStorage = {
  "isDemoMode": "true",
  "demoToken": "CINEDB_DEMO_MODE_TOKEN_2024"
}
```

### 3. What Demo Users Can Do

| Action | Result |
|--------|--------|
| **Browse movies** | ✅ Works (GET /movies is public) |
| **Use chatbot** | ✅ Works (POST /chat is public) |
| **View movie details** | ✅ Works (GET /movies/{id} is public) |
| **Add movies** | ❌ 401 Unauthorized (protected endpoint) |
| **Edit movies** | ❌ 401 Unauthorized (protected endpoint) |
| **Delete movies** | ❌ 401 Unauthorized (protected endpoint) |

### 4. Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Demo Mode User                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Sends: Authorization: Bearer CINEDB_DEMO_MODE_TOKEN_2024
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway                              │
│                                                             │
│  Public Endpoints (no auth):                                │
│    ✅ GET /movies → Works                                   │
│    ✅ POST /chat → Works                                    │
│                                                             │
│  Protected Endpoints (Cognito auth):                        │
│    ❌ POST /movies → 401 (invalid Cognito JWT)             │
│    ❌ PUT /movies/{id} → 401 (invalid Cognito JWT)         │
│    ❌ DELETE /movies/{id} → 401 (invalid Cognito JWT)      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Design Rationale

### Why Read-Only?

1. **Security**: Demo users can't modify production data
2. **Simplicity**: No custom Lambda authorizer needed
3. **Cost**: No additional Lambda invocations
4. **User Experience**: Demo mode is for exploring UI/UX, not testing admin features

### Why Send a Token at All?

The demo token (`CINEDB_DEMO_MODE_TOKEN_2024`) is sent even though it's rejected by protected endpoints for:

1. **Consistency**: Same API client code for demo and real users
2. **Future-proofing**: Easy to add Lambda authorizer later if needed
3. **Debugging**: Clear in network logs when demo mode is active

---

## 📝 Files Modified

### Frontend
- ✅ `frontend-react/src/contexts/AuthContext.tsx` - Generates and stores demo token
- ✅ `frontend-react/src/services/api.service.ts` - Sends demo token in API requests

### Backend
- ❌ No backend changes needed!
- ✅ Existing Cognito authorizer handles real authentication
- ✅ Public endpoints remain public

---

## 🔐 Storage Comparison

### Real Cognito Authentication
```javascript
localStorage = {
  "CognitoIdentityServiceProvider.6u84...gu3.user@email.com.idToken": "eyJhbGc...",  // ~2KB
  "CognitoIdentityServiceProvider.6u84...gu3.user@email.com.accessToken": "eyJhbGc...",  // ~2KB
  "CognitoIdentityServiceProvider.6u84...gu3.user@email.com.refreshToken": "eyJjdHk...",  // ~1KB
  // ... 10+ more Cognito keys
}
// Total: ~5-7KB
```

### Demo Mode
```javascript
localStorage = {
  "isDemoMode": "true",        // 19 bytes
  "demoToken": "CINEDB_DEMO_MODE_TOKEN_2024"  // 42 bytes
}
// Total: ~60 bytes
```

---

## 🧪 Testing

### Check Demo Mode is Active
1. Go to https://cinedb.mirak.tech/auth
2. Enable "Demo Mode"
3. Sign in
4. Open DevTools (F12) → Application → Local Storage
5. Verify:
   - `isDemoMode: "true"`
   - `demoToken: "CINEDB_DEMO_MODE_TOKEN_2024"`

### Check Token is Sent
1. Open DevTools → Network tab
2. Browse movies (triggers GET /movies)
3. Click any API request
4. Check Headers:
   - Should include: `Authorization: Bearer CINEDB_DEMO_MODE_TOKEN_2024`

### Verify Protected Endpoints Return 401
1. While in demo mode, try to access admin panel
2. Try to add a movie (if UI allows)
3. Should see 401 errors in Network tab (this is expected!)

---

## 🔄 Switching Between Demo and Real Auth

### From Demo to Real
1. Sign out (clears demo flags)
2. Sign in with real Cognito account
3. Now you can use all admin features

### From Real to Demo
1. Sign out (clears Cognito tokens)
2. Enable demo mode
3. Sign in as demo user

---

## 💡 Future Enhancements (Optional)

If you later decide demo users should have admin access:

1. **Create Lambda Authorizer**: Custom authorizer that accepts demo token
2. **Deploy to API Gateway**: Replace Cognito authorizer on protected endpoints
3. **Deploy API Gateway**: Make changes live

Estimated time: 15-20 minutes

---

## ✅ Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend | ✅ Deployed | Demo mode fully functional |
| Demo Token Generation | ✅ Working | Stored in localStorage |
| Demo Token Sending | ✅ Working | Sent in all API requests |
| Public Endpoints | ✅ Working | Demo users can browse |
| Protected Endpoints | ❌ Returns 401 | By design - read-only demo |
| Real Authentication | ✅ Working | Cognito auth unchanged |

---

## 🎉 Summary

Demo mode is **fully functional** as a **read-only experience**:
- ✅ No backend changes needed
- ✅ No additional infrastructure
- ✅ Simple and secure
- ✅ Easy to test and demo the UI

Demo users can explore the interface without being able to modify data, while real authenticated users maintain full admin access.

