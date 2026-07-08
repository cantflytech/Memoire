<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { db, auth } from '../firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth'; // 🆕 Ajouté pour sécuriser le chargement
import {
  ArrowLeft,
  Sparkles,
  Target,
  Plus,
  RotateCcw,
  BarChart3,
  Activity,
  Shield,
  TrendingUp,
  TrendingDown
} from 'lucide-vue-next';

const router = useRouter();
const loading = ref(true);
const running = ref(false);
const initialCapital = ref(10000);
const horizonYears = ref(10);
const simulationCount = ref(2000);
const selectedTicker = ref('');
const selectedCategory = ref('ETF');

const universe = ref([]);
const candidatePortfolios = ref([]);
const efficientFrontier = ref([]);
const bestPortfolio = ref(null);
const minVolPortfolio = ref(null);
const maxReturnPortfolio = ref(null);
const sampleCurve = ref([]);

const categoryStyles = {
  Crypto: '#6366F1',
  ETF: '#F59E0B',
  Obligation: '#00AA90',
  Immobilier: '#F43F5E',
  Custom: '#111827'
};

const heuristicByCategory = {
  Crypto: { expectedReturn: 0.18, volatility: 0.58 },
  ETF: { expectedReturn: 0.085, volatility: 0.13 },
  Obligation: { expectedReturn: 0.035, volatility: 0.04 },
  Immobilier: { expectedReturn: 0.065, volatility: 0.08 },
  Custom: { expectedReturn: 0.07, volatility: 0.12 }
};

const presetUniverse = [
  { ticker: 'BTC', name: 'Bitcoin', category: 'Crypto' },
  { ticker: 'ETH', name: 'Ethereum', category: 'Crypto' },
  { ticker: 'CW8', name: 'Amundi MSCI World ETF', category: 'ETF' },
  { ticker: 'SPSP', name: 'iShares S&P 500 ETF', category: 'ETF' },
  { ticker: 'OBLIG-EUR', name: 'Obligations Euro Court Terme', category: 'Obligation' },
  { ticker: 'REIT-US', name: 'Vanguard Real Estate ETF', category: 'Immobilier' }
];

const addAsset = (asset) => {
  if (!asset || !asset.ticker) return;
  if (universe.value.some((currentAsset) => currentAsset.ticker === asset.ticker)) return;
  universe.value = [...universe.value, { ...asset }];
};

const removeAsset = (ticker) => {
  universe.value = universe.value.filter((asset) => asset.ticker !== ticker);
  if (universe.value.length === 0) {
    universe.value = [...presetUniverse];
  }
};

const resetUniverse = () => {
  universe.value = [...presetUniverse];
};

const addCustomTicker = () => {
  const ticker = selectedTicker.value.trim().toUpperCase();
  if (!ticker) return;

  addAsset({
    ticker,
    name: ticker,
    category: selectedCategory.value
  });

  selectedTicker.value = '';
};

const randomNormal = () => {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

const normalizeWeights = (values) => {
  const total = values.reduce((sum, value) => sum + value, 0) || 1;
  return values.map((value) => value / total);
};

const annualizeReturn = (dailyReturns) => {
  if (!dailyReturns.length) return 0;
  return dailyReturns.reduce((sum, value) => sum + value, 0) / dailyReturns.length * 252;
};

const annualizeVolatility = (dailyReturns) => {
  if (!dailyReturns.length) return 0;
  const dailyMean = dailyReturns.reduce((sum, value) => sum + value, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((sum, value) => sum + Math.pow(value - dailyMean, 2), 0) / dailyReturns.length;
  return Math.sqrt(variance) * Math.sqrt(252);
};

const calcDailyReturns = (prices) => {
  const returns = [];
  for (let index = 1; index < prices.length; index++) {
    const previous = prices[index - 1];
    const current = prices[index];
    if (previous > 0 && current > 0) {
      returns.push(Math.log(current / previous));
    }
  }
  return returns;
};

const interpolateColor = (ratio) => {
  const value = Math.min(1, Math.max(0, ratio));
  if (value < 0.35) return '#4338CA';
  if (value < 0.7) return '#0EA5E9';
  if (value < 0.9) return '#10B981';
  return '#F59E0B';
};

const chartDomain = computed(() => {
  if (!candidatePortfolios.value.length) {
    return { minVol: 0, maxVol: 1, minReturn: 0, maxReturn: 1, minSharpe: 0, maxSharpe: 1 };
  }
  return {
    minVol: Math.min(...candidatePortfolios.value.map((p) => p.volatility)),
    maxVol: Math.max(...candidatePortfolios.value.map((p) => p.volatility)),
    minReturn: Math.min(...candidatePortfolios.value.map((p) => p.expectedReturn)),
    maxReturn: Math.max(...candidatePortfolios.value.map((p) => p.expectedReturn)),
    minSharpe: Math.min(...candidatePortfolios.value.map((p) => p.sharpe)),
    maxSharpe: Math.max(...candidatePortfolios.value.map((p) => p.sharpe))
  };
});

const pointPosition = (portfolio) => {
  const domain = chartDomain.value;
  const xRange = Math.max(domain.maxVol - domain.minVol, 0.00001);
  const yRange = Math.max(domain.maxReturn - domain.minReturn, 0.00001);
  const x = 40 + ((portfolio.volatility - domain.minVol) / xRange) * 540;
  const y = 390 - ((portfolio.expectedReturn - domain.minReturn) / yRange) * 330;
  return { x, y };
};

const bestLabel = computed(() => {
  if (!bestPortfolio.value) return 'Aucune allocation calculée';
  return bestPortfolio.value.weights
    .map((weight, index) => ({
      ticker: bestPortfolio.value.assets[index].ticker,
      weight: weight * 100
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 4)
    .map((item) => `${item.ticker} ${item.weight.toFixed(0)}%`)
    .join(' · ');
});

const optimalLabel = computed(() => bestLabel.value);

const portfolioWeightLabels = computed(() => {
  if (!bestPortfolio.value) return [];
  return bestPortfolio.value.weights
    .map((weight, index) => ({
      ...(bestPortfolio.value.assets[index] || {}),
      weightPercent: weight * 100
    }))
    .sort((a, b) => b.weightPercent - a.weightPercent);
});

const simulatePortfolioPath = (assets, weights, years) => {
  let capital = initialCapital.value;
  const curve = [capital];
  const expectedReturn = weights.reduce((sum, weight, index) => sum + weight * assets[index].expectedReturn, 0);
  const volatility = Math.sqrt(weights.reduce((sum, weight, index) => sum + Math.pow(weight * assets[index].volatility, 2), 0));

  for (let year = 0; year < years; year++) {
    const annualShock = expectedReturn + volatility * randomNormal();
    capital *= Math.max(0.05, 1 + annualShock / 100);
    curve.push(capital);
  }

  return curve;
};

const curveToSvgPoints = (curve) => {
  if (!curve.length) return '';
  const width = 640;
  const height = 240;
  const maxValue = Math.max(...curve);
  const minValue = Math.min(...curve);
  const range = Math.max(maxValue - minValue, 1);

  return curve
    .map((value, index) => {
      const x = (index / Math.max(curve.length - 1, 1)) * width;
      const y = height - ((value - minValue) / range) * (height - 20) - 10;
      return `${x},${y}`;
    })
    .join(' ');
};

const buildCovarianceMatrix = (returnSeries) => {
  const size = returnSeries.length;
  const minLength = Math.min(...returnSeries.map((series) => series.length));
  const aligned = returnSeries.map((series) => series.slice(series.length - minLength));
  const means = aligned.map((series) => series.reduce((sum, value) => sum + value, 0) / series.length);
  const matrix = Array.from({ length: size }, () => Array(size).fill(0));

  for (let i = 0; i < size; i++) {
    for (let j = i; j < size; j++) {
      let covariance = 0;
      for (let index = 0; index < aligned[i].length; index++) {
        covariance += (aligned[i][index] - means[i]) * (aligned[j][index] - means[j]);
      }
      covariance /= aligned[i].length || 1;
      const annualized = covariance * 252;
      matrix[i][j] = annualized;
      matrix[j][i] = annualized;
    }
  }

  return { matrix, means };
};

const portfolioMetrics = (weights, expectedReturns, covarianceMatrix) => {
  const expectedReturn = weights.reduce((sum, weight, index) => sum + weight * expectedReturns[index], 0);
  let variance = 0;
  for (let i = 0; i < weights.length; i++) {
    for (let j = 0; j < weights.length; j++) {
      variance += weights[i] * weights[j] * covarianceMatrix[i][j];
    }
  }
  const volatility = Math.sqrt(Math.max(variance, 0));
  const sharpe = volatility > 0 ? expectedReturn / volatility : 0;
  return { expectedReturn, volatility, sharpe };
};

const generateCandidate = (assets) => {
  const raw = assets.map(() => Math.random() + 0.01);
  return normalizeWeights(raw);
};

const buildEfficientFrontier = (portfolios) => {
  const sorted = [...portfolios].sort((a, b) => a.volatility - b.volatility);
  const frontier = [];
  const bins = 60;
  const minVol = sorted[0]?.volatility || 0;
  const maxVol = sorted[sorted.length - 1]?.volatility || 1;
  const step = (maxVol - minVol) / bins || 1;

  for (let index = 0; index <= bins; index++) {
    const lower = minVol + index * step;
    const upper = lower + step;
    const slice = sorted.filter((portfolio) => portfolio.volatility >= lower && portfolio.volatility < upper);
    if (slice.length) {
      frontier.push(slice.reduce((best, portfolio) => (portfolio.expectedReturn > best.expectedReturn ? portfolio : best), slice[0]));
    }
  }

  return frontier;
};

const runSimulation = async () => {
  if (universe.value.length < 2) return;
  running.value = true;
  bestPortfolio.value = null;
  minVolPortfolio.value = null;
  maxReturnPortfolio.value = null;
  candidatePortfolios.value = [];
  efficientFrontier.value = [];
  sampleCurve.value = [];

  const assets = universe.value.map((asset) => ({
    ...asset,
    expectedReturn: Number(asset.expectedReturn ?? heuristicByCategory[asset.category]?.expectedReturn ?? 7),
    volatility: Number(asset.volatility ?? heuristicByCategory[asset.category]?.volatility ?? 12)
  }));

  const returnSeries = assets.map((asset) => {
    if (asset.history && asset.history.length > 40) {
      return calcDailyReturns(asset.history);
    }
    const annualReturn = (asset.expectedReturn || 7) / 100;
    const annualVol = (asset.volatility || 12) / 100;
    return Array.from({ length: 504 }, () => (annualReturn / 252) + (annualVol / Math.sqrt(252)) * randomNormal());
  });

  const { matrix: covarianceMatrix, means } = buildCovarianceMatrix(returnSeries);
  const expectedReturns = means.map((value, index) => {
    if (Number.isFinite(value) && value !== 0) return annualizeReturn(returnSeries[index]);
    return (assets[index].expectedReturn || 7) / 100;
  });

  const portfolios = [];
  const sampleCount = Math.max(1500, Number(simulationCount.value) || 2000);

  for (let index = 0; index < sampleCount; index++) {
    const weights = generateCandidate(assets);
    const metrics = portfolioMetrics(weights, expectedReturns, covarianceMatrix);
    portfolios.push({ assets, weights, ...metrics });
    if (index % 125 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
  }

  candidatePortfolios.value = portfolios;
  efficientFrontier.value = buildEfficientFrontier(portfolios);
  bestPortfolio.value = [...portfolios].sort((a, b) => b.sharpe - a.sharpe)[0];
  minVolPortfolio.value = [...portfolios].sort((a, b) => a.volatility - b.volatility)[0];
  maxReturnPortfolio.value = [...portfolios].sort((a, b) => b.expectedReturn - a.expectedReturn)[0];
  sampleCurve.value = simulatePortfolioPath(bestPortfolio.value.assets, bestPortfolio.value.weights, horizonYears.value);
  running.value = false;
};

// 🛠️ FONCTION CORRIGÉE AVEC SÉCURITÉ ANTI-CONFLIT DE PERMISSIONS
const loadUniverse = async (userSession = null) => {
  try {
    // On prend l'utilisateur actuellement connecté ou celui passé par l'écouteur
    const user = userSession || auth.currentUser;

    // Si aucun utilisateur n'est détecté, on ne tente pas de requêter Firestore (Évite l'erreur 403)
    if (!user) {
      console.warn("Aucun utilisateur connecté. Chargement de l'univers par défaut.");
      universe.value = [...presetUniverse];
      return;
    }

    const positionsRef = collection(db, 'user_investment_positions');
    // Le filtre 'where' est correct, mais requiert absolument un user.uid valide et non-null
    const q = query(positionsRef, where('userId', '==', user.uid));
    const snap = await getDocs(q);

    const assetsFromPortfolio = snap.docs.map((document) => {
      const position = document.data();
      return {
        ticker: position.ticker || 'UNKNOWN',
        name: position.name || 'Position Sans Nom',
        category: position.category || 'Custom'
      };
    });

    // Fusion ou remplacement selon vos besoins (ici remplacement, ou preset si vide)
    universe.value = assetsFromPortfolio.length ? assetsFromPortfolio : [...presetUniverse];

  } catch (error) {
    // Capture de l'erreur propre pour éviter le crash de l'interface
    console.error('Erreur lors de la récupération des activités :', error);
    universe.value = [...presetUniverse];
  } finally {
    loading.value = false;
  }
};

// 🛠️ CYCLES DE VIE CORRIGÉ : On attend que Firebase confirme l'état d'authentification
onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // L'utilisateur est identifié de manière sûre, on charge ses données
      await loadUniverse(user);
    } else {
      // L'utilisateur n'est pas connecté
      console.log("Utilisateur non authentifié.");
      universe.value = [...presetUniverse];
      loading.value = false;
    }
  });
});

// --- Reste de votre logique de simulation (Frontière efficiente, Monte Carlo...) ---
// (Conservez vos fonctions existantes comme pointPosition, interpolateColor, etc. en dessous)
</script>

<template>
  <main class="min-h-screen bg-[#F8FAFC] text-gray-900 font-['Inter'] p-4 md:p-8 heading">
    <div class="max-w-7xl mx-auto space-y-6">

      <!-- ================= GRANDE BANNIÈRE BANDEAU VIOLET (IMAGE_EEE203.PNG) ================= -->
      <section class="relative overflow-hidden bg-[#6366F1] text-white rounded-[24px] p-6 md:p-8 shadow-sm">
        <div class="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.4),transparent_50%)]"></div>
        
        <div class="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="space-y-3">
            <div class="flex flex-wrap items-center gap-3">
              <button @click="router.back()" class="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-white backdrop-blur hover:bg-white/30 transition-all cursor-pointer">
                <ArrowLeft class="w-3.5 h-3.5" /> Retour
              </button>
              <div class="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-100 backdrop-blur">
                <Sparkles class="w-3.5 h-3.5 text-amber-300" /> Intelligence Monte Carlo
              </div>
            </div>

            <h1 class="text-2xl md:text-4xl font-black tracking-tight leading-tight">
              Optimisation de Frontière Efficiente
            </h1>
            <p class="max-w-2xl text-xs md:text-sm text-indigo-100/90 font-medium leading-relaxed">
              Ce moteur génère des milliers de portefeuilles aléatoires à partir de données historiques pour isoler mathématiquement l'allocation maximisant le ratio de Sharpe (meilleur rapport risque/rendement).
            </p>
          </div>

          <!-- Panneau Paramètres d'entrée intégré au bandeau violet -->
          <div class="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-md w-full md:w-80 flex-shrink-0">
            <div class="space-y-3 text-xs">
              <label class="block space-y-1">
                <span class="block text-[9px] font-black uppercase tracking-wider text-indigo-100">Capital à simuler</span>
                <input v-model.number="initialCapital" type="number" class="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 font-black text-white outline-none placeholder:text-white/30 focus:bg-white/20" />
              </label>
              
              <div class="grid grid-cols-2 gap-2">
                <label class="space-y-1">
                  <span class="block text-[9px] font-black uppercase tracking-wider text-indigo-100">Horizon ({{ horizonYears }} ans)</span>
                  <input v-model.number="horizonYears" type="range" min="1" max="20" step="1" class="w-full accent-amber-400 cursor-pointer" />
                </label>
                <label class="space-y-1">
                  <span class="block text-[9px] font-black uppercase tracking-wider text-indigo-100">Simulations</span>
                  <input v-model.number="simulationCount" type="range" min="500" max="5000" step="250" class="w-full accent-white cursor-pointer" />
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Chargement dynamique -->
      <div v-if="loading" class="h-96 rounded-[24px] bg-white animate-pulse border border-gray-100"></div>

      <!-- ================= CONTENU PRINCIPAL DE L'OUTIL ================= -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        <!-- BLOC GAUCHE : Univers d'actifs & Modélisation de courbe (Col-span 2) -->
        <div class="lg:col-span-2 space-y-6 flex flex-col justify-between">
          
          <!-- Configuration de l'univers d'actifs -->
          <div class="bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm space-y-5 flex-grow">
            <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-50 pb-4">
              <div>
                <h2 class="text-sm font-black text-gray-900 uppercase tracking-wider">Univers d’actifs à analyser</h2>
                <p class="text-[11px] text-gray-400 font-medium">Ajoutez ou retirez des classes d'actifs pour alimenter la simulation.</p>
              </div>
              <button @click="resetUniverse" class="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-black text-gray-600 hover:bg-gray-100 transition-colors inline-flex items-center gap-1.5 cursor-pointer">
                <RotateCcw class="w-3.5 h-3.5" /> Réinitialiser
              </button>
            </div>

            <!-- Tickers prédéfinis -->
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="asset in presetUniverse"
                :key="asset.ticker"
                @click="addAsset(asset)"
                class="rounded-lg border border-gray-100 bg-gray-50/50 px-2.5 py-1 text-xs font-bold text-gray-600 hover:border-[#6366F1] hover:bg-indigo-50/40 transition-colors cursor-pointer"
              >
                + {{ asset.ticker }}
              </button>
            </div>

            <!-- Grille des actifs inclus -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div v-for="asset in universe" :key="asset.ticker" class="rounded-2xl border border-gray-100 p-3.5 bg-gray-50/30 flex items-center justify-between">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-[#6366F1]">
                      {{ asset.category }}
                    </span>
                    <span class="text-xs font-black text-gray-900">{{ asset.ticker }}</span>
                  </div>
                  <h3 class="text-xs font-bold text-gray-400 truncate max-w-[180px]">{{ asset.name }}</h3>
                </div>
                <button @click="removeAsset(asset.ticker)" class="text-gray-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer">
                  ✕
                </button>
              </div>
            </div>

            <!-- Ajout de Ticker Custom -->
            <div class="pt-2 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
              <label class="space-y-1">
                <span class="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Ticker Yahoo Finance</span>
                <input v-model="selectedTicker" type="text" placeholder="Ex: SPY, NVDA, VUSA" class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-bold text-gray-800 outline-none focus:border-[#6366F1]" />
              </label>
              <label class="space-y-1">
                <span class="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Catégorie d'allocation</span>
                <select v-model="selectedCategory" class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-bold text-gray-800 outline-none focus:border-[#6366F1] bg-no-repeat">
                  <option value="Crypto">Crypto</option>
                  <option value="ETF">ETF</option>
                  <option value="Obligation">Obligation</option>
                  <option value="Immobilier">Immobilier</option>
                  <option value="Custom">Custom</option>
                </select>
              </label>
              <button @click="addCustomTicker" class="rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] px-4 py-2.5 text-xs font-black text-white shadow-sm transition-colors inline-flex items-center gap-1.5 justify-center cursor-pointer">
                <Plus class="w-4 h-4" /> Ajouter
              </button>
            </div>
          </div>

          <!-- Courbe de capitalisation simulée -->
          <div class="bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm">
            <div class="flex items-center gap-1.5 text-xs font-black text-gray-400 uppercase tracking-wider mb-4">
              <BarChart3 class="w-4 h-4 text-amber-500" /> Trajectoire médiane du capital simulé
            </div>
            <div class="bg-gray-950 rounded-2xl p-4 border border-gray-800">
              <svg v-if="sampleCurve.length" viewBox="0 0 640 200" class="w-full h-[200px] overflow-visible">
                <defs>
                  <linearGradient id="curveFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.25" />
                    <stop offset="100%" stop-color="#F59E0B" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <polyline :points="curveToSvgPoints(sampleCurve)" fill="none" stroke="#F59E0B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                <polyline :points="curveToSvgPoints(sampleCurve) + ' 640,200 0,200'" fill="url(#curveFill)" stroke="none" />
              </svg>
              <div v-else class="h-[200px] flex items-center justify-center text-gray-600 text-xs font-bold uppercase tracking-wider">
                En attente du lancement des simulations...
              </div>
            </div>
          </div>
        </div>

        <!-- ================= COLONNE DROITE : Résultats de l'optimisation & Nuage HHI ================= -->
        <div class="space-y-6 flex flex-col justify-between h-full">
          
          <!-- Bloc Contrôle de Simulation & Répartition Optimale -->
          <div class="bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm flex flex-col justify-between h-full">
            <div>
              <h3 class="flex items-center gap-1.5 text-xs font-black text-gray-400 uppercase tracking-wider mb-5">
                <Target class="w-4 h-4 text-[#6366F1]" /> Résultats d'allocation
              </h3>

              <button @click="runSimulation" :disabled="running || universe.length < 2" class="w-full rounded-xl bg-[#00AA90] hover:bg-[#008F7A] text-white py-3.5 px-4 text-xs font-black shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                {{ running ? 'Calcul matriciel en cours...' : '🚀 Générer la frontière efficiente' }}
              </button>

              <!-- Affichage des résultats optimaux -->
              <div v-if="bestPortfolio" class="space-y-5 mt-5">
                <div class="rounded-2xl bg-indigo-50/50 border border-indigo-100/60 p-4">
                  <span class="text-[9px] font-black uppercase tracking-wider text-[#6366F1] block mb-1">Profil optimal identifié</span>
                  <p class="text-sm font-black text-gray-900 leading-tight">{{ optimalLabel }}</p>
                </div>

                <!-- Grille KPI Metrics -->
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div class="rounded-xl bg-gray-50/60 p-3 border border-gray-100">
                    <span class="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Rendement max</span>
                    <p class="text-sm font-black text-gray-900">{{ (bestPortfolio.expectedReturn * 100).toFixed(2) }}%</p>
                  </div>
                  <div class="rounded-xl bg-gray-50/60 p-3 border border-gray-100">
                    <span class="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Volatilité cible</span>
                    <p class="text-sm font-black text-gray-900">{{ (bestPortfolio.volatility * 100).toFixed(2) }}%</p>
                  </div>
                  <div class="rounded-xl bg-gray-50/60 p-3 border border-gray-100">
                    <span class="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Ratio de Sharpe</span>
                    <p class="text-sm font-black text-[#00AA90]">{{ bestPortfolio.sharpe.toFixed(2) }}</p>
                  </div>
                  <div class="rounded-xl bg-gray-50/60 p-3 border border-gray-100">
                    <span class="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Volatilité min</span>
                    <p class="text-sm font-black text-gray-900">{{ minVolPortfolio ? (minVolPortfolio.volatility * 100).toFixed(2) : '--' }}%</p>
                  </div>
                </div>

                <!-- Jauges de répartition des poids optimaux -->
                <div class="space-y-3 pt-2 border-t border-gray-50">
                  <div v-for="asset in portfolioWeightLabels" :key="asset.ticker" class="space-y-1">
                    <div class="flex justify-between text-xs font-bold text-gray-700">
                      <span>{{ asset.ticker }}</span>
                      <span class="font-black text-gray-900">{{ asset.weightPercent.toFixed(1) }}%</span>
                    </div>
                    <div class="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div class="h-full rounded-full bg-[#6366F1]" :style="{ width: `${asset.weightPercent}%` }"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- État vide -->
              <div v-else class="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center text-xs font-bold text-gray-400 uppercase tracking-wider mt-5">
                Sélectionnez 2 actifs minimum pour lancer l'analyse.
              </div>
            </div>
          </div>

          <!-- Nuage de points Monte Carlo & Graphique efficient -->
          <div class="bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm">
            <div class="flex items-center gap-1.5 text-xs font-black text-gray-400 uppercase tracking-wider mb-4">
              <Activity class="w-4 h-4 text-[#00AA90]" /> Cartographie Mathématique du Risque
            </div>

            <div class="rounded-2xl bg-gray-950 p-3 overflow-hidden border border-gray-800">
              <svg viewBox="0 0 620 400" class="w-full h-[320px] overflow-visible">
                <!-- Grille cartésienne en arrière-plan -->
                <g opacity="0.15">
                  <line v-for="i in 8" :key="`v-${i}`" :x1="40 + i * 70" y1="18" :x2="40 + i * 70" y2="360" stroke="#FFFFFF" stroke-width="1" />
                  <line v-for="i in 6" :key="`h-${i}`" x1="40" :y1="18 + i * 48" x2="600" :y2="18 + i * 48" stroke="#FFFFFF" stroke-width="1" />
                </g>

                <!-- Libellés des axes -->
                <text x="14" y="190" transform="rotate(-90 14 190)" fill="rgba(255,255,255,0.5)" font-size="10" font-weight="900" letter-spacing="1">RENDEMENT ATTENDU</text>
                <text x="312" y="390" fill="rgba(255,255,255,0.5)" font-size="10" font-weight="900" text-anchor="middle" letter-spacing="1">VOLATILITÉ (RISQUE)</text>

                <!-- Axes de base -->
                <line x1="40" y1="360" x2="600" y2="360" stroke="#475569" stroke-width="1.5" />
                <line x1="40" y1="18" x2="40" y2="360" stroke="#475569" stroke-width="1.5" />

                <!-- Rendu de la courbe efficiente (Frontière) -->
                <polyline v-if="efficientFrontier.length > 1" :points="efficientFrontier.map((p) => {
                  const pt = pointPosition(p);
                  return `${pt.x},${pt.y}`;
                }).join(' ')" fill="none" stroke="#F59E0B" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

                <!-- Rendu du nuage de points généré aléatoirement par Monte Carlo -->
                <circle v-for="(portfolio, index) in candidatePortfolios" :key="index" :cx="pointPosition(portfolio).x" :cy="pointPosition(portfolio).y" r="2.5" :fill="interpolateColor((portfolio.sharpe - chartDomain.minSharpe) / Math.max(chartDomain.maxSharpe - chartDomain.minSharpe, 0.001))" opacity="0.75" />

                <!-- Points remarquables isolés (Optimal et Volatilité Minimum) -->
                <circle v-if="bestPortfolio" :cx="pointPosition(bestPortfolio).x" :cy="pointPosition(bestPortfolio).y" r="7" fill="#EF4444" stroke="white" stroke-width="2" />
                <circle v-if="minVolPortfolio" :cx="pointPosition(minVolPortfolio).x" :cy="pointPosition(minVolPortfolio).y" r="6" fill="#38BDF8" stroke="white" stroke-width="2" />
              </svg>
            </div>

            <!-- Légende de gradient du ratio de Sharpe -->
            <div class="mt-4 flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-gray-400">
              <span>Moins Performant</span>
              <div class="h-2 flex-1 mx-4 rounded-full bg-gradient-to-r from-[#4338CA] via-[#3B82F6] via-[#10B981] to-[#F59E0B]"></div>
              <span>Max Sharpe (Optimal)</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  </main>
</template>