package models;

import com.avaje.ebean.Model;

import javax.persistence.Entity;
import java.io.File;

/**
 * Created by r00fi0 on 6/2/16.
 */
@Entity
public class Profile extends Model{
    private String uuid;
    private String name;
    private File file;


    public String getUuid() {
        return uuid;
    }

    public void setUuid(String uuid) {
        this.uuid = uuid;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public File getFile() {
        return file;
    }

    public void setFile(File file) {
        this.file = file;
    }
}
