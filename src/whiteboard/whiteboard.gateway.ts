import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

interface WhiteboardObject {
  id: string;
  type: string;
  [key: string]: any;
}

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'https://realtime-english-trainer.co.kr',
    ],
    credentials: true,
  },
})
export class WhiteboardGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WhiteboardGateway.name);

  // Socket to Room mapping
  private socketToRoom: Map<string, string> = new Map();

  // Room별 현재 칠판 상태 (새 참여자에게 전송용)
  private roomCanvasState: Map<string, WhiteboardObject[]> = new Map();

  handleConnection(client: Socket) {
    this.logger.log(`[Whiteboard] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`[Whiteboard] Client disconnected: ${client.id}`);
    const roomId = this.socketToRoom.get(client.id);
    if (roomId) {
      this.socketToRoom.delete(client.id);
    }
  }

  @SubscribeMessage('wb-join')
  handleJoin(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId } = data;
    const wbRoomId = `wb-${roomId}`;

    client.join(wbRoomId);
    this.socketToRoom.set(client.id, roomId);

    this.logger.log(
      `[Whiteboard] Client ${client.id} joined room: ${wbRoomId}`,
    );

    // 기존 칠판 상태 전송
    const existingState = this.roomCanvasState.get(roomId) || [];

    return {
      success: true,
      canvasState: existingState,
    };
  }

  @SubscribeMessage('wb-leave')
  handleLeave(@ConnectedSocket() client: Socket) {
    const roomId = this.socketToRoom.get(client.id);
    if (roomId) {
      client.leave(`wb-${roomId}`);
      this.socketToRoom.delete(client.id);
      this.logger.log(
        `[Whiteboard] Client ${client.id} left room: wb-${roomId}`,
      );
    }
    return { success: true };
  }

  @SubscribeMessage('wb-add')
  handleAdd(
    @MessageBody() payload: WhiteboardObject,
    @ConnectedSocket() client: Socket,
  ) {
    const roomId = this.socketToRoom.get(client.id);
    this.logger.log(
      `[wb-add] client: ${client.id}, roomId: ${roomId}, objId: ${payload?.id}`,
    );

    if (!roomId) return { success: false, error: 'Not in a room' };

    // 상태 저장
    const state = this.roomCanvasState.get(roomId) || [];
    state.push(payload);
    this.roomCanvasState.set(roomId, state);

    // 다른 참여자에게 브로드캐스트
    const wbRoom = `wb-${roomId}`;
    this.logger.log(`[wb-add] Broadcasting to room: ${wbRoom}`);
    client.to(wbRoom).emit('wb-add', payload);

    return { success: true };
  }

  @SubscribeMessage('wb-modify')
  handleModify(
    @MessageBody() payload: WhiteboardObject,
    @ConnectedSocket() client: Socket,
  ) {
    const roomId = this.socketToRoom.get(client.id);
    if (!roomId) return { success: false, error: 'Not in a room' };

    // 상태 업데이트
    const state = this.roomCanvasState.get(roomId) || [];
    const index = state.findIndex((obj) => obj.id === payload.id);
    if (index !== -1) {
      state[index] = payload;
      this.roomCanvasState.set(roomId, state);
    }

    // 다른 참여자에게 브로드캐스트
    client.to(`wb-${roomId}`).emit('wb-modify', payload);

    this.logger.debug(`[Whiteboard] Object modified in room ${roomId}`);
    return { success: true };
  }

  @SubscribeMessage('wb-delete')
  handleDelete(
    @MessageBody() payload: { id: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomId = this.socketToRoom.get(client.id);
    if (!roomId) return { success: false, error: 'Not in a room' };

    // 상태에서 제거
    const state = this.roomCanvasState.get(roomId) || [];
    const filteredState = state.filter((obj) => obj.id !== payload.id);
    this.roomCanvasState.set(roomId, filteredState);

    // 다른 참여자에게 브로드캐스트
    client.to(`wb-${roomId}`).emit('wb-delete', payload);

    this.logger.debug(`[Whiteboard] Object deleted in room ${roomId}`);
    return { success: true };
  }

  @SubscribeMessage('wb-clear')
  handleClear(@ConnectedSocket() client: Socket) {
    const roomId = this.socketToRoom.get(client.id);
    if (!roomId) return { success: false, error: 'Not in a room' };

    // 상태 초기화
    this.roomCanvasState.set(roomId, []);

    // 다른 참여자에게 브로드캐스트
    client.to(`wb-${roomId}`).emit('wb-clear');

    this.logger.log(`[Whiteboard] Canvas cleared in room ${roomId}`);
    return { success: true };
  }
}
