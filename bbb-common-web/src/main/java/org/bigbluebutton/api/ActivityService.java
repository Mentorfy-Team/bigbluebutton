/**
 * BigBlueButton open source conferencing system - http://www.bigbluebutton.org/
 *
 * Copyright (c) 2012 BigBlueButton Inc. and by respective authors (see below).
 *
 * This program is free software; you can redistribute it and/or modify it under the
 * terms of the GNU Lesser General Public License as published by the Free Software
 * Foundation; either version 3.0 of the License, or (at your option) any later
 * version.
 *
 * BigBlueButton is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
 * PARTICULAR PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License along
 * with BigBlueButton; if not, see <http://www.gnu.org/licenses/>.
 *
 */

package org.bigbluebutton.api;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.io.File;
import java.io.FileOutputStream;

public class ActivityService {
    private static Logger log = LoggerFactory.getLogger(ActivityService.class);
    private static String activitiesDir = "/var/bigbluebutton/activities";

    public void writeActivityJsonFile(String meetingId, String activityJson) {
        this.createDirectory(new File(this.getDestinationBaseDirectoryName()));

        String jsonFileName = this.getDestinationBaseDirectoryName() + File.separatorChar + meetingId + ".json";
        File jsonFile = new File(jsonFileName);

        try {
            FileOutputStream fileOutput = new FileOutputStream(jsonFile);
            fileOutput.write(activityJson.getBytes());

            fileOutput.close();

            log.info("Activities JSON ({}) updated for meeting {}.",jsonFile.getAbsolutePath(),meetingId);
        } catch(Exception e) {
            System.out.println(e);
        }
    }

    private static void createDirectory(File directory) {
        if (!directory.exists())
            directory.mkdirs();
    }

    private String getDestinationBaseDirectoryName() {
        return activitiesDir;
    }

    public void setActivitiesDir(String dir) {
        activitiesDir = dir;
    }
}
