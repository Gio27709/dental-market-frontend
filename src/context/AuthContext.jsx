/* eslint-disable react-refresh/only-export-components */
import PropTypes from "prop-types";
import { createContext, useState, useEffect, useContext } from "react";
import {
  supabase,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signOut as authSignOut,
} from "../lib/supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (sessionUser) => {
    if (!sessionUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const metadata = sessionUser.user_metadata || {};
      // SECURITY FIX (ALTO-7): Prioritize app_metadata (immutable by users)
      // user_metadata.role can be modified by the user via supabase.auth.updateUser()
      const appMeta = sessionUser.app_metadata || {};
      setUser({
        ...sessionUser,
        role: appMeta.role || metadata.role || "user",
        status: metadata.status || "active",
        createdAt: sessionUser.created_at,
        lastNameChange: metadata.last_name_change || null,
        phone: metadata.phone || null,
        avatarUrl: metadata.custom_avatar_url || metadata.avatar_url || null,
        firstName: metadata.first_name || metadata.full_name?.split(" ")[0],
        lastName:
          metadata.last_name ||
          metadata.full_name?.split(" ").slice(1).join(" "),
      });
    } catch (err) {
      console.error("Error processing profile", err);
      setUser({ ...sessionUser, role: "user", status: "active" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Listen to changes globally (Google redirect, Token expiry, manual sign-in)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (session) {
        setToken(session.access_token);
      }

      if (
        event === "INITIAL_SESSION" ||
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED"
      ) {
        await fetchProfile(session?.user);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setToken(null);
        setLoading(false);
      }
    });

    // Timeout failsafe
    const failsafe = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 5000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(failsafe);
    };
  }, []);

  const loginWithGoogle = async () => {
    return await signInWithGoogle();
  };

  const login = async ({ email, password }) => {
    const { data, error } = await signInWithEmail(email, password);
    if (error) throw error;
    return data;
  };

  const register = async ({ email, password, name, role }) => {
    const { data, error } = await signUpWithEmail(email, password, {
      full_name: name,
      role,
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await authSignOut();
  };

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) throw error;
    return data;
  };

  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return data;
  };

  /**
   * Force a JWT session refresh from Supabase.
   * This is needed after admin changes the user's role (e.g., store approval),
   * because app_metadata changes don't propagate to existing JWT tokens.
   */
  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      if (data?.session?.user) {
        setToken(data.session.access_token);
        await fetchProfile(data.session.user);
      }
      return { success: true };
    } catch (err) {
      console.error("Error refreshing session:", err);
      return { success: false, error: err.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, loginWithGoogle, register, logout, resetPassword, updatePassword, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
export const useAuth = () => useContext(AuthContext);
