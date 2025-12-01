import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VoiceModule } from './voice/voice.module';
import { WhiteboardModule } from './whiteboard/whiteboard.module';

@Module({
  imports: [VoiceModule, WhiteboardModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
