<script setup>
import { ref, onMounted } from 'vue';
import { db, auth } from '../../firebase/config';
// CORRECTION : setDoc est bien présent ici
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Émojis populaires proposés pour le choix d'icône
const quickIcons = ['🏠', '🚗', '✈️', '💍', '👶', '🎓', '👴', '💼', '🚀', '💰'];

// États pour le formulaire de création d'un projet
const newProjectName = ref('');
const newProjectIcon = ref('💰'); // Icône par défaut
const newProjectAmount = ref(null);
const newProjectDeadline = ref('');

// Liste des projets créés par l'utilisateur
const userProjects = ref([]);
const loading = ref(true);

// Charger les projets existants depuis Firebase au démarrage
onMounted(() => {
  auth.onAuthStateChanged(async (user) => {
    if (!user) return;
    try {
      const profileRef = doc(db, "user_financial_profile", user.uid);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        const data = profileSnap.data().user_financial_profile || profileSnap.data();
        if (data.life_projects) {
          userProjects.value = data.life_projects;
        }
      }
    } catch (e) {
      console.error("Erreur chargement projets :", e);
    } finally {
      loading.value = false;
    }
  });
});

// Ajouter un projet à la liste locale
const addProject = () => {
  if (!newProjectName.value || !newProjectAmount.value || !newProjectDeadline.value) {
    alert("Remplis tous les champs pour ajouter ton projet !");
    return;
  }

  userProjects.value.push({
    name: newProjectName.value,
    icon: newProjectIcon.value,
    target_amount: Number(newProjectAmount.value),
    deadline: newProjectDeadline.value,
    amount: 0 // AJOUT : Initialisé à 0 pour faire fonctionner les jauges de ton dashboard !
  });

  // Réinitialiser le formulaire pour le projet suivant
  newProjectName.value = '';
  newProjectIcon.value = '💰';
  newProjectAmount.value = null;
  newProjectDeadline.value = '';
};

// Supprimer un projet de la liste
const removeProject = (index) => {
  userProjects.value.splice(index, 1);
};

// Sauvegarder la liste complète dans Firestore
const saveStep = async () => {
  const user = auth.currentUser;
  if (!user) return;
  if (userProjects.value.length === 0) {
    alert("Ajoute au moins un projet de vie avant de finaliser !");
    return;
  }

  try {
    const profileRef = doc(db, "user_financial_profile", user.uid);
    
    // CORRECTION CRITIQUE : Utilisation de setDoc + merge: true pour éviter le crash "No document to update"
    await setDoc(profileRef, {
      user_financial_profile: {
        life_projects: userProjects.value
      }
    }, { merge: true });

    alert("Profil financier complété avec succès !");
  } catch (e) {
    console.error("Erreur lors de la sauvegarde :", e);
  }
};
</script>

<template>
  <main class="min-h-screen bg-[#F8FAFB] p-4 md:p-6 font-['Inter'] flex items-center justify-center">
    <div class="max-w-xl w-full bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-gray-100">
      
      <div v-if="loading" class="text-center py-12 text-gray-400 font-medium">
        Chargement de tes projets...
      </div>

      <div v-else class="space-y-6">
        <header class="flex justify-between items-center">
          <div>
            <h1 class="text-xl font-black text-gray-900">Création de ton profil Financier</h1>
            <p class="text-xs font-bold text-[#00AA90] mt-0.5">étape 4/4 : Tes projets de vie</p>
          </div>
          <div class="flex gap-1.5">
            <div class="w-6 h-1.5 rounded-full bg-[#00AA90]"></div>
            <div class="w-6 h-1.5 rounded-full bg-[#00AA90]"></div>
            <div class="w-6 h-1.5 rounded-full bg-[#00AA90]"></div>
            <div class="w-6 h-1.5 rounded-full bg-[#00AA90]"></div>
          </div>
        </header>

        <section class="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4">
          <h2 class="text-xs font-black text-gray-800 uppercase tracking-wider">
            ➕ Ajouter un nouveau projet
          </h2>
          
          <div class="grid grid-cols-4 gap-2">
            <div class="col-span-1">
              <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Icône</label>
              <input 
                v-model="newProjectIcon" 
                type="text" 
                maxLength="2"
                class="w-full text-center p-2.5 bg-white border border-gray-200 rounded-xl text-lg outline-none focus:border-[#00AA90]"
              />
            </div>
            <div class="col-span-3">
              <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nom du projet</label>
              <input 
                v-model="newProjectName" 
                type="text" 
                placeholder="Ex: Voyage au Japon, Apport Immo..." 
                class="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-[#00AA90]"
              />
            </div>
          </div>

          <div class="flex flex-wrap gap-1.5 justify-center py-1 bg-white rounded-xl border border-gray-100">
            <button 
              v-for="icon in quickIcons" 
              :key="icon"
              @click="newProjectIcon = icon"
              type="button"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-md hover:bg-gray-100 transition-colors"
            >
              {{ icon }}
            </button>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Montant ciblé (€)</label>
              <input 
                v-model.number="newProjectAmount" 
                type="number" 
                placeholder="Ex: 5000" 
                class="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-[#00AA90]"
              />
            </div>
            <div>
              <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Date objectif</label>
              <input 
                v-model="newProjectDeadline" 
                type="month" 
                class="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-[#00AA90] text-gray-700"
              />
            </div>
          </div>

          <button 
            @click="addProject"
            class="w-full bg-gray-900 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-gray-800 transition-all shadow-sm"
          >
            Ajouter à ma liste
          </button>
        </section>

        <section v-if="userProjects.length > 0" class="space-y-2.5">
          <h2 class="text-sm font-black text-gray-800 uppercase tracking-wider">
            🎯 Mes projets enregistrés ({{ userProjects.length }})
          </h2>
          
          <div class="max-h-48 overflow-y-auto space-y-2 pr-1">
            <div 
              v-for="(project, index) in userProjects" 
              :key="index"
              class="flex items-center justify-between p-3.5 bg-white border border-gray-100 rounded-2xl shadow-xs relative group"
            >
              <div class="flex items-center gap-3">
                <span class="text-xl p-2 bg-[#E6F6F4] rounded-xl">{{ project.icon }}</span>
                <div>
                  <h4 class="font-black text-gray-900 text-xs">{{ project.name }}</h4>
                  <p class="text-[10px] text-gray-400 font-medium mt-0.5">
                    Objectif : {{ project.deadline }}
                  </p>
                </div>
              </div>
              
              <div class="flex items-center gap-4">
                <span class="text-xs font-black text-[#00AA90]">{{ project.target_amount?.toLocaleString() }} €</span>
                <button 
                  @click="removeProject(index)" 
                  class="text-red-400 hover:text-red-600 font-bold text-xs"
                >
                  ❌
                </button>
              </div>
            </div>
          </div>
        </section>

        <button 
          @click="saveStep"
          class="w-full bg-[#00AA90] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#008F7A] transition-all text-sm shadow-md mt-4"
        >
          Finaliser mon profil financier <span>✓</span>
        </button>
      </div>

    </div>
  </main>
</template>