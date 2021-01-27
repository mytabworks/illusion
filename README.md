# illusion
illusion for javascript classes

```js
    import Illusion from 'illusion'

    const Fruit = Illusion(class {

        static sattr = {
            basket: 5
        }

        attributes = {
            banana: 2,
            apple: 5
        }

        __get(name) {
            return this.attributes[name]
        }

        __set(name, value) {
            this.attributes[name] = value
        }

        __isset(name) {
            return name in this.attributes
        }

        __unset(name) {
            delete this.attributes[name]
        }

        __iterator() {
            return this.attributes
        }

        static __getStatic(name) {
            return this.sattr[name]
        }

        static __setStatic(name, value) {
            this.sattr[name] = value
        }

    })

    console.log(Fruit.basket) // 5

    Fruit.basket = 10
    console.log(Fruit.basket) // 10

    const fruits = new Fruit()

    console.log(fruits.banana) // 2

    fruits.banana = 10
    console.log(fruits.banana) // 10

    console.log('banana' in fruits) // true

    delete fruits.banana
    console.log('banana' in fruits) // false

    console.log(fruits.banana) // undifined

    for(let fruit of fruits) {
        console.log(fruits) // { key: 'apple': value: 2 }
    }
    // iterator will depends on what your returned
    // if you return object the format will be at the above
    // but if the return is array then it will iterate each
```

in typescript:
```js
    import Illusion from '../dist/index'
    
    interface FruitType {
        new (): {
            banana: number,
            apple: number,
            [Symbol.iterator](): { next(): { value: { key: string, value: any} } }
        },
        basket: number,
    }

    const Fruit = Illusion<FruitType>(class {
        static sattr = {
            basket: 5,
        };

        attributes = {
            banana: 2,
            apple: 5,
        };

        __get(name: string) {
            return this.attributes[name];
        }

        __set(name: string, value: number) {
            this.attributes[name] = value;
        }

        __isset(name: string) {
            return name in this.attributes;
        }

        __unset(name: string) {
            delete this.attributes[name];
        }

        __iterator() {
            return this.attributes;
        }

        static __getStatic(name) {
            return this.sattr[name];
        }

        static __setStatic(name, value) {
            this.sattr[name] = value;
        }
    }
    );

    console.log(Fruit.basket); // 5

    Fruit.basket = 10;
    console.log(Fruit.basket, 'basket'); // 10

    const fruits = new Fruit();

    console.log(fruits.banana); // 2

    fruits.banana = 10;
    console.log(fruits.banana); // 10

    console.log("banana" in fruits); // true

    delete fruits.banana;
    console.log("banana" in fruits); // false

    console.log(fruits.banana); // undifined

    for (let fruit of fruits) {
    console.log(fruit); // { key: 'apple': value: 2 }
    }
```