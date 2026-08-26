import type { Slide } from './types';

/**
 * Helper: build a `Sided<T>` where front and back have the same content.
 * Presenters can later edit the `back` side without touching `front`.
 */
const same = <T>(v: T): { front: T; back: T } => ({ front: v, back: v });

export const SLIDES: Slide[] = [
  // 1. Cover
  {
    id: 'cover',
    kicker: same('THE MINTO PYRAMID PRINCIPLE · CHAPTER 3'),
    title: same('如何搭起一座金字塔'),
    type: 'cover',
  },

  // 2. Story opening
  {
    id: 'story-minto',
    kicker: same('STORY · 開場'),
    title: same('1960 年代，麥肯錫的一間小辦公室'),
    type: 'story',
    story: same(`
      <p>有位年輕分析師叫 <b>Barbara Minto</b>。她發現同事寫的報告總是「先繞三十頁的圈子，最後一句才是答案」——而合夥人根本沒耐心看到第三十頁。</p>
      <p>她問自己一個問題：<b>為什麼聰明的人，寫出來的東西卻讓人看不懂？</b></p>
      <p>答案不在文筆，而在<span style="color: var(--accent)">結構</span>。這一章，就是她找到的那把鑰匙。</p>
    `),
  },

  // 3. Core principles table
  {
    id: 'core-principles',
    kicker: same('CORE IDEA'),
    title: same('核心只有一句話：先給答案，再給理由'),
    type: 'table',
    table: same({
      headers: ['規則', '白話版'],
      rows: [
        ['① 上層統整下層', '每個觀點都是底下那一組想法的「結論」'],
        ['② 同屬性歸類', '同一組裡的想法必須是同一種東西（不能蘋果配扳手）'],
        ['③ 有邏輯順序', '依時間、結構或重要性排列，不能亂撒'],
      ],
    }),
  },

  // 4. Pyramid structure (interactive)
  {
    id: 'pyramid-structure',
    kicker: same('STRUCTURE'),
    title: same('長這個樣子'),
    type: 'pyramid',
    pyramid: same([
      {
        label: '🎯 唯一的中心思想（答案）',
        cssClass: 't1',
        message: '塔尖：一句話的答案',
      },
      {
        label: '� Key Line：三個支撐論點（各自回答一個「為什麼？」）',
        cssClass: 't2',
        message: '中層：Key Line 各自回答頂端引發的疑問',
      },
      {
        label: '📄 證據與事實：數據、案例、細節',
        cssClass: 't3',
        message: '底座：支撐一切的事實與證據',
      },
    ]),
  },

  // 5. Method 1: Top-Down
  {
    id: 'top-down',
    kicker: same('METHOD 1 · 首選'),
    title: same('方法一：由上而下 Top-Down'),
    type: 'steps',
    script: {
      // Audience never sees this. It's a presenter teleprompter for the admin view.
      front: '',
      back: [
        '講者讀稿 — SCQA 4 個重點（簡版）',
        '',
        '1. Situation 要簡潔',
        '⮡ 用「人、事、時、地、物」鋪陳，讓聽眾快速抓到重點。',
        '⮡ 自檢：聽完是否能重述「現在發生什麼事」？不能就再刪。',
        '',
        '2. Complication 要有感',
        '⮡ 挑觀眾最有感的問題；不夠有感就加數據或真實案例。',
        '⮡ 例：「每週花 6 小時找文件版本，曾因錯誤版本延誤 2 天。」',
        '',
        '3. Question 要收斂',
        '⮡ 把多個問題歸納成 3 大類（如：人員、系統、資料），一句話點出。',
        '⮡ 不一定要用問句，情境鋪陳夠清楚時觀眾會自然產生疑問。',
        '',
        '4. Answer 要先總結',
        '⮡ 用 PREP / 金字塔原理：先講「方向 + 效益」，再展開細節。',
        '⮡ 細節依序：執行步驟 → 時程與分工 → 風險因應 → 預期成果。',
      ].join('\n'),
    },
    steps: {
      // Audience sees the five high-level steps, each as title + one-line description.
      front: [
        { title: '定主題 Subject', description: '我要跟誰、談什麼？' },
        { title: '設想問題的核心 Question', description: '主題真正目的是為了什麼？' },
        { title: '寫下答案 Answer', description: '一句話，就是塔尖。' },
        { title: '用 SCQA 檢查開場', description: 'Situation 背景資訊 → Complication 衝突 → Question 關鍵問題 → Action 核心論點' },
        { title: '往下長出 Key Line', description: '每個論點都在回答頂端引發的一個疑問。' },
      ],
      // Admin sees the same five steps, but step 4 expands SCQA into a 4-row
      // breakdown table on the right side. The other steps use the same
      // one-line format; only this one carries extra presenter detail.
      back: [
        { title: '定主題 Subject', description: '我要跟誰、談什麼？' },
        { title: '設想問題的核心 Question', description: '主題真正目的是為了什麼？' },
        { title: '寫下答案 Answer', description: '一句話，就是塔尖。' },
        {
          title: '用 SCQA 檢查開場',
          description:
            'Situation 背景資訊 → Complication 衝突 → Question 關鍵問題 → Action 核心論點',
          noteLines: [
            'S｜Situation 情境：先交代事件的背景與現況，建立共同認知。',
            'C｜Complication 衝突：說明發生了什麼變化，以及帶來哪些問題或影響。',
            'Q｜Question 問題：收斂 S 和 C 所產生的核心課題，把敘事導向解決方案。',
            'A｜Answer 答案：先提出解決方向與預期效益，再進一步展開具體做法。',
          ],
        },
        { title: '往下長出 Key Line', description: '每個論點都在回答頂端引發的一個疑問。' },
      ],
    },
  },

  // 6. Coffee shop story
  {
    id: 'coffee-story',
    kicker: same('☕ 插播 · 一杯咖啡的故事'),
    title: same('兩位店員，兩種報告'),
    type: 'story',
    story: same(`
      <p>老闆問店員：「我們能引進那款新的咖啡豆嗎？」</p>
      <p>小陳說：「我先查了供應商，價格比現有貴 12%，但評價很高，然後我算了物流……哦對，競爭店家也在賣，還有——」老闆三句話就失去耐性。</p>
      <p>小美說：「<b style="color: var(--accent)">建議引進，分兩階段試賣一個月。</b>理由有三：毛利可提升 8%；客人調查中 63% 想要；競店已上架，我們再不上就落後。」</p>
      <p>老闆當場拍板。同樣的事實，不同的<b>搭建方向</b>。</p>
    `),
  },

  // 7. Method 2: Bottom-Up
  {
    id: 'bottom-up',
    kicker: same('METHOD 2 · 救援隊'),
    title: same('方法二：由下而上 Bottom-Up'),
    type: 'steps',
    steps: same([
      { title: '全部列出來', description: '把所有想說的要點攤在桌上，先不管順序。' },
      { title: '找出關聯', description: '哪些是同一類？哪些其實在講同一件事？' },
      { title: '往上提煉結論', description: '每一組想一句話概括——那句話就是上一層。' },
      { title: '回頭檢查 MECE', description: '不重疊（Mutually Exclusive）、不遺漏（Collectively Exhaustive）。' },
    ]),
  },

  // 8. Comparison table
  {
    id: 'compare',
    kicker: same('COMPARE'),
    title: same('兩條路怎麼選？'),
    type: 'table',
    table: same({
      headers: ['', '⬇️ 由上而下', '⬆️ 由下而上'],
      rows: [
        ['使用時機', '答案大致清楚時（首選）', '腦中只有一堆散點時'],
        ['起點', '讀者的問題', '手上的素材清單'],
        ['風險', '答案可能沒回答到真正的問題', '歸錯組、提煉出假結論'],
        [
          { text: 'Minto 的建議', span: 1 },
          { text: '永遠先嘗試由上而下；卡住了再用由下而上救援', span: 2, style: 'accent' },
        ],
      ],
      afterTableHtml:
        '<p style="margin-top:18px; font-size:1.05rem; color:var(--muted); line-height:1.8;">「整個練習的目的，是確認你到底在回答哪一個問題。<br>一旦問題清楚，其他一切都水到渠成。」— Barbara Minto, Ch.3</p>',
    }),
  },

  // 9. Quiz
  {
    id: 'quiz',
    kicker: same('QUIZ · 你學會了嗎？'),
    title: same('情境題：你會怎麼回老闆？'),
    type: 'quiz',
    quiz: same({
      question: '老闆問：「客戶抱怨變多了，怎麼回事？」以下哪個回應符合金字塔原理？',
      options: [
        {
          text: '「我查了 A 客戶的信箱紀錄，然後 B 客戶上周打電話來……」',
          correct: false,
        },
        {
          text: '「主因是新上線的 App 更新：投訴量升了 40%，集中在登入問題。我建議本週內發 hotfix，並暫停自動更新。」',
          correct: true,
        },
        {
          text: '「這很複雜，可能牽涉很多因素，需要再多研究一下才能知道原因。」',
          correct: false,
        },
      ],
      correctMessage: '✅ 正確！先給答案，再給三個理由——標準的塔尖＋Key Line。',
      wrongMessage: '❌ 再想想：金字塔原理要求第一句話就是答案。換一個試試。',
    }),
  },

  // 10. Takeaway
  {
    id: 'takeaway',
    kicker: same('TAKEAWAY'),
    title: same('一句話帶走這一章'),
    type: 'takeaway',
    takeaway: same(`
      <p>先想清楚<b style="color: var(--accent)">問題的核心</b>，把答案放在塔尖，再讓證據乖乖待在底座。</p>
      <p style="color: var(--muted); margin-top: 16px;">想，可以由下而上；說，永遠由上而下。</p>
    `),
  },
];
