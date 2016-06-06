package ru.softlab.mobile.plugins.social.vk;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.AsyncTask;
import android.util.Base64;
import android.util.Log;

import org.apache.cordova.CordovaWebView;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaInterface;

import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.concurrent.ExecutionException;

public class VKSocialPlugin extends CordovaPlugin {
    /**
     * Scope is set of required permissions for your application
     * @see <a href="https://vk.com/dev/permissions">vk.com api permissions documentation</a>
     */
    private static final String APP_ID_KEY = "vk_app_id";
    private static final String[] sMyScope = new String[] {
            com.vk.sdk.VKScope.FRIENDS
    };
    public static final String TAG = "vk-social-plugin";
    private static final String USER_INFO = "userInfo";
    private static final String FRIENDS_INFO = "friendsInfo";

    private CallbackContext callbackContext;
    private String action;

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data)
    {
        Log.i(TAG, "onActivityResult(" + requestCode + "," + resultCode + "," + data);
        super.onActivityResult(requestCode, resultCode, data);
        //if(resultCode != 0)
            com.vk.sdk.VKUIHelper.onActivityResult(getActivity(), requestCode, resultCode, data);
    }

	private Context getApplicationContext() {
		return this.webView.getContext();
	}

	private Activity getActivity() {
		return (Activity)this.webView.getContext();
	}

    public VKSocialPlugin() {
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
        this.action = action;
        if (action.equals("getUserInfo")) {

            this.cordova.setActivityResultCallback(this);
            this.callbackContext = callbackContext;
            PluginResult pluginResult = new PluginResult(PluginResult.Status.NO_RESULT);
            pluginResult.setKeepCallback(true);
            callbackContext.sendPluginResult(pluginResult);

            initializeSdk();
            if (com.vk.sdk.VKSdk.wakeUpSession() ) {
                startRequestToVK(com.vk.sdk.VKSdk.getAccessToken());
            } else {
                asyncCallAuthorize();
            };
        }
        else if( action.equals("login") ) {
            this.cordova.setActivityResultCallback(this);

            initializeSdk();
            Log.d(TAG,"trying to wake up session");
			if (com.vk.sdk.VKSdk.wakeUpSession() ) {
                callbackContext.success();
            }else {
                Log.d(TAG,"session is timed out. Will call authorize");

                this.callbackContext = callbackContext;
                PluginResult pluginResult = new PluginResult(PluginResult.Status.NO_RESULT);
                pluginResult.setKeepCallback(true);
                callbackContext.sendPluginResult(pluginResult);

                asyncCallAuthorize();
            }
        }
        else if(action.equals("logout")) {
            this.cordova.setActivityResultCallback(this);
            Log.d(TAG,"perform VK logout");
            try {
                com.vk.sdk.VKSdk.logout();
            }catch (Exception e) {
                e.printStackTrace();
                Log.e(TAG,"failed logout call");
            }
            callbackContext.success();
        }
        //TODO: add notifying VKPlugin on CordovaActivity life cycle
        else {
            return false;
        }
        return true;
    }

    private void initializeSdk() {
        com.vk.sdk.VKUIHelper.onCreate(getActivity());
        String APP_ID = getApplicationContext().getResources().getString(
                getApplicationContext().getResources().getIdentifier(
                        APP_ID_KEY, "string", getActivity().getPackageName())
        );
        com.vk.sdk.VKSdk.initialize(sdkListener, APP_ID);
    }

    private void asyncCallAuthorize() {
        final CallbackContext res = this.callbackContext;
        com.vk.sdk.VKSdk.authorize(sMyScope, false, false);
    }

    private final com.vk.sdk.VKSdkListener sdkListener = new com.vk.sdk.VKSdkListener() {

        @Override
        public void onCaptchaError(com.vk.sdk.api.VKError captchaError) {
            Log.d(TAG, "Capcha error " + captchaError);
            //new VKCaptchaDialog(captchaError).show();
            sendError();
        }

        @Override
        public void onTokenExpired(com.vk.sdk.VKAccessToken expiredToken) {
            Log.d(TAG,"On token expired..." );
            sendError();
            //com.vk.sdk.VKSdk.authorize(sMyScope);
        }

        @Override
        public void onAccessDenied(final com.vk.sdk.api.VKError authorizationError) {
            Log.d(TAG,"On access denied " + authorizationError);
            sendError();
            /*
            new AlertDialog.Builder(com.vk.sdk.VKUIHelper.getTopActivity())
                    .setMessage(authorizationError.toString())
                    .show();
            */
        }

        @Override
        public void onReceiveNewToken(com.vk.sdk.VKAccessToken newToken) {
            Log.d(TAG, "On recive new token ");

            if (action.equals("getUserInfo")) {
                startRequestToVK(newToken);
            } else if (action.equals("login")) {
                sendSuccess();
            }
        }

        private void sendSuccess() {
            PluginResult result = new PluginResult(PluginResult.Status.OK);
            result.setKeepCallback(false);
            VKSocialPlugin.this.callbackContext.sendPluginResult(result);
        }

        private void sendError() {
            PluginResult result = new PluginResult(PluginResult.Status.ERROR);
            result.setKeepCallback(false);
            VKSocialPlugin.this.callbackContext.sendPluginResult(result);
        }

        @Override
        public void onAcceptUserToken(com.vk.sdk.VKAccessToken token) {
            Log.d(TAG,"On accept user token");
        }
    };

    private void startRequestToVK(final com.vk.sdk.VKAccessToken accessToken) {
        final CallbackContext res = this.callbackContext;

        com.vk.sdk.api.VKRequest reqUser = com.vk.sdk.api.VKApi.users().get(com.vk.sdk.api.VKParameters.from(com.vk.sdk.api.VKApiConst.FIELDS, "id,first_name,last_name,nickname,photo_medium"));
        com.vk.sdk.api.VKRequest reqFriends = com.vk.sdk.api.VKApi.friends().get(com.vk.sdk.api.VKParameters.from(com.vk.sdk.api.VKApiConst.FIELDS, "id,first_name,last_name,nickname,photo_medium"));
        com.vk.sdk.api.VKBatchRequest batch = new com.vk.sdk.api.VKBatchRequest(reqUser, reqFriends);

        batch.executeWithListener(new com.vk.sdk.api.VKBatchRequest.VKBatchRequestListener() {
            @Override
            public void onComplete(com.vk.sdk.api.VKResponse[] responses) {
                super.onComplete(responses);

				JSONObject userInfo = new JSONObject();
                try {
                    JSONArray obj = responses[0].json.getJSONArray("response");
                    userInfo.put("accessToken", tokenToJson(accessToken));
                    userInfo.put("id", obj.getJSONObject(0).getString("id"));
                    userInfo.put("first_name", obj.getJSONObject(0).getString("first_name"));
                    userInfo.put("last_name", obj.getJSONObject(0).getString("last_name"));
                    String photoUrl = obj.getJSONObject(0).getString("photo_medium");
                    userInfo.put("pathPhoto", photoUrl);
					
                    String photoBase64 = "";
                    try {
                        byte[] byteArray = (new DownloadImageTask()).execute(photoUrl).get();
                        photoBase64 = byteArrayToBase64(byteArray);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    } catch (ExecutionException e) {
                        e.printStackTrace();
                    }
                    userInfo.put("photo", photoBase64);

                } catch (JSONException e) {
                    e.printStackTrace();
                    userInfo = responses[0].json;
                }

                JSONArray friendsInfo = new JSONArray();
                try {
                    JSONObject response = responses[1].json.getJSONObject("response");
                    JSONArray obj = response.getJSONArray("items");
                    for (int i = 0; i < obj.length(); i++) {
                        JSONObject item = new JSONObject();
                        item.put("id", obj.getJSONObject(i).getString("id"));
                        item.put("first_name", obj.getJSONObject(i).getString("first_name"));
                        item.put("last_name", obj.getJSONObject(i).getString("last_name"));
                        item.put("photo", obj.getJSONObject(i).getString("photo_medium"));
                        friendsInfo.put(item);
                    }
                } catch (JSONException e) {
                    e.printStackTrace();
                    friendsInfo.put(responses[1].json);
                }
				
                JSONObject resJS = new JSONObject();
                if(responses.length == 2) {
                    try {
                        resJS.put(USER_INFO, userInfo);
                        resJS.put(FRIENDS_INFO, friendsInfo);
                    }catch (JSONException e) {
                        Log.e(TAG,"error in JSON building."+e.getMessage());
                        e.printStackTrace();
                    }
                } else {
                    Log.e(TAG,"error in vk response processing");
                }

                Log.d(TAG,"Response from VK: " + resJS.toString());
                PluginResult result = new PluginResult(PluginResult.Status.OK, resJS);
                result.setKeepCallback(false);
                res.sendPluginResult(result);

            }

            @Override
            public void onError(com.vk.sdk.api.VKError error) {
                Log.e(TAG, "Error in response from VK: " + error.toString());
                PluginResult result = new PluginResult(PluginResult.Status.ERROR, error.toString());
                result.setKeepCallback(false);
                VKSocialPlugin.this.callbackContext.sendPluginResult(result);
            }
        });
    }

    private static final String ACCESS_TOKEN = "access_token";
    private static final String EXPIRES_IN = "expires_in";
    private static final String USER_ID = "user_id";
    private static final String SECRET = "secret";
    private static final String HTTPS_REQUIRED = "https_required";
    private static final String CREATED = "created";

    private JSONObject tokenToJson(com.vk.sdk.VKAccessToken accessToken) {
        JSONObject token = new JSONObject();
        try {
            token.put(ACCESS_TOKEN, accessToken.accessToken);
            token.put(EXPIRES_IN, accessToken.expiresIn);
            token.put(USER_ID, accessToken.userId);
            token.put(CREATED, accessToken.created);
            if (accessToken.secret != null) {
                token.put(SECRET, accessToken.secret);
            }
            if (accessToken.httpsRequired) {
                token.put(HTTPS_REQUIRED, "1");
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }

        return token;
    }

    private class DownloadImageTask extends AsyncTask<String, Void, byte[]> {

        public DownloadImageTask() {
        }

        protected byte[] doInBackground(String... urls) {
            String url = urls[0];
            byte[] byteArray = null;
            try {
                InputStream in = new java.net.URL(url).openStream();
                byteArray = readBytes(in);
            } catch (Exception e) {
                Log.e("DownloadImageTask", e.getMessage());
                e.printStackTrace();
            }
            return byteArray;
        }

        protected void onPostExecute(byte[] result) {
        }
    }

    public byte[] readBytes(InputStream inputStream) throws IOException {
        ByteArrayOutputStream byteBuffer = new ByteArrayOutputStream();
        int bufferSize = 1024;
        byte[] buffer = new byte[bufferSize];
        int len = 0;
        while ((len = inputStream.read(buffer)) != -1) {
            byteBuffer.write(buffer, 0, len);
        }

        return byteBuffer.toByteArray();
    }

    private String byteArrayToBase64(byte[] byteArray) {
        return Base64.encodeToString(byteArray, Base64.DEFAULT);
    }
}
