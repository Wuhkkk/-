// HALO — 座舱环形交互系统 · Vue 3（全局构建版本，无需构建工具）
const { createApp, ref, reactive, onMounted, onBeforeUnmount } = Vue;

const navLinks = [
  { id: 'media', label: '交互介质' },
  { id: 'modes', label: '场景' },
  { id: 'spec', label: '规格' },
  { id: 'contact', label: '联系' },
];

const mediaItems = [
  { idx: '01 · HALO RING', title: '环形状态环', desc: '沿仪表台下沿的 18mm 光环取代仪表屏，默认全黑，仅在必要时点亮对应区段。' },
  { idx: '02 · VOICE ENGINE', title: '语音优先引擎', desc: '六麦克风阵列分区拾音，呼吸光反馈"正在听 / 正在想"，无需唤醒词提示文字。' },
  { idx: '03 · ADAPTIVE SURFACE', title: '响应材质内饰', desc: '电致变色纤维随四种场景切换色温与纹理，把"已切换"变成可触摸的体验。' },
  { idx: '04 · HUD LAYER', title: '全息投影层', desc: '导航与限速信息投影在视线前方 3 米处，多数时间完全空白，视线无需下移。' },
];

const galleryStates = [
  { idx: 'STATE 01', title: '待机态', desc: '光环近乎全黑，只余一道暗线提示在线。', scene: 'scene-standby' },
  { idx: 'STATE 02', title: '语音唤醒态', desc: '波形替代任何"正在聆听"的文字提示。', scene: 'scene-voice' },
  { idx: 'STATE 05', title: '静憩模式', desc: '光环熄灭，唯一光源来自材质的呼吸微光。', scene: 'scene-rest' },
  { idx: 'STATE 06', title: '影院模式', desc: '唯一一次主动展开为宽幅显示。', scene: 'scene-cinema' },
  { idx: 'STATE 08', title: '紧急告警态', desc: '全程唯一的高饱和警示色——因平时克制，此刻才够刺眼。', scene: 'scene-alert' },
];

const specRows = [
  { key: '状态环', val: '18mm 高 · 全宽嵌入仪表台下沿', note: '约为传统三联屏面积的 1/6' },
  { key: '麦克风阵列', val: '6 麦克风 · 三分区拾音', note: '主驾 / 副驾 / 后排独立降噪' },
  { key: 'HUD 投影', val: '虚像距离 3m · 亮度自适应', note: '默认空白，仅导航与限速触发' },
  { key: '材质响应', val: '电致变色纤维 · 切换时长 1.2s', note: '覆盖门板、座椅侧翼' },
  { key: '场景触发', val: '日程 / 通话状态 / 心率变异性', note: '支持手动覆盖' },
];

// 竞品定位：横轴＝屏幕总面积/集成度，纵轴＝驾驶时认知负荷（viewBox 0 0 720 420）
const competitors = [
  { name: 'Mercedes Hyperscreen', x: 540, y: 60, tip: 'Mercedes Hyperscreen · 三联屏 · 认知负荷最高', us: false },
  { name: 'NIO ET9', x: 500, y: 95, tip: 'NIO ET9 · 多屏 + 副驾娱乐屏', us: false, labelDx: 11, labelDy: -2 },
  { name: 'XPeng G9', x: 420, y: 120, tip: 'XPeng G9 · 三联屏布局', us: false, labelDx: 11, labelDy: -2 },
  { name: '理想 L9', x: 460, y: 105, tip: '理想 L9 · 多屏 + 后排娱乐屏', us: false, labelDx: -68, labelDy: 35 },
  { name: 'HALO', x: 128, y: 300, tip: 'HALO · 环形状态环 + 语音优先 · 认知负荷最低', us: true, r: 8, labelDx: 12, labelDy: -3 },
];

const revealDirective = {
  mounted(el) {
    el.classList.add('reveal');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      el.classList.add('in');
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          el.classList.add('in');
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12 });
    io.observe(el);
  },
};

const app = createApp({
  setup() {
    const menuOpen = ref(false);
    const activeSection = ref('');
    const tip = reactive({ show: false, text: '', x: 0, y: 0 });
    const chartWrapRef = ref(null);
    const ringCanvas = ref(null);

    function toggleMenu() { menuOpen.value = !menuOpen.value; document.body.style.overflow = menuOpen.value ? 'hidden' : ''; }
    function closeMenu() { menuOpen.value = false; document.body.style.overflow = ''; }

    function showTip(text) { tip.show = true; tip.text = text; }
    function moveTip(evt) {
      if (!chartWrapRef.value) return;
      const rect = chartWrapRef.value.getBoundingClientRect();
      tip.x = evt.clientX - rect.left;
      tip.y = evt.clientY - rect.top;
    }
    function hideTip() { tip.show = false; }

    function onScroll() {
      const mid = window.scrollY + window.innerHeight * 0.35;
      let current = '';
      navLinks.forEach((link) => {
        const el = document.getElementById(link.id);
        if (el && el.offsetTop <= mid) current = link.id;
      });
      activeSection.value = current;
    }

    function drawRing(canvas) {
      const ctx = canvas.getContext('2d');
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const size = 380;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.scale(dpr, dpr);
      const cx = size / 2, cy = size / 2, r = size * 0.32;

      function frame(t) {
        ctx.clearRect(0, 0, size, size);
        ctx.strokeStyle = 'rgba(237,239,241,0.14)';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        const sweep = reduce ? 0 : (t / 2600) % (Math.PI * 2);
        const grad = ctx.createConicGradient ? ctx.createConicGradient(sweep, cx, cy) : null;
        if (grad) {
          grad.addColorStop(0, 'rgba(13,147,166,0)');
          grad.addColorStop(0.12, 'rgba(60,199,216,0.95)');
          grad.addColorStop(0.28, 'rgba(13,147,166,0)');
          grad.addColorStop(1, 'rgba(13,147,166,0)');
          ctx.strokeStyle = grad;
        } else {
          ctx.strokeStyle = '#0D93A6';
        }
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(13,147,166,0.9)';
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();

        if (!reduce) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    onMounted(() => {
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      if (ringCanvas.value) drawRing(ringCanvas.value);
    });
    onBeforeUnmount(() => window.removeEventListener('scroll', onScroll));

    return {
      navLinks, mediaItems, galleryStates, specRows, competitors,
      menuOpen, activeSection, tip, chartWrapRef, ringCanvas,
      toggleMenu, closeMenu, showTip, moveTip, hideTip,
    };
  },
});

app.directive('reveal', revealDirective);
app.mount('#app');
