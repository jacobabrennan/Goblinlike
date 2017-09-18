

/*===========================================================================
 *
 *  Priority Queue, ported from Theodis.priorityQueue as found on BYOND.com
 *  The priorityQueue is a sorted list ordered by a comparison function. The
 *      comparison function must be provided as the single argument to the
 *      queue's constructor. It must take two arguments, A and B, and return:
 *          A positive number if B is to be sorted higher than A,
 *          A negative number if A is to be sorted higher than B,
 *          Zero if A and B have the same sort value.
 *  The priorityQueue is a prototype, and must be instantiated and
 *      constructed before use.
 *      
 *===========================================================================*/

var priorityQueue = {
	leaves: undefined,
	compare: undefined,
	constructor: function (compare){
        // Generic constructor function. Must be called before use.
		this.leaves = [];
		this.compare = compare;
		return this;
	},
	isEmpty: function (){
        // Returns true if there are no enqueued values. False otherwise.
		return !(this.leaves.length);
	},
	enqueue: function (aThing){
        // Adds aThing to the queue in it's proper place, as ordered by to the
        //     compare function.
        // Does not return anything.
		var index1;
		var index2;
		this.leaves.push(aThing);
		index1 = this.leaves.length-1;
		index2 = Math.floor((index1+1) / 2) - 1;
		while(index1 > 0 && this.compare(this.leaves[index2],this.leaves[index1]) > 0){
			var value1 = this.leaves[index1];
			var value2 = this.leaves[index2];
			this.leaves[index1] = value2;
			this.leaves[index2] = value1;
			index1 = index2;
			index2 = Math.floor((index1+1) / 2) - 1;
		}
	},
	dequeue: function (){
        // Returns the 1st item in the queue as sorted by the compare function.
		if(!this.leaves.length){ return undefined;}
		var result = this.leaves[0];
		this.remove(0);
		return result;
	},
	remove: function (index){
        // Removes the value indexed by index while maintaining queue sorting
        //     as ordered by the compare function.
        // Does not return anything.
		if(index >= this.leaves.length){ return;}
		var indexedByI = this.leaves[index];
		var lastItem = this.leaves[this.leaves.length-1];
		this.leaves[index] = lastItem;
		this.leaves[this.leaves.length-1] = indexedByI;
		this.leaves.pop();
		if(index < this.leaves.length-1){
			this._fix(index);
		}
	},
	_fix: function (index){
        // Maintains sorting of the list, as ordered by the compare function.
        // TODO: Document the magic!
		var child = (index+1)*2;
		var item = this.leaves[index];
		while(child <= this.leaves.length){
			if(child + 1 <= this.leaves.length && this.compare(this.leaves[child-1],this.leaves[child]) > 0){
				child++;
			}
			if(this.compare(item, this.leaves[child-1]) > 0){
				this.leaves[index] = this.leaves[child-1];
				index = child-1;
			} else{
				break;
			}
			child = (index+1)*2;
		}
		this.leaves[index] = item;
	},
	list: function (){
        // Returns an ordered list of all enqueued values.
		var ret = [];
		var copy = this.leaves.slice();
		while(!this.isEmpty()){
			ret.push(this.dequeue());
		}
		this.leaves = copy;
		return ret;
	},
	removeItem: function (aThing){
        // Removes aThing from the queue.
        // Does not return anthing.
		var index = this.leaves.indexOf(aThing);
		if(index !== -1){ this.remove(index);}
	},
    contains: function (aThing){
        // Returns true if aThing is enqueued. False if it is not.
        return (this.leaves.indexOf(aThing) !== -1);
    }
};