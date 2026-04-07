import React from 'react';
import LegalLayout from './LegalLayout';

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service">
      <p><em>Last updated: April 2026</em></p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using YuGoDa, you agree to be bound by these Terms of Service. If you do not agree to
        these terms, please do not use our platform.
      </p>

      <h2>2. Account Registration</h2>
      <p>
        To use certain features, you must create an account with accurate and complete information.
        You are responsible for maintaining the confidentiality of your account credentials and for all
        activities that occur under your account.
      </p>

      <h2>3. Orders and Payments</h2>
      <ul>
        <li>All orders are subject to availability and store confirmation.</li>
        <li>Prices are displayed in Turkish Lira (TL) and include applicable taxes.</li>
        <li>Payment is processed securely through our payment infrastructure.</li>
        <li>Surprise bags contain a random selection of items and the exact contents cannot be guaranteed.</li>
      </ul>

      <h2>4. Cancellations and Refunds</h2>
      <p>
        Orders may be cancelled before the store confirms them. Once confirmed, cancellations are subject to
        the store's policy. If there is an issue with your order, contact our support team within 2 hours of pickup.
      </p>

      <h2>5. User Conduct</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the platform for any unlawful purpose</li>
        <li>Interfere with or disrupt the platform's operation</li>
        <li>Create multiple accounts to abuse promotions</li>
        <li>Submit false reviews or misleading information</li>
      </ul>

      <h2>6. Partner Store Terms</h2>
      <p>
        Partner stores are independent businesses responsible for the quality and safety of the food they sell
        through YuGoDa. YuGoDa facilitates the marketplace but does not prepare or package the food.
      </p>

      <h2>7. Limitation of Liability</h2>
      <p>
        YuGoDa provides the platform "as is" and is not liable for any indirect, incidental, or consequential
        damages arising from the use of our services.
      </p>

      <h2>8. Changes to Terms</h2>
      <p>
        We may update these terms from time to time. Continued use of the platform after changes constitutes
        acceptance of the updated terms.
      </p>

      <h2>9. Contact</h2>
      <p>
        For questions about these terms, contact us at <strong>legal@yugoda.com</strong>.
      </p>
    </LegalLayout>
  );
}
