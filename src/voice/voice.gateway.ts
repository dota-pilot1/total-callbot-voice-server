import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  Ack,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { VoiceService } from './voice.service';
import type {
  DtlsParameters,
  MediaKind,
  RtpCapabilities,
  RtpParameters,
} from 'mediasoup/types';

@WebSocketGateway({
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
export class VoiceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(VoiceGateway.name);

  // Socket to Room mapping
  private socketToRoom: Map<string, string> = new Map();

  constructor(private readonly voiceService: VoiceService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    const roomId = this.socketToRoom.get(client.id);
    if (roomId) {
      const userName = this.voiceService.getUserName(roomId, client.id);
      this.voiceService.leaveRoom(roomId, client.id);
      this.socketToRoom.delete(client.id);

      // Notify others in the room
      client.to(roomId).emit('user-left', {
        peerId: client.id,
        userName,
      });
    }
  }

  @SubscribeMessage('getRouterRtpCapabilities')
  async handleGetRouterRtpCapabilities(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
    @Ack() callback?: (response: any) => void,
  ) {
    this.logger.log('📡 getRouterRtpCapabilities 요청 받음');
    try {
      const rtpCapabilities =
        await this.voiceService.getRouterRtpCapabilities();
      this.logger.log('✅ RTP Capabilities 응답 전송');

      const response = { rtpCapabilities };

      // 명시적으로 콜백 호출
      if (callback && typeof callback === 'function') {
        callback(response);
      }

      return response;
    } catch (error) {
      this.logger.error('❌ Error getting router RTP capabilities:', error);

      const errorResponse = { error: error.message };

      if (callback && typeof callback === 'function') {
        callback(errorResponse);
      }

      return errorResponse;
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @MessageBody()
    data: { roomId: string; userId?: number; userName?: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { roomId, userId = 0, userName = 'Guest' } = data;

      const result = await this.voiceService.joinRoom(
        roomId,
        client.id,
        userId,
        userName,
      );

      // Join Socket.IO room
      client.join(roomId);
      this.socketToRoom.set(client.id, roomId);

      // Notify others
      client.to(roomId).emit('peer-joined', {
        peerId: client.id,
        userId,
      });

      // Get existing producers
      const existingProducers = this.voiceService.getProducers(
        roomId,
        client.id,
      );

      this.logger.log(
        `Room ${roomId} 입장: ${userName}, 기존 producer ${existingProducers.length}개`,
      );

      return {
        success: true,
        rtpCapabilities: result.rtpCapabilities,
        existingProducers,
      };
    } catch (error) {
      this.logger.error('Error joining room:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('create-transport')
  async handleCreateTransport(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { roomId } = data;
      const result = await this.voiceService.createWebRtcTransport(
        roomId,
        client.id,
      );

      return { success: true, ...result };
    } catch (error) {
      this.logger.error('Error creating transport:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('connect-transport')
  async handleConnectTransport(
    @MessageBody()
    data: {
      roomId: string;
      transportId: string;
      dtlsParameters: DtlsParameters;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { roomId, transportId, dtlsParameters } = data;
      await this.voiceService.connectWebRtcTransport(
        roomId,
        client.id,
        transportId,
        dtlsParameters,
      );

      return { success: true };
    } catch (error) {
      this.logger.error('Error connecting transport:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('produce')
  async handleProduce(
    @MessageBody()
    data: {
      roomId: string;
      transportId: string;
      kind: MediaKind;
      rtpParameters: RtpParameters;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { roomId, transportId, kind, rtpParameters } = data;
      const result = await this.voiceService.produce(
        roomId,
        client.id,
        transportId,
        kind,
        rtpParameters,
      );

      // Notify other peers
      client.to(roomId).emit('new-producer', {
        peerId: client.id,
        producerId: result.producerId,
        userName: this.voiceService.getUserName(roomId, client.id),
        kind,
      });

      return { success: true, producerId: result.producerId };
    } catch (error) {
      this.logger.error('Error producing:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('consume')
  async handleConsume(
    @MessageBody()
    data: {
      roomId: string;
      transportId: string;
      producerId: string;
      rtpCapabilities: RtpCapabilities;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { roomId, transportId, producerId, rtpCapabilities } = data;
      const result = await this.voiceService.consume(
        roomId,
        client.id,
        transportId,
        producerId,
        rtpCapabilities,
      );

      return { success: true, ...result };
    } catch (error) {
      this.logger.error('Error consuming:', error);
      return { success: false, error: error.message };
    }
  }
}
