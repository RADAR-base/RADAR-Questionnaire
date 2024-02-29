package org.phidatalab.radar_armt;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;

import java.util.Iterator;
import java.util.Set;

import es.rentingjob.plugins.capgrabintentextras.GrabIntentExtrasPlugin;

public class MainActivity extends BridgeActivity {
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
