
if( 'function' === typeof importScripts) {
    importScripts('./wave-resampler/wave-resampler.js')
 }

addEventListener('message', event => {
    if(event["data"] != null) {
        let sourceSampleRate = event["data"]["sourceSampleRate"]
        let targetSampleRate = event["data"]["targetSampleRate"]
        let audioChunk = event["data"]["audioChunk"];

        // Resample audio if not already in required sample rate
        if( sourceSampleRate !== targetSampleRate ) {
            audioChunk = waveResampler.resample(audioChunk, sourceSampleRate, targetSampleRate)
        }

        // Convert to 16bit little endian encoding
        let audioDataArray16b = floatTo16BitPCM(audioChunk);

        // Call callback given by the user on each processed audio chunk.
        postMessage(audioDataArray16b)
    }
    
});

function floatTo16BitPCM (input) {
    // Each 32bit (4byte) float from input is converted to one 16bit (2byte) integer.
    // Each element needs 2 bytes
    if (input != null) {
        let buffer = new ArrayBuffer(input.length * 2);

        // Define view to raw buffer so we can set values as int16.
        let view = new DataView(buffer);

        for (let i = 0; i < input.length; i++) {
            // Limit input to [-1, -1]
            const s = Math.max(-1, Math.min(1, input[i]));

            // Convert float32 to int16 and force little endian
            view.setInt16(2 * i, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        }

        return buffer;
    }
    return null;
    
}