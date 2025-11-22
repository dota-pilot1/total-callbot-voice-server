"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediasoupConfig = void 0;
exports.mediasoupConfig = {
    worker: {
        rtcMinPort: 10000,
        rtcMaxPort: 10100,
        logLevel: 'warn',
        logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'],
    },
    router: {
        mediaCodecs: [
            {
                kind: 'audio',
                mimeType: 'audio/opus',
                clockRate: 48000,
                channels: 2,
            },
        ],
    },
    webRtcTransport: {
        listenIps: [
            {
                ip: '0.0.0.0',
                announcedIp: '127.0.0.1',
            },
        ],
        maxIncomingBitrate: 1500000,
        initialAvailableOutgoingBitrate: 1000000,
    },
};
//# sourceMappingURL=mediasoup.config.js.map