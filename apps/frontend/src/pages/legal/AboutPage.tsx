import React from 'react';
import LegalLayout from './LegalLayout';

export default function AboutPage() {
  return (
    <LegalLayout title="About Us">
      <h2>Our Mission</h2>
      <p>
        YuGoDa is a food waste prevention platform that connects consumers with surplus food from restaurants,
        bakeries, cafes, and grocery stores at discounted prices. We believe that perfectly good food should never
        go to waste.
      </p>

      <h2>What We Do</h2>
      <p>
        Every day, thousands of meals go unsold and end up in landfills. YuGoDa gives these meals a second chance
        by offering them as surprise bags at up to 70% off their original price. Our partner stores package their
        unsold food into surprise bags, and customers pick them up before closing time.
      </p>

      <h2>Our Impact</h2>
      <p>
        By rescuing surplus food, we help reduce CO2 emissions, minimize food waste, and make quality meals
        more affordable for everyone. Every bag saved is a step toward a more sustainable food system.
      </p>

      <h2>For Businesses</h2>
      <p>
        We partner with restaurants, bakeries, cafes, and grocery stores to help them reduce waste and generate
        additional revenue from food that would otherwise be discarded. Join us and turn your surplus into sales.
      </p>

      <h2>Contact</h2>
      <p>
        Have questions or want to learn more? Reach out to us at <strong>hello@yugoda.com</strong>.
      </p>
    </LegalLayout>
  );
}
