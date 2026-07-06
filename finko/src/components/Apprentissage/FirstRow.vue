<script setup>
import { ref, onMounted, computed } from 'vue';
import { db, auth } from '../../firebase/config';
// CORRECTION : On utilise doc, getDoc et setDoc pour cibler directement le bon profil unique
import { doc, getDoc, setDoc } from 'firebase/firestore';

// États réactifs pour l'affichage dynamique
const userXP = ref(0);
const userLevel = ref(1);
const loading = ref(true);

// Constante de palier (3 000 XP par niveau, identique à tes autres pages)
const xpPerLevel = 3000;

// Propriété calculée pour la jauge si tu as besoin de l'afficher ici aussi
const xpProgress = computed(() => {
  const percentage = (userXP.value / xpPerLevel) * 100;
  return Math.min(Math.round(percentage), 100);
});

onMounted(() => {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      try {
        // CORRECTION CRITIQUE : Alignement parfait sur l'identifiant unique de ton utilisateur (UID)
        const profileRef = doc(db, "user_financial_profile", user.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          const data = profileSnap.data().user_financial_profile || profileSnap.data();
          
          // Récupération des données d'XP et de niveau unifiées
          userXP.value = data.xp ?? 0;
          userLevel.value = data.level ?? 1;
        } else {
          // SÉCURITÉ : Si aucun profil n'existe, on initialise proprement la structure
          await setDoc(profileRef, {
            user_financial_profile: {
              xp: 0,
              level: 1
            }
          }, { merge: true });
          
          userXP.value = 0;
          userLevel.value = 1;
        }

      } catch (e) {
        console.error("Erreur lors du chargement des données de la bannière :", e);
      } finally {
        loading.value = false;
      }
    } else {
      loading.value = false;
    }
  });
});
</script>
<template>
  <div class="body max-w-7xl mx-auto w-full font-['Inter']">
    <div v-if="loading" class="h-28 bg-gray-200 animate-pulse rounded-[20px]"></div>

    <div v-else class="background-color-rose text-white rounded-[20px] p-5 md:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-4 relative overflow-hidden">
      
      <div class="flex flex-col items-center sm:items-start z-10 w-full sm:w-auto text-center sm:text-left">
        <div class="px-2.5 py-1 rounded-md flex items-center gap-1.5 mb-2">
          <span class="text-xs">
            <svg class="w-6 h-6 text-[#94CFCA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
          </span>
          <span class="heading text-xl opacity-90">Mode éducation</span>
        </div>
        
        <div class="flex flex-col">
          <span class="text-3xl md:text-4xl font-black heading tracking-tight">
            {{ userXP.toLocaleString() }} <span class="text-xl md:text-2xl font-bold">XP</span>
          </span>
          <div class="flex items-center justify-center heading sm:justify-start gap-1 mt-0.5 ">
            <span class="text-xs font-bold">↗</span>
            <span class="text-[11px] heading">
              {{ userXP.toLocaleString() }} XP <span class="font-medium opacity-75">cette année</span>
            </span>
          </div>
        </div>
      </div>

      <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
    </div>
  </div>
</template>