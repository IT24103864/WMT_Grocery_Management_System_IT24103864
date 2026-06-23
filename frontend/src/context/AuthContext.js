import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let done = false;

    const finish = () => {
      if (!done) {
        done = true;
        setLoading(false);
      }
    };

    const timeout = setTimeout(finish, 5000);

    const loadAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        const storedUser = await AsyncStorage.getItem("user");
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Failed to load auth from storage:", error);
      } finally {
        clearTimeout(timeout);
        finish();
      }
    };

    loadAuth();

    return () => {
      done = true;
      clearTimeout(timeout);
    };
  }, []);

  const login = async (tokenValue, userValue) => {
    try {
      await AsyncStorage.setItem("token", tokenValue);
      await AsyncStorage.setItem("user", JSON.stringify(userValue));
      setToken(tokenValue);
      setUser(userValue);
    } catch (error) {
      console.error("Failed to save auth to storage:", error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error("Failed to clear auth from storage:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
