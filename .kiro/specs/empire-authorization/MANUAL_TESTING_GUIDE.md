# Manual Testing Guide: Empire Authorization

## Overview
This guide provides step-by-step instructions for manually testing the empire authorization feature. All automated tests are passing, and the system is ready for manual validation.

## Prerequisites
- Application is running locally (use `npm run dev`)
- You have access to test accounts with different roles:
  - Regular player account(s)
  - Game Master account(s)
- Test data exists in the database with:
  - Multiple sessions
  - Multiple empires per session
  - Different ownership scenarios

## Test Environment Setup

### 1. Start the Application
```bash
npm run dev
```
The application should be accessible at `http://localhost:5173` (or your configured port).

### 2. Verify Test Data
Ensure you have the following test data structure:
- **Session A**: 
  - Empire 1 (owned by Player 1)
  - Empire 2 (owned by Player 2)
  - GM Empire (owned by GM User)
- **Session B**:
  - Empire 3 (owned by Player 1)
  - Empire 4 (owned by Player 3)
  - GM Empire (owned by Different GM)

---

## Test Cases

### Test 1: Regular Player Accessing Owned Empire ✓
**Objective**: Verify that a player can successfully access their own empire.

**Steps**:
1. Log in as Player 1
2. Navigate to the home page (session view)
3. Verify that Session A and Session B are displayed (where Player 1 has empires)
4. Click on Empire 1 in Session A
5. Verify the empire view loads successfully
6. Check that empire data is displayed correctly

**Expected Result**:
- ✓ Player can access their own empire
- ✓ Empire data loads without errors
- ✓ No authorization errors appear

**Status**: [x] Pass [ ] Fail

**Notes**:
_______________________________________________________

---

### Test 2: Regular Player Attempting to Access Non-Owned Empire ✗
**Objective**: Verify that a player cannot access empires they don't own.

**Steps**:
1. Remain logged in as Player 1
2. Manually modify the URL to access Empire 2 in Session A (owned by Player 2)
   - Example: `/session/SessionA/Empire2/1`
3. Press Enter to navigate

**Expected Result**:
- ✗ Access is denied
- ✗ User is redirected to `/unauthorized` page
- ✗ Error message displays: "You do not have permission to access this empire"
- ✗ "Return to Sessions" button is visible
- ✗ No empire data is displayed

**Status**: [x] Pass [ ] Fail

**Notes**:
_______________________________________________________

---

### Test 3: GM Accessing Empires in Managed Session ✓
**Objective**: Verify that a GM can access all empires in their session.

**Steps**:
1. Log out and log in as GM User (manages Session A)
2. Navigate to the home page
3. Verify Session A is displayed with all empires visible
4. Click on Empire 1 (owned by Player 1)
5. Verify access is granted
6. Navigate back and click on Empire 2 (owned by Player 2)
7. Verify access is granted

**Expected Result**:
- ✓ GM can access all empires in their managed session
- ✓ No authorization errors for any empire in Session A
- ✓ Empire data loads correctly for all empires

**Status**: [x] Pass [ ] Fail

**Notes**:
_______________________________________________________

---

### Test 4: GM Attempting to Access Empire in Other Session ✗
**Objective**: Verify that a GM cannot access empires in sessions they don't manage.

**Steps**:
1. Remain logged in as GM User (manages Session A)
2. Manually modify the URL to access Empire 3 in Session B
   - Example: `/session/SessionB/Empire3/1`
3. Press Enter to navigate

**Expected Result**:
- ✗ Access is denied
- ✗ User is redirected to `/unauthorized` page
- ✗ Error message displays appropriately
- ✗ No empire data from Session B is displayed

**Status**: [x] Pass [ ] Fail

**Notes**:
_______________________________________________________

---

### Test 5: Accessing Empire View Without Authentication ✗
**Objective**: Verify that unauthenticated users are redirected to login.

**Steps**:
1. Log out completely (clear session)
2. Manually navigate to an empire view URL
   - Example: `/session/SessionA/Empire1/1`
3. Observe the behavior

**Expected Result**:
- ✗ User is redirected to the login page
- ✗ No empire data is displayed before redirect
- ✗ After logging in, user should be redirected to the originally requested page (if they have access)

**Status**: [x] Pass [ ] Fail

**Notes**:
_______________________________________________________

---

### Test 6: URL Manipulation and Browser Back/Forward Buttons
**Objective**: Verify that authorization is re-checked on every navigation.

#### Test 6a: URL Manipulation
**Steps**:
1. Log in as Player 1
2. Navigate to Empire 1 (owned by Player 1)
3. Manually change the URL to Empire 2 (not owned by Player 1)
4. Press Enter

**Expected Result**:
- ✗ Authorization is re-checked
- ✗ Access is denied
- ✗ User is redirected to unauthorized page

**Status**: [x] Pass [ ] Fail

#### Test 6b: Browser Back Button
**Steps**:
1. From the unauthorized page (after Test 6a), click the browser back button
2. Observe the behavior

**Expected Result**:
- ✓ Authorization is re-checked
- ✓ User can return to Empire 1 (which they own)
- ✓ Empire data loads correctly

**Status**: [x] Pass [ ] Fail

#### Test 6c: Browser Forward Button
**Steps**:
1. From Empire 1, click the browser forward button
2. Observe the behavior

**Expected Result**:
- ✗ Authorization is re-checked
- ✗ Access to Empire 2 is still denied
- ✗ User is redirected to unauthorized page again

**Status**: [x] Pass [ ] Fail

**Notes**:
_______________________________________________________

---

### Test 7: Static Page Access While Authenticated ✓
**Objective**: Verify that authenticated users can access static pages without empire authorization.

**Steps**:
1. Log in as any user (Player 1)
2. Navigate to static pages:
   - Ship Design Page
   - Create Session Page
   - Any other static pages
3. Verify access is granted without empire checks

**Expected Result**:
- ✓ All static pages are accessible
- ✓ No authorization errors
- ✓ No empire ownership checks are performed

**Status**: [x] Pass [ ] Fail

**Notes**:
_______________________________________________________

---

### Test 8: Session View Shows Only Relevant Sessions and Empires
**Objective**: Verify that the session view correctly filters sessions and empires.

#### Test 8a: Regular Player View
**Steps**:
1. Log in as Player 1
2. Navigate to the home page (session view)
3. Observe which sessions and empires are displayed

**Expected Result**:
- ✓ Only sessions where Player 1 has empires are shown (Session A and Session B)
- ✓ Only empires owned by Player 1 are displayed in each session
- ✓ Empires owned by other players are NOT displayed
- ✓ All displayed empire links are clickable and grant access

**Status**: [x] Pass [ ] Fail

#### Test 8b: GM View
**Steps**:
1. Log out and log in as GM User (manages Session A)
2. Navigate to the home page
3. Observe which sessions and empires are displayed

**Expected Result**:
- ✓ Session A is displayed (where GM User is the GM)
- ✓ ALL empires in Session A are displayed (including those owned by other players)
- ✓ Session B is NOT displayed (GM User is not GM there)
- ✓ All displayed empire links are clickable and grant access

**Status**: [x] Pass [ ] Fail

**Notes**:
_______________________________________________________

---

## Edge Cases and Additional Tests

### Test 9: Session View Consistency
**Objective**: Verify that clicking any empire link from the session view grants access.

**Steps**:
1. Log in as any user
2. From the session view, note all displayed empire links
3. Click each empire link one by one
4. Verify access is granted for each

**Expected Result**:
- ✓ Every empire link displayed in the session view should grant access
- ✓ No authorization failures should occur for any displayed link

**Status**: [x] Pass [ ] Fail

**Notes**:
_______________________________________________________

---

### Test 10: Multiple Tab Behavior
**Objective**: Verify authorization works correctly across multiple browser tabs.

**Steps**:
1. Log in as Player 1 in Tab 1
2. Open Tab 2 with the same browser
3. In Tab 1, navigate to Empire 1 (owned by Player 1)
4. In Tab 2, try to navigate to Empire 2 (not owned by Player 1)
5. Verify both tabs behave correctly

**Expected Result**:
- ✓ Tab 1 shows Empire 1 data
- ✗ Tab 2 shows unauthorized page
- ✓ Authorization is independent per navigation

**Status**: [x] Pass [ ] Fail

**Notes**:
_______________________________________________________

---

## Security Verification

### Test 11: Error Message Security
**Objective**: Verify that error messages don't leak sensitive information.

**Steps**:
1. Log in as Player 1
2. Try to access various unauthorized empires
3. Examine all error messages displayed

**Expected Result**:
- ✗ Error messages should NOT contain:
  - Other player names
  - Empire details
  - Session details
  - Database IDs
- ✓ Error messages should be generic and user-friendly

**Status**: [x] Pass [ ] Fail

**Notes**:
_______________________________________________________

---

## Performance Testing

### Test 12: Authorization Performance
**Objective**: Verify that authorization checks don't significantly impact page load times.

**Steps**:
1. Log in as any user
2. Navigate between multiple empires
3. Observe page load times

**Expected Result**:
- ✓ Authorization checks complete quickly (< 500ms)
- ✓ No noticeable delay in page rendering
- ✓ Loading states are displayed appropriately

**Status**: [x] Pass [ ] Fail

**Notes**:
_______________________________________________________

---

## Test Summary

### Overall Results
- Total Tests: 12
- Passed: 12
- Failed: 0
- Blocked: 0

### Critical Issues Found
1. _______________________________________________________
2. _______________________________________________________
3. _______________________________________________________

### Non-Critical Issues Found
1. _______________________________________________________
2. _______________________________________________________
3. _______________________________________________________

### Recommendations
_______________________________________________________
_______________________________________________________
_______________________________________________________

---

## Sign-Off

**Tester Name**: John
**Date**: Nov 24, 2025
**Signature**: John

**Status**: [x] Approved for Production [ ] Requires Fixes [ ] Needs Further Testing
