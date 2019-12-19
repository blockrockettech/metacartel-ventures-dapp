<template>
  <div class="card bg-light text-white mb-3">
    <div class="card-header">Your Proposal</div>
    <div class="card-body">
      <div class="row">
        <div class="col">Applicant</div>
        <div class="col"><code>{{ applicant }}</code></div>
      </div>
      <div class="row">
        <div class="col">Shares</div>
        <div class="col text-right">{{ form.sharesRequested }}</div>
      </div>
      <div class="row">
        <div class="col">Tribute</div>
        <div class="col text-right">{{ form.tributeOffered }}</div>
      </div>
      <div class="row">
        <div class="col">Details</div>
        <div class="col text-right">{{ form.details }}</div>
      </div>
    </div>
  </div>
</template>

<script>
    export default {
        name: 'proposal-card',
        props: ['form', 'applicant'],
    };
</script>

<style lang="scss" scoped>

</style>
