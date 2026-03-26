# NanoBanana Image Generation Prompts

이 파일은 NanoBanana에서 생성할 이미지에 대한 프롬프트를 포함합니다.

## 이미지 생성 가이드

각 이미지는 다음 사양으로 생성하세요:
- **크기**: 800x600px 또는 1200x800px (가로형)
- **스타일**: 현대적이고 전문적인 일러스트 또는 사진 스타일
- **색상**: 밝은 배경에 맞는 색상 (밝은 테마)

## 1. 물류 시스템 (Logistics System)

**파일명**: `logistics-system.jpg` 또는 `logistics-system.png`

**프롬프트**:
```
Modern urban logistics system illustration showing:
- A modern warehouse building with automated systems
- Delivery truck on the road
- Drone flying in the sky with a package
- GPS tracking and route optimization visualization
- Bright, clean, professional style
- Light background, teal and purple accent colors
- Modern technology and automation theme
- 3D illustration or realistic style
```

**대체 프롬프트 (한국어)**:
```
현대적인 도시 물류 시스템 일러스트:
- 자동화 시스템이 있는 현대적인 창고 건물
- 도로 위의 배송 트럭
- 패키지를 운반하는 하늘의 드론
- GPS 추적 및 경로 최적화 시각화
- 밝고 깔끔한 전문적인 스타일
- 밝은 배경, 청록색과 보라색 악센트 색상
- 현대 기술과 자동화 테마
```

## 2. 공급망 설계 (Supply Chain Design)

**파일명**: `supply-chain.jpg` 또는 `supply-chain.png`

**프롬프트**:
```
Supply chain network design illustration showing:
- Central distribution hub connected to multiple suppliers
- Network nodes and connection lines with data flow
- Global supply chain visualization
- Modern network diagram style
- Bright, clean background
- Purple and teal gradient colors
- Professional business illustration
- Abstract network topology
```

**대체 프롬프트 (한국어)**:
```
공급망 네트워크 설계 일러스트:
- 여러 공급업체와 연결된 중앙 유통 허브
- 데이터 흐름이 있는 네트워크 노드 및 연결선
- 글로벌 공급망 시각화
- 현대적인 네트워크 다이어그램 스타일
- 밝고 깔끔한 배경
- 보라색과 청록색 그라데이션
- 전문적인 비즈니스 일러스트
```

## 3. 지능형 제조 (Intelligent Manufacturing)

**파일명**: `intelligent-manufacturing.jpg` 또는 `intelligent-manufacturing.png`

**프롬프트**:
```
Intelligent manufacturing and smart factory illustration showing:
- Robotic arm working on production line
- Automated manufacturing process
- Quality control systems
- Data analytics and monitoring screens
- Modern factory floor with automation
- Bright, clean industrial style
- Pink and purple accent colors
- High-tech manufacturing theme
- Professional industrial illustration
```

**대체 프롬프트 (한국어)**:
```
지능형 제조 및 스마트 팩토리 일러스트:
- 생산 라인에서 작업하는 로봇 팔
- 자동화된 제조 공정
- 품질 관리 시스템
- 데이터 분석 및 모니터링 화면
- 자동화가 있는 현대적인 공장 바닥
- 밝고 깔끔한 산업 스타일
- 핑크와 보라색 악센트 색상
- 첨단 제조 테마
```

## 이미지 사용 방법

1. NanoBanana에서 위 프롬프트를 사용하여 이미지 생성
2. 생성된 이미지를 `images/` 폴더에 저장
3. HTML 파일에서 주석 처리된 `<img>` 태그의 주석을 제거하고 SVG를 주석 처리
4. 이미지 경로가 올바른지 확인

## 예시 HTML 구조

```html
<div class="feature-illustration">
    <!-- SVG를 사용하는 경우 -->
    <svg>...</svg>
    
    <!-- 또는 이미지를 사용하는 경우 (위 SVG 주석 처리) -->
    <img src="images/logistics-system.jpg" alt="물류 시스템" class="feature-image">
</div>
```

