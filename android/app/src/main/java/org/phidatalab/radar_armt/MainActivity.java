package org.phidatalab.radar_armt;

import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.util.Log;
import android.view.View;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;

import java.util.Iterator;
import java.util.Set;

import es.rentingjob.plugins.capgrabintentextras.GrabIntentExtrasPlugin;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // Handle edge-to-edge insets for Android 15+ (SDK 35)
    View contentView = findViewById(android.R.id.content);
    contentView.setBackgroundColor(Color.parseColor("#0b4a59"));

    ViewCompat.setOnApplyWindowInsetsListener(contentView, (v, windowInsets) -> {
      Insets insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
      v.setPadding(insets.left, insets.top, insets.right, insets.bottom);
      return WindowInsetsCompat.CONSUMED;
    });
  }

  @Override
  protected void onNewIntent(Intent intent) {
    Bundle bundle = intent.getExtras();
    JSObject data = new JSObject();
    if (bundle != null) {
      Set<String> keys = bundle.keySet();
      Iterator<String> it = keys.iterator();
      while (it.hasNext()) {
        String key = it.next();
        data.put(key, bundle.get(key));
      }
    }
    GrabIntentExtrasPlugin.getPluginInstance().emitExtras(data);
    super.onNewIntent(intent);
  }
}
