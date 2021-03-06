import { createPromiseReturn as pms } from './util'
import CommonQueue from './CommonQueue'
import { WORK_PRIORITY } from './constants'

class centerSchedule {
    lowPriorityList = [];
    maxWaitingTime;
    threshold = 5;
    _isFetching = false;
    constructor(props) {
        const { lowPriority, maxWaitingTime, threshold, adapter } = props;
        if(lowPriority) {
            this.addLowPriorityList(lowPriority)
        }
        this.maxWaitingTime = maxWaitingTime;
        this.adapter = adapter;
        this.threshold = threshold || 5;
        this.lowQueue = new CommonQueue({maxWaitingTime});
        this.normalQueue = new CommonQueue();
        this.fetchingQueue = new CommonQueue();
    }
    addLowPriorityList(rules) {
        if (!Array.isArray(rules)) {
            this.lowPriorityList = [rules]
        } else {
            for (let rule of rules) {
                !this.lowPriorityList.includes(rule) && this.lowPriorityList.push(rule)
            }
        }
    }
    checkPriority(url) {
        return this.lowPriorityList.some(item => {
            return item instanceof RegExp ? item.test(url) : url.includes(item);
        })
    }
    request(requestConfig, centerConfig = {}) {
        let { priority } = centerConfig;
        if(!priority) {
            priority = this.checkPriority(requestConfig.url) ?  WORK_PRIORITY.LOW :  WORK_PRIORITY.NORMAL;
        }
        const work = {
            request: requestConfig,
            priority
        }
        this.insertWork(work);
        this.tryFetch();
    }
    insertWork(work) {
        switch (work.priority) {
            case WORK_PRIORITY.NORMAL:
                this.normalQueue.pushItem(work)
                break
            case WORK_PRIORITY.LOW:
                this.lowQueue.pushItem(work)
                break
            default:
                this.normalQueue.pushItem(work)
                break
        }
    }
    tryFetch() {
       if(this._isFetching) return;
       this._isFetching = true; 
       setTimeout(() => {
            this.startFetch()
       })
    }
    startFetch() {
        this.clearList(this.normalQueue, 'normal')
        this.clearList(this.lowQueue, 'low')
        this._isFetching = false;
    }
    clearList(list, type) {
        const fetchingNum = this.fetchingQueue.getLen();
        while (fetchingNum < this.threshold && list.getLen()) {
            let work;
            if(type === 'normal' && this.maxWaitingTime) {
                work =  this.lowQueue.checkQueue() || list.getShootingItem();
            } else {
                work = list.getShootingItem();
            }
            
            this.fetchingQueue.pushItem(work)
            this.run(work)
        }
    }  

    delWorkQueue (work) {
        this.fetchingQueue.deleteItem(work)
    }

    requestComplete(work) {
        this.delWorkQueue(work);
        this.startFetch()
    }
    // ??????wx.request??????
    make() {
        Object.defineProperty(wx, 'request', { value: this.request.bind(this) });
    }
    run(work) {
        const { resolve, reject } = pms();
        this.adapter(work.request).then((res) => {
            // ????????????????????????????????????
            this.requestComplete(work)
            resolve(res)
          }, (err) => {
            this.requestComplete(work)
            reject(err)
          })
    }
}

 /**
   * ?????????????????????????????????????????????????????????
   * @param config ?????????
   */
export function useRequestQueue(config) {
    const queueRequest = new centerSchedule(config);
    queueRequest.make();
    return queueRequest;
}

export default centerSchedule;