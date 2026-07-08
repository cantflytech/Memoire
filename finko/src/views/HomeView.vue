<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  PiggyBank, 
  GraduationCap, 
  LineChart, 
  Home, 
  Palmtree, 
  Plane, 
  ShieldAlert, 
  Brain, 
  Layers, 
  Award,
  Flame
} from 'lucide-vue-next';

// --- GESTION DU SCROLL (Hero) ---
const scrollY = ref(0);
const handleScroll = () => {
  scrollY.value = window.scrollY;
};

// --- GESTION DU MONTAGE (Animation Hero) ---
const heroMounted = ref(false);
let heroTimer: ReturnType<typeof setTimeout>;

// --- GESTION DU IN-VIEW (Intersection Observers) ---
const pillarsRef = ref<HTMLElement | null>(null);
const epargneRef = ref<HTMLElement | null>(null);
const apprentissageRef = ref<HTMLElement | null>(null);
const investissementRef = ref<HTMLElement | null>(null);
const algorithmesRef = ref<HTMLElement | null>(null);
const ctaRef = ref<HTMLElement | null>(null);

const pillarsInView = ref(false);
const epargneInView = ref(false);
const apprentissageInView = ref(false);
const investissementInView = ref(false);
const algorithmesInView = ref(false);
const ctaInView = ref(false);

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });

  heroTimer = setTimeout(() => {
    heroMounted.value = true;
  }, 100);

  const createObserver = (targetRef: ref<HTMLElement | null>, inViewRef: ref<boolean>) => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        inViewRef.value = true;
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    
    if (targetRef.value) observer.observe(targetRef.value);
    return observer;
  };

  const obs1 = createObserver(pillarsRef, pillarsInView);
  const obs2 = createObserver(epargneRef, epargneInView);
  const obs3 = createObserver(apprentissageRef, apprentissageInView);
  const obs4 = createObserver(investissementRef, investissementInView);
  const obs5 = createObserver(algorithmesRef, algorithmesInView);
  const obs6 = createObserver(ctaRef, ctaInView);

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
    clearTimeout(heroTimer);
    obs1.disconnect();
    obs2.disconnect();
    obs3.disconnect();
    obs4.disconnect();
    obs5.disconnect();
    obs6.disconnect();
  });
});

// --- DONNÉES DES COMPOSANTS ---
const heroStats = [
  { n: '3', label: 'modules' },
  { n: '100%', label: 'gratuit en MVP' },
  { n: '0', label: 'expertise requise' },
];

const heroBars = [
  { label: 'Épargne', pct: 60, color: '#0D9488' },
  { label: 'Investissement', pct: 28, color: '#6366F1' },
  { label: 'Fonds urgence', pct: 12, color: '#F59E0B' },
];

const pillars = [
  {
    icon: PiggyBank,
    title: 'Épargne',
    desc: 'Construisez votre patrimoine étape par étape avec un bilan mensuel, des objectifs de vie et une vue considée de tous vos produits.',
    bg: '#E6FDF8',
    border: '#0D9488',
    shadow: '#0a7a70',
    tag: 'Livret A · PEL · Assurance-vie',
  },
  {
    icon: GraduationCap,
    title: 'Apprentissage',
    desc: "Progressez à votre rythme avec des cours interactifs, un système XP et des exercices pratiques sur l'épargne et l'investissement.",
    bg: '#D8D8FB',
    border: '#6366F1',
    shadow: '#4f52d9',
    tag: 'XP · Niveaux · Simulations',
  },
  {
    icon: LineChart,
    title: 'Investissement',
    desc: 'Analysez votre portefeuille, visualisez vos allocations et évaluez votre diversification avec un score dédié.',
    bg: '#FFFAEB',
    border: '#F59E0B',
    shadow: '#d68a09',
    tag: 'Actions · ETF · Crypto',
  },
];

const epargneGoals = [
  { label: 'Appartement', target: '50 000 €', pct: 42, icon: Home },
  { label: 'Retraite', target: '200 000 €', pct: 18, icon: Palmtree },
  { label: 'Voyage Japon', target: '3 000 €', pct: 78, icon: Plane },
];

const epargneFeatures = [
  "Bilan financier mensuel — revenus, dépenses, capacité d'épargne",
  'Objectifs de vie personnalisés — immobilier, retraite, voyages',
  'Vue consolidée Livret A, LDDS, PEL, assurance-vie',
  'Projection patrimoniale et impact de vos projets de vie',
  "Fonds d'urgence intégré pour votre sécurité financière",
  "Pyramide de l'épargne pour prioriser votre construction patrimoniale",
];

const lessons = [
  { title: 'Comprendre son budget', xp: 50, done: true, icon: PiggyBank },
  { title: "Créer son fonds de précaution", xp: 50, done: true, icon: Layers },
  { title: 'Épargner vs Investir', xp: 50, done: false, icon: LineChart, active: true },
  { title: "Comprendre l'effet des intérêts composés", xp: 50, done: false, icon: TrendingUp },
];

const apprentissageFeatures = [
  { icon: GraduationCap, title: 'Cours adaptés', desc: 'À votre niveau actuel' },
  { icon: Award, title: 'Système XP', desc: 'Gagnez des points et montez de niveau' },
  { icon: LineChart, title: 'Simulations', desc: 'Pratiquez sur des cas réels' },
  { icon: Layers, title: 'Parcours dédié', desc: 'Épargne ou investissement' },
];

const allocations = [
  { label: 'Actions', pct: 35, color: '#0D9488' },
  { label: 'ETF', pct: 28, color: '#6366F1' },
  { label: 'Obligations', pct: 18, color: '#F59E0B' },
  { label: 'Immobilier', pct: 12, color: '#F43F5E' },
  { label: 'Crypto', pct: 7, color: '#B2B2B2' },
];

const investissementItems = [
  { icon: LineChart, title: 'Performance globale', desc: 'Suivi en temps réel de votre portefeuille' },
  { icon: Layers, title: 'Score de diversification', desc: 'Évaluez votre niveau de répartition du risque' },
  { icon: TrendingUp, title: 'Vue détaillée par actif', desc: 'Actions, obligations, ETF, immobilier, crypto' },
  { icon: ShieldAlert, title: 'Analyse de volatilité', desc: 'Comprenez le risque de chaque position' },
];

const algos = [
  {
    icon: LineChart,
    color: '#6366F1',
    bg: '#D8D8FB',
    borderBot: '#4f52d9',
    title: "Algorithmes d'investissement",
    sub: 'Simulations Monte-Carlo',
    desc: 'Des modèles de gestion de portefeuille permettent de simuler plusieurs trajectoires patrimoniales possibles selon différents scénarios de marché.',
    tag: 'Monte-Carlo · Projection multi-scénarios',
  },
  {
    icon: Brain,
    color: '#0D9488',
    bg: '#E6FDF8',
    borderBot: '#0a7a70',
    title: "Algorithmes d'épargne",
    sub: "Moteur d'optimisation",
    desc: "Un moteur d'optimisation propose des répartitions optimales entre liquidité, sécurité et rendement — adaptées à votre profil et vos objectifs.",
    tag: 'Liquidité · Sécurité · Rendement',
  },
];

// Logique Donut SVG
const radius = 42;
const circ = 2 * Math.PI * radius;
const getDashOffset = (index: number) => {
  let cumulative = 0;
  for (let i = 0; i < index; i++) {
    cumulative += allocations[i].pct;
  }
  return -cumulative * circ / 100;
};
</script>

<template>
  <div class="w-full bg-[#F8FAFC] overflow-x-hidden">
    
    <section class="relative min-h-screen overflow-hidden bg-[#0D9488] flex items-center">
      <div class="absolute inset-0 pointer-events-none" :style="{ transform: `translateY(${scrollY * 0.3}px)` }">
        <div class="absolute top-24 right-[8%] w-64 h-64 bg-white/10 rounded-full blur-2xl" />
        <div class="absolute bottom-24 left-[5%] w-96 h-96 bg-[#0a7a70]/60 rounded-full blur-3xl" />
      </div>
      <div class="absolute inset-0 opacity-10" :style="{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }" />

      <div class="relative z-10 max-w-6xl mx-auto px-6 py-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-0">
        <div class="flex-1 text-center lg:text-left">
          <div class="transition-all duration-700" :class="heroMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'">
            <div class="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <span class="w-2 h-2 rounded-full bg-[#F59E0B] animate-bounce-soft" />
              <span class="text-white font-semibold text-sm">Disponible maintenant — MVP Finko</span>
            </div>
          </div>

          <h1 class="font-black text-white text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight mb-6 transition-all duration-700 delay-100" :class="heroMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'">
            Apprenez à gérer <br />
            <span class="text-[#FFD793]">votre argent.</span> <br />
            Vraiment.
          </h1>

          <p class="text-white/80 text-lg md:text-xl max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed transition-all duration-700 delay-200" :class="heroMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'">
            Finko est une plateforme de guidance financière pour les particuliers qui veulent construire une stabilité financière — sans expertise préalable.
          </p>

          <div class="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start transition-all duration-700 delay-300" :class="heroMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'">
            <RouterLink to="/login" class="group flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-white text-[#0D9488] font-black text-lg border-b-[4px] border-[#c8c8c8] hover:translate-y-[2px] hover:border-b-[2px] transition-all shadow-lg">
             Commencer gratuitement
              <ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </RouterLink>
          </div>
        </div>

        <div class="flex-1 flex justify-center lg:justify-end" :style="{ transform: `translateY(${scrollY * -0.1}px)` }">
          <div class="relative transition-all duration-1000 delay-500" :class="heroMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'">
            <div class="w-72 md:w-80 bg-white rounded-3xl p-6 border-b-[5px] border-black shadow-2xl animate-float">
              <div class="flex items-center gap-3 mb-5">
                <div class="w-10 h-10 rounded-xl bg-[#E6FDF8] flex items-center justify-center text-[#0D9488]">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879.559c.617.392 1.38.392 1.998 0A14.99 14.99 0 0 0 13 15.4V14m0-4V8m0 4v2m0-4c.325 0 .646-.033.959-.1a2.396 2.396 0 0 0 1.258-.707c.473-.473.663-1.144.475-1.782l-.128-.431a14.99 14.99 0 0 0-1.228-2.903C13.722 3.392 12.958 3.392 12.34 3.784L12 4M9.25 12h5.5" /></svg>
                </div>
                <div>
                  <div class="font-black text-black text-base">Mon patrimoine</div>
                  <div class="text-gray-400 text-xs">Mis à jour aujourd'hui</div>
                </div>
              </div>
              <div class="text-4xl font-black text-black mb-1">24 350 €</div>
              <div class="flex items-center gap-1 mb-5">
                <span class="text-[#0D9488] font-bold text-sm">▲ +12.4%</span>
                <span class="text-gray-400 text-xs">cette année</span>
              </div>
              <div class="space-y-2.5">
                <div v-for="bar in heroBars" :key="bar.label">
                  <div class="flex justify-between text-xs font-semibold mb-1">
                    <span class="text-gray-600">{{ bar.label }}</span>
                    <span :style="{ color: bar.color }">{{ bar.pct }}%</span>
                  </div>
                  <div class="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-1000" :style="{ width: `${bar.pct}%`, background: bar.color }" />
                  </div>
                </div>
              </div>
            </div>

            <div class="absolute -top-5 -right-6 bg-[#F59E0B] text-white rounded-2xl px-4 py-3 border-b-[4px] border-[#d68a09] shadow-lg animate-float-alt flex items-center gap-1.5">
              <Award class="w-5 h-5" />
              <div class="font-black text-xl leading-none">5</div>
            </div>
            <div class="absolute -bottom-4 -left-6 bg-[#F43F5E] text-white rounded-2xl px-4 py-3 border-b-[4px] border-[#e02d4c] shadow-lg animate-float flex items-center gap-1.5" style="animation-delay: 1.5s;">
              <Flame class="w-5 h-5 fill-white" />
              <div class="font-black text-xl leading-none">14j</div>
            </div>
          </div>
        </div>
      </div>

      <div class="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" class="w-full" preserveAspectRatio="none">
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#F8FAFC" />
        </svg>
      </div>
    </section>

    <section class="py-20 md:py-28 bg-[#F8FAFC]">
      <div class="max-w-6xl mx-auto px-6">
        <div ref="pillarsRef" class="text-center mb-14 transition-all duration-700" :class="pillarsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'">
          <h2 class="font-black text-black text-4xl md:text-5xl tracking-tight mb-4">
            Trois piliers, <span class="text-[#0D9488]">une seule plateforme</span>
          </h2>
          <p class="text-gray-500 text-lg max-w-2xl mx-auto">
            Finko combine épargne, apprentissage et investissement pour vous donner une vision complète de votre santé financière.
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-6">
          <div v-for="(p, i) in pillars" :key="p.title" class="group rounded-3xl p-7 border-2 border-b-[5px] cursor-pointer transition-all duration-700 hover:translate-y-[-4px] hover:scale-[1.01]" :class="pillarsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'" :style="{ background: p.bg, borderColor: p.border, borderBottomColor: p.shadow, transitionDelay: `${i * 120}ms` }">
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md transition-transform group-hover:scale-110 duration-300 bg-white" :style="{ color: p.border }">
              <component :is="p.icon" class="w-8 h-8" />
            </div>
            <h3 class="font-black text-black text-2xl mb-2 :group-hover:text-black">{{ p.title }}</h3>
            <p class="text-gray-600 text-sm leading-relaxed mb-4">{{ p.desc }}</p>
            <div class="inline-block rounded-full px-3 py-1 text-xs font-bold" :style="{ background: 'white', color: p.border }">
              {{ p.tag }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="épargne" class="py-20 md:py-28 bg-white overflow-hidden">
      <div class="max-w-6xl mx-auto px-6">
        <div ref="epargneRef" class="flex flex-col lg:flex-row items-center gap-14">
          <div class="flex-1 transition-all duration-700" :class="epargneInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'">
            <div class="relative mx-auto w-fit">
              <div class="w-72 bg-white rounded-3xl p-6 border-2 border-b-[5px] border-[#0D9488]" style="border-bottom-color: #0a7a70;">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-9 h-9 rounded-xl bg-[#E6FDF8] flex items-center justify-center text-[#0D9488]">
                    <LineChart class="w-5 h-5" />
                  </div>
                  <div class="font-black text-black text-sm">Objectifs de vie</div>
                </div>
                <div class="space-y-3">
                  <div v-for="goal in epargneGoals" :key="goal.label" class="p-3 rounded-xl bg-[#F8FAFC]">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-2">
                        <component :is="goal.icon" class="w-4 h-4 text-gray-700" />
                        <span class="font-bold text-black text-sm">{{ goal.label }}</span>
                      </div>
                      <span class="text-[#0D9488] font-black text-sm">{{ goal.pct }}%</span>
                    </div>
                    <div class="h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div class="h-full rounded-full bg-[#0D9488] transition-all duration-1000" :style="{ width: `${goal.pct}%` }" />
                    </div>
                    <div class="text-gray-400 text-xs mt-1">Objectif : {{ goal.target }}</div>
                  </div>
                </div>
              </div>
              <div class="absolute -bottom-5 -right-6 bg-[#FFD793] rounded-2xl px-4 py-3 border-2 border-b-[4px] border-[#d68a09] shadow-lg">
                <div class="text-xs font-bold text-[#92400e] mb-1">Pyramide</div>
                <div class="flex items-end gap-0.5">
                  <div v-for="(h, i) in [3, 5, 7, 9, 11]" :key="i" class="rounded-sm bg-[#F59E0B]" :style="{ width: '8px', height: `${h * 2}px` }" />
                </div>
              </div>
              <div class="absolute -top-5 -left-6 bg-white rounded-2xl px-4 py-3 border-2 border-b-[4px] border-black shadow-lg flex items-center gap-2">
                <svg class="w-5 h-5 text-[#0D9488]" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>
                <div class="text-left">
                  <div class="text-[10px] font-bold text-gray-400 leading-none">Urgence</div>
                  <div class="font-black text-black text-sm">3 mois</div>
                </div>
              </div>
            </div>
          </div>
          <div class="flex-1 transition-all duration-700 delay-150" :class="epargneInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'">
            <div class="inline-block bg-[#E6FDF8] text-[#0D9488] font-black text-sm px-4 py-1.5 rounded-full mb-5">Module Épargne</div>
            <h2 class="font-black text-black text-4xl md:text-5xl tracking-tight leading-[1.05] mb-5">
              Construisez votre <br /><span class="text-[#0D9488]">patrimoine</span><br />pas à pas.
            </h2>
            <p class="text-gray-500 text-lg mb-7 leading-relaxed">
              Comprenez votre situation financière actuelle et définissez des objectifs de vie concrets — le tout dans une interface claire et pédagogique.
            </p>
            <ul class="space-y-3">
              <li v-for="(f, i) in epargneFeatures" :key="i" class="flex items-start gap-3">
                <CheckCircle2 class="w-5 h-5 text-[#0D9488] mt-0.5 flex-shrink-0" />
                <span class="text-gray-700 text-sm">{{ f }}</span>
              </li>
            </ul>
            <RouterLink to="/login" class="mt-8 px-7 py-3.5 rounded-2xl bg-[#0D9488] text-white font-black text-base border-b-[4px] border-[#0a7a70] hover:translate-y-[2px] hover:border-b-[2px] transition-all shadow-md inline-block text-center">
              Explorer l'épargne →
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <section id="apprentissage" class="py-20 md:py-28 bg-[#F8FAFC] overflow-hidden">
      <div class="max-w-6xl mx-auto px-6">
        <div ref="apprentissageRef" class="flex flex-col lg:flex-row-reverse items-center gap-14">
          <div class="flex-1 transition-all duration-700" :class="apprentissageInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'">
            <div class="relative mx-auto w-fit">
              <div class="w-72 bg-white rounded-3xl p-6 border-2 border-b-[5px] border-[#6366F1]" style="border-bottom-color: #4f52d9;">
                <div class="flex items-center justify-between mb-5">
                  <div class="flex items-center gap-2">
                    <Flame class="w-5 h-5 text-[#6366F1] fill-[#6366F1]" />
                    <div>
                      <div class="font-black text-black text-base">14 jours</div>
                      <div class="text-xs text-gray-400">Série en cours</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="font-black text-[#6366F1] text-base">1 250 XP</div>
                    <div class="text-xs text-gray-400">Cette semaine</div>
                  </div>
                </div>
                <div class="mb-5">
                  <div class="flex justify-between text-xs mb-1">
                    <span class="font-bold text-gray-500">Niveau 5</span>
                    <span class="font-bold text-[#6366F1]">2 450 / 3 000 XP</span>
                  </div>
                  <div class="h-3 rounded-full bg-[#D8D8FB] overflow-hidden">
                    <div class="h-full rounded-full bg-[#6366F1] transition-all duration-1000" style="width: 82%;" />
                  </div>
                </div>
                <div class="space-y-2">
                  <div v-for="l in lessons" :key="l.title" class="flex items-center gap-3 rounded-xl p-3" :class="[l.active ? 'bg-[#6366F1] text-white' : '', !l.active && l.done ? 'bg-[#D8D8FB]' : '', !l.active && !l.done ? 'bg-gray-100' : '']">
                    <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" :class="l.active ? 'bg-white/20 text-white' : 'bg-white text-[#6366F1]'">
                      <CheckCircle2 v-if="l.done" class="w-5 h-5" />
                      <component :is="l.icon" v-else class="w-5 h-5" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="font-bold text-xs leading-tight" :class="[l.active ? 'text-white' : '', l.done && !l.active ? 'text-[#4f52d9]' : '', !l.done && !l.active ? 'text-gray-400' : '']">
                        {{ l.title }}
                      </div>
                    </div>
                    <div class="text-xs font-black flex-shrink-0" :class="[l.active ? 'text-white/80' : '', l.done && !l.active ? 'text-[#6366F1]' : '', !l.done && !l.active ? 'text-gray-300' : '']">
                      +{{ l.xp }} XP
                    </div>
                  </div>
                </div>
              </div>
              <div class="absolute -top-4 -right-5 bg-[#6366F1] text-white rounded-2xl px-4 py-2.5 border-b-[4px] border-[#4f52d9] shadow-lg flex items-center gap-1.5">
                <Award class="w-5 h-5" />
                <div class="font-black text-xl">5</div>
              </div>
              <div class="absolute -bottom-4 -left-5 bg-white rounded-2xl px-4 py-2.5 border-2 border-b-[4px] border-black shadow-lg flex items-center gap-1.5">
                <Award class="w-4 h-4 text-[#6366F1]" />
                <div class="font-black text-black text-sm">Épargnant Pro</div>
              </div>
            </div>
          </div>
          <div class="flex-1 transition-all duration-700 delay-150" :class="apprentissageInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'">
            <div class="inline-block bg-[#D8D8FB] text-[#6366F1] font-black text-sm px-4 py-1.5 rounded-full mb-5">Module Apprentissage</div>
            <h2 class="font-black text-black text-4xl md:text-5xl tracking-tight leading-[1.05] mb-5">
              Progressez <br /><span class="text-[#6366F1]">à votre rythme.</span><br />Chaque jour.
            </h2>
            <p class="text-gray-500 text-lg mb-7 leading-relaxed">
              Des cours interactifs adaptés à votre niveau, un système de progression avec XP et niveaux — comme un jeu, mais pour votre avenir financier.
            </p>
            <div class="grid grid-cols-2 gap-4 mb-8">
              <div v-for="item in apprentissageFeatures" :key="item.title" class="p-4 rounded-2xl bg-white border-2 border-b-[4px] border-[#6366F1] hover:translate-y-[-2px] transition-all text-[#6366F1]" style="border-bottom-color: #4f52d9;">
                <component :is="item.icon" class="w-6 h-6 mb-1" />
                <div class="font-black text-black text-sm">{{ item.title }}</div>
                <div class="text-gray-400 text-xs">{{ item.desc }}</div>
              </div>
            </div>
            <RouterLink to="/login" class="px-7 py-3.5 rounded-2xl bg-[#6366F1] text-white font-black text-base border-b-[4px] border-[#4f52d9] hover:translate-y-[2px] hover:border-b-[2px] transition-all shadow-md inline-block text-center">
              Commencer à apprendre →
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <section id="investissement" class="py-20 md:py-28 bg-white overflow-hidden">
      <div class="max-w-6xl mx-auto px-6">
        <div ref="investissementRef" class="flex flex-col lg:flex-row items-center gap-14">
          <div class="flex-1 transition-all duration-700" :class="investissementInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'">
            <div class="relative mx-auto w-fit">
              <div class="w-72 bg-white rounded-3xl p-6 border-2 border-b-[5px] border-[#F59E0B]" style="border-bottom-color: #d68a09;">
                <div class="flex items-center justify-between mb-4">
                  <div class="font-black text-black text-base">Mon portefeuille</div>
                  <span class="bg-[#E6FDF8] text-[#0D9488] font-black text-xs px-2.5 py-1 rounded-full">▲ +8.3%</span>
                </div>
                <div class="flex items-center gap-4 mb-5">
                  <div class="relative">
                    <svg viewBox="0 0 100 100" class="w-32 h-32 -rotate-90">
                      <circle v-for="(a, idx) in allocations" :key="a.label" cx="50" cy="50" :r="radius" fill="none" :stroke="a.color" stroke-width="14" :stroke-dasharray="`${(a.pct / 100) * circ} ${circ}`" :stroke-dashoffset="getDashOffset(idx)" />
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center">
                      <div class="text-center">
                        <div class="font-black text-black text-lg leading-none">82%</div>
                        <div class="text-xs text-gray-400">diversif.</div>
                      </div>
                    </div>
                  </div>
                  <div class="flex-1 space-y-1.5">
                    <div v-for="a in allocations" :key="a.label" class="flex items-center gap-2">
                      <div class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{ background: a.color }" />
                      <span class="text-xs text-gray-600 flex-1">{{ a.label }}</span>
                      <span class="text-xs font-black" :style="{ color: a.color }">{{ a.pct }}%</span>
                    </div>
                  </div>
                </div>
                <div class="bg-[#FFFAEB] rounded-2xl p-3">
                  <div class="text-xs font-bold text-gray-500 mb-2">Performance 12 mois</div>
                  <div class="flex items-end gap-1 h-10">
                    <div v-for="(h, i) in [4, 6, 5, 8, 7, 9, 8, 10, 9, 11, 10, 13]" :key="i" class="flex-1 rounded-t-sm" :style="{ height: `${h * 7}%`, background: i === 11 ? '#F59E0B' : '#FFD793' }" />
                  </div>
                </div>
              </div>
              <div class="absolute -bottom-4 -right-6 bg-[#F59E0B] text-white rounded-2xl px-4 py-2.5 border-b-[4px] border-[#d68a09] shadow-lg flex items-center gap-1">
                <LineChart class="w-5 h-5" />
                <div class="font-black text-xl">82/100</div>
              </div>
              <div class="absolute -top-4 -left-5 bg-white rounded-2xl px-4 py-2.5 border-2 border-b-[4px] border-black shadow-lg">
                <div class="text-xs text-gray-400 font-bold">Valeur totale</div>
                <div class="font-black text-black text-base">18 420 €</div>
              </div>
            </div>
          </div>
          <div class="flex-1 transition-all duration-700 delay-150" :class="investissementInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'">
            <div class="inline-block bg-[#FFFAEB] text-[#F59E0B] font-black text-sm px-4 py-1.5 rounded-full mb-5">Module Investissement</div>
            <h2 class="font-black text-black text-4xl md:text-5xl tracking-tight leading-[1.05] mb-5">
              Analysez votre <br /><span class="text-[#F59E0B]">portefeuille</span><br />en temps réel.
            </h2>
            <p class="text-gray-500 text-lg mb-7 leading-relaxed">
              Visualisez vos allocations, mesurez votre diversification et suivez la performance de vos investissements par famille d'actifs.
            </p>
            <div class="space-y-3 mb-8">
              <div v-for="item in investissementItems" :key="item.title" class="flex items-start gap-4 p-4 rounded-2xl bg-[#FFFAEB] border border-[#FFD793]">
                <component :is="item.icon" class="w-6 h-6 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                <div>
                  <div class="font-black text-black text-sm">{{ item.title }}</div>
                  <div class="text-gray-500 text-xs">{{ item.desc }}</div>
                </div>
              </div>
            </div>
            <RouterLink to="/login" class="px-7 py-3.5 rounded-2xl bg-[#F59E0B] text-white font-black text-base border-b-[4px] border-[#d68a09] hover:translate-y-[2px] hover:border-b-[2px] transition-all shadow-md inline-block text-center">
              Analyser mon portefeuille →
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <section id="algorithmes" class="py-20 md:py-28 bg-[#F8FAFC]">
      <div class="max-w-6xl mx-auto px-6">
        <div ref="algorithmesRef" class="text-center mb-14 transition-all duration-700" :class="algorithmesInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'">
          <h2 class="font-black text-black text-4xl md:text-5xl tracking-tight mb-4">
            Des algorithmes qui <span class="text-[#F43F5E]">travaillent pour vous</span>
          </h2>
          <p class="text-gray-500 text-lg max-w-2xl mx-auto">
            L'objectif n'est pas de vous transformer en expert financier ou trader actif — mais de vous aider à prendre des décisions adaptées à votre profil.
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-8 mb-14">
          <div v-for="(a, i) in algos" :key="a.title" class="rounded-3xl p-8 border-2 border-b-[5px] transition-all duration-700 hover:translate-y-[-4px]" :class="algorithmesInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'" :style="{ background: a.bg, borderColor: a.color, borderBottomColor: a.borderBot, transitionDelay: `${i * 150}ms` }">
            <div class="flex items-center gap-4 mb-5">
              <div class="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-md" :style="{ color: a.color }">
                <component :is="a.icon" class="w-7 h-7" />
              </div>
              <div>
                <div class="font-black text-black text-lg leading-tight">{{ a.title }}</div>
                <div class="text-sm font-bold" :style="{ color: a.color }">{{ a.sub }}</div>
              </div>
            </div>
            <p class="text-gray-600 text-sm leading-relaxed mb-5">{{ a.desc }}</p>
            <div class="inline-block bg-white rounded-full px-3 py-1 text-xs font-bold" :style="{ color: a.color }">
              {{ a.tag }}
            </div>
          </div>
        </div>

        <div class="rounded-3xl p-7 bg-black text-white text-center transition-all duration-700 delay-300" :class="algorithmesInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'">
          <div class="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4 text-[#FFD793]">
            <LineChart class="w-6 h-6" />
          </div>
          <p class="font-bold text-xl mb-2">Pas de jargon. Pas de prise de tête.</p>
          <p class="text-gray-400 text-base max-w-xl mx-auto">
            Finko vous aide à comprendre ce que vous faites avec votre argent — sans vous obliger à devenir un expert de la finance.
          </p>
        </div>
      </div>
    </section>

    <section ref="ctaRef" class="py-20 md:py-28 bg-[#0D9488] relative overflow-hidden">
      <div class="absolute inset-0 opacity-10" :style="{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }" />
      <div class="absolute top-10 right-16 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
      <div class="absolute bottom-10 left-10 w-64 h-64 bg-[#0a7a70]/50 rounded-full blur-3xl" />

      <div class="relative z-10 max-w-3xl mx-auto px-6 text-center transition-all duration-700" :class="ctaInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'">
        <div class="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#FFD793]">
          <TrendingUp class="w-8 h-8" />
        </div>
        <h2 class="font-black text-white text-4xl md:text-6xl tracking-tight leading-[1.05] mb-5">
          Prêt à construire <br /><span class="text-[#FFD793]">votre avenir financier ?</span>
        </h2>
        <p class="text-white/80 text-lg mb-10 max-w-xl mx-auto">
          Rejoignez Finko et commencez dès aujourd'hui — sans expertise requise, sans carte bancaire, sans prise de tête.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button class="group flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-white text-[#0D9488] font-black text-lg border-b-[4px] border-[#c8c8c8] hover:translate-y-[2px] hover:border-b-[2px] transition-all shadow-xl">
            Commencer gratuitement
            <ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button class="px-10 py-5 rounded-2xl bg-white/15 backdrop-blur-sm text-white font-black text-lg border-2 border-white/40 hover:bg-white/25 transition-all">
            En savoir plus
          </button>
        </div>
        <p class="mt-6 text-white/50 text-sm">Aucune carte bancaire requise · Accès gratuit pendant le MVP</p>
      </div>

      <div class="absolute top-0 left-0 right-0 rotate-180">
        <svg viewBox="0 0 1440 60" class="w-full" preserveAspectRatio="none">
          <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="#F8FAFC" />
        </svg>
      </div>
    </section>

  </div>
</template>