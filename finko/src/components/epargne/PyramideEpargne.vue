<script setup>
import { ref, onMounted, computed } from 'vue';
import { db, auth } from '../../firebase/config';
import { collection, getDocs, doc, getDoc, query, orderBy } from 'firebase/firestore';

const categories = ref([]);
const userAssets = ref([]);
const allProducts = ref([]);

// Correction : La cible est initialisée à 0 et sera lue depuis Firebase
const targetEmergencyFund = ref(0); 

onMounted(async () => {
  auth.onAuthStateChanged(async (user) => {
    if (!user) return;

    try {
      // 1. Récupérer les catégories triées par ordre croissant (asc)
      const catQuery = query(collection(db, "savings_categories"), orderBy("ordre", "desc"));
      const catSnapshot = await getDocs(catQuery);
      const loadedCategories = catSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isHeld: false
      }));

      // 2. Récupérer le profil financier de l'utilisateur
      const profileRef = doc(db, "user_financial_profile", user.uid);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        const profileData = profileSnap.data().user_financial_profile || profileSnap.data();
        userAssets.value = profileData.assets || [];
        
        // Correction : On extrait dynamiquement la cible enregistrée en BDD
        targetEmergencyFund.value = profileData.emergency_fund_target || 0;
      }

      // 3. Récupérer le catalogue de tous les produits
      const productsSnapshot = await getDocs(collection(db, "savings_products"));
      allProducts.value = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const heldCategoriesIds = new Set();
      allProducts.value.forEach(product => {
        const hasProduct = userAssets.value.some(asset => asset.product_id === product.id);
        if (hasProduct) {
          heldCategoriesIds.add(product.category_id);
        }
      });

      // 4. Mettre à jour l'état isHeld de la pyramide
      categories.value = loadedCategories.map(cat => ({
        ...cat,
        isHeld: heldCategoriesIds.has(cat.id)
      }));

    } catch (e) {
      console.error("Erreur lors du calcul de la pyramide :", e);
    }
  });
});

// Calcul dynamique du montant actuel du fonds d'urgence
const currentEmergencyFund = computed(() => {
  return userAssets.value.reduce((sum, asset) => {
    const productInfo = allProducts.value.find(p => p.id === asset.product_id);
    if (productInfo && productInfo.category_id === 'epargne_precaution_livrets') {
      return sum + (asset.amount || 0);
    }
    return sum;
  }, 0);
});

// Calcul de la jauge basé sur la cible Firestore
const emergencyFundProgress = computed(() => {
  if (targetEmergencyFund.value === 0) return 0;
  const percentage = (currentEmergencyFund.value / targetEmergencyFund.value) * 100;
  return Math.min(Math.round(percentage), 100);
});

// Distribution des largeurs pour le mode "asc" couplé à flex-col-reverse
const getWidth = (index) => {
  const total = categories.value.length;
  if (total <= 1) return '100%';
  const minWidth = 45; // Sommet étroit (ex: CTO/PEA) à 45%
  const width = 100 - ((index / (total - 1)) * (100 - minWidth));
  return `${width}%`;
};
</script>

<template>
  <main class="bg-[#F8FAFB] flex items-center justify-center">
    <div class="max-w-7xl w-full grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
      
      <div class="flex flex-col justify-between gap-5">
        
        <div class="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex-1 flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <div class="bg-[#E6F6F4] p-2.5 rounded-xl"><svg class="w-6 h-6 text-[#00AA90]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg></div>
              <h3 class="heading text-xl green">Fonds d'urgence</h3>
            </div>
            <p class="text-[11px] text-gray-400 font-medium leading-relaxed mb-4">
              L'épargne de précaution doit représenter idéalement <span class="text-gray-700 font-bold">3 à 6 mois de dépenses courantes</span>.
            </p>
          </div>

          <div class="space-y-2 mt-auto">
            <div class="flex justify-between items-end">
              <span class="text-xl font-black text-gray-900">
                {{ currentEmergencyFund.toLocaleString() }} € 
                <span class="text-[10px] text-gray-400 font-bold block">actuels</span>
              </span>
              <span class="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md">
                Cible : {{ targetEmergencyFund.toLocaleString() }} €
              </span>
            </div>

            <div class="w-full bg-gray-100 h-2 rounded-full overflow-hidden relative">
              <div 
                class="bg-[#00AA90] h-full rounded-full transition-all duration-500"
                :style="{ width: `${emergencyFundProgress}%` }"
              ></div>
            </div>
            <div class="text-right text-[9px] font-bold text-gray-400">
              {{ emergencyFundProgress }}% complété
            </div>
          </div>
        </div>

        <div class="yellow p-5 rounded-[24px] shadow-sm border border-gray-100 flex-1 flex flex-col justify-center">
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-base">💡</span>
            <h3 class="text-m">Le saviez-vous ?</h3>
          </div>
          <p class="text-[11px] text-gray-500 font-medium leading-relaxed">
            Construire son patrimoine commence par consolider la base de sa pyramide. Sans un fonds solide, vous risquez de devoir liquider vos investissements au pire moment en cas de coup dur !
          </p>
        </div>

      </div>

      <div class="bg-white p-5 md:p-6 rounded-[28px] shadow-sm border border-gray-100 flex flex-col justify-between h-full">
        
        <div class="flex justify-between items-start mb-4">
          <div class="flex items-center gap-3 ">
            <div class="bg-[#E6F6F4] p-2.5 rounded-xl">
               <svg class="w-6 h-6 text-[#00AA90]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
               </svg>
            </div>
            <h2 class="heading text-xl green">Ma pyramide épargne</h2>
          </div>
          <div class="text-[9px] bg-gray-50 p-1.5 rounded-lg border border-gray-100 flex gap-3 items-center">
            <div class="flex items-center gap-1">
              <div class="w-1.5 h-1.5 rounded-full bg-gray-200"></div> 
              <span class="text-gray-500 font-bold">Non Détenu</span>
            </div>
            <div class="flex items-center gap-1">
              <div class="w-1.5 h-1.5 rounded-full bg-orange-400"></div> 
              <span class="text-gray-500 font-bold">Détenu</span>
            </div>
          </div>
        </div>

        <div class="flex flex-col-reverse items-center gap-2 max-w-sm mx-auto w-full py-1">
          <div 
            v-for="(cat, index) in categories" 
            :key="cat.id"
            :style="{ width: getWidth(index) }"
            :class="[
              cat.isHeld 
                ? 'bg-orange-400 text-white border-transparent' 
                : 'bg-gray-50 text-gray-400 border-gray-200/50',
              'py-2 px-4 rounded-full text-center font-black text-[12px] transition-all duration-300 shadow-xs border'
            ]"
          >
            {{ cat.name }}
          </div>
        </div>

        <button class="button">
          <span>↗</span> Voir mes livrets en détails
        </button>

      </div>

    </div>
  </main>
</template>