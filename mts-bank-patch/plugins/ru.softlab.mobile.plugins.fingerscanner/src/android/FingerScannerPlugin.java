package ru.softlab.mobile.plugins.fingerscanner;

import android.app.Activity;
import android.content.Context;
import android.security.KeyPairGeneratorSpec;
import android.util.Log;

import com.samsung.android.sdk.SsdkUnsupportedException;
import com.samsung.android.sdk.pass.Spass;
import com.samsung.android.sdk.pass.SpassFingerprint;

import org.apache.cordova.CordovaWebView;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.PluginResult;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.math.BigInteger;
import java.security.InvalidAlgorithmParameterException;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;
import java.util.Calendar;
import java.util.Date;

import javax.security.auth.x500.X500Principal;

/**
 * Created by kuricina on 01.06.2015.
 */
public class FingerScannerPlugin extends CordovaPlugin {

    public static final String TAG = FingerScannerPlugin.class.getSimpleName();
    private CallbackContext callbackContext;
    private String action;
    private JSONArray args;

    private Spass mSpass;
    private SpassFingerprint mSpassFingerprint;
    boolean isFeatureEnabled = false;
    private boolean onReadyIdentify = false;
    private boolean onReadyEnroll = false;

    private static String aliasKey = "mts_rsa_key";
    private static String filePath = "mts_userdata";

    private static final String TITLE_DIALOG = "Вход по отпечатку пальца";
    private static final String ERROR_TOUCH_ID_NOT_SUPPORTED = "TOUCH_ID_NOT_SUPPORTED";
    private static final String ERROR_FINGER_NOT_REGISTERED = "FINGER_NOT_REGISTERED";

    private Context getApplicationContext() {
        return this.webView.getContext();
    }

    private Activity getActivity() {
        return (Activity) this.webView.getContext();
    }

    /**
     * Constructor.
     */
    public FingerScannerPlugin() {
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

        if (action.equals("savePrivateData")) {

            this.cordova.setActivityResultCallback(this);
            this.callbackContext = callbackContext;
            PluginResult pluginResult = new PluginResult(PluginResult.Status.NO_RESULT);
            pluginResult.setKeepCallback(true);
            callbackContext.sendPluginResult(pluginResult);

            tryInitializePassSDK();
        } else if (action.equals("checkTouchID")) {

            this.cordova.setActivityResultCallback(this);
            this.callbackContext = callbackContext;
            PluginResult pluginResult = new PluginResult(PluginResult.Status.NO_RESULT);
            pluginResult.setKeepCallback(true);
            callbackContext.sendPluginResult(pluginResult);

            tryInitializePassSDK();
        } else if (action.equals("checkSupportTouchID")) {

            this.cordova.setActivityResultCallback(this);
            this.callbackContext = callbackContext;
            PluginResult pluginResult = new PluginResult(PluginResult.Status.NO_RESULT);
            pluginResult.setKeepCallback(true);
            callbackContext.sendPluginResult(pluginResult);

            // return true, if Fingerprint Service is supported in the device
            PluginResult result = new PluginResult(PluginResult.Status.OK, isInitializedPassSDK());
            result.setKeepCallback(false);
            FingerScannerPlugin.this.callbackContext.sendPluginResult(result);

        } else {
            setErrorResult("Wrong action!");
            return false;
        }
        return true;
    }

    private void setErrorResult(String message) {
        PluginResult result = new PluginResult(PluginResult.Status.ERROR, message);
        result.setKeepCallback(false);
        FingerScannerPlugin.this.callbackContext.sendPluginResult(result);
    }

    /*
     * Local methods
     */

    public void tryInitializePassSDK() {
        if (isInitializedPassSDK()) {
            if (hasRegisteredFinger()) {

                tryAuthenticate();

            } else {
                setErrorResult(ERROR_FINGER_NOT_REGISTERED);
            }
        } else {
            setErrorResult(ERROR_TOUCH_ID_NOT_SUPPORTED);
        }
    }

    public boolean isInitializedPassSDK() {
        mSpass = new Spass();
        try {
            mSpass.initialize(getActivity());
            isFeatureEnabled = mSpass.isFeatureEnabled(Spass.DEVICE_FINGERPRINT);

            if (isFeatureEnabled) {
                mSpassFingerprint = new SpassFingerprint(getActivity());
                Log.d(TAG, "Fingerprint Service is supported in the device.");
                Log.d(TAG, "SDK version : " + mSpass.getVersionName());

                return true;
            } else {
                Log.d(TAG, "Fingerprint Service is not supported in the device.");
            }
        } catch (SsdkUnsupportedException e) {
            Log.d(TAG, e.getMessage(), e);
        } catch (UnsupportedOperationException e) {
            Log.d(TAG, "Fingerprint Service is not supported in the device : " + e.getMessage());
        }
        return false;
    }

    public boolean hasRegisteredFinger() {
        return mSpassFingerprint.hasRegisteredFinger();
    }

    public void tryAuthenticate() {
        showIdentifyDialog();
    }

    public void showIdentifyDialog() {
        if (onReadyIdentify == false) {
            onReadyIdentify = true;
            try {
                mSpassFingerprint.setDialogTitle(TITLE_DIALOG, 0);
                mSpassFingerprint.startIdentifyWithDialog(getActivity(), listener, false);
                Log.d(TAG, "Please identify finger to verify you");
            } catch (IllegalStateException e) {
                onReadyIdentify = false;
                Log.d(TAG, "Exception: " + e.getMessage());
                setErrorResult(e.getMessage());
            }
        } else {
            Log.d(TAG, "Please cancel Identify first");
            setErrorResult("Please cancel Identify first");
        }
    }

    private static String TAG_IL = "SpassFingerprint.IdentifyListener";
    private SpassFingerprint.IdentifyListener listener = new SpassFingerprint.IdentifyListener() {
        @Override
        public void onFinished(int eventStatus) {
            Log.d(TAG_IL, "Identify finished : reason " + getEventStatusName(eventStatus));
            onReadyIdentify = false;
            int FingerprintIndex = 0;
            try {
                FingerprintIndex = mSpassFingerprint.getIdentifiedFingerprintIndex();
            } catch (IllegalStateException ise) {
                Log.d(TAG_IL, ise.getMessage());
                setErrorResult(TAG_IL + " : " + ise.getMessage());
            }
            if (eventStatus == SpassFingerprint.STATUS_AUTHENTIFICATION_SUCCESS) {
                Log.d(TAG_IL, "Identify authentification Success with FingerprintIndex : " + FingerprintIndex);

                if (action.equals("savePrivateData")) {
                    try {
                        JSONObject obj = args.getJSONObject(0);
                        saveUserData(obj);
                    } catch (JSONException e) {
                        e.printStackTrace();
                        setErrorResult("Getting args : " + e.getMessage());
                    }
                } else if (action.equals("checkTouchID")) {
                    if (getSizeKeyStore() > 0) {
                        decriptData();
                    } else {
                        setErrorResult("This action can not be perfomed..");
                    }
                } else {
                    setErrorResult("Identify authentification Success. Undefined error!");
                }
            } else if (eventStatus == SpassFingerprint.STATUS_AUTHENTIFICATION_PASSWORD_SUCCESS) {
                Log.d(TAG_IL, "Password authentification Success");
            } else {
                Log.d(TAG_IL, "Authentification Fail for identify : " + getEventStatusName(eventStatus));
                setErrorResult(getEventStatusName(eventStatus));
            }
        }

        @Override
        public void onReady() {
            Log.d(TAG_IL, "Identify state is ready");
        }

        @Override
        public void onStarted() {
            Log.d(TAG_IL, "User touched fingerprint sensor!");
        }
    };

    private static String TAG_RL = "SpassFingerprint.RegisterListener";
    private SpassFingerprint.RegisterListener mRegisterListener = new SpassFingerprint.RegisterListener() {

        @Override
        public void onFinished() {
            onReadyEnroll = false;
            Log.d(TAG_RL, "RegisterListener.onFinished()");

            PluginResult result = new PluginResult(PluginResult.Status.OK);
            result.setKeepCallback(false);
            FingerScannerPlugin.this.callbackContext.sendPluginResult(result);
        }
    };

    private static String getEventStatusName(int eventStatus) {
        switch (eventStatus) {
            case SpassFingerprint.STATUS_AUTHENTIFICATION_SUCCESS:
                return "STATUS_AUTHENTIFICATION_SUCCESS";
            case SpassFingerprint.STATUS_AUTHENTIFICATION_PASSWORD_SUCCESS:
                return "STATUS_AUTHENTIFICATION_PASSWORD_SUCCESS";
            case SpassFingerprint.STATUS_TIMEOUT_FAILED:
                return "STATUS_TIMEOUT";
            case SpassFingerprint.STATUS_SENSOR_FAILED:
                return "STATUS_SENSOR_ERROR";
            case SpassFingerprint.STATUS_USER_CANCELLED:
                return "STATUS_USER_CANCELLED";
            case SpassFingerprint.STATUS_QUALITY_FAILED:
                return "STATUS_QUALITY_FAILED";
            case SpassFingerprint.STATUS_USER_CANCELLED_BY_TOUCH_OUTSIDE:
                return "STATUS_USER_CANCELLED_BY_TOUCH_OUTSIDE";
            case SpassFingerprint.STATUS_AUTHENTIFICATION_FAILED:
            default:
                return "STATUS_AUTHENTIFICATION_FAILED";
        }
    }

    public void saveUserData(JSONObject data) {
        try {
            generatingNewPrivateKey();
            encriptData(data);
        } catch (Exception e) {
            Log.e(TAG, e.getMessage(), e);
            setErrorResult("Failed to save data..");
        }
    }

    public void encriptData(JSONObject data) {
        String encriptedData = Crypto.encryptRsaOaep(data.toString(), aliasKey);
        try {
            writeFile(encriptedData.getBytes("UTF-8"), filePath);
            Log.i(TAG, "Successful saving a private data");
            PluginResult result = new PluginResult(PluginResult.Status.OK, "Successful saving a private data");
            result.setKeepCallback(false);
            FingerScannerPlugin.this.callbackContext.sendPluginResult(result);
        } catch (IOException e) {
            e.printStackTrace();
            setErrorResult(e.getMessage());
        }
    }

    public void decriptData() {
        JSONObject privateData = null;
        try {
            String encryptedData = new String(readFromFile(filePath));
            String decryptedData = Crypto.decryptRsaOaep(encryptedData, aliasKey);
            privateData = new JSONObject(decryptedData);
            if (action.equals("checkTouchID")) {
                Log.i(TAG, "Successful getting a private data");
                PluginResult result = new PluginResult(PluginResult.Status.OK, privateData);
                result.setKeepCallback(false);
                FingerScannerPlugin.this.callbackContext.sendPluginResult(result);
            } else {
                PluginResult result = new PluginResult(PluginResult.Status.ERROR, "Wrong action!");
                result.setKeepCallback(false);
                FingerScannerPlugin.this.callbackContext.sendPluginResult(result);
            }
        } catch (Exception e) {
            e.printStackTrace();
            setErrorResult(e.getMessage());
        }
    }

    private void generatingNewPrivateKey() {
    	/*
    	 * Generate a new entry in the KeyStore by using the
    	 * KeyPairGenerator API. We have to specify the attributes for a
    	 * self-signed X.509 certificate here so the KeyStore can attach
    	 * the public key part to it. It can be replaced later with a
    	 * certificate signed by a Certificate Authority (CA) if needed.
    	 */
        Calendar cal = Calendar.getInstance();
        Date now = cal.getTime();
        cal.add(Calendar.YEAR, 1);
        Date end = cal.getTime();

        KeyPairGenerator kpg;
        try {
            kpg = KeyPairGenerator.getInstance("RSA", "AndroidKeyStore");
            kpg.initialize(new KeyPairGeneratorSpec.Builder(getApplicationContext())
                    .setAlias(aliasKey)
                    .setStartDate(now)
                    .setEndDate(end)
                    .setSerialNumber(BigInteger.valueOf(1))
                    .setSubject(new X500Principal("CN=InternalCertificate"))
                    .build());
            KeyPair kp = kpg.generateKeyPair();
        } catch (NoSuchAlgorithmException e) {
            Log.e(TAG, e.getMessage(), e);
        } catch (NoSuchProviderException e) {
            Log.e(TAG, e.getMessage(), e);
        } catch (InvalidAlgorithmParameterException e) {
            Log.e(TAG, e.getMessage(), e);
        }
    }

    private int getSizeKeyStore() {
        KeyStore ks;
        KeyStore.Entry entry = null;
        try {
            ks = KeyStore.getInstance("AndroidKeyStore");
            ks.load(null);
            return ks.size();
        } catch (Exception e) {
            Log.e(TAG, e.getMessage(), e);
        }
        return 0;
    }

    private void writeFile(byte[] data, String fileName) throws IOException{
        File file = new File(getApplicationContext().getFilesDir(), fileName);
        try {
            file.createNewFile();
            FileOutputStream fos = new FileOutputStream(file);
            fos.write(data);
            fos.close();
        } catch (IOException e) {
            e.printStackTrace();
            setErrorResult("writeFile : " + e.getMessage());
        }
    }

    private byte[] readFromFile(String filePath) {
        File file = new File(getApplicationContext().getFilesDir(), filePath);
        int length = (int) file.length();
        byte[] bytes = new byte[length];

        FileInputStream fin = null;
        try {
            fin = new FileInputStream(file);
            fin.read(bytes);
        } catch (FileNotFoundException e) {
            setErrorResult("readFromFile : " + e.getMessage());
        } catch (IOException e) {
            setErrorResult("readFromFile : " + e.getMessage());
        } finally {
            try {
                if (fin != null) {
                    fin.close();
                }
            } catch (IOException ioe) {
                setErrorResult("readFromFile : " + ioe.getMessage());
            }
        }
        return bytes;
    }
}
