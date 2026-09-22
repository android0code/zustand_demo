import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GlassCard } from '@/components/ui/glass-card';
import { WebFooter } from '@/components/ui/web-footer';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'How do I receive my purchased e-book?',
    answer:
      'Immediately upon successful Razorpay checkout, your browser will automatically start downloading the DRM-free PDF file. You will also receive an instant confirmation order record with your license key accessible under "My Downloads & Keys".',
  },
  {
    question: 'What format are the digital publications delivered in?',
    answer:
      'All our publications are delivered in universal, high-resolution PDF format (.pdf). They feature complete vector typography, high-contrast code snippets, and hyperlinked tables of contents suitable for Mac, PC, iPad, and e-readers.',
  },
  {
    question: 'Can I re-download my book if I switch devices or lose the file?',
    answer:
      'Yes, absolutely. You can access your downloads anytime from the "My Downloads" section on this website, or simply contact our support team with your checkout email address to receive an updated download link.',
  },
  {
    question: 'Do you offer team licensing or corporate purchasing?',
    answer:
      'Yes! We offer bulk team licenses for engineering teams, universities, and enterprise organizations. Please submit your request via the contact form or email aa21pa-solutions@gmail.com with your team size.',
  },
  {
    question: 'What is your refund policy for PDF e-books?',
    answer:
      'We offer an unconditional 14-day quality guarantee. If the content does not meet your technical expectations or if you experience unresolvable file corruption, we issue a prompt 100% refund through Razorpay.',
  },
];

export default function AboutContactScreen() {
  const router = useRouter();
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width } = useWindowDimensions();
  const isMobile = width < 860;

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<'support' | 'orders' | 'licensing' | 'general'>('support');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setErrorMessage('Please provide your full name.');
      setStatus('error');
      return;
    }
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setErrorMessage('Please provide a valid email address.');
      setStatus('error');
      return;
    }
    if (!message.trim() || message.trim().length < 10) {
      setErrorMessage('Please enter a message of at least 10 characters.');
      setStatus('error');
      return;
    }

    setErrorMessage('');
    setStatus('submitting');

    // Simulate reliable API submission
    setTimeout(() => {
      setStatus('success');
      setName('');
      setEmail('');
      setMessage('');
    }, 900);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.pageInner}>
            {/* Breadcrumb Navigation */}
            <View style={styles.breadcrumbRow}>
              <Pressable
                onPress={() => router.push('/(dashboard)')}
                style={({ pressed }) => [styles.crumbLink, pressed && { opacity: 0.7 }]}>
                <ThemedText type="small" themeColor="textSecondary">
                  Home
                </ThemedText>
              </Pressable>
              <ThemedText type="small" themeColor="textSecondary">
                /
              </ThemedText>
              <ThemedText type="smallBold" style={{ color: theme.primary }}>
                About & Contact
              </ThemedText>
            </View>

            {/* Hero Header */}
            <View style={styles.heroHeader}>
              <View style={styles.heroPill}>
                <SymbolView
                  name={{ ios: 'envelope.badge.shield.half.filled', android: 'verified', web: 'verified' }}
                  tintColor="#6366f1"
                  size={14}
                />
                <ThemedText style={styles.heroPillText}>DIRECT DEVELOPER SUPPORT</ThemedText>
              </View>

              <ThemedText type="title" style={styles.heroTitle}>
                About aa21pa-digits & Support
              </ThemedText>

              <ThemedText type="default" themeColor="textSecondary" style={styles.heroSubtitle}>
                Curated technical PDF guides. Have a question about an order or download? Contact our team below.
              </ThemedText>
            </View>

            {/* Quick Stat Highlights */}
            <View style={[styles.statsGrid, isMobile && styles.statsGridMobile]}>
              <GlassCard style={styles.statCard}>
                <View style={[styles.statIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.12)' }]}>
                  <SymbolView
                    name={{ ios: 'clock.fill', android: 'schedule', web: 'schedule' }}
                    tintColor="#6366f1"
                    size={20}
                  />
                </View>
                <ThemedText style={styles.statValue}>&lt; 4 Hours</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
                  Avg. Response Time
                </ThemedText>
              </GlassCard>

              <GlassCard style={styles.statCard}>
                <View style={[styles.statIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                  <SymbolView
                    name={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }}
                    tintColor="#10b981"
                    size={20}
                  />
                </View>
                <ThemedText style={styles.statValue}>100% Direct</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
                  Spoken by Engineers
                </ThemedText>
              </GlassCard>

              <GlassCard style={styles.statCard}>
                <View style={[styles.statIconBox, { backgroundColor: 'rgba(2, 132, 199, 0.12)' }]}>
                  <SymbolView
                    name={{ ios: 'lock.shield.fill', android: 'security', web: 'security' }}
                    tintColor="#0284c7"
                    size={20}
                  />
                </View>
                <ThemedText style={styles.statValue}>Razorpay Verified</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
                  Instant 14-Day Refund
                </ThemedText>
              </GlassCard>
            </View>

            {/* Main Content: Two Columns on Desktop */}
            <View style={[styles.mainLayout, isMobile && styles.mainLayoutMobile]}>
              {/* Left Column: Interactive Contact Form */}
              <View style={styles.contactColumn}>
                <GlassCard style={styles.formCard}>
                  <View style={styles.cardHeader}>
                    <ThemedText type="subtitle" style={styles.cardTitle}>
                      Send Us a Message
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      Fill out the details below and we will get back to your email directly.
                    </ThemedText>
                  </View>

                  {status === 'success' ? (
                    <View
                      style={[
                        styles.successBox,
                        {
                          backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ecfdf5',
                          borderColor: '#10b981',
                        },
                      ]}>
                      <SymbolView
                        name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                        tintColor="#10b981"
                        size={28}
                      />
                      <ThemedText style={styles.successTitle}>Message Sent Successfully!</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                        Thank you for reaching out. Our engineering support desk has received your ticket and will
                        reply to your email address within 2-4 business hours.
                      </ThemedText>
                      <Pressable
                        onPress={() => setStatus('idle')}
                        style={[styles.resetBtn, { backgroundColor: theme.primary }]}>
                        <ThemedText style={styles.resetBtnText}>Send Another Inquiry</ThemedText>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.formContent}>
                      {status === 'error' && errorMessage ? (
                        <View
                          style={[
                            styles.errorBox,
                            {
                              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2',
                              borderColor: '#ef4444',
                            },
                          ]}>
                          <SymbolView
                            name={{ ios: 'exclamationmark.circle.fill', android: 'error', web: 'error' }}
                            tintColor="#ef4444"
                            size={16}
                          />
                          <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
                        </View>
                      ) : null}

                      {/* Name Input */}
                      <View style={styles.inputGroup}>
                        <ThemedText type="smallBold" style={styles.label}>
                          Your Name
                        </ThemedText>
                        <TextInput
                          value={name}
                          onChangeText={setName}
                          placeholder="e.g. Sarah Connor"
                          placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                          style={[
                            styles.input,
                            {
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc',
                              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1',
                              color: isDark ? '#ffffff' : '#0f172a',
                            },
                          ]}
                        />
                      </View>

                      {/* Email Input */}
                      <View style={styles.inputGroup}>
                        <ThemedText type="smallBold" style={styles.label}>
                          Email Address (Used for checkout / replies)
                        </ThemedText>
                        <TextInput
                          value={email}
                          onChangeText={setEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          placeholder="sarah@company.com"
                          placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                          style={[
                            styles.input,
                            {
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc',
                              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1',
                              color: isDark ? '#ffffff' : '#0f172a',
                            },
                          ]}
                        />
                      </View>

                      {/* Topic Category */}
                      <View style={styles.inputGroup}>
                        <ThemedText type="smallBold" style={styles.label}>
                          Inquiry Topic
                        </ThemedText>
                        <View style={styles.topicRow}>
                          {[
                            { id: 'support', label: 'Download Issue' },
                            { id: 'orders', label: 'Order / Refund' },
                            { id: 'licensing', label: 'Team License' },
                            { id: 'general', label: 'Book Feedback' },
                          ].map(t => {
                            const isSelected = category === t.id;
                            return (
                              <Pressable
                                key={t.id}
                                onPress={() => setCategory(t.id as any)}
                                style={[
                                  styles.topicPill,
                                  {
                                    backgroundColor: isSelected
                                      ? '#6366f1'
                                      : isDark
                                      ? 'rgba(255, 255, 255, 0.06)'
                                      : '#e2e8f0',
                                    borderColor: isSelected
                                      ? '#6366f1'
                                      : isDark
                                      ? 'rgba(255, 255, 255, 0.1)'
                                      : '#cbd5e1',
                                  },
                                ]}>
                                <ThemedText
                                  style={[
                                    styles.topicPillText,
                                    { color: isSelected ? '#ffffff' : isDark ? '#cbd5e1' : '#334155' },
                                  ]}>
                                  {t.label}
                                </ThemedText>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>

                      {/* Message Textarea */}
                      <View style={styles.inputGroup}>
                        <ThemedText type="smallBold" style={styles.label}>
                          Message Details
                        </ThemedText>
                        <TextInput
                          value={message}
                          onChangeText={setMessage}
                          multiline
                          numberOfLines={5}
                          textAlignVertical="top"
                          placeholder="Please provide order number, book title, or question..."
                          placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                          style={[
                            styles.input,
                            styles.textArea,
                            {
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc',
                              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1',
                              color: isDark ? '#ffffff' : '#0f172a',
                            },
                          ]}
                        />
                      </View>

                      {/* Submit Button */}
                      <Pressable
                        onPress={handleSubmit}
                        disabled={status === 'submitting'}
                        style={({ pressed }) => [
                          styles.submitBtn,
                          { backgroundColor: '#6366f1' },
                          pressed && { opacity: 0.85 },
                          status === 'submitting' && { opacity: 0.6 },
                        ]}>
                        {status === 'submitting' ? (
                          <ActivityIndicator color="#ffffff" size="small" />
                        ) : (
                          <>
                            <SymbolView
                              name={{ ios: 'paperplane.fill', android: 'send', web: 'send' }}
                              tintColor="#ffffff"
                              size={16}
                            />
                            <ThemedText style={styles.submitBtnText}>Submit Message</ThemedText>
                          </>
                        )}
                      </Pressable>
                    </View>
                  )}
                </GlassCard>

                {/* Direct Contact Card */}
                <GlassCard style={styles.directCard}>
                  <ThemedText type="smallBold" style={styles.directCardHeader}>
                    DIRECT CONTACT CHANNELS
                  </ThemedText>

                  <View style={styles.directChannels}>
                    <View style={styles.channelRow}>
                      <View style={[styles.channelIcon, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                        <SymbolView
                          name={{ ios: 'envelope.fill', android: 'mail', web: 'mail' }}
                          tintColor="#6366f1"
                          size={16}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="smallBold">General & Technical Support</ThemedText>
                        <ThemedText type="small" style={{ color: '#6366f1', fontWeight: '600' }}>
                          aa21pa-solutions@gmail.com
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.channelRow}>
                      <View style={[styles.channelIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                        <SymbolView
                          name={{ ios: 'building.2.fill', android: 'business', web: 'business' }}
                          tintColor="#10b981"
                          size={16}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="smallBold">Enterprise & Volume Licensing</ThemedText>
                        <ThemedText type="small" style={{ color: '#10b981', fontWeight: '600' }}>
                          aa21pa-solutions@gmail.com
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.channelRow}>
                      <View style={[styles.channelIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                        <SymbolView
                          name={{ ios: 'mappin.circle.fill', android: 'place', web: 'place' }}
                          tintColor="#f59e0b"
                          size={16}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="smallBold">aa21pa-digits Headquarters</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          100 Montgomery St, Suite 1400, San Francisco, CA 94104
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                </GlassCard>
              </View>

              {/* Right Column: About Us Story & FAQs */}
              <View style={styles.infoColumn}>
                {/* About Story */}
                <GlassCard style={styles.aboutCard}>
                  <View style={styles.aboutBadge}>
                    <ThemedText style={styles.aboutBadgeText}>OUR MISSION</ThemedText>
                  </View>
                  <ThemedText type="subtitle" style={styles.aboutTitle}>
                    High-Signal Technical Books for Builders
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.aboutParagraph}>
                    aa21pa-digits provides focused, architectural-grade digital PDF publications for modern software
                    engineers and startup founders.
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.aboutParagraph}>
                    Every e-book in our catalog is written by seasoned practitioners, delivered DRM-free with instant
                    automated browser download upon Razorpay checkout.
                  </ThemedText>

                  {/* Core Tenets */}
                  <View style={styles.tenetsGrid}>
                    <View style={styles.tenetItem}>
                      <SymbolView
                        name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                        tintColor="#10b981"
                        size={16}
                      />
                      <ThemedText type="small" style={styles.tenetText}>
                        Zero DRM Restrictions
                      </ThemedText>
                    </View>
                    <View style={styles.tenetItem}>
                      <SymbolView
                        name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                        tintColor="#10b981"
                        size={16}
                      />
                      <ThemedText type="small" style={styles.tenetText}>
                        Lifetime Free PDF Updates
                      </ThemedText>
                    </View>
                    <View style={styles.tenetItem}>
                      <SymbolView
                        name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                        tintColor="#10b981"
                        size={16}
                      />
                      <ThemedText type="small" style={styles.tenetText}>
                        Instant Automated Checkout
                      </ThemedText>
                    </View>
                    <View style={styles.tenetItem}>
                      <SymbolView
                        name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                        tintColor="#10b981"
                        size={16}
                      />
                      <ThemedText type="small" style={styles.tenetText}>
                        Razorpay 14-Day Guarantee
                      </ThemedText>
                    </View>
                  </View>
                </GlassCard>

                {/* Frequently Asked Questions */}
                <GlassCard style={styles.faqCard}>
                  <ThemedText type="subtitle" style={styles.faqTitle}>
                    Frequently Asked Questions
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.faqSubtitle}>
                    Quick answers to common questions about downloads, refunds, and PDF licensing.
                  </ThemedText>

                  <View style={styles.faqList}>
                    {FAQS.map((faq, index) => {
                      const isOpen = openFaqIndex === index;
                      return (
                        <View
                          key={index}
                          style={[
                            styles.faqItem,
                            {
                              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                            },
                          ]}>
                          <Pressable
                            onPress={() => toggleFaq(index)}
                            style={({ pressed }) => [styles.faqHeaderRow, pressed && { opacity: 0.8 }]}>
                            <ThemedText type="smallBold" style={styles.faqQuestion}>
                              {faq.question}
                            </ThemedText>
                            <SymbolView
                              name={{
                                ios: isOpen ? 'chevron.up' : 'chevron.down',
                                android: isOpen ? 'expand_less' : 'expand_more',
                                web: isOpen ? 'expand_less' : 'expand_more',
                              }}
                              tintColor={theme.primary}
                              size={14}
                            />
                          </Pressable>

                          {isOpen ? (
                            <View style={styles.faqAnswerContainer}>
                              <ThemedText type="small" themeColor="textSecondary" style={styles.faqAnswerText}>
                                {faq.answer}
                              </ThemedText>
                            </View>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                </GlassCard>
              </View>
            </View>
          </View>

          {/* Web Footer */}
          <WebFooter />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  pageInner: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.four,
  },
  crumbLink: {
    paddingVertical: 2,
  },
  heroHeader: {
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: Spacing.five,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    marginBottom: Spacing.three,
  },
  heroPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6366f1',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    maxWidth: 680,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: Spacing.six,
  },
  statsGridMobile: {
    flexDirection: 'column',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
  },
  mainLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 28,
    marginBottom: Spacing.four,
  },
  mainLayoutMobile: {
    flexDirection: 'column',
    gap: 24,
  },
  contactColumn: {
    flex: 6,
    width: '100%',
    gap: 20,
  },
  infoColumn: {
    flex: 5,
    width: '100%',
    gap: 20,
  },
  formCard: {
    padding: Spacing.five,
  },
  cardHeader: {
    marginBottom: Spacing.four,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  formContent: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
  },
  input: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  textArea: {
    height: 110,
    paddingTop: 10,
    paddingBottom: 10,
  },
  topicRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  topicPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  submitBtn: {
    height: 46,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  successBox: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10b981',
  },
  resetBtn: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  resetBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  directCard: {
    padding: Spacing.four,
  },
  directCardHeader: {
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  directChannels: {
    gap: 14,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  channelIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutCard: {
    padding: Spacing.five,
  },
  aboutBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 10,
  },
  aboutBadgeText: {
    color: '#6366f1',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  aboutParagraph: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
  tenetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  tenetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '46%',
  },
  tenetText: {
    fontSize: 12,
    fontWeight: '600',
  },
  faqCard: {
    padding: Spacing.five,
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  faqSubtitle: {
    fontSize: 12,
    marginBottom: 16,
  },
  faqList: {
    gap: 10,
  },
  faqItem: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    overflow: 'hidden',
  },
  faqHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  faqQuestion: {
    fontSize: 13,
    flex: 1,
  },
  faqAnswerContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  faqAnswerText: {
    fontSize: 12,
    lineHeight: 18,
  },
});
