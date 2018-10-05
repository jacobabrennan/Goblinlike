

//== Driver - TODO: Document ===================================================

const driver = {
    currentFocus: undefined,
    focus(newFocus){
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
    blur(){
        // TODO: Document.
        if(this.currentFocus && this.currentFocus.blurred){
            this.currentFocus.blurred();
        }
        this.currentFocus = undefined;
    },
    focused(){
        // TODO: Document.
        },
    blurred(){
        // TODO: Document.
        },
    command(which, options){
        // TODO: Document.
        if(!(this.currentFocus && this.currentFocus.command)){ return false;}
        return this.currentFocus.command(which, options);
    },
    display(){
        // TODO: Document.
        if(!(this.currentFocus && this.currentFocus.display)){ return false;}
        return this.currentFocus.display.apply(this.currentFocus, arguments);
    }
};
export default driver;