import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';

export default function SplashScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/(tabs)/home');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Image
        source={require('../../assets/images/fundo.png')}
        style={{ width: width, height: height }}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5D8C6F',
  },
});
