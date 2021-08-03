class CommonQueue {
    queue = [];
    timeMakers = [];
    maxWaitingTime;
    constructor(props) {
        let maxWaitingTime = props?.maxWaitingTime;
        if(maxWaitingTime) {
            this.maxWaitingTime = maxWaitingTime;
        }
    }
    pushItem(item) {
        this.queue.push(item)
        this.timeMakers.push(Date.now())
    }
    deleteItem(item) {
        let index = this.queue.indexOf(item)
        if (index !== -1) {
            this.queue.splice(index, 1)
            this.timeMakers.splice(index, 1)
        }
    }
    getShootingItem() {
        const { queue } = this;
        this.timeMakers.shift()
        return queue.shift(); 
    }
    getLen() {
        return this.queue.length;
    }
    checkQueue() {
        if(this.maxWaitingTime) {
            for(let i = 0; i < this.timeMakers.length ; i++) {
                const now = Date.now();
                if(now - this.timeMakers[i] >= this.maxWaitingTime) {
                    let itemPlace = this.queue.splice(i ,1);
                    this.timeMakers.splice(i ,1);
                    return itemPlace[0]
                }
            }
        }
        return undefined;
    }
}


export default CommonQueue;