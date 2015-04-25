// TODO: Document.
client.skin = Object.create(driver, {
    container: {value: undefined, writable: true},
    panelPrimary: {value: undefined, writable: true},
    panelSecondary:  {value: undefined, writable: true},
    panelPrimaryContent:{value: undefined, writable: true},
    panelSecondaryContent: {value: undefined, writable: true},
    statusBar: {value: undefined, writable: true},
    setup: {value: function (configuration){
        /**
         *  This function configures the map to display game data. It is called
         *      as soon as the client loads, in client.drivers.gameplay.setup
         *      It creates all the necessary DOM infrastructure needed by later
         *      calls to this.display.
         *  It should not be called more than once.
         *  It does not return anything.
         **/
        this.statusBar = document.createElement('pre');
        this.panelPrimary = document.createElement('div');
        this.panelSecondary = document.createElement('div');
        this.statusBar.setAttribute('id', 'statusBar');
        this.panelPrimary.setAttribute('id', 'panelPrimary');
        this.panelSecondary.setAttribute('id', 'panelSecondary');
        this.panelPrimary.setAttribute('class', 'panel');
        this.panelSecondary.setAttribute('class', 'panel');
        this.container = document.getElementById(configuration.containerId);
        this.container.tabIndex = 1;
        this.container.focus();
        this.container.appendChild(this.statusBar);
        this.container.appendChild(this.panelPrimary);
        this.container.appendChild(this.panelSecondary);
        this.updateStatus('Status Display');
    }},
    registerPanel: {value: function (newElement, whichPanel){
        var parentPanel;
        var oldElement;
        if(!whichPanel){
            parentPanel = this.panelPrimary;
            oldElement = this.panelPrimaryContent;
            this.panelPrimaryContent = newElement;
        } else{
            parentPanel = this.panelSecondary;
            oldElement = this.panelSecondaryContent;
            this.panelSecondaryContent = newElement;
        }
        if(oldElement){
            parentPanel.replaceChild(newElement, oldElement);
        } else{
            parentPanel.appendChild(newElement);
        }
    }},
    cancelPanel: {value: function (newElement, whichPanel){
        if(!whichPanel){
            this.panelPrimary.removeChild(this.panelPrimaryContent);
            this.panelPrimaryContent = undefined;
        } else{
            this.panelSecondary.removeChild(this.panelSecondaryContent);
            this.panelSecondaryContent = undefined;
        }
    }},
    updateStatus: {value: function (statusText){
        this.statusBar.textContent = statusText;
    }}
});