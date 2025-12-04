import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { VoiceService } from './voice.service';
import type { DtlsParameters, MediaKind, RtpCapabilities, RtpParameters } from 'mediasoup/types';
export declare class VoiceGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly voiceService;
    server: Server;
    private readonly logger;
    private socketToRoom;
    constructor(voiceService: VoiceService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleGetRouterRtpCapabilities(client: Socket, data: any, callback?: (response: any) => void): Promise<{
        rtpCapabilities: RtpCapabilities;
    } | {
        error: any;
    }>;
    handleJoinRoom(data: {
        roomId: string;
        userId?: number;
        userName?: string;
    }, client: Socket): Promise<{
        success: boolean;
        rtpCapabilities: RtpCapabilities;
        existingProducers: {
            peerId: string;
            producerId: string;
            userName: string;
            kind: MediaKind;
        }[];
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        rtpCapabilities?: undefined;
        existingProducers?: undefined;
    }>;
    handleCreateTransport(data: {
        roomId: string;
    }, client: Socket): Promise<{
        id: string;
        iceParameters: import("mediasoup/types").IceParameters;
        iceCandidates: import("mediasoup/types").IceCandidate[];
        dtlsParameters: DtlsParameters;
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    handleConnectTransport(data: {
        roomId: string;
        transportId: string;
        dtlsParameters: DtlsParameters;
    }, client: Socket): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    handleProduce(data: {
        roomId: string;
        transportId: string;
        kind: MediaKind;
        rtpParameters: RtpParameters;
    }, client: Socket): Promise<{
        success: boolean;
        producerId: string;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        producerId?: undefined;
    }>;
    handleCloseProducer(data: {
        roomId: string;
        producerId: string;
    }, client: Socket): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    handleConsume(data: {
        roomId: string;
        transportId: string;
        producerId: string;
        rtpCapabilities: RtpCapabilities;
    }, client: Socket): Promise<{
        id: string;
        producerId: string;
        kind: MediaKind;
        rtpParameters: RtpParameters;
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
}
