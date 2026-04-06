package com.greenpay.mobile;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import android.os.Bundle;

/**
 * GreenPay Mobile Application
 * Main activity for the Capacitor application
 */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Firebase Cloud Messaging handled by GreenPayMessagingService
    }
}
