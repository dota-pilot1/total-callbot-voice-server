"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var RoomManager_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
const common_1 = require("@nestjs/common");
const mediasoup = __importStar(require("mediasoup"));
const mediasoup_config_1 = require("../config/mediasoup.config");
let RoomManager = RoomManager_1 = class RoomManager {
    logger = new common_1.Logger(RoomManager_1.name);
    worker = null;
    rooms = new Map();
    async initialize() {
        this.worker = await mediasoup.createWorker({
            rtcMinPort: mediasoup_config_1.mediasoupConfig.worker.rtcMinPort,
            rtcMaxPort: mediasoup_config_1.mediasoupConfig.worker.rtcMaxPort,
            logLevel: mediasoup_config_1.mediasoupConfig.worker.logLevel,
            logTags: mediasoup_config_1.mediasoupConfig.worker.logTags,
        });
        this.logger.log('mediasoup Worker created');
        this.worker.on('died', () => {
            this.logger.error('mediasoup Worker died, exiting in 2 seconds...');
            setTimeout(() => process.exit(1), 2000);
        });
    }
    async getOrCreateRoom(roomId) {
        if (!this.worker) {
            throw new Error('Worker not initialized');
        }
        let room = this.rooms.get(roomId);
        if (!room) {
            const router = await this.worker.createRouter({
                mediaCodecs: mediasoup_config_1.mediasoupConfig.router.mediaCodecs,
            });
            room = {
                id: roomId,
                router,
                peers: new Map(),
            };
            this.rooms.set(roomId, room);
            this.logger.log(`Room created: ${roomId}`);
        }
        return room;
    }
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }
    addPeer(roomId, peerId, userId) {
        const room = this.rooms.get(roomId);
        if (!room) {
            throw new Error('Room not found');
        }
        const peer = {
            id: peerId,
            userId,
            transports: new Map(),
            producers: new Map(),
            consumers: new Map(),
        };
        room.peers.set(peerId, peer);
        this.logger.log(`Peer ${peerId} added to room ${roomId}`);
        return peer;
    }
    removePeer(roomId, peerId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return;
        const peer = room.peers.get(peerId);
        if (!peer)
            return;
        peer.transports.forEach((transport) => transport.close());
        room.peers.delete(peerId);
        this.logger.log(`Peer ${peerId} removed from room ${roomId}`);
        if (room.peers.size === 0) {
            room.router.close();
            this.rooms.delete(roomId);
            this.logger.log(`Room ${roomId} closed (empty)`);
        }
    }
    getPeer(roomId, peerId) {
        const room = this.rooms.get(roomId);
        return room?.peers.get(peerId);
    }
    getOtherPeers(roomId, peerId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return [];
        return Array.from(room.peers.values()).filter((p) => p.id !== peerId);
    }
};
exports.RoomManager = RoomManager;
exports.RoomManager = RoomManager = RoomManager_1 = __decorate([
    (0, common_1.Injectable)()
], RoomManager);
//# sourceMappingURL=room.manager.js.map