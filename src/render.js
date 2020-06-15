const videoElement = document.querySelector("video")
const startRec = document.getElementById("startRec")
const stopRec = document.getElementById("stopRec")
const videoSelectBtn = document.getElementById("videoSelectBtn")
videoSelectBtn.onclick = getVideoSources;

const {desktopCapturer, remote} = require("electron")
const {Menu, dialog} = remote;
const {writeFile} = require("fs");
let mediaRecorder;
var recordedChunks = [];

startRec.onclick = () => {
    mediaRecorder.start();
    startRec.innerText = "Recording..."
};

stopRec.onclick = () => {
    mediaRecorder.stop();
    startRec.innerText = 'Start';
};

async function getVideoSources() {
    const inpSources = await desktopCapturer.getSources({
        types: ['window', 'screen']
    });
    console.log(inpSources)
    const videoOptionsMenu = Menu.buildFromTemplate(
        inpSources.map(source => {
            return {
                label: source.name,
                click: () => selectSource(source)
            };
        })
    );

    videoOptionsMenu.popup();
}

async function selectSource(source) {
    videoSelectBtn.innerText = source.name;

    const constraints = {
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: source.id,
            minWidth: 1280,
            maxWidth: 1280,
            minHeight: 720,
            maxHeight: 720
          }
        }
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    videoElement.srcObject = stream;
    videoElement.play();

    var options = { mimeType: "video/webm; codecs=vp9" };
    mediaRecorder = new MediaRecorder(stream, options);

    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop
}

function handleDataAvailable(event) {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
      console.log(recordedChunks);
    } else {
      console.log("Recording stopped unexpectedly")
    }
}

async function handleStop(event) {
    var blob = new Blob(recordedChunks, {
        type: "video/webm; codec:vp9"
    });
    
    const buffer = Buffer.from(await blob.arrayBuffer());

    const {filePath} = await dialog.showSaveDialog({
        buttonLabel: "Save File",
        defaultPath: `vid-${Date.now()}.mp4`
    })

    if (filePath) {
        writeFile(filePath, buffer, () => console.log('video saved successfully!'));
    }
    else {
        console.log("filepath error")
    }

}