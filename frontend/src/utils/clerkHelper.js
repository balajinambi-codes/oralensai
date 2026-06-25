import React from 'react';
import * as ClerkReact from '@clerk/clerk-react';

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || localStorage.getItem('clerk_publishable_key');
const hasValidKey = clerkKey && (clerkKey.trim().startsWith('pk_test_') || clerkKey.trim().startsWith('pk_live_'));

export const IS_CLERK_ENABLED = !!hasValidKey;

// Mock implementations for no-auth/offline mode to prevent rendering crashes
export const SignedInMock = () => null;
export const SignedOutMock = ({ children }) => children;
export const SignInButtonMock = ({ children }) => {
  const alertUser = () => alert('Authentication is currently not configured. Please add VITE_CLERK_PUBLISHABLE_KEY to your .env file to enable sign-in.');
  
  if (React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: alertUser
    });
  }
  return React.createElement(
    'button',
    {
      onClick: alertUser,
      className: "flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary/95 hover:shadow-primary/30 transition-all hover:scale-102 cursor-pointer"
    },
    'Sign In / Join'
  );
};
export const UserButtonMock = () => null;
export const useUserMock = () => ({
  user: null,
  isLoaded: true,
  isSignedIn: false,
});
export const ClerkProviderMock = ({ children }) => children;

// Export either real Clerk SDK or mock shims based on key existence
export const SignedIn = IS_CLERK_ENABLED ? ClerkReact.SignedIn : SignedInMock;
export const SignedOut = IS_CLERK_ENABLED ? ClerkReact.SignedOut : SignedOutMock;
export const SignInButton = IS_CLERK_ENABLED ? ClerkReact.SignInButton : SignInButtonMock;
export const UserButton = IS_CLERK_ENABLED ? ClerkReact.UserButton : UserButtonMock;
export const useUser = IS_CLERK_ENABLED ? ClerkReact.useUser : useUserMock;
export const ClerkProvider = IS_CLERK_ENABLED ? ClerkReact.ClerkProvider : ClerkProviderMock;
export const getPublishableKey = () => (IS_CLERK_ENABLED ? clerkKey.trim() : null);
