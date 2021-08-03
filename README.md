### 弱网环境下的网络调度方案

最近部门对小程序进行了一次重大的重构，也对平时的性能瓶颈进行了一次复盘。在我们接近完美的办公环境下（光纤网络，最新的设备），我们的小程序几乎能达到秒开的级别，然而在下沉市场的场景下，用户的使用场景就可能超出我们的想象，经常打开速度达到了10秒以上。在这种场景下，如何优化成为了我们思考的命题。如何在行走在云端的我们和在地上的用户达成一致，变成了我们所需努力的方向。

想象中的速度

<img src="https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a79d2fea5f11494fb737dec5c1d7de5d~tplv-k3u1fbpfcp-watermark.image" width="40%">

现实中

<img src="https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/aeb9b347861c46f09aea06a6644f0350~tplv-k3u1fbpfcp-watermark.image" width="40%">

事实上我们将面对信号不好，网速不行的落网环境下，网络资源就会发生拥堵抢跑的现象。如何保证我们的业务代码不被低优先级的请求阻塞，而微信小程序wx.request最大并发数量是10个请求，在这样一个场景下又改如何处理呢

<img src="https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e57eae5f95b943fe8b62b78539488ee0~tplv-k3u1fbpfcp-watermark.image" width="40%">

（以下方案是基于项目的方案抽离，项目中并未使用此库）在此设计一个优先级调度中心，以下为具体实现架构

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/28736be1f5934831bbe983a5b22d20a6~tplv-k3u1fbpfcp-watermark.image)

我们将请求放在一个centerSchedule中进行调度，将任务的优先级，分成lowQueue(低优先)和normalQueue(正常)，同时维护一个正在请求的队列fetchingQueue。在请求的过程中先依次清除normalQueue中的队列数据，然后再清理低优先队列中的数据。

```
npm install easy-schedule -S
```


```js
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
}
```

如图所示，初识化队列的时候，采用装饰器模式，将请求方法放入adapter中。并将响应优先级的参数带入初始化


| 参数  | 值 | 默认 |
| ---  | --- | --- |
|threshold  | 阀值（同时请求数量）  | 5 |
| maxWaitingTime | 最长等待时间（低优先阻塞过久的时候释放） | -  |
|lowPriority | 低优先匹配规则 |  字符串/正则表达式 |



举个🌰
```js
import schedule from  'easy-schedule'

function fetch(value) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log(value);
            resolve(value)
        }, 1000)
    })
}

const center = new schedule({
    adapter: fetch,
    lowPriority: 'low',
    maxWaitingTime: 200
})


center.request({
    url: 'first'
})
center.request({
    url: 'low',
    
})
center.request({
    url: 'last',
    priority: 'low'
})

```
