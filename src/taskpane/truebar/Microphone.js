// Aliases
window.AudioContext = window.AudioContext || window.webkitAudioContext;
window.OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
AudioContext.prototype.createScriptProcessor = AudioContext.prototype.createScriptProcessor || AudioContext.prototype.createJavaScriptNode;

export function Microphone () {

    // Check if WebAudio library is supported by the browser
    if (!navigator || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw "Your browser does not support WebAudio!";

    // **** INIT ****
    this.audioContext   =       undefined;
    this.sourceNode     =       undefined;
    this.scriptNode     =       undefined;
    this.worker         =       undefined;


    /** Initializes the object by asking user to select microphone. */
    this.initMicrophone = async function(targetSampleRate, chunkSize, callback){
        try {
            // Initialize audio context and suspend (pause) recording
            // Sampling rate parameter does not work on all browsers. That is why browser check is required
            if( navigator.userAgent.includes("Chrome") || navigator.userAgent.includes("Microsoft Edge") ) {
                this.audioContext = new window.AudioContext({ sampleRate: targetSampleRate });
            } else {
                this.audioContext = new window.AudioContext();
            }
            await this.lockAudio();

            // Select microphone as source node
            let stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            this.sourceNode = this.audioContext.createMediaStreamSource(stream);

            // Create WebWorker which is used to process each audio chunk in separate thread
            
            this.worker = new Worker('scripts/AudioChunkProcessor.js')
            this.worker.addEventListener( "message", (e) => {
                callback(e["data"])
            });

            // Create audio processor node to send audio chunks to AudioProcessor (WebWorker) and register callback for processed chunks
            this.scriptNode = this.audioContext.createScriptProcessor(chunkSize, 1, 1);
            this.scriptNode.onaudioprocess = async (event) => {
                this.worker.postMessage( {
                    "sourceSampleRate" : this.audioContext.sampleRate,
                    "targetSampleRate" : targetSampleRate,
                    "audioChunk" : event.inputBuffer.getChannelData(0)
                } )
            }

            // Connect source (microphone) to scriptNode
            this.sourceNode.connect(this.scriptNode);

            // Connect script node to destination
            this.scriptNode.connect(this.audioContext.destination);

        } catch (exception) {
            throw "Error initializing microphone! -> " + exception;
        }
    }

    /** Unlock AudioContext. Must be called from inside user event! */
    this.unlockAudio = async function () {
        await this.audioContext.resume();
    }

    /** Lock AudioContext. Must be called from inside user event! */
    this.lockAudio = async function () {
        await this.audioContext.suspend();
    }
}
