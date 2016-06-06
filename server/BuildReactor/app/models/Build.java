package models;

import com.avaje.ebean.Model;

import javax.persistence.Entity;

/**
 * Created by r00fi0 on 6/2/16.
 */
@Entity
public class Build extends Model{

    private String server;
    private String outIpaName;
    private String uuid;
    private String progress;
    private boolean reAddPlatform;
    private boolean buildProject;
    private boolean uploadToDropbox;

    public String getServer() {
        return server;
    }

    public void setServer(String server) {
        this.server = server;
    }

    public String getOutIpaName() {
        return outIpaName;
    }

    public void setOutIpaName(String outIpaName) {
        this.outIpaName = outIpaName;
    }

    public String getUuid() {
        return uuid;
    }

    public void setUuid(String uuid) {
        this.uuid = uuid;
    }

    public String getProgress() {
        return progress;
    }

    public void setProgress(String progress) {
        this.progress = progress;
    }

    public boolean isReAddPlatform() {
        return reAddPlatform;
    }

    public void setReAddPlatform(boolean reAddPlatform) {
        this.reAddPlatform = reAddPlatform;
    }

    public boolean isBuildProject() {
        return buildProject;
    }

    public void setBuildProject(boolean buildProject) {
        this.buildProject = buildProject;
    }

    public boolean isUploadToDropbox() {
        return uploadToDropbox;
    }

    public void setUploadToDropbox(boolean uploadToDropbox) {
        this.uploadToDropbox = uploadToDropbox;
    }
}
