import Vue from 'vue';
import Vuex from 'vuex';

import * as Web3 from 'web3';

import notifier from "../notifier";

Vue.use(Vuex);

const WethJson = require("../truffle/wETH");
const MolochJson = require("../truffle/Moloch");

export default new Vuex.Store({
    state: {
        // Network
        networkId: 1,
        networkName: 'Mainnet',
        etherscanBase: 'https://etherscan.io',

        // Account
        account: null,
        member: null,

        web3: null,
        notifyInstance: null,

        // Contracts
        wethContract: null,
        molochContract: null,

        tokenBalance: null,
        approvedBalance: null,

        tokenSymbol: 'wETH',
    },
    mutations: {
        networkDetails(state, {networkId, networkName, etherscanBase}) {
            state.networkId = networkId;
            state.networkName = networkName;
            state.etherscanBase = etherscanBase;
            state.notifyInstance = notifier(networkId);

            state.wethContract = new state.web3.eth.Contract(WethJson.abi, WethJson.networks[state.networkId].address);
            state.molochContract = new state.web3.eth.Contract(MolochJson.abi, MolochJson.networks[state.networkId].address);
        },

        account(state, account) {
            state.account = account;
        },

        member(state, member) {
            state.member = member;
        },

        tokenBalance(state, tokenBalance) {
            state.tokenBalance = tokenBalance;
        },

        approvedBalance(state, approvedBalance) {
            state.approvedBalance = approvedBalance;
        },

        web3(state, web3) {
            state.web3 = web3;
        },
    },
    getters: {
        isConnected: () => {
            return window.web3 !== undefined;
        },

        etherscanTokenLink: state => (tokenId) => {
            const networkAddress = TokenJson.networks[state.networkId].address;
            return `${state.etherscanBase}/token/${networkAddress}?a=${tokenId}`;
        },

        toEther: state => (wei) => state.web3.utils.fromWei(wei, 'ether'),

        toEtherFixed: state => (wei, dp) => parseFloat(state.web3.utils.fromWei(wei, 'ether')).toFixed(dp),

        toDate: state => (timestampInSecs) => new Date(timestampInSecs * 1000).toDateString()
    },
    actions: {
        bootstrap({dispatch}, provider) {
            dispatch('loginWeb3', provider);
        },

        /////////////////////////
        // Web3 initialisation //
        /////////////////////////

        async loginWeb3({dispatch, state}, provider) {
            if (!state.account) {
                window.web3 = new Web3(provider);
                dispatch('initWeb3', window.web3);
            }
        },

        async initWeb3({commit, dispatch, state}, web3) {
            commit('web3', web3);

            await dispatch('getNetwork');

            state.web3.eth.getAccounts(async (error, accounts) => {
                if (!error) {
                    const account = accounts[0];
                    commit('account', account);

                    dispatch('tokenBalance');
                    dispatch('approvedBalance');

                    dispatch('member');
                } else {
                    console.log(`Error getting accounts`, error);
                }
            });
        },

        async getNetwork({commit, dispatch}) {
            const networkId = await dispatch('getNetworkId');
            const networkName = await dispatch('getNetworkName', networkId);
            const etherscanBase = await dispatch('getEtherscanAddress', networkId);
            return commit('networkDetails', {networkId, networkName, etherscanBase});
        },

        getNetworkId({state}) {
            return state.web3.eth.net.getId();
        },

        getEtherscanAddress({}, networkId) {
            switch (networkId) {
                case 1:
                    return 'https://etherscan.io';
                case 4:
                    return 'https://rinkeby.etherscan.io';
                default:
                    return '';
            }
        },

        getNetworkName({}, networkId) {
            switch (networkId) {
                case 1:
                    return 'MAINNET';
                case 4:
                    return 'RINKEBY';
                case 5777:
                    return 'LOCAL';
                default:
                    return 'UNKNOWN';
            }
        },

        /////////////////////
        // Token calls    //
        ////////////////////

        async tokenBalance({commit, state}) {
            const tokenBalance = await state.wethContract.methods.balanceOf(state.account).call();
            commit('tokenBalance', tokenBalance);
        },

        async approvedBalance({commit, state}) {
            const approvedBalance = await state.wethContract.methods.allowance(state.account, state.molochContract._address).call();
            commit('approvedBalance', approvedBalance);
        },

        async deposit({commit, state, dispatch}, wethRequired) {
            console.log('deposit TX', wethRequired);

            return new Promise((resolve, reject) => {
                state.wethContract.methods.deposit()
                    .send({
                        from: state.account,
                        value: state.web3.utils.toWei(wethRequired),
                    })
                    .once('transactionHash', (hash) => {
                        console.log('hash', hash);

                        // notification popup
                        state.notifyInstance.hash(hash);
                    })
                    .once('receipt', function (receipt) {
                        console.log('receipt', receipt);

                        dispatch('tokenBalance');

                        resolve(true);
                    })
                    .on('error', function (error) {
                        console.log('Error on deposit', error);
                        reject(false);
                    });
            });
        },

        async allowance({commit, state}, allowanceRequired) {
            console.log('allowance TX', allowanceRequired);

            return new Promise((resolve, reject) => {
                state.wethContract.methods.approve(
                    state.molochContract._address,
                    state.web3.utils.toWei(allowanceRequired)
                )
                    .send({
                        from: state.account
                    })
                    .once('transactionHash', (hash) => {
                        console.log('hash', hash);

                        // notification popup
                        state.notifyInstance.hash(hash);
                    })
                    .on('receipt', function (receipt) {
                        console.log('receipt', receipt);

                        dispatch('approvedBalance');

                        resolve(true);
                    })
                    .on('error', reject);
            });
        },

        /////////////////////
        // Moloch calls   //
        ////////////////////

        async member({commit, state}) {
            const member = await state.molochContract.methods.members(state.account).call();
            commit('member', member);
        },

        async submitProposal({commit, state}, form) {
            console.log('submitProposal TX', form);

            return new Promise((resolve, reject) => {
                state.molochContract.methods.submitProposal(
                    state.account,
                    form.sharesRequested,
                    state.web3.utils.toWei(form.tributeOffered),
                    state.wethContract._address,
                    '0',
                    state.wethContract._address,
                    form.details
                )
                    .send({
                        from: state.account
                    })
                    .once('transactionHash', (hash) => {
                        // notification popup
                        state.notifyInstance.hash(hash);
                    })
                    .on('receipt', function (receipt) {
                        resolve(receipt);

                        dispatch('tokenBalance');
                        dispatch('approvedBalance');

                        dispatch('member');
                    })
                    .on('error', reject);
            });
        },
    },
});
