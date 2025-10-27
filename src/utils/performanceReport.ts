/**
 * Performance Report Generator
 *
 * Generates comprehensive performance reports with bottleneck identification
 * and optimization recommendations.
 */

import { getPerformanceData } from './performance';

interface BottleneckInfo {
  name: string;
  duration: number;
  type: 'critical' | 'warning' | 'info';
  recommendation?: string;
}

/**
 * Generate and display a comprehensive performance report
 */
export const generatePerformanceReport = (): void => {
  if (!import.meta.env.DEV) return;

  const data = getPerformanceData();
  const { marks, measures, resources, webVitals } = data;

  console.log('\n\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 PERFORMANCE REPORT - Initial Page Load Analysis');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // === TIMELINE ===
  console.log('\n⏱️  INITIALIZATION TIMELINE\n');

  if (marks.length > 0) {
    marks.forEach((mark, index) => {
      const delta = index > 0 ? mark.timestamp - marks[index - 1].timestamp : mark.timestamp;
      const icon = getTimelineIcon(mark.name);
      console.log(`  ${icon} ${mark.name.padEnd(40)} ${mark.timestamp.toFixed(2)}ms (+${delta.toFixed(2)}ms)`);
    });
  } else {
    console.log('  No timeline data available');
  }

  // === BOTTLENECKS ===
  console.log('\n\n⚠️  BOTTLENECK ANALYSIS\n');

  const bottlenecks = identifyBottlenecks(measures);

  if (bottlenecks.length > 0) {
    // Group by severity
    const critical = bottlenecks.filter(b => b.type === 'critical');
    const warnings = bottlenecks.filter(b => b.type === 'warning');

    if (critical.length > 0) {
      console.log('  🔴 CRITICAL (>100ms):');
      critical.forEach((b, i) => {
        console.log(`    ${i + 1}. ${b.name}: ${b.duration.toFixed(2)}ms`);
        if (b.recommendation) {
          console.log(`       💡 ${b.recommendation}`);
        }
      });
    }

    if (warnings.length > 0) {
      console.log('\n  🟡 WARNINGS (50-100ms):');
      warnings.forEach((b, i) => {
        console.log(`    ${i + 1}. ${b.name}: ${b.duration.toFixed(2)}ms`);
        if (b.recommendation) {
          console.log(`       💡 ${b.recommendation}`);
        }
      });
    }
  } else {
    console.log('  ✅ No significant bottlenecks detected!');
  }

  // === WEB VITALS ===
  console.log('\n\n🎯 WEB VITALS\n');

  const vitalsEntries = Object.entries(webVitals);
  if (vitalsEntries.length > 0) {
    vitalsEntries.forEach(([metric, value]) => {
      const assessment = assessWebVital(metric, value);
      console.log(`  ${assessment.icon} ${metric}: ${value.toFixed(2)}ms ${assessment.label}`);
    });
  } else {
    console.log('  Web Vitals data not yet available (check again after interaction)');
  }

  // === RESOURCE SUMMARY ===
  console.log('\n\n📦 RESOURCE LOADING SUMMARY\n');

  if (resources.length > 0) {
    const byType = groupResourcesByType(resources);

    Object.entries(byType).forEach(([type, items]) => {
      const totalSize = items.reduce((sum, r) => sum + (r.transferSize || 0), 0);
      const avgDuration = items.reduce((sum, r) => sum + r.duration, 0) / items.length;

      console.log(`  ${getResourceIcon(type)} ${type.padEnd(15)} ${items.length.toString().padStart(3)} files, ${(totalSize / 1024).toFixed(1).padStart(7)}KB, avg ${avgDuration.toFixed(0)}ms`);
    });

    // Total
    const totalSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    console.log(`\n  📊 Total Resources: ${resources.length} files, ${(totalSize / 1024).toFixed(2)}KB transferred`);
  } else {
    console.log('  No resource data available');
  }

  // === RECOMMENDATIONS ===
  console.log('\n\n💡 OPTIMIZATION RECOMMENDATIONS\n');

  const recommendations = generateRecommendations(bottlenecks, resources, webVitals);

  if (recommendations.length > 0) {
    recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });
  } else {
    console.log('  ✅ Performance looks good! No major optimizations needed.');
  }

  // === SUMMARY ===
  console.log('\n\n📈 PERFORMANCE SUMMARY\n');

  const totalTime = marks.length > 0 ? marks[marks.length - 1].timestamp : 0;
  const grade = getPerformanceGrade(totalTime, bottlenecks.length);

  console.log(`  Total Time to Interactive: ${totalTime.toFixed(2)}ms`);
  console.log(`  Performance Grade: ${grade.icon} ${grade.label} (${grade.score}/100)`);
  console.log(`  Critical Issues: ${bottlenecks.filter(b => b.type === 'critical').length}`);
  console.log(`  Warnings: ${bottlenecks.filter(b => b.type === 'warning').length}`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n\n');
};

/**
 * Identify bottlenecks from measures
 */
function identifyBottlenecks(measures: Array<{ name: string; duration: number }>): BottleneckInfo[] {
  return measures
    .map(m => {
      const type: 'critical' | 'warning' | 'info' = m.duration > 100 ? 'critical' : m.duration > 50 ? 'warning' : 'info';
      const recommendation = getRecommendation(m.name, m.duration);

      return {
        name: m.name,
        duration: m.duration,
        type,
        recommendation,
      };
    })
    .filter(b => b.type !== 'info')
    .sort((a, b) => b.duration - a.duration);
}

/**
 * Get optimization recommendation for specific operations
 */
function getRecommendation(name: string, duration: number): string | undefined {
  const lowerName = name.toLowerCase();

  if (lowerName.includes('profile') && lowerName.includes('fetch')) {
    return 'Consider caching profile data or using optimistic UI';
  }

  if (lowerName.includes('subscription') && lowerName.includes('fetch')) {
    return 'Subscription fetch can be deferred further or loaded on-demand';
  }

  if (lowerName.includes('lazy') && lowerName.includes('load')) {
    return 'Consider preloading critical routes or reducing bundle size';
  }

  if (lowerName.includes('session') && lowerName.includes('check')) {
    return 'Session check is network-bound - consider local storage cache';
  }

  if (lowerName.includes('font')) {
    return 'Use font-display: swap or reduce font weights';
  }

  if (lowerName.includes('bundle') || lowerName.includes('parse')) {
    return 'Consider code splitting or tree shaking unused dependencies';
  }

  return undefined;
}

/**
 * Generate optimization recommendations
 */
function generateRecommendations(
  bottlenecks: BottleneckInfo[],
  resources: PerformanceResourceTiming[],
  webVitals: Record<string, number>
): string[] {
  const recs: string[] = [];

  // Check for slow network requests
  const slowRequests = resources.filter(r => r.duration > 200);
  if (slowRequests.length > 0) {
    recs.push(`${slowRequests.length} network requests took >200ms - consider caching or CDN`);
  }

  // Check for large bundles
  const largeScripts = resources.filter(r => r.initiatorType === 'script' && r.transferSize > 100000);
  if (largeScripts.length > 0) {
    recs.push(`${largeScripts.length} JavaScript bundles >100KB - consider code splitting`);
  }

  // Check FCP
  if (webVitals.FCP && webVitals.FCP > 1800) {
    recs.push('First Contentful Paint is slow (>1.8s) - optimize critical rendering path');
  }

  // Check LCP
  if (webVitals.LCP && webVitals.LCP > 2500) {
    recs.push('Largest Contentful Paint is slow (>2.5s) - optimize largest element loading');
  }

  // Check for provider cascade
  const providerMeasures = bottlenecks.filter(b => b.name.toLowerCase().includes('provider'));
  if (providerMeasures.length > 5) {
    recs.push('Many providers detected - consider combining contexts or lazy initialization');
  }

  // Generic recommendations based on total time
  const criticalCount = bottlenecks.filter(b => b.type === 'critical').length;
  if (criticalCount > 3) {
    recs.push('Multiple critical bottlenecks - prioritize addressing slowest operations first');
  }

  return recs;
}

/**
 * Group resources by type
 */
function groupResourcesByType(resources: PerformanceResourceTiming[]): Record<string, PerformanceResourceTiming[]> {
  const byType: Record<string, PerformanceResourceTiming[]> = {};

  resources.forEach(resource => {
    const type = resource.initiatorType || 'other';
    if (!byType[type]) byType[type] = [];
    byType[type].push(resource);
  });

  return byType;
}

/**
 * Get icon for timeline events
 */
function getTimelineIcon(name: string): string {
  const lowerName = name.toLowerCase();

  if (lowerName.includes('html') || lowerName.includes('start')) return '🏁';
  if (lowerName.includes('react')) return '⚛️';
  if (lowerName.includes('query')) return '🔍';
  if (lowerName.includes('provider')) return '📦';
  if (lowerName.includes('auth')) return '🔐';
  if (lowerName.includes('route')) return '🛣️';
  if (lowerName.includes('lazy')) return '📂';
  if (lowerName.includes('session')) return '🎫';
  if (lowerName.includes('profile')) return '👤';
  if (lowerName.includes('subscription')) return '💳';
  if (lowerName.includes('font')) return '🔤';
  if (lowerName.includes('paint')) return '🎨';
  if (lowerName.includes('interactive')) return '✨';
  if (lowerName.includes('end') || lowerName.includes('complete')) return '✅';

  return '📍';
}

/**
 * Get icon for resource types
 */
function getResourceIcon(type: string): string {
  switch (type) {
    case 'script': return '📜';
    case 'stylesheet': return '🎨';
    case 'img': return '🖼️';
    case 'font': return '🔤';
    case 'fetch': return '🌐';
    case 'xmlhttprequest': return '📡';
    default: return '📄';
  }
}

/**
 * Assess Web Vital value
 */
function assessWebVital(metric: string, value: number): { icon: string; label: string } {
  switch (metric) {
    case 'FCP':
      if (value < 1800) return { icon: '✅', label: '(Good)' };
      if (value < 3000) return { icon: '🟡', label: '(Needs Improvement)' };
      return { icon: '🔴', label: '(Poor)' };

    case 'LCP':
      if (value < 2500) return { icon: '✅', label: '(Good)' };
      if (value < 4000) return { icon: '🟡', label: '(Needs Improvement)' };
      return { icon: '🔴', label: '(Poor)' };

    case 'FID':
      if (value < 100) return { icon: '✅', label: '(Good)' };
      if (value < 300) return { icon: '🟡', label: '(Needs Improvement)' };
      return { icon: '🔴', label: '(Poor)' };

    case 'CLS':
      if (value < 0.1) return { icon: '✅', label: '(Good)' };
      if (value < 0.25) return { icon: '🟡', label: '(Needs Improvement)' };
      return { icon: '🔴', label: '(Poor)' };

    case 'TTFB':
      if (value < 800) return { icon: '✅', label: '(Good)' };
      if (value < 1800) return { icon: '🟡', label: '(Needs Improvement)' };
      return { icon: '🔴', label: '(Poor)' };

    default:
      return { icon: 'ℹ️', label: '' };
  }
}

/**
 * Calculate performance grade
 */
function getPerformanceGrade(totalTime: number, bottleneckCount: number): { icon: string; label: string; score: number } {
  let score = 100;

  // Deduct for total time
  if (totalTime > 3000) score -= 30;
  else if (totalTime > 2000) score -= 20;
  else if (totalTime > 1000) score -= 10;

  // Deduct for bottlenecks
  score -= bottleneckCount * 5;

  score = Math.max(0, score);

  if (score >= 90) return { icon: '🏆', label: 'Excellent', score };
  if (score >= 75) return { icon: '✅', label: 'Good', score };
  if (score >= 60) return { icon: '🟡', label: 'Fair', score };
  if (score >= 40) return { icon: '🟠', label: 'Poor', score };
  return { icon: '🔴', label: 'Critical', score };
}
