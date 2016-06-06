package ru.softlab.mobile.plugins.zingaya;

import android.app.Activity;
import android.content.Context;
import android.media.AudioManager;
import android.util.Log;

import org.apache.cordova.CordovaWebView;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.PluginResult;

import org.json.JSONArray;
import org.json.JSONException;
import java.util.Map;

import com.zingaya.*;
import com.zingaya.zingaya.*;

/**
 * Created by kuricina on 28.07.2015.
 */
public class ZingayaPlugin extends CordovaPlugin implements ZingayaAPICallback {

    public static final String TAG = "ZingayaPlugin";
    private CallbackContext callbackContext;
    private String action;
    private JSONArray args;

    enum State
    {
        Idle,
        Connecting,
        Calling,
        Speaking,
        Disconnecting
    }
    private State state = State.Idle;
    private Call call = null;

    private Context getApplicationContext() {
        return this.webView.getContext();
    }

    private Activity getActivity() {
        return (Activity) this.webView.getContext();
    }

    /**
     * Constructor.
     */
    public ZingayaPlugin() {
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
        initZingayaSDK();
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
        this.callbackContext = callbackContext;

        if (action.equals("call")) {
            switch (state)
            {
                case Idle:
                    setState(State.Connecting);
                    logMessage("Connecting to server...\n");
                    ZingayaAPI.instance().connect();
                    break;
                case Disconnecting:
                    onConnectedToServer();
                case Calling:
                case Speaking:
                    break;
            }
        } else if (action.equals("hangup")) {
            switch (state)
            {
                case Idle:
                case Calling:
                case Speaking:
                    setState(State.Disconnecting);
                    try {
                        call.disconnect();
                    } catch (CallTerminatedException e) {
                        setState(State.Disconnecting);
                        ZingayaAPI.instance().disconnect();
                    }
                    call = null;
                    break;
            }
			
        } else if (action.equals("microphoneOn")) {
            ZingayaAPI.instance().unmute();
            callbackContext.success();
            /*
            AudioManager audioManager = (AudioManager)getApplicationContext().getSystemService(Context.AUDIO_SERVICE);
            audioManager.setMicrophoneMute(false);
            if (!audioManager.isMicrophoneMute()) {
                setOKResult("");
            } */

        } else if (action.equals("microphoneOff")) {
            ZingayaAPI.instance().mute();
            callbackContext.success();
            /*
            AudioManager audioManager = (AudioManager)getApplicationContext().getSystemService(Context.AUDIO_SERVICE);
            audioManager.setMicrophoneMute(true);
            if (audioManager.isMicrophoneMute()) {
                setOKResult("");
            } */
        } else {
            setErrorResult("Wrong action!");
            return false;
        }
        return true;
    }

    /*
     * Local methods
     */

    private void initZingayaSDK() {
        try {
            ZingayaAPI.instance().setAndroidContext(getApplicationContext());
        } catch (MissingPermissionException e) {
            e.printStackTrace();
        }
        ZingayaAPI.instance().setCallback(this);
    }

    public void setState(State state) {
        this.state = state;
    }

    @Override
    public void onConnectedToServer() {
        getActivity().runOnUiThread(new Runnable(){
            public void run()
            {
                logMessage("Connected to server. Calling...\n");
                setState(State.Calling);
                try {
                    call = ZingayaAPI.instance().createCall("7c71b5d9d57ff0eb776f2ed7c6e50799", false);
                    call.start(null);
                    call.attachMedia();
                } catch (NotConnectedToServerException e) {
                    logMessage("Not connected to server\n");
                    setState(State.Disconnecting);
                    ZingayaAPI.instance().disconnect();
                } catch (CallTerminatedException e) {
                    logMessage("Internal error\n");
                    setState(State.Disconnecting);
                    ZingayaAPI.instance().disconnect();
                }
            }
        });
    }

    @Override
    public void onConnectionFailed(String reason) {
        final String theReason = reason;
        getActivity().runOnUiThread(new Runnable(){
            public void run()
            {
                logMessage("Failed to connect to server: " + theReason + "\n");
                setState(State.Idle);
            }
        });
        setErrorResult("Connection was failed. Reason: " + reason);
    }

    @Override
    public void onConnectionClosed() {
        getActivity().runOnUiThread(new Runnable(){
            public void run()
            {
                logMessage("Connection closed\n");
                setState(State.Idle);
            }
        });
    }

    @Override
    public void onAuthOk(String displayName) {

    }

    @Override
    public void onAuthFailed() {
        setErrorResult("Auth failed");
    }

    @Override
    public void onCallConnected(Call call) {
        getActivity().runOnUiThread(new Runnable(){
            public void run()
            {
                logMessage("Call connected\n");
                setState(State.Speaking);
            }
        });
        setOKResult("Call connected");
    }

    @Override
    public void onCallFailed(Call call, int code, String reason) {
        final String theReason = reason;
        getActivity().runOnUiThread(new Runnable(){
            public void run()
            {
                logMessage("Call failed: " + theReason + "\n");
                setState(State.Disconnecting);
                ZingayaAPI.instance().disconnect();
            }
        });
        setErrorResult("Call failed: " + reason);
    }

    @Override
    public void onCallDisconnected(Call call) {
        getActivity().runOnUiThread(new Runnable(){
            public void run()
            {
                logMessage("Call disconnected\n");
                setState(State.Disconnecting);
                //ZingayaAPI.instance().disconnect();
            }
        });
        setOKResult("Call was disconnected.");
    }

    @Override
    public void onCallRinging(Call call) {
        getActivity().runOnUiThread(new Runnable(){
            public void run()
            {
                logMessage("Call ringing\n");
            }
        });

    }

    @Override
    public void onCallStartAudio(Call call) {

    }

    @Override
    public void onCallAlerting(Call call) {

    }

    @Override
    public void onVoicemail(Call call) {

    }

    @Override
    public void onMessageReceived(Call arg0, String arg1, Map<String, String> arg2) {

    }

    @Override
    public void onSIPInfoReceived(Call arg0, String arg1, String arg2, String arg3, Map<String, String> arg4) {

    }

	private void setOKResult(String message) {
        PluginResult result = new PluginResult(PluginResult.Status.OK, message);
        result.setKeepCallback(false);
        ZingayaPlugin.this.callbackContext.sendPluginResult(result);
    }
	
    private void setErrorResult(String message) {
        PluginResult result = new PluginResult(PluginResult.Status.ERROR, message);
        result.setKeepCallback(false);
        ZingayaPlugin.this.callbackContext.sendPluginResult(result);
    }

    private void logMessage(String message) {
        Log.i(TAG, message);
    }
}
