import { Card } from '../../_shared/components/Card.jsx';
import { usePageMeta } from '../../../shared/hooks/usePageMeta.js';

export default function CookiePolicyPage() {
  usePageMeta({
    title: 'Cookie Policy',
    description:
      'Learn how QuizPop uses cookies for authentication, security, and basic product analytics.',
  });

  return (
    <section className="legal-page">
      <Card className="legal-card" accent="pink">
        <p className="eyebrow">Legal</p>
        <h1>Cookie Policy</h1>
        <p className="muted legal-updated">Last updated: April 19, 2026</p>

        <div className="legal-content">
          <h2>1. Essential Cookies</h2>
          <p>
            QuizPop uses essential cookies for login sessions, CSRF protection,
            and secure request handling.
          </p>

          <h2>2. Preference Cookies</h2>
          <p>
            Preference cookies may be used to remember user settings and improve
            usability across visits.
          </p>

          <h2>3. Security Usage</h2>
          <p>
            Security-related cookies help prevent unauthorized actions and
            detect suspicious behavior in authenticated flows.
          </p>

          <h2>4. Third-Party Cookies</h2>
          <p>
            QuizPop does not intentionally set advertising cookies. Third-party
            tools, if introduced, will be documented here.
          </p>

          <h2>5. Managing Cookies</h2>
          <p>
            You can clear or block cookies in your browser settings, but some
            authenticated features may stop working correctly.
          </p>
        </div>
      </Card>
    </section>
  );
}
