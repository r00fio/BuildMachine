package ru.softlab.mobile.plugins.deviceinfo;

import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.telephony.TelephonyManager;
import android.util.Log;

import org.apache.cordova.CordovaWebView;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaInterface;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;


public class DeviceInfoPlugin extends CordovaPlugin {
    public static final String TAG = "device-info-plugin";

    /**
     * Constructor.
     */
    public DeviceInfoPlugin() {
    }

    /**
     * Sets the context of the Command. This can then be used to do things like
     * get file paths associated with the Activity.
     *
     * @param cordova The context of the main Activity.
     * @param webView The CordovaWebView Cordova is running in.
     */
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
    }

    /**
     * Executes the request and returns PluginResult.
     *
     * @param action            The action to execute.
     * @param args              JSONArray of arguments for the plugin.
     * @param callbackContext   The callback id used when calling back into JavaScript.
     * @return                  True if the action was valid, false if not.
     */
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        if (action.equals("getDeviceInfo")) {
            callbackContext.success(getDeviceInfoJS(this.cordova.getActivity().getApplicationContext()));
        }
        else {
            return false;
        }
        return true;
    }

    //--------------------------------------------------------------------------
    // LOCAL METHODS
    //--------------------------------------------------------------------------
    public JSONObject getDeviceInfoJS(Context context) {
        JSONObject o = new JSONObject();
        try {
            o.put("platformType", "android");
            o.put("platformVersion", Build.VERSION.RELEASE);
            o.put("manufacturer", Build.MANUFACTURER);
            o.put("model", Build.MODEL);
            o.put("id", Build.SERIAL);
            o.put("nfc", isNFCSupportedOnDevice(context));
            o.put("iccid", getICCID(context));
            o.put("msisdn", getMSISDN(context));
        } catch (JSONException e) {
            Log.e("device-info-plugin", e.getMessage());
            return new JSONObject();
        }
        return o;
    }

    private String getMSISDN(Context context) {
        try {
            TelephonyManager telMgr =
                    (TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE);
            if (telMgr != null) {
                return telMgr.getLine1Number();
            }
        } catch (Exception e) { //на случай если доступ к менеджеру пропадет
            Log.e("device-info-plugin",e.getMessage());
        }
        return null;
    }

    private boolean isNFCSupportedOnDevice(Context context) {
        return context.getPackageManager().hasSystemFeature(PackageManager.FEATURE_NFC);
    }

    private String getICCID(Context context) {
        try {
            TelephonyManager telMgr =
                    (TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE);
            if (telMgr != null) {
                return telMgr.getSimSerialNumber();
            }
        } catch (Exception e) { //на случай если вдруг разрешения на доступ к менеджеру пропадут
            Log.e("device-info-plugin",e.getMessage());
        }
        return null;
    }

}
