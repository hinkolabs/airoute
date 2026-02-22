'use client';

import { useState } from 'react';

type HistoryType = 'scheduled' | 'instant';
type HistoryStatus = 'success' | 'failed';
type HistoryScope = 'me' | 'team';

interface HistoryItem {
  id: string;
  date: string;
  type: HistoryType;
  title: string;
  status: HistoryStatus;
  scope: HistoryScope;
  blogSummary: string;
  snsSummary: string;
  errorMessage?: string;
}

const MOCK_HISTORY: HistoryItem[] = [
  {
    id: '1',
    date: '2026-01-11 14:30',
    type: 'instant',
    title: '서울 도심 맛집 투어 - 광화문 주변 추천 식당 10곳',
    status: 'success',
    scope: 'me',
    blogSummary: '광화문 일대의 숨은 맛집들을 소개합니다. 점심 메뉴부터 저녁 회식까지 다양한 상황에 맞는 식당을 추천드립니다.',
    snsSummary: '🍴 광화문 맛집 10곳 정리! 회사 근처 점심 고민 끝 #광화문맛집 #서울맛집',
  },
  {
    id: '2',
    date: '2026-01-11 09:00',
    type: 'scheduled',
    title: '겨울 제주도 여행 완벽 가이드 2026',
    status: 'success',
    scope: 'team',
    blogSummary: '1월 제주도 여행 시 꼭 알아야 할 정보들을 정리했습니다. 날씨, 옷차림, 추천 코스까지 모두 담았습니다.',
    snsSummary: '❄️ 겨울 제주도 여행 준비는 이것만! 완벽 가이드 공개 #제주여행 #겨울여행',
  },
  {
    id: '3',
    date: '2026-01-10 18:45',
    type: 'instant',
    title: '2026년 최신 노트북 추천 - 업무용부터 게이밍까지',
    status: 'failed',
    scope: 'me',
    blogSummary: '2026년 출시된 최신 노트북들을 용도별로 비교 분석했습니다.',
    snsSummary: '💻 2026 노트북 추천 리스트 #노트북추천 #2026신상',
    errorMessage: 'SNS API 연결 실패: 인증 토큰이 만료되었습니다.',
  },
  {
    id: '4',
    date: '2026-01-10 09:00',
    type: 'scheduled',
    title: '부산 해운대 숙소 추천 - 가성비 호텔 베스트 5',
    status: 'success',
    scope: 'team',
    blogSummary: '해운대 해변 근처 가성비 좋은 숙소들을 엄선했습니다. 실제 이용 후기와 예약 팁도 함께 공유합니다.',
    snsSummary: '🏖️ 부산 해운대 가성비 숙소 BEST 5 #부산여행 #해운대숙소',
  },
  {
    id: '5',
    date: '2026-01-09 16:20',
    type: 'instant',
    title: '강남역 카페 투어 - 인스타 감성 카페 7곳',
    status: 'success',
    scope: 'me',
    blogSummary: '강남역 도보 10분 이내의 감성 카페들을 소개합니다. 사진 맛집 보장!',
    snsSummary: '☕ 강남역 감성 카페 투어 완료! 사진 찍기 좋은 곳만 모았어요 #강남카페 #카페투어',
  },
  {
    id: '6',
    date: '2026-01-09 09:00',
    type: 'scheduled',
    title: '설날 연휴 국내 여행지 추천 - 덜 붐비는 명소',
    status: 'success',
    scope: 'team',
    blogSummary: '설 연휴에 북적이지 않으면서도 즐길 수 있는 국내 여행지를 추천합니다.',
    snsSummary: '🎊 설날 연휴 여행 어디갈까? 한적한 명소 추천 #설연휴 #국내여행',
  },
  {
    id: '7',
    date: '2026-01-08 15:30',
    type: 'instant',
    title: '홍대 데이트 코스 완벽 가이드 - 점심부터 저녁까지',
    status: 'failed',
    scope: 'me',
    blogSummary: '홍대에서 즐기는 완벽한 데이트 코스를 시간대별로 정리했습니다.',
    snsSummary: '💑 홍대 데이트 코스 추천 #홍대데이트 #데이트코스',
    errorMessage: '이미지 생성 실패: 일일 할당량을 초과했습니다.',
  },
  {
    id: '8',
    date: '2026-01-08 09:00',
    type: 'scheduled',
    title: '경주 역사 여행 - 1박 2일 완벽 일정표',
    status: 'success',
    scope: 'team',
    blogSummary: '경주의 주요 역사 유적지를 효율적으로 둘러볼 수 있는 일정을 공유합니다.',
    snsSummary: '🏛️ 경주 1박2일 완벽 코스 공개! #경주여행 #역사여행',
  },
  {
    id: '9',
    date: '2026-01-07 17:10',
    type: 'instant',
    title: '이태원 세계음식 거리 - 맛집 지도 완성',
    status: 'success',
    scope: 'me',
    blogSummary: '이태원에서 즐길 수 있는 다양한 세계 요리 맛집들을 국가별로 정리했습니다.',
    snsSummary: '🌎 이태원 세계음식 투어 완료! 국가별 맛집 총정리 #이태원맛집 #세계음식',
  },
  {
    id: '10',
    date: '2026-01-07 09:00',
    type: 'scheduled',
    title: '전주 한옥마을 여행 가이드 - 먹거리와 볼거리',
    status: 'success',
    scope: 'team',
    blogSummary: '전주 한옥마을의 필수 코스와 맛집 정보를 한눈에 정리했습니다.',
    snsSummary: '🏘️ 전주 한옥마을 완전 정복! 먹거리 투어 #전주여행 #한옥마을',
  },
  {
    id: '11',
    date: '2026-01-06 14:50',
    type: 'instant',
    title: '서울 야경 명소 베스트 10 - 야간 데이트 추천',
    status: 'failed',
    scope: 'me',
    blogSummary: '서울에서 야경이 아름다운 장소들을 엄선했습니다.',
    snsSummary: '🌃 서울 야경 명소 총정리 #서울야경 #야경명소',
    errorMessage: '블로그 API 오류: 네트워크 타임아웃 (30초 초과)',
  },
  {
    id: '12',
    date: '2026-01-06 09:00',
    type: 'scheduled',
    title: '강원도 스키장 비교 가이드 2026 시즌',
    status: 'success',
    scope: 'team',
    blogSummary: '강원도 주요 스키장들의 특징과 가격을 비교 분석했습니다.',
    snsSummary: '⛷️ 강원도 스키장 어디갈까? 완벽 비교 가이드 #스키장 #겨울스포츠',
  },
];

export default function MarketingHistoryPage() {
  const [typeFilter, setTypeFilter] = useState<'all' | HistoryType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | HistoryStatus>('all');
  const [showTeam, setShowTeam] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredHistory = MOCK_HISTORY.filter((item) => {
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (!showTeam && item.scope === 'team') return false;
    return true;
  });

  const toggleDetail = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">발송 히스토리</h1>
        <p className="text-sm text-gray-600">
          정기 발송과 즉시 발송 기록을 확인할 수 있습니다.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col gap-4">
          {/* Type Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              발송 유형
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  typeFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setTypeFilter('scheduled')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  typeFilter === 'scheduled'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                정기 발송
              </button>
              <button
                onClick={() => setTypeFilter('instant')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  typeFilter === 'instant'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                즉시 발송
              </button>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              발송 상태
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setStatusFilter('success')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === 'success'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                성공
              </button>
              <button
                onClick={() => setStatusFilter('failed')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === 'failed'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                실패
              </button>
            </div>
          </div>

          {/* Team Toggle */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showTeam}
                onChange={(e) => setShowTeam(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                팀 전체 보기
              </span>
            </label>
            <span className="text-xs text-gray-500">
              관리자는 팀 전체 기록을 볼 수 있습니다
            </span>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-3">
        {filteredHistory.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500">조건에 맞는 히스토리가 없습니다.</p>
          </div>
        ) : (
          filteredHistory.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              {/* List Item */}
              <div className="p-4 flex items-center gap-4">
                <div className="flex-shrink-0 text-sm text-gray-500 w-32">
                  {item.date}
                </div>
                <div className="flex-shrink-0">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      item.type === 'scheduled'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {item.type === 'scheduled' ? '정기' : '즉시'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.title}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      item.status === 'success'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {item.status === 'success' ? '성공' : '실패'}
                  </span>
                </div>
                <button
                  onClick={() => toggleDetail(item.id)}
                  className="flex-shrink-0 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                >
                  {expandedId === item.id ? '접기' : '상세보기'}
                </button>
              </div>

              {/* Detail (Expanded) */}
              {expandedId === item.id && (
                <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
                  {/* Blog Summary */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      블로그 제목
                    </h3>
                    <p className="text-sm text-gray-700">{item.title}</p>
                    <h4 className="text-sm font-semibold text-gray-900 mt-3 mb-1">
                      블로그 요약
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {item.blogSummary}
                    </p>
                  </div>

                  {/* SNS Summary */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      SNS 요약
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {item.snsSummary}
                    </p>
                  </div>

                  {/* Image Placeholders */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      생성된 이미지
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-sm text-gray-500">이미지 1</span>
                      </div>
                      <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-sm text-gray-500">이미지 2</span>
                      </div>
                    </div>
                  </div>

                  {/* Error Message (if failed) */}
                  {item.status === 'failed' && item.errorMessage && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <h4 className="text-sm font-semibold text-red-900 mb-1">
                        오류 메시지
                      </h4>
                      <p className="text-sm text-red-700">{item.errorMessage}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
