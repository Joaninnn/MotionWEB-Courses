import React from "react";
import Upload from "./mentorSection/Upload/Upload";
import UploadedVideos from "./mentorSection/UploadedVideos/UploadedVideos";

function Mentor() {
    return (
        <div>
            <Upload />
            <UploadedVideos />
        </div>
    );
}

export default Mentor;
