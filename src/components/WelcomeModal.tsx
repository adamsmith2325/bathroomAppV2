// src/components/WelcomeModal.tsx
import React, { useState } from 'react';
import {
    Dimensions,
    FlatList,
    Modal,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { ThemedText, ThemedView } from './Themed';

const { width } = Dimensions.get('window');

export interface Slide {
  key: string;
  title: string;
  description: string;
}

const slides: Slide[] = [
  {
    key: '1',
    title: 'Welcome to LooLocator',
    description: 'Find public restrooms near you in seconds.',
  },
  {
    key: '2',
    title: 'Add a Bathroom',
    description:
      'Tap the “+” tab, then tap on the map to set your location, fill in the details and hit “Add Bathroom.”',
  },
  {
    key: '3',
    title: 'Mark as Used',
    description: 'Viewed a restroom? Open its details and tap “Mark as Used” to track your history.',
  },
  {
    key: '4',
    title: 'Go Premium',
    description: 'Remove ads and unlock extra filters with a one-time purchase.',
  },
];

interface Props {
  visible: boolean;
  onFinish: () => void;
}

export default function WelcomeModal({ visible, onFinish }: Props) {
  const [index, setIndex] = useState(0);

  const onNext = () => {
    if (index === slides.length - 1) {
      onFinish();
      setIndex(0);
    } else {
      setIndex(i => i + 1);
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <ThemedView style={styles.container}>
        <FlatList
          data={slides}
          keyExtractor={s => s.key}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          renderItem={({ item, index: i }) => (
            <View style={styles.slide}>
              <ThemedText style={styles.title}>{item.title}</ThemedText>
              <ThemedText style={styles.description}>
                {item.description}
              </ThemedText>
            </View>
          )}
          extraData={index}
        />
        <View style={styles.footer}>
          <View style={styles.pager}>
            {slides.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === index && styles.dotActive,
                ]}
              />
            ))}
          </View>
          <TouchableOpacity onPress={onNext} style={styles.button}>
            <ThemedText style={styles.buttonText}>
              {index === slides.length - 1 ? 'Get Started' : 'Next'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  slide: {
    width,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  pager: { flexDirection: 'row', marginBottom: 20 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#888',
    marginHorizontal: 4,
  },
  dotActive: { backgroundColor: '#fff' },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  buttonText: { color: '#fff', fontSize: 16 },
});
