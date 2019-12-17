<template>
    <div class="container">
        <div v-if="account">
            <form-wizard @on-complete="onComplete" shape="circle" color="#fd0c61">
                <p slot="title"><img src="./assets/meta_chill+copy.png" style="max-height: 100px"/></p>
                <tab-content title="Submit proposal" :before-change="submitProposal">
                    <div class="jumbotron">
                        <p class="lead">This is where you can submit your proposal to join the DAO</p>
                        <hr class="my-4">
                        <p>Your applicant address is <code>{{ account }}</code></p>
                        <p v-if="tokenContract">Tribute token address is <code>{{ tokenContract._address }}</code> aka {{ tokenSymbol }}</p>
                        <hr class="my-4">
                        <b-form>
                            <b-form-group
                                    id="input-group-1"
                                    label="Shares requested:"
                                    label-for="input-1"
                                    description="We recommend a min of 20">
                                <b-form-input
                                        id="input-1"
                                        v-model="form.sharesRequested"
                                        type="number"
                                        required
                                ></b-form-input>
                            </b-form-group>

                            <b-form-group
                                    id="input-group-1"
                                    label="Tribute offered:"
                                    label-for="input-1"
                                    description="This must be a 1 to 1 of shared to tribute">
                                <b-form-input
                                        id="input-1"
                                        v-model="form.tributeOffered"
                                        type="number"
                                        required
                                ></b-form-input>
                            </b-form-group>

                            <!--<b-form-group-->
                            <!--id="input-group-1"-->
                            <!--label="Tribute token:"-->
                            <!--label-for="input-1"-->
                            <!--description="Must be an approved token. wEth is our deposit token.">-->
                            <!--<b-form-input-->
                            <!--id="input-1"-->
                            <!--v-model="form.tributeToken"-->
                            <!--type="text"-->
                            <!--required-->
                            <!--placeholder="0x0"-->
                            <!--&gt;</b-form-input>-->
                            <!--</b-form-group>-->

                            <b-form-group
                                    id="input-group-1"
                                    label="Details:"
                                    label-for="input-1"
                                    description="Some info to help the proposal; maybe a name?">
                                <b-form-input
                                        id="input-1"
                                        v-model="form.details"
                                        type="text"
                                        required
                                ></b-form-input>
                            </b-form-group>

                        </b-form>
                    </div>
                </tab-content>

                <tab-content title="Balance & Approvals" :before-change="approveAllowance">
                    <div class="jumbotron">
                        <p class="lead">This is where you can check your balances and if you are ready to submit a proposal</p>
                        <hr class="my-4">
                        <p>Applicant <code>{{ account }}</code></p>
                        <hr class="my-4">
                        <div class="row">
                            <div class="col-4" v-if="tokenBalance">
                                <div class="card bg-info text-white mb-3">
                                    <div class="card-header">Token Balance</div>
                                    <div class="card-body">
                                        <h5 class="card-title">
                                            {{ toEther(tokenBalance) }} {{ tokenSymbol }}
                                        </h5>
                                        <p class="card-text">This is your personal balance of {{ tokenSymbol }}.</p>
                                        <p class="card-text">We use the approval ERC20 process to move your proposal tribute on proposal submission.</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-4" v-if="approvedBalance">
                                <div class="card text-white mb-3" :class="{'bg-success': approvedBalance && parseFloat(toEther(approvedBalance)) >= parseFloat(form.tributeOffered), 'bg-warning': approvedBalance && parseFloat(toEther(approvedBalance)) < parseFloat(form.tributeOffered)}">
                                    <div class="card-header">Allowance</div>
                                    <div class="card-body">
                                        <h5 class="card-title">
                                            {{ toEther(approvedBalance) }} {{ tokenSymbol }}
                                        </h5>
                                        <p class="card-text">This how much you have "approved" to the DAO currently</p>
                                        <p class="card-text">This proposal needs {{ form.tributeOffered }} {{ tokenSymbol }}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-4" v-if="approvedBalance && parseFloat(toEther(approvedBalance)) < parseFloat(form.tributeOffered)">
                                <div class="alert alert-warning">
                                    Your allowance is less than required. <br/>
                                    Two transactions will occur on completion, one for approval, and one for a the DAO proposal.
                                </div>
                            </div>
                            <div class="col-4" v-else>
                                <div class="alert alert-info">
                                    You have enough approved allowance. <br/>
                                    One transaction will occur on completion for the DAO proposal.
                                </div>
                            </div>
                        </div>
                    </div>
                </tab-content>

                <tab-content title="Summary">
                    <div class="jumbotron">
                        <p class="lead">This is where you can see you proposal</p>
                        <hr class="my-4">
                        <div class="row">
                            <div class="col">
                                <div class="alert alert-success">
                                    Proposal submitted!
                                </div>
                                <div>
                                    {{ member }}
                                </div>
                            </div>
                        </div>
                    </div>
                </tab-content>

                <transition name="fade" mode="out-in">
                    <router-view></router-view>
                </transition>
            </form-wizard>
        </div>
        <div v-else class="mt-5">
            <p>This DAO is on the blockchain - please sign in to make a proposal</p>
            <button class="btn btn-secondary btn-lg btn-block" @click="onLogin">Sign in</button>
        </div>
    </div>
</template>

<script>
    import {mapGetters, mapState} from 'vuex';
    import CurrentNetwork from '@/components/CurrentNetwork.vue';
    import web3Connect from '@/web3ConnectService';

    export default {
        name: 'App',
        data() {
            return {
                form: {
                    sharesRequested: null,
                    tributeOffered: null,
                    details: null,
                },
            };
        },
        components: {
            CurrentNetwork
        },
        computed: {
            ...mapState([
                'tokenContract',
                'account',
                'member',
                'tokenBalance',
                'approvedBalance',
                'tokenSymbol',
                'web3',
            ]),
            ...mapGetters([
                'toEther',
                'toEtherFixed',
            ])
        },
        methods: {
            onLogin() {
                web3Connect.toggleModal();
            },

            onComplete: function () {
                alert('Yay. Done!');
            },

            submitProposal() {
                console.log('Proposal submitted', this.form);

                return true;
            },

            async approveAllowance() {
                console.log('Approval submitted');

                try {
                    if (parseFloat(this.web3.utils.fromWei(this.approvedBalance, 'ether')) < parseFloat(this.form.tributeOffered)) {
                        await this.$store.dispatch('allowance', this.form.tributeOffered);
                    }
                } catch (e) {
                    console.error('allowance failure:', e);
                    return false;
                }

                try {
                    await this.$store.dispatch('submitProposal', this.form);
                } catch (e) {
                    console.error('submitProposal failure:', e);
                    return false;
                }

                return true;
            },
        },
        created() {
            web3Connect.on('connect', provider => {
                this.$store.dispatch('bootstrap', provider);
            });
        }
    };
</script>

<style lang="scss">


    // Your variable overrides can go here, e.g.:
    // $h1-font-size: 3rem;

    @import "./assets/_variables";
    @import '../node_modules/bootstrap/scss/bootstrap';
    @import "./assets/bootswatch";

    code {
        color: $xcopy1;
    }

    .vue-form-wizard .wizard-icon-circle {
        background-color: $xcopy1 !important;
        border-color: $xcopy2 !important;

        .step-title {
            color: $xcopy2 !important;;
        }
    }

    .vue-form-wizard .wizard-nav-pills>li>a {
        color: $xcopy1 !important;
    }

    .vue-form-wizard .wizard-icon-circle .wizard-icon {
        color: $xcopy2 !important;
    }

    .fade-enter-active, .fade-leave-active {
        transition: opacity .5s
    }

    .fade-enter, .fade-leave-to /* .fade-leave-active in <2.1.8 */
    {
        opacity: 0
    }
</style>
