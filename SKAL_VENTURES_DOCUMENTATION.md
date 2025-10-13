# Skal Ventures - Technical Documentation

**Project:** Landing page for Skal Ventures investment platform
**Built with:** v0.app → Next.js 15 → React 19 → TypeScript
**Repository:** Auto-synced from [v0.app](https://v0.app)
**Deployment:** Vercel

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Architecture](#project-architecture)
4. [Component Inventory](#component-inventory)
5. [3D Graphics System](#3d-graphics-system)
6. [Shader Documentation](#shader-documentation)
7. [UI Components](#ui-components)
8. [Styling System](#styling-system)
9. [Development Setup](#development-setup)
10. [Build & Deployment](#build--deployment)

---

## 🎯 Overview

Skal Ventures is a sophisticated landing page featuring an immersive 3D particle system background. The site showcases investment strategies with a premium, tech-forward aesthetic.

### Key Features
- 🌌 GPU-accelerated 3D particle system with custom shaders
- ⚡ Interactive hover effects with smooth transitions
- 📱 Fully responsive design (mobile, tablet, desktop)
- 🎨 Custom design system with premium typography
- 🔧 Built-in development controls (Leva debug panel)

### Business Context
**Tagline:** "Investment strategies that outperform the market"
**Target:** Investors seeking perpetual investment strategies
**Navigation:** About, Portfolio, Insights, Contact, Sign In

---

## 🛠️ Tech Stack

### Core Framework
- **Next.js 15.2.4** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript 5** - Type-safe development

### 3D Graphics
- **Three.js (latest)** - WebGL 3D library
- **@react-three/fiber (latest)** - React renderer for Three.js
- **@react-three/drei (latest)** - Useful helpers for R3F
- **r3f-perf (latest)** - Performance monitoring
- **leva (latest)** - GUI controls for debugging
- **maath (latest)** - Math utilities and easing

### UI Components
- **shadcn/ui** - Component library built on Radix UI
- **Radix UI** - 30+ accessible primitives
  - Dialog, Dropdown, Navigation, Tooltip, and more
- **Lucide React 0.454.0** - Icon library
- **cmdk 1.0.4** - Command palette
- **Vaul 0.9.9** - Drawer component

### Styling
- **Tailwind CSS 4.1.9** - Utility-first CSS
- **@tailwindcss/postcss 4.1.9** - PostCSS integration
- **tailwindcss-animate 1.0.7** - Animation utilities
- **class-variance-authority 0.7.1** - Component variants
- **clsx 2.1.1** - Conditional classnames
- **tailwind-merge 2.5.5** - Merge Tailwind classes

### Typography
- **Geist Mono** - Monospace font by Vercel
- **Sentient** - Custom serif font (Extralight, Light Italic)

### Development
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **@vercel/analytics 1.3.1** - Analytics integration

---

## 🏗️ Project Architecture

```
archive/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with Header
│   ├── page.tsx                 # Home page (Hero + Leva)
│   └── globals.css              # Global styles and theme
│
├── components/                   # React components
│   ├── gl/                      # 3D graphics components
│   │   ├── index.tsx           # Main GL canvas setup
│   │   ├── particles.tsx       # Particle system component
│   │   └── shaders/            # Custom GLSL shaders
│   │       ├── pointMaterial.ts        # Particle rendering shader
│   │       ├── simulationMaterial.ts   # Physics simulation shader
│   │       ├── vignetteShader.ts       # Post-processing effect
│   │       └── utils.ts                # Shader utilities (periodic noise)
│   │
│   ├── ui/                      # shadcn/ui components (58 components)
│   │   ├── button.tsx          # Button variants
│   │   ├── dialog.tsx          # Modal dialogs
│   │   ├── card.tsx            # Card layouts
│   │   └── ... (55 more)
│   │
│   ├── header.tsx              # Site header with navigation
│   ├── hero.tsx                # Hero section with CTA
│   ├── logo.tsx                # Skal Ventures SVG logo
│   ├── pill.tsx                # Badge component with custom clip-path
│   ├── mobile-menu.tsx         # Mobile navigation drawer
│   ├── theme-provider.tsx      # Theme context provider
│   └── utils.ts                # Utility functions (px converter)
│
├── lib/                         # Utilities
│   └── utils.ts                # cn() helper for classnames
│
├── hooks/                       # Custom React hooks
│
├── styles/                      # Additional styles
│   └── globals.css             # Legacy styles
│
├── public/                      # Static assets
│   ├── Sentient-Extralight.woff
│   └── Sentient-LightItalic.woff
│
├── components.json              # shadcn/ui configuration
├── next.config.ts              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.ts          # (if exists)
├── postcss.config.mjs          # PostCSS configuration
└── package.json                # Dependencies
```

---

## 📦 Component Inventory

### Layout Components

#### Header
**File:** `components/header.tsx:5`

Fixed header with responsive navigation.

**Features:**
- Fixed positioning with responsive padding
- Desktop navigation (About, Portfolio, Insights, Contact)
- Sign In link
- Mobile menu toggle
- Logo component integration

**Layout:**
- Desktop: Logo (left) → Nav (center) → Sign In (right)
- Mobile: Logo (left) → Hamburger menu (right)

#### Hero
**File:** `components/hero.tsx:9`

Main landing section with CTA and 3D background.

**Features:**
- Full viewport height (`h-svh`)
- BETA RELEASE pill badge
- Headline: "Unlock your future growth"
- Subheading with value proposition
- Contact Us CTA button (responsive sizing)
- Hover state management for particle effects
- Integration with GL component

#### Logo
**File:** `components/logo.tsx:1`

SVG logo component for Skal Ventures brand.

**Features:**
- Responsive sizing via props
- Two-part design (icon + wordmark)
- White fill for dark backgrounds

### Custom Components

#### Pill
**File:** `components/pill.tsx:4`

Custom badge component with octagonal clip-path.

**Features:**
- Frosted glass effect (`backdrop-blur-xs`)
- Border with angled corners (clip-path polygon)
- Glowing indicator dot (shadow-glow)
- Custom CSS properties for geometry
- Monospace font styling

**CSS Variables:**
- `--poly-roundness`: Corner size (6px)
- `--h`: Hypotenuse calculation
- `--hh`: Half hypotenuse offset

#### Mobile Menu
**File:** `components/mobile-menu.tsx:13`

Full-screen mobile navigation drawer.

**Features:**
- Radix UI Dialog primitive
- Backdrop blur overlay
- Menu/X icon toggle
- Navigation links (About, Portfolio, Insights, Contact)
- Sign In link
- Auto-close on link click
- Prevents outside interaction

### 3D Graphics Components

#### GL (Main Canvas)
**File:** `components/gl/index.tsx:8`

React Three Fiber canvas setup with controls.

**Features:**
- Fixed viewport canvas (`#webgl`)
- Camera configuration (FOV 50, custom position)
- Black background
- Leva debug controls (particle system parameters)
- Post-processing effects (vignette)
- Performance monitoring (commented out)

**Leva Controls:**
- `speed`: Animation speed (0-2)
- `noiseScale`: Noise frequency (0.1-5)
- `noiseIntensity`: Distortion strength (0-2)
- `timeScale`: Time multiplier (0-2)
- `focus`: DOF focus distance (0.1-20)
- `aperture`: Blur amount (0-2)
- `pointSize`: Particle size (0.1-10)
- `opacity`: Particle opacity (0-1)
- `planeScale`: Grid size (0.1-10)
- `size`: Simulation texture resolution (256/512/1024)
- `vignetteDarkness`: Vignette strength (0-2)
- `vignetteOffset`: Vignette size (0-2)
- `useManualTime`: Manual time control
- `manualTime`: Time scrubbing (0-50)

#### Particles
**File:** `components/gl/particles.tsx:10`

GPU particle system with custom shaders.

**Core Features:**
- FBO (Frame Buffer Object) for GPU simulation
- Dual render targets (simulation + display)
- Orthographic camera for simulation
- Point cloud rendering
- Reveal animation on page load (3.5s duration)
- Hover state transition (`introspect` prop)

**Technical Details:**
- Size: 512x512 grid = 262,144 particles
- Float32 textures for position data
- Nearest neighbor filtering
- Custom materials (simulation + rendering)

**Animation System:**
1. **Reveal Animation**
   - Duration: 3.5 seconds
   - Easing: Cubic ease-out
   - Effect: Radial expansion from center
   - Factor: 0 (hidden) → 4.0 (revealed)

2. **Hover Transition**
   - Property: `uTransition` uniform
   - Easing: Smooth damping (maath/easing)
   - Speed: 0.35 (in) / 0.2 (out)
   - Effect: Changes particle behavior/appearance

**Uniforms Management:**
- Time: Continuous or manual
- Noise: Scale, intensity, time scale
- DOF: Focus distance, blur amount
- Rendering: Point size, opacity
- Reveal: Factor, progress

### shadcn/ui Components

The project includes 58 shadcn/ui components in `components/ui/`:

**Form Components:**
- `button.tsx`, `input.tsx`, `textarea.tsx`, `label.tsx`
- `checkbox.tsx`, `radio-group.tsx`, `switch.tsx`, `slider.tsx`
- `select.tsx`, `calendar.tsx`, `input-otp.tsx`
- `form.tsx` (React Hook Form integration)

**Layout Components:**
- `card.tsx`, `separator.tsx`, `aspect-ratio.tsx`
- `resizable.tsx`, `scroll-area.tsx`
- `sidebar.tsx`, `sheet.tsx`, `drawer.tsx`

**Navigation Components:**
- `navigation-menu.tsx`, `menubar.tsx`, `breadcrumb.tsx`
- `tabs.tsx`, `pagination.tsx`, `command.tsx`

**Overlay Components:**
- `dialog.tsx`, `alert-dialog.tsx`, `sheet.tsx`, `drawer.tsx`
- `popover.tsx`, `dropdown-menu.tsx`, `context-menu.tsx`
- `hover-card.tsx`, `tooltip.tsx`

**Feedback Components:**
- `alert.tsx`, `toast.tsx`, `toaster.tsx`, `sonner.tsx`
- `progress.tsx`, `skeleton.tsx`, `spinner.tsx`, `badge.tsx`

**Data Display:**
- `table.tsx`, `chart.tsx`, `carousel.tsx`, `avatar.tsx`
- `empty.tsx`, `item.tsx`

**Utility Components:**
- `toggle.tsx`, `toggle-group.tsx`, `accordion.tsx`, `collapsible.tsx`
- `button-group.tsx`, `input-group.tsx`, `field.tsx`, `kbd.tsx`
- `use-toast.ts`, `use-mobile.tsx`

---

## 🌌 3D Graphics System

### Architecture Overview

The particle system uses a dual-shader architecture:

1. **Simulation Shader** (GPU-based physics)
   - Runs on FBO (off-screen rendering)
   - Updates particle positions each frame
   - Applies periodic noise for organic motion
   - Reads from initial positions texture

2. **Render Shader** (Display)
   - Reads positions from simulation FBO
   - Applies depth-of-field blur
   - Sparkle effects for visual interest
   - Reveal animation masking
   - Opacity and size calculations

### Data Flow

```
Initial Positions Texture (512x512 RGBA)
    ↓
Simulation Material (Fragment Shader)
    → Applies periodic noise distortion
    → Outputs to FBO
    ↓
Frame Buffer Object (512x512 Float)
    ↓
Point Material (Vertex/Fragment Shader)
    → Reads particle positions from FBO
    → Applies DOF, sparkle, reveal effects
    → Renders to screen
```

### Particle Grid Generation

**File:** `components/gl/shaders/simulationMaterial.ts:5`

The `getPlane()` function generates a 512×512 grid of particles:

```typescript
function getPlane(count: number, components: number, size: number, scale: number)
```

**Parameters:**
- `count`: 262,144 (512 × 512)
- `components`: 4 (RGBA channels)
- `size`: 512 (grid resolution)
- `scale`: 10.0 (spatial extent)

**Output:**
- Float32Array with XYZW positions
- X/Z: Grid coordinates scaled to [-10, 10]
- Y: 0 (flat plane)
- W: 1.0 (alpha channel)

### Performance Considerations

- **GPU Acceleration:** All position updates on GPU
- **Texture Resolution:** 512×512 balance between quality and performance
- **Point Rendering:** Hardware-accelerated point primitives
- **Minimal CPU Work:** Only uniform updates per frame
- **Optimized Shaders:** Efficient GLSL with minimal branching

---

## 🎨 Shader Documentation

### 1. Simulation Material

**File:** `components/gl/shaders/simulationMaterial.ts:26`

**Purpose:** GPU-based particle physics simulation

**Vertex Shader:**
- Pass-through shader
- Maps UV coordinates

**Fragment Shader:**
```glsl
// Inputs
uniform sampler2D positions;    // Initial positions
uniform float uTime;            // Animation time
uniform float uNoiseScale;      // Noise frequency
uniform float uNoiseIntensity;  // Distortion strength
uniform float uTimeScale;       // Time multiplier
uniform float uLoopPeriod;      // Loop duration (24s)

// Process
1. Read original position from texture
2. Calculate continuous time with period (2π / 24)
3. Generate periodic noise for X/Y/Z axes (phase-shifted)
4. Apply distortion to original position
5. Output final position to FBO
```

**Noise Function:**
- Uses `periodicNoise()` utility
- Phase offsets: 0°, 120°, 240° for X/Y/Z
- Ensures smooth, infinite looping animation

**Default Values:**
- `uNoiseScale`: 1.0
- `uNoiseIntensity`: 0.5
- `uTimeScale`: 1.0
- `uLoopPeriod`: 24.0

### 2. Point Material (DOF)

**File:** `components/gl/shaders/pointMaterial.ts:4`

**Purpose:** Particle rendering with depth-of-field and effects

**Vertex Shader:**
```glsl
// Inputs
uniform sampler2D positions;         // Simulated positions
uniform sampler2D initialPositions;  // Original positions
uniform float uTime;
uniform float uFocus;                // DOF focus distance
uniform float uBlur;                 // DOF blur amount
uniform float uPointSize;            // Base point size

// Outputs
varying float vDistance;             // Distance from focus
varying float vPosY;                 // Y position
varying vec3 vWorldPosition;         // Current position
varying vec3 vInitialPosition;       // Original position

// Process
1. Sample position from simulation texture
2. Transform to view/projection space
3. Calculate distance from focus plane
4. Set point size based on distance and blur
5. Pass varyings to fragment shader
```

**Fragment Shader:**
```glsl
// Inputs
uniform float uOpacity;
uniform float uRevealFactor;         // Reveal animation radius
uniform float uRevealProgress;       // Reveal animation progress (0-1)
uniform float uTransition;           // Hover state (0-1)

// Features
1. Circular point shape (SDF circle)
2. Distance-based reveal mask (radial from center)
3. Noise-based organic reveal edges
4. Sparkle brightness variation
5. DOF-based opacity
6. Y-position fade (hide bottom particles)
```

**Sparkle System:**
- Per-particle seed using initial position
- Multi-frequency sine waves for variation
- Sparse distribution (~30% particles sparkle)
- Exponential peaks (pow 4) for dramatic highlights
- Brightness range: 0.7 to 2.0

**Reveal Effect:**
- Start: Center (factor = 0)
- End: Outer radius (factor = 4.0)
- Edge: Smooth with noise (0.3 variation)
- Easing: Cubic ease-out
- Duration: 3.5 seconds

### 3. Vignette Shader

**File:** `components/gl/shaders/vignetteShader.ts:1`

**Purpose:** Post-processing effect to darken edges

**Uniforms:**
- `tDiffuse`: Input texture from previous pass
- `darkness`: Vignette strength (default: 1.0)
- `offset`: Vignette size (default: 1.0)

**Algorithm:**
```glsl
1. Calculate distance from center (dot product)
2. Create smooth falloff with smoothstep
3. Multiply RGB by vignette factor
4. Preserve alpha channel
```

**Effect:**
- Darkens edges while preserving center
- Smooth gradient transition
- No color shift (multiplicative)

### 4. Shader Utilities

**File:** `components/gl/shaders/utils.ts:3`

**periodicNoise(vec3 p, float time)**

Multi-frequency periodic noise for organic motion.

**Features:**
- Perfect 2π periodicity (infinite loop)
- Four wave components at different frequencies
- Phase offsets for complexity
- Controlled amplitude (×0.3)

**Wave Breakdown:**
1. **Primary:** `sin(p.x*2 + time) * cos(p.z*1.5 + time)`
   - Period: 2π
   - Amplitude: 1.0

2. **Secondary:** `sin(p.x*3.2 + time*2) * cos(p.z*2.1 + time)`
   - Period: π
   - Amplitude: 0.6

3. **Tertiary:** `sin(p.x*1.7 + time) * cos(p.z*2.8 + time*3)`
   - Period: 2π/3
   - Amplitude: 0.4

4. **Cross-frequency:** `sin(p.x*p.z*0.5 + time*2)`
   - Period: π
   - Amplitude: 0.3

**Use Cases:**
- Particle position distortion
- Reveal edge noise
- Any time-based organic variation

---

## 🎨 Styling System

### Color Palette

**File:** `app/globals.css:19`

```css
:root {
  --background: #000000;        /* Pure black */
  --foreground: #ffffff;        /* Pure white */
  --primary: #FFC700;          /* Golden yellow */
  --primary-foreground: #ffffff;
  --border: #424242;           /* Medium gray */
}
```

**Theme Application:**
- Background: Black for immersive 3D experience
- Foreground: White for high contrast text
- Primary: Gold for CTAs and accents
- Border: Subtle gray for UI elements

### Typography

**Fonts:**
1. **Sentient** - Custom serif font
   - Extralight (200) for headlines
   - Light Italic (300) for emphasis
   - Usage: `.font-sentient` utility class
   - Files: `/public/Sentient-*.woff`

2. **Geist Mono** - Vercel's monospace font
   - Usage: `.font-mono` or `font-mono` class
   - Variable: `--font-geist-mono`
   - Applied: Navigation, badges, body text

**Type Scale:**
- Hero H1: `text-5xl sm:text-6xl md:text-7xl` (48px → 60px → 72px)
- Body: `text-sm sm:text-base` (14px → 16px)
- Subtext: `text-foreground/60` (60% opacity)

### Tailwind Configuration

**Style:** New York (shadcn/ui)
**Base Color:** Neutral
**CSS Variables:** Enabled
**Icon Library:** Lucide

**Custom Utilities:**
```css
@utility container {
  margin-inline: auto;
  padding-inline: 1rem;     /* Mobile */

  @media (width >= 768px) {
    padding-inline: 2rem;   /* Tablet */
  }

  @media (width >= 1280px) {
    padding-inline: 3rem;   /* Desktop */
  }
}
```

**Custom Theme Extensions:**
```css
@theme inline {
  --font-mono: var(--font-geist-mono);
  --font-sentient: 'Sentient', sans-serif;
  --shadow-glow: 0 0 8px 2px var(--tw-shadow-color);
}
```

### Responsive Breakpoints

Following Tailwind defaults:
- `sm`: 640px (mobile landscape, small tablets)
- `md`: 768px (tablets)
- `lg`: 1024px (small desktops, hide mobile menu)
- `xl`: 1280px (desktops)
- `2xl`: 1536px (large desktops)

### Component Styling Patterns

**Glass Morphism:**
```tsx
className="bg-[#262626]/50 backdrop-blur-xs border border-border"
```

**Hover States:**
```tsx
className="hover:text-foreground/100 transition-colors ease-out duration-150"
```

**Fixed Positioning:**
```tsx
className="fixed z-50 pt-8 md:pt-14 top-0 left-0 w-full"
```

**Glow Effects:**
```tsx
className="shadow-glow shadow-primary/50"
```

---

## 💻 Development Setup

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- Modern browser with WebGL 2.0 support

### Installation

```bash
# Navigate to project
cd archive

# Install dependencies
npm install
# or
pnpm install
# or
bun install

# Start development server
npm run dev
# → http://localhost:3000
```

### Development Scripts

**File:** `package.json:5`

```json
{
  "dev": "next dev",        // Start dev server with HMR
  "build": "next build",    // Production build
  "start": "next start",    // Production server
  "lint": "next lint"       // ESLint checks
}
```

### Environment Setup

No environment variables required for basic functionality.

Optional (if analytics enabled):
```env
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_id
```

### Debug Controls

**Leva Panel:**
- Hidden by default: `<Leva hidden />`
- To enable: Remove `hidden` prop in `app/page.tsx:10`
- Access: Appears in top-right corner
- Controls: All particle system parameters in real-time

**Performance Monitoring:**
- Component: `<Perf position="top-left" />`
- Status: Commented out in `components/gl/index.tsx:56`
- Enable: Uncomment to see FPS, drawcalls, memory

### Hot Reload

Next.js Fast Refresh enabled:
- React components: Instant updates
- CSS/Tailwind: Instant updates
- Shaders: Full page reload required
- Config files: Server restart required

### Browser DevTools

**Three.js Inspector:**
```javascript
// Add to browser console
window.__THREE__ = THREE;
```

**React DevTools:**
- Install extension
- View component tree
- Inspect hooks and props

---

## 🚀 Build & Deployment

### Production Build

```bash
npm run build
```

**Output:**
- Optimized static files in `.next/`
- Minified JavaScript bundles
- Compressed CSS
- Optimized images and fonts

**Build Optimizations:**
- Tree-shaking for unused code
- Code splitting by route
- Image optimization
- Font subsetting
- CSS purging

### Deployment to Vercel

**Automatic Deployment:**
1. Push to repository
2. Vercel detects Next.js project
3. Automatic build and deploy
4. Production URL provided

**Manual Deployment:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

**Environment Variables:**
Configure in Vercel dashboard:
- Project Settings → Environment Variables
- Add any required keys
- Redeploy to apply changes

### Build Configuration

**File:** `next.config.ts:1`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuration options here
};

export default nextConfig;
```

### Performance Checklist

**Frontend:**
- ✅ Static generation where possible
- ✅ Client-side rendering for 3D
- ✅ Code splitting by route
- ✅ Font optimization (next/font)
- ✅ Image optimization (next/image)

**3D Graphics:**
- ✅ GPU-accelerated rendering
- ✅ Efficient shader code
- ✅ Appropriate texture sizes
- ✅ Minimal draw calls
- ⚠️ Consider lower resolution on mobile

**Assets:**
- ✅ WOFF font format
- ✅ SVG logo (vector)
- ✅ Minimal dependencies
- ⚠️ Consider WebP images if added

### Optimization Tips

1. **Reduce Particle Count on Mobile:**
```typescript
const size = isMobile ? 256 : 512;
```

2. **Lazy Load 3D Components:**
```typescript
const GL = dynamic(() => import('./gl'), { ssr: false });
```

3. **Preload Critical Assets:**
```html
<link rel="preload" href="/Sentient-Extralight.woff" as="font" />
```

4. **Adjust Shader Complexity:**
- Lower sparkle calculations on mobile
- Reduce noise iterations
- Simplify DOF calculations

---

## 📊 Component Reference Matrix

| Component | File | Type | Props | Dependencies |
|-----------|------|------|-------|--------------|
| Header | `components/header.tsx:5` | Layout | None | Logo, MobileMenu |
| Hero | `components/hero.tsx:9` | Layout | None | GL, Pill, Button |
| Logo | `components/logo.tsx:1` | UI | SVGProps | None |
| Pill | `components/pill.tsx:4` | UI | children, className | utils |
| MobileMenu | `components/mobile-menu.tsx:13` | UI | className | Dialog, Link |
| GL | `components/gl/index.tsx:8` | 3D | hovering | Particles, Leva, Effects |
| Particles | `components/gl/particles.tsx:10` | 3D | 13 params | Materials, Shaders |
| Button | `components/ui/button.tsx` | UI | variant, size | CVA |

---

## 🔍 Code Patterns

### Import Aliases

**File:** `components.json:13`

```json
{
  "components": "@/components",
  "utils": "@/lib/utils",
  "ui": "@/components/ui",
  "lib": "@/lib",
  "hooks": "@/hooks"
}
```

### Utility Functions

**cn() - Class Merging:**
```typescript
import { cn } from "@/lib/utils";

className={cn("base-class", condition && "conditional-class", className)}
```

**px() - Pixel Converter:**
```typescript
import { px } from "@/components/utils";

style={{ "--size": px(10) }}  // → "10px"
```

### React Patterns

**Client Components:**
```typescript
"use client";  // Required for hooks, interactivity
```

**useState for Hover:**
```typescript
const [hovering, setHovering] = useState(false);
```

**useRef for Animation:**
```typescript
const revealStartTime = useRef<number | null>(null);
```

**useMemo for Heavy Computations:**
```typescript
const particles = useMemo(() => generateParticles(), [size]);
```

**useFrame for Animation Loop:**
```typescript
useFrame((state, delta) => {
  // Runs every frame at 60fps
});
```

---

## 🐛 Common Issues & Solutions

### Issue: 3D Canvas Not Rendering

**Symptoms:** Black screen, no particles

**Solutions:**
1. Check WebGL support: `about://gpu` in Chrome
2. Update graphics drivers
3. Disable hardware acceleration and re-enable
4. Check console for WebGL errors

### Issue: Performance Degradation

**Symptoms:** Low FPS, stuttering

**Solutions:**
1. Reduce particle count (lower `size` prop)
2. Simplify shader calculations
3. Disable debug panels (Leva, Perf)
4. Check background processes

### Issue: Shader Compilation Errors

**Symptoms:** Console errors mentioning shaders

**Solutions:**
1. Check GLSL syntax carefully
2. Ensure uniforms are defined
3. Verify varying variables match
4. Check texture sampling

### Issue: Hover Effect Not Working

**Symptoms:** No particle response on button hover

**Solutions:**
1. Verify `hovering` state is passed to GL
2. Check `introspect` prop in Particles
3. Verify `uTransition` uniform updates
4. Ensure button has hover events

---

## 📚 Additional Resources

### Documentation
- [Next.js 15 Docs](https://nextjs.org/docs)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [Three.js Manual](https://threejs.org/manual/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Shader Learning
- [The Book of Shaders](https://thebookofshaders.com/)
- [Shader Toy](https://www.shadertoy.com/)
- [WebGL Fundamentals](https://webglfundamentals.org/)

### v0.app
- [v0.app Documentation](https://v0.dev/docs)
- [Project URL](https://v0.app/chat/projects/7OBKdWwIbzR)

---

## 📝 Changelog

### v1.0 (Current)
- Initial landing page launch
- 3D particle system with custom shaders
- Responsive header and hero section
- Beta release badge
- Mobile menu implementation

---

## 🤝 Contributing

This project is auto-synced from v0.app. To make changes:

1. Visit [v0.app project](https://v0.app/chat/projects/7OBKdWwIbzR)
2. Make modifications in the v0 interface
3. Deploy changes
4. Changes automatically sync to repository

---

## 📜 License

**Generator:** v0.app
**Deployment:** Vercel

---

**Documentation Version:** 1.0
**Last Updated:** 2025-10-08
**Documented by:** Claude Code Assistant
