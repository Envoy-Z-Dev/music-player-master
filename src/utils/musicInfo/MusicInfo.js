import { decode, encode } from 'base-64';
import RNFS from 'react-native-fs'; // Use react-native-fs instead of expo-file-system
import Buffer from './Buffer';
import MusicInfoResponse from './MusicInfoResponse';

const BUFFER_SIZE = 256 * 1024;

const EMPTY = '';
const ID3_TOKEN = 'ID3';
const TITLE_TOKEN = 'TIT2';
const ARTIST_TOKEN = 'TPE1';
const ALBUM_TOKEN = 'TALB';
const GENRE_TOKEN = 'TCON';
const PICTURE_TOKEN = 'APIC';

class MusicInfo {
    static async getMusicInfoAsync(fileUri, options) {
        let loader = new MusicInfoLoader(fileUri, options);
        let result = await loader.loadInfo();
        return result;
    }
}

class MusicInfoLoader {
    constructor(fileUri, options) {
        this.fileUri = fileUri;
        this.expectedFramesNumber = 0;

        this.options = options ? {
            title: options.title !== undefined ? options.title : true,
            artist: options.artist !== undefined ? options.artist : true,
            album: options.album !== undefined ? options.album : true,
            genre: options.genre !== undefined ? options.genre : false,
            picture: options.picture !== undefined ? options.picture : false
        } : {
            title: true,
            artist: true,
            album: true,
            genre: false,
            picture: false
        };

        if (this.options.title) this.expectedFramesNumber++;
        if (this.options.artist) this.expectedFramesNumber++;
        if (this.options.album) this.expectedFramesNumber++;
        if (this.options.genre) this.expectedFramesNumber++;
        if (this.options.picture) this.expectedFramesNumber++;

        this.buffer = new Buffer();
        this.filePosition = 0;
        this.dataSize = 0;
        this.frames = {};
        this.version = 0;
        this.finished = false;
    }

    async loadFileToBuffer() {
        const data = await RNFS.readFile(this.fileUri, 'base64', { encoding: 'base64' });
        this.buffer.setData(Uint8Array.from(decode(data), c => c.charCodeAt(0)));
        this.filePosition += BUFFER_SIZE;
    }

    async loadInfo() {
        const info = await RNFS.stat(this.fileUri);
        this.dataSize = info.size;
        
        try {
            await this.process();

            let result = new MusicInfoResponse();
            if (this.options.title && this.frames[TITLE_TOKEN]) result.title = this.frames[TITLE_TOKEN];
            if (this.options.artist && this.frames[ARTIST_TOKEN]) result.artist = this.frames[ARTIST_TOKEN];
            if (this.options.album && this.frames[ALBUM_TOKEN]) result.album = this.frames[ALBUM_TOKEN];
            if (this.options.genre && this.frames[GENRE_TOKEN]) result.genre = this.frames[GENRE_TOKEN];
            if (this.options.picture && this.frames[PICTURE_TOKEN]) result.picture = this.frames[PICTURE_TOKEN];
            
            return result;

        } catch (e) {
            if (e instanceof InvalidFileException) return null;
            else throw e;
        }
    }

    async process() {
        await this.processHeader();
        
        while (!this.finished) await this.processFrame();
    }

    async skip(length) {
        let remaining = length;
        
        while (remaining > 0) {
            if (this.buffer.finished()) {
                if (this.filePosition >= this.dataSize) {
                    this.finished = true;
                    break;
                }
                await this.loadFileToBuffer();
                remaining -= BUFFER_SIZE; // Adjust remaining length after loading
            } else {
                remaining -= this.buffer.move(remaining);
            }
        }
    }

    async read(length) {
        const chunk = [];
        
        for (let i = 0; i < length; i++) {
            if (this.buffer.finished()) {
                if (this.filePosition >= this.dataSize) {
                    this.finished = true;
                    break;
                }
                await this.loadFileToBuffer();
            }
            chunk.push(this.buffer.getByte());
        }
        
        return chunk;
    }

    async readUntilEnd() {
        let byte;
        const chunk = [];
        
        do {
            if (this.buffer.finished()) {
                if (this.filePosition >= this.dataSize) {
                    this.finished = true;
                    break;
                }
                await this.loadFileToBuffer();
            }
            
            byte = this.buffer.getByte();
            chunk.push(byte);
            
        } while (byte !== 0);
        
        return chunk;
    }

    async processHeader() {
        const chunk = await this.read(3);
        
        const token = this.bytesToString(chunk);
        
        if (token !== ID3_TOKEN) throw new InvalidFileException();

        const versionChunk = await this.read(2);
        
        this.version = this.bytesToInt([versionChunk[0]]);

        await this.skip(1);

        const sizeChunk = await this.read(4);
        
        let size = 0;
        
        for (let i = 0; i < sizeChunk.length; i++) {
            size |= sizeChunk[sizeChunk.length - i - 1] << i * 7;
        }
        
        this.dataSize = size;
    }

    async processFrame() {
        const chunk = await this.read(4);
        
        const frameID = this.bytesToString(chunk);

        if (frameID === EMPTY) 
            this.finished = true;
         else {
             const frameSizeChunk = await this.read(4);
             const frameSize = this.bytesToSize(frameSizeChunk);

             await this.skip(2); // Skip flags

             switch (frameID) {
                 case TITLE_TOKEN:
                     if (this.options.title)
                         await this.processTextFrame(frameID, frameSize);
                     else
                         await this.skip(frameSize);
                     break;

                 case ARTIST_TOKEN:
                     if (this.options.artist)
                         await this.processTextFrame(frameID, frameSize);
                     else
                         await this.skip(frameSize);
                     break;

                 case ALBUM_TOKEN:
                     if (this.options.album)
                         await this.processTextFrame(frameID, frameSize);
                     else
                         await this.skip(frameSize);
                     break;

                 case GENRE_TOKEN:
                     if (this.options.genre)
                         await this.processTextFrame(frameID, frameSize);
                     else
                         await this.skip(frameSize);
                     break;

                 case PICTURE_TOKEN:
                     if (this.options.picture)
                         await this.processPictureFrame(frameSize);
                     else
                         await this.skip(frameSize);
                     break;

                 default:
                     await this.skip(frameSize);
                     break;
             }

             // Check if all expected frames have been processed
             if (Object.keys(this.frames).length === this.expectedFramesNumber)
                 this.finished = true;
         }
     }

     bytesToString(bytes, encoding='utf-8') {
         return decodeBytes(bytes, encoding); // Use the decodeBytes method directly
     }

     async processTextFrame(frameID, frameSize) {
         // Read encoding byte
         const encodingByte = await this.read(1);

         let encoding;

         switch (encodingByte[0]) {
             case 0x00:
                 encoding = 'iso-8859-1';
                 break;

             case 0x01:
                 encoding = 'utf-16';
                 break;

             case 0x02:
                 encoding = 'utf-16be';
                 break;

             case 0x03:
                 encoding = 'utf-8';
                 break;

             default:
                 encoding = 'iso-8859-1'; // Fallback to default encoding
         }

         let remainingLength = frameSize - 1; // Subtract the encoding byte length
         let chunkData = await this.read(remainingLength);

         let valueDecoded = decodeBytes(chunkData, encoding); // Decode the bytes

         // Trim whitespace from the value
         valueDecoded.trim();

         // Store the decoded value in frames
         if (!this.frames[frameID]) { 
             // Initialize the frame entry only when needed
             console.log(`Storing ${frameID}: ${valueDecoded}`);
             // Store the decoded value in frames under its ID
             Object.assign(this.frames, { [frameID]: valueDecoded });
         }
     }

     decodeBytes(bytes, encoding) {
         let decodedString;

         switch (encoding) {
             case 'iso-8859-1':
                 decodedString = String.fromCharCode.apply(null, bytes);
                 break;

             case 'utf-8':
                 decodedString = decodeUTF8(bytes); // Use defined method to decode UTF-8 bytes
                 break;

             case 'utf-16':
                 decodedString= decodeUTF16(bytes); // Use defined method to decode UTF-16 bytes
                 break;

             case 'utf-16be':
                 decodedString= decodeUTF16BE(bytes); // Use defined method to decode UTF-16BE bytes
                 break;

             default:
                 decodedString= String.fromCharCode.apply(null, bytes); // Fallback decoding
         }

         return decodedString.replace(/[^\x20-\x7E\u4E00-\u9FFF、，]/g, '');
     }

     decodeUTF8(bytes) { /* ... */ } // Keep existing implementation

     decodeUTF16(bytes) { /* ... */ } // Keep existing implementation

     decodeUTF16LE(bytes) { /* ... */ } // Keep existing implementation

     decodeUTF16BE(bytes) { /* ... */ } // Keep existing implementation

     async processPictureFrame(frameSize) { /* ... */ } // Keep existing implementation

     bytesToInt(bytes) { /* ... */ } // Keep existing implementation

     bytesToSize(bytes) { /* ... */ } // Keep existing implementation

     bytesToBase64(bytes) { /* ... */ } // Keep existing implementation
}

class InvalidFileException extends Error {
    constructor() {
       super('Invalid file format.');
       Object.setPrototypeOf(this, InvalidFileException.prototype); 
       // Set prototype explicitly to maintain proper instanceof checks.
   }
}

export default MusicInfo; 
