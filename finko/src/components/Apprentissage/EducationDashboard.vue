<script setup>
import { ref, onMounted } from 'vue';
import { db, auth } from '../../firebase/config';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

// IMPORTATIONS DES COMPOSANTS DE COURS
import Cours1Epargne from './cours/epargne/Cours1Epargne.vue'; 
import Cours2Epargne from './cours/epargne/Cours2Epargne.vue';
import Cours1Invest from './cours/Invest/Cours1Invest.vue';
import Cours2Invest from './cours/Invest/Cours2Invest.vue';

// États pour la navigation interne
// Valeurs : 'menu' / 'cours_epargne_1' / 'cours_epargne_2' / 'cours_epargne_3' / 'cours_invest_1' / 'cours_invest_2'
const currentView = ref('menu');

// États pour les niveaux de l'utilisateur provenant de Firebase
const nivEpargne = ref(0);
const nivInvest = ref(0);
const userXP = ref(0);
const loading = ref(true);

// Accordéons ouverts par défaut (true = ouvert)
const openChapitreEpargne = ref(true);
const openChapitreInvest = ref(true);

// Titres dynamiques des badges selon le niveau de l'utilisateur (0 à 4)
const levelTitles = {
  0: 'Novice économe',
  1: 'Apprenti économe',
  2: 'Économe initié',
  3: 'Économe chevronné',
  4: 'Expert économe'
};

const investTitles = {
  0: 'Investisseur Novice',
  1: 'Investisseur Apprenti',
  2: 'Investisseur Initié',
  3: 'Investisseur Chevronné',
  4: 'Investisseur Expert'
};

onMounted(() => {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      try {
        const coursesRef = collection(db, "Courses");
        const q = query(coursesRef, where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const courseDoc = querySnapshot.docs[0].data();
          nivEpargne.value = courseDoc.Niv_epargne ?? 0;
          nivInvest.value = courseDoc.Niv_Invest ?? 0;
          userXP.value = courseDoc.XP ?? 0;
        } else {
          await setDoc(doc(coursesRef), {
            userId: user.uid,
            Niv_epargne: 0,
            Niv_Invest: 0,
            XP: 0
          });
        }
      } catch (e) {
        console.error("Erreur lors du chargement des cours :", e);
      } finally {
        loading.value = false;
      }
    }
  });
});
</script>

<template>
<div v-if="currentView === 'cours_epargne_1'" class="min-h-screen bg-[#F8FAFB] py-6">
  <div class="max-w-7xl mx-auto px-4 space-y-4">
    
    <div>
      <button 
        @click="currentView = 'menu'" 
        class="heading bg-white hover:bg-gray-100 text-gray-700 font-bold py-2 px-4 rounded-xl border border-gray-200 shadow-xs text-xs transition-colors"
      >
        ← Retour aux chapitres
      </button>
    </div>

    <Cours1Epargne />
  </div>
</div>

<div v-else-if="currentView === 'cours_epargne_2'" class="min-h-screen bg-[#F8FAFB] py-6">
  <div class="max-w-7xl mx-auto px-4 space-y-4">
    <div>
      <button @click="currentView = 'menu'" class="heading bg-white hover:bg-gray-100 text-gray-700 font-bold py-2 px-4 rounded-xl border border-gray-200 shadow-xs text-xs transition-colors">
        ← Retour aux chapitres
      </button>
    </div>
    <Cours2Epargne />
  </div>
</div>

<div v-else-if="currentView === 'cours_invest_1'" class="min-h-screen bg-[#F8FAFB] py-6">
  <div class="max-w-7xl mx-auto px-4 space-y-4">
    <div>
      <button @click="currentView = 'menu'" class="heading bg-white hover:bg-gray-100 text-gray-700 font-bold py-2 px-4 rounded-xl border border-gray-200 shadow-xs text-xs transition-colors">
        ← Retour aux chapitres
      </button>
    </div>
    <Cours1Invest />
  </div>
</div>

<div v-else-if="currentView === 'cours_invest_2'" class="min-h-screen bg-[#F8FAFB] py-6">
  <div class="max-w-7xl mx-auto px-4 space-y-4">
    <div>
      <button @click="currentView = 'menu'" class="heading bg-white hover:bg-gray-100 text-gray-700 font-bold py-2 px-4 rounded-xl border border-gray-200 shadow-xs text-xs transition-colors">
        ← Retour aux chapitres
      </button>
    </div>
    <Cours2Invest />
  </div>
</div>

  <main v-else-if="currentView === 'menu'" class="heading min-h-screen bg-[#F8FAFB] p-4 md:p-8 font-['Inter']">
    <div class="max-w-7xl mx-auto space-y-8">
      
      <div class="text-center space-y-2">
        <h1 class="heading text-2xl md:text-3xl font-black tracking-tight">Choisissez votre voie</h1>
        <p class="heading text-sm text-gray-500 font-medium">Progressez à votre rythme. Devenez un expert complet.</p>
      </div>

      <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="h-64 bg-gray-200 animate-pulse rounded-[24px]"></div>
        <div class="h-64 bg-gray-200 animate-pulse rounded-[24px]"></div>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        <div class="space-y-4">
          <div class="bg-[#00AA90] text-white p-6 rounded-[24px] shadow-sm relative overflow-hidden">
            <div class="flex items-center gap-2 opacity-75 mb-1">
              <span class="text-xs">🛡️</span>
              <span class="heading text-[10px] font-black uppercase tracking-wider">Voie de la sérénité</span>
            </div>
            
            <h2 class="heading text-2xl font-black tracking-tight mb-0.5">
              {{ levelTitles[nivEpargne] || 'Novice économe' }}
            </h2>
            <p class="heading text-xs font-bold text-teal-100 mb-4">Niveau {{ nivEpargne }}</p>

            <div class="space-y-1.5 relative z-10">
              <span class="heading text-[10px] font-bold text-teal-100/90 block">Progression globale</span>
              <div class="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                <div class="bg-white h-full rounded-full transition-all duration-500" :style="{ width: `${nivEpargne * 25}%` }"></div>
              </div>
            </div>
            <div class="absolute right-4 bottom-2 text-7xl opacity-10 select-none">🛡️</div>
          </div>

          <div class="bg-white border border-gray-100 rounded-2xl shadow-xs overflow-hidden">
            <button 
              @click="openChapitreEpargne = !openChapitreEpargne"
              class="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50/50 transition-colors text-left"
            >
              <div class="flex items-center gap-3">
                <div class="bg-[#00AA90] text-white w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <h3 class="text-sm font-black text-gray-900">Chapitre 1 : les Fondations</h3>
                  <p class="text-[11px] text-gray-400 font-medium mt-0.5">Budget, Dettes et Fond d'urgence.</p>
                </div>
              </div>
              <span class="text-gray-400 transform transition-transform duration-200" :class="{ 'rotate-180': openChapitreEpargne }">▼</span>
            </button>

            <div v-show="openChapitreEpargne" class="border-t border-gray-50 p-3 space-y-2 bg-gray-50/30">
              
              <div 
                @click="currentView = 'cours_epargne_1'"
                class="bg-white border border-gray-100 p-3 rounded-xl flex items-center justify-between shadow-xs cursor-pointer hover:border-[#00AA90] hover:bg-teal-50/10 transition-all group"
              >
                <div class="flex items-center gap-3">
                  <span class="text-base text-[#00AA90] group-hover:scale-110 transition-transform">🛡️</span>
                  <span class="text-xs font-bold text-gray-700 group-hover:text-[#00AA90]">Comprendre son budget</span>
                </div>
                <span class="text-[9px] font-black tracking-wider text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md uppercase">Leçon</span>
              </div>

              <div 
                @click="currentView = 'cours_epargne_2'"
                class="bg-white border border-gray-100 p-3 rounded-xl flex items-center justify-between shadow-xs cursor-pointer hover:border-[#00AA90] hover:bg-teal-50/10 transition-all group"
              >
                <div class="flex items-center gap-3">
                  <span class="text-base text-[#00AA90] group-hover:scale-110 transition-transform">🛡️</span>
                  <span class="text-xs font-bold text-gray-700 group-hover:text-[#00AA90]">Créer son fonds de précaution</span>
                </div>
                <span class="text-[9px] font-black tracking-wider text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md uppercase">Leçon</span>
              </div>

              

            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div class="bg-[#5B51F4] text-white p-6 rounded-[24px] shadow-sm relative overflow-hidden">
            <div class="flex items-center gap-2 opacity-75 mb-1">
              <span class="text-xs">📈</span>
              <span class="heading text-[10px] font-black uppercase tracking-wider">Mode croissance</span>
            </div>
            
            <h2 class="heading text-2xl font-black tracking-tight mb-0.5">
              {{ investTitles[nivInvest] || 'Investisseur Novice' }}
            </h2>
            <p class="heading text-xs font-bold text-indigo-100 mb-4">Niveau {{ nivInvest }}</p>

            <div class="space-y-1.5 relative z-10">
              <div class="flex justify-between text-[10px] font-bold text-indigo-100/90">
                <span class="heading">Progression globale</span>
                <span class="heading">{{ nivInvest * 25 }}%</span>
              </div>
              <div class="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                <div class="bg-white h-full rounded-full transition-all duration-500" :style="{ width: `${nivInvest * 25}%` }"></div>
              </div>
            </div>
            <div class="absolute right-4 bottom-2 text-7xl opacity-10 select-none">📈</div>
          </div>

          <div class="bg-white border border-gray-100 rounded-2xl shadow-xs overflow-hidden">
            <button 
              @click="openChapitreInvest = !openChapitreInvest"
              class="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50/50 transition-colors text-left"
            >
              <div class="flex items-center gap-3">
                <div class="bg-[#5B51F4] text-white w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <h3 class="text-sm font-black text-gray-900">Chapitre 1 : les Fondations</h3>
                  <p class="text-[11px] text-gray-400 font-medium mt-0.5">Introduction aux marchés et enveloppes.</p>
                </div>
              </div>
              <span class="text-gray-400 transform transition-transform duration-200" :class="{ 'rotate-180': openChapitreInvest }">▼</span>
            </button>

            <div v-show="openChapitreInvest" class="border-t border-gray-50 p-3 space-y-2 bg-gray-50/30">
              
              <div 
                @click="currentView = 'cours_invest_1'"
                class="bg-white border border-gray-100 p-3 rounded-xl flex items-center justify-between shadow-xs cursor-pointer hover:border-[#5B51F4] hover:bg-indigo-50/10 transition-all group"
              >
                <div class="flex items-center gap-3">
                  <span class="text-base text-indigo-500 group-hover:scale-110 transition-transform">🎋</span>
                  <span class="text-xs font-bold text-gray-700 group-hover:text-[#5B51F4]">Comprendre l'effet des intérêts composés</span>
                </div>
                <span class="text-[9px] font-black tracking-wider text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md uppercase">Leçon</span>
              </div>

              <div 
                @click="currentView = 'cours_invest_2'"
                class="bg-white border border-gray-100 p-3 rounded-xl flex items-center justify-between shadow-xs cursor-pointer hover:border-[#5B51F4] hover:bg-indigo-50/10 transition-all group"
              >
                <div class="flex items-center gap-3">
                  <span class="text-base text-indigo-500 group-hover:scale-110 transition-transform">💎</span>
                  <span class="text-xs font-bold text-gray-700 group-hover:text-[#5B51F4]">Choisir son enveloppe fiscale (PEA vs AV)</span>
                </div>
                <span class="text-[9px] font-black tracking-wider text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-md uppercase">Leçon</span>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  </main>
</template>