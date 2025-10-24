# Consultant Column "N/A" - Diagnostic Guide

## Current Status

✅ **Fixed:** PostgREST foreign key relationship error
🔍 **Investigating:** Why consultant column shows "N/A"

## Console Log Analysis

```javascript
[TransactionHistory] Sample transaction with booking: undefined
```

**Meaning:** No transactions in the database have a `booking_id` value.

## Two Possible Scenarios

### Scenario A: No Booking Transactions Exist (Expected Behavior)
**"N/A" is CORRECT** if your database only contains:
- Top-up/purchase transactions (no consultant)
- Admin-granted credits (no consultant)
- Recurring deductions (no consultant)
- Initial credits (no consultant)

**Solution:** Create a test booking to verify the system works correctly.

### Scenario B: Booking Transactions Should Exist (Bug)
**"N/A" is WRONG** if you have made service bookings but transactions aren't linked.

**Solution:** Investigate transaction creation logic in booking flow.

---

## Diagnostic Steps

### Step 1: Run Database Query

1. Open **Supabase Dashboard** → SQL Editor
2. Run the diagnostic query from `diagnostic-check-bookings.sql`
3. Check the results:

```sql
-- Expected output format:
-- Total Transactions: X
-- Transactions with booking_id: Y
-- Transactions without booking_id: Z
```

**Interpret Results:**

| Result | Meaning | Action |
|--------|---------|--------|
| `with booking_id = 0` | No booking transactions exist | **Scenario A** - N/A is correct |
| `with booking_id > 0` | Booking transactions exist | **Scenario B** - Bug in data loading |

### Step 2: Check Browser Console Logs

After refreshing the page, look for:

```javascript
[TransactionHistory] Transaction breakdown: {
  total: 10,
  withBooking: 0,        // ← Should be > 0 if bookings exist
  withoutBooking: 10,
  sampleWithBooking: 'NONE',
  allTransactionTypes: ['purchase', 'admin_credit']
}
```

**If `withBooking = 0`:** No booking transactions in database
**If `withBooking > 0`:** Check next log for structure details

### Step 3: Verify Booking Exists

Check if you have any bookings in the database:

```sql
SELECT COUNT(*) FROM bookings;
```

- **Count = 0:** No bookings created yet
- **Count > 0:** Bookings exist but transactions may not be linked

---

## Creating a Test Booking

If you need to verify the system works, create a test booking:

1. **Navigate to Marketplace/Services**
2. **Book a service** from a consultant
3. **Complete the booking flow**
4. **Check Transaction History** - Consultant name should appear

---

## Expected Behavior After Fix

| Transaction Type | Consultant Column | Reason |
|------------------|-------------------|---------|
| Service Booking | **Consultant Name** | Has booking_id + consultant relationship |
| Top-up Purchase | "N/A" | No consultant involved |
| Admin Credit | "N/A" | No consultant involved |
| Recurring Deduction | "N/A" | No consultant involved |
| Initial Credit | "N/A" | No consultant involved |

---

## If Consultant Column Still Shows "N/A" After Creating Booking

Check these logs in console:

```javascript
// Should show booking transaction details:
[TransactionHistory] Sample booking transaction structure: {
  id: "xxx",
  booking_id: "yyy",
  hasBookingsObject: true,    // ← Should be true
  bookingsKeys: ['consultant_id', 'consultants', 'services']
}

// Should show consultant IDs found:
[TransactionHistory] Fetching names for consultant IDs: ['user-id-1', 'user-id-2']

// Should show mapped names:
[TransactionHistory] Consultant names mapped: {
  'user-id-1': 'John Doe',
  'user-id-2': 'Jane Smith'
}
```

**If any of these fail, report the console logs for further investigation.**

---

## Summary

1. ✅ Foreign key relationship issue is fixed
2. ✅ Diagnostic query confirms 107 booking transactions exist
3. ✅ Enhanced logging added for better diagnostics
4. 📊 Finding: Recent 10 transactions are all non-booking (top-ups, upgrades)
5. 🎯 Conclusion: "N/A" is CORRECT for visible transactions
6. 🧪 Need to verify consultant names display for older booking transactions

## Diagnostic Results

From database queries:
- **Total Transactions:** 418
- **With booking_id:** 107 (these SHOULD show consultant names)
- **Without booking_id:** 311 (these correctly show "N/A")
- **Total Bookings:** 61

**Key Finding:** The 10 most recent transactions are all non-booking transactions:
- Top-ups (purchase credits)
- Plan upgrades/downgrades
- Campaign charges
- Admin credits

These transactions SHOULD show "N/A" in the Consultant column because no consultant is involved!

## CRITICAL FINDING: Data Integrity Issue

### Test Results Analysis

Running `test-booking-transactions.sql` revealed the actual problem:

```json
{
  "consultant_user_id": "6a60a946-fcf6-49c1-8b36-465365874715",
  "consultant_name": null  ← PROBLEM!
}
```

**What this means:**
- ✅ Transactions correctly linked to bookings
- ✅ Bookings correctly linked to consultants
- ✅ Consultant user_id found
- ❌ **BUT profile lookup returns NULL**

### Root Cause

**Orphaned Consultant Records**: Some consultant records exist in the `consultants` table but their corresponding user accounts don't exist in the `profiles` table (or were deleted).

**Working Example:**
```
consultant_user_id: 952c1a39-f9bf-4f5d-ba81-fac0ab686384
consultant_name: "leo" ✅
```

**Broken Example:**
```
consultant_user_id: 6a60a946-fcf6-49c1-8b36-465365874715
consultant_name: null ❌
```

## Next Investigation Steps

### Run Data Integrity Check

Execute `diagnostic-consultant-profile-integrity.sql` to:
1. Check if problematic consultant profile exists
2. Count how many consultants have missing profiles
3. List all orphaned consultant records
4. Compare working vs broken consultant data

### Possible Solutions

**Option A: Handle NULL gracefully**
- Update UI to show "Unknown Consultant" instead of "N/A"
- Acceptable if orphaned consultants are inactive/deleted

**Option B: Data cleanup**
- Delete orphaned consultant records with no active bookings
- Clean up historical data from deleted users

**Option C: Data restoration**
- If profiles were accidentally deleted, restore from backup
- Create placeholder profiles for orphaned consultants
