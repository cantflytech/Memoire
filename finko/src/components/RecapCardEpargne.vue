<template>
 <!-- Bouton AI Chat en haut à droite -->
    <div class="grid-cols-2">
      <div class="flex justify-end ">
        <button class="bg-red-400 hover:bg-red-500 text-white px-4 py-2 rounded-full font-medium flex items-center  transition-colors">
          <span class="text-lg">🤖</span>
          AI Chat
        </button>
      </div>
      <div class="flex gap-0 mb-0 relative">
          <button class="main-bg-color z-10 bg-opacity-20 backdrop-blur-sm px-8 py-3 rounded-full font-medium text-white border border-white border-opacity-30">
            Épargne
          </button>
          <button class="text-white z-0 absolute text-opacity-70 pl-40 px-8 py-3 rounded-full font-medium disable-color hover:main-bg-color">
            Investissement
          </button>
    </div>
     </div>
    <div class="main-bg-color rounded-3xl p-8 text-white shadow-lg">
     <!-- Contenu principal avec disposition flexible -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <!-- Section gauche - Total des investissements -->
          <div class="lg:flex-1">
            <h2 class="text-lg font-medium mb-2 text-white text-opacity-90">
              Total de mes investissements
            </h2>
            <div class="text-5xl font-bold mb-2">
              {{ total !== null ? total.toFixed(2) + ' €' : 'Chargement...' }}
            </div>
            <div class="text-white text-opacity-80 flex items-center gap-1">
              100 € ces 6 derniers mois
            </div>
          </div>
          <!-- Section droite - Statistiques côte à côte -->
          <div class="flex flex-col sm:flex-row gap-8 lg:gap-12">
            <!-- Épargne -->
            <div class="text-center lg:text-right">
              <div class="text-lg font-medium mb-1">Épargne</div>
              <div class="text-4xl font-bold mb-1">{{ epargne !== null ? epargne.toFixed(2) + ' €' : 'Chargement...' }}</div>
              <div class="text-white text-opacity-80 flex items-center justify-center lg:justify-end gap-1">
                <span class="text-white">{{ epargnePourcentage !== null ? epargnePourcentage.toFixed(2) + '%' : 'Chargement...' }}</span>
              
              </div>
            </div>
            <!-- Séparateur vertical -->
            <div class="hidden lg:block border-l border-white border-opacity-30 h-20"></div>

            <!-- Investissement -->
            <div class="text-center lg:text-right">
              <div class="text-lg font-medium mb-1">Investissement</div>
              <div class="text-4xl font-bold mb-1">{{ investissement !== null ? investissement.toFixed(2) + ' €' : 'Chargement...' }}</div>
              <div class="text-white text-opacity-80 flex items-center justify-center lg:justify-end gap-1">
                <span class="text-white">{{ investissementPourcentage !== null ? investissementPourcentage.toFixed(2) + '%' : 'Chargement...' }}</span>
              
              </div>
            </div>
          </div>
    </div>
    </div>
</template>
<script setup>
import { ref, onMounted } from "vue";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";

const epargne = ref(null);
const investissement = ref(null);
const total = ref(null);
const epargnePourcentage = ref(50);
const investissementPourcentage = ref(50);
onMounted(async () => {
  const user = getAuth().currentUser;

  if (!user) {
    console.error("Aucun utilisateur connecté");
    return;
  }

  const uid = user.uid;
  console.log("UID :", uid);

  // Récupération du document Firestore
  const refDoc = doc(db, "epargne_parametres", uid);
  const snap = await getDoc(refDoc);

  if (snap.exists()) {
    const data = snap.data();
    console.log("Données Firestore :", data);

    // 👉 Ta valeur ici
    epargne.value = data.epargne;  
    investissement.value = data.investissement;
    total.value = epargne.value + investissement.value;
    epargnePourcentage.value = (epargne.value / total.value) * 100;
    investissementPourcentage.value = (investissement.value / total.value) * 100;
  } else {
    console.error("Document non trouvé dans Firestore");
  }
});
</script>