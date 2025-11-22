import type { RtpCodecCapability, WorkerLogLevel, WorkerLogTag } from 'mediasoup/types';
export declare const mediasoupConfig: {
    worker: {
        rtcMinPort: number;
        rtcMaxPort: number;
        logLevel: WorkerLogLevel;
        logTags: WorkerLogTag[];
    };
    router: {
        mediaCodecs: RtpCodecCapability[];
    };
    webRtcTransport: {
        listenIps: {
            ip: string;
            announcedIp: string;
        }[];
        maxIncomingBitrate: number;
        initialAvailableOutgoingBitrate: number;
    };
};
