// src/hooks/useUserTracking.js
import { useState, useEffect } from 'react';

const COOKIE_NAME = 'uxia_user_id';
const COOKIE_DAYS = 365 * 10; // 10 años (esencialmente permanente)

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

const setCookie = (name, value, days) => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
};

export const useUserTracking = () => {
  const [userId, setUserId] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCookieBanner, setShowCookieBanner] = useState(false);

  useEffect(() => {
    initUser();
    checkCookieConsent();
  }, []);

  const initUser = async () => {
    try {
      let cookieId = getCookie(COOKIE_NAME);

      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(
        `${apiUrl}/api/usuari/identificar?cookie_id=${cookieId || ''}`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );
      
      const data = await response.json();
      
      if (data.cookie_id) {
        if (!cookieId) {
          // Cookie nueva
          setCookie(COOKIE_NAME, data.cookie_id, COOKIE_DAYS);
        }
        setUserId(data.cookie_id);
        setIsNewUser(data.es_nou);
      }
    } catch (error) {
      console.error('Error inicializando usuario:', error);
      const localId = getCookie(COOKIE_NAME) || `local_${Date.now()}_${Math.random()}`;
      if (!getCookie(COOKIE_NAME)) {
        setCookie(COOKIE_NAME, localId, COOKIE_DAYS);
      }
      setUserId(localId);
    } finally {
      setLoading(false);
    }
  };

  const checkCookieConsent = () => {
    const consented = localStorage.getItem('cookies_consent');
    if (!consented) {
      setShowCookieBanner(true);
    }
  };

  const acceptCookies = () => {
    localStorage.setItem('cookies_consent', 'true');
    setShowCookieBanner(false);
  };

  const rejectCookies = () => {
    localStorage.setItem('cookies_consent', 'false');
    setShowCookieBanner(false);
    document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  };

  return {
    userId,
    isNewUser,
    loading,
    showCookieBanner,
    acceptCookies,
    rejectCookies,
  };
};