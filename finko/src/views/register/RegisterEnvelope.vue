<script setup>
import { ref, onMounted, computed } from 'vue';
import { db, auth } from '../../firebase/config';
// CORRECTION : On importe setDoc à la place de updateDoc
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';

// États réactifs
const searchQuery = ref('');
const allProducts = ref([]); 
const userAssets = ref([]); 
const loading = ref(true);

// 1. Charger les produits disponibles depuis Firestore au démarrage
onMounted(async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "savings_products"));
    allProducts.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Charger les assets existants de l'utilisateur s'il y en a déjà
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        const profileRef = doc(db, "user_financial_profile", user.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const profileData = profileSnap.data().user_financial_profile || profileSnap.data();
          userAssets.value = profileData.assets || [];
        }
      }
    });
  } catch (e) {
    console.error("Erreur de chargement des produits :", e);
  } finally {
    loading.value = false;
  }
});

// 2. Filtrer la recherche des livrets
const searchResults = computed(() => {
  if (searchQuery.value.length < 1) return [];
  return allProducts.value.filter(p => 
    p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// 3. Ajouter un livret à la sélection de l'utilisateur
const addProduct = (product) => {
  if (!userAssets.value.find(a => a.product_id === product.id)) {
    userAssets.value.push({
      product_id: product.id,
      name: product.name,
      amount: 0
    });
  }
  searchQuery.value = ''; 
};

// 4. Supprimer un livret de sa sélection
const removeAsset = (index) => {
  userAssets.value.splice(index, 1);
};

// 5. Calculer le patrimoine total en temps réel
const totalPatrimoine = computed(() => {
  return userAssets.value.reduce((sum, asset) => sum + (asset.amount || 0), 0);
});

// --- LOGIQUE DE LIEN AVEC LE CATALOGUE PRODUIT ---

// Récupérer les infos fixes du produit à partir du product_id de l'asset
const getProductInfo = (productId) => {
  return allProducts.value.find(p => p.id === productId) || {};
};

// Vérifier si le livret est plein
const checkIsFull = (asset) => {
  const info = getProductInfo(asset.product_id);
  if (!info.max_amount) return false;
  return asset.amount >= info.max_amount;
};

// Vérifier si le retrait est instantané (lock_duration_months == 0)
const checkIsInstant = (productId) => {
  const info = getProductInfo(productId);
  return info.lock_duration_months === 0;
};

// 6. Enregistrer l'étape dans Firebase
const saveAssets = async () => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const profileRef = doc(db, "user_financial_profile", user.uid);
    
    // CORRECTION : Remplacement de updateDoc par setDoc + merge: true pour éviter le crash
    await setDoc(profileRef, {
      user_financial_profile: {
        assets: userAssets.value,
        total_wealth: totalPatrimoine.value
      }
    }, { merge: true });

    alert("Tes placements ont bien été enregistrés !");
  } catch (e) {
    console.error("Erreur lors de la sauvegarde :", e);
  }
};
</script>

<template>
  <main class="min-h-screen bg-[#F8FAFB] p-6 font-['Inter']">
    <div class="max-w-xl mx-auto">
      
      <header class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-xl font-black text-gray-900">Création de ton profil Finacier</h1>
          <p class="text-xs text-gray-500 font-medium">étape 3/4 : Tes placements actuels</p>
        </div>
        <div class="flex gap-1">
          <div class="w-6 h-1.5 rounded-full bg-[#00AA90]"></div>
          <div class="w-6 h-1.5 rounded-full bg-[#00AA90]"></div>
          <div class="w-6 h-1.5 rounded-full bg-[#00AA90]"></div>
          <div class="w-6 h-1.5 rounded-full bg-gray-200"></div>
        </div>
      </header>

      <div class="relative mb-6">
        <div class="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm focus-within:border-[#00AA90] transition-colors">
          <span class="text-gray-400 mr-3 text-sm">🔍</span>
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Rechercher un livret ..." 
            class="w-full outline-none font-medium text-xs text-gray-700 placeholder-gray-400"
          />
        </div>

        <div v-if="searchResults.length > 0" class="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
          <div 
            v-for="product in searchResults" 
            :key="product.id"
            @click="addProduct(product)"
            class="p-3.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 flex justify-between items-center text-xs"
          >
            <span class="font-bold text-gray-800">{{ product.name }}</span>
            <span class="text-gray-400 font-medium">
              {{ product.max_amount ? 'Plafond : ' + product.max_amount.toLocaleString() + ' €' : 'Pas de plafond' }}
            </span>
          </div>
        </div>
      </div>

      <div class="space-y-4 mb-8">
        <div 
          v-for="(asset, index) in userAssets" 
          :key="asset.product_id"
          class="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs relative group"
        >
          <button 
            @click="removeAsset(index)" 
            class="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors text-xs"
          >
            ✕
          </button>
          
          <div class="flex items-center gap-2 mb-4">
            <div class="bg-[#E6F6F4] p-1.5 rounded-lg text-[#00AA90] text-xs">🛡️</div>
            <h3 class="text-[#00AA90] font-black text-xs uppercase tracking-wider">{{ asset.name }}</h3>
          </div>

          <div class="flex justify-between items-end">
            <div class="space-y-1">
              <label class="block text-[10px] font-bold text-gray-400 uppercase">Montant sur le compte :</label>
              <div class="flex items-center gap-1.5 border-b border-gray-200 pb-1 focus-within:border-[#00AA90]">
                <input 
                  v-model.number="asset.amount" 
                  type="number" 
                  class="text-xl font-black text-gray-900 w-32 outline-none"
                />
                <span class="text-lg font-black text-gray-900">€</span>
              </div>
            </div>

            <div class="flex flex-col items-end gap-1.5">
              <span 
                v-if="checkIsInstant(asset.product_id)"
                class="text-[9px] font-bold text-[#00AA90] bg-[#E6F6F4] px-2 py-0.5 rounded"
              >
                RETRAIT INSTANTANÉ
              </span>
              <span 
                v-else
                class="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded"
              >
                BLOQUÉ {{ getProductInfo(asset.product_id).lock_duration_months }} MOIS
              </span>

              <span 
                v-if="checkIsFull(asset)"
                class="text-[9px] font-black text-white bg-red-500 px-2 py-0.5 rounded shadow-xs"
              >
                PLEIN
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="text-center border-t border-gray-100 pt-6">
        <h2 class="text-sm font-bold text-gray-800 mb-5">
          Patrimoine total : <span class="text-2xl font-black text-gray-900 ml-1">{{ totalPatrimoine.toLocaleString() }} €</span>
        </h2>
        <button 
          @click="saveAssets"
          class="w-full bg-[#00AA90] text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[#008F7A] transition-all text-xs shadow-md"
        >
          <span class="text-sm">→</span> Enregistrer cette étape
        </button>
      </div>

    </div>
  </main>
</template>