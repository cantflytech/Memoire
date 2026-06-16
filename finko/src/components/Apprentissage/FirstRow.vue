<script setup>
import { ref, onMounted } from 'vue';
import { db, auth } from '../../firebase/config';
// CORRECTION : Ajout des imports Firestore manquants pour faire fonctionner les requêtes et l'ajout
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

// États pour les données Firebase
const userXP = ref(0);
const loading = ref(true);

onMounted(() => {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      try {
        // 1. Récupération des données d'XP (Mode Éducation)
        const coursesRef = collection(db, "Courses");
        const q = query(coursesRef, where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          // Si le document existe, on récupère l'XP normalement
          const courseDoc = querySnapshot.docs[0].data();
          userXP.value = courseDoc.XP || 0;
        } else {
          // SECURITÉ : Si aucun document n'est trouvé pour cet userId, on en crée un automatiquement à 0 XP
          await addDoc(coursesRef, {
            userId: user.uid,
            XP: 0
          });
          userXP.value = 0;
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