import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
interface WhiteboardObject {
    id: string;
    type: string;
    [key: string]: any;
}
export declare class WhiteboardGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    private socketToRoom;
    private roomCanvasState;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoin(data: {
        roomId: string;
    }, client: Socket): {
        success: boolean;
        canvasState: WhiteboardObject[];
    };
    handleLeave(client: Socket): {
        success: boolean;
    };
    handleAdd(payload: WhiteboardObject, client: Socket): {
        success: boolean;
        error: string;
    } | {
        success: boolean;
        error?: undefined;
    };
    handleModify(payload: WhiteboardObject, client: Socket): {
        success: boolean;
        error: string;
    } | {
        success: boolean;
        error?: undefined;
    };
    handleDelete(payload: {
        id: string;
    }, client: Socket): {
        success: boolean;
        error: string;
    } | {
        success: boolean;
        error?: undefined;
    };
    handleClear(client: Socket): {
        success: boolean;
        error: string;
    } | {
        success: boolean;
        error?: undefined;
    };
}
export {};
