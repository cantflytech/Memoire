<script setup> 
import InvestEpargne from '@/components/investissement/InvestEpargne.vue';
import VolRend from '@/components/investissement/VolrendInvest.vue';
import Vueglobal from '@/components/investissement/VueglobalInvest.vue';
</script>

<template>
  <div class="p-8 bg-[#F8FAFB] min-h-screen flex flex-col gap-10">
    
    <section>
      <InvestEpargne />
      <VolRend />
      <Vueglobal />
    </section>
   
  </div>
</template>

<style scoped>
/* Retire tout ce qui contient "align-items: center" ou "justify-content: center" sur .about */
</style>