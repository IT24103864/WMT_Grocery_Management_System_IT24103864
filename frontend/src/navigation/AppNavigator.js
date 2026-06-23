import { useContext } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthContext, AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import AuthNavigator from "./AuthNavigator";
import CustomerNavigator from "./CustomerNavigator";
import AdminNavigator from "./AdminNavigator";

function RootNavigator() {
  const { token, user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#ffffff" }}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  if (!token) return <AuthNavigator />;
  if (user?.role === "admin") return <AdminNavigator />;
  return <CustomerNavigator />;
}

export default function AppNavigator() {
  return (
    <AuthProvider>
      <CartProvider>
        <RootNavigator />
      </CartProvider>
    </AuthProvider>
  );
}
