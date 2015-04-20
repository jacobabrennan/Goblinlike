// TODO: Document.
var driver = {
    currentFocus: undefined,
    focus: function (newFocus){
        // TODO: Document.
        if(this.currentFocus == newFocus){
            return;
        }
        if(this.currentFocus){
            this.blur();
        }
        this.currentFocus = newFocus;
        if(this.currentFocus && this.currentFocus.focused){
            this.currentFocus.focused();
        }
    },
    blur: function (){
        // TODO: Document.
        if(this.currentFocus && this.currentFocus.blurred){
            this.currentFocus.blurred();
        }
        this.currentFocus = undefined;
    },
    focused: function (){
        // TODO: Document.
        },
    blurred: function (){
        // TODO: Document.
        },
    command: function (which, options){
        // TODO: Document.
        if(!(this.currentFocus && this.currentFocus.command)){ return false;}
        return this.currentFocus.command(which, options);
    },
    display: function (){
        // TODO: Document.
        if(!(this.currentFocus && this.currentFocus.display)){ return false;}
        return this.currentFocus.display.apply(this.currentFocus, arguments);
    }
};