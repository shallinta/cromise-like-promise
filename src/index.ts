document.getElementById("app").innerHTML = `
<h1>My promise-like Cromise</h1>
<div id="results"></div>
`;

const isFunction = foo => foo && typeof foo === "function";

const results = [];

const originLog = console.log;

console.log = str => {
  results.push(str);
  originLog(str);
};

const PENDING = "PENDING";
const FULFILLED = "FULFILLED";
const REJECTED = "REJECTED";

class Cromise {
  status = PENDING;
  result = null;
  resolve = null;
  reject = null;

  constructor(callback) {
    callback(this.onFulfilled.bind(this), this.onReject.bind(this));
  }

  onFulfilled(value) {
    if (this.status === PENDING) {
      this.result = value;
      this.status = FULFILLED;
      if (isFunction(this.resolve)) {
        queueMicrotask(() => {
          this.result = this.resolve(value);
          this.resolve = null;
        });
      }
    }
  }

  onReject(value) {
    if (this.status === PENDING) {
      this.result = value;
      this.status = REJECTED;
      if (isFunction(this.reject)) {
        queueMicrotask(() => {
          this.result = this.reject(value);
          this.reject = null;
        });
      }
    }
  }

  then(onResolve, onReject?) {
    switch (this.status) {
      case PENDING:
        if (isFunction(onResolve)) {
          this.resolve = onResolve;
        }
        if (isFunction(onReject)) {
          this.reject = onReject;
        }
        return this;
      case FULFILLED:
        let fulfilledResult;
        try {
          queueMicrotask(() => {
            fulfilledResult = onResolve(this.result);
          });
        } catch (err) {
          return new Cromise((_, reject) => {
            queueMicrotask(() => {
              reject(err);
            });
          });
        }
        return new Cromise(resolve => {
          queueMicrotask(() => {
            resolve(fulfilledResult);
          });
        });
      case REJECTED:
        let rejectedResult;
        try {
          queueMicrotask(() => {
            rejectedResult = onReject(this.result);
          });
        } catch (err) {
          rejectedResult = err;
        }
        return new Cromise((_, reject) => {
          queueMicrotask(() => {
            reject(rejectedResult);
          });
        });
      default:
    }
    return;
  }
}

console.log(" === 1 === ");
setTimeout(() => {
  console.log(" --- 1 --- setTimeout --- ");
}, 0);
queueMicrotask(() => {
  console.log(" --- 1 --- microtask --- ");
});
const c = new Cromise((resolve, reject) => {
  console.log(" === promise start === ");
  setTimeout(() => {
    console.log(" --- promise setTimeout --- ");
    resolve("hello");
  }, 0);
  // setTimeout(() => {
  //   console.log("2 seconds later'");
  //   resolve("hiya");
  // }, 2000);
  // resolve("hiya");
});
console.log(" === 2 === ");
setTimeout(() => {
  console.log(" --- 2 --- setTimeout --- ");
}, 0);
queueMicrotask(() => {
  console.log(" --- 2 --- microtask --- ");
});
const c2 = c.then(result => {
  console.log(" --- promise then result = '" + result + "' --- ");
  // console.log(result + ", world");
  // console.log(c, c2, c === c2);
  // return "xxx";
});
console.log(" === 3 === ");
// const c3 = c2.then(result => {
//   console.log(result);
//   // console.log(c2, c3);
// });

// console.log(c, c2, c === c2);

setTimeout(() => {
  const resultsList = results.map(str => `<li>${str}</li>`);
  document.getElementById("results").innerHTML = `
    <ul>
      ${resultsList.join("")}
    </ul>
  `;
}, 1000);
