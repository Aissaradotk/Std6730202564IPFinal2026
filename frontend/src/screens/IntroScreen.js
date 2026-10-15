import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors, typography, radius } from '../theme';

const { width, height } = Dimensions.get('window');

export default function IntroScreen({ onFinish }) {
  const opacity = new Animated.Value(0);
  const translateY = new Animated.Value(20);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    Animated.timing(translateY, {
      toValue: 0,
      duration: 600,
      delay: 200,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(onFinish, 1400);
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.title, { opacity, transform: [{ translateY }] }]}>
        HR Manager &{'\n'}Salary Analytics System
      </Animated.Text>
      <Animated.Text style={[styles.tagline, { opacity, transform: [{ translateY: Animated.add(translateY, 8) }] }]}>
        PEOPLE • PERFORMANCE • K-MEANS PRECISION
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1020',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 44,
    fontFamily: typography.fontFamily,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38bdf8',
    letterSpacing: 2,
    textAlign: 'center',
    fontFamily: typography.fontFamilyMono,
  },
});
