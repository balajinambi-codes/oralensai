const KEY_STORAGE_NAME = 'clerk_publishable_key';

export const getClerkPublishableKey = () => {
  const envKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (envKey && envKey.trim().startsWith('pk_')) {
    return envKey.trim();
  }
  const localKey = localStorage.getItem(KEY_STORAGE_NAME);
  if (localKey && localKey.trim().startsWith('pk_')) {
    return localKey.trim();
  }
  return null;
};

export const saveClerkPublishableKey = (key) => {
  if (key && key.trim().startsWith('pk_')) {
    localStorage.setItem(KEY_STORAGE_NAME, key.trim());
    return true;
  }
  return false;
};

export const clearClerkPublishableKey = () => {
  localStorage.removeItem(KEY_STORAGE_NAME);
};
