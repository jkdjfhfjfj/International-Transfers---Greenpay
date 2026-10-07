// Biometric authentication module
// Implemented through native Android/iOS code

declare global {
  interface Window {
    nativeBridge?: {
      checkBiometricAvailable: () => Promise<boolean>;
      authenticateWithBiometric: (reason: string) => Promise<boolean>;
      saveBiometricPreference: (enabled: boolean) => Promise<void>;
    };
  }
}

export const initBiometric = async () => {
  try {
    if (!window.nativeBridge) {
      console.log('Native bridge not available - web app');
      return false;
    }
    const isAvailable = await window.nativeBridge.checkBiometricAvailable();
    console.log('Biometric available:', isAvailable);
    return isAvailable;
  } catch (error) {
    console.error('Biometric init error:', error);
    return false;
  }
};

export const authenticateBiometric = async (reason: string = 'Verify your identity') => {
  try {
    if (!window.nativeBridge) {
      console.log('Native bridge not available - using password auth');
      return false;
    }
    const result = await window.nativeBridge.authenticateWithBiometric(reason);
    return result;
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return false;
  }
};

// Local storage helper for biometric preference
export const saveBiometricPreference = (enabled: boolean) => {
  localStorage.setItem('biometric_enabled', JSON.stringify(enabled));
};

export const getBiometricPreference = () => {
  const pref = localStorage.getItem('biometric_enabled');
  return pref ? JSON.parse(pref) : false;
};
