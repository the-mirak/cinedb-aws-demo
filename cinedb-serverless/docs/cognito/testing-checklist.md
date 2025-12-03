# Cognito Authentication Testing Checklist

## Overview

This document provides comprehensive test scenarios for verifying the Cognito authentication implementation in CineDB. All tests should be performed to ensure both demo mode and Cognito authentication work correctly.

## Test Environment

**Website URL:** https://cinedb.mirak.tech/

**Test Browsers:**
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Edge

**Clear Browser Data Before Testing:**
1. Open Developer Tools (F12)
2. Go to Application/Storage tab
3. Clear:
   - Local Storage
   - Session Storage
   - Cookies
4. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

## Test Suite 1: Demo Mode Functionality

### Test 1.1: Enable Demo Mode

**Steps:**
1. Navigate to https://cinedb.mirak.tech/login.html
2. Toggle the "Demo Mode" switch to ON
3. Observe the UI changes

**Expected Results:**
- [ ] Login form hides
- [ ] "Demo mode is active" message appears
- [ ] "Continue to Admin Panel" button is visible
- [ ] Toggle switch is checked/enabled

**Status:** ⬜ Pass  ⬜ Fail

**Notes:**
```
_______________________________________________
```

---

### Test 1.2: Access Admin Page in Demo Mode

**Steps:**
1. With demo mode enabled, click "Continue to Admin Panel"
2. Wait for redirect

**Expected Results:**
- [ ] Redirects to admin.html
- [ ] "DEMO MODE" badge visible in top-right corner
- [ ] Movie list loads successfully
- [ ] Can see all CRUD buttons (Add Movie, Edit, Delete)

**Status:** ⬜ Pass  ⬜ Fail

**Notes:**
```
_______________________________________________
```

---

### Test 1.3: Add Movie in Demo Mode

**Steps:**
1. On admin page, click "Add Movie"
2. Fill in:
   - Title: "Test Movie Demo"
   - Year: 2024
   - Rating: 8.5
   - Duration: 120
   - Director: "Test Director"
   - Genre: "Action"
   - Cast: "Test Actor"
   - Synopsis: "Test synopsis for demo mode"
3. Upload a poster image or provide S3 URL
4. Click "Add Movie"

**Expected Results:**
- [ ] Form submits successfully
- [ ] Success message appears
- [ ] Redirects to admin page
- [ ] New movie appears in the list
- [ ] **Browser console shows NO Authorization header sent**

**Status:** ⬜ Pass  ⬜ Fail

**Browser Console Check:**
```javascript
// Network tab should show:
// POST https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod/movies
// Headers: NO "Authorization" header present
```

**Notes:**
```
_______________________________________________
```

---

### Test 1.4: Edit Movie in Demo Mode

**Steps:**
1. Click "Edit" on any movie
2. Change the title to "Edited in Demo Mode"
3. Click "Update Movie"

**Expected Results:**
- [ ] Form pre-fills with existing data
- [ ] Update submits successfully
- [ ] Changes are saved
- [ ] **Browser console shows NO Authorization header sent**

**Status:** ⬜ Pass  ⬜ Fail

**Notes:**
```
_______________________________________________
```

---

### Test 1.5: Delete Movie in Demo Mode

**Steps:**
1. Click "Delete" on a test movie
2. Confirm deletion

**Expected Results:**
- [ ] Delete confirmation appears
- [ ] Movie is deleted successfully
- [ ] Movie disappears from list
- [ ] **Browser console shows NO Authorization header sent**

**Status:** ⬜ Pass  ⬜ Fail

**Notes:**
```
_______________________________________________
```

---

### Test 1.6: Logout in Demo Mode

**Steps:**
1. Click "Logout" button
2. Observe redirect

**Expected Results:**
- [ ] Redirects to login.html
- [ ] Demo mode toggle remains enabled (localStorage persists)
- [ ] "Continue to Admin Panel" button is visible
- [ ] sessionStorage is cleared

**Browser Console Check:**
```javascript
// Check in console:
sessionStorage.getItem('authToken') // Should be null
sessionStorage.getItem('explicitly_logged_out') // Should be 'true'
localStorage.getItem('demoMode') // Should be 'true'
```

**Status:** ⬜ Pass  ⬜ Fail

**Notes:**
```
_______________________________________________
```

---

### Test 1.7: Main Page Admin Panel Visibility After Logout

**Steps:**
1. After logout, navigate to https://cinedb.mirak.tech/
2. Look for "Admin Panel" link in the header

**Expected Results:**
- [ ] Admin Panel link is **HIDDEN** (not visible)
- [ ] Movie catalog is visible
- [ ] Can view movie details

**Status:** ⬜ Pass  ⬜ Fail

**Notes:**
```
_______________________________________________
```

---

## Test Suite 2: Cognito User Registration

### Test 2.1: Disable Demo Mode

**Steps:**
1. Navigate to login.html
2. Toggle "Demo Mode" switch to OFF
3. Observe UI changes

**Expected Results:**
- [ ] "Demo mode is active" message hides
- [ ] Login form becomes visible
- [ ] Username and password fields are shown
- [ ] "Don't have an account? Register" link appears

**Status:** ⬜ Pass  ⬜ Fail

**Notes:**
```
_______________________________________________
```

---

### Test 2.2: Navigate to Registration Form

**Steps:**
1. Click "Don't have an account? Register"
2. Observe form changes

**Expected Results:**
- [ ] Login form hides
- [ ] Registration form appears with:
   - Email field
   - Password field
   - Confirm Password field
- [ ] Button text changes to "Already have an account? Login"
- [ ] Password requirements shown: "Min 8 chars, uppercase, lowercase, number, symbol"

**Status:** ⬜ Pass  ⬜ Fail

**Notes:**
```
_______________________________________________
```

---

### Test 2.3: Register with Weak Password

**Steps:**
1. Enter email: your.email+test1@example.com
2. Enter password: "weak"
3. Confirm password: "weak"
4. Click "Register"

**Expected Results:**
- [ ] Error message appears
- [ ] Registration fails
- [ ] Message indicates password policy requirements

**Status:** ⬜ Pass  ⬜ Fail

**Error Message:**
```
_______________________________________________
```

---

### Test 2.4: Register with Mismatched Passwords

**Steps:**
1. Enter email: your.email+test2@example.com
2. Enter password: "ValidPass123!"
3. Confirm password: "DifferentPass123!"
4. Click "Register"

**Expected Results:**
- [ ] Error message: "Passwords do not match"
- [ ] Registration fails
- [ ] User stays on registration form

**Status:** ⬜ Pass  ⬜ Fail

**Notes:**
```
_______________________________________________
```

---

### Test 2.5: Successful Registration

**Steps:**
1. Enter email: **YOUR_REAL_EMAIL@example.com** (must be real to receive code)
2. Enter password: "TestPass123!"
3. Confirm password: "TestPass123!"
4. Click "Register"

**Expected Results:**
- [ ] Registration succeeds
- [ ] UI switches to confirmation form
- [ ] Message: "Check your email for a verification code"
- [ ] Verification code input field appears
- [ ] "Resend code" button is visible
- [ ] Registration form hides
- [ ] Register/Login toggle button hides

**Status:** ⬜ Pass  ⬜ Fail

**Notes:**
```
_______________________________________________
```

---

### Test 2.6: Email Verification Code Received

**Steps:**
1. Check your email inbox
2. Look for email from "no-reply@verificationemail.com"

**Expected Results:**
- [ ] Email received within 2 minutes
- [ ] Subject: "Your verification code"
- [ ] Body contains 6-digit verification code
- [ ] Code is numeric

**Verification Code:**
```
_______________________________________________
```

**Status:** ⬜ Pass  ⬜ Fail

**Notes:**
```
_______________________________________________
```

---

### Test 2.7: Email Confirmation with Wrong Code

**Steps:**
1. Enter code: "000000" (wrong code)
2. Click "Verify Email"

**Expected Results:**
- [ ] Error message appears
- [ ] Message indicates invalid or expired code
- [ ] User stays on confirmation form

**Status:** ⬜ Pass  ⬜ Fail

**Error Message:**
```
_______________________________________________
```

---

### Test 2.8: Email Confirmation with Correct Code

**Steps:**
1. Enter the correct 6-digit code from email
2. Click "Verify Email"

**Expected Results:**
- [ ] Success alert: "Email verified successfully! You can now log in with your credentials."
- [ ] Page reloads
- [ ] Login form is visible
- [ ] User can now log in

**Status:** ⬜ Pass  ⬜ Fail

**Notes:**
```
_______________________________________________
```

---

### Test 2.9: Resend Verification Code

**Steps:**
1. Register another user (different email)
2. On confirmation screen, click "Didn't receive the code? Resend"
3. Check email again

**Expected Results:**
- [ ] Alert: "Verification code resent! Please check your email."
- [ ] New email received
- [ ] New code can be used to verify

**Status:** ⬜ Pass  ⬜ Fail

**Notes:**
```
_______________________________________________
```

---

## Test Suite 3: Cognito Login

### Test 3.1: Login with Unverified User

**Steps:**
1. Register a new user but don't verify email
2. Try to log in with those credentials

**Expected Results:**
- [ ] Login fails
- [ ] Error message about unverified email

**Status:** ⬜ Pass  ⬜ Fail

**Notes:**
```
_______________________________________________
```

---

### Test 3.2: Login with Wrong Password

**Steps:**
1. Enter email: (your verified email)
2. Enter password: "WrongPassword123!"
3. Click "Login"

**Expected Results:**
- [ ] Login fails
- [ ] Error message: "Incorrect username or password" or similar
- [ ] User stays on login page

**Status:** ⬜ Pass  ⬜ Fail

**Error Message:**
```
_______________________________________________
```

---

### Test 3.3: Login with Wrong Email

**Steps:**
1. Enter email: "nonexistent@example.com"
2. Enter password: "TestPass123!"
3. Click "Login"

**Expected Results:**
- [ ] Login fails
- [ ] Error message: "User does not exist" or similar

**Status:** ⬜ Pass  ⬜ Fail

**Error Message:**
```
_______________________________________________
```

---

### Test 3.4: Successful Login

**Steps:**
1. Enter email: (your verified email)
2. Enter password: "TestPass123!" (correct password)
3. Click "Login"

**Expected Results:**
- [ ] Login succeeds
- [ ] Redirects to admin.html
- [ ] NO "DEMO MODE" badge (Cognito mode active)
- [ ] Admin page loads successfully
- [ ] Movie list is visible

**Browser Console Check:**
```javascript
// Check in console:
sessionStorage.getItem('authToken') // Should be a long JWT token starting with "eyJ"
sessionStorage.getItem('accessToken') // Should be present
sessionStorage.getItem('currentUser') // Should be your email
sessionStorage.getItem('explicitly_logged_out') // Should be null
```

**Status:** ⬜ Pass  ⬜ Fail

**JWT Token Sample (first 20 chars):**
```
_______________________________________________
```

---

## Test Suite 4: Protected API Operations with Cognito

### Test 4.1: Add Movie with Cognito Auth

**Steps:**
1. Logged in with Cognito (not demo mode)
2. Click "Add Movie"
3. Fill in all fields:
   - Title: "Test Movie Cognito"
   - Year: 2024
   - Rating: 7.5
   - Duration: 105
   - Director: "Cognito Director"
   - Genre: "Drama"
   - Cast: "Cognito Actor"
4. Upload poster or provide URL
5. Click "Add Movie"
6. **Open Browser DevTools → Network tab BEFORE submitting**

**Expected Results:**
- [ ] Movie added successfully
- [ ] Success message appears
- [ ] Redirects to admin page
- [ ] **Network tab shows Authorization header with JWT token**

**Browser Console Check:**
```javascript
// In Network tab, click on the POST /movies request
// Go to Headers
// Look for:
// Authorization: eyJraWQiOiJxxx... (long JWT token)
```

**Status:** ⬜ Pass  ⬜ Fail

**Authorization Header Present:** ⬜ Yes  ⬜ No

**Notes:**
```
_______________________________________________
```

---

### Test 4.2: Edit Movie with Cognito Auth

**Steps:**
1. Still logged in with Cognito
2. Click "Edit" on any movie
3. Change title to "Edited with Cognito"
4. Click "Update Movie"
5. **Check Network tab**

**Expected Results:**
- [ ] Movie updated successfully
- [ ] Changes saved
- [ ] **Network tab shows Authorization header with JWT token**

**Status:** ⬜ Pass  ⬜ Fail

**Authorization Header Present:** ⬜ Yes  ⬜ No

**Notes:**
```
_______________________________________________
```

---

### Test 4.3: Delete Movie with Cognito Auth

**Steps:**
1. Still logged in with Cognito
2. Click "Delete" on a test movie
3. Confirm deletion
4. **Check Network tab**

**Expected Results:**
- [ ] Movie deleted successfully
- [ ] **Network tab shows Authorization header with JWT token**

**Status:** ⬜ Pass  ⬜ Fail

**Authorization Header Present:** ⬜ Yes  ⬜ No

**Notes:**
```
_______________________________________________
```

---

### Test 4.4: API Call Without Token (Manual Test)

**This test requires using browser console or a tool like Postman**

**Steps:**
1. Open browser console
2. Run:
```javascript
fetch('https://u8cf224qu3.execute-api.us-east-1.amazonaws.com/prod/movies', {
  method: 'POST',
  body: JSON.stringify({title: 'Unauthorized Test'}),
  headers: {'Content-Type': 'application/json'}
}).then(r => r.json()).then(console.log);
```

**Expected Results:**
- [ ] Request fails with 401 Unauthorized
- [ ] Response: `{"message":"Unauthorized"}`
- [ ] Movie is NOT created

**Status:** ⬜ Pass  ⬜ Fail

**Response:**
```
_______________________________________________
```

---

## Test Suite 5: Token Expiration

### Test 5.1: Token Expiration After 60 Minutes

**Steps:**
1. Log in with Cognito
2. Wait 61 minutes (or manually expire token in Cognito console)
3. Try to add/edit/delete a movie

**Expected Results:**
- [ ] Request fails with 401 Unauthorized
- [ ] User is redirected to login page (if protectAdminPage() is called)
- [ ] Error message appears

**Status:** ⬜ Pass  ⬜ Fail

**Notes:**
```
_______________________________________________
```

---

## Test Suite 6: Logout and Re-authentication

### Test 6.1: Logout with Cognito

**Steps:**
1. Logged in with Cognito (not demo mode)
2. Click "Logout"
3. Observe redirect

**Expected Results:**
- [ ] Redirects to login.html
- [ ] Login form is visible
- [ ] Demo mode toggle is OFF (unless previously enabled)
- [ ] sessionStorage is cleared

**Browser Console Check:**
```javascript
sessionStorage.getItem('authToken') // Should be null
sessionStorage.getItem('accessToken') // Should be null
sessionStorage.getItem('explicitly_logged_out') // Should be 'true'
```

**Status:** ⬜ Pass  ⬜ Fail

**Notes:**
```
_______________________________________________
```

---

### Test 6.2: Admin Panel Hidden After Cognito Logout

**Steps:**
1. After Cognito logout, navigate to https://cinedb.mirak.tech/
2. Check header for "Admin Panel" link

**Expected Results:**
- [ ] Admin Panel link is **HIDDEN**
- [ ] Can view movies in public catalog
- [ ] Cannot access admin functions

**Status:** ⬜ Pass  ⬜ Fail

**Notes:**
```
_______________________________________________
```

---

### Test 6.3: Re-login After Logout

**Steps:**
1. After logout, go to login.html
2. Log in again with same Cognito credentials

**Expected Results:**
- [ ] Login succeeds
- [ ] New JWT token issued
- [ ] Can access admin features again

**Status:** ⬜ Pass  ⬜ Fail

**Notes:**
```
_______________________________________________
```

---

## Test Suite 7: Cross-Browser and Edge Cases

### Test 7.1: Multiple Tabs - Demo Mode

**Steps:**
1. Tab 1: Enable demo mode, go to admin page
2. Tab 2: Open https://cinedb.mirak.tech/login.html
3. Check if demo mode is enabled in Tab 2

**Expected Results:**
- [ ] Tab 2 shows demo mode enabled (localStorage shared)
- [ ] Tab 2 can also access admin with demo mode

**Status:** ⬜ Pass  ⬜ Fail

**Notes:**
```
_______________________________________________
```

---

### Test 7.2: Multiple Tabs - Cognito Logout

**Steps:**
1. Tab 1: Log in with Cognito
2. Tab 2: Open admin page (should be accessible)
3. Tab 1: Logout
4. Tab 2: Try to add a movie

**Expected Results:**
- [ ] Tab 2 might still show admin page (sessionStorage shared)
- [ ] Tab 2's API request should fail (token cleared)
- [ ] Refresh Tab 2 → redirects to login

**Status:** ⬜ Pass  ⬜ Fail

**Notes:**
```
_______________________________________________
```

---

### Test 7.3: Incognito/Private Mode

**Steps:**
1. Open incognito/private window
2. Navigate to https://cinedb.mirak.tech/
3. Try to access admin page directly: https://cinedb.mirak.tech/admin.html

**Expected Results:**
- [ ] Redirects to login.html (not authenticated)
- [ ] No demo mode enabled (clean localStorage)

**Status:** ⬜ Pass  ⬜ Fail

**Notes:**
```
_______________________________________________
```

---

## Test Suite 8: Public Access

### Test 8.1: View Movies Without Authentication

**Steps:**
1. In incognito mode (or logged out)
2. Navigate to https://cinedb.mirak.tech/
3. Browse movie catalog

**Expected Results:**
- [ ] Movie catalog loads successfully
- [ ] Can click on movies to see details
- [ ] Poster images load correctly
- [ ] No admin panel link visible

**Status:** ⬜ Pass  ⬜ Fail

**Notes:**
```
_______________________________________________
```

---

## Test Summary

| Test Suite | Total Tests | Passed | Failed | Skipped |
|------------|-------------|--------|--------|---------|
| 1. Demo Mode | 7 | ___ | ___ | ___ |
| 2. Registration | 9 | ___ | ___ | ___ |
| 3. Login | 4 | ___ | ___ | ___ |
| 4. Protected API | 4 | ___ | ___ | ___ |
| 5. Token Expiration | 1 | ___ | ___ | ___ |
| 6. Logout | 3 | ___ | ___ | ___ |
| 7. Edge Cases | 3 | ___ | ___ | ___ |
| 8. Public Access | 1 | ___ | ___ | ___ |
| **TOTAL** | **32** | ___ | ___ | ___ |

## Overall Test Result

⬜ All Tests Passed  
⬜ Some Tests Failed  
⬜ Testing Incomplete

## Notes and Issues Found

```
_______________________________________________________________
_______________________________________________________________
_______________________________________________________________
_______________________________________________________________
_______________________________________________________________
```

## Tester Information

- **Tester Name:** _______________________________________________
- **Date:** _______________________________________________
- **Environment:** _______________________________________________
- **Browser/Version:** _______________________________________________

## Sign-off

I confirm that I have completed the testing as documented above.

**Signature:** _______________________________________________ **Date:** _______________

