<script setup>
import { ref, onMounted, computed } from 'vue';
import { db, auth } from '../../../firebase/config';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { useRouter } from 'vue-router';
import { ArrowLeft, PiggyBank, ShieldCheck, Info, TrendingUp, Sparkles, AlertCircle, ArrowRightLeft } from 'lucide-vue-next';

const router = useRouter();
const userAssets = ref([]);
const allProducts = ref([]);
const loading = ref(true);

const chartColors = ['#0D9488', '#6366F1', '#F59E0B', '#F43F5E', '#10B981', '#8B5CF6'];

onMounted(async () => {
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const profileRef = doc(db, "user_financial_profile", user.uid);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        const profileData = profileSnap.data().user_financial_profile || profileSnap.data();
        userAssets.value = profileData.assets || [];
      }

      const productsSnapshot = await getDocs(collection(db, "savings_products"));
      allProducts.value = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    } catch (e) {
      console.error("Erreur de chargement des livrets détaillés :", e);
    } finally {
      loading.value = false;
    }
  });
});

// --- CALCULS ET LOGIQUE DES LIVRETS ---

const enrichedLivrets = computed(() => {
  return userAssets.value.map((asset, index) => {
    const info = allProducts.value.find(p => p.id === asset.product_id) || {};
    const amount = asset.amount || 0;
    const maxAmount = info.max_amount || 0;
    
    const progress = maxAmount > 0 ? Math.min((amount / maxAmount) * 100, 100) : 0;
    const isFull = maxAmount > 0 && amount >= maxAmount;

    return {
      ...asset,
      ...info,
      amount,
      maxAmount,
      progress,
      isFull,
      color: chartColors[index % chartColors.length]
    };
  }).sort((a, b) => b.amount - a.amount);
});

const totalLivretsAmount = computed(() => {
  return enrichedLivrets.value.reduce((sum, l) => sum + l.amount, 0);
});

const formattedTotalShort = computed(() => {
  const total = totalLivretsAmount.value;
  if (total >= 1000) {
    return (total / 1000).toFixed(0) + ' K';
  }
  return total + ' €';
});

// --- ENGINE / ALGORITHME D'OPTIMISATION FINANCIÈRE ---
const optimisationsAndConseils = computed(() => {
  const conseils = [];
  if (enrichedLivrets.value.length === 0) return conseils;

  // 1. Récupération des livrets clés s'ils existent chez l'utilisateur
  const livretA = enrichedLivrets.value.find(l => l.product_id === 'livret_a');
  const ldds = enrichedLivrets.value.find(l => l.product_id === 'ldds');
  const lep = enrichedLivrets.value.find(l => l.product_id === 'lep');
  const pea = enrichedLivrets.value.find(l => l.product_id?.includes('pea') || l.category_id === 'cto_pea');

  // Trouver le livret disponible sur le marché qui rapporte le plus (meilleur taux hors LEP qui est sous condition)
  const catalogueHorsLep = allProducts.value.filter(p => p.id !== 'lep');
  const meilleurProduitMarche = [...catalogueHorsLep].sort((a, b) => (b.interest_rate || 0) - (a.interest_rate || 0))[0];

  // 2. ANALYSE ET ALGORITHME DE PLACEMENT
  
  // Règle A : Alerte Plafond atteint -> Transférer le surplus
  enrichedLivrets.value.forEach(livret => {
    if (livret.isFull && meilleurProduitMarche && livret.product_id !== meilleurProduitMarche.id) {
      conseils.push({
        type: 'warning',
        title: `Plafond atteint sur ton ${livret.name}`,
        desc: `Ton compte est plein (${livret.amount.toLocaleString()} €). Les prochains intérêts seront perdus. Tu devrais basculer tes prochains versements vers le ${meilleurProduitMarche.name} qui propose un taux de ${meilleurProduitMarche.interest_rate}%.`
      });
    }
  });

  // Règle B : Sous-optimisation du LEP (Si l'utilisateur a un LEP mais qu'il n'est pas plein)
  if (lep && !lep.isFull) {
    const resteAverser = lep.max_amount - lep.amount;
    // On regarde si l'utilisateur a de l'argent sur un livret qui rapporte moins (ex: Livret A ou LDDS)
    const argentMoinsBonPlacer = enrichedLivrets.value
      .filter(l => l.product_id !== 'lep' && (l.interest_rate || 0) < (lep.interest_rate || 0))
      .reduce((sum, l) => sum + l.amount, 0);

    if (argentMoinsBonPlacer > 0) {
      const montantAOptimiser = Math.min(resteAverser, argentMoinsBonPlacer);
      conseils.push({
        type: 'success',
        title: `Booste ton rendement avec le LEP`,
        desc: `Tu as de l'argent placé à un taux inférieur à ton LEP (qui rapporte ${lep.interest_rate}%). Déplace jusqu'à ${montantAOptimiser.toLocaleString()} € depuis tes autres livrets vers ton LEP pour maximiser tes gains sans aucun risque.`
      });
    }
  }

  // Règle C : Trop d'argent liquide / court terme (Profil trop prudent)
  const totalCourtTerme = enrichedLivrets.value
    .filter(l => l.lock_duration_months === 0 && l.category_id === 'epargne_precaution_livrets')
    .reduce((sum, l) => sum + l.amount, 0);

  if (totalCourtTerme > 25000 && !pea) {
    conseils.push({
      type: 'info',
      title: 'Opportunité Moyen/Long Terme détectée',
      desc: `Tu possèdes plus de 25 000 € entièrement disponibles à court terme. Si tu n'as pas de projet immobilier d'ici 2 ans, une partie de cet argent dort. Pense à ouvrir un PEA ou une Assurance-vie pour chercher du rendement sur le long terme.`
    });
  }

  // Règle D : Équilibre général par défaut
  if (conseils.length === 0) {
    conseils.push({
      type: 'info',
      title: 'Portefeuille bien équilibré',
      desc: 'Bravo ! Tes livrets actuels respectent une bonne logique de répartition. Continue à alimenter tes livrets de précaution jusqu\'à atteindre ta cible de fonds d\'urgence.'
    });
  }

  return conseils;
});

// --- LOGIQUE DU DONUT SVG ---
const radius = 38;
const circ = 2 * Math.PI * radius;

const getDashOffset = (index) => {
  let cumulativePercentage = 0;
  for (let i = 0; i < index; i++) {
    const amount = enrichedLivrets.value[i].amount;
    cumulativePercentage += (amount / (totalLivretsAmount.value || 1)) * 100;
  }
  return -cumulativePercentage * circ / 100;
};

const getDashArray = (amount) => {
  if (totalLivretsAmount.value === 0) return `0 ${circ}`;
  const pct = (amount / totalLivretsAmount.value) * 100;
  return `${(pct / 100) * circ} ${circ}`;
};
</script>

<template>
  <main class="min-h-screen bg-[#F8FAFC] p-6 font-['Inter']  heading flex flex-col items-center justify-center">
    <div class="max-w-4xl w-full mx-auto space-y-6">
      
      <!-- CARTE DES LIVRETS PRINCIPALE -->
      <div class="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100 space-y-8">
        <!-- En-tête -->
        <header class="flex items-center gap-4 border-b border-gray-50 pb-5">
          <button @click="router.back()" class="p-2 bg-gray-50 rounded-xl border border-gray-200 text-gray-500 hover:text-[#00AA90] hover:border-[#00AA90] transition-all">
            <ArrowLeft class="w-5 h-5" />
          </button>
          <div class="flex items-center gap-3">
            <div class="bg-[#E6F6F4] p-2.5 rounded-xl text-[#00AA90]">
              <ShieldCheck class="w-6 h-6" />
            </div>
            <div>
              <h1 class="text-xl font-black text-gray-900 tracking-tight">Mes livrets</h1>
              <p class="text-xs text-gray-400 font-semibold">Analyse de la répartition et état de vos enveloppes de précaution</p>
            </div>
          </div>
        </header>

        <!-- Loader -->
        <div v-if="loading" class="flex justify-center items-center py-12">
          <svg class="animate-spin h-6 w-6 text-[#00AA90]" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>

        <!-- Contenu Donut + Barre de progression -->
        <div v-else-if="enrichedLivrets.length > 0" class="flex flex-col md:flex-row items-center gap-12 py-4">
          <!-- Donut SVG -->
          <div class="relative w-44 h-44 flex-shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 100 100" class="w-full h-full -rotate-90">
              <circle cx="50" cy="50" :r="radius" fill="none" stroke="#F1F5F9" stroke-width="12" />
              <circle
                v-for="(livret, idx) in enrichedLivrets"
                :key="livret.product_id"
                cx="50" cy="50" :r="radius"
                fill="none"
                :stroke="livret.color"
                stroke-width="12"
                stroke-linecap="round"
                :stroke-dasharray="getDashArray(livret.amount)"
                :stroke-dashoffset="getDashOffset(idx)"
                class="transition-all duration-500"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-3xl font-black text-gray-900 tracking-tighter">{{ formattedTotalShort }}</span>
              <span class="text-[9px] font-black uppercase text-gray-400 tracking-wider">Total Épargne</span>
            </div>
          </div>

          <!-- Liste des livrets -->
          <div class="flex-grow w-full space-y-6">
            <div v-for="livret in enrichedLivrets" :key="livret.product_id" class="space-y-1.5">
              <div class="flex justify-between items-end">
                <span class="font-black text-gray-900 text-sm tracking-tight uppercase">{{ livret.name }}</span>
                <span class="font-black text-gray-900 text-sm">{{ livret.amount.toLocaleString() }} €</span>
              </div>
              <div class="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden relative">
                <div class="h-full rounded-full transition-all duration-500" :style="{ width: livret.maxAmount > 0 ? `${livret.progress}%` : '100%', backgroundColor: livret.color }"></div>
              </div>
              <div class="flex flex-wrap items-center gap-2 pt-0.5">
                <span v-if="livret.lock_duration_months === 0" class="text-[9px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100/50 uppercase">Retrait instantané</span>
                <span v-else class="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100/50 uppercase">Bloqué {{ livret.lock_duration_months }} mois</span>
                <span v-if="livret.isFull" class="text-[9px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-md border border-red-100 uppercase">Plein</span>
                <span class="text-[9px] text-gray-400 font-bold ml-auto flex items-center gap-0.5">
                  <TrendingUp class="w-3 h-3 text-teal-500" /> Taux : {{ livret.interest_rate }}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= NOUVELLE ENCART D'INTELLIGENCE / CONSEILS D'OPTIMISATION ================= -->
      <div v-if="!loading && optimisationsAndConseils.length > 0" class="bg-white rounded-[2rem] p-6 shadow-xl border border-gray-100 space-y-4">
        <div class="flex items-center gap-2.5 pb-2 border-b border-gray-50">
          <div class="bg-amber-50 text-amber-600 p-2 rounded-xl">
            <Sparkles class="w-5 h-5 fill-amber-500" />
          </div>
          <div>
            <h3 class="text-sm font-black text-gray-900">Moteur d'Optimisation Finko</h3>
            <p class="text-[11px] text-gray-400 font-medium">Algorithme d'arbitrage de performance sur vos liquidités</p>
          </div>
        </div>

        <!-- Boucle sur les recommandations du moteur de calcul -->
        <div class="space-y-3">
          <div 
            v-for="(conseil, index) in optimisationsAndConseils" 
            :key="index"
            :class="[
              conseil.type === 'warning' ? 'bg-red-50/60 border-red-100 text-red-900' : '',
              conseil.type === 'success' ? 'bg-emerald-50/60 border-emerald-100 text-emerald-950' : '',
              conseil.type === 'info' ? 'bg-blue-50/50 border-blue-100 text-blue-9g0' : ''
            ]"
            class="p-4 rounded-2xl border flex gap-3.5 items-start"
          >
            <div class="mt-0.5 flex-shrink-0">
              <AlertCircle v-if="conseil.type === 'warning'" class="w-4 h-4 text-red-500" />
              <ArrowRightLeft v-else-if="conseil.type === 'success'" class="w-4 h-4 text-emerald-600" />
              <Info v-else class="w-4 h-4 text-blue-500" />
            </div>
            <div class="space-y-1">
              <h4 class="text-xs font-black text-gray-900">{{ conseil.title }}</h4>
              <p class="text-[11px] text-gray-500 font-medium leading-relaxed">{{ conseil.desc }}</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  </main>
</template>