<script setup> 
import BilanEpargne from '@/components/epargne/BilanEpargne.vue';
import PyramideEpargne from '@/components/epargne/PyramideEpargne.vue';
import ObjectifEpargne from '@/components/epargne/ObjectifEpargne.vue';
</script>

<template>
  <div class="p-8 bg-[#F8FAFB] min-h-screen flex flex-col gap-10">
    
    <section>
      <BilanEpargne />
    </section>
    <section>
      <ObjectifEpargne />
    </section>
    <section>
      <PyramideEpargne />
    </section>




    <div class="flex justify-center">
      <button 
        @click="$router.push('/register-2')" 
        class="px-8 py-3 bg-[#00AA90] text-white font-bold rounded-xl hover:bg-[#008F7A] transition-all shadow-md"
      >
        Passer à l'étape Création Profil →
      </button>
      <button 
        @click="$router.push('/register-3')" 
        class="px-8 py-3 bg-[#00AA90] text-white font-bold rounded-xl hover:bg-[#008F7A] transition-all shadow-md"
      >
        Passer à l'étape Envelope →
      </button>
      <button 
        @click="$router.push('/register-4')" 
        class="px-8 py-3 bg-[#00AA90] text-white font-bold rounded-xl hover:bg-[#008F7A] transition-all shadow-md"
      >
        Passer à l'étape Projet →
      </button>
    </div>

    <h2 class="text-center text-2xl font-black text-gray-300 uppercase tracking-widest">
      Dashboard Placeholder
    </h2>

  </div>
</template>

<style scoped>
/* Retire tout ce qui contient "align-items: center" ou "justify-content: center" sur .about */
</style>