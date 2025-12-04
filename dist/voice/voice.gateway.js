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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var VoiceGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const voice_service_1 = require("./voice.service");
let VoiceGateway = VoiceGateway_1 = class VoiceGateway {
    voiceService;
    server;
    logger = new common_1.Logger(VoiceGateway_1.name);
    socketToRoom = new Map();
    constructor(voiceService) {
        this.voiceService = voiceService;
    }
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
        const roomId = this.socketToRoom.get(client.id);
        if (roomId) {
            const userName = this.voiceService.getUserName(roomId, client.id);
            this.voiceService.leaveRoom(roomId, client.id);
            this.socketToRoom.delete(client.id);
            client.to(roomId).emit('user-left', {
                peerId: client.id,
                userName,
            });
        }
    }
    async handleGetRouterRtpCapabilities(client, data, callback) {
        this.logger.log('📡 getRouterRtpCapabilities 요청 받음');
        try {
            const rtpCapabilities = await this.voiceService.getRouterRtpCapabilities();
            this.logger.log('✅ RTP Capabilities 응답 전송');
            const response = { rtpCapabilities };
            if (callback && typeof callback === 'function') {
                callback(response);
            }
            return response;
        }
        catch (error) {
            this.logger.error('❌ Error getting router RTP capabilities:', error);
            const errorResponse = { error: error.message };
            if (callback && typeof callback === 'function') {
                callback(errorResponse);
            }
            return errorResponse;
        }
    }
    async handleJoinRoom(data, client) {
        try {
            const { roomId, userId = 0, userName = 'Guest' } = data;
            const result = await this.voiceService.joinRoom(roomId, client.id, userId, userName);
            client.join(roomId);
            this.socketToRoom.set(client.id, roomId);
            client.to(roomId).emit('peer-joined', {
                peerId: client.id,
                userId,
            });
            const existingProducers = this.voiceService.getProducers(roomId, client.id);
            this.logger.log(`Room ${roomId} 입장: ${userName}, 기존 producer ${existingProducers.length}개`);
            return {
                success: true,
                rtpCapabilities: result.rtpCapabilities,
                existingProducers,
            };
        }
        catch (error) {
            this.logger.error('Error joining room:', error);
            return { success: false, error: error.message };
        }
    }
    async handleCreateTransport(data, client) {
        try {
            const { roomId } = data;
            const result = await this.voiceService.createWebRtcTransport(roomId, client.id);
            return { success: true, ...result };
        }
        catch (error) {
            this.logger.error('Error creating transport:', error);
            return { success: false, error: error.message };
        }
    }
    async handleConnectTransport(data, client) {
        try {
            const { roomId, transportId, dtlsParameters } = data;
            await this.voiceService.connectWebRtcTransport(roomId, client.id, transportId, dtlsParameters);
            return { success: true };
        }
        catch (error) {
            this.logger.error('Error connecting transport:', error);
            return { success: false, error: error.message };
        }
    }
    async handleProduce(data, client) {
        try {
            const { roomId, transportId, kind, rtpParameters } = data;
            const result = await this.voiceService.produce(roomId, client.id, transportId, kind, rtpParameters);
            client.to(roomId).emit('new-producer', {
                peerId: client.id,
                producerId: result.producerId,
                userName: this.voiceService.getUserName(roomId, client.id),
                kind,
            });
            return { success: true, producerId: result.producerId };
        }
        catch (error) {
            this.logger.error('Error producing:', error);
            return { success: false, error: error.message };
        }
    }
    async handleCloseProducer(data, client) {
        try {
            const { roomId, producerId } = data;
            const userName = this.voiceService.getUserName(roomId, client.id);
            await this.voiceService.closeProducer(roomId, client.id, producerId);
            client.to(roomId).emit('producer-closed', {
                peerId: client.id,
                producerId,
                userName,
            });
            this.logger.log(`Producer 종료: ${userName} (${producerId})`);
            return { success: true };
        }
        catch (error) {
            this.logger.error('Error closing producer:', error);
            return { success: false, error: error.message };
        }
    }
    async handleConsume(data, client) {
        try {
            const { roomId, transportId, producerId, rtpCapabilities } = data;
            const result = await this.voiceService.consume(roomId, client.id, transportId, producerId, rtpCapabilities);
            return { success: true, ...result };
        }
        catch (error) {
            this.logger.error('Error consuming:', error);
            return { success: false, error: error.message };
        }
    }
};
exports.VoiceGateway = VoiceGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], VoiceGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('getRouterRtpCapabilities'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __param(2, (0, websockets_1.Ack)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object, Function]),
    __metadata("design:returntype", Promise)
], VoiceGateway.prototype, "handleGetRouterRtpCapabilities", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('join-room'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], VoiceGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('create-transport'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], VoiceGateway.prototype, "handleCreateTransport", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('connect-transport'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], VoiceGateway.prototype, "handleConnectTransport", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('produce'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], VoiceGateway.prototype, "handleProduce", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('close-producer'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], VoiceGateway.prototype, "handleCloseProducer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('consume'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], VoiceGateway.prototype, "handleConsume", null);
exports.VoiceGateway = VoiceGateway = VoiceGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        path: '/voice/socket.io',
        cors: {
            origin: [
                'http://localhost:5173',
                'http://localhost:5174',
                'http://localhost:5175',
                'https://realtime-english-trainer.co.kr',
            ],
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [voice_service_1.VoiceService])
], VoiceGateway);
//# sourceMappingURL=voice.gateway.js.map