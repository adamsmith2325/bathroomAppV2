// src/components/WelcomeModal.tsx
import { useEffect, useState } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TextStyle,
  TouchableOpacity,
  View,
} from 'react-native'
import { useTheme } from '../lib/themeContext'
import { ThemedText } from './Themed'
import styles from './WelcomeModal.styles'

export interface Slide {
  title: string
  body: string
}

export interface Props {
  visible: boolean
  onClose: () => void

  // optional overrides
  slides?: Slide[]
  activeSlideIndex?: number
}

export const defaultSlides: Slide[] = [
  {
    title: 'Welcome to LooLocator',
    body: 'Your guide to clean, safe public restrooms in your area.',
  },
  {
    title: 'Quickly find public restrooms',
    body: 'Use our interactive map to locate clean, safe restrooms nearby.',
  },
  {
    title: 'Tap a pin for details',
    body: 'See entry codes, hours, and special instructions at each location.',
  },
  {
    title: 'Mark as “Used”',
    body: 'Log your visit to help track popular spots and earn badges.',
  },
  {
    title: 'Rate & comment',
    body: 'Leave a star-rating and share tips to guide fellow users.',
  },
  {
    title: 'Save favorites',
    body: 'Bookmark your go-to restrooms and manage your profile in Account.',
  },
]

export function WelcomeModal({
  visible,
  onClose,
  slides = defaultSlides,
  activeSlideIndex = 0,
}: Props) {
  const { theme } = useTheme()
  const { colors, typography } = theme

  // local slide state
  const [activeSlide, setActiveSlide] = useState(activeSlideIndex)

  // reset slide index when reopened
  useEffect(() => {
    if (visible) {
      setActiveSlide(activeSlideIndex)
    }
  }, [visible, activeSlideIndex])

  const headerStyle: TextStyle = {
    ...typography.header,
    fontWeight: typography.header.fontWeight as TextStyle['fontWeight'],
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  }
  const bodyStyle: TextStyle = {
    ...typography.body,
    fontWeight: typography.body.fontWeight as TextStyle['fontWeight'],
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: (typography.body.fontSize || 14) * 1.4,
    marginBottom: 16,
  }

  const isLast = activeSlide === slides.length - 1
  const slide = slides[activeSlide]

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoiding}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.container, { backgroundColor: colors.surface }]}>
            <ScrollView
              contentContainerStyle={styles.contentContainer}
              keyboardShouldPersistTaps="handled"
            >
              {/* Title & body */}
              <ThemedText style={headerStyle}>{slide.title}</ThemedText>
              <ThemedText style={bodyStyle}>{slide.body}</ThemedText>

              {/* Pagination dots */}
              <View style={styles.pagination}>
                {slides.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.paginationDot,
                      i === activeSlide && styles.paginationDotActive,
                    ]}
                  />
                ))}
              </View>

              {/* Next / Done button */}
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  if (!isLast) {
                    setActiveSlide(idx => idx + 1)
                  } else {
                    onClose()
                  }
                }}
              >
                <ThemedText
                  style={[styles.actionBtnText, { color: colors.onPrimary }]}
                >
                  {isLast ? 'Done' : 'Next'}
                </ThemedText>
              </TouchableOpacity>

              {/* Close link */}
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <ThemedText style={{ color: colors.error }}>Close</ThemedText>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}
