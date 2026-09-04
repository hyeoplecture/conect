# 코넥트 모바일 앱

기존 `/conect3` 프로토타입에서 가져온 React 화면을 독립적으로 관리하면서, 웹 자산을 앱 안에 포함하는 Capacitor 앱입니다. 운영 URL을 WebView로 여는 방식이 아닙니다.

## 실행

```bash
cd mobile
npm install
npm run dev
```

## Android

Capacitor 8의 Android 빌드에는 JDK 21이 필요합니다. `java -version`으로 먼저 확인합니다.

```bash
npm run build:android
npx cap open android
```

Android Studio에서 실제 기기 또는 에뮬레이터를 선택해 실행합니다.

## iOS

iOS 프로젝트 생성과 서명은 macOS와 Xcode가 필요합니다.

```bash
cd mobile
npm install
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```

## 중요한 현재 제한

모바일 컨테이너는 완성됐지만, `src/conect3/_lib/store.ts`와 `session.tsx`는 아직 프로토타입용 `localStorage` 데이터 계층입니다. 실제 회원·예약·결제 출시 전에 서버 인증과 데이터베이스 API로 교체해야 합니다.
