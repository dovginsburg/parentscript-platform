/**
 * Analytics tracking for ParentScript
 *
 * Privacy-first analytics:
 * - No personal data tracked
 * - No cross-site tracking
 * - Aggregated usage patterns only
 * - Opt-out respected
 *
 * Events tracked:
 * - Skill unlocks
 * - Practice logs
 * - In-the-Moment coach usage
 * - Crisis alert triggers (anonymized)
 */

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
}

class Analytics {
  private enabled: boolean;

  constructor() {
    // Check if user has opted out
    this.enabled = localStorage.getItem('analytics_opt_out') !== 'true';

    // Initialize analytics service (e.g., PostHog, Plausible, Mixpanel)
    if (this.enabled && import.meta.env.PROD) {
      this.init();
    }
  }

  private init() {
    // Initialize your analytics service here
    // Example with Plausible (privacy-friendly):
    if (window.plausible) {
      console.log('✓ Analytics initialized');
    }
  }

  identify(userId: string, _traits?: Record<string, any>) {
    if (!this.enabled) return;

    // Don't send any PII - only anonymized IDs
    // (userId intentionally unused — analytics is fully anonymous, see sendToBackend.)
    void userId;
    if (window.plausible) {
      // Plausible doesn't have identify, but you could use custom props
    }
  }

  track(event: string, properties?: Record<string, any>) {
    if (!this.enabled) return;

    console.log('[Analytics]', event, properties);

    // Send to analytics service
    if (window.plausible) {
      window.plausible(event, { props: properties });
    }

    // Also log to backend for aggregate analysis
    this.sendToBackend({ event, properties });
  }

  page(name: string, properties?: Record<string, any>) {
    if (!this.enabled) return;

    this.track('Page View', { page: name, ...properties });
  }

  private async sendToBackend(data: AnalyticsEvent) {
    try {
      await fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          timestamp: new Date().toISOString(),
          // No user ID sent - fully anonymous
        }),
      });
    } catch (error) {
      // Fail silently - don't block user experience
      console.debug('Analytics error:', error);
    }
  }

  optOut() {
    this.enabled = false;
    localStorage.setItem('analytics_opt_out', 'true');
    console.log('✓ Analytics opt-out saved');
  }

  optIn() {
    this.enabled = true;
    localStorage.removeItem('analytics_opt_out');
    this.init();
    console.log('✓ Analytics opt-in saved');
  }
}

export const analytics = new Analytics();

// Convenience functions
export function trackSkillUnlock(skillSlug: string, level: number) {
  analytics.track('Skill Unlocked', { skill: skillSlug, level });
}

export function trackPracticeLog(skillSlug: string, rating: number) {
  analytics.track('Practice Logged', { skill: skillSlug, rating });
}

export function trackCoachUsage(surface: 'parent' | 'sibling') {
  analytics.track('Coach Used', { surface });
}

export function trackCrisisAlert(trigger: string) {
  // Anonymized - no situation content
  analytics.track('Crisis Alert Triggered', { trigger });
}

export function trackPageView(pageName: string) {
  analytics.page(pageName);
}

// TypeScript augmentation for window.plausible
declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, any> }) => void;
  }
}
