import type { EventDetail } from "@/types/event";

/**
 * 데모(최소 모델) 행사 시드 데이터.
 * DB가 붙기 전까지 lib/events.ts가 이 데이터를 반환한다.
 * EventDetail 형태를 그대로 따르므로, 이후 Repository 구현으로 교체해도
 * 화면 쪽 코드는 변경할 필요가 없다.
 */
export const DEMO_EVENT: EventDetail = {
  id: "demo-my-first-collagen",
  slug: "my-first-collagen",
  name: "My First Collagen",
  status: "ACTIVE",
  logo: { src: "/MFC-logo.png", width: 1080, height: 524 },
  copy: {
    resultHeadline: "분석 완료!",
    resultSubline: "'나만의 첫 콜라겐 루틴이 준비되었어요!'",
    privacyConsentLabel: "[필수] 개인정보 수집 및 이용 동의 (디지털 패스 발송 목적)",
    marketingConsentLabel: "[선택] 바이오던스 마케팅 정보 수신 동의",
  },
  questions: [
    {
      id: "q1",
      order: 1,
      question: "'바이오던스(BIODANCE)' 브랜드를\n평소에 알고 계셨나요?",
      choices: {
        A: "바이오던스 찐팬!\n이미 내 화장대에 제품이 있어요.",
        B: "써본 적은 없지만,\n올리브영/SNS 품절대란템으로 잘 알고 있어요.",
        C: "브랜드 이름은 들어본 것 같은데,\n정확히 어떤 제품인지는 몰라요.",
        D: "이번 대학교 팝업 캠페인을 통해\n브랜드를 처음 알게 되었어요!",
      },
    },
    {
      id: "q2",
      order: 2,
      question: "오늘 나의 메이크업 상황(TPO)에\n가장 가까운것은?",
      choices: {
        A: "가벼운 야외 활동!\n얇고 산뜻한 데일리 베이스가 필요해",
        B: "아침부터 밤까지!\n절대 안 무너지는 탄탄 풀 베이스가 필요해",
        C: "신나게 놀다 보니 뭉치고 들뜸!\n심폐소생 수정 화장이 필요해",
        D: "내일은 완벽해야 하는 D-DAY!\n집중 화잘먹 스킨케어가 필요해",
      },
    },
    {
      id: "q3",
      order: 3,
      question: "베이스 메이크업을 할 때,\n나의 가장 큰 고민은?",
      choices: {
        A: "무겁고 끈적이는 스킨케어는\n답답하고 화장이 밀려서 싫어요.",
        B: "속당김이 심하고,\n시간이 지나면 화장이 다 날아가서 지워져요.",
        C: "덧바를수록 뭉치고 건조해서\n밖에서 수정 화장하기가 어려워요.",
        D: "피부 컨디션 자체가 떨어져서\n메이크업이 들뜨고 화장을 뱉어내요.",
      },
    },
    {
      id: "q4",
      order: 4,
      question: "이번 무빙 팝업스토어 동선 중,\n가장 기대되는 코스는?",
      choices: {
        A: "나에게 꼭 맞는\n첫 콜라겐 루틴 진단 체험",
        B: "힙하게 꾸미는\n나만의 뷰티 굿즈/탑로더 만들기",
        C: "캐비넷 속 네컷 사진으로 남기는\nMY FIRST COLLAGEN 인증샷",
        D: "시크릿 락커/가챠에서\n꽝 없는 럭키 경품 뽑기",
      },
    },
    {
      id: "q5",
      order: 5,
      question: "평소 화장품을 새롭게 구매할 때\n가장 믿고 보는 채널은?",
      choices: {
        A: "올리브영 앱 랭킹 확인\n오프라인 매장 직접 테스트",
        B: "뷰티 유튜버/크리에이터의\n상세하고 솔직한 리뷰 영상",
        C: "인스타그램, 틱톡 등에서 보는\n숏폼 꿀템 추천 영상",
        D: "주변 과 동기나 동아리 친구들의\n리얼한 '찐 후기'",
      },
    },
  ],
};
