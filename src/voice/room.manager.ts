import { Injectable, Logger } from '@nestjs/common';
import * as mediasoup from 'mediasoup';
import type {
  Router,
  Worker,
  Transport,
  Producer,
  Consumer,
} from 'mediasoup/types';
import { mediasoupConfig } from '../config/mediasoup.config';

interface Room {
  id: string;
  router: Router;
  peers: Map<string, Peer>;
}

interface Peer {
  id: string;
  userId: number;
  userName: string;
  transports: Map<string, Transport>;
  producers: Map<string, Producer>;
  consumers: Map<string, Consumer>;
}

@Injectable()
export class RoomManager {
  private readonly logger = new Logger(RoomManager.name);
  private worker: Worker | null = null;
  private rooms: Map<string, Room> = new Map();

  async initialize() {
    this.worker = await mediasoup.createWorker({
      rtcMinPort: mediasoupConfig.worker.rtcMinPort,
      rtcMaxPort: mediasoupConfig.worker.rtcMaxPort,
      logLevel: mediasoupConfig.worker.logLevel,
      logTags: mediasoupConfig.worker.logTags,
    });

    this.logger.log('mediasoup Worker created');

    this.worker.on('died', () => {
      this.logger.error('mediasoup Worker died, exiting in 2 seconds...');
      setTimeout(() => process.exit(1), 2000);
    });
  }

  async getOrCreateRoom(roomId: string): Promise<Room> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    let room = this.rooms.get(roomId);
    if (!room) {
      const router = await this.worker.createRouter({
        mediaCodecs: mediasoupConfig.router.mediaCodecs,
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

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  addPeer(
    roomId: string,
    peerId: string,
    userId: number,
    userName: string,
  ): Peer {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const peer: Peer = {
      id: peerId,
      userId,
      userName,
      transports: new Map(),
      producers: new Map(),
      consumers: new Map(),
    };

    room.peers.set(peerId, peer);
    this.logger.log(`Peer ${peerId} (${userName}) added to room ${roomId}`);

    return peer;
  }

  getUserName(roomId: string, peerId: string): string {
    const peer = this.getPeer(roomId, peerId);
    return peer?.userName || 'Unknown';
  }

  removePeer(roomId: string, peerId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const peer = room.peers.get(peerId);
    if (!peer) return;

    // Close all transports
    peer.transports.forEach((transport) => transport.close());

    // Remove peer
    room.peers.delete(peerId);
    this.logger.log(`Peer ${peerId} removed from room ${roomId}`);

    // Remove empty room
    if (room.peers.size === 0) {
      room.router.close();
      this.rooms.delete(roomId);
      this.logger.log(`Room ${roomId} closed (empty)`);
    }
  }

  getPeer(roomId: string, peerId: string): Peer | undefined {
    const room = this.rooms.get(roomId);
    return room?.peers.get(peerId);
  }

  getOtherPeers(roomId: string, peerId: string): Peer[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    return Array.from(room.peers.values()).filter((p) => p.id !== peerId);
  }
}
