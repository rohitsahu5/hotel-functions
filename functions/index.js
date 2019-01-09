const functions = require("firebase-functions");
const {
    Storage
} = require('@google-cloud/storage');
const gcs = new Storage({
    // config...
});
const os = require('os');
const path = require('path');
const spawn = require('child-process-promise').spawn;

exports.onFileChange = functions.storage.object().onFinalize((object) => {
    const bucket = object.bucket;
    const contentType = object.contentType;
    const filePath = object.name;
    if (path.basename(filePath).startsWith('Complaint-')) {
        return; //do nothing
    }

    const destBucket = gcs.bucket(bucket);
    const tmpFilePath = path.join(os.tmpdir(), path.basename(filePath));
    const metadata = {
        contentType: contentType
    };
    return destBucket.file(filePath).download({
        destination: tmpFilePath
    }).then(() => {
        return spawn('convert', [tmpFilePath, '-resize', '700x700', tmpFilePath]);
    }).then(() => {
        return destBucket.upload(tmpFilePath, {
            destination: 'Complaint-' + path.basename(filePath),
            metadata: metadata
        })
    }).then(() => {
        return destBucket.file(filePath).delete()
    });
});