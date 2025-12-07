import type { Router, Transport, Producer, Consumer } from 'mediasoup/types';
interface Room {
    id: string;
    router: Router;
    peers: Map<string, Peer>;
}
interface Peer {
    id: string;
    userId: number;
    userName: string;
    slotIndex: number;
    transports: Map<string, Transport>;
    producers: Map<string, Producer>;
    consumers: Map<string, Consumer>;
}
export declare class RoomManager {
    private readonly logger;
    private worker;
    private rooms;
    initialize(): Promise<void>;
    getOrCreateRoom(roomId: string): Promise<Room>;
    getRoom(roomId: string): Room | undefined;
    addPeer(roomId: string, peerId: string, userId: number, userName: string, slotIndex?: number): Peer;
    private findNextAvailableSlotIndex;
    updatePeerSlotIndex(roomId: string, peerId: string, slotIndex: number): void;
    getPeerSlotIndex(roomId: string, peerId: string): number;
    getUserName(roomId: string, peerId: string): string;
    removePeer(roomId: string, peerId: string): void;
    getPeer(roomId: string, peerId: string): Peer | undefined;
    getOtherPeers(roomId: string, peerId: string): Peer[];
}
export {};
