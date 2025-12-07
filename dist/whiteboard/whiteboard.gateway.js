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
var WhiteboardGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhiteboardGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
let WhiteboardGateway = WhiteboardGateway_1 = class WhiteboardGateway {
    server;
    logger = new common_1.Logger(WhiteboardGateway_1.name);
    socketToRoom = new Map();
    roomCanvasState = new Map();
    handleConnection(client) {
        this.logger.log(`[Whiteboard] Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`[Whiteboard] Client disconnected: ${client.id}`);
        const roomId = this.socketToRoom.get(client.id);
        if (roomId) {
            this.socketToRoom.delete(client.id);
        }
    }
    handleJoin(data, client) {
        const { roomId } = data;
        const wbRoomId = `wb-${roomId}`;
        client.join(wbRoomId);
        this.socketToRoom.set(client.id, roomId);
        this.logger.log(`[Whiteboard] Client ${client.id} joined room: ${wbRoomId}`);
        const existingState = this.roomCanvasState.get(roomId) || [];
        return {
            success: true,
            canvasState: existingState,
        };
    }
    handleLeave(client) {
        const roomId = this.socketToRoom.get(client.id);
        if (roomId) {
            client.leave(`wb-${roomId}`);
            this.socketToRoom.delete(client.id);
            this.logger.log(`[Whiteboard] Client ${client.id} left room: wb-${roomId}`);
        }
        return { success: true };
    }
    handleAdd(payload, client) {
        const roomId = this.socketToRoom.get(client.id);
        this.logger.log(`[wb-add] client: ${client.id}, roomId: ${roomId}, objId: ${payload?.id}`);
        if (!roomId)
            return { success: false, error: 'Not in a room' };
        const state = this.roomCanvasState.get(roomId) || [];
        state.push(payload);
        this.roomCanvasState.set(roomId, state);
        const wbRoom = `wb-${roomId}`;
        this.logger.log(`[wb-add] Broadcasting to room: ${wbRoom}`);
        client.to(wbRoom).emit('wb-add', payload);
        return { success: true };
    }
    handleModify(payload, client) {
        const roomId = this.socketToRoom.get(client.id);
        if (!roomId)
            return { success: false, error: 'Not in a room' };
        const state = this.roomCanvasState.get(roomId) || [];
        const index = state.findIndex((obj) => obj.id === payload.id);
        if (index !== -1) {
            state[index] = payload;
            this.roomCanvasState.set(roomId, state);
        }
        client.to(`wb-${roomId}`).emit('wb-modify', payload);
        this.logger.debug(`[Whiteboard] Object modified in room ${roomId}`);
        return { success: true };
    }
    handleDelete(payload, client) {
        const roomId = this.socketToRoom.get(client.id);
        if (!roomId)
            return { success: false, error: 'Not in a room' };
        const state = this.roomCanvasState.get(roomId) || [];
        const filteredState = state.filter((obj) => obj.id !== payload.id);
        this.roomCanvasState.set(roomId, filteredState);
        client.to(`wb-${roomId}`).emit('wb-delete', payload);
        this.logger.debug(`[Whiteboard] Object deleted in room ${roomId}`);
        return { success: true };
    }
    handleClear(client) {
        const roomId = this.socketToRoom.get(client.id);
        if (!roomId)
            return { success: false, error: 'Not in a room' };
        this.roomCanvasState.set(roomId, []);
        client.to(`wb-${roomId}`).emit('wb-clear');
        this.logger.log(`[Whiteboard] Canvas cleared in room ${roomId}`);
        return { success: true };
    }
    handleSync(payload, client) {
        const roomId = this.socketToRoom.get(client.id);
        if (!roomId)
            return { success: false, error: 'Not in a room' };
        this.roomCanvasState.set(roomId, payload.canvasState);
        client.to(`wb-${roomId}`).emit('wb-sync', payload);
        this.logger.log(`[Whiteboard] Canvas synced in room ${roomId}, objects: ${payload.canvasState.length}`);
        return { success: true };
    }
};
exports.WhiteboardGateway = WhiteboardGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], WhiteboardGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('wb-join'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], WhiteboardGateway.prototype, "handleJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('wb-leave'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], WhiteboardGateway.prototype, "handleLeave", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('wb-add'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], WhiteboardGateway.prototype, "handleAdd", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('wb-modify'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], WhiteboardGateway.prototype, "handleModify", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('wb-delete'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], WhiteboardGateway.prototype, "handleDelete", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('wb-clear'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], WhiteboardGateway.prototype, "handleClear", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('wb-sync'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], WhiteboardGateway.prototype, "handleSync", null);
exports.WhiteboardGateway = WhiteboardGateway = WhiteboardGateway_1 = __decorate([
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
    })
], WhiteboardGateway);
//# sourceMappingURL=whiteboard.gateway.js.map