# Manual Testing Checklist: Amplify Gen 2 Package Updates

This checklist covers critical functionality to verify after updating Amplify Gen 2 packages. Test each item and mark as ✅ (pass) or ❌ (fail).

## Prerequisites
- [ ] Development server is running (`npm run dev`)
- [ ] Application loads at https://localhost:3000/
- [ ] No console errors on initial load

---

## 1. Authentication Flows

### 1.1 Sign Up
- [ ] Navigate to the application
- [ ] Click "Create Account" or sign up option
- [ ] Enter email, preferred username, and password
- [ ] Verify email confirmation code is sent
- [ ] Enter confirmation code
- [ ] Verify successful account creation
- [ ] **Expected:** User is authenticated and redirected to home page

### 1.2 Sign In
- [ ] Sign out if currently signed in
- [ ] Enter valid email and password
- [ ] Click "Sign In"
- [ ] **Expected:** User is authenticated and redirected to home page
- [ ] **Expected:** NavBanner displays user's preferred username

### 1.3 Sign Out
- [ ] Click sign out button in NavBanner
- [ ] **Expected:** User is signed out and redirected to login screen
- [ ] **Expected:** Protected routes are no longer accessible

### 1.4 Session Management
- [ ] Sign in successfully
- [ ] Verify `fetchUserAttributes()` loads user data
- [ ] Verify `fetchAuthSession()` retrieves user groups (ADMINS, GAMEMASTERS)
- [ ] Check browser console for any auth-related errors
- [ ] **Expected:** User attributes display correctly in NavBanner
- [ ] **Expected:** User groups are loaded (check console or UI behavior)

---

## 2. Data Operations (Amplify Data Client)

### 2.1 Session Queries
- [ ] Navigate to home page after signing in
- [ ] Verify sessions table loads
- [ ] **Expected:** `getSession()` retrieves session data
- [ ] **Expected:** Session names, turn numbers, and deadlines display correctly
- [ ] Check browser console for GraphQL errors

### 2.2 Empire Queries
- [ ] On home page, verify empires are listed for each session
- [ ] **Expected:** `getEmpiresForPlayer()` retrieves player's empires
- [ ] **Expected:** `getEmpiresForSession()` retrieves all empires for GM sessions
- [ ] **Expected:** Empire names, types, and order status display correctly

### 2.3 Session Creation (if user has permissions)
- [ ] Navigate to `/create-session/`
- [ ] Fill in session creation form
- [ ] Submit form
- [ ] **Expected:** `registerSession()` creates new session in database
- [ ] **Expected:** New session appears in sessions list
- [ ] Check for any GraphQL mutation errors

### 2.4 Empire Registration
- [ ] For a session in "WAITING_FOR_PLAYERS" status
- [ ] Click to join session
- [ ] **Expected:** `registerEmpire()` creates empire record
- [ ] **Expected:** Empire appears in session's empire list
- [ ] Verify empire data persists after page refresh

### 2.5 Session Updates (GM only)
- [ ] As a GM user, navigate to GM controls
- [ ] Update session status or turn number
- [ ] **Expected:** `updateSessionStatus()` or `updateSessionTurnNumber()` succeeds
- [ ] **Expected:** Changes reflect immediately in UI
- [ ] Verify updates persist after page refresh

### 2.6 Message Operations
- [ ] Navigate to `/messages/:sessionName/:empireName`
- [ ] **Expected:** `getSentMessages()` retrieves sent messages
- [ ] **Expected:** `getReceivedMessages()` retrieves received messages
- [ ] **Expected:** Messages display with sender, content, and timestamp
- [ ] Verify message recipient relationships load correctly

---

## 3. API Calls (Custom REST API)

### 3.1 Fetch Session Object
- [ ] Navigate to map page `/session/:sessionName/:empireName/:turnNumber`
- [ ] **Expected:** `fetchSessionObject()` retrieves session data from API
- [ ] **Expected:** Map data loads and displays correctly
- [ ] Check network tab for API call status (should be 200 OK)

### 3.2 Load Orders Status
- [ ] On home page, verify "Orders Status" column
- [ ] **Expected:** `loadOrdersStatus()` retrieves status for each empire
- [ ] **Expected:** Status displays as "LOCKED", "UNLOCKED", or similar

### 3.3 Load Snapshot
- [ ] Navigate to map page
- [ ] **Expected:** `loadSnapshot()` retrieves snapshot data
- [ ] **Expected:** Snapshot data populates SnapshotContext
- [ ] **Expected:** Map renders with snapshot data

### 3.4 GM Operations (if applicable)
- [ ] As GM, test `updateTurn()` function
- [ ] Test `generateSnapshots()` function
- [ ] Test `createSession()` function
- [ ] Test `startSession()` function
- [ ] Test `addEmpire()` function
- [ ] **Expected:** All API calls return 200 status
- [ ] **Expected:** Operations complete without errors

---

## 4. UI Components

### 4.1 Authenticator Component (@aws-amplify/ui-react)
- [ ] Verify Authenticator renders on initial load
- [ ] Check sign-in form styling and layout
- [ ] Check sign-up form styling and layout
- [ ] Verify form validation works (empty fields, invalid email, etc.)
- [ ] **Expected:** Authenticator UI displays correctly with no style issues
- [ ] **Expected:** All form interactions work smoothly

### 4.2 Navigation and Routing
- [ ] Test navigation between pages:
  - [ ] Home page (`/`)
  - [ ] Map page (`/session/:sessionName/:empireName/:turnNumber`)
  - [ ] Messages page (`/messages/:sessionName/:empireName`)
  - [ ] News page (`/news/:sessionName/:empireName/:turnNumber`)
  - [ ] Ship Design page (`/ship-design/`)
  - [ ] Ship Classes page (`/ship-classes/:sessionName/:empireName/:turnNumber`)
  - [ ] Create Session page (`/create-session/`)
- [ ] **Expected:** All routes load without errors
- [ ] **Expected:** NavBanner persists across all pages

### 4.3 Data Display Components
- [ ] Verify SessionTableRow renders correctly
- [ ] Verify SessionWaitingTableRow renders correctly
- [ ] Check Material-UI Table components display properly
- [ ] **Expected:** All data displays in correct table format
- [ ] **Expected:** No layout or styling issues

### 4.4 Context Providers
- [ ] Verify SnapshotContext provides data to child components
- [ ] Test context updates when navigating between sessions
- [ ] **Expected:** Context data persists and updates correctly
- [ ] **Expected:** No context-related errors in console

---

## 5. Build and Development

### 5.1 Build Verification
- [ ] Run `npm run build`
- [ ] **Expected:** Build completes without errors
- [ ] **Expected:** No TypeScript compilation errors
- [ ] **Expected:** No Vite build warnings related to Amplify

### 5.2 Development Server
- [ ] Run `npm run dev`
- [ ] **Expected:** Server starts on https://localhost:3000/
- [ ] **Expected:** No Amplify configuration errors in console
- [ ] **Expected:** Hot module replacement works correctly

### 5.3 Amplify Configuration
- [ ] Verify `Amplify.configure(outputs)` executes before app loads
- [ ] Check browser console for configuration warnings
- [ ] **Expected:** No "Amplify has not been configured" warnings
- [ ] **Expected:** amplify_outputs.json is loaded correctly

---

## 6. Error Handling and Edge Cases

### 6.1 Network Errors
- [ ] Disconnect network and test data operations
- [ ] **Expected:** Appropriate error messages display
- [ ] **Expected:** Application doesn't crash

### 6.2 Authentication Errors
- [ ] Try signing in with invalid credentials
- [ ] **Expected:** Error message displays
- [ ] Try accessing protected routes while signed out
- [ ] **Expected:** Redirected to sign-in page

### 6.3 Data Validation
- [ ] Try creating session with invalid data
- [ ] **Expected:** Validation errors display
- [ ] Try querying non-existent session
- [ ] **Expected:** Graceful error handling (no crash)

---

## 7. Console Checks

### 7.1 No Critical Errors
- [ ] Open browser developer console
- [ ] Navigate through all major pages
- [ ] **Expected:** No red error messages related to Amplify
- [ ] **Expected:** No GraphQL errors
- [ ] **Expected:** No authentication errors

### 7.2 Deprecation Warnings
- [ ] Check console for deprecation warnings
- [ ] Document any warnings found:
  - Warning: _______________________________________________
  - Warning: _______________________________________________
  - Warning: _______________________________________________

### 7.3 Performance
- [ ] Check network tab for API call performance
- [ ] Verify data loads in reasonable time (<2 seconds)
- [ ] **Expected:** No significant performance degradation

---

## 8. Cross-Browser Testing (Optional)

- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge
- [ ] **Expected:** Consistent behavior across browsers

---

## Summary

**Total Tests:** _____ / _____  
**Pass Rate:** _____%

**Critical Issues Found:**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**Non-Critical Issues Found:**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**Recommendation:**
- [ ] ✅ All tests passed - ready for deployment
- [ ] ⚠️ Minor issues found - can proceed with caution
- [ ] ❌ Critical issues found - requires fixes before deployment

---

## Notes

Add any additional observations or issues encountered during testing:

_______________________________________________
_______________________________________________
_______________________________________________
