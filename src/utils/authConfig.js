export function hasFirebaseConfig(config) {
  return ['apiKey', 'authDomain', 'projectId', 'appId'].every(key => {
    const value = config[key];
    return typeof value === 'string' && value.trim() !== '' && !/^your[_-]/i.test(value.trim());
  });
}

export function getAuthErrorMessage(code) {
  const messages = {
    'auth/popup-closed-by-user': 'Sign-in was cancelled. You can try again when you are ready.',
    'auth/cancelled-popup-request': 'Another sign-in window is already open. Please use that window.',
    'auth/popup-blocked': 'Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.',
    'auth/network-request-failed': 'Check your internet connection and try again.',
    'auth/unauthorized-domain': 'Google sign-in is not available on this site address yet. Please contact support.',
    'auth/operation-not-allowed': 'Google sign-in is not available yet. Please try again later.',
    'auth/web-storage-unsupported': 'Your browser must allow site storage to sign in.',
    'auth/account-exists-with-different-credential': 'This email already uses another sign-in method. Use that method to access your account.'
  };
  return messages[code] || 'Google sign-in could not be completed. Please try again later.';
}
