
package ru.softlab.mobile.plugins;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import android.util.Log;
import android.webkit.CookieManager;

public class CookieManagerPlugin extends CordovaPlugin {
	
	private final String TAG = "CookieManagerPlugin";
	
	@Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        if ("clear".equals(action)) {
            this.clear();
            callbackContext.success();
            return true;
        }
        return false;  // Returning false results in a "MethodNotFound" error.
    }
	
	public void clear() {
		Log.v(TAG, "clearing cookies start...");
        
		if ( webView.getCookieManager() != null)
            webView.getCookieManager().clearCookies();
		
		Log.v(TAG, "clearing cookies end.");
    }
	

}
