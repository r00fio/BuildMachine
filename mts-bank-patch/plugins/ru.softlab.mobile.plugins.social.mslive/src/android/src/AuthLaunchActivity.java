package ru.softlab.mobile.plugins.social.mslive;

import android.app.Activity;
import android.content.Intent;
import android.os.AsyncTask;
import android.os.Bundle;
import android.util.Base64;
import android.util.Log;

import com.microsoft.live.LiveAuthClient;
import com.microsoft.live.LiveAuthException;
import com.microsoft.live.LiveAuthListener;
import com.microsoft.live.LiveConnectClient;
import com.microsoft.live.LiveConnectSession;
import com.microsoft.live.LiveOperation;
import com.microsoft.live.LiveOperationException;
import com.microsoft.live.LiveOperationListener;
import com.microsoft.live.LiveStatus;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.concurrent.ExecutionException;

/**
 * Created by kuricina on 26.06.2015.
 */
public class AuthLaunchActivity extends Activity implements LiveAuthListener {

    public static final String TAG = "MsLiveSocialPlugin";
    private LiveAuthClient auth;
    private LiveConnectClient client;

    private int actionID;
    private JSONObject resultUserData;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.mainpage);
        String APP_ID = getApplicationContext().getResources().getString(
                getApplicationContext().getResources().getIdentifier(
                        AppIdConstants.APP_ID_KEY, "string", getPackageName())
        );
        this.auth = new LiveAuthClient(this, APP_ID);
        actionID = getIntent().getIntExtra(AppIdConstants.KEY_ACTION_ID, 1);
    }

    @Override
    protected void onStart() {
        super.onStart();
        Iterable<String> scopes = Arrays.asList("wl.signin", "wl.basic");
        this.auth.login(this, scopes, this);
        //this.auth.login(scopes, this);
    }

    public void onAuthComplete(LiveStatus status, LiveConnectSession session, Object userState) {
        if(status == LiveStatus.CONNECTED) {
            Log.i(TAG, "Signed in.");
            client = new LiveConnectClient(session);
            resultUserData = new JSONObject();

            switch (actionID){
                //if login
                case 1: {
                    sendSuccessResult();
                    break;
                }
                //if getInfoUser
                case 2: {
                    getUserInfo();
                    break;
                }
            }
        }
        else {
            Log.i(TAG, "Not signed in.");
            client = null;
            sendErrorResult("Not signed in.");
        }
    }

    public void onAuthError(LiveAuthException exception, Object userState) {
        Log.i(TAG, "Error signing in: " + exception.getMessage());
        client = null;
        sendErrorResult("Error signing in: " + exception.getMessage());
    }

    public void getUserInfo() {
        client.getAsync("/me", new LiveOperationListener() {
            public void onComplete(LiveOperation operation) {
                JSONObject result = operation.getResult();
                Log.i(TAG, result.toString());

                JSONObject userInfo = new JSONObject();
                try {
                    userInfo.put("id", result.optString("id"));
                    userInfo.put("first_name", result.optString("first_name"));
                    userInfo.put("last_name", result.optString("last_name"));
                    userInfo.put("photo", "");
                } catch (JSONException e) {
                    e.printStackTrace();
                    userInfo = result;
                }

                getUserImage(userInfo);
            }

            public void onError(LiveOperationException exception, LiveOperation operation) {
                Log.i(TAG, "Error getting name: " + exception.getMessage());
                sendErrorResult("Error getting name: " + exception.getMessage());
            }
        });
    }

    public void getUserImage(final JSONObject data) {
        client.getAsync("me/picture", new LiveOperationListener() {
            public void onComplete(LiveOperation operation) {
                JSONObject result = operation.getResult();
                String link = result.optString("location");

                String photoBase64 = "";
                try {
                    byte[] byteArray = (new DownloadImageTask()).execute(link).get();
                    photoBase64 = byteArrayToBase64(byteArray);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                } catch (ExecutionException e) {
                    e.printStackTrace();
                }
                try {
                    data.put("photo", photoBase64);
                } catch (JSONException e) {
                    Log.e(TAG, "Error in JSON building. " + e.getMessage());
                    e.printStackTrace();
                }
                try {
                    resultUserData.put("userInfo", data);

                    getFriendsList();
                } catch (JSONException e) {
                    Log.e(TAG, "Error in JSON building. " + e.getMessage());
                    e.printStackTrace();
                }
            }

            public void onError(LiveOperationException exception, LiveOperation operation) {
                Log.i(TAG, "Error getting user's profile picture: " + exception.getMessage());
                sendErrorResult("Error getting user's profile picture: " + exception.getMessage());
            }
        });
    }

    public void getFriendsList() {
        client.getAsync("/me/friends", new LiveOperationListener() {
            public void onComplete(LiveOperation operation) {
                JSONObject result = operation.getResult();
                Log.i(TAG, result.toString());
                try {
                    JSONArray friendsInfo = result.getJSONArray("data");
                    resultUserData.put("friendsInfo", friendsInfo);

                    sendSuccessResult();
                } catch (JSONException e) {
                    Log.e(TAG, "Error in JSON building. " + e.getMessage());
                    e.printStackTrace();
                }
            }
            public void onError(LiveOperationException exception, LiveOperation operation) {
                Log.i(TAG, "Error getting name: " + exception.getMessage());
                sendErrorResult("Error getting name: " + exception.getMessage());
            }
        });
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

    public void sendSuccessResult() {
        //LiveAuthDataResult objResult = new LiveAuthDataResult(auth, client, resultUserData);
        Intent intent = new Intent();
        intent.putExtra(LiveAuthDataResult.KEY_RESULT, resultUserData.toString());

        setResult(RESULT_OK, intent);
        finish();
    }

    public void sendErrorResult(String errorMessage) {
        Intent intent = new Intent();
        intent.putExtra(AppIdConstants.KEY_ERROR, errorMessage);
        setResult(RESULT_CANCELED, intent);
        finish();
    }
}
