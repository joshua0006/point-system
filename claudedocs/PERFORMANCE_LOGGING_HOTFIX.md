# Performance Logging Critical Hotfix

## 🔴 Critical Issue: React Error #310

**Error Message:**
```
Minified React error #310; visit https://reactjs.org/docs/error-decoder.html?invariant=310
for the full message or use the non-minified dev environment for full errors and additional
helpful warnings.
```

**Translation:** "Expected a suspended thenable. This is a bug in React."

---

## 🐛 Root Cause Analysis

The initial performance logging implementation **violated React's Rules of Hooks**, causing critical runtime errors:

### **Problem 1: ProtectedRoute.tsx - Conditional Hook Calls**

**❌ WRONG (Initial Implementation):**
```typescript
const ProtectedRoute = ({ children }) => {
  useEffect(() => {
    mark('protected-route-start');
  }, []);

  const authContext = useContext(AuthContext);

  if (!authContext) {
    return <Navigate to="/auth" replace />;  // ⚠️ Early return
  }

  const { user, profile, loading } = authContext;

  if (loading) {
    return <Spinner />;  // ⚠️ Early return
  }

  if (!user) {
    return <Navigate to="/auth" replace />;  // ⚠️ Early return
  }

  // ❌ CRITICAL ERROR: useEffect AFTER conditional returns
  useEffect(() => {
    mark('protected-route-guard-passed');
    measure('ProtectedRoute Guard', 'protected-route-start', 'protected-route-guard-passed');
  }, []);

  // More conditional logic...
};
```

**Why This Breaks:**
1. **Rules of Hooks**: Hooks must be called in the same order on every render
2. **Conditional Returns**: Early returns prevent subsequent hooks from being called
3. **Hook Order Violation**: React expects the same number of hooks every render
4. **Result**: React's internal hook tracking gets out of sync → Error #310

---

### **Problem 2: RouteRenderer.tsx - Components with Hooks Inside Render**

**❌ WRONG (Initial Implementation):**
```typescript
export function RouteRenderer() {
  return (
    <Routes>
      {routeConfig.map((route) => {
        // ❌ CRITICAL ERROR: Creating components inside map/render
        const ComponentWrapper = () => {
          useEffect(() => {
            mark(`route-${route.path}-loaded`);
          }, []);
          return <Component />;
        };

        const SuspenseWrapper = ({ children }) => {
          useEffect(() => {
            mark(`suspense-${route.path}-start`);
          }, []);
          return <Suspense>{children}</Suspense>;
        };

        return <Route element={<SuspenseWrapper>...</SuspenseWrapper>} />;
      })}
    </Routes>
  );
}
```

**Why This Breaks:**
1. **Component Identity**: New component functions created on every render
2. **Hook Stability**: React loses track of which hooks belong to which component
3. **Re-mounting**: Components unmount/remount unnecessarily
4. **Result**: Hook state corruption → Error #310

---

## ✅ Solution: Proper Hook Usage

### **Fix 1: ProtectedRoute.tsx - All Hooks at Top**

**✅ CORRECT (Fixed Implementation):**
```typescript
const ProtectedRoute = ({ children }) => {
  // Check context first
  const authContext = useContext(AuthContext);
  const { user, profile, loading } = authContext || {};

  // ✅ ALL HOOKS AT THE TOP - No conditional calls
  useEffect(() => {
    mark('protected-route-start');
    console.log('[PERF] 🔐 ProtectedRoute guard evaluation:', now().toFixed(2), 'ms');
  }, []);

  useEffect(() => {
    if (loading) {
      mark('protected-route-loading');
      console.log('[PERF] 🔐 ProtectedRoute showing loading spinner:', now().toFixed(2), 'ms');
    }
  }, [loading]);

  useEffect(() => {
    // Conditional logic INSIDE the effect, not around it
    if (!loading && user && profile) {
      mark('protected-route-guard-passed');
      measure('ProtectedRoute Guard', 'protected-route-start', 'protected-route-guard-passed');
      console.log('[PERF] ✅ ProtectedRoute guard passed:', now().toFixed(2), 'ms');
    }
  }, [loading, user, profile]);

  useEffect(() => {
    if (profile?.approval_status === 'pending') {
      mark('protected-route-pending-approval');
      console.log('[PERF] ⏳ ProtectedRoute showing pending approval:', now().toFixed(2), 'ms');
    }
  }, [profile?.approval_status]);

  // NOW SAFE TO DO CONDITIONAL LOGIC AND RETURNS
  if (!authContext) {
    mark('protected-route-no-context');
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return <Spinner />;
  }

  if (!user) {
    mark('protected-route-no-user');
    return <Navigate to="/auth" replace />;
  }

  // Rest of component logic...
};
```

**Key Changes:**
- ✅ All `useEffect` calls moved to the **top of the component**
- ✅ Conditional logic moved **inside effects**, not around them
- ✅ Dependencies properly tracked in dependency arrays
- ✅ Hooks called in same order every render, regardless of conditional returns

---

### **Fix 2: RouteRenderer.tsx - Simplified Without Wrapper Components**

**✅ CORRECT (Fixed Implementation):**
```typescript
export function RouteRenderer() {
  const location = useLocation();
  const componentLoadedRef = useRef<Set<string>>(new Set());

  // ✅ ALL HOOKS AT THE TOP
  useEffect(() => {
    mark('route-renderer-mounted');
    console.log('[PERF] 🛣️ RouteRenderer mounted:', now().toFixed(2), 'ms');
  }, []);

  useEffect(() => {
    mark(`route-${location.pathname}-matched`);
    console.log('[PERF] 🛣️ Route matched:', location.pathname, 'at', now().toFixed(2), 'ms');

    // Mark component load after a small delay (allows Suspense to resolve)
    const timeout = setTimeout(() => {
      if (!componentLoadedRef.current.has(location.pathname)) {
        mark(`route-${location.pathname}-loaded`);
        console.log('[PERF] ✅ Route component loaded:', location.pathname, 'at', now().toFixed(2), 'ms');
        componentLoadedRef.current.add(location.pathname);
      }
    }, 50);

    return () => clearTimeout(timeout);
  }, [location.pathname]);

  return (
    <Routes>
      {routeConfig.map((route) => {
        const Component = route.component;
        const Skeleton = route.skeleton;

        // ✅ Simple component rendering without inline wrapper functions
        const routeElement = route.protected ? (
          <ProtectedRoute>
            <Component />
          </ProtectedRoute>
        ) : (
          <Component />
        );

        return (
          <Route
            key={route.path}
            path={route.path}
            element={
              <Suspense fallback={Skeleton ? <Skeleton /> : <div>Loading...</div>}>
                {routeElement}
              </Suspense>
            }
          />
        );
      })}
    </Routes>
  );
}
```

**Key Changes:**
- ✅ Removed inline `ComponentWrapper` and `SuspenseWrapper` components
- ✅ All hooks moved to **RouteRenderer top level**
- ✅ Simplified approach using `location.pathname` tracking
- ✅ Timeout-based component load tracking (simpler, no component wrappers)
- ✅ useRef to prevent duplicate logging

---

## 📋 Rules of Hooks Summary

To prevent similar issues in the future, always follow these rules:

### **1. Only Call Hooks at the Top Level**
```typescript
// ✅ CORRECT
function Component() {
  const [state, setState] = useState(0);
  useEffect(() => { /* ... */ }, []);

  if (condition) return <div>Early return is OK now</div>;
  // ...
}

// ❌ WRONG
function Component() {
  if (condition) return <div>Early return</div>;

  const [state, setState] = useState(0);  // ❌ Hook after return
}
```

### **2. Only Call Hooks from React Functions**
```typescript
// ✅ CORRECT - Component defined outside
const Wrapper = ({ children }) => {
  useEffect(() => { /* ... */ }, []);
  return <>{children}</>;
};

function Parent() {
  return <Wrapper>...</Wrapper>;
}

// ❌ WRONG - Component defined inside render
function Parent() {
  const Wrapper = ({ children }) => {  // ❌ New component each render
    useEffect(() => { /* ... */ }, []);
    return <>{children}</>;
  };

  return <Wrapper>...</Wrapper>;
}
```

### **3. Don't Call Hooks Conditionally**
```typescript
// ✅ CORRECT - Conditional logic inside effect
useEffect(() => {
  if (condition) {
    doSomething();
  }
}, [condition]);

// ❌ WRONG - Conditional hook call
if (condition) {
  useEffect(() => {  // ❌ Hook might not be called every render
    doSomething();
  }, []);
}
```

### **4. Same Number of Hooks Every Render**
```typescript
// ✅ CORRECT - Always call all hooks
function Component({ showExtra }) {
  const [count, setCount] = useState(0);
  const [extra, setExtra] = useState(0);  // Always called

  useEffect(() => {
    if (showExtra) {
      // Conditional logic inside
    }
  }, [showExtra]);
}

// ❌ WRONG - Different number of hooks
function Component({ showExtra }) {
  const [count, setCount] = useState(0);

  if (showExtra) {
    const [extra, setExtra] = useState(0);  // ❌ Conditional hook
  }
}
```

---

## 🧪 Testing the Fix

1. **Build verification:**
   ```bash
   npm run build:dev
   ```
   **Result:** ✅ Build successful (no errors)

2. **Runtime verification:**
   ```bash
   npm run dev
   ```
   **Result:** ✅ No React Error #310

3. **Performance logging verification:**
   - Open browser console
   - Check for `[PERF]` logs
   - Verify comprehensive report after 2 seconds
   **Result:** ✅ All performance logs working correctly

---

## 📊 Impact Summary

### **Before Fix:**
- ❌ React Error #310 on every page load
- ❌ Application crashes/unstable
- ❌ Performance logging broken
- ❌ User experience severely degraded

### **After Fix:**
- ✅ No React errors
- ✅ Application stable
- ✅ Performance logging functional
- ✅ Zero production overhead (dev-only)
- ✅ Clean console output

---

## 🎓 Lessons Learned

1. **Rules of Hooks are CRITICAL** - Violating them causes hard-to-debug errors
2. **Hooks at Top** - Always call all hooks before any conditional returns
3. **Component Definition Location** - Never define components inside render functions
4. **Conditional Logic Inside Effects** - Put conditions inside effects, not around them
5. **Simplicity First** - Avoid complex wrapper patterns when simpler solutions exist

---

## 🚀 Performance Logging Now Ready

The performance logging system is now **fully functional and safe**:

- ✅ Comprehensive initialization timeline tracking
- ✅ Bottleneck detection and reporting
- ✅ Web Vitals monitoring
- ✅ Resource loading analysis
- ✅ **Zero React errors**
- ✅ **Rules of Hooks compliant**
- ✅ Production-safe (dev-only code)

Start dev server to see the performance logs:
```bash
npm run dev
# Open browser console
# Wait for comprehensive report after page load
```

---

**Fixed:** 2025-10-27
**Files Modified:**
- `src/components/ProtectedRoute.tsx`
- `src/components/RouteRenderer.tsx`

**Build Status:** ✅ Successful
**Runtime Status:** ✅ Stable
**Performance Logging:** ✅ Operational
