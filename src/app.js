App = {
    loading: false,
    contracts: {},
    load: async ()=> {
        await App.loadWeb3();
        await App.loadAccount();
        await App.loadContract();
        await App.render();
    },

    // https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
    loadWeb3: async () => {

        window.addEventListener('load', async () => {
            // Modern dapp browsers...
            if (window.ethereum) {
                window.web3 = new Web3(ethereum);
                try {
                    // Request account access if needed
                    await ethereum.enable();
                    // Acccounts now exposed
                    web3.eth.sendTransaction({/* ... */});
                } catch (error) {
                    // User denied account access...
                }
            }
            // Legacy dapp browsers...
            else if (window.web3) {
                window.web3 = new Web3(web3.currentProvider);
                // Acccounts always exposed
                web3.eth.sendTransaction({/* ... */});
            }
            // Non-dapp browsers...
            else {
                console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
            }
        });
    },

    loadAccount: async () => {
        const account = await ethereum.request({ method: 'eth_requestAccounts' });
        App.account = account[0];
    },

    loadContract: async () => {
        const todoList = await $.getJSON('TodoList.json');
        App.contracts.TodoList = TruffleContract(todoList);
        App.contracts.TodoList.setProvider(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));
        App.todoList = await App.contracts.TodoList.deployed();
    },

    render: async () => {

        if (App.loading) {
            return;
        }

        App.setLoading(true);

        // render account
        $('#account').html(App.account);
        
        // render tasks
        await App.renderTasks();

        // update loading status
        App.setLoading(false);
    },

    renderTasks: async () => {
        // load total task count from the blockchain
        const taskCount = await App.todoList.taskCount();
        const $taskTemplate = $('.taskTemplate');
        // render out each task with a new task template
        for (var i = 1; i <= taskCount; ++i)
        {
            const task = await App.todoList.tasks(i);
            const taskId = task[0].toNumber();
            const taskContent = task[1];
            const taskCompleted = task[2];

            const $newTaskTemplate = $taskTemplate.clone();
            $newTaskTemplate.find('.content').html(taskContent);
            $newTaskTemplate.find('input')
                            .prop('name', taskId)
                            .prop('checked', taskCompleted)
                            .on('click', App.toggleCompleted);

            // put the task in the correct list
            if (taskCompleted)
            {
                $('#completedTaskList').append($newTaskTemplate);
            }
            else
            {
                $('#taskList').append($newTaskTemplate);
            }

            // show the task on page
            $newTaskTemplate.show();
        }
    },

    createTask: async () => {
        App.setLoading(true);
        const content = $('#newTask').val();
        await App.todoList.createTask(content, {from: App.account});
        window.location. reload();
    },

    toggleCompleted: async (e) => {
        App.setLoading(true);
        const taskId = e.target.name;
        await App.todoList.toggleCompleted(taskId, {from: App.account});
        window.location.reload();
    },

    setLoading: (boolean) => {
        App.loading = boolean;
        const loader = $('#loader');
        const content = $('#content');
        if (boolean) {
          loader.show();
          content.hide();
        } else {
          loader.hide();
          content.show();
        }
    },
    
}

$(()=> {
    $(window).load(() => {
        App.load();
    })
})