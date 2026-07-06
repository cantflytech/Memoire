<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { db, auth } from '../../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore'; // Utilisation de onSnapshot pour le temps réel

// États réactifs pour stocker les données lues sur Firebase
const savings = ref(0);     // total_wealth (Épargne)
const investment = ref(0);  // total_investment (Investissements)
const loading = ref(true);
const unsubscribe = ref(null); // Pour couper l'écouteur proprement lors du démontage

onMounted(() => {
  auth.onAuthStateChanged((user) => {
    if (user) {
      try {
        const docRef = doc(db, "user_financial_profile", user.uid);
        
        // 🔄 ÉCOUTEUR EN TEMPS RÉEL FIRESTORE
        unsubscribe.value = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const rawData = docSnap.data();
            
            // 1. Extraction de l'investissement (directement à la racine du document)
            investment.value = rawData.total_investment || 0;
            
            // 2. Extraction de l'épargne (située dans la map user_financial_profile)
            if (rawData.user_financial_profile) {
              savings.value = rawData.user_financial_profile.total_wealth || 0;
            } else {
              // Sécurité au cas où la map n'existe pas mais que le champ est à la racine
              savings.value = rawData.total_wealth || 0;
            }
            
            console.log("🔥 Données lues en direct :", { 
              savings: savings.value, 
              investment: investment.value 
            });
          }
          loading.value = false;
        }, (error) => {
          console.error("Erreur d'écoute Firestore :", error);
          loading.value = false;
        });

      } catch (e) {
        console.error("Erreur lors du chargement de la barre de résumé :", e);
        loading.value = false;
      }
    }
  });
});

// Nettoyage de l'écouteur si l'utilisateur change de page
onUnmounted(() => {
  if (unsubscribe.value) {
    unsubscribe.value();
  }
});

// --- CALCULS DYNAMIQUES CROISÉS ---

// 1. Le Total Global (Somme de l'épargne et de l'investissement)
const globalNetWorth = computed(() => savings.value + investment.value);

// 2. Pourcentage Épargne
const savingsPercentage = computed(() => {
  if (globalNetWorth.value === 0) return 0;
  return Math.round((savings.value / globalNetWorth.value) * 100);
});

// 3. Pourcentage Investissement
const investmentPercentage = computed(() => {
  if (globalNetWorth.value === 0) return 0;
  return Math.round((investment.value / globalNetWorth.value) * 100);
});

// Évolutions (Statiques pour le moment)
const yearlyGrowth = 100;
</script>

<template>
  <div class="body max-w-7xl mx-auto w-full font-['Inter']">
    <div v-if="loading" class="h-28 bg-gray-200 animate-pulse rounded-[20px]"></div>

    <div v-else class="background-color text-white rounded-[20px] p-5 md:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-4 relative overflow-hidden">
      
      <div class="flex flex-col items-center sm:items-start z-10 w-full sm:w-auto text-center sm:text-left">
        <div class="px-2.5 py-1 rounded-md flex items-center gap-1.5 mb-2">
          <span class="text-xs"><svg class="w-6 h-6 text-[#94CFCA]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg></span>
          <span class="heading text-xl opacity-90">Mode Sécurité</span>
        </div>
        
        <div class="flex flex-col">
          <span class="text-3xl md:text-4xl font-black heading tracking-tight">
            {{ savings.toLocaleString() }} <span class="text-xl md:text-2xl font-bold">€</span>
          </span>
          <div class="flex items-center justify-center heading sm:justify-start gap-1 mt-0.5 ">
            <span class="text-xs font-bold">↗</span>
            <span class="text-[11px] heading">{{ yearlyGrowth }} € <span class="font-medium opacity-75">cette année</span></span>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-center sm:justify-end gap-10 md:gap-14 z-10 w-full sm:w-auto">
        
        <div class="flex flex-col items-end pr-10 md:pr-14 border-r border-white/20">
          <h4 class="heading white tracking-wide mb-0.5">Épargne</h4>
          <span class="text-2xl md:text-3xl font-black heading">
            {{ savingsPercentage }}<span class="text-base font-bold heading">%</span>
          </span>
          <div class="flex items-center gap-0.5 mt-0.5 heading">
            <span class="text-[10px] font-bold heading">↗</span>
            <span class="text-[10px] font-bold heading">{{ savings.toLocaleString() }} €</span>
          </div>
        </div>

        <div class="flex flex-col items-end">
          <h4 class="heading white tracking-wide mb-0.5">Investissement</h4>
          <span class="text-2xl md:text-3xl heading font-black">
            {{ investmentPercentage }}<span class="text-base font-bold heading">%</span>
          </span>
          <div class="flex items-center gap-0.5 mt-0.5 heading">
            <span class="text-[10px] heading font-bold">↗</span>
            <span class="text-[10px] heading font-bold">{{ investment.toLocaleString() }} €</span>
          </div>
        </div>

      </div>

      <div class="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
    </div>
  </div>
</template>