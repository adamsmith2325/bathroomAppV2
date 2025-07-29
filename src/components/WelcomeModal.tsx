// src/components/WelcomeModal.tsx
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  TextStyle,
  TouchableOpacity,
  View
} from 'react-native';
import { ThemedText, ThemedView } from '../components/Themed';
import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/themeContext';
import { useSession } from '../lib/useSession';
import styles from './WelcomeModal.styles';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    title: 'Welcome to LooLocator!',
    description:
      'Quickly find public restrooms near you on an interactive map.',
  },
  {
    title: 'Add a Bathroom',
    description:
      'Tap anywhere on the map to drop a pin, enter details, and share with the community.',
  },
  {
    title: 'Filter by Radius',
    description:
      'Set your notify radius in My Account to only see bathrooms within your preferred distance.',
  },
  {
    title: 'Save Favorites',
    description:
      'Tap the ★ star icon on any bathroom to bookmark it for easy access later.',
  },
  {
    title: 'Go Premium',
    description:
      'Upgrade to remove ads, unlock advanced filters, and support future features.',
  },
];

interface WelcomeModalProps {
  visible: boolean
  onClose: () => void
}

export function WelcomeModal({ visible, onClose }: WelcomeModalProps) 
{
  const { theme } = useTheme();
  const { colors, spacing, borderRadius, typography } = theme;
  const { profile } = useSession();
  const [slide, setSlide] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleClose = async () => {
    if (profile) {
      await supabase
        .from('profiles')
        .update({ welcome_seen: true })
        .eq('id', profile.id);
    }
  };

  const handleNext = () => {
    if (slide < SLIDES.length - 1) {
      const next = slide + 1;
      setSlide(next);
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
    } else {
      handleClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <ThemedView
          style={[
            styles.card,
            {
              backgroundColor: colors.background,
              borderRadius: borderRadius.md,
              padding: spacing.lg,
            },
          ]}
        >
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
            contentContainerStyle={{ width: width * SLIDES.length }}
          >
            {SLIDES.map((s, i) => (
              <View key={i} style={[styles.slide, { width }]}>
                <ThemedText
                  style={{
                    fontSize: typography.header.fontSize,
                    // <-- cast here
                    fontWeight: typography.header
                      .fontWeight as TextStyle['fontWeight'],
                    color: colors.text,
                    marginBottom: spacing.md,
                    textAlign: 'center',
                  }}
                >
                  {s.title}
                </ThemedText>
                <ThemedText
                  style={{
                    fontSize: typography.body.fontSize,
                    fontWeight: typography.body
                      .fontWeight as TextStyle['fontWeight'],
                    color: colors.text,
                    lineHeight: typography.body.fontSize * 1.4,
                    textAlign: 'center',
                  }}
                >
                  {s.description}
                </ThemedText>
              </View>
            ))}
          </ScrollView>

          <View style={styles.overlay}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      i === slide ? colors.primary : colors.border,
                  },
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            onPress={handleNext}
            style={[
              styles.button,
              {
                backgroundColor: colors.primary,
                borderRadius: borderRadius.sm,
                paddingVertical: spacing.sm,
                marginTop: spacing.lg,
              },
            ]}
          >
            <ThemedText
              style={{
                color: colors.primary,
                fontSize: typography.body.fontSize,
                fontWeight: typography.body
                  .fontWeight as TextStyle['fontWeight'],
                textAlign: 'center',
              }}
            >
              {slide < SLIDES.length - 1 ? 'Next' : 'Get Started'}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </View>
    </Modal>
  );
}

// const styles = StyleSheet.create({
//   overlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   modal: {
//     width: width - 40,
//   },
//   slide: {
//     justifyContent: 'center',
//     paddingHorizontal: 10,
//   },
//   dotsContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     marginTop: 12,
//   },
//   dot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     marginHorizontal: 4,
//   },
//   button: {
//     alignSelf: 'stretch',
//   },
// });
