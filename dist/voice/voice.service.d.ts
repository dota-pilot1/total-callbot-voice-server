import { RoomManager } from './room.manager';
import type { DtlsParameters, MediaKind, RtpCapabilities, RtpParameters } from 'mediasoup/types';
export declare class VoiceService {
    private readonly roomManager;
    private readonly logger;
    constructor(roomManager: RoomManager);
    onModuleInit(): Promise<void>;
    getRouterRtpCapabilities(): Promise<RtpCapabilities>;
    joinRoom(roomId: string, peerId: string, userId: number, userName: string): Promise<{
        rtpCapabilities: RtpCapabilities;
    }>;
    getUserName(roomId: string, peerId: string): string;
    createWebRtcTransport(roomId: string, peerId: string): Promise<{
        id: string;
        iceParameters: import("mediasoup/types").IceParameters;
        iceCandidates: import("mediasoup/types").IceCandidate[];
        dtlsParameters: DtlsParameters;
    }>;
    connectWebRtcTransport(roomId: string, peerId: string, transportId: string, dtlsParameters: DtlsParameters): Promise<void>;
    produce(roomId: string, peerId: string, transportId: string, kind: MediaKind, rtpParameters: RtpParameters): Promise<{
        producerId: string;
        otherPeerIds: string[];
    }>;
    consume(roomId: string, peerId: string, transportId: string, producerId: string, rtpCapabilities: RtpCapabilities): Promise<{
        id: string;
        producerId: string;
        kind: MediaKind;
        rtpParameters: RtpParameters;
    }>;
    resumeConsumer(roomId: string, peerId: string, consumerId: string): Promise<{
        resumed: boolean;
    }>;
    leaveRoom(roomId: string, peerId: string): Promise<void>;
    closeProducer(roomId: string, peerId: string, producerId: string): Promise<void>;
    getProducers(roomId: string, peerId: string): {
        peerId: string;
        producerId: string;
        userName: string;
        kind: MediaKind;
    }[];
}
