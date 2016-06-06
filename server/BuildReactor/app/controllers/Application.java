package controllers;

import com.google.inject.Inject;
import javafx.util.Pair;
import models.Build;
import models.Profile;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import play.data.Form;
import play.data.FormFactory;
import play.mvc.*;

import views.html.*;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static play.libs.Json.toJson;

/**
 * Created by r00fi0 on 6/1/16.
 */
public class Application extends Controller {
    @Inject
    private FormFactory formFactory;
    private Map<String, Profile> profiles = new HashMap<>();
    final static private Build progress = new Build();
    static {
        progress.setProgress("0%");
    }
    public Result progress() {

        return ok(progress.getProgress());
    }

    public Result profiles() {

        if (profiles.isEmpty()) {


            File actual = new File(System.getProperty("user.home") + "/Library/MobileDevice/Provisioning Profiles");

            for (File f : actual.listFiles()) {
                Document xmlDoc = null;
                try {
                    xmlDoc = Jsoup.parse(f, "UTF-8");
                } catch (IOException e) {
                    e.printStackTrace();
                }

                Elements links = xmlDoc.select("key");
                Profile profile = new Profile();

                links.forEach((el) -> {
                    if ("Name".equals(el.text())) {
                        Element element = el.nextElementSibling();
                        profile.setName(element.text());

                    }
                    if ("UUID".equals(el.text())) {
                        Element element = el.nextElementSibling();
                        profile.setUuid(element.text());
                        profile.setFile(f);
                        profiles.put(profile.getUuid(), profile);
                    }
                });

            }
        }
        return ok(toJson(profiles.values()));
    }

    public Result build() {
        Build build = formFactory.form(Build.class).bindFromRequest().get();
        String msg = "Your build is ready.";

        try {
            ProcessBuilder pb = new ProcessBuilder("bash",
                    new File("/Users/r00fi0/Work/buildmachine/build").toString(),
                    "-s" + build.getServer(),
                    "-n" + build.getOutIpaName(),
                    "-u" + build.getUuid(),
                    "-a" + build.isReAddPlatform(),
                    "-b" + build.isBuildProject(),
                    "-e" + build.isUploadToDropbox(),
                    "");
            pb.redirectErrorStream();
            Process process = pb.start();
            new Thread(() -> {
                InputStream inputStream = process.getInputStream();
                try {
                    while (true) {
                        if (inputStream.available() > 0) {
                            byte[] out = new byte[inputStream.available()];
                            inputStream.read(out);
                            String status = new String(out);
                            System.out.println("MESSAGE " + status);
                            if (status.contains("_STATUS_=GREEN")) {
                                progress.setProgress(status.replace("_STATUS_=GREEN ", "").substring(0,2)+"%");
                            }
                        }
                    }
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }).start();
            process.waitFor();
            progress.setProgress("0%");
            InputStream errorStream = process.getErrorStream();
            if (errorStream.available() > 0) {
                byte[] out = new byte[errorStream.available()];
                errorStream.read(out);
                String err = new String(out);
                if (!err.contains("IDEDistributionLogging")) {
                    msg = "Build Failed. See logs for details";
                }
                System.out.println("ERROR " + err);
            }
        } catch (InterruptedException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
        return ok(index.render(msg));
    }

    public Result index() {
        return ok(index.render(""));
    }
}
