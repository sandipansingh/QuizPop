import { Card } from '../../_shared/components/Card.jsx';
import { usePageMeta } from '../../../shared/hooks/usePageMeta.js';

export default function PrivacyPolicyPage() {
  usePageMeta({
    title: 'Privacy Policy',
    description:
      'Read the QuizPop privacy policy to understand what data we collect, why we collect it, and how it is protected.',
  });

  return (
    <section className="legal-page">
      <Card className="legal-card" accent="mint">
        <p className="eyebrow">Legal</p>
        <h1>Privacy Policy</h1>
        <p className="muted legal-updated">Last updated: April 19, 2026</p>

        <div className="legal-content">
          <h2>1. Information We Collect</h2>
          <p>
            QuizPop collects account details you provide directly such as
            username, email, and profile preferences. We also store gameplay
            information including scores, quiz attempts, and leaderboard stats.
          </p>

          <h2>2. How We Use Data</h2>
          <p>
            Your data is used to authenticate your account, provide quiz
            features, personalize your profile, and power rankings and
            multiplayer rooms.
          </p>

          <h2>3. Cookies And Sessions</h2>
          <p>
            We use secure cookies and tokens to manage authenticated sessions,
            CSRF protection, and essential platform security features.
          </p>

          <h2>4. Data Sharing</h2>
          <p>
            We do not sell personal data. Limited technical service providers
            may process data only as required to operate core platform
            infrastructure.
          </p>

          <h2>5. Contact</h2>
          <p>
            If you have privacy questions, contact the QuizPop maintainers for
            support and deletion requests.
          </p>
        </div>
      </Card>
    </section>
  );
}
