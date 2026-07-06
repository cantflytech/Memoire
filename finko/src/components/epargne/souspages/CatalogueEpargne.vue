<script setup>
import { ref, onMounted, computed } from 'vue';
import { db, auth } from '../../../firebase/config';
import { collection, getDocs, doc, getDoc, query, orderBy } from 'firebase/firestore';
import { useRouter } from 'vue-router';
import { 
  Layers, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Info, 
  TrendingUp, 
  Coins, 
  ExternalLink,
  ShieldCheck 
} from 'lucide-vue-next';

const router = useRouter();

// États réactifs
const categories = ref([]);
const userAssets = ref([]);
const allProducts = ref([]);
const loading = ref(true);

// Filtre de recherche ou de catégorie (optionnel pour l'UX)
const selectedCategoryFilter = ref('all');

onMounted(async () => {
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      // 1. Récupérer toutes les catégories d'épargne (de la base au sommet)
      const catQuery = query(collection(db, "savings_categories"), orderBy("ordre", "asc"));
      const catSnapshot = await getDocs(catQuery);
      categories.value = catSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 2. Récupérer le profil financier complet de l'utilisateur (ses vrais livrets détenus)
      const profileRef = doc(db, "user_financial_profile", user.uid);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        const profileData = profileSnap.data().user_financial_profile || profileSnap.data();
        userAssets.value = profileData.assets || [];
      }

      // 3. Récupérer l'intégralité du catalogue des produits d'épargne (Livret A, LEP, PEA, Assurance-vie...)
      const productsSnapshot = await getDocs(collection(db, "savings_products"));
      allProducts.value = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    } catch (e) {
      console.error("Erreur lors du chargement du catalogue complet :", e);
    } finally {
      loading.value = false;
    }
  });
});

// --- CALCULS ET UTILS UX ---

// Récupérer le montant détenu par l'utilisateur pour un produit spécifique
const getProductUserAmount = (productId) => {
  const asset = userAssets.value.find(a => a.product_id === productId);
  return asset ? asset.amount : null;
};

// Calculer le montant total investi par catégorie
const getCategoryTotalAmount = (categoryId) => {
  return userAssets.value.reduce((sum, asset) => {
    const productInfo = allProducts.value.find(p => p.id === asset.product_id);
    if (productInfo && productInfo.category_id === categoryId) {
      return sum + (asset.amount || 0);
    }
    return sum;
  }, 0);
};

// Vérifier si l'utilisateur possède au moins un produit dans une catégorie
const isCategoryHeld = (categoryId) => {
  return allProducts.value.some(product => {
    const isOfCategory = product.category_id === categoryId;
    const isOwned = userAssets.value.some(asset => asset.product_id === product.id);
    return isOfCategory && isOwned;
  });
};

// Filtrer les catégories affichées si besoin
const filteredCategories = computed(() => {
  if (selectedCategoryFilter.value === 'all') return categories.value;
  if (selectedCategoryFilter.value === 'held') return categories.value.filter(c => isCategoryHeld(c.id));
  return categories.value;
});
</script>

<template>
  <main class="min-h-screen bg-[#F8FAFC] p-6 font-['Inter'] heading">
    <div class="max-w-6xl mx-auto space-y-8">
      
      <header class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-gray-100 pb-6">
        <div class="flex items-center gap-4">
          <button 
            @click="router.back()" 
            class="p-2 bg-white rounded-xl border border-gray-200 shadow-xs text-gray-500 hover:text-[#00AA90] hover:border-[#00AA90] transition-all"
          >
            <ArrowLeft class="w-5 h-5" />
          </button>
          <div>
            <h1 class="text-2xl font-black text-gray-900 tracking-tight">Catalogue Global des Enveloppes & Livrets</h1>
            <p class="text-xs text-gray-400 font-semibold">Consultez l'ensemble des solutions d'épargne disponibles sur le marché</p>
          </div>
        </div>

        <div class="flex bg-gray-100 p-1 rounded-xl self-start sm:self-center text-xs font-bold">
          <button 
            @click="selectedCategoryFilter = 'all'"
            :class="selectedCategoryFilter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'"
            class="px-4 py-2 rounded-lg transition-all"
          >
            Tout voir
          </button>
          <button 
            @click="selectedCategoryFilter = 'held'"
            :class="selectedCategoryFilter === 'held' ? 'bg-white text-[#00AA90] shadow-xs' : 'text-gray-500 hover:text-[#00AA90]'"
            class="px-4 py-2 rounded-lg transition-all"
          >
            Mes placements détenus
          </button>
        </div>
      </header>

      <div v-if="loading" class="flex flex-col items-center justify-center py-20 space-y-4">
        <svg class="animate-spin h-8 w-8 text-[#00AA90]" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-xs font-bold text-gray-400">Analyse du catalogue financier en cours...</span>
      </div>

      <div v-else class="space-y-8">
        
        <div 
          v-for="cat in filteredCategories" 
          :key="cat.id"
          class="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm space-y-6"
        >
          <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-4 border-b border-gray-50 pb-4">
            <div class="space-y-1">
              <div class="flex items-center gap-2.5">
                <div 
                  :class="isCategoryHeld(cat.id) ? 'bg-orange-50 text-orange-500' : 'bg-[#E6F6F4] text-[#00AA90]'"
                  class="p-2 rounded-xl border border-transparent"
                >
                  <Layers class="w-5 h-5" />
                </div>
                <h2 class="text-lg font-black text-gray-900 tracking-tight">{{ cat.name }}</h2>
                <span 
                  :class="isCategoryHeld(cat.id) ? 'bg-orange-500 text-white border-transparent' : 'bg-gray-100 text-gray-400 border-gray-200'"
                  class="text-[9px] font-black px-2 py-0.5 rounded-md uppercase border tracking-wider"
                >
                  {{ isCategoryHeld(cat.id) ? 'Active' : 'Inactive' }}
                </span>
              </div>
              <p v-if="cat.description" class="text-xs text-gray-400 font-medium max-w-3xl flex items-start gap-1.5 pt-1">
                <Info class="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5" />
                <span>{{ cat.description }}</span>
              </p>
            </div>

            <div class="bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl text-left md:text-right min-w-[160px]">
              <span class="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Total investi</span>
              <span class="text-xl font-black text-gray-900">{{ getCategoryTotalAmount(cat.id).toLocaleString() }} €</span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div 
              v-for="product in allProducts.filter(p => p.category_id === cat.id)" 
              :key="product.id"
              :class="getProductUserAmount(product.id) !== null ? 'border-orange-200 bg-orange-50/10' : 'border-gray-100 bg-white'"
              class="border-2 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div class="space-y-4">
                <div class="flex justify-between items-start gap-2">
                  <h3 class="font-black text-sm text-gray-900 leading-tight">{{ product.name }}</h3>
                  
                  <CheckCircle2 v-if="getProductUserAmount(product.id) !== null" class="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <XCircle v-else class="w-4 h-4 text-gray-200 flex-shrink-0" />
                </div>

                <div class="grid grid-cols-2 gap-2 border-t border-b border-gray-50 py-3 text-[11px]">
                  <div>
                    <span class="block text-[9px] font-bold text-gray-400 uppercase">Rendement</span>
                    <span class="font-black text-teal-600 inline-flex items-center gap-0.5">
                      <TrendingUp class="w-3 h-3" /> {{ product.interest_rate ? product.interest_rate + '%' : 'Variable' }}
                    </span>
                  </div>
                  <div>
                    <span class="block text-[9px] font-bold text-gray-400 uppercase">Disponibilité</span>
                    <span class="font-bold text-gray-700">
                      {{ product.lock_duration_months === 0 ? 'Instantané' : 'Bloqué ' + product.lock_duration_months + 'm' }}
                    </span>
                  </div>
                  <div class="col-span-2 pt-1.5">
                    <span class="block text-[9px] font-bold text-gray-400 uppercase">Plafond maximum</span>
                    <span class="font-bold text-gray-700">
                      {{ product.max_amount ? product.max_amount.toLocaleString() + ' €' : 'Aucun plafond' }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="mt-4 pt-3 flex justify-between items-center text-xs">
                <div v-if="getProductUserAmount(product.id) !== null" class="w-full flex justify-between items-center bg-orange-400/10 border border-orange-200/50 p-2.5 rounded-xl">
                  <span class="font-bold text-orange-700 text-[11px] uppercase tracking-wider">Mon solde :</span>
                  <span class="font-black text-orange-700 text-sm">{{ getProductUserAmount(product.id).toLocaleString() }} €</span>
                </div>
                <div v-else class="w-full flex justify-between items-center text-gray-400 font-semibold px-1 text-[11px]">
                  <span>Fiche disponible</span>
                  <a v-if="product.official_info_url" :href="product.official_info_url" target="_blank" class="text-[#00AA90] hover:underline flex items-center gap-1">
                    Public.fr <ExternalLink class="w-3 h-3" />
                  </a>
                </div>
              </div>

            </div>
          </div>

          <div v-if="allProducts.filter(p => p.category_id === cat.id).length === 0" class="text-xs text-gray-400 italic py-4 pl-2">
            Aucun livret ou compte d'épargne n'est actuellement configuré dans cette catégorie.
          </div>

        </div>

      </div>

    </div>
  </main>
</template>