package ru.softlab.mobile.plugins.social.mslive;

import com.microsoft.live.LiveAuthClient;
import com.microsoft.live.LiveConnectClient;

import org.json.JSONObject;

/**
 * Created by kuricina on 29.06.2015.
 */
public class LiveAuthDataResult {

    static final String KEY_RESULT = "key_LiveAuthDataResult";
    private LiveAuthClient auth;
    private LiveConnectClient client;
    private JSONObject resultData;

    public LiveAuthDataResult(LiveAuthClient auth, LiveConnectClient client, JSONObject resultData) {
        this.auth = auth;
        this.client = client;
        this.resultData = resultData;
    }

    public LiveAuthClient getAuth() {
        return auth;
    }

    public void setAuth(LiveAuthClient auth) {
        this.auth = auth;
    }

    public LiveConnectClient getClient() {
        return client;
    }

    public void setClient(LiveConnectClient client) {
        this.client = client;
    }

    public JSONObject getResultData() {
        return resultData;
    }

    public void setResultData(JSONObject resultData) {
        this.resultData = resultData;
    }
}
