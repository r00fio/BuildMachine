package ru.softlab.mobile.plugins.fingerscanner;

import org.spongycastle.crypto.Digest;
import org.spongycastle.crypto.InvalidCipherTextException;
import org.spongycastle.crypto.digests.SHA512Digest;
import org.spongycastle.crypto.encodings.OAEPEncoding;

import java.io.UnsupportedEncodingException;

/**
 * Created by kuricina on 09.12.2015.
 */
public class Crypto {
    public static String encryptRsaOaep(String dataStr, String keyAlias) {
        try {
            AndroidRsaEngine rsa = new AndroidRsaEngine(keyAlias, false);
            Digest digest = new SHA512Digest();
            Digest mgf1digest = new SHA512Digest();
            OAEPEncoding oaep = new OAEPEncoding(rsa, digest, mgf1digest, null);
            oaep.init(true, null);
            byte[] plainBytes = dataStr.getBytes("UTF-8");
            byte[] cipherText = oaep.processBlock(plainBytes, 0,
                    plainBytes.length);

            return toBase64(cipherText);
        } catch (UnsupportedEncodingException e) {
            throw new RuntimeException(e);
        } catch (InvalidCipherTextException e) {
            throw new RuntimeException(e);
        }
    }

    public static String decryptRsaOaep(String ciphertext, String keyAlias) {
        try {
            AndroidRsaEngine rsa = new AndroidRsaEngine(keyAlias, false);

            Digest digest = new SHA512Digest();
            Digest mgf1digest = new SHA512Digest();
            OAEPEncoding oaep = new OAEPEncoding(rsa, digest, mgf1digest, null);
            oaep.init(false, null);

            byte[] ciphertextBytes = fromBase64(ciphertext);
            byte[] data = oaep.processBlock(ciphertextBytes, 0,
                    ciphertextBytes.length);

            return new String(data, "UTF-8");
        } catch (UnsupportedEncodingException e) {
            throw new RuntimeException(e);
        } catch (InvalidCipherTextException e) {
            throw new RuntimeException(e);
        }
    }

    public static String toHex(byte[] bytes) {
        StringBuffer buff = new StringBuffer();
        for (byte b : bytes) {
            buff.append(String.format("%02X", b));
        }

        return buff.toString();
    }

    public static String toBase64(byte[] bytes) {
        return Base64.encodeToString(bytes, Base64.NO_WRAP);
    }

    public static byte[] fromBase64(String base64) {
        return Base64.decode(base64, Base64.NO_WRAP);
    }
}
