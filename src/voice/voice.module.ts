import { Module } from '@nestjs/common';
import { VoiceGateway } from './voice.gateway';
import { VoiceService } from './voice.service';
import { RoomManager } from './room.manager';

@Module({
  providers: [VoiceGateway, VoiceService, RoomManager],
  exports: [VoiceService],
})
export class VoiceModule {}
