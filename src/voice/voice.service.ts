import { Injectable, Logger } from '@nestjs/common';
import { RoomManager } from './room.manager';
import { mediasoupConfig } from '../config/mediasoup.config';
import type {
  DtlsParameters,
  MediaKind,
  RtpCapabilities,
  RtpParameters,
} from 'mediasoup/types';

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);

  constructor(private readonly roomManager: RoomManager) {}

  async onModuleInit() {
    await this.roomManager.initialize();
  }

  async getRouterRtpCapabilities(): Promise<RtpCapabilities> {
    // 기본 방을 생성하거나 기존 방의 Router RTP Capabilities 반환
    const room = await this.roomManager.getOrCreateRoom('default');
    return room.router.rtpCapabilities;
  }

  async joinRoom(
    roomId: string,
    peerId: string,
    userId: number,
    userName: string,
  ) {
    const room = await this.roomManager.getOrCreateRoom(roomId);
    const peer = this.roomManager.addPeer(roomId, peerId, userId, userName);

    return {
      rtpCapabilities: room.router.rtpCapabilities,
    };
  }

  getUserName(roomId: string, peerId: string): string {
    return this.roomManager.getUserName(roomId, peerId);
  }

  async createWebRtcTransport(roomId: string, peerId: string) {
    const room = this.roomManager.getRoom(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    const transport = await room.router.createWebRtcTransport(
      mediasoupConfig.webRtcTransport,
    );

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

  async connectWebRtcTransport(
    roomId: string,
    peerId: string,
    transportId: string,
    dtlsParameters: DtlsParameters,
  ) {
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

  async produce(
    roomId: string,
    peerId: string,
    transportId: string,
    kind: MediaKind,
    rtpParameters: RtpParameters,
  ) {
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

    // Notify other peers
    const otherPeers = this.roomManager.getOtherPeers(roomId, peerId);

    return {
      producerId: producer.id,
      otherPeerIds: otherPeers.map((p) => p.id),
    };
  }

  async consume(
    roomId: string,
    peerId: string,
    transportId: string,
    producerId: string,
    rtpCapabilities: RtpCapabilities,
  ) {
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

    // Check if router can consume
    if (
      !room.router.canConsume({
        producerId,
        rtpCapabilities,
      })
    ) {
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

  async leaveRoom(roomId: string, peerId: string) {
    this.roomManager.removePeer(roomId, peerId);
  }

  async closeProducer(roomId: string, peerId: string, producerId: string) {
    const peer = this.roomManager.getPeer(roomId, peerId);
    if (!peer) {
      throw new Error('Peer not found');
    }

    const producer = peer.producers.get(producerId);
    if (producer) {
      producer.close();
      peer.producers.delete(producerId);
      this.logger.log(`Producer ${producerId} closed for peer ${peerId}`);
    }
  }

  getProducers(roomId: string, peerId: string) {
    const otherPeers = this.roomManager.getOtherPeers(roomId, peerId);
    const producers: Array<{
      peerId: string;
      producerId: string;
      userName: string;
      kind: MediaKind;
    }> = [];

    otherPeers.forEach((peer) => {
      peer.producers.forEach((producer) => {
        producers.push({
          peerId: peer.id,
          producerId: producer.id,
          userName: peer.userName,
          kind: producer.kind,
        });
      });
    });

    return producers;
  }
}
