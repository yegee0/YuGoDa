import React from 'react';
import LegalLayout from './LegalLayout';

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy">
      <p><em>Last updated: April 2026</em></p>

      <h2>1. Information We Collect</h2>
      <p>We collect the following types of information when you use YuGoDa:</p>
      <ul>
        <li><strong>Account information:</strong> Name, email address, phone number, and password when you create an account.</li>
        <li><strong>Order information:</strong> Details about your purchases, delivery addresses, and payment methods.</li>
        <li><strong>Location data:</strong> Your approximate location to show nearby stores and enable delivery services.</li>
        <li><strong>Usage data:</strong> How you interact with our platform, including pages visited, features used, and search queries.</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Process and fulfill your orders</li>
        <li>Personalize your experience and show relevant food options</li>
        <li>Communicate with you about orders, promotions, and updates</li>
        <li>Improve our platform and develop new features</li>
        <li>Ensure the security and integrity of our services</li>
      </ul>

      <h2>3. Information Sharing</h2>
      <p>
        We share your information only as necessary to provide our services. This includes sharing delivery details
        with partner stores to fulfill your orders. We do not sell your personal information to third parties.
      </p>

      <h2>4. Cookies</h2>
      <p>
        We use cookies and similar technologies to remember your preferences, keep you signed in, and understand
        how you use our platform. You can manage cookie settings in your browser.
      </p>

      <h2>5. Data Security</h2>
      <p>
        We implement industry-standard security measures to protect your personal information, including encryption
        of sensitive data and secure payment processing through our payment partners.
      </p>

      <h2>6. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access and download your personal data</li>
        <li>Correct inaccurate information</li>
        <li>Request deletion of your account and data</li>
        <li>Opt out of marketing communications</li>
      </ul>

      <h2>7. Contact Us</h2>
      <p>
        For privacy-related inquiries, contact us at <strong>privacy@yugoda.com</strong>.
      </p>
    </LegalLayout>
  );
}
