<template>
    <div class="container">
        <div v-if="account">
            <form-wizard @on-complete="onComplete" shape="circle" color="#fd0c61">
                <p slot="title"><img src="./assets/meta_chill+copy.png" style="max-height: 100px"/></p>
                <tab-content title="Prepare proposal" :before-change="prepareProposal">
                    <div class="jumbotron">
                        <p class="lead">This is where you can submit your proposal to join the MetaCartel Ventures DAO</p>
                        <p>The transaction will be submitted to chain at the end of the checks</p>
                        <hr class="my-4">
                        <p>Your applicant address is <code>{{ account }}</code></p>
                        <p v-if="molochContract">The Moloch DAO address is <code>{{ molochContract._address }}</code></p>
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
                                        min="1"
                                        step="1"
                                        @input="onFormInput"
                                        v-bind:class="{ 'border-danger': !form.sharesRequested && form.dirty }"
                                        required
                                ></b-form-input>
                            </b-form-group>

                            <b-form-group
                                    id="input-group-1"
                                    label="Tribute offered in wETH:"
                                    label-for="input-1"
                                    description="Recommended: a 1 to 1 of shares requested to tribute offered ratio">
                                <b-form-input
                                        id="input-1"
                                        v-model="form.tributeOffered"
                                        type="number"
                                        min="1"
                                        step="1"
                                        @input="onFormInput"
                                        v-bind:class="{ 'border-danger': !form.tributeOffered && form.dirty }"
                                        required
                                ></b-form-input>
                            </b-form-group>

                            <b-form-group
                                    id="input-group-1"
                                    label="Details:"
                                    label-for="input-1"
                                    description="Some info to help the proposal; maybe a name?">
                                <b-form-input
                                        id="input-1"
                                        v-model="form.details"
                                        type="text"
                                        @input="onFormInput"
                                        v-bind:class="{ 'border-danger': !form.details && form.dirty }"
                                        required
                                ></b-form-input>
                            </b-form-group>

                        </b-form>
                    </div>
                </tab-content>

                <tab-content title="wEth balance check" :before-change="convertEthToWeth">
                    <div class="jumbotron">
                        <p class="lead">MetaCartel ventures is currently accepting wETH.<br/>This is where can check you wETH balance and convert more if needed</p>
                        <hr class="my-4">
                        <p>Applicant <code>{{ account }}</code></p>
                        <p v-if="molochContract">The Moloch DAO address is <code>{{ molochContract._address }}</code></p>
                        <p v-if="wethContract">{{ tokenSymbol }} smart contract token address is <code>{{ wethContract._address }}</code></p>
                        <hr class="my-4">
                        <div class="row">
                            <div class="col-6" v-if="tokenBalance">
                                <div class="card bg-info text-white mb-3">
                                    <div class="card-header">wETH Balance</div>
                                    <div class="card-body">
                                        <h5 class="card-title">
                                            {{ toEther(tokenBalance) }} {{ tokenSymbol }}
                                        </h5>
                                        <p class="card-text">This is your personal balance of {{ tokenSymbol }}.</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-6" v-if="tokenBalance && parseFloat(toEther(tokenBalance)) < parseFloat(form.tributeOffered)">
                                <div class="alert alert-warning">
                                    You don't have enough wEth to submit your proposal of <strong>{{ form.tributeOffered }} {{ tokenSymbol }}</strong>.
                                    You require <strong>{{ parseFloat(form.tributeOffered) - parseFloat(toEther(tokenBalance)) }} {{ tokenSymbol }}</strong> more.
                                    <br/>
                                    <br/>
                                    Clicking "Next" will trigger a transaction to convert the required ETH to wETH in order for you to proceed.
                                </div>
                            </div>
                            <div class="col-6" v-else>
                                <div class="alert alert-info">
                                    Yass! You have enough wEth for your proposal.
                                    <br/>
                                    Advance to the next step!
                                </div>
                            </div>
                        </div>
                    </div>
                </tab-content>

                <tab-content title="wEth approval check" :before-change="approveAllowance">
                    <div class="jumbotron">
                        <p class="lead">This is where you can check your balances and if you are ready to submit a proposal</p>
                        <hr class="my-4">
                        <p>Applicant <code>{{ account }}</code></p>
                        <p v-if="molochContract">The Moloch DAO address is <code>{{ molochContract._address }}</code></p>
                        <p v-if="wethContract">{{ tokenSymbol }} smart contract token address is <code>{{ wethContract._address }}</code></p>
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
                                <div class="card text-white mb-3"
                                     :class="{'bg-success': approvedBalance && parseFloat(toEther(approvedBalance)) >= parseFloat(form.tributeOffered), 'bg-warning': approvedBalance && parseFloat(toEther(approvedBalance)) < parseFloat(form.tributeOffered)}">
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

                <tab-content title="Submit proposal" :before-change="submitProposal">
                    <div class="jumbotron">
                        <p class="lead">This is where you can check everything before submitting to the DAO</p>
                        <hr class="my-4">
                        <div class="row">
                            <div class="col">
                                <p>Click "next" to go fo</p>
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
            <h1 class="text-center"><img src="./assets/meta_chill+copy.png" style="max-height: 100px"/></h1>
            <p class="text-center">This DAO is on the blockchain - please sign in to make a proposal</p>
            <button class="btn btn-outline-info btn-lg btn-block" @click="onLogin">Sign in</button>
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
                    dirty: false,
                    sharesRequested: null,
                    tributeOffered: null,
                    details: null,
                },

                count: 0
            };
        },
        components: {
            CurrentNetwork
        },
        computed: {
            ...mapState([
                'wethContract',
                'molochContract',
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

            onFormInput() {
              this.form.dirty = true;
            },

            onComplete: function () {
                alert('Yay. Done!');
            },

            convertEthToWeth() {
                return true;
            },

            isFormValid() {
                const {sharesRequested, tributeOffered, details } = this.form;
                return sharesRequested && tributeOffered && details;
            },

            prepareProposal() {
                if (!this.isFormValid()) {
                    this.form.dirty = true;
                    console.log('Invalid proposal');
                    return false;
                }

                console.log('Proposal prepared', this.form);
                return true;
            },

            convertEthToWeth() {
                console.log('Convert ETH to wETH');

                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        console.log('resolve 10000', this.count)
                        resolve(true);
                    }, 10000);
                });

                // return new Promise((resolve, reject) => {
                //     try {
                //         if (parseFloat(this.web3.utils.fromWei(this.tokenBalance, 'ether')) < parseFloat(this.form.tributeOffered)) {
                //             this.$store.dispatch('deposit', (parseFloat(this.form.tributeOffered) - parseFloat(this.web3.utils.fromWei(this.tokenBalance, 'ether'))).toString(10))
                //                 .then(() => {
                //                     console.log('DONE');
                //                     resolve(true);
                //                 });
                //         } else {
                //             resolve(true);
                //         }
                //     } catch (e) {
                //         console.error('allowance failure:', e);
                //         reject(false);
                //     }
                // });
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

                return true;
            },

            async submitProposal() {
                console.log('Proposal submitted', this.form);

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

    @import "./assets/_variables";
    @import '../node_modules/bootstrap/scss/bootstrap';
    @import "./assets/bootswatch";

    code {
        color: $xcopy1;
    }

    .vue-form-wizard .wizard-icon-circle {
        background-color: $xcopy1 !important;
        border-color: $xcopy3 !important;

        .step-title {
            color: $xcopy3 !important;;
        }
    }

    .vue-form-wizard .wizard-nav-pills > li > a {
        color: $xcopy3 !important;
    }

    .vue-form-wizard .wizard-icon-circle .wizard-icon {
        color: $xcopy3 !important;
    }

    .fade-enter-active, .fade-leave-active {
        transition: opacity .5s
    }

    .fade-enter, .fade-leave-to /* .fade-leave-active in <2.1.8 */
    {
        opacity: 0
    }
</style>
