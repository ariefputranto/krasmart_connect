import { StatusBar } from 'expo-status-bar';
import React, {useEffect} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import KrasmartConnect from './src/component/KrasmartConnect';
import { StoreProvider } from './src/store/Store';

export default function App() {
  return (
    <StoreProvider>
      <View style={styles.container}>
        <KrasmartConnect />
      </View>
    </StoreProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
