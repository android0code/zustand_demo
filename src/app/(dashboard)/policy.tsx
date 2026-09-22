import React, { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GlassCard } from '@/components/ui/glass-card';
import { WebFooter } from '@/components/ui/web-footer';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type PolicyTab = 'return' | 'refund' | 'privacy' | 'disclaimer';

interface TabConfig {
  id: PolicyTab;
  title: string;
  icon: string;
  badge: string;
}

const TABS: TabConfig[] = [
  { id: 'return', title: 'Return Policy', icon: 'arrow.uturn.backward.circle.fill', badge: 'Digital Deliveries' },
  { id: 'refund', title: 'Refund Policy', icon: 'dollarsign.circle.fill', badge: '14-Day Guarantee' },
  { id: 'privacy', title: 'Privacy Policy', icon: 'shield.lefthalf.filled', badge: 'GDPR & Razorpay' },
  { id: 'disclaimer', title: 'Disclaimer', icon: 'exclamationmark.triangle.fill', badge: 'Legal & IP' },
];

export default function PolicyScreen({ defaultTab }: { defaultTab?: PolicyTab } = {}) {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const initialTab: PolicyTab =
    defaultTab ||
    (params.tab === 'refund'
      ? 'refund'
      : params.tab === 'privacy'
      ? 'privacy'
      : params.tab === 'disclaimer'
      ? 'disclaimer'
      : 'return');

  const [activeTab, setActiveTab] = useState<PolicyTab>(initialTab);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    } else if (params.tab && ['return', 'refund', 'privacy', 'disclaimer'].includes(params.tab)) {
      setActiveTab(params.tab as PolicyTab);
    }
  }, [defaultTab, params.tab]);

  const renderReturnPolicy = () => (
    <View style={styles.policyArticle}>
      <View style={styles.policyHeaderBlock}>
        <ThemedText type="title" style={styles.policyTitle}>
          Digital Goods Return Policy
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.policyEffective}>
          Effective Date: September 2026 • Version 2.4
        </ThemedText>
      </View>

      <GlassCard style={styles.calloutCard}>
        <SymbolView
          name={{ ios: 'info.circle.fill', android: 'info', web: 'info' }}
          tintColor="#6366f1"
          size={20}
        />
        <View style={{ flex: 1 }}>
          <ThemedText type="smallBold" style={{ color: '#6366f1', marginBottom: 2 }}>
            Instant Digital Delivery Notice
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Because all products sold on aa21pa-digits are intangible, electronic PDF publications delivered
            instantaneously upon payment confirmation, traditional physical merchandise returns are not applicable.
          </ThemedText>
        </View>
      </GlassCard>

      <View style={styles.sectionBlock}>
        <ThemedText type="subtitle" style={styles.subheading}>
          1. Scope of Digital Products
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.paragraph}>
          This policy applies to all electronic books, architectural specifications, engineering handbooks, and tactical
          guides purchased directly through the aa21pa-digits storefront. Upon successful checkout via Razorpay, an
          automated download link and license authorization key are immediately generated.
        </ThemedText>
      </View>

      <View style={styles.sectionBlock}>
        <ThemedText type="subtitle" style={styles.subheading}>
          2. Corrupted or Defective Downloads
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.paragraph}>
          If you experience any technical corruption during your download (such as an incomplete PDF byte stream,
          unreadable typography, or missing pages), we will immediately provide a fresh digital copy. You may re-download
          your purchased items at any time through the{' '}
          <ThemedText
            type="smallBold"
            style={{ color: theme.primary }}
            onPress={() => router.push('/orders')}>
            My Downloads & Licenses
          </ThemedText>{' '}
          portal or contact our engineering support team directly.
        </ThemedText>
      </View>

      <View style={styles.sectionBlock}>
        <ThemedText type="subtitle" style={styles.subheading}>
          3. Lifetime Version Updates
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.paragraph}>
          When authors issue errata updates, framework revisions (such as new Expo SDK or React Native minor versions), or
          expanded chapters, verified purchasers receive updated PDF editions free of charge throughout the supported lifecycle of the book.
        </ThemedText>
      </View>

      <View style={styles.sectionBlock}>
        <ThemedText type="subtitle" style={styles.subheading}>
          4. Contact for Return Inquiries
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.paragraph}>
          For questions regarding digital delivery or order verification, please reach out to our dedicated support desk at{' '}
          <ThemedText type="smallBold" style={{ color: theme.primary }}>
            aa21pa-solutions@gmail.com
          </ThemedText>
          .
        </ThemedText>
      </View>
    </View>
  );

  const renderRefundPolicy = () => (
    <View style={styles.policyArticle}>
      <View style={styles.policyHeaderBlock}>
        <ThemedText type="title" style={styles.policyTitle}>
          Customer Satisfaction & Refund Policy
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.policyEffective}>
          Effective Date: September 2026 • Razorpay Verified Policy
        </ThemedText>
      </View>

      <GlassCard style={styles.calloutCard}>
        <SymbolView
          name={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }}
          tintColor="#10b981"
          size={20}
        />
        <View style={{ flex: 1 }}>
          <ThemedText type="smallBold" style={{ color: '#10b981', marginBottom: 2 }}>
            14-Day Quality Guarantee
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            We are committed to delivering exceptional, production-grade technical publications. If an e-book is
            defective, unreadable, or materially misleading, you are protected by our 14-day refund guarantee.
          </ThemedText>
        </View>
      </GlassCard>

      <View style={styles.sectionBlock}>
        <ThemedText type="subtitle" style={styles.subheading}>
          1. Refund Eligibility Conditions
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.paragraph}>
          You are eligible to request a full refund within fourteen (14) calendar days of initial purchase under the following circumstances:
        </ThemedText>
        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <ThemedText style={styles.bulletDot}>•</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.bulletText}>
              The digital PDF file is technically corrupt or unreadable across standard PDF readers (Adobe Acrobat, Apple Books, Chrome).
            </ThemedText>
          </View>
          <View style={styles.bulletItem}>
            <ThemedText style={styles.bulletDot}>•</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.bulletText}>
              The content is materially different from the product description and published table of contents.
            </ThemedText>
          </View>
          <View style={styles.bulletItem}>
            <ThemedText style={styles.bulletDot}>•</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.bulletText}>
              An accidental duplicate order was placed within a 24-hour billing window.
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.sectionBlock}>
        <ThemedText type="subtitle" style={styles.subheading}>
          2. Non-Refundable Circumstances
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.paragraph}>
          Due to the instant, non-revocable nature of DRM-free digital PDF publications, refunds cannot be granted solely
          for change of mind, lack of prerequisite software knowledge explicitly outlined on the book page, or requests
          submitted after 14 calendar days.
        </ThemedText>
      </View>

      <View style={styles.sectionBlock}>
        <ThemedText type="subtitle" style={styles.subheading}>
          3. How to Request a Refund
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.paragraph}>
          To initiate a refund, please send an email to{' '}
          <ThemedText type="smallBold" style={{ color: theme.primary }}>
            aa21pa-solutions@gmail.com
          </ThemedText>{' '}
          or visit our{' '}
          <ThemedText
            type="smallBold"
            style={{ color: theme.primary }}
            onPress={() => router.push('/about-contact')}>
            About & Contact
          </ThemedText>{' '}
          page with:
        </ThemedText>
        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <ThemedText style={styles.bulletDot}>1.</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.bulletText}>
              Your Razorpay payment email address.
            </ThemedText>
          </View>
          <View style={styles.bulletItem}>
            <ThemedText style={styles.bulletDot}>2.</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.bulletText}>
              Your aa21pa-digits Order ID (found on your email receipt or in My Downloads).
            </ThemedText>
          </View>
          <View style={styles.bulletItem}>
            <ThemedText style={styles.bulletDot}>3.</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.bulletText}>
              A brief explanation of the technical defect or issue encountered.
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.sectionBlock}>
        <ThemedText type="subtitle" style={styles.subheading}>
          4. Processing Timeline
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.paragraph}>
          Approved refunds are processed through Razorpay directly back to your original payment method within 5 to 7 business
          days. Upon refund issuance, your license key will be invalidated.
        </ThemedText>
      </View>
    </View>
  );

  const renderPrivacyPolicy = () => (
    <View style={styles.policyArticle}>
      <View style={styles.policyHeaderBlock}>
        <ThemedText type="title" style={styles.policyTitle}>
          Privacy Policy & Data Protection
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.policyEffective}>
          Effective Date: September 2026 • GDPR & CCPA Compliant
        </ThemedText>
      </View>

      <GlassCard style={styles.calloutCard}>
        <SymbolView
          name={{ ios: 'lock.shield.fill', android: 'security', web: 'security' }}
          tintColor="#3b82f6"
          size={20}
        />
        <View style={{ flex: 1 }}>
          <ThemedText type="smallBold" style={{ color: '#3b82f6', marginBottom: 2 }}>
            Privacy First Architecture
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            We do not sell, monetize, or broker your personal information. We collect only what is strictly required to
            deliver your purchased digital PDF e-books and send transaction receipts.
          </ThemedText>
        </View>
      </GlassCard>

      <View style={styles.sectionBlock}>
        <ThemedText type="subtitle" style={styles.subheading}>
          1. Information We Collect
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.paragraph}>
          When you make a purchase on aa21pa-digits, we collect:
        </ThemedText>
        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <ThemedText style={styles.bulletDot}>•</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.bulletText}>
              <ThemedText type="smallBold">Email Address:</ThemedText> Used solely to transmit your digital PDF
              download confirmation, license key, and product update notices.
            </ThemedText>
          </View>
          <View style={styles.bulletItem}>
            <ThemedText style={styles.bulletDot}>•</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.bulletText}>
              <ThemedText type="smallBold">Transaction Metadata:</ThemedText> Purchased items, timestamp, and order totals
              stored for your re-download access under My Downloads.
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.sectionBlock}>
        <ThemedText type="subtitle" style={styles.subheading}>
          2. Payment Information Security (Razorpay)
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.paragraph}>
          All payment card, UPI, and netbanking processing is performed directly through Razorpay Software Private Limited / Razorpay Inc. using 256-bit TLS encryption. aa21pa-digits
          servers never store or see your raw credit card numbers, CVV security codes, or banking PINs.
        </ThemedText>
      </View>

      <View style={styles.sectionBlock}>
        <ThemedText type="subtitle" style={styles.subheading}>
          3. Tracking & Cookies Policy
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.paragraph}>
          We do not use invasive third-party ad retargeting trackers or cross-site fingerprinting. We use minimal,
          first-party local storage cookies strictly required to maintain your active shopping cart and color theme preferences.
        </ThemedText>
      </View>

      <View style={styles.sectionBlock}>
        <ThemedText type="subtitle" style={styles.subheading}>
          4. Your Data Rights (GDPR & CCPA)
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.paragraph}>
          You hold the absolute right to request a full copy of your transaction records or demand complete erasure of your
          email from our order systems. Submit requests anytime to{' '}
          <ThemedText type="smallBold" style={{ color: theme.primary }}>
            aa21pa-solutions@gmail.com
          </ThemedText>
          .
        </ThemedText>
      </View>
    </View>
  );

  const renderDisclaimer = () => (
    <View style={styles.policyArticle}>
      <View style={styles.policyHeaderBlock}>
        <ThemedText type="title" style={styles.policyTitle}>
          Legal & Professional Disclaimer
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.policyEffective}>
          Effective Date: September 2026 • General Terms
        </ThemedText>
      </View>

      <GlassCard style={styles.calloutCard}>
        <SymbolView
          name={{ ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' }}
          tintColor="#f59e0b"
          size={20}
        />
        <View style={{ flex: 1 }}>
          <ThemedText type="smallBold" style={{ color: '#f59e0b', marginBottom: 2 }}>
            Educational Purpose Notice
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            All publications, code architectures, and technical blueprints sold on aa21pa-digits are provided strictly for
            educational, engineering, and informational purposes.
          </ThemedText>
        </View>
      </GlassCard>

      <View style={styles.sectionBlock}>
        <ThemedText type="subtitle" style={styles.subheading}>
          1. No Financial or Commercial Guarantee
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.paragraph}>
          While our entrepreneurial and startup e-books outline real-world strategies and financial models, aa21pa-digits
          and our contributing authors make no representation, warranty, or guarantee of specific commercial success,
          earnings, or recurring revenue (MRR). Results depend on individual execution, market conditions, and technical proficiency.
        </ThemedText>
      </View>

      <View style={styles.sectionBlock}>
        <ThemedText type="subtitle" style={styles.subheading}>
          2. Intellectual Property & Copyright Protection
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.paragraph}>
          All PDF publications are protected under international copyright law. Your purchase grants you a personal or
          designated commercial license for internal reference. Unauthorized redistribution, peer-to-peer torrenting,
          public re-uploading, or resale of any book content is strictly prohibited and subject to legal enforcement.
        </ThemedText>
      </View>

      <View style={styles.sectionBlock}>
        <ThemedText type="subtitle" style={styles.subheading}>
          3. Third-Party Trademarks
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.paragraph}>
          Expo, React, React Native, Razorpay, TypeScript, Node.js, and other referenced technologies are trademarks or
          registered trademarks of their respective holders. aa21pa-digits is an independent publisher and is not
          affiliated with or endorsed by these third-party organizations.
        </ThemedText>
      </View>

      <View style={styles.sectionBlock}>
        <ThemedText type="subtitle" style={styles.subheading}>
          4. Limitation of Liability
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.paragraph}>
          In no event shall aa21pa-digits or its authors be held liable for any direct, indirect, incidental, or
          consequential damages arising out of the use or inability to use the information and code architectures described
          within our publications.
        </ThemedText>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Top Breadcrumb Row */}
          <View style={styles.breadcrumbRow}>
            <Pressable
              onPress={() => router.push('/(dashboard)')}
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}>
              <SymbolView
                name={{ ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' }}
                tintColor={theme.primary}
                size={14}
              />
              <ThemedText style={[styles.backBtnText, { color: theme.primary }]}>
                Storefront
              </ThemedText>
            </Pressable>
            <ThemedText type="small" themeColor="textSecondary">
              /
            </ThemedText>
            <ThemedText type="smallBold">Legal & Trust Policies</ThemedText>
          </View>

          {/* Segmented Tab Switcher */}
          <View style={styles.tabSwitcherRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabScrollContent}>
              {TABS.map((tab) => {
                const isSelected = activeTab === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => setActiveTab(tab.id)}
                    style={({ pressed }) => [
                      styles.tabBtn,
                      {
                        backgroundColor: isSelected
                          ? theme.primary
                          : isDark
                          ? 'rgba(255, 255, 255, 0.06)'
                          : 'rgba(0, 0, 0, 0.05)',
                        borderColor: isSelected
                          ? theme.primary
                          : isDark
                          ? 'rgba(255, 255, 255, 0.1)'
                          : 'rgba(0, 0, 0, 0.08)',
                      },
                      pressed && { opacity: 0.8 },
                    ]}>
                    <ThemedText
                      style={[
                        styles.tabBtnText,
                        {
                          color: isSelected ? '#ffffff' : theme.text,
                          fontWeight: isSelected ? '800' : '600',
                        },
                      ]}>
                      {tab.title}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Policy Document Content Card */}
          <GlassCard style={styles.documentCard}>
            {activeTab === 'return' && renderReturnPolicy()}
            {activeTab === 'refund' && renderRefundPolicy()}
            {activeTab === 'privacy' && renderPrivacyPolicy()}
            {activeTab === 'disclaimer' && renderDisclaimer()}
          </GlassCard>

          {/* Help & Support Banner */}
          <View
            style={[
              styles.helpBanner,
              {
                backgroundColor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.06)',
                borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.15)',
              },
            ]}>
            <View style={{ flex: 1 }}>
              <ThemedText type="smallBold" style={{ color: '#6366f1', marginBottom: 2 }}>
                Have questions about our digital policies?
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Our support team is available 7 days a week. We respond to all inquiries within 24 hours.
              </ThemedText>
            </View>

            <Pressable
              onPress={() => router.push('/about-contact')}
              style={({ pressed }) => [styles.contactCtaBtn, pressed && { opacity: 0.85 }]}>
              <ThemedText style={styles.contactCtaBtnText}>Contact Support →</ThemedText>
            </Pressable>
          </View>

          {/* Global Web Footer */}
          <WebFooter />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  scrollContent: {
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.three,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  tabSwitcherRow: {
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.four,
  },
  tabScrollContent: {
    flexDirection: 'row',
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  tabBtnText: {
    fontSize: 13,
  },
  documentCard: {
    marginHorizontal: Spacing.four,
    padding: Spacing.five,
    borderRadius: 22,
    marginBottom: Spacing.four,
  },
  policyArticle: {
    gap: Spacing.four,
  },
  policyHeaderBlock: {
    marginBottom: Spacing.two,
  },
  policyTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
    marginBottom: 6,
  },
  policyEffective: {
    fontSize: 12,
  },
  calloutCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  sectionBlock: {
    gap: 8,
  },
  subheading: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
  },
  bulletList: {
    gap: 8,
    marginTop: 4,
    paddingLeft: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    color: '#6366f1',
    fontWeight: '800',
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  helpBanner: {
    marginHorizontal: Spacing.four,
    padding: Spacing.four,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: Spacing.two,
  },
  contactCtaBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  contactCtaBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
