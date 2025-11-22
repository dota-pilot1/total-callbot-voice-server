"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var VoiceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceService = void 0;
const common_1 = require("@nestjs/common");
const room_manager_1 = require("./room.manager");
const mediasoup_config_1 = require("../config/mediasoup.config");
let VoiceService = VoiceService_1 = class VoiceService {
    roomManager;
    logger = new common_1.Logger(VoiceService_1.name);
    constructor(roomManager) {
        this.roomManager = roomManager;
    }
    async onModuleInit() {
        await this.roomManager.initialize();
    }
    async joinRoom(roomId, peerId, userId) {
        const room = await this.roomManager.getOrCreateRoom(roomId);
        const peer = this.roomManager.addPeer(roomId, peerId, userId);
        return {
            rtpCapabilities: room.router.rtpCapabilities,
        };
    }
    async createWebRtcTransport(roomId, peerId) {
        const room = this.roomManager.getRoom(roomId);
        if (!room) {
            throw new Error('Room not found');
        }
        const transport = await room.router.createWebRtcTransport(mediasoup_config_1.mediasoupConfig.webRtcTransport);
        const peer = this.roomManager.getPeer(roomId, peerId);
        if (!peer) {
            throw new Error('Peer not found');
        }
        peer.transports.set(transport.id, transport);
        return {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
        };
    }
    async connectWebRtcTransport(roomId, peerId, transportId, dtlsParameters) {
        const peer = this.roomManager.getPeer(roomId, peerId);
        if (!peer) {
            throw new Error('Peer not found');
        }
        const transport = peer.transports.get(transportId);
        if (!transport) {
            throw new Error('Transport not found');
        }
        await transport.connect({ dtlsParameters });
    }
    async produce(roomId, peerId, transportId, kind, rtpParameters) {
        const peer = this.roomManager.getPeer(roomId, peerId);
        if (!peer) {
            throw new Error('Peer not found');
        }
        const transport = peer.transports.get(transportId);
        if (!transport) {
            throw new Error('Transport not found');
        }
        const producer = await transport.produce({
            kind,
            rtpParameters,
        });
        peer.producers.set(producer.id, producer);
        const otherPeers = this.roomManager.getOtherPeers(roomId, peerId);
        return {
            producerId: producer.id,
            otherPeerIds: otherPeers.map((p) => p.id),
        };
    }
    async consume(roomId, peerId, transportId, producerId, rtpCapabilities) {
        const room = this.roomManager.getRoom(roomId);
        if (!room) {
            throw new Error('Room not found');
        }
        const peer = this.roomManager.getPeer(roomId, peerId);
        if (!peer) {
            throw new Error('Peer not found');
        }
        const transport = peer.transports.get(transportId);
        if (!transport) {
            throw new Error('Transport not found');
        }
        if (!room.router.canConsume({
            producerId,
            rtpCapabilities,
        })) {
            throw new Error('Cannot consume');
        }
        const consumer = await transport.consume({
            producerId,
            rtpCapabilities,
            paused: false,
        });
        peer.consumers.set(consumer.id, consumer);
        return {
            id: consumer.id,
            producerId,
            kind: consumer.kind,
            rtpParameters: consumer.rtpParameters,
        };
    }
    async leaveRoom(roomId, peerId) {
        this.roomManager.removePeer(roomId, peerId);
    }
    getProducers(roomId, peerId) {
        const otherPeers = this.roomManager.getOtherPeers(roomId, peerId);
        const producers = [];
        otherPeers.forEach((peer) => {
            peer.producers.forEach((producer) => {
                producers.push({
                    peerId: peer.id,
                    producerId: producer.id,
                });
            });
        });
        return producers;
    }
};
exports.VoiceService = VoiceService;
exports.VoiceService = VoiceService = VoiceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [room_manager_1.RoomManager])
], VoiceService);
//# sourceMappingURL=voice.service.js.map