import React from 'react';
import { View, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StripeProvider } from '@stripe/stripe-react-native/lib/commonjs/components/StripeProvider';
import AppNavigator from './src/navigation/AppNavigator';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51TSYT0Drav3pqe05fiyuXMNtbLpvOi7WdsqvYl1dBZ5Ho9BTrNIYuvpnZ0AiEdhVqPIzb5DUeCI3k7MVql2vaVVD00VMa7EqhP';

class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff' }}>
          <Text style={{ color: '#dc2626', fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>
            App Error
          </Text>
          <Text style={{ color: '#374151', fontSize: 13, textAlign: 'center' }}>
            {this.state.error.message}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </StripeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
