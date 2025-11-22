# Total Callbot Voice Server

NestJS + mediasoup 기반 WebRTC SFU 음성 채팅 서버

## 🎯 기능

- **다중 참가자 음성 채팅** (5~10명 권장)
- **SFU 방식**: mediasoup으로 효율적인 음성 스트리밍
- **룸 기반 관리**: 독립된 음성 채팅 룸
- **실시간 WebSocket**: Socket.IO 기반 양방향 통신

## 🚀 실행 방법

### 설치

```bash
npm install
```

### 개발 모드 실행

```bash
npm run start:dev
```

서버 실행 주소: `http://localhost:3001`
WebSocket 네임스페이스: `/voice`

### 프로덕션 빌드

```bash
npm run build
npm run start:prod
```

## 📡 WebSocket 이벤트

### 클라이언트 → 서버

| 이벤트              | 설명                  | 파라미터                                               |
| ------------------- | --------------------- | ------------------------------------------------------ |
| `join-room`         | 음성 채팅 룸 참가     | `{ roomId, userId }`                                   |
| `create-transport`  | WebRTC Transport 생성 | `{ roomId }`                                           |
| `connect-transport` | Transport 연결        | `{ roomId, transportId, dtlsParameters }`              |
| `produce`           | 음성 스트림 전송 시작 | `{ roomId, transportId, kind, rtpParameters }`         |
| `consume`           | 다른 사용자 음성 수신 | `{ roomId, transportId, producerId, rtpCapabilities }` |

### 서버 → 클라이언트

| 이벤트         | 설명                  | 데이터                   |
| -------------- | --------------------- | ------------------------ |
| `peer-joined`  | 다른 사용자 입장      | `{ peerId, userId }`     |
| `peer-left`    | 다른 사용자 퇴장      | `{ peerId }`             |
| `new-producer` | 새 음성 스트림 생성됨 | `{ peerId, producerId }` |

## 🏗️ 아키텍처

```
src/
├── voice/
│   ├── voice.gateway.ts       # WebSocket 게이트웨이
│   ├── voice.service.ts       # mediasoup 비즈니스 로직
│   ├── voice.module.ts        # 모듈 정의
│   └── room.manager.ts        # 룸/피어 관리
└── config/
    └── mediasoup.config.ts    # mediasoup 설정
```

## ⚙️ mediasoup 설정

### 포트 범위 (UDP)

- **RTC 포트**: 10000 ~ 10100 (100개 동시 연결)
- 방화벽 설정 필요 (배포시)

### 코덱

- **오디오**: Opus 48kHz 2채널

### IP 설정

- 개발: `127.0.0.1`
- 배포: 서버 공인 IP로 변경 필요 (`mediasoup.config.ts`)

## 🔗 Spring Boot 연동 계획

1. **JWT 인증 공유**
   - Spring Boot에서 발급한 JWT 토큰 검증
   - `join-room` 시 토큰 확인

2. **룸 정보 REST API**
   - Spring Boot에서 룸 목록/생성 관리
   - Voice Server는 실시간 통신만 담당

3. **사용자 정보 연동**
   - Spring Boot API 호출로 사용자 정보 조회

## 🔒 보안 고려사항

- [ ] JWT 토큰 검증 추가
- [ ] Rate Limiting
- [ ] IP 화이트리스트 (필요시)

## 📦 주요 의존성

- `@nestjs/websockets`: WebSocket 지원
- `@nestjs/platform-socket.io`: Socket.IO 어댑터
- `mediasoup`: SFU 미디어 서버
- `socket.io`: 실시간 양방향 통신

## 🌐 프론트엔드 연동 예시

```typescript
import { io } from 'socket.io-client';
import { Device } from 'mediasoup-client';

const socket = io('http://localhost:3001/voice');
const device = new Device();

// 1. 룸 참가
const { rtpCapabilities } = await socket.emitWithAck('join-room', {
  roomId: 'room-123',
  userId: 1,
});

await device.load({ routerRtpCapabilities: rtpCapabilities });

// 2. Transport 생성 및 마이크 전송
// ... (자세한 내용은 프론트엔드 구현시 제공)
```

## 📝 TODO

- [ ] JWT 인증 미들웨어 추가
- [ ] Spring Boot REST API 연동
- [ ] 프론트엔드 컴포넌트 개발
- [ ] 배포 환경 설정 (Docker)
- [ ] 모니터링 및 로깅

## 🐛 문제 해결

### 포트 충돌

```bash
# 3001 포트 사용 프로세스 확인
lsof -i :3001

# 프로세스 종료
kill -9 [PID]
```

### mediasoup Worker 에러

- RTC 포트 범위 확인 (10000~10100)
- 방화벽 설정 확인
