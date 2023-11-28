const express = require('express');
const app = express();
const ffmpeg = require('fluent-ffmpeg');
const command = ffmpeg();
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const fs = require('fs')
const whisper=require('whisper-nodejs');

app.use(cors({ origin: 'http://localhost:8000', optionsSuccessStatus: 200 }));
app.use(bodyParser.json({ limit: '50000000000000mb' })); // Adjust the limit as needed
app.use(bodyParser.urlencoded({ extended: true, limit: '50000000000000mb' }));
app.get('/', (req, res) => {
    console.log(__dirname);
    res.sendFile(path.join(__dirname, "/index.html"));
});

app.post('/videoEditor', (req, res) => {
    const startTime = 30;
    const endTime = 60;
    console.log(req.body);
    const { videoData } = req.body;

    const transcribe = async (audioFilepath) => {
        const model = await whisper.loadModel('en');
      
        // Read the audio file
        const audioBuffer = await fs.readFileSync(audioFilepath);
      
        // Transcribe the audio
        const transcription = await model.transcribe(audioBuffer);
        fs.writeFileSync('transcription.txt', transcription);
      
        console.log(transcription);
      };
      
      transcribe(videoData);

    command.input(videoData)
        .outputOptions([
            '-ss', startTime.toString(),
            '-to', endTime.toString(),
            '-c:v', 'copy',
            '-c:a', 'copy'
        ])
        .output(`./clip_${startTime}-${endTime}.mp4`)
        .on('progress', (progress) => {
            console.log(`Progress: ${progress.percent}%`);
        })
        .on('end', () => {
            console.log('FFmpeg command completed successfully.');
            res.status(200).send('Video editing completed!');
        })
        .on('error', (error) => {
            console.error('Error:', error);
            res.status(500).send('Video editing failed!');
        })
        .run(); // Execute the ffmpeg command
});

app.listen(8000, () => {
    console.log('Server is running on port 8000');
});
