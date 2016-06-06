package ru.softlab.mobile.plugins.social.mslive;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

import com.microsoft.live.LiveAuthClient;
import com.microsoft.live.LiveAuthException;
import com.microsoft.live.LiveAuthListener;
import com.microsoft.live.LiveConnectSession;
import com.microsoft.live.LiveStatus;

import org.apache.cordova.CordovaWebView;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.PluginResult;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Created by kuricina on 26.06.2015.
 */
public class MsLiveSocialPlugin extends CordovaPlugin {

    public static final String TAG = "MsLiveSocialPlugin";
    private CallbackContext callbackContext;
    private String action;
    private JSONArray args;

    private LiveAuthClient auth;


    private Context getApplicationContext() {
        return this.webView.getContext();
    }

    private Activity getActivity() {
        return (Activity) this.webView.getContext();
    }

    /**
     * Constructor.
     */
    public MsLiveSocialPlugin() {
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
     * @param action          The action to execute.
     * @param args            JSONArray of arguments for the plugin.
     * @param callbackContext The callback id used when calling back into JavaScript.
     * @return True if the action was valid, false if not.
     */
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        this.action = action;
        this.args = args;

        this.cordova.setActivityResultCallback(this);
        this.callbackContext = callbackContext;
        PluginResult pluginResult = new PluginResult(PluginResult.Status.NO_RESULT);
        pluginResult.setKeepCallback(true);
        callbackContext.sendPluginResult(pluginResult);

        if (action.equals("login")) {

            startAuthorization(1);
			
        } else if (action.equals("logout")) {

            logout();
			
        } else if (action.equals("getUserInfo")) {

            startAuthorization(2);
			
        } else {
            setErrorResult("Wrong action!");
            return false;
        }
        return true;
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (resultCode == Activity.RESULT_OK) {
            if (requestCode == 1) {
                setOKResult("login success!");
            }
            if (requestCode == 2) {
                try {
                    JSONObject obj = new JSONObject(data.getStringExtra(LiveAuthDataResult.KEY_RESULT));
                    setOKResultWithData(obj);
                } catch (JSONException e) {
                    Log.e(TAG, "Error in JSON building. " + e.getMessage());
                    setErrorResult("Error in JSON building. " + e.getMessage());
                }
            }
        } if (resultCode == Activity.RESULT_CANCELED) {
            if (data != null) {
                setErrorResult(data.getStringExtra(AppIdConstants.KEY_ERROR));
            } else {
                Log.e(TAG, "onActivityResult. Result canceled with empty data");
            }
        } else {
            setErrorResult("Undefined type result with code: " + resultCode);
        }
    }

    /*
     * Local methods
     */

    private void startAuthorization(int requestCode) {
        Intent intent = new Intent(getActivity(), AuthLaunchActivity.class);
        intent.putExtra(AppIdConstants.KEY_ACTION_ID, requestCode);
        getActivity().startActivityForResult(intent, requestCode);
    }

    private void logout() {
        String APP_ID = getApplicationContext().getResources().getString(
                getApplicationContext().getResources().getIdentifier(
                        AppIdConstants.APP_ID_KEY, "string", getActivity().getPackageName())
        );
        this.auth = new LiveAuthClient(getApplicationContext(), APP_ID);
        this.auth.logout(new LiveAuthListener() {
            @Override
            public void onAuthError(LiveAuthException exception, Object userState) {
                setErrorResult(exception.getMessage());
            }

            @Override
            public void onAuthComplete(LiveStatus status,
                                       LiveConnectSession session,
                                       Object userState) {
                setOKResult("Login was success");
            }
        });
    }

	private void setOKResult(String message) {
        PluginResult result = new PluginResult(PluginResult.Status.OK, message);
        result.setKeepCallback(false);
        MsLiveSocialPlugin.this.callbackContext.sendPluginResult(result);
    }

    private void setOKResultWithData(JSONObject data) {
        PluginResult result = new PluginResult(PluginResult.Status.OK, data);
        result.setKeepCallback(false);
        MsLiveSocialPlugin.this.callbackContext.sendPluginResult(result);
    }
	
    private void setErrorResult(String message) {
        PluginResult result = new PluginResult(PluginResult.Status.ERROR, message);
        result.setKeepCallback(false);
        MsLiveSocialPlugin.this.callbackContext.sendPluginResult(result);
    }
}
