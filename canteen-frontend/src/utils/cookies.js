// Cookie utility functions
export const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

export const setCookie = (name, value, days = 365) => {
  if (typeof document === 'undefined') return;
  
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
};

export const deleteCookie = (name) => {
  if (typeof document === 'undefined') return;
  
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
};

// CSRF Token specific functions
export const getCSRFToken = () => getCookie('csrftoken');

export const ensureCSRFCookie = async (api) => {
  const token = getCSRFToken();
  if (token) return token;
  
  // If no token, fetch one from the server
  try {
    const response = await api.get('/csrf/', {
      withCredentials: true,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    // The CSRF token should now be set in cookies
    return getCSRFToken();
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
    throw error;
  }
};
